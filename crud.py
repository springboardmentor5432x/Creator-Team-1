"""
CRUD helper functions for users and role-specific profiles.
Keeps DB logic out of the route handlers.
"""

from datetime import datetime

from sqlalchemy.orm import Session

from . import models, schemas
from .auth import hash_password


def get_user_by_email(db: Session, email: str) -> models.User | None:
    return db.query(models.User).filter(models.User.email == email).first()


def create_user(db: Session, user_in: schemas.UserRegister) -> models.User:
    user = models.User(
        full_name=user_in.full_name,
        email=user_in.email,
        hashed_password=hash_password(user_in.password),
        role=user_in.role,
    )
    db.add(user)
    db.flush()  # get user.id before creating profile

    if user_in.role == models.UserRole.CREATOR:
        db.add(models.CreatorProfile(user_id=user.id, display_name=user_in.full_name))
    elif user_in.role == models.UserRole.AGENCY:
        db.add(
            models.AgencyProfile(
                user_id=user.id,
                agency_name=user_in.agency_name or f"{user_in.full_name}'s Agency",
            )
        )
    # marketing_team / administrator roles have no extra profile table for now

    db.commit()
    db.refresh(user)
    return user


def update_last_login(db: Session, user: models.User) -> None:
    user.last_login_at = datetime.utcnow()
    db.commit()


def update_user_account(db: Session, user: models.User, update: schemas.UserUpdate) -> models.User:
    data = update.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user


def get_or_create_creator_profile(db: Session, user: models.User) -> models.CreatorProfile:
    if not user.creator_profile:
        profile = models.CreatorProfile(user_id=user.id, display_name=user.full_name)
        db.add(profile)
        db.commit()
        db.refresh(user)
    return user.creator_profile


def get_or_create_agency_profile(db: Session, user: models.User) -> models.AgencyProfile:
    if not user.agency_profile:
        profile = models.AgencyProfile(user_id=user.id, agency_name=f"{user.full_name}'s Agency")
        db.add(profile)
        db.commit()
        db.refresh(user)
    return user.agency_profile
