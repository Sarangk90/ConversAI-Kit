from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from datetime import datetime
from src.database import get_conversations

# Create FastAPI app
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update this with your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for request/response validation
class ConversationListItem(BaseModel):
    conversation_id: str
    conversation_name: str
    last_updated: str

@app.get("/api/conversations", response_model=List[ConversationListItem])
async def list_conversations():
    try:
        conversations = get_conversations()
        return conversations
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 