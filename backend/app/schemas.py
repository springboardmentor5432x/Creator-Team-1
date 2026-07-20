from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from typing import List, Dict
# -------------------------
# User Management Schemas
# -------------------------

class RegisterRequest(BaseModel):
    full_name: str
    username: str
    email: str
    password: str
    role: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UpdateRequest(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    language: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    full_name: str
    username: str
    email: EmailStr
    role: str
    language: Optional[str] = "English"

    class Config:
        from_attributes = True


# -------------------------
# Content Analytics Schemas
# -------------------------

class ContentAnalyticsBase(BaseModel):
    platform: str
    content_id: str
    views: Optional[int] = 0
    likes: Optional[int] = 0
    comments: Optional[int] = 0
    shares: Optional[int] = 0
    saves: Optional[int] = 0
    watch_time: Optional[float] = 0.0
    reach: Optional[int] = 0
    engagement_rate: Optional[float] = 0.0
    timestamp: Optional[datetime] = None


class ContentAnalyticsRequest(ContentAnalyticsBase):
    user_id: int


class ContentAnalyticsResponse(ContentAnalyticsBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

from pydantic import BaseModel
from typing import List, Dict

class AgeGroup(BaseModel):
    group: str
    count: int

class Location(BaseModel):
    name: str
    count: int

class ActiveHour(BaseModel):
    hour: int
    count: int

class AudienceAnalyticsResponse(BaseModel):
    totalUsers: int
    newUsers: int
    ageDistribution: List[AgeGroup]
    genderDistribution: Dict[str, int]
    locations: List[Location]
    devices: Dict[str, int]
    activeHours: List[ActiveHour]
