"""
CreatorIQ - User Management Module
Entry point. Run with: uvicorn app.main:app --reload
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import models, models_content, models_social  # noqa: F401 - register tables on Base
from .database import Base, engine
from .routers import auth, content_analytics, dashboards, profiles, social_auth, users

# Creates tables if they don't exist. For production, use Alembic migrations instead.
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="CreatorIQ - User Management Module",
    description="Registration, login, RBAC, and profile management for Creators, "
    "Agencies, Marketing Teams, and Administrators.",
    version="1.0.0",
)

# Adjust origins for your deployed React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(profiles.router)
app.include_router(social_auth.router)
app.include_router(dashboards.router)
app.include_router(content_analytics.router)


@app.get("/api/health", tags=["Health"])
def health_check():
    return {"status": "ok", "module": "user-management"}
