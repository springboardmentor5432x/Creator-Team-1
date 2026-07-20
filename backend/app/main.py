from fastapi import FastAPI
from starlette.middleware.sessions import SessionMiddleware
from fastapi.middleware.cors import CORSMiddleware
from .routers import auth, analytics,audience
from . import database, models

# Initialize database tables
database.init_db()

app = FastAPI()

# Allow React frontend to talk to FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Session middleware for Google OAuth
app.add_middleware(
    SessionMiddleware,
    secret_key="super-secret-session-key",
    same_site="lax",
    https_only=False,
)

# Routers (include each only once)
app.include_router(auth.router)
app.include_router(analytics.router)
app.include_router(audience.router)
