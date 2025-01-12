import pytest
from datetime import datetime
from typing import List, AsyncIterator
from src.chat.models import Message, ChatResponse
from src.chat.provider import AIProvider
from src.chat.service import ChatService

# Mock AI Provider for testing
class MockAIProvider(AIProvider):
    async def generate_response(self, messages: List[Message]) -> ChatResponse:
        return ChatResponse(
            content="Mock response",
            model="mock-model",
            timestamp=datetime.utcnow()
        )
    
    async def generate_stream(self, messages: List[Message]) -> AsyncIterator[str]:
        chunks = ["Mock ", "streaming ", "response"]
        for chunk in chunks:
            yield chunk

@pytest.fixture
def chat_service():
    return ChatService(ai_provider=MockAIProvider())

@pytest.mark.asyncio
async def test_process_message(chat_service):
    # Test processing a single message
    response = await chat_service.process_message("Hello")
    
    assert response.content == "Mock response"
    assert response.model == "mock-model"
    assert isinstance(response.timestamp, datetime)

@pytest.mark.asyncio
async def test_process_message_with_history(chat_service):
    # Test processing a message with conversation history
    history = [
        Message(role="user", content="Previous message"),
        Message(role="assistant", content="Previous response")
    ]
    
    response = await chat_service.process_message(
        "Hello",
        conversation_messages=history
    )
    
    assert response.content == "Mock response"
    assert response.model == "mock-model"

@pytest.mark.asyncio
async def test_stream_response(chat_service):
    # Test streaming response
    chunks = []
    async for chunk in chat_service.stream_response("Hello"):
        chunks.append(chunk)
    
    assert chunks == ["Mock ", "streaming ", "response"] 