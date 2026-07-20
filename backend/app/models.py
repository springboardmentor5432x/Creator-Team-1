from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from .database import Base
from sqlalchemy.orm import declarative_base
from sqlalchemy.sql import func
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)   # hashed password
    role = Column(String)       # creator, agency, marketing team, administrator
    language = Column(String, default="English")
    age = Column(Integer)
    gender = Column(String) 
    country = Column(String, default="Unknown")
    device_type = Column(String, default="Unknown") 
    last_login = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship to analytics
    analytics = relationship("ContentAnalytics", back_populates="user")


# ✅ Content Analytics table
class ContentAnalytics(Base):
    __tablename__ = "content_analytics"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    platform = Column(String)       # e.g., YouTube, Instagram
    content_id = Column(String)     # video_id, post_id
    views = Column(Integer, default=0)
    likes = Column(Integer, default=0)
    comments = Column(Integer, default=0)
    shares = Column(Integer, default=0)
    saves = Column(Integer, default=0)
    watch_time = Column(Float, default=0.0)  # minutes/hours
    reach = Column(Integer, default=0)
    engagement_rate = Column(Float, default=0.0)  # percentage
    timestamp = Column(DateTime)

    # Relationship back to user
    user = relationship("User", back_populates="analytics")


class AudienceAnalytics(Base):
    __tablename__ = "audience_analytics"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    age_group = Column(String)
    gender = Column(String)
    location = Column(String)
    device = Column(String)
    active_hour = Column(Integer)
    count = Column(Integer)
    