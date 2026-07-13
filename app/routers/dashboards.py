"""
Dashboard endpoints: React calls these, never the external APIs directly.
Each endpoint reads the stored Access Token, calls the relevant platform
API(s), combines the responses into one clean payload, caches a snapshot,
and returns the result — matching the "Overall Workflow" in the guide.
"""

from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db
from ..dependencies import get_current_user
from ..models_social import SocialAccount, SocialPlatform, SocialSnapshot
from ..services import meta_service, youtube_service

router = APIRouter(tags=["Social Dashboards"])


def _get_account(db: Session, user_id, platform: SocialPlatform) -> SocialAccount:
    account = (
        db.query(SocialAccount)
        .filter(
            SocialAccount.user_id == user_id,
            SocialAccount.platform == platform,
            SocialAccount.is_active == True,  # noqa: E712
        )
        .first()
    )
    if not account:
        raise HTTPException(
            status_code=404,
            detail=f"No connected {platform.value} account. Connect it first via /auth/{platform.value}/login.",
        )
    return account


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


def _save_snapshot(db: Session, social_account_id, data: dict) -> None:
    db.add(SocialSnapshot(social_account_id=social_account_id, snapshot_type="dashboard", data=data))
    db.commit()


@router.get("/youtube/analytics")
def youtube_analytics(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Channel-wide daily trend: views, watch time, average view duration.
    This is the YouTube Analytics API (separate from the Data API used by
    /youtube/dashboard) — it's the only source for watch time."""
    account = _get_account(db, current_user.id, SocialPlatform.YOUTUBE)
    access_token = _refresh_youtube_token_if_needed(db, account)

    end_date = datetime.utcnow().date().isoformat()
    start_date = (datetime.utcnow() - timedelta(days=days)).date().isoformat()

    try:
        raw = youtube_service.get_channel_analytics(access_token, start_date, end_date)
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"YouTube Analytics API request failed: {exc}",
        )

    headers_list = [h["name"] for h in raw.get("columnHeaders", [])]
    rows = [dict(zip(headers_list, row)) for row in raw.get("rows", [])]

    return {"channel_name": account.account_name, "start_date": start_date, "end_date": end_date, "daily": rows}


@router.get("/youtube/dashboard")
def youtube_dashboard(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    account = _get_account(db, current_user.id, SocialPlatform.YOUTUBE)
    access_token = _refresh_youtube_token_if_needed(db, account)

    channel_info = youtube_service.get_channel_info(access_token)
    items = channel_info.get("items", [])
    if not items:
        raise HTTPException(status_code=404, detail="Channel data unavailable")
    stats = items[0]["statistics"]

    videos = youtube_service.get_channel_videos(access_token, account.platform_account_id, max_results=10)
    video_ids = [v["id"]["videoId"] for v in videos if v.get("id", {}).get("videoId")]
    video_stats = youtube_service.get_video_statistics(access_token, video_ids)

    dashboard = {
        "channel_name": account.account_name,
        "subscriber_count": stats.get("subscriberCount"),
        "total_views": stats.get("viewCount"),
        "video_count": stats.get("videoCount"),
        "recent_videos": [
            {
                "video_id": v["id"],
                "title": v["snippet"]["title"],
                "views": v["statistics"].get("viewCount"),
                "likes": v["statistics"].get("likeCount"),
                "comments": v["statistics"].get("commentCount"),
            }
            for v in video_stats
        ],
    }
    _save_snapshot(db, account.id, dashboard)
    return dashboard


@router.get("/instagram/dashboard")
def instagram_dashboard(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    account = _get_account(db, current_user.id, SocialPlatform.INSTAGRAM)

    profile = meta_service.get_instagram_profile(account.platform_account_id, account.page_access_token)
    media = meta_service.get_instagram_media(account.platform_account_id, account.page_access_token, limit=10)

    recent_posts = []
    for m in media[:5]:
        try:
            insights = meta_service.get_media_insights(m["id"], account.page_access_token)
            metrics = {i["name"]: i["values"][0]["value"] for i in insights.get("data", [])}
        except Exception:
            metrics = {}  # some media types (e.g. certain reels) don't support all metrics
        recent_posts.append(
            {
                "media_id": m["id"],
                "caption": m.get("caption"),
                "media_type": m.get("media_type"),
                "permalink": m.get("permalink"),
                "timestamp": m.get("timestamp"),
                "metrics": metrics,
            }
        )

    dashboard = {
        "username": profile.get("username"),
        "followers_count": profile.get("followers_count"),
        "media_count": profile.get("media_count"),
        "recent_posts": recent_posts,
    }
    _save_snapshot(db, account.id, dashboard)
    return dashboard


@router.get("/facebook/dashboard")
def facebook_dashboard(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    account = _get_account(db, current_user.id, SocialPlatform.FACEBOOK)

    page = meta_service.get_facebook_page_details(account.platform_account_id, account.page_access_token)
    posts = meta_service.get_facebook_posts(account.platform_account_id, account.page_access_token, limit=10)
    try:
        insights = meta_service.get_facebook_page_insights(account.platform_account_id, account.page_access_token)
        insight_metrics = {i["name"]: i["values"][-1]["value"] for i in insights.get("data", [])}
    except Exception:
        insight_metrics = {}

    dashboard = {
        "page_name": page.get("name"),
        "followers_count": page.get("followers_count"),
        "fan_count": page.get("fan_count"),
        "insights": insight_metrics,
        "recent_posts": [
            {
                "post_id": p["id"],
                "message": p.get("message"),
                "created_time": p.get("created_time"),
                "permalink": p.get("permalink_url"),
            }
            for p in posts
        ],
    }
    _save_snapshot(db, account.id, dashboard)
    return dashboard
