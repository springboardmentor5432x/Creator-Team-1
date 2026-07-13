"""
Content Analytics Module.

(i)   Track content performance   -> POST /content/sync, GET /content/performance
(ii)  Engagement monitoring       -> GET /content/engagement
(iii) Content comparison          -> GET /content/compare
(iv)  Top-performing reports      -> GET /content/top-performing
(v)   Reach analysis              -> GET /content/reach
(vi)  Performance trends          -> GET /content/trends
"""

import csv
import io
import uuid
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db
from ..dependencies import get_current_user
from ..models_content import ContentItem, ContentMetricSnapshot
from ..models_social import SocialAccount, SocialPlatform
from ..services import content_sync, youtube_service

router = APIRouter(prefix="/content", tags=["Content Analytics"])

VALID_METRICS = {
    "views",
    "likes",
    "comments",
    "shares",
    "saves",
    "watch_time_seconds",
    "reach",
    "impressions",
    "engagement_rate",
}


# ---------- shared helpers ----------

def _refresh_youtube_token_if_needed(db: Session, account: SocialAccount) -> str:
    if account.token_expires_at and account.token_expires_at <= datetime.utcnow() + timedelta(minutes=2):
        if not account.refresh_token:
            raise HTTPException(
                status_code=401,
                detail="YouTube token expired and no refresh token is stored. Reconnect the account.",
            )
        token_data = youtube_service.refresh_access_token(account.refresh_token)
        account.access_token = token_data["access_token"]
        account.token_expires_at = datetime.utcnow() + timedelta(seconds=token_data.get("expires_in", 3600))
        db.commit()
    return account.access_token


def _user_content_query(db: Session, user_id, platform: Optional[str] = None):
    q = db.query(ContentItem).filter(ContentItem.user_id == user_id)
    if platform:
        q = q.filter(ContentItem.platform == platform)
    return q


def _latest_snapshots_map(db: Session, content_item_ids) -> dict:
    """One DB round-trip, then keep only the most recent snapshot per item
    (snapshots are already ordered newest-first)."""
    if not content_item_ids:
        return {}
    snapshots = (
        db.query(ContentMetricSnapshot)
        .filter(ContentMetricSnapshot.content_item_id.in_(content_item_ids))
        .order_by(ContentMetricSnapshot.recorded_at.desc())
        .all()
    )
    latest = {}
    for s in snapshots:
        if s.content_item_id not in latest:
            latest[s.content_item_id] = s
    return latest


def _snapshot_to_dict(snap: Optional[ContentMetricSnapshot]) -> Optional[dict]:
    if not snap:
        return None
    return {
        "views": snap.views,
        "likes": snap.likes,
        "comments": snap.comments,
        "shares": snap.shares,
        "saves": snap.saves,
        "watch_time_seconds": snap.watch_time_seconds,
        "reach": snap.reach,
        "impressions": snap.impressions,
        "engagement_rate": snap.engagement_rate,
    }


# ---------- sync ----------

@router.post("/sync")
def sync_content(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Pulls the latest posts/videos + metrics from every connected platform
    and stores them. Run this before viewing the dashboards below so the
    numbers are fresh."""
    accounts = (
        db.query(SocialAccount)
        .filter(SocialAccount.user_id == current_user.id, SocialAccount.is_active == True)  # noqa: E712
        .all()
    )
    if not accounts:
        raise HTTPException(status_code=404, detail="No connected social accounts. Connect one first.")

    synced = {}
    for account in accounts:
        if account.platform == SocialPlatform.YOUTUBE:
            account.access_token = _refresh_youtube_token_if_needed(db, account)
            synced["youtube"] = content_sync.sync_youtube_content(db, current_user.id, account)
        elif account.platform == SocialPlatform.INSTAGRAM:
            synced["instagram"] = content_sync.sync_instagram_content(db, current_user.id, account)
        elif account.platform == SocialPlatform.FACEBOOK:
            synced["facebook"] = content_sync.sync_facebook_content(db, current_user.id, account)

    return {"detail": "Content synced", "items_synced": synced}


# ---------- CSV export ----------

@router.get("/export/csv")
def export_content_csv(
    platform: Optional[str] = Query(None, description="Filter: youtube | instagram | facebook"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Exports the same data as /content/performance as a downloadable CSV
    — useful for reports handed to agencies/brands outside the dashboard."""
    items = _user_content_query(db, current_user.id, platform).all()
    latest = _latest_snapshots_map(db, [i.id for i in items])

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(
        [
            "content_id", "platform", "content_type", "title", "permalink", "published_at",
            "views", "likes", "comments", "shares", "saves",
            "watch_time_seconds", "reach", "impressions", "engagement_rate",
        ]
    )
    for item in items:
        snap = latest.get(item.id)
        writer.writerow(
            [
                item.id, item.platform, item.content_type, item.title, item.permalink, item.published_at,
                snap.views if snap else 0,
                snap.likes if snap else 0,
                snap.comments if snap else 0,
                snap.shares if snap else 0,
                snap.saves if snap else 0,
                snap.watch_time_seconds if snap else 0,
                snap.reach if snap else 0,
                snap.impressions if snap else 0,
                snap.engagement_rate if snap else 0,
            ]
        )

    buffer.seek(0)
    filename = f"creatoriq_content_report_{datetime.utcnow().date().isoformat()}.csv"
    return StreamingResponse(
        buffer,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ---------- (i) Track content performance ----------

@router.get("/performance")
def content_performance(
    platform: Optional[str] = Query(None, description="Filter: youtube | instagram | facebook"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    items = _user_content_query(db, current_user.id, platform).all()
    latest = _latest_snapshots_map(db, [i.id for i in items])

    results = [
        {
            "content_id": item.id,
            "platform": item.platform,
            "content_type": item.content_type,
            "title": item.title,
            "permalink": item.permalink,
            "published_at": item.published_at,
            "metrics": _snapshot_to_dict(latest.get(item.id)),
        }
        for item in items
    ]
    return {"count": len(results), "content": results}


# ---------- (ii) Engagement monitoring ----------

@router.get("/engagement")
def engagement_monitoring(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    items = _user_content_query(db, current_user.id).all()
    latest = _latest_snapshots_map(db, [i.id for i in items])

    total = {"likes": 0, "comments": 0, "shares": 0, "saves": 0, "views": 0, "reach": 0}
    by_platform: dict = {}

    for item in items:
        snap = latest.get(item.id)
        if not snap:
            continue
        for key in total:
            total[key] += getattr(snap, key)

        p = by_platform.setdefault(
            item.platform,
            {"likes": 0, "comments": 0, "shares": 0, "saves": 0, "content_count": 0, "_sum_engagement_rate": 0.0},
        )
        p["likes"] += snap.likes
        p["comments"] += snap.comments
        p["shares"] += snap.shares
        p["saves"] += snap.saves
        p["content_count"] += 1
        p["_sum_engagement_rate"] += snap.engagement_rate

    for p in by_platform.values():
        count = p["content_count"]
        p["avg_engagement_rate"] = round(p.pop("_sum_engagement_rate") / count, 2) if count else 0.0

    denominator = total["reach"] or total["views"] or 1
    overall_engagement_rate = round(
        (total["likes"] + total["comments"] + total["shares"] + total["saves"]) / denominator * 100, 2
    )

    return {
        "total_engagement": total,
        "overall_engagement_rate": overall_engagement_rate,
        "by_platform": by_platform,
    }


# ---------- (iii) Content comparison dashboard ----------

@router.get("/compare")
def compare_content(
    content_ids: str = Query(..., description="Comma-separated content_id values"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    try:
        ids = [uuid.UUID(x.strip()) for x in content_ids.split(",") if x.strip()]
    except ValueError:
        raise HTTPException(status_code=422, detail="content_ids must be comma-separated UUIDs")

    items = db.query(ContentItem).filter(ContentItem.id.in_(ids), ContentItem.user_id == current_user.id).all()
    if not items:
        raise HTTPException(status_code=404, detail="No matching content found")

    latest = _latest_snapshots_map(db, [i.id for i in items])
    return {
        "comparison": [
            {
                "content_id": item.id,
                "platform": item.platform,
                "title": item.title,
                "published_at": item.published_at,
                "metrics": _snapshot_to_dict(latest.get(item.id)),
            }
            for item in items
        ]
    }


# ---------- (iv) Top-performing content reports ----------

@router.get("/top-performing")
def top_performing_content(
    metric: str = Query("engagement_rate", description=f"One of: {sorted(VALID_METRICS)}"),
    limit: int = Query(5, ge=1, le=50),
    platform: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if metric not in VALID_METRICS:
        raise HTTPException(status_code=422, detail=f"metric must be one of {sorted(VALID_METRICS)}")

    items = _user_content_query(db, current_user.id, platform).all()
    latest = _latest_snapshots_map(db, [i.id for i in items])

    ranked = [(getattr(latest[item.id], metric), item, latest[item.id]) for item in items if item.id in latest]
    ranked.sort(key=lambda row: row[0], reverse=True)

    return {
        "metric": metric,
        "results": [
            {
                "content_id": item.id,
                "platform": item.platform,
                "title": item.title,
                "value": value,
                "metrics": _snapshot_to_dict(snap),
            }
            for value, item, snap in ranked[:limit]
        ],
    }


# ---------- (v) Reach analysis ----------

@router.get("/reach")
def reach_analysis(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    items = _user_content_query(db, current_user.id).all()
    latest = _latest_snapshots_map(db, [i.id for i in items])

    total_reach = 0
    by_platform: dict = {}
    top_reach = None  # (item, snap)

    for item in items:
        snap = latest.get(item.id)
        if not snap:
            continue
        total_reach += snap.reach
        by_platform[item.platform] = by_platform.get(item.platform, 0) + snap.reach
        if top_reach is None or snap.reach > top_reach[1].reach:
            top_reach = (item, snap)

    return {
        "total_reach": total_reach,
        "reach_by_platform": by_platform,
        "top_reach_content": (
            {
                "content_id": top_reach[0].id,
                "platform": top_reach[0].platform,
                "title": top_reach[0].title,
                "reach": top_reach[1].reach,
            }
            if top_reach
            else None
        ),
    }


# ---------- (vi) Performance trends ----------

@router.get("/trends")
def performance_trends(
    metric: str = Query("engagement_rate", description=f"One of: {sorted(VALID_METRICS)}"),
    content_id: Optional[str] = Query(None, description="Trend for one item; omit for account-wide daily totals"),
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if metric not in VALID_METRICS:
        raise HTTPException(status_code=422, detail=f"metric must be one of {sorted(VALID_METRICS)}")

    since = datetime.utcnow() - timedelta(days=days)

    if content_id:
        try:
            cid = uuid.UUID(content_id)
        except ValueError:
            raise HTTPException(status_code=422, detail="content_id must be a valid UUID")

        item = db.query(ContentItem).filter(ContentItem.id == cid, ContentItem.user_id == current_user.id).first()
        if not item:
            raise HTTPException(status_code=404, detail="Content not found")

        snapshots = (
            db.query(ContentMetricSnapshot)
            .filter(ContentMetricSnapshot.content_item_id == item.id, ContentMetricSnapshot.recorded_at >= since)
            .order_by(ContentMetricSnapshot.recorded_at)
            .all()
        )
        return {
            "scope": "single_content",
            "content_id": item.id,
            "metric": metric,
            "points": [{"date": s.recorded_at, "value": getattr(s, metric)} for s in snapshots],
        }

    # Account-wide: sum the metric per day across all synced content
    item_ids = [i.id for i in _user_content_query(db, current_user.id).all()]
    snapshots = (
        db.query(ContentMetricSnapshot)
        .filter(ContentMetricSnapshot.content_item_id.in_(item_ids), ContentMetricSnapshot.recorded_at >= since)
        .order_by(ContentMetricSnapshot.recorded_at)
        .all()
    )

    daily: dict = {}
    for s in snapshots:
        day = s.recorded_at.date().isoformat()
        daily[day] = daily.get(day, 0) + getattr(s, metric)

    return {
        "scope": "account_wide",
        "metric": metric,
        "points": [{"date": d, "value": v} for d, v in sorted(daily.items())],
    }
