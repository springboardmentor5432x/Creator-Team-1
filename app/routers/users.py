"""
User account routes: view/update own account, change password,
and administrator-only user management (list users, enable/disable accounts).
"""

import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import crud, models, schemas
from ..auth import hash_password, verify_password
from ..database import get_db
from ..dependencies import get_current_user, require_role

router = APIRouter(prefix="/api/users", tags=["User Management"])


# ---------- Self-service account settings ----------

@router.get("/me", response_model=schemas.UserOut)
def read_own_account(current_user: models.User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=schemas.UserOut)
def update_own_account(
    update: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if update.email and update.email != current_user.email:
        if crud.get_user_by_email(db, update.email):
            raise HTTPException(status_code=400, detail="Email already in use")
    return crud.update_user_account(db, current_user, update)


@router.put("/me/password")
def change_password(
    payload: schemas.PasswordChange,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    current_user.hashed_password = hash_password(payload.new_password)
    db.commit()
    return {"detail": "Password updated successfully"}


# ---------- Administrator-only user management ----------

@router.get("", response_model=List[schemas.UserOut])
def list_all_users(
    db: Session = Depends(get_db),
    _admin: models.User = Depends(require_role(models.UserRole.ADMINISTRATOR)),
):
    return db.query(models.User).order_by(models.User.created_at.desc()).all()


@router.get("/{user_id}", response_model=schemas.UserOut)
def get_user_by_id(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    _admin: models.User = Depends(require_role(models.UserRole.ADMINISTRATOR)),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put("/{user_id}/status", response_model=schemas.UserOut)
def update_account_status(
    user_id: uuid.UUID,
    payload: schemas.AccountStatusUpdate,
    db: Session = Depends(get_db),
    _admin: models.User = Depends(require_role(models.UserRole.ADMINISTRATOR)),
):
    """Enable or disable a user account (e.g. suspend a creator/agency)."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = payload.is_active
    db.commit()
    db.refresh(user)
    return user
