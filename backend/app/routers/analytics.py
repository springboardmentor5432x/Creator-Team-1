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

@router.get("/content", response_model=list[schemas.ContentAnalyticsResponse])
def get_content_analytics(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Query content analytics for the logged-in user
    analytics = db.query(models.ContentAnalytics).filter(
        models.ContentAnalytics.user_id == current_user.id
    ).all()
    return analytics
