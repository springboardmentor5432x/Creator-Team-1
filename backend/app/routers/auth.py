from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from .. import models, database, schemas
import bcrypt
from authlib.integrations.starlette_client import OAuth
from fastapi.responses import RedirectResponse
from jose import jwt, JWTError
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime, timedelta
import os

# JWT settings
SECRET_KEY = "super-secret-key"
ALGORITHM = "HS256"
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/auth/google/callback")

# Security scheme
security = HTTPBearer()

router = APIRouter(prefix="/auth", tags=["auth"])

# DB dependency
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Register route
@router.post("/register")
def register_user(request: schemas.RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == request.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_pw = bcrypt.hashpw(request.password.encode("utf-8"), bcrypt.gensalt())

    new_user = models.User(
        full_name=request.full_name,
        username=request.username,
        email=request.email,
        password=hashed_pw.decode("utf-8"),
        role=request.role,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    payload = {
        "user_id": new_user.id,
        "email": new_user.email,
        "exp": datetime.utcnow() + timedelta(hours=1),
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

    return {
        "message": "User registered successfully",
        "user_id": new_user.id,
        "role": new_user.role,
        "token": token,
    }

# Login route
@router.post("/login")
def login_user(request: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not bcrypt.checkpw(request.password.encode("utf-8"), user.password.encode("utf-8")):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # ✅ Update last_login
    user.last_login = datetime.utcnow()
    db.commit()

    payload = {
        "user_id": user.id,
        "email": user.email,
        "exp": datetime.utcnow() + timedelta(hours=1),
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

    return {"message": "Login successful", "user_id": user.id, "role": user.role, "token": token}

# Google OAuth setup
oauth = OAuth()
oauth.register(
    name="google",
    CLIENT_ID = "GOOGLE_CLIENT_ID",
    CLIENT_SECRET = "GOOGLE_CLIENT_SECRET",
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)

@router.get("/google")
async def google_login(request: Request):
    redirect_uri = GOOGLE_REDIRECT_URI
    return await oauth.google.authorize_redirect(request, redirect_uri)

@router.get("/google/callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    token = await oauth.google.authorize_access_token(request)
    user_info = token.get("userinfo")

    if not user_info:
        raise HTTPException(status_code=400, detail="Failed to fetch user info from Google")

    user = db.query(models.User).filter(models.User.email == user_info["email"]).first()
    if not user:
        user = models.User(
            full_name=user_info.get("name"),
            username=user_info.get("email").split("@")[0],
            email=user_info["email"],
            password="",
            role="Creator",
            language="English",
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    payload = {
        "user_id": user.id,
        "email": user.email,
        "exp": datetime.utcnow() + timedelta(hours=1),
    }
    app_token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

    redirect_url = f"http://localhost:5173/dashboard?token={app_token}"
    return RedirectResponse(url=redirect_url)

# ✅ Central JWT validator
def get_current_user(
    token: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    try:
        payload = jwt.decode(token.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("user_id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")

        user = db.query(models.User).filter(models.User.id == user_id).first()
        if user is None:
            raise HTTPException(status_code=404, detail="User not found")

        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Current user route
@router.get("/me")
def read_current_user(current_user: models.User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "full_name": current_user.full_name,
        "username": current_user.username,
        "email": current_user.email,
        "role": current_user.role,
        "language": getattr(current_user, "language", None),
    }

@router.put("/update", response_model=schemas.UserResponse)
def update_user(
    request: schemas.UpdateRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if request.username:
        current_user.username = request.username
    if request.email:
        current_user.email = request.email
    if request.role:
        current_user.role = request.role
    if request.language:
        current_user.language = request.language

    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user
