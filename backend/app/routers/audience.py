from datetime import datetime, timedelta
from sqlalchemy import func
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .. import models, database, schemas
from ..routers.auth import get_current_user

router = APIRouter(prefix="/analytics", tags=["analytics"])

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/audience", response_model=schemas.AudienceAnalyticsResponse)
def get_audience_analytics(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Total audience size
    total_users = db.query(func.count(models.User.id)).scalar()

    # New users in last 7 days
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    new_users = (
        db.query(func.count(models.User.id))
        .filter(models.User.created_at >= seven_days_ago)
        .scalar()
    )

    # Age distribution
    age_18_24 = db.query(func.count(models.User.id)).filter(models.User.age.between(18, 24)).scalar()
    age_25_34 = db.query(func.count(models.User.id)).filter(models.User.age.between(25, 34)).scalar()
    age_35_plus = db.query(func.count(models.User.id)).filter(models.User.age >= 35).scalar()
    age_distribution = [
        {"group": "18-24", "count": age_18_24},
        {"group": "25-34", "count": age_25_34},
        {"group": "35+", "count": age_35_plus},
    ]

    # Gender distribution
    gender_rows = db.query(models.User.gender, func.count(models.User.id)).group_by(models.User.gender).all()
    gender_distribution = {
        (gender if gender is not None else "Unknown"): count
        for gender, count in gender_rows
    }

    # Locations
    location_rows = db.query(models.User.country, func.count(models.User.id)).group_by(models.User.country).all()
    locations = [
        {"name": (loc if loc is not None else "Unknown"), "count": count}
        for loc, count in location_rows
    ]

    # Devices (fixed: only one block, normalize None)
    device_rows = db.query(models.User.device_type, func.count(models.User.id)).group_by(models.User.device_type).all()
    devices = {
        (device if device is not None else "Unknown"): count
        for device, count in device_rows
    }

    # Active hours
    active_rows = (
        db.query(func.extract('hour', models.User.last_login), func.count(models.User.id))
        .filter(models.User.last_login.isnot(None))
        .group_by(models.User.last_login)
        .all()
    )
    active_hours = [{"hour": int(hour), "count": count} for hour, count in active_rows if hour is not None]

    return {
        "totalUsers": total_users,
        "newUsers": new_users,
        "ageDistribution": age_distribution,
        "genderDistribution": gender_distribution,
        "locations": locations,
        "devices": devices,
        "activeHours": active_hours,
    }
