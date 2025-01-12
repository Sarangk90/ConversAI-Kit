from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from typing import List
from .schemas import ChatRequestSchema, ChatResponseSchema, MessageSchema
from .service import ChatService
from .models import Message
from datetime import datetime

router = APIRouter(prefix="/chat", tags=["chat"])

def get_chat_service() -> ChatService:
    # This will be properly initialized in main.py
    pass

@router.post("/", response_model=ChatResponseSchema)
async def chat(
    request: ChatRequestSchema,
    chat_service: ChatService = Depends(get_chat_service)
) -> ChatResponseSchema:
    # Convert request messages to domain models
    messages = [
        Message(
            role=msg.role,
            content=msg.content,
            model=msg.model,
            timestamp=msg.timestamp or datetime.utcnow()
        ) for msg in request.messages
    ]
    
    response = await chat_service.process_message(
        message=request.messages[-1].content,
        conversation_messages=messages[:-1]
    )
    
    return ChatResponseSchema(
        reply=response.content,
        model=response.model,
        timestamp=response.timestamp
    )

@router.post("/stream")
async def stream_chat(
    request: ChatRequestSchema,
    chat_service: ChatService = Depends(get_chat_service)
):
    messages = [
        Message(
            role=msg.role,
            content=msg.content,
            model=msg.model,
            timestamp=msg.timestamp or datetime.utcnow()
        ) for msg in request.messages
    ]

    async def generate():
        async for chunk in chat_service.stream_response(
            message=request.messages[-1].content,
            conversation_messages=messages[:-1]
        ):
            yield f"data: {chunk}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    ) 