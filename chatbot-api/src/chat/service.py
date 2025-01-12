from dataclasses import dataclass
from typing import List, AsyncIterator
from .models import Message, ChatResponse, TextContent, ImageContent
from .provider import AIProvider

@dataclass
class ChatService:
    """Service for handling chat operations"""
    ai_provider: AIProvider

    async def process_message(
        self, 
        text: str = "", 
        images: List[str] = None, 
        conversation_messages: List[Message] = None
    ) -> ChatResponse:
        """Process a message with optional images and return response"""
        messages = conversation_messages or []
        
        # Create message content
        if images:
            content = [
                TextContent(text=text),
                *[ImageContent(image_url={"url": img}) for img in images]
            ]
        else:
            content = text
            
        messages.append(Message(role="user", content=content))
        return self.ai_provider.generate_response(messages)

    async def stream_response(
        self, 
        text: str = "", 
        images: List[str] = None, 
        conversation_messages: List[Message] = None
    ) -> AsyncIterator[str]:
        """Stream response for a message with optional images"""
        messages = conversation_messages or []
        
        # Create message content
        if images:
            content = [
                TextContent(text=text),
                *[ImageContent(image_url={"url": img}) for img in images]
            ]
        else:
            content = text
            
        messages.append(Message(role="user", content=content))
        
        async for chunk in self.ai_provider.generate_stream(messages):
            yield chunk 