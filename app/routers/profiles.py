"""
Profile management routes for Creator and Agency roles.
Marketing Team and Administrator roles use the core account only (Module 1
scope); their workspace-specific data belongs to later modules.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import crud, models, schemas
from ..database import get_db
from ..dependencies import get_current_user, require_role

router = APIRouter(prefix="/api/profiles", tags=["Profile Management"])


# ---------- Creator profile ----------

@router.get("/creator/me", response_model=schemas.CreatorProfileOut)
def get_my_creator_profile(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(models.UserRole.CREATOR)),
):
    profile = crud.get_or_create_creator_profile(db, current_user)
    return profile


@router.put("/creator/me", response_model=schemas.CreatorProfileOut)
def update_my_creator_profile(
    update: schemas.CreatorProfileUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(models.UserRole.CREATOR)),
):
    profile = crud.get_or_create_creator_profile(db, current_user)
    data = update.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(profile, field, value)
    db.commit()
    db.refresh(profile)
    return profile


# ---------- Agency profile ----------

@router.get("/agency/me", response_model=schemas.AgencyProfileOut)
def get_my_agency_profile(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(models.UserRole.AGENCY)),
):
    profile = crud.get_or_create_agency_profile(db, current_user)
    return profile


@router.put("/agency/me", response_model=schemas.AgencyProfileOut)
def update_my_agency_profile(
    update: schemas.AgencyProfileUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(models.UserRole.AGENCY)),
):
    profile = crud.get_or_create_agency_profile(db, current_user)
    data = update.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(profile, field, value)
    db.commit()
    db.refresh(profile)
    return profile


# ---------- Cross-role lookup (agency / marketing team / admin viewing a creator) ----------

@router.get("/creator/{user_id}", response_model=schemas.CreatorProfileOut)
def view_creator_profile(
    user_id: str,
    db: Session = Depends(get_db),
    _viewer: models.User = Depends(
        require_role(
            models.UserRole.AGENCY,
            models.UserRole.MARKETING_TEAM,
            models.UserRole.ADMINISTRATOR,
        )
    ),
):
    profile = (
        db.query(models.CreatorProfile).filter(models.CreatorProfile.user_id == user_id).first()
    )
    if not profile:
        raise HTTPException(status_code=404, detail="Creator profile not found")
    return profile
