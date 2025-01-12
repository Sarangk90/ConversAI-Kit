from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional, Union, Dict
from datetime import datetime, timezone
from contextlib import asynccontextmanager
import uvicorn
import json

# Local imports
from .database import get_conversations, get_conversation, save_conversation, init_db
from .chat import generate_conversation_name, get_bot_response, get_bot_response_stream

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database on startup
    init_db()
    yield

# Create FastAPI app
app = FastAPI(
    title="ConversAI API",
    version="1.0.0",
    description="API for ConversAI chat application",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with actual frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class MessageContent(BaseModel):
    type: str
    text: Optional[str] = None
    image_url: Optional[Dict] = None

class Message(BaseModel):
    role: str
    content: Union[str, List[MessageContent]]
    model: Optional[str] = None

class ConversationListItem(BaseModel):
    conversation_id: str
    conversation_name: str
    last_updated: str

class ConversationResponse(BaseModel):
    conversation_id: str
    conversation_name: str
    messages: List[Message]
    last_updated: str

class SaveConversationRequest(BaseModel):
    conversation_id: str
    conversation_name: str
    messages: List[Message]

class SaveConversationResponse(BaseModel):
    message: str = "Conversation saved successfully"
    conversation_id: str
    conversation_name: str
    last_updated: str

class GenerateNameRequest(BaseModel):
    message: str

class GenerateNameResponse(BaseModel):
    name: str

class ChatRequest(BaseModel):
    conversation_id: str
    messages: List[Message]
    model: str = "gpt-4o"

class ChatResponse(BaseModel):
    reply: str

# API Endpoints
@app.get("/api/conversations", response_model=List[ConversationListItem])
async def list_conversations():
    try:
        conversations = get_conversations()
        return conversations
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/conversations/{conversation_id}", response_model=ConversationResponse)
async def get_conversation_by_id(conversation_id: str):
    try:
        conversation = get_conversation(conversation_id)
        if conversation is None:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        # Parse messages from JSON string
        messages_data = json.loads(conversation["messages"])
        messages = []
        for msg_data in messages_data:
            if isinstance(msg_data["content"], list):
                content_list = []
                for content_item in msg_data["content"]:
                    if isinstance(content_item, dict):
                        content_list.append(MessageContent(**content_item))
                    else:
                        content_list.append(MessageContent(type="text", text=str(content_item)))
                msg = Message(
                    role=msg_data["role"],
                    content=content_list,
                    model=msg_data.get("model")
                )
            else:
                msg = Message(
                    role=msg_data["role"],
                    content=msg_data["content"],
                    model=msg_data.get("model")
                )
            messages.append(msg)
        
        return ConversationResponse(
            conversation_id=conversation["conversation_id"],
            conversation_name=conversation["conversation_name"],
            messages=messages,
            last_updated=conversation["last_updated"]
        )
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/conversations", response_model=SaveConversationResponse, status_code=201)
async def save_conversation_route(conversation: SaveConversationRequest):
    try:
        messages_json = json.dumps([msg.model_dump() for msg in conversation.messages])
        last_updated = datetime.now(timezone.utc).isoformat()
        
        save_conversation(
            conversation.conversation_id,
            conversation.conversation_name,
            messages_json,
            last_updated
        )
        
        return SaveConversationResponse(
            conversation_id=conversation.conversation_id,
            conversation_name=conversation.conversation_name,
            last_updated=last_updated
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate_name", response_model=GenerateNameResponse)
async def generate_name(request: GenerateNameRequest):
    try:
        conversation_name = generate_conversation_name(request.message)
        if not conversation_name or "error" in conversation_name.lower():
            raise HTTPException(status_code=500, detail="Failed to generate conversation name")
        return GenerateNameResponse(name=conversation_name)
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        if not request.messages:
            raise HTTPException(status_code=400, detail="Invalid messages format")
        
        last_message = request.messages[-1]
        user_message = last_message.content if isinstance(last_message.content, str) else last_message.content[0].text
        bot_reply = get_bot_response(user_message)
        
        return ChatResponse(reply=bot_reply)
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/stream_chat")
async def stream_chat(request: ChatRequest):
    try:
        if not request.messages:
            raise HTTPException(status_code=400, detail="Invalid messages format")
        
        processed_messages = [
            {
                "role": msg.role,
                "content": msg.content,
                **({"model": msg.model} if msg.model else {})
            }
            for msg in request.messages
        ]
        
        async def generate():
            try:
                for chunk in get_bot_response_stream(processed_messages, request.model):
                    yield f"data: {json.dumps(chunk)}\n\n"
            except Exception as e:
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
        
        return StreamingResponse(
            generate(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"
            }
        )
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("fastapi_app:app", host="0.0.0.0", port=5001, reload=True) 