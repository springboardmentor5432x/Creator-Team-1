from fastapi import FastAPI, APIRouter, Depends, HTTPException, status
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import json
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from passlib.context import CryptContext
import jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Password hashing configuration
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        return False

def get_password_hash(password):
    return pwd_context.hash(password)

# MongoDB connection settings
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'creatoriq')
client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=2000)
db = client[db_name]

# Global DB status toggle
use_mongodb = True
local_db_file = ROOT_DIR / "db.json"

# Mock MongoDB Implementation for Local JSON Database Fallback
class MockCollection:
    def __init__(self, table_name: str):
        self.table_name = table_name

    def _read_data(self) -> List[dict]:
        if not local_db_file.exists():
            return []
        try:
            with open(local_db_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return data.get(self.table_name, [])
        except Exception as e:
            logger.error(f"Error reading local db: {e}")
            return []

    def _write_data(self, items: List[dict]):
        data = {}
        if local_db_file.exists():
            try:
                with open(local_db_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
            except Exception:
                pass
        data[self.table_name] = items
        try:
            with open(local_db_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, default=str, indent=2)
        except Exception as e:
            logger.error(f"Error writing to local db: {e}")

    async def insert_one(self, doc: dict):
        items = self._read_data()
        # Remove _id if it's MongoDB objectid type
        if '_id' in doc:
            del doc['_id']
        items.append(doc)
        self._write_data(items)
        class InsertOneResult:
            inserted_id = doc.get('id', str(uuid.uuid4()))
        return InsertOneResult()

    async def update_one(self, filter_dict: dict, update_dict: dict):
        items = self._read_data()
        updated = False
        set_dict = update_dict.get('$set', update_dict)
        for i, item in enumerate(items):
            match = True
            for k, v in filter_dict.items():
                if item.get(k) != v:
                    match = False
                    break
            if match:
                for k, v in set_dict.items():
                    items[i][k] = v
                updated = True
        if updated:
            self._write_data(items)
        class UpdateResult:
            modified_count = 1 if updated else 0
        return UpdateResult()

    async def delete_one(self, filter_dict: dict):
        items = self._read_data()
        initial_len = len(items)
        items = [item for item in items if not all(item.get(k) == v for k, v in filter_dict.items())]
        deleted = len(items) < initial_len
        if deleted:
            self._write_data(items)
        class DeleteResult:
            deleted_count = 1 if deleted else 0
        return DeleteResult()

    def find(self, filter_dict: Optional[dict] = None, projection: Optional[dict] = None):
        items = self._read_data()
        filtered = []
        for item in items:
            match = True
            if filter_dict:
                for k, v in filter_dict.items():
                    if item.get(k) != v:
                        match = False
                        break
            if match:
                filtered.append(item.copy())

        if projection:
            for item in filtered:
                for k, v in list(projection.items()):
                    if v == 0 and k in item:
                        del item[k]

        class FindCursor:
            def __init__(self, data_list):
                self.data_list = data_list
            async def to_list(self, length=1000):
                return self.data_list[:length]
        return FindCursor(filtered)

class MockDB:
    def __getattr__(self, name):
        return MockCollection(name)

mock_db = MockDB()

def get_db():
    return db if use_mongodb else mock_db

# JWT Token logic
SECRET_KEY = os.environ.get('SECRET_KEY', 'creatoriq_luxury_dashboard_secret_2026')
ALGORITHM = "HS256"

# Define Pydantic Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    agency_name: Optional[str] = "My Agency"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    name: str
    email: str
    agency_name: str

class CreatorCreate(BaseModel):
    name: str
    handle: str
    platform: str
    followers: int
    engagement_rate: float
    avatar: Optional[str] = None
    status: str = "Active"
    campaigns: int = 0
    category: str
    joined_date: Optional[str] = None

class CreatorUpdate(BaseModel):
    name: Optional[str] = None
    handle: Optional[str] = None
    platform: Optional[str] = None
    followers: Optional[int] = None
    engagement_rate: Optional[float] = None
    avatar: Optional[str] = None
    status: Optional[str] = None
    campaigns: Optional[int] = None
    category: Optional[str] = None

class AgencyProfileUpdate(BaseModel):
    name: Optional[str] = None
    tagline: Optional[str] = None
    logo: Optional[str] = None
    banner: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    location: Optional[str] = None

class SettingsUpdate(BaseModel):
    currency: Optional[str] = None
    theme: Optional[str] = None
    default_language: Optional[str] = None

class SocialToggle(BaseModel):
    platform_id: str
    connected: bool

# Initialize main App
app = FastAPI(title="CreatorIQ Agency Dashboard Backend")

# API Router
api_router = APIRouter(prefix="/api")

# CORS config
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup DB check and seed data
@app.on_event("startup")
async def startup_db_client():
    global use_mongodb
    try:
        # Ping mongo
        await client.admin.command('ping')
        logger.info("Successfully connected to MongoDB server!")
        use_mongodb = True
    except Exception as e:
        logger.warning(f"Could not connect to MongoDB server: {e}. Falling back to JSON Database file: {local_db_file}")
        use_mongodb = False
    
    # Seed the DB if it is empty
    await seed_database()

@app.on_event("shutdown")
async def shutdown_db_client():
    if use_mongodb:
        client.close()

# Seeding Logic
async def seed_database():
    db_conn = get_db()
    
    # 1. Creators
    creators_list = await db_conn.creators.find().to_list(1)
    if not creators_list:
        mock_creators = [
            {
                "id": "c1",
                "name": "Evelyn Sterling",
                "handle": "@evelynsterling",
                "platform": "Instagram",
                "followers": 1420000,
                "engagement_rate": 4.8,
                "avatar": "https://images.unsplash.com/photo-1699899657680-421c2c2d5064?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzh8MHwxfHNlYXJjaHw0fHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMHBvcnRyYWl0fGVufDB8fHx8MTc4MzcwMTA4OXww&ixlib=rb-4.1.0&q=85",
                "status": "Active",
                "campaigns": 8,
                "category": "Fashion & Luxury",
                "joined_date": "2025-01-15T00:00:00Z"
            },
            {
                "id": "c2",
                "name": "Julian Vance",
                "handle": "@julianvance",
                "platform": "YouTube",
                "followers": 3200000,
                "engagement_rate": 6.2,
                "avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzh8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMHBvcnRyYWl0fGVufDB8fHx8MTc4MzcwMTA4OXww&ixlib=rb-4.1.0&q=85",
                "status": "Active",
                "campaigns": 12,
                "category": "Tech & Architecture",
                "joined_date": "2024-11-10T00:00:00Z"
            },
            {
                "id": "c3",
                "name": "Clara Valerius",
                "handle": "@claravalerius",
                "platform": "TikTok",
                "followers": 5700000,
                "engagement_rate": 8.5,
                "avatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzh8MHwxfHNlYXJjaHwzfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMHBvcnRyYWl0fGVufDB8fHx8MTc4MzcwMTA4OXww&ixlib=rb-4.1.0&q=85",
                "status": "Active",
                "campaigns": 15,
                "category": "Lifestyle & Design",
                "joined_date": "2025-02-01T00:00:00Z"
            },
            {
                "id": "c4",
                "name": "Marcus Kane",
                "handle": "@marcuskane",
                "platform": "Twitch",
                "followers": 890000,
                "engagement_rate": 11.2,
                "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?crop=entropy&cs=srgb&fm=jpg&q=85",
                "status": "On Break",
                "campaigns": 3,
                "category": "Gaming & Tech",
                "joined_date": "2024-08-20T00:00:00Z"
            }
        ]
        for c in mock_creators:
            await db_conn.creators.insert_one(c)
        logger.info("Seeded default creators data.")

    # 2. Agency Profile
    agency_list = await db_conn.agency_profile.find().to_list(1)
    if not agency_list:
        default_agency = {
            "id": "agency_1",
            "name": "Aura Premium Agency",
            "tagline": "Curating high-end digital creators for Luxury Swiss brands.",
            "logo": "https://images.unsplash.com/photo-1699899657680-421c2c2d5064?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzh8MHwxfHNlYXJjaHw0fHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMHBvcnRyYWl0fGVufDB8fHx8MTc4MzcwMTA4OXww&ixlib=rb-4.1.0&q=85",
            "banner": "https://images.unsplash.com/photo-1710438399422-2fca27686bcd?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2MjJ8MHwxfHNlYXJjaHwzfHxhYnN0cmFjdCUyMG1pbmltYWwlMjBkYXJrJTIwYmFja2dyb3VuZHxlbnwwfHx8fDE3ODM3NjQxMDR8MA&ixlib=rb-4.1.0&q=85",
            "email": "contact@aurapremium.ch",
            "phone": "+41 22 730 42 11",
            "website": "https://aurapremium.ch",
            "location": "Geneva, Switzerland",
            "total_followers": 11210000,
            "campaigns_completed": 142,
            "active_campaigns": 38,
            "monthly_reach": 42500000
        }
        await db_conn.agency_profile.insert_one(default_agency)
        logger.info("Seeded default agency profile.")

    # 3. Settings
    settings_list = await db_conn.settings.find().to_list(1)
    if not settings_list:
        default_settings = {
            "id": "settings_1",
            "currency": "USD",
            "theme": "dark",
            "database_mode": "MongoDB Server" if use_mongodb else "JSON DB Local Fallback",
            "api_endpoint": "/api",
            "default_language": "en"
        }
        await db_conn.settings.insert_one(default_settings)
        logger.info("Seeded default settings.")

    # 4. Social Media Integration
    social_list = await db_conn.social_media.find().to_list(1)
    if not social_list:
        default_social = [
            {"id": "instagram", "name": "Instagram", "connected": True, "followers": 1420000, "posts": 430, "engagement": 4.8},
            {"id": "youtube", "name": "YouTube", "connected": True, "followers": 3200000, "videos": 182, "engagement": 6.2},
            {"id": "tiktok", "name": "TikTok", "connected": True, "followers": 5700000, "videos": 520, "engagement": 8.5},
            {"id": "twitch", "name": "Twitch", "connected": False, "followers": 890000, "stream_hours": 0, "engagement": 11.2}
        ]
        for s in default_social:
            await db_conn.social_media.insert_one(s)
        logger.info("Seeded default social media integrations.")


# Security Dependency
from fastapi.security import OAuth2PasswordBearer
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login", auto_error=False)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
            )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
    
    db_conn = get_db()
    user_results = await db_conn.users.find({"email": email}).to_list(1)
    if not user_results:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    return user_results[0]


# --- API Routes ---

@api_router.get("/")
async def root():
    return {
        "status": "online",
        "message": "Welcome to CreatorIQ Dashboard API",
        "database": "MongoDB Server" if use_mongodb else "JSON DB Local Fallback"
    }

# Status Logs checks (from original codebase)
@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    db_conn = get_db()
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    await db_conn.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    db_conn = get_db()
    status_checks = await db_conn.status_checks.find({}, {"_id": 0}).to_list(1000)
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    return status_checks

# Auth Routes
@api_router.post("/auth/register")
async def register(user_in: UserRegister):
    db_conn = get_db()
    # Check if user already exists
    existing = await db_conn.users.find({"email": user_in.email}).to_list(1)
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Email address already registered."
        )
    
    hashed_password = get_password_hash(user_in.password)
    user_doc = {
        "id": str(uuid.uuid4()),
        "name": user_in.name,
        "email": user_in.email,
        "hashed_password": hashed_password,
        "agency_name": user_in.agency_name,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db_conn.users.insert_one(user_doc)
    
    # Create token
    access_token = jwt.encode({"sub": user_in.email}, SECRET_KEY, algorithm=ALGORITHM)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "name": user_in.name,
            "email": user_in.email,
            "agency_name": user_in.agency_name
        }
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    db_conn = get_db()
    user_list = await db_conn.users.find({"email": credentials.email}).to_list(1)
    if not user_list:
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password."
        )
    user = user_list[0]
    
    if not verify_password(credentials.password, user.get("hashed_password")):
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password."
        )
        
    access_token = jwt.encode({"sub": user["email"]}, SECRET_KEY, algorithm=ALGORITHM)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "name": user["name"],
            "email": user["email"],
            "agency_name": user.get("agency_name", "My Agency")
        }
    }

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "name": current_user["name"],
        "email": current_user["email"],
        "agency_name": current_user.get("agency_name", "My Agency")
    }

# Creators CRUD
@api_router.get("/creators")
async def get_creators(current_user: dict = Depends(get_current_user)):
    db_conn = get_db()
    creators = await db_conn.creators.find().to_list(1000)
    # Remove MongoDB internal IDs
    for c in creators:
        if '_id' in c:
            del c['_id']
    return creators

@api_router.post("/creators")
async def add_creator(creator: CreatorCreate, current_user: dict = Depends(get_current_user)):
    db_conn = get_db()
    # Check handle uniqueness
    existing = await db_conn.creators.find({"handle": creator.handle}).to_list(1)
    if existing:
        raise HTTPException(status_code=400, detail="Creator handle already exists.")
        
    doc = creator.model_dump()
    doc["id"] = "c_" + str(uuid.uuid4())[:8]
    if not doc["joined_date"]:
        doc["joined_date"] = datetime.now(timezone.utc).isoformat()
    if not doc["avatar"]:
        # Fallback to a placeholder or gravatar-like URL
        doc["avatar"] = f"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?crop=entropy&cs=srgb&fm=jpg&q=80"
        
    await db_conn.creators.insert_one(doc)
    return doc

@api_router.put("/creators/{creator_id}")
async def update_creator(creator_id: str, creator_data: CreatorUpdate, current_user: dict = Depends(get_current_user)):
    db_conn = get_db()
    # Check if exists
    existing = await db_conn.creators.find({"id": creator_id}).to_list(1)
    if not existing:
        raise HTTPException(status_code=404, detail="Creator not found.")
        
    update_fields = {k: v for k, v in creator_data.model_dump().items() if v is not None}
    if update_fields:
        await db_conn.creators.update_one({"id": creator_id}, {"$set": update_fields})
        
    updated = await db_conn.creators.find({"id": creator_id}).to_list(1)
    return updated[0]

@api_router.delete("/creators/{creator_id}")
async def delete_creator(creator_id: str, current_user: dict = Depends(get_current_user)):
    db_conn = get_db()
    res = await db_conn.creators.delete_one({"id": creator_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Creator not found.")
    return {"message": "Creator deleted successfully."}

# Agency Profile
@api_router.get("/agency/profile")
async def get_agency_profile(current_user: dict = Depends(get_current_user)):
    db_conn = get_db()
    profiles = await db_conn.agency_profile.find().to_list(1)
    if not profiles:
        raise HTTPException(status_code=404, detail="Agency profile not found.")
    return profiles[0]

@api_router.put("/agency/profile")
async def update_agency_profile(data: AgencyProfileUpdate, current_user: dict = Depends(get_current_user)):
    db_conn = get_db()
    profiles = await db_conn.agency_profile.find().to_list(1)
    if not profiles:
        raise HTTPException(status_code=404, detail="Agency profile not found.")
    agency_id = profiles[0]["id"]
    
    update_fields = {k: v for k, v in data.model_dump().items() if v is not None}
    if update_fields:
        await db_conn.agency_profile.update_one({"id": agency_id}, {"$set": update_fields})
        
    updated = await db_conn.agency_profile.find({"id": agency_id}).to_list(1)
    return updated[0]

# Analytics Dashboard
@api_router.get("/analytics")
async def get_analytics(current_user: dict = Depends(get_current_user)):
    # Calculate some aggregated values dynamically from creators
    db_conn = get_db()
    creators = await db_conn.creators.find().to_list(1000)
    
    total_followers = sum(c.get("followers", 0) for c in creators)
    active_campaigns = sum(c.get("campaigns", 0) for c in creators)
    
    avg_engagement = 0.0
    if creators:
        avg_engagement = round(sum(c.get("engagement_rate", 0) for c in creators) / len(creators), 2)
        
    # Generate some standard chart data for visual analytics
    monthly_data = [
        {"month": "Jan", "engagement": 4.2, "reach": 12000000, "earnings": 45000},
        {"month": "Feb", "engagement": 4.5, "reach": 15000000, "earnings": 52000},
        {"month": "Mar", "engagement": 5.1, "reach": 21000000, "earnings": 68000},
        {"month": "Apr", "engagement": 4.8, "reach": 24000000, "earnings": 72000},
        {"month": "May", "engagement": 5.5, "reach": 31000000, "earnings": 91000},
        {"month": "Jun", "engagement": 6.3, "reach": 42500000, "earnings": 115000}
    ]
    
    platform_distribution = [
        {"name": "Instagram", "value": sum(c.get("followers", 0) for c in creators if c.get("platform") == "Instagram")},
        {"name": "YouTube", "value": sum(c.get("followers", 0) for c in creators if c.get("platform") == "YouTube")},
        {"name": "TikTok", "value": sum(c.get("followers", 0) for c in creators if c.get("platform") == "TikTok")},
        {"name": "Twitch", "value": sum(c.get("followers", 0) for c in creators if c.get("platform") == "Twitch")}
    ]
    
    return {
        "kpis": {
            "total_followers": total_followers,
            "engagement_rate": avg_engagement,
            "active_campaigns": active_campaigns,
            "monthly_reach": 42500000, # Mock static or growth trend
            "monthly_revenue": 115000
        },
        "monthly_performance": monthly_data,
        "platform_distribution": platform_distribution
    }

# Social Media Connections
@api_router.get("/social-media")
async def get_social_media(current_user: dict = Depends(get_current_user)):
    db_conn = get_db()
    channels = await db_conn.social_media.find().to_list(10)
    for c in channels:
        if '_id' in c:
            del c['_id']
    return channels

@api_router.post("/social-media/toggle")
async def toggle_social_media(data: SocialToggle, current_user: dict = Depends(get_current_user)):
    db_conn = get_db()
    existing = await db_conn.social_media.find({"id": data.platform_id}).to_list(1)
    if not existing:
        raise HTTPException(status_code=404, detail="Social platform not found.")
        
    await db_conn.social_media.update_one(
        {"id": data.platform_id},
        {"$set": {"connected": data.connected}}
    )
    
    updated = await db_conn.social_media.find({"id": data.platform_id}).to_list(1)
    return updated[0]

# Settings
@api_router.get("/settings")
async def get_settings(current_user: dict = Depends(get_current_user)):
    db_conn = get_db()
    settings = await db_conn.settings.find().to_list(1)
    if not settings:
        raise HTTPException(status_code=404, detail="Settings not found.")
    
    settings_dict = settings[0].copy()
    settings_dict["database_mode"] = "MongoDB Server" if use_mongodb else "JSON DB Local Fallback"
    if '_id' in settings_dict:
        del settings_dict['_id']
    return settings_dict

@api_router.put("/settings")
async def update_settings(data: SettingsUpdate, current_user: dict = Depends(get_current_user)):
    db_conn = get_db()
    settings = await db_conn.settings.find().to_list(1)
    if not settings:
        raise HTTPException(status_code=404, detail="Settings not found.")
    settings_id = settings[0]["id"]
    
    update_fields = {k: v for k, v in data.model_dump().items() if v is not None}
    if update_fields:
        await db_conn.settings.update_one({"id": settings_id}, {"$set": update_fields})
        
    updated = await db_conn.settings.find({"id": settings_id}).to_list(1)
    updated_dict = updated[0].copy()
    updated_dict["database_mode"] = "MongoDB Server" if use_mongodb else "JSON DB Local Fallback"
    if '_id' in updated_dict:
        del updated_dict['_id']
    return updated_dict

# Include the API router
app.include_router(api_router)


