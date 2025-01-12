from fastapi import APIRouter, Depends, HTTPException, Request
from typing import List, Any
from datetime import datetime, timezone
from pydantic import BaseModel, ConfigDict, Field
from .service import ConversationService
from .models import Conversation, ConversationSummary
from ..chat.models import Message
import logging
import json

logger = logging.getLogger(__name__)

# Pydantic models for API
class MessageSchema(BaseModel):
    role: str
    content: str | dict | list[dict]  # Allow structured content
    model: str | None = None
    timestamp: datetime | None = None
    model_config = ConfigDict(from_attributes=True)

class ConversationSummarySchema(BaseModel):
    conversation_id: str
    conversation_name: str
    last_updated: datetime
    model_config = ConfigDict(from_attributes=True)

class ConversationSchema(BaseModel):
    conversation_id: str
    conversation_name: str | None = None  # Make name optional
    messages: List[MessageSchema]
    last_updated: datetime | None = None  # Make timestamp optional
    model_config = ConfigDict(from_attributes=True)

class GenerateNameRequest(BaseModel):
    message: str

class GenerateNameResponse(BaseModel):
    name: str

# Router setup
router = APIRouter(prefix="/api", tags=["conversations"])

async def get_conversation_service() -> ConversationService:
    # This will be overridden in main.py
    raise NotImplementedError("Conversation service not configured")

@router.get("/conversations", response_model=List[ConversationSummarySchema])
async def list_conversations(
    service: ConversationService = Depends(get_conversation_service)
) -> List[ConversationSummarySchema]:
    """Get all conversations"""
    logger.info("Fetching all conversations")
    return service.get_conversations()

@router.get("/conversations/{conversation_id}", response_model=ConversationSchema)
async def get_conversation(
    conversation_id: str,
    service: ConversationService = Depends(get_conversation_service)
) -> ConversationSchema:
    """Get a specific conversation"""
    logger.info(f"Fetching conversation: {conversation_id}")
    conversation = service.get_conversation(conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversation

@router.post("/conversations", response_model=ConversationSchema)
async def save_conversation(
    request: Request,
    conversation: ConversationSchema,
    service: ConversationService = Depends(get_conversation_service)
) -> ConversationSchema:
    """Save a conversation"""
    try:
        # Convert API model to domain model
        current_time = datetime.now(timezone.utc)
        domain_conversation = Conversation(
            conversation_id=conversation.conversation_id,
            conversation_name=conversation.conversation_name or "New Conversation",
            messages=[
                Message(
                    role=msg.role,
                    content=msg.content if isinstance(msg.content, str) else json.dumps(msg.content),
                    model=msg.model,
                    timestamp=msg.timestamp or current_time
                )
                for msg in conversation.messages
            ],
            last_updated=current_time
        )
        
        service.save_conversation(domain_conversation)
        
        # Return updated conversation with current timestamp
        conversation.last_updated = current_time
        return conversation
    except Exception as e:
        logger.error(f"Error saving conversation: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate_name", response_model=GenerateNameResponse)
async def generate_name(
    request: GenerateNameRequest,
    service: ConversationService = Depends(get_conversation_service)
) -> GenerateNameResponse:
    """Generate a name for a conversation"""
    logger.info("Generating conversation name")
    name = service.generate_name(request.message)
    return GenerateNameResponse(name=name) 