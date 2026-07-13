"""
Models for the Content Analytics Module.

ContentItem            -> one row per piece of content (video/post/reel/tweet),
                          normalized across platforms so the dashboard can
                          treat them the same way regardless of source
ContentMetricSnapshot  -> a metrics reading for a ContentItem at a point in
                          time. Storing a new row on every sync (instead of
                          overwriting) is what makes "Performance trends"
                          possible later.
"""

import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID

from .database import Base


class ContentItem(Base):
    __tablename__ = "content_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    social_account_id = Column(UUID(as_uuid=True), ForeignKey("social_accounts.id"), nullable=False, index=True)

    # Kept as a plain string (not tied to SocialPlatform enum) so LinkedIn/X
    # can be added later without a schema migration.
    platform = Column(String(50), nullable=False)  # "youtube" | "instagram" | "facebook" | "linkedin" | "twitter"
    content_type = Column(String(50), nullable=True)  # video / reel / image / post / tweet

    platform_content_id = Column(String(255), nullable=False)  # video id / media id / post id / tweet id
    title = Column(Text, nullable=True)  # video title / caption / post text / tweet text
    permalink = Column(String(500), nullable=True)
    published_at = Column(DateTime, nullable=True)

    first_synced_at = Column(DateTime, default=datetime.utcnow)
    last_synced_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ContentMetricSnapshot(Base):
    __tablename__ = "content_metric_snapshots"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    content_item_id = Column(UUID(as_uuid=True), ForeignKey("content_items.id"), nullable=False, index=True)

    views = Column(Integer, default=0)
    likes = Column(Integer, default=0)
    comments = Column(Integer, default=0)
    shares = Column(Integer, default=0)
    saves = Column(Integer, default=0)
    watch_time_seconds = Column(Integer, default=0)
    reach = Column(Integer, default=0)
    impressions = Column(Integer, default=0)
    engagement_rate = Column(Float, default=0.0)  # percentage, computed at sync time

    recorded_at = Column(DateTime, default=datetime.utcnow, index=True)
