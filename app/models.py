"""
SQLAlchemy ORM models for the User Management Module.

Tables:
- users              -> core account/auth data, shared by all roles
- creator_profiles    -> extra profile fields for Creator role
- agency_profiles     -> extra profile fields for Agency role
"""

import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from .database import Base


class UserRole(str, enum.Enum):
    CREATOR = "creator"
    AGENCY = "agency"
    MARKETING_TEAM = "marketing_team"
    ADMINISTRATOR = "administrator"


class User(Base):
    """Core account table. Every role (creator, agency, marketing team,
    administrator) is a row here; role-specific data lives in the linked
    profile tables."""

    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name = Column(String(150), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.CREATOR)

    is_active = Column(Boolean, default=True)          # account enabled/disabled
    is_verified = Column(Boolean, default=False)        # email verification status

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login_at = Column(DateTime, nullable=True)

    creator_profile = relationship(
        "CreatorProfile", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    agency_profile = relationship(
        "AgencyProfile", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )


class CreatorProfile(Base):
    """Profile fields specific to individual creators (YouTubers, streamers,
    Instagram creators, etc.)."""

    __tablename__ = "creator_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False)

    display_name = Column(String(150), nullable=True)
    bio = Column(Text, nullable=True)
    niche = Column(String(100), nullable=True)          # e.g. "Tech", "Beauty", "Gaming"
    primary_platform = Column(String(50), nullable=True)  # YouTube / Instagram / Twitch etc.
    profile_image_url = Column(String(500), nullable=True)
    website_url = Column(String(500), nullable=True)

    user = relationship("User", back_populates="creator_profile")


class AgencyProfile(Base):
    """Profile fields specific to influencer/agency accounts managing
    multiple creators."""

    __tablename__ = "agency_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False)

    agency_name = Column(String(150), nullable=False)
    website_url = Column(String(500), nullable=True)
    contact_phone = Column(String(30), nullable=True)
    managed_creator_count = Column(String(10), nullable=True)  # simple display field

    user = relationship("User", back_populates="agency_profile")
