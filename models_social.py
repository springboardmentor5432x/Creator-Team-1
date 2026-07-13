"""
Models for the Social Media Integration module.

SocialAccount   -> one row per (user, platform) connection, holds tokens
SocialSnapshot  -> cached analytics payloads so the dashboard doesn't have
                   to call external APIs on every page load
"""

import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, JSON, String, Text
from sqlalchemy.dialects.postgresql import UUID

from .database import Base


class SocialPlatform(str, enum.Enum):
    YOUTUBE = "youtube"
    INSTAGRAM = "instagram"
    FACEBOOK = "facebook"


class SocialAccount(Base):
    """A connected third-party account. Tokens are what let our backend
    call YouTube / Instagram / Facebook APIs on the user's behalf."""

    __tablename__ = "social_accounts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    platform = Column(Enum(SocialPlatform), nullable=False)

    # channel id (YouTube) / IG business account id (Instagram) / page id (Facebook)
    platform_account_id = Column(String(255), nullable=False)
    account_name = Column(String(255), nullable=True)  # channel title / IG username / page name

    access_token = Column(Text, nullable=False)
    refresh_token = Column(Text, nullable=True)  # Google issues this; Meta long-lived tokens don't need one
    token_expires_at = Column(DateTime, nullable=True)

    # Meta-specific: Instagram Graph API calls must use the *Page* access token,
    # and every IG Business Account is reached via its linked Facebook Page.
    page_access_token = Column(Text, nullable=True)
    linked_page_id = Column(String(255), nullable=True)

    connected_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)


class SocialSnapshot(Base):
    """Historical cache of a fetched dashboard payload, so growth charts and
    comparisons can be built later without re-hitting external APIs."""

    __tablename__ = "social_snapshots"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    social_account_id = Column(UUID(as_uuid=True), ForeignKey("social_accounts.id"), nullable=False, index=True)
    snapshot_type = Column(String(50), nullable=False)  # e.g. "dashboard"
    data = Column(JSON, nullable=False)
    fetched_at = Column(DateTime, default=datetime.utcnow)
