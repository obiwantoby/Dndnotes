from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
import secrets
import re

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Basic authentication
security = HTTPBasic()

# Simple auth function
def authenticate(credentials: HTTPBasicCredentials = Depends(security)):
    correct_username = secrets.compare_digest(credentials.username, "admin")
    correct_password = secrets.compare_digest(credentials.password, "admin")
    if not (correct_username and correct_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username

# Pydantic Models
class NPCCreate(BaseModel):
    name: str
    status: str = "Unknown"
    race: str = ""
    class_role: str = ""
    appearance: str = ""
    quirks_mannerisms: str = ""
    background: str = ""
    notes: str = ""

class NPCUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    race: Optional[str] = None
    class_role: Optional[str] = None
    appearance: Optional[str] = None
    quirks_mannerisms: Optional[str] = None
    background: Optional[str] = None
    notes: Optional[str] = None

class NPC(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    status: str = "Unknown"
    race: str = ""
    class_role: str = ""
    appearance: str = ""
    quirks_mannerisms: str = ""
    background: str = ""
    notes: str = ""
    history: List[Dict[str, Any]] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class SessionCreate(BaseModel):
    title: str
    content: str = ""

class SessionUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None

class Session(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    content: str = ""
    npcs_mentioned: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class NPCExtraction(BaseModel):
    session_id: str
    extracted_text: str
    npc_name: str

# Ollama LLM Placeholder Class
class OllamaLLMService:
    """
    Placeholder class for Ollama LLM integration.
    Currently uses rule-based logic, but designed to be easily replaced
    with actual Ollama API calls.
    """
    
    def __init__(self):
        self.enabled = False  # Set to True when Ollama is configured
        
    async def extract_npcs_from_text(self, text: str) -> List[str]:
        """
        Placeholder for NPC extraction using LLM.
        Currently uses simple pattern matching.
        """
        if self.enabled:
            # TODO: Implement actual Ollama API call
            # response = await ollama_client.chat(
            #     model="llama2", 
            #     messages=[{"role": "user", "content": f"Extract NPC names from: {text}"}]
            # )
            pass
        
        # Simple rule-based extraction for now
        # Look for capitalized names that might be NPCs
        patterns = [
            r'\b([A-Z][a-z]+ (?:the )?[A-Z][a-z]+)\b',  # "Thorin the Blacksmith"
            r'\b([A-Z][a-z]+ [A-Z][a-z]+)\b',           # "John Smith"
            r'NPC:\s*([A-Za-z\s]+)',                     # "NPC: Character Name"
        ]
        
        extracted_names = []
        for pattern in patterns:
            matches = re.findall(pattern, text)
            extracted_names.extend(matches)
        
        # Remove duplicates and common words
        common_words = {'The Game', 'The Party', 'The Group', 'Game Master', 'Dungeon Master'}
        return [name.strip() for name in set(extracted_names) if name.strip() not in common_words]
    
    async def summarize_interaction(self, interaction_text: str) -> str:
        """
        Placeholder for interaction summarization using LLM.
        """
        if self.enabled:
            # TODO: Implement actual Ollama summarization
            pass
        
        # Simple summarization for now
        if len(interaction_text) > 100:
            return interaction_text[:97] + "..."
        return interaction_text

# Initialize LLM service
llm_service = OllamaLLMService()

# API Routes
@api_router.get("/")
async def root():
    return {"message": "D&D Note-Taking Tool API"}

@api_router.get("/auth/check")
async def check_auth(username: str = Depends(authenticate)):
    return {"authenticated": True, "username": username}

# Session routes
@api_router.post("/sessions", response_model=Session)
async def create_session(session_data: SessionCreate, username: str = Depends(authenticate)):
    session_dict = session_data.dict()
    session_obj = Session(**session_dict)
    await db.sessions.insert_one(session_obj.dict())
    return session_obj

@api_router.get("/sessions", response_model=List[Session])
async def get_sessions(username: str = Depends(authenticate)):
    sessions = await db.sessions.find().sort("created_at", -1).to_list(1000)
    return [Session(**session) for session in sessions]

@api_router.get("/sessions/{session_id}", response_model=Session)
async def get_session(session_id: str, username: str = Depends(authenticate)):
    session = await db.sessions.find_one({"id": session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return Session(**session)

@api_router.put("/sessions/{session_id}", response_model=Session)
async def update_session(session_id: str, session_data: SessionUpdate, username: str = Depends(authenticate)):
    update_data = {k: v for k, v in session_data.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    result = await db.sessions.update_one(
        {"id": session_id}, 
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")
    
    updated_session = await db.sessions.find_one({"id": session_id})
    return Session(**updated_session)

@api_router.delete("/sessions/{session_id}")
async def delete_session(session_id: str, username: str = Depends(authenticate)):
    result = await db.sessions.delete_one({"id": session_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"message": "Session deleted successfully"}

# NPC routes
@api_router.post("/npcs", response_model=NPC)
async def create_npc(npc_data: NPCCreate, username: str = Depends(authenticate)):
    npc_dict = npc_data.dict()
    npc_obj = NPC(**npc_dict)
    await db.npcs.insert_one(npc_obj.dict())
    return npc_obj

@api_router.get("/npcs", response_model=List[NPC])
async def get_npcs(username: str = Depends(authenticate)):
    npcs = await db.npcs.find().sort("name", 1).to_list(1000)
    return [NPC(**npc) for npc in npcs]

@api_router.get("/npcs/{npc_id}", response_model=NPC)
async def get_npc(npc_id: str, username: str = Depends(authenticate)):
    npc = await db.npcs.find_one({"id": npc_id})
    if not npc:
        raise HTTPException(status_code=404, detail="NPC not found")
    return NPC(**npc)

@api_router.put("/npcs/{npc_id}", response_model=NPC)
async def update_npc(npc_id: str, npc_data: NPCUpdate, username: str = Depends(authenticate)):
    update_data = {k: v for k, v in npc_data.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    result = await db.npcs.update_one(
        {"id": npc_id}, 
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="NPC not found")
    
    updated_npc = await db.npcs.find_one({"id": npc_id})
    return NPC(**updated_npc)

@api_router.delete("/npcs/{npc_id}")
async def delete_npc(npc_id: str, username: str = Depends(authenticate)):
    result = await db.npcs.delete_one({"id": npc_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="NPC not found")
    return {"message": "NPC deleted successfully"}

# NPC extraction route
@api_router.post("/extract-npc")
async def extract_npc(extraction_data: NPCExtraction, username: str = Depends(authenticate)):
    # Check if NPC already exists
    existing_npc = await db.npcs.find_one({"name": extraction_data.npc_name})
    
    if existing_npc:
        # Add interaction to existing NPC
        interaction_entry = {
            "session_id": extraction_data.session_id,
            "interaction": extraction_data.extracted_text,
            "timestamp": datetime.utcnow()
        }
        
        await db.npcs.update_one(
            {"name": extraction_data.npc_name},
            {"$push": {"history": interaction_entry}, "$set": {"updated_at": datetime.utcnow()}}
        )
        
        updated_npc = await db.npcs.find_one({"name": extraction_data.npc_name})
        return {"action": "updated", "npc": NPC(**updated_npc)}
    else:
        # Create new NPC
        new_npc = NPC(
            name=extraction_data.npc_name,
            notes=f"First mentioned: {extraction_data.extracted_text}",
            history=[{
                "session_id": extraction_data.session_id,
                "interaction": extraction_data.extracted_text,
                "timestamp": datetime.utcnow()
            }]
        )
        
        await db.npcs.insert_one(new_npc.dict())
        return {"action": "created", "npc": new_npc}

# Auto-suggest NPCs from text
@api_router.post("/suggest-npcs")
async def suggest_npcs(text_data: dict, username: str = Depends(authenticate)):
    text = text_data.get("text", "")
    suggested_names = await llm_service.extract_npcs_from_text(text)
    return {"suggested_npcs": suggested_names}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
