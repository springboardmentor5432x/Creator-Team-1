"""
Pydantic schemas for the User Management Module.
Used for request validation and response serialization.
"""

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

from .models import UserRole


# ---------- Auth ----------

class UserRegister(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=150)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    role: UserRole

    # Extra fields depending on role (optional at registration, can be
    # completed later via account settings)
    agency_name: Optional[str] = None  # required if role == agency

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        if not any(c.isalpha() for c in v):
            raise ValueError("Password must contain at least one letter")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: UserRole
    user_id: uuid.UUID


class TokenPayload(BaseModel):
    sub: str  # user id
    role: str
    exp: int


# ---------- User / Account ----------

class UserOut(BaseModel):
    id: uuid.UUID
    full_name: str
    email: EmailStr
    role: UserRole
    is_active: bool
    is_verified: bool
    created_at: datetime
    last_login_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=150)
    email: Optional[EmailStr] = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=100)


class AccountStatusUpdate(BaseModel):
    """Admin-only: enable/disable a user account."""
    is_active: bool


# ---------- Creator Profile ----------

class CreatorProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    bio: Optional[str] = None
    niche: Optional[str] = None
    primary_platform: Optional[str] = None
    profile_image_url: Optional[str] = None
    website_url: Optional[str] = None


class CreatorProfileOut(CreatorProfileUpdate):
    id: uuid.UUID
    user_id: uuid.UUID

    class Config:
        from_attributes = True


# ---------- Agency Profile ----------

class AgencyProfileUpdate(BaseModel):
    agency_name: Optional[str] = None
    website_url: Optional[str] = None
    contact_phone: Optional[str] = None
    managed_creator_count: Optional[str] = None


class AgencyProfileOut(AgencyProfileUpdate):
    id: uuid.UUID
    user_id: uuid.UUID

    class Config:
        from_attributes = True
