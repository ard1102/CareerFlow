from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
import os
import logging
import json
from pathlib import Path
import uuid
from litellm import acompletion
from ai_features import (
    parse_job_description,
    generate_interview_questions,
    parse_email_for_job,
    search_knowledge_by_embedding,
    extract_learning_path
)
from scrapers import scrape_job_from_url, search_jobs
from resume_parser import extract_text_from_pdf, extract_text_from_docx, parse_resume_with_ai

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 43200  # 30 days

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============ MODELS ============

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    resume_info: Optional[str] = None
    visa_status: Optional[str] = None
    restrictions: Optional[List[str]] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    # New profile fields
    resume_summary: Optional[str] = None
    skills: Optional[List[str]] = []
    projects: Optional[List[str]] = []
    education: Optional[List[str]] = []
    work_authorization: Optional[str] = None
    previous_companies: Optional[List[str]] = []
    location_preference: Optional[str] = None
    years_of_experience: Optional[int] = None

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    resume_summary: Optional[str] = None
    skills: Optional[List[str]] = None
    projects: Optional[List[str]] = None
    education: Optional[List[str]] = None
    work_authorization: Optional[str] = None
    visa_status: Optional[str] = None
    previous_companies: Optional[List[str]] = None
    location_preference: Optional[str] = None
    years_of_experience: Optional[int] = None

class Token(BaseModel):
    access_token: str
    token_type: str

class JobCreate(BaseModel):
    title: str
    company: str
    posting_url: Optional[str] = None
    description: Optional[str] = None
    pay: Optional[str] = None
    work_auth: Optional[str] = None
    location: Optional[str] = None
    status: str = "pending"
    notes: Optional[str] = None

class Job(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    company: str
    posting_url: Optional[str] = None
    description: Optional[str] = None
    pay: Optional[str] = None
    work_auth: Optional[str] = None
    location: Optional[str] = None
    status: str = "pending"
    contacts: Optional[List[str]] = []
    resume_submitted: bool = False
    applied_date: Optional[datetime] = None
    notes: Optional[str] = None
    is_deleted: bool = False
    deleted_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CompanyCreate(BaseModel):
    name: str
    about: Optional[str] = None
    stem_support: Optional[bool] = False
    visa_sponsor: Optional[bool] = False
    employee_count: Optional[str] = None
    research: Optional[str] = None
    user_comments: Optional[str] = None

class Company(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    about: Optional[str] = None
    stem_support: Optional[bool] = False
    visa_sponsor: Optional[bool] = False
    employee_count: Optional[str] = None
    research: Optional[str] = None
    user_comments: Optional[str] = None
    is_deleted: bool = False
    deleted_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ContactCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    company_id: Optional[str] = None
    role: Optional[str] = None
    how_met: Optional[str] = None
    notes: Optional[str] = None
    last_touch_date: Optional[datetime] = None

class Contact(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    company_id: Optional[str] = None
    role: Optional[str] = None
    how_met: Optional[str] = None
    notes: Optional[str] = None
    last_touch_date: Optional[datetime] = None
    is_deleted: bool = False
    deleted_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatMessageCreate(BaseModel):
    message: str
    session_id: Optional[str] = None

class ChatMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    session_id: str
    message: str
    response: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LLMConfigCreate(BaseModel):
    provider: str
    model: str
    api_key: Optional[str] = None
    base_url: Optional[str] = None

class LLMConfig(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    provider: str
    model: str
    api_key: Optional[str] = None
    base_url: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TodoCreate(BaseModel):
    title: str
    category: Optional[str] = "general"
    due_date: Optional[datetime] = None

class Todo(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    completed: bool = False
    category: Optional[str] = "general"
    due_date: Optional[datetime] = None
    is_deleted: bool = False
    deleted_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class KnowledgeCreate(BaseModel):
    title: str
    content: str
    tags: Optional[List[str]] = []

class Knowledge(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    content: str
    tags: Optional[List[str]] = []
    is_deleted: bool = False
    deleted_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PromptCreate(BaseModel):
    title: str
    content: str
    category: Optional[str] = "general"

class Prompt(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    content: str
    category: Optional[str] = "general"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class JobPortalCreate(BaseModel):
    name: str
    url: str
    username: Optional[str] = None
    notes: Optional[str] = None

class JobPortal(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    url: str
    username: Optional[str] = None
    notes: Optional[str] = None
    success_rate: Optional[float] = 0.0
    jobs_applied: Optional[int] = 0
    last_used: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ReminderCreate(BaseModel):
    job_id: Optional[str] = None
    reminder_date: datetime
    message: str
    reminder_type: str = "follow_up"  # follow_up, interview, deadline, custom

class Reminder(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    job_id: Optional[str] = None
    reminder_date: datetime
    message: str
    reminder_type: str = "follow_up"
    completed: bool = False
    is_deleted: bool = False
    deleted_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TargetCreate(BaseModel):
    title: str
    target_type: str  # applications, interviews, offers, networking
    goal_value: int
    current_value: int = 0
    deadline: Optional[datetime] = None
    period: str = "weekly"  # daily, weekly, monthly, quarterly

class Target(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    target_type: str
    goal_value: int
    current_value: int = 0
    deadline: Optional[datetime] = None
    period: str = "weekly"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SystemCreate(BaseModel):
    name: str
    description: str
    frequency: str  # daily, weekly, biweekly, monthly
    tasks: List[str]

class System(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    description: str
    frequency: str
    tasks: List[str]
    last_executed: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ============ HELPER FUNCTIONS ============

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

def serialize_doc(doc):
    """Convert datetime objects to ISO strings for MongoDB storage"""
    if isinstance(doc, dict):
        return {k: v.isoformat() if isinstance(v, datetime) else v for k, v in doc.items()}
    return doc

def deserialize_doc(doc):
    """Convert ISO strings back to datetime objects"""
    if isinstance(doc, dict):
        for key in ['created_at', 'updated_at', 'timestamp', 'applied_date', 'due_date', 'last_touch_date']:
            if key in doc and isinstance(doc[key], str):
                try:
                    doc[key] = datetime.fromisoformat(doc[key])
                except:
                    pass
    return doc

# ============ AUTH ROUTES ============

@api_router.post("/auth/register", response_model=Token)
async def register(user: UserCreate):
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_obj = User(
        email=user.email,
        name=user.name
    )
    user_dict = user_obj.model_dump()
    user_dict['password_hash'] = hash_password(user.password)
    
    await db.users.insert_one(serialize_doc(user_dict))
    
    access_token = create_access_token(data={"sub": user_obj.id})
    return {"access_token": access_token, "token_type": "bearer"}

@api_router.post("/auth/login", response_model=Token)
async def login(user: UserLogin):
    db_user = await db.users.find_one({"email": user.email})
    if not db_user or not verify_password(user.password, db_user.get('password_hash', '')):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token = create_access_token(data={"sub": db_user['id']})
    return {"access_token": access_token, "token_type": "bearer"}

@api_router.get("/auth/me", response_model=User)
async def get_me(user_id: str = Depends(get_current_user)):
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return deserialize_doc(user)

@api_router.put("/auth/profile", response_model=User)
async def update_profile(profile: ProfileUpdate, user_id: str = Depends(get_current_user)):
    """Update user profile with resume, skills, and preferences"""
    update_data = {k: v for k, v in profile.model_dump().items() if v is not None}
    
    if update_data:
        await db.users.update_one(
            {"id": user_id},
            {"$set": update_data}
        )
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    return deserialize_doc(user)

# ============ JOBS ROUTES ============

@api_router.post("/jobs", response_model=Job)
async def create_job(job: JobCreate, user_id: str = Depends(get_current_user)):
    job_obj = Job(user_id=user_id, **job.model_dump())
    if job.status == "applied" and not job_obj.applied_date:
        job_obj.applied_date = datetime.now(timezone.utc)
    
    await db.jobs.insert_one(serialize_doc(job_obj.model_dump()))
    return job_obj

@api_router.get("/jobs", response_model=List[Job])
async def get_jobs(user_id: str = Depends(get_current_user)):
    jobs = await db.jobs.find({"user_id": user_id, "is_deleted": {"$ne": True}}, {"_id": 0}).to_list(1000)
    return [deserialize_doc(job) for job in jobs]

@api_router.get("/jobs/{job_id}", response_model=Job)
async def get_job(job_id: str, user_id: str = Depends(get_current_user)):
    job = await db.jobs.find_one({"id": job_id, "user_id": user_id}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return deserialize_doc(job)

@api_router.put("/jobs/{job_id}", response_model=Job)
async def update_job(job_id: str, job_update: JobCreate, user_id: str = Depends(get_current_user)):
    existing_job = await db.jobs.find_one({"id": job_id, "user_id": user_id})
    if not existing_job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    update_data = job_update.model_dump()
    update_data['updated_at'] = datetime.now(timezone.utc)
    
    if job_update.status == "applied" and not existing_job.get('applied_date'):
        update_data['applied_date'] = datetime.now(timezone.utc)
    
    await db.jobs.update_one(
        {"id": job_id, "user_id": user_id},
        {"$set": serialize_doc(update_data)}
    )
    
    updated_job = await db.jobs.find_one({"id": job_id}, {"_id": 0})
    return deserialize_doc(updated_job)

@api_router.delete("/jobs/{job_id}")
async def delete_job(job_id: str, user_id: str = Depends(get_current_user)):
    # Soft delete
    result = await db.jobs.update_one(
        {"id": job_id, "user_id": user_id, "is_deleted": {"$ne": True}},
        {"$set": {"is_deleted": True, "deleted_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"message": "Job moved to trash", "can_undo": True}

# ============ COMPANIES ROUTES ============

@api_router.post("/companies", response_model=Company)
async def create_company(company: CompanyCreate, user_id: str = Depends(get_current_user)):
    company_obj = Company(user_id=user_id, **company.model_dump())
    await db.companies.insert_one(serialize_doc(company_obj.model_dump()))
    return company_obj

@api_router.get("/companies", response_model=List[Company])
async def get_companies(user_id: str = Depends(get_current_user)):
    companies = await db.companies.find({"user_id": user_id, "is_deleted": {"$ne": True}}, {"_id": 0}).to_list(1000)
    return [deserialize_doc(c) for c in companies]

@api_router.get("/companies/{company_id}", response_model=Company)
async def get_company(company_id: str, user_id: str = Depends(get_current_user)):
    company = await db.companies.find_one({"id": company_id, "user_id": user_id}, {"_id": 0})
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return deserialize_doc(company)

@api_router.delete("/companies/{company_id}")
async def delete_company(company_id: str, user_id: str = Depends(get_current_user)):
    # Soft delete
    result = await db.companies.update_one(
        {"id": company_id, "user_id": user_id, "is_deleted": {"$ne": True}},
        {"$set": {"is_deleted": True, "deleted_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Company not found")
    return {"message": "Company moved to trash", "can_undo": True}

# ============ CONTACTS ROUTES ============

@api_router.post("/contacts", response_model=Contact)
async def create_contact(contact: ContactCreate, user_id: str = Depends(get_current_user)):
    contact_obj = Contact(user_id=user_id, **contact.model_dump())
    await db.contacts.insert_one(serialize_doc(contact_obj.model_dump()))
    return contact_obj

@api_router.get("/contacts", response_model=List[Contact])
async def get_contacts(user_id: str = Depends(get_current_user)):
    contacts = await db.contacts.find({"user_id": user_id, "is_deleted": {"$ne": True}}, {"_id": 0}).to_list(1000)
    return [deserialize_doc(c) for c in contacts]

@api_router.delete("/contacts/{contact_id}")
async def delete_contact(contact_id: str, user_id: str = Depends(get_current_user)):
    # Soft delete
    result = await db.contacts.update_one(
        {"id": contact_id, "user_id": user_id, "is_deleted": {"$ne": True}},
        {"$set": {"is_deleted": True, "deleted_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Contact not found")
    return {"message": "Contact moved to trash", "can_undo": True}

# ============ CHAT ROUTES ============

@api_router.post("/chat/send")
async def send_chat_message(msg: ChatMessageCreate, user_id: str = Depends(get_current_user)):
    session_id = msg.session_id or str(uuid.uuid4())
    
    # Get user's LLM config
    llm_config = await db.llm_configs.find_one({"user_id": user_id})
    
    if not llm_config:
        raise HTTPException(status_code=400, detail="Please configure your LLM settings first")
    
    try:
        # Define tools for function calling
        tools = [
            {
                "type": "function",
                "function": {
                    "name": "get_jobs",
                    "description": "Get list of user's job applications. Can filter by status (pending, applied, interview, offer, rejected, ghosted).",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "status": {
                                "type": "string",
                                "enum": ["pending", "applied", "interview", "offer", "rejected", "ghosted", "all"],
                                "description": "Filter jobs by status. Use 'all' to get all jobs."
                            }
                        }
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "update_job_status",
                    "description": "Update the status of a job application.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "job_id": {
                                "type": "string",
                                "description": "The ID of the job to update"
                            },
                            "new_status": {
                                "type": "string",
                                "enum": ["pending", "applied", "interview", "offer", "rejected", "ghosted"],
                                "description": "The new status for the job"
                            }
                        },
                        "required": ["job_id", "new_status"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "add_job",
                    "description": "Add a new job application to track.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "title": {"type": "string", "description": "Job title"},
                            "company": {"type": "string", "description": "Company name"},
                            "location": {"type": "string", "description": "Job location"},
                            "status": {"type": "string", "enum": ["pending", "applied", "interview"], "description": "Initial status"},
                            "notes": {"type": "string", "description": "Any notes about the job"}
                        },
                        "required": ["title", "company"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "get_dashboard_stats",
                    "description": "Get statistics about job applications (total, by status).",
                    "parameters": {"type": "object", "properties": {}}
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "create_company",
                    "description": "Add a new company to track.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string", "description": "Company name"},
                            "about": {"type": "string", "description": "About the company"},
                            "visa_sponsor": {"type": "boolean", "description": "Does company sponsor visas"},
                            "stem_support": {"type": "boolean", "description": "STEM-OPT support"}
                        },
                        "required": ["name"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "create_contact",
                    "description": "Add a new contact to your network.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string", "description": "Contact's name"},
                            "email": {"type": "string", "description": "Email address"},
                            "company": {"type": "string", "description": "Company name"},
                            "role": {"type": "string", "description": "Their role/title"},
                            "notes": {"type": "string", "description": "Notes about the contact"}
                        },
                        "required": ["name"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "create_knowledge",
                    "description": "Save an article, note, or learning to knowledge base.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "title": {"type": "string", "description": "Title of the article/note"},
                            "content": {"type": "string", "description": "The content"},
                            "tags": {"type": "array", "items": {"type": "string"}, "description": "Tags for organization"}
                        },
                        "required": ["title", "content"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "parse_job_description",
                    "description": "Parse a job description to extract skills, requirements, and other details.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "description": {"type": "string", "description": "The job description text"}
                        },
                        "required": ["description"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "get_companies",
                    "description": "Get list of tracked companies.",
                    "parameters": {"type": "object", "properties": {}}
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "get_contacts",
                    "description": "Get list of contacts in your network.",
                    "parameters": {"type": "object", "properties": {}}
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "research_company",
                    "description": "Research a company by scraping their website to get information about what they do, their culture, STEM-OPT support, visa sponsorship, etc. Updates the company profile with the researched info.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "company_name": {"type": "string", "description": "Name of the company to research"},
                            "company_website": {"type": "string", "description": "Company website URL (e.g., https://company.com). Optional if you don't know it."}
                        },
                        "required": ["company_name"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "update_company",
                    "description": "Update an existing company's details like about, visa sponsorship status, STEM-OPT support, etc.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "company_id": {"type": "string", "description": "ID of the company to update"},
                            "about": {"type": "string", "description": "About the company"},
                            "visa_sponsor": {"type": "boolean", "description": "Does company sponsor visas"},
                            "stem_support": {"type": "boolean", "description": "STEM-OPT support"},
                            "employee_count": {"type": "string", "description": "Approximate employee count"},
                            "research": {"type": "string", "description": "Research notes about the company"},
                            "user_comments": {"type": "string", "description": "User's personal notes"}
                        },
                        "required": ["company_id"]
                    }
                }
            }
        ]
        
        # Call LiteLLM with tools
        model_name = llm_config['model']
        if llm_config['provider'] == 'openai_compatible':
            model_prefix = "openai/"
        elif llm_config['provider'] == 'openrouter':
            # OpenRouter models already include provider (e.g., openai/gpt-4)
            model_prefix = "openrouter/"
            # If user included provider in model name, use as-is, otherwise add prefix
            if '/' not in model_name:
                model_name = f"openai/{model_name}"  # Default to openai models
        else:
            model_prefix = f"{llm_config['provider']}/"
        
        response = await acompletion(
            model=f"{model_prefix}{model_name}",
            messages=[
                {"role": "system", "content": "You are a helpful career assistant for CareerFlow. You help users track their job applications, update statuses, and manage their job search. Use the available functions to access and update the user's actual job data. Be specific and actionable."},
                {"role": "user", "content": msg.message}
            ],
            tools=tools,
            api_key=llm_config.get('api_key') or 'dummy',
            base_url=llm_config.get('base_url')
        )
        
        # Check if AI wants to call a function
        if response.choices[0].message.tool_calls:
            tool_call = response.choices[0].message.tool_calls[0]
            function_name = tool_call.function.name
            function_args = json.loads(tool_call.function.arguments)
            
            # Execute the function
            function_result = await execute_function(function_name, function_args, user_id)
            
            # Call LLM again with function result
            response = await acompletion(
                model=f"{model_prefix}{model_name}",
                messages=[
                    {"role": "system", "content": "You are a helpful career assistant for CareerFlow. You help users track their job applications, update statuses, and manage their job search. Use the available functions to access and update the user's actual job data. Be specific and actionable."},
                    {"role": "user", "content": msg.message},
                    {"role": "assistant", "content": None, "tool_calls": [{"id": tool_call.id, "type": "function", "function": {"name": function_name, "arguments": tool_call.function.arguments}}]},
                    {"role": "tool", "tool_call_id": tool_call.id, "name": function_name, "content": json.dumps(function_result)}
                ],
                tools=tools,
                api_key=llm_config.get('api_key') or 'dummy',
                base_url=llm_config.get('base_url')
            )
        
        response_text = response.choices[0].message.content
        
        # Save to database
        chat_obj = ChatMessage(
            user_id=user_id,
            session_id=session_id,
            message=msg.message,
            response=response_text
        )
        await db.chat_messages.insert_one(serialize_doc(chat_obj.model_dump()))
        
        return {"response": response_text, "session_id": session_id}
    
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")

async def execute_function(function_name: str, arguments: dict, user_id: str):
    """Execute a function called by the AI"""
    
    if function_name == "get_jobs":
        status_filter = arguments.get("status", "all")
        query = {"user_id": user_id}
        if status_filter != "all":
            query["status"] = status_filter
        
        jobs = await db.jobs.find(query, {"_id": 0}).to_list(100)
        return [
            {
                "id": job["id"],
                "title": job["title"],
                "company": job["company"],
                "status": job["status"],
                "location": job.get("location"),
                "applied_date": job.get("applied_date"),
                "notes": job.get("notes")
            }
            for job in jobs
        ]
    
    elif function_name == "update_job_status":
        job_id = arguments["job_id"]
        new_status = arguments["new_status"]
        
        result = await db.jobs.update_one(
            {"id": job_id, "user_id": user_id},
            {"$set": {"status": new_status, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        if result.modified_count > 0:
            return {"success": True, "message": f"Updated job status to {new_status}"}
        else:
            return {"success": False, "message": "Job not found or no changes made"}
    
    elif function_name == "add_job":
        job_data = JobCreate(**arguments)
        job_obj = Job(user_id=user_id, **job_data.model_dump())
        await db.jobs.insert_one(serialize_doc(job_obj.model_dump()))
        
        return {
            "success": True,
            "job_id": job_obj.id,
            "message": f"Added {job_obj.title} at {job_obj.company}"
        }
    
    elif function_name == "get_dashboard_stats":
        jobs = await db.jobs.find({"user_id": user_id}, {"_id": 0}).to_list(1000)
        stats = {
            "total": len(jobs),
            "applied": len([j for j in jobs if j['status'] == 'applied']),
            "interview": len([j for j in jobs if j['status'] == 'interview']),
            "offer": len([j for j in jobs if j['status'] == 'offer']),
            "rejected": len([j for j in jobs if j['status'] == 'rejected']),
            "ghosted": len([j for j in jobs if j['status'] == 'ghosted']),
            "pending": len([j for j in jobs if j['status'] == 'pending'])
        }
        return stats
    
    elif function_name == "create_company":
        company_data = CompanyCreate(**arguments)
        company_obj = Company(user_id=user_id, **company_data.model_dump())
        await db.companies.insert_one(serialize_doc(company_obj.model_dump()))
        return {"success": True, "company_id": company_obj.id, "message": f"Added company: {company_obj.name}"}
    
    elif function_name == "create_contact":
        # If company name is provided, try to find company_id
        company_name = arguments.pop("company", None)
        company_id = None
        if company_name:
            company = await db.companies.find_one({"user_id": user_id, "name": company_name})
            if company:
                company_id = company["id"]
        
        contact_data = ContactCreate(**arguments, company_id=company_id)
        contact_obj = Contact(user_id=user_id, **contact_data.model_dump())
        await db.contacts.insert_one(serialize_doc(contact_obj.model_dump()))
        return {"success": True, "contact_id": contact_obj.id, "message": f"Added contact: {contact_obj.name}"}
    
    elif function_name == "create_knowledge":
        tags = arguments.get("tags", [])
        knowledge_data = KnowledgeCreate(
            title=arguments["title"],
            content=arguments["content"],
            tags=tags
        )
        knowledge_obj = Knowledge(user_id=user_id, **knowledge_data.model_dump())
        await db.knowledge.insert_one(serialize_doc(knowledge_obj.model_dump()))
        return {"success": True, "knowledge_id": knowledge_obj.id, "message": f"Saved to knowledge base: {knowledge_obj.title}"}
    
    elif function_name == "parse_job_description":
        from ai_features import parse_job_description as parse_desc
        description = arguments["description"]
        result = parse_desc(description)
        return result
    
    elif function_name == "get_companies":
        companies = await db.companies.find({"user_id": user_id}, {"_id": 0}).to_list(100)
        return [
            {
                "id": c["id"],
                "name": c["name"],
                "visa_sponsor": c.get("visa_sponsor", False),
                "stem_support": c.get("stem_support", False)
            }
            for c in companies
        ]
    
    elif function_name == "get_contacts":
        contacts = await db.contacts.find({"user_id": user_id}, {"_id": 0}).to_list(100)
        return [
            {
                "id": c["id"],
                "name": c["name"],
                "email": c.get("email"),
                "role": c.get("role")
            }
            for c in contacts
        ]
    
    elif function_name == "research_company":
        company_name = arguments["company_name"]
        company_website = arguments.get("company_website", "")
        
        # Try to find or create the company
        company = await db.companies.find_one({"user_id": user_id, "name": {"$regex": company_name, "$options": "i"}})
        
        if not company:
            # Create new company
            company_obj = Company(user_id=user_id, name=company_name)
            await db.companies.insert_one(serialize_doc(company_obj.model_dump()))
            company = company_obj.model_dump()
        
        # Build research info structure
        research_info = {
            "company_name": company_name,
            "company_id": company["id"],
            "existing_info": {
                "about": company.get("about"),
                "visa_sponsor": company.get("visa_sponsor"),
                "stem_support": company.get("stem_support"),
                "employee_count": company.get("employee_count"),
                "research": company.get("research")
            },
            "suggestions": []
        }
        
        # Provide search suggestions
        search_query = company_name.replace(" ", "+")
        research_info["suggestions"] = [
            f"Search Google: https://www.google.com/search?q={search_query}+careers",
            f"Search for visa sponsorship: https://www.google.com/search?q={search_query}+h1b+visa+sponsorship",
            f"Check Glassdoor: https://www.glassdoor.com/Search/results.htm?keyword={search_query}",
            f"Check LinkedIn: https://www.linkedin.com/company/{company_name.lower().replace(' ', '-')}"
        ]
        
        if company_website:
            research_info["suggestions"].insert(0, f"Company website: {company_website}")
        
        # Update company with research timestamp
        await db.companies.update_one(
            {"id": company["id"], "user_id": user_id},
            {"$set": {"research": f"Research initiated on {datetime.now(timezone.utc).strftime('%Y-%m-%d')}. Use the links to gather info, then tell me what you found and I'll update the profile."}}
        )
        
        return {
            "success": True,
            "company_id": company["id"],
            "company_name": company_name,
            "current_info": research_info["existing_info"],
            "research_links": research_info["suggestions"],
            "message": f"I've prepared research links for {company_name}. Tell me what you find about their visa sponsorship, STEM-OPT support, company size, etc., and I'll update the company profile."
        }
    
    elif function_name == "update_company":
        company_id = arguments.pop("company_id")
        
        # Filter out None values
        update_data = {k: v for k, v in arguments.items() if v is not None}
        
        if update_data:
            result = await db.companies.update_one(
                {"id": company_id, "user_id": user_id},
                {"$set": update_data}
            )
            
            if result.modified_count > 0:
                return {"success": True, "message": f"Updated company successfully"}
            else:
                return {"success": False, "message": "Company not found or no changes made"}
        
        return {"success": False, "message": "No update data provided"}
    
    return {"error": "Unknown function"}

@api_router.get("/chat/history")
async def get_chat_history(session_id: Optional[str] = None, user_id: str = Depends(get_current_user)):
    query = {"user_id": user_id}
    if session_id:
        query["session_id"] = session_id
    
    messages = await db.chat_messages.find(query, {"_id": 0}).sort("timestamp", 1).to_list(1000)
    return [deserialize_doc(msg) for msg in messages]

@api_router.delete("/chat/clear")
async def clear_chat_history(session_id: Optional[str] = None, user_id: str = Depends(get_current_user)):
    """Clear chat history for a session or all sessions"""
    query = {"user_id": user_id}
    if session_id:
        query["session_id"] = session_id
    
    result = await db.chat_messages.delete_many(query)
    return {"deleted": result.deleted_count, "message": "Chat history cleared"}

# ============ LLM CONFIG ROUTES ============

@api_router.post("/llm-config", response_model=LLMConfig)
async def create_llm_config(config: LLMConfigCreate, user_id: str = Depends(get_current_user)):
    # Delete existing config
    await db.llm_configs.delete_many({"user_id": user_id})
    
    config_obj = LLMConfig(user_id=user_id, **config.model_dump())
    await db.llm_configs.insert_one(serialize_doc(config_obj.model_dump()))
    return config_obj

@api_router.get("/llm-config")
async def get_llm_config(user_id: str = Depends(get_current_user)):
    config = await db.llm_configs.find_one({"user_id": user_id}, {"_id": 0})
    if not config:
        return None
    return deserialize_doc(config)

# ============ TODOS ROUTES ============

@api_router.post("/todos", response_model=Todo)
async def create_todo(todo: TodoCreate, user_id: str = Depends(get_current_user)):
    todo_obj = Todo(user_id=user_id, **todo.model_dump())
    await db.todos.insert_one(serialize_doc(todo_obj.model_dump()))
    return todo_obj

@api_router.get("/todos", response_model=List[Todo])
async def get_todos(user_id: str = Depends(get_current_user)):
    todos = await db.todos.find({"user_id": user_id, "is_deleted": {"$ne": True}}, {"_id": 0}).to_list(1000)
    return [deserialize_doc(t) for t in todos]

@api_router.put("/todos/{todo_id}")
async def toggle_todo(todo_id: str, user_id: str = Depends(get_current_user)):
    todo = await db.todos.find_one({"id": todo_id, "user_id": user_id})
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    
    await db.todos.update_one(
        {"id": todo_id},
        {"$set": {"completed": not todo.get('completed', False)}}
    )
    return {"message": "Todo updated"}

@api_router.delete("/todos/{todo_id}")
async def delete_todo(todo_id: str, user_id: str = Depends(get_current_user)):
    # Soft delete
    result = await db.todos.update_one(
        {"id": todo_id, "user_id": user_id, "is_deleted": {"$ne": True}},
        {"$set": {"is_deleted": True, "deleted_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Todo not found")
    return {"message": "Todo moved to trash", "can_undo": True}

# ============ KNOWLEDGE ROUTES ============

@api_router.post("/knowledge", response_model=Knowledge)
async def create_knowledge(knowledge: KnowledgeCreate, user_id: str = Depends(get_current_user)):
    knowledge_obj = Knowledge(user_id=user_id, **knowledge.model_dump())
    await db.knowledge.insert_one(serialize_doc(knowledge_obj.model_dump()))
    return knowledge_obj

@api_router.get("/knowledge", response_model=List[Knowledge])
async def get_knowledge(user_id: str = Depends(get_current_user)):
    knowledge = await db.knowledge.find({"user_id": user_id, "is_deleted": {"$ne": True}}, {"_id": 0}).to_list(1000)
    return [deserialize_doc(k) for k in knowledge]

@api_router.delete("/knowledge/{knowledge_id}")
async def delete_knowledge(knowledge_id: str, user_id: str = Depends(get_current_user)):
    # Soft delete
    result = await db.knowledge.update_one(
        {"id": knowledge_id, "user_id": user_id, "is_deleted": {"$ne": True}},
        {"$set": {"is_deleted": True, "deleted_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Knowledge not found")
    return {"message": "Knowledge moved to trash", "can_undo": True}

# ============ PROMPTS ROUTES ============

@api_router.post("/prompts", response_model=Prompt)
async def create_prompt(prompt: PromptCreate, user_id: str = Depends(get_current_user)):
    prompt_obj = Prompt(user_id=user_id, **prompt.model_dump())
    await db.prompts.insert_one(serialize_doc(prompt_obj.model_dump()))
    return prompt_obj

@api_router.get("/prompts", response_model=List[Prompt])
async def get_prompts(user_id: str = Depends(get_current_user)):
    prompts = await db.prompts.find({"user_id": user_id}, {"_id": 0}).to_list(1000)
    return [deserialize_doc(p) for p in prompts]

@api_router.delete("/prompts/{prompt_id}")
async def delete_prompt(prompt_id: str, user_id: str = Depends(get_current_user)):
    result = await db.prompts.delete_one({"id": prompt_id, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Prompt not found")
    return {"message": "Prompt deleted"}

# ============ JOB PORTALS ROUTES ============

@api_router.post("/portals", response_model=JobPortal)
async def create_portal(portal: JobPortalCreate, user_id: str = Depends(get_current_user)):
    portal_obj = JobPortal(user_id=user_id, **portal.model_dump())
    await db.portals.insert_one(serialize_doc(portal_obj.model_dump()))
    return portal_obj

@api_router.get("/portals", response_model=List[JobPortal])
async def get_portals(user_id: str = Depends(get_current_user)):
    portals = await db.portals.find({"user_id": user_id}, {"_id": 0}).to_list(1000)
    return [deserialize_doc(p) for p in portals]

@api_router.delete("/portals/{portal_id}")
async def delete_portal(portal_id: str, user_id: str = Depends(get_current_user)):
    result = await db.portals.delete_one({"id": portal_id, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Portal not found")
    return {"message": "Portal deleted"}

# ============ REMINDERS ROUTES ============

@api_router.post("/reminders", response_model=Reminder)
async def create_reminder(reminder: ReminderCreate, user_id: str = Depends(get_current_user)):
    reminder_obj = Reminder(user_id=user_id, **reminder.model_dump())
    await db.reminders.insert_one(serialize_doc(reminder_obj.model_dump()))
    return reminder_obj

@api_router.get("/reminders", response_model=List[Reminder])
async def get_reminders(user_id: str = Depends(get_current_user)):
    reminders = await db.reminders.find({"user_id": user_id, "is_deleted": {"$ne": True}}, {"_id": 0}).sort("reminder_date", 1).to_list(1000)
    return [deserialize_doc(r) for r in reminders]

@api_router.get("/reminders/upcoming", response_model=List[Reminder])
async def get_upcoming_reminders(user_id: str = Depends(get_current_user)):
    """Get upcoming reminders (not completed, date <= 7 days from now)"""
    future_date = datetime.now(timezone.utc) + timedelta(days=7)
    reminders = await db.reminders.find({
        "user_id": user_id,
        "completed": False,
        "is_deleted": {"$ne": True},
        "reminder_date": {"$lte": future_date.isoformat()}
    }, {"_id": 0}).sort("reminder_date", 1).to_list(100)
    return [deserialize_doc(r) for r in reminders]

@api_router.put("/reminders/{reminder_id}/complete")
async def complete_reminder(reminder_id: str, user_id: str = Depends(get_current_user)):
    result = await db.reminders.update_one(
        {"id": reminder_id, "user_id": user_id},
        {"$set": {"completed": True}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Reminder not found")
    return {"message": "Reminder completed"}

@api_router.delete("/reminders/{reminder_id}")
async def delete_reminder(reminder_id: str, user_id: str = Depends(get_current_user)):
    # Soft delete
    result = await db.reminders.update_one(
        {"id": reminder_id, "user_id": user_id, "is_deleted": {"$ne": True}},
        {"$set": {"is_deleted": True, "deleted_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Reminder not found")
    return {"message": "Reminder moved to trash", "can_undo": True}

# ============ TARGETS ROUTES ============

@api_router.post("/targets", response_model=Target)
async def create_target(target: TargetCreate, user_id: str = Depends(get_current_user)):
    target_obj = Target(user_id=user_id, **target.model_dump())
    await db.targets.insert_one(serialize_doc(target_obj.model_dump()))
    return target_obj

@api_router.get("/targets", response_model=List[Target])
async def get_targets(user_id: str = Depends(get_current_user)):
    targets = await db.targets.find({"user_id": user_id}, {"_id": 0}).to_list(1000)
    return [deserialize_doc(t) for t in targets]

@api_router.put("/targets/{target_id}/progress")
async def update_target_progress(target_id: str, current_value: int, user_id: str = Depends(get_current_user)):
    result = await db.targets.update_one(
        {"id": target_id, "user_id": user_id},
        {"$set": {"current_value": current_value}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Target not found")
    return {"message": "Target updated"}

@api_router.delete("/targets/{target_id}")
async def delete_target(target_id: str, user_id: str = Depends(get_current_user)):
    result = await db.targets.delete_one({"id": target_id, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Target not found")
    return {"message": "Target deleted"}

# ============ SYSTEMS ROUTES ============

@api_router.post("/systems", response_model=System)
async def create_system(system: SystemCreate, user_id: str = Depends(get_current_user)):
    system_obj = System(user_id=user_id, **system.model_dump())
    await db.systems.insert_one(serialize_doc(system_obj.model_dump()))
    return system_obj

@api_router.get("/systems", response_model=List[System])
async def get_systems(user_id: str = Depends(get_current_user)):
    systems = await db.systems.find({"user_id": user_id}, {"_id": 0}).to_list(1000)
    return [deserialize_doc(s) for s in systems]

@api_router.put("/systems/{system_id}/execute")
async def execute_system(system_id: str, user_id: str = Depends(get_current_user)):
    """Mark system as executed"""
    result = await db.systems.update_one(
        {"id": system_id, "user_id": user_id},
        {"$set": {"last_executed": datetime.now(timezone.utc).isoformat()}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="System not found")
    return {"message": "System executed"}

@api_router.delete("/systems/{system_id}")
async def delete_system(system_id: str, user_id: str = Depends(get_current_user)):
    result = await db.systems.delete_one({"id": system_id, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="System not found")
    return {"message": "System deleted"}

# ============ RESUME BUILDER ROUTES ============

class ResumeGenerateRequest(BaseModel):
    job_id: Optional[str] = None
    template: str = "modern"  # modern, classic, minimal

@api_router.post("/resume/generate")
async def generate_resume(request: ResumeGenerateRequest, user_id: str = Depends(get_current_user)):
    """Generate a resume from user profile, optionally tailored to a specific job"""
    
    # Get user profile
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get job if specified
    job_context = None
    if request.job_id:
        job = await db.jobs.find_one({"id": request.job_id, "user_id": user_id}, {"_id": 0})
        if job:
            job_context = {
                "title": job["title"],
                "company": job["company"],
                "description": job.get("description", "")
            }
    
    # Build resume structure
    resume = {
        "personal_info": {
            "name": user.get("name", ""),
            "email": user.get("email", ""),
            "location": user.get("location_preference", ""),
            "years_experience": user.get("years_of_experience", 0)
        },
        "summary": user.get("resume_summary", ""),
        "skills": user.get("skills", []),
        "projects": user.get("projects", []),
        "education": user.get("education", []),
        "work_authorization": user.get("work_authorization", ""),
        "template": request.template,
        "generated_for_job": job_context,
        "generated_at": datetime.now(timezone.utc).isoformat()
    }
    
    return resume

@api_router.post("/resume/tailor")
async def tailor_resume_with_ai(request: ResumeGenerateRequest, user_id: str = Depends(get_current_user)):
    """Use AI to tailor resume for specific job"""
    
    # Get user profile
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get user's LLM config
    llm_config = await db.llm_configs.find_one({"user_id": user_id})
    
    if not llm_config:
        raise HTTPException(status_code=400, detail="Please configure your LLM settings first")
    
    # Get job details
    job = None
    if request.job_id:
        job = await db.jobs.find_one({"id": request.job_id, "user_id": user_id}, {"_id": 0})
    
    if not job or not job.get("description"):
        raise HTTPException(status_code=400, detail="Job description is required for AI tailoring")
    
    try:
        # Build context
        user_context = f"""
Name: {user.get('name', '')}
Experience: {user.get('years_of_experience', 0)} years
Skills: {', '.join(user.get('skills', []))}
Summary: {user.get('resume_summary', '')}
Projects: {chr(10).join(user.get('projects', [])[:5])}
Education: {chr(10).join(user.get('education', []))}
"""
        
        job_context = f"""
Job Title: {job['title']}
Company: {job['company']}
Description: {job.get('description', '')[:1000]}
"""
        
        # Call AI
        model_name = llm_config['model']
        if llm_config['provider'] == 'openai_compatible':
            model_prefix = "openai/"
        elif llm_config['provider'] == 'openrouter':
            model_prefix = "openrouter/"
            if '/' not in model_name:
                model_name = f"openai/{model_name}"
        else:
            model_prefix = f"{llm_config['provider']}/"
        
        response = await acompletion(
            model=f"{model_prefix}{model_name}",
            messages=[
                {"role": "system", "content": "You are a professional resume writer. Provide specific, actionable suggestions to tailor a resume for a job. Be concise and focus on impact."},
                {"role": "user", "content": f"User Profile:\n{user_context}\n\nTarget Job:\n{job_context}\n\nProvide 5 specific suggestions to tailor this resume for maximum impact. Focus on: 1) Which skills to emphasize 2) How to reframe experience 3) Keywords to include 4) Projects to highlight 5) Summary adjustments"}
            ],
            api_key=llm_config.get('api_key') or 'dummy',
            base_url=llm_config.get('base_url')
        )
        
        suggestions = response.choices[0].message.content
        
        return {
            "suggestions": suggestions,
            "job": {
                "title": job["title"],
                "company": job["company"]
            }
        }
    
    except Exception as e:
        logger.error(f"Resume tailoring error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI tailoring error: {str(e)}")

@api_router.post("/resume/upload")
async def upload_resume(file: UploadFile = File(...), user_id: str = Depends(get_current_user)):
    """Upload resume file (PDF or DOCX) and parse it with AI"""
    
    # Validate file type
    allowed_types = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword']
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are supported")
    
    try:
        # Read file
        file_bytes = await file.read()
        
        # Extract text based on file type
        if file.content_type == 'application/pdf':
            resume_text = extract_text_from_pdf(file_bytes)
        else:  # DOCX
            resume_text = extract_text_from_docx(file_bytes)
        
        if not resume_text:
            raise HTTPException(status_code=400, detail="Could not extract text from file")
        
        # Parse with rule-based parser first
        parsed_data = parse_resume_with_ai(resume_text)
        
        # Get user's LLM config for enhanced parsing
        llm_config = await db.llm_configs.find_one({"user_id": user_id})
        
        if llm_config:
            try:
                # Use AI for better parsing
                model_name = llm_config['model']
                if llm_config['provider'] == 'openai_compatible':
                    model_prefix = "openai/"
                elif llm_config['provider'] == 'openrouter':
                    model_prefix = "openrouter/"
                    if '/' not in model_name:
                        model_name = f"openai/{model_name}"
                else:
                    model_prefix = f"{llm_config['provider']}/"
                
                response = await acompletion(
                    model=f"{model_prefix}{model_name}",
                    messages=[
                        {"role": "system", "content": "You are a resume parser. Extract structured data from resumes. Respond ONLY with valid JSON, no markdown or extra text."},
                        {"role": "user", "content": f"Parse this resume and return JSON with fields: name, email, phone, location, summary (2-3 sentences), skills (array), years_of_experience (number), education (array), projects (array of project descriptions), work_authorization. Resume text:\n\n{resume_text[:3000]}"}
                    ],
                    api_key=llm_config.get('api_key') or 'dummy',
                    base_url=llm_config.get('base_url')
                )
                
                ai_response = response.choices[0].message.content
                
                # Try to parse AI response as JSON
                import json
                # Remove markdown code blocks if present
                ai_response = ai_response.replace('```json', '').replace('```', '').strip()
                ai_parsed = json.loads(ai_response)
                
                # Merge AI results with rule-based results (AI takes precedence)
                for key in ai_parsed:
                    if ai_parsed[key] and (not parsed_data.get(key) or key in ['summary', 'projects']):
                        parsed_data[key] = ai_parsed[key]
                
            except Exception as e:
                logger.warning(f"AI parsing failed, using rule-based: {e}")
                # Continue with rule-based parsing
        
        return {
            "success": True,
            "parsed_data": parsed_data,
            "raw_text_length": len(resume_text),
            "message": "Resume parsed successfully. Review and save to profile."
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Resume upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing resume: {str(e)}")

# ============ TRASH & RESTORE ROUTES ============

@api_router.get("/trash")
async def get_trash(user_id: str = Depends(get_current_user)):
    """Get all soft-deleted items from all collections"""
    deleted_items = {
        "jobs": [],
        "companies": [],
        "contacts": [],
        "todos": [],
        "knowledge": [],
        "reminders": []
    }
    
    # Get deleted jobs
    jobs = await db.jobs.find({"user_id": user_id, "is_deleted": True}, {"_id": 0}).to_list(100)
    deleted_items["jobs"] = [{"id": j["id"], "title": j["title"], "company": j["company"], "deleted_at": j.get("deleted_at"), "type": "job"} for j in jobs]
    
    # Get deleted companies
    companies = await db.companies.find({"user_id": user_id, "is_deleted": True}, {"_id": 0}).to_list(100)
    deleted_items["companies"] = [{"id": c["id"], "name": c["name"], "deleted_at": c.get("deleted_at"), "type": "company"} for c in companies]
    
    # Get deleted contacts
    contacts = await db.contacts.find({"user_id": user_id, "is_deleted": True}, {"_id": 0}).to_list(100)
    deleted_items["contacts"] = [{"id": c["id"], "name": c["name"], "deleted_at": c.get("deleted_at"), "type": "contact"} for c in contacts]
    
    # Get deleted todos
    todos = await db.todos.find({"user_id": user_id, "is_deleted": True}, {"_id": 0}).to_list(100)
    deleted_items["todos"] = [{"id": t["id"], "title": t["title"], "deleted_at": t.get("deleted_at"), "type": "todo"} for t in todos]
    
    # Get deleted knowledge
    knowledge = await db.knowledge.find({"user_id": user_id, "is_deleted": True}, {"_id": 0}).to_list(100)
    deleted_items["knowledge"] = [{"id": k["id"], "title": k["title"], "deleted_at": k.get("deleted_at"), "type": "knowledge"} for k in knowledge]
    
    # Get deleted reminders
    reminders = await db.reminders.find({"user_id": user_id, "is_deleted": True}, {"_id": 0}).to_list(100)
    deleted_items["reminders"] = [{"id": r["id"], "message": r["message"], "deleted_at": r.get("deleted_at"), "type": "reminder"} for r in reminders]
    
    return deleted_items

@api_router.post("/trash/restore/{item_type}/{item_id}")
async def restore_item(item_type: str, item_id: str, user_id: str = Depends(get_current_user)):
    """Restore a soft-deleted item"""
    collection_map = {
        "job": "jobs",
        "company": "companies",
        "contact": "contacts",
        "todo": "todos",
        "knowledge": "knowledge",
        "reminder": "reminders"
    }
    
    collection_name = collection_map.get(item_type)
    if not collection_name:
        raise HTTPException(status_code=400, detail="Invalid item type")
    
    collection = db[collection_name]
    result = await collection.update_one(
        {"id": item_id, "user_id": user_id, "is_deleted": True},
        {"$set": {"is_deleted": False, "deleted_at": None}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail=f"{item_type.title()} not found in trash")
    
    return {"message": f"{item_type.title()} restored successfully"}

@api_router.delete("/trash/{item_type}/{item_id}")
async def permanently_delete_item(item_type: str, item_id: str, user_id: str = Depends(get_current_user)):
    """Permanently delete an item from trash"""
    collection_map = {
        "job": "jobs",
        "company": "companies",
        "contact": "contacts",
        "todo": "todos",
        "knowledge": "knowledge",
        "reminder": "reminders"
    }
    
    collection_name = collection_map.get(item_type)
    if not collection_name:
        raise HTTPException(status_code=400, detail="Invalid item type")
    
    collection = db[collection_name]
    result = await collection.delete_one({"id": item_id, "user_id": user_id, "is_deleted": True})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail=f"{item_type.title()} not found in trash")
    
    return {"message": f"{item_type.title()} permanently deleted"}

@api_router.delete("/trash/empty")
async def empty_trash(user_id: str = Depends(get_current_user)):
    """Empty all trash for the user"""
    collections = ["jobs", "companies", "contacts", "todos", "knowledge", "reminders"]
    
    total_deleted = 0
    for coll_name in collections:
        collection = db[coll_name]
        result = await collection.delete_many({"user_id": user_id, "is_deleted": True})
        total_deleted += result.deleted_count
    
    return {"message": f"Permanently deleted {total_deleted} items"}

# ============ ANALYTICS ROUTES ============

@api_router.get("/analytics/dashboard")
async def get_dashboard_analytics(user_id: str = Depends(get_current_user)):
    jobs = await db.jobs.find({"user_id": user_id}, {"_id": 0}).to_list(1000)
    
    stats = {
        "total": len(jobs),
        "applied": len([j for j in jobs if j['status'] == 'applied']),
        "interview": len([j for j in jobs if j['status'] == 'interview']),
        "offer": len([j for j in jobs if j['status'] == 'offer']),
        "rejected": len([j for j in jobs if j['status'] == 'rejected']),
        "ghosted": len([j for j in jobs if j['status'] == 'ghosted']),
        "pending": len([j for j in jobs if j['status'] == 'pending'])
    }
    
    return stats

# ============ AI-POWERED FEATURES ROUTES ============

class JobDescriptionParse(BaseModel):
    description: str

class InterviewPrepRequest(BaseModel):
    job_id: str

class EmailParseRequest(BaseModel):
    email_content: str

class ScraperRequest(BaseModel):
    url: str

class SearchJobsRequest(BaseModel):
    query: str
    location: Optional[str] = ""

class KnowledgeSearchRequest(BaseModel):
    query: str

@api_router.post("/ai/parse-job-description")
async def parse_job_desc(request: JobDescriptionParse, user_id: str = Depends(get_current_user)):
    """Parse job description to extract skills, requirements, etc."""
    try:
        result = parse_job_description(request.description)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/ai/interview-prep")
async def get_interview_prep(request: InterviewPrepRequest, user_id: str = Depends(get_current_user)):
    """Generate interview preparation questions for a job"""
    try:
        job = await db.jobs.find_one({"id": request.job_id, "user_id": user_id})
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        parsed = parse_job_description(job.get('description', ''))
        questions = generate_interview_questions(
            job['title'],
            job.get('description', ''),
            parsed['skills']
        )
        
        return {
            "job_title": job['title'],
            "company": job['company'],
            "questions": questions,
            "skills_to_prepare": parsed['skills'][:10]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/ai/parse-email")
async def parse_email(request: EmailParseRequest, user_id: str = Depends(get_current_user)):
    """Parse email content to extract job information"""
    try:
        result = parse_email_for_job(request.email_content)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/ai/scrape-job")
async def scrape_job(request: ScraperRequest, user_id: str = Depends(get_current_user)):
    """Scrape job details from a URL"""
    try:
        result = await scrape_job_from_url(request.url)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/ai/search-jobs")
async def search_jobs_endpoint(request: SearchJobsRequest, user_id: str = Depends(get_current_user)):
    """Search for jobs across multiple platforms"""
    try:
        results = await search_jobs(request.query, request.location)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/ai/knowledge-search")
async def knowledge_search(request: KnowledgeSearchRequest, user_id: str = Depends(get_current_user)):
    """Semantic search in knowledge base"""
    try:
        knowledge_items = await db.knowledge.find({"user_id": user_id}, {"_id": 0}).to_list(1000)
        if not knowledge_items:
            return []
        
        results = search_knowledge_by_embedding(request.query, knowledge_items)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/ai/learning-path/{job_id}")
async def get_learning_path(job_id: str, user_id: str = Depends(get_current_user)):
    """Get learning path for a specific job"""
    try:
        job = await db.jobs.find_one({"id": job_id, "user_id": user_id})
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        parsed = parse_job_description(job.get('description', ''))
        learning_path = extract_learning_path(parsed['skills'])
        
        return {
            "job_title": job['title'],
            "company": job['company'],
            **learning_path
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============ ROOT & MIDDLEWARE ============

@api_router.get("/")
async def root():
    return {"message": "CareerFlow API"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
