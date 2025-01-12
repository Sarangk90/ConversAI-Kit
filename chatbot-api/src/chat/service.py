from dataclasses import dataclass
from typing import List, AsyncIterator
from .models import Message, ChatResponse
from .provider import AIProvider

@dataclass
class ChatService:
    """Service for handling chat operations"""
    ai_provider: AIProvider

    async def process_message(self, message: str, conversation_messages: List[Message] = None) -> ChatResponse:
        """Process a single message and return response"""
        messages = conversation_messages or []
        messages.append(Message(role="user", content=message))
        
        return await self.ai_provider.generate_response(messages)

    async def stream_response(self, message: str, conversation_messages: List[Message] = None) -> AsyncIterator[str]:
        """Stream response for a message"""
        messages = conversation_messages or []
        messages.append(Message(role="user", content=message))
        
        async for chunk in self.ai_provider.generate_stream(messages):
            yield chunk 