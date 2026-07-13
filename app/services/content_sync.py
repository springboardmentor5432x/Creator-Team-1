"""
Pulls posts/videos and their metrics from each connected platform and
stores them as ContentItem + ContentMetricSnapshot rows. This is the
"Fetch Posts -> Fetch Analytics -> Store Analytics" part of the guide's
workflow, made platform-agnostic.
"""

from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy.orm import Session

from .. import models_content
from . import meta_service, youtube_service


def _parse_dt(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except (ValueError, TypeError):
        return None


def _upsert_content_item(
    db: Session,
    user_id,
    social_account,
    platform: str,
    content_type: str,
    platform_content_id: str,
    title: Optional[str],
    permalink: Optional[str],
    published_at: Optional[datetime],
) -> models_content.ContentItem:
    item = (
        db.query(models_content.ContentItem)
        .filter(
            models_content.ContentItem.social_account_id == social_account.id,
            models_content.ContentItem.platform_content_id == platform_content_id,
        )
        .first()
    )
    if item:
        item.title = title
        item.permalink = permalink
        item.last_synced_at = datetime.utcnow()
    else:
        item = models_content.ContentItem(
            user_id=user_id,
            social_account_id=social_account.id,
            platform=platform,
            content_type=content_type,
            platform_content_id=platform_content_id,
            title=title,
            permalink=permalink,
            published_at=published_at,
        )
        db.add(item)
    db.flush()
    return item


def _record_metrics(db: Session, content_item_id, **metrics) -> models_content.ContentMetricSnapshot:
    likes = int(metrics.get("likes") or 0)
    comments = int(metrics.get("comments") or 0)
    shares = int(metrics.get("shares") or 0)
    saves = int(metrics.get("saves") or 0)
    reach = int(metrics.get("reach") or 0)
    views = int(metrics.get("views") or 0)

    # Engagement Rate = total engagement actions / reach (or views if reach
    # isn't available, e.g. YouTube) — expressed as a percentage.
    denominator = reach or views or 1
    engagement_rate = round((likes + comments + shares + saves) / denominator * 100, 2)

    snapshot = models_content.ContentMetricSnapshot(
        content_item_id=content_item_id,
        views=views,
        likes=likes,
        comments=comments,
        shares=shares,
        saves=saves,
        watch_time_seconds=int(metrics.get("watch_time_seconds") or 0),
        reach=reach,
        impressions=int(metrics.get("impressions") or 0),
        engagement_rate=engagement_rate,
    )
    db.add(snapshot)
    return snapshot


def sync_youtube_content(db: Session, user_id, account) -> int:
    videos = youtube_service.get_channel_videos(account.access_token, account.platform_account_id, max_results=15)
    video_ids = [v["id"]["videoId"] for v in videos if v.get("id", {}).get("videoId")]
    stats_items = youtube_service.get_video_statistics(account.access_token, video_ids)

    # Watch time is only available via the separate YouTube Analytics API.
    # It's optional — some channels/tokens don't have Analytics scope
    # approved yet, so a failure here shouldn't break the whole sync.
    watch_time_by_video = {}
    try:
        end_date = datetime.utcnow().date().isoformat()
        start_date = (datetime.utcnow() - timedelta(days=365)).date().isoformat()
        watch_time_by_video = youtube_service.get_video_watch_time(
            account.access_token, video_ids, start_date, end_date
        )
    except Exception:
        pass

    for v in stats_items:
        stats = v.get("statistics", {})
        snippet = v.get("snippet", {})
        item = _upsert_content_item(
            db,
            user_id,
            account,
            platform="youtube",
            content_type="video",
            platform_content_id=v["id"],
            title=snippet.get("title"),
            permalink=f"https://youtube.com/watch?v={v['id']}",
            published_at=_parse_dt(snippet.get("publishedAt")),
        )
        watch_time = watch_time_by_video.get(v["id"], {})
        _record_metrics(
            db,
            item.id,
            views=stats.get("viewCount"),
            likes=stats.get("likeCount"),
            comments=stats.get("commentCount"),
            watch_time_seconds=int(watch_time.get("estimated_minutes_watched", 0) * 60),
        )

    db.commit()
    return len(stats_items)


def sync_instagram_content(db: Session, user_id, account) -> int:
    media = meta_service.get_instagram_media(account.platform_account_id, account.page_access_token, limit=15)

    for m in media:
        item = _upsert_content_item(
            db,
            user_id,
            account,
            platform="instagram",
            content_type=(m.get("media_type") or "post").lower(),
            platform_content_id=m["id"],
            title=m.get("caption"),
            permalink=m.get("permalink"),
            published_at=_parse_dt(m.get("timestamp")),
        )
        try:
            insights = meta_service.get_media_insights(m["id"], account.page_access_token)
            metrics = {i["name"]: i["values"][0]["value"] for i in insights.get("data", [])}
        except Exception:
            # Some media types (e.g. certain Reels/Stories) don't support every metric
            metrics = {}

        _record_metrics(
            db,
            item.id,
            reach=metrics.get("reach"),
            likes=metrics.get("likes"),
            comments=metrics.get("comments"),
            saves=metrics.get("saved"),
            shares=metrics.get("shares"),
            impressions=metrics.get("impressions"),
        )

    db.commit()
    return len(media)


def sync_facebook_content(db: Session, user_id, account) -> int:
    posts = meta_service.get_facebook_posts(account.platform_account_id, account.page_access_token, limit=15)

    for p in posts:
        item = _upsert_content_item(
            db,
            user_id,
            account,
            platform="facebook",
            content_type="post",
            platform_content_id=p["id"],
            title=p.get("message"),
            permalink=p.get("permalink_url"),
            published_at=_parse_dt(p.get("created_time")),
        )

        likes = p.get("reactions", {}).get("summary", {}).get("total_count", 0)
        comments = p.get("comments", {}).get("summary", {}).get("total_count", 0)
        shares = p.get("shares", {}).get("count", 0)

        reach = 0
        impressions = 0
        try:
            insights = meta_service.get_post_insights(p["id"], account.page_access_token)
            values = {i["name"]: i["values"][0]["value"] for i in insights.get("data", [])}
            impressions = values.get("post_impressions", 0)
            reach = values.get("post_impressions_unique", 0)
        except Exception:
            # Insights can be unavailable for older posts or certain post types
            pass

        _record_metrics(
            db,
            item.id,
            likes=likes,
            comments=comments,
            shares=shares,
            reach=reach,
            impressions=impressions,
        )

    db.commit()
    return len(posts)
