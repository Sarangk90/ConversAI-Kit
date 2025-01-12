from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from typing import List, Union, Dict
from .schemas import ChatRequestSchema, ChatResponseSchema, MessageSchema, TextContentSchema, ImageContentSchema
from .service import ChatService
from .models import Message, TextContent, ImageContent
from datetime import datetime
import logging
import json

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["chat"])

async def get_chat_service() -> ChatService:
    # This will be overridden in main.py
    raise NotImplementedError("Chat service not configured")

def extract_message_content(message: MessageSchema) -> tuple[str, List[str]]:
    """Extract text and image URLs from a message"""
    if isinstance(message.content, str):
        return message.content, []
    
    text = ""
    images = []
    
    for content in message.content:
        if content.type == "text":
            text = content.text
        elif content.type == "image_url":
            images.append(content.image_url.url)
    
    return text, images

@router.post("/", response_model=ChatResponseSchema)
async def chat(
    request: ChatRequestSchema,
    chat_service: ChatService = Depends(get_chat_service)
) -> ChatResponseSchema:
    # Convert request messages to domain models
    messages = []
    for msg in request.messages[:-1]:  # All messages except the last one
        if isinstance(msg.content, str):
            content = msg.content
        else:
            content = [
                TextContent(text=c.text) if c.type == "text"
                else ImageContent(image_url={"url": c.image_url.url})
                for c in msg.content
            ]
        messages.append(Message(
            role=msg.role,
            content=content,
            model=msg.model,
            timestamp=msg.timestamp or datetime.utcnow()
        ))
    
    # Extract content from the last message
    text, images = extract_message_content(request.messages[-1])
    
    response = await chat_service.process_message(
        text=text,
        images=images,
        conversation_messages=messages
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
    # Convert request messages to domain models
    messages = []
    for msg in request.messages[:-1]:  # All messages except the last one
        if isinstance(msg.content, str):
            content = msg.content
        else:
            content = [
                TextContent(text=c.text) if c.type == "text"
                else ImageContent(image_url={"url": c.image_url.url})
                for c in msg.content
            ]
        messages.append(Message(
            role=msg.role,
            content=content,
            model=msg.model,
            timestamp=msg.timestamp or datetime.utcnow()
        ))
    
    # Extract content from the last message
    text, images = extract_message_content(request.messages[-1])

    async def generate():
        try:
            async for chunk in chat_service.stream_response(
                text=text,
                images=images,
                conversation_messages=messages
            ):
                yield f"data: {json.dumps({'content': chunk})}\n\n"
        except Exception as e:
            logger.error(f"Error in stream generation: {str(e)}")
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