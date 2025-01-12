import pytest
from datetime import datetime, timezone
from typing import List, AsyncIterator
from src.chat.models import Message, ChatResponse, TextContent, ImageContent
from src.chat.provider import AIProvider
from src.chat.service import ChatService

# Mock AI Provider for testing
class MockAIProvider(AIProvider):
    def generate_response(self, messages: List[Message]) -> ChatResponse:
        return ChatResponse(
            content="Mock response",
            model="mock-model",
            timestamp=datetime.now(timezone.utc)
        )
    
    async def generate_stream(self, messages: List[Message]) -> AsyncIterator[str]:
        chunks = ["Mock ", "streaming ", "response"]
        for chunk in chunks:
            yield chunk

@pytest.fixture
def chat_service():
    return ChatService(ai_provider=MockAIProvider())

@pytest.mark.asyncio
async def test_process_text_message(chat_service):
    # Test processing a text-only message
    response = await chat_service.process_message(text="Hello")
    
    assert response.content == "Mock response"
    assert response.model == "mock-model"
    assert isinstance(response.timestamp, datetime)
    assert response.timestamp.tzinfo == timezone.utc

@pytest.mark.asyncio
async def test_process_message_with_image(chat_service):
    # Test processing a message with an image
    response = await chat_service.process_message(
        text="What's in this image?",
        images=["data:image/jpeg;base64,/9j/4AAQSkZJRg=="]
    )
    
    assert response.content == "Mock response"
    assert response.model == "mock-model"
    assert response.timestamp.tzinfo == timezone.utc

@pytest.mark.asyncio
async def test_process_message_with_history(chat_service):
    # Test processing a message with conversation history
    history = [
        Message(
            role="user",
            content=[
                TextContent(text="Previous message"),
                ImageContent(image_url={"url": "data:image/jpeg;base64,/9j/4AAQSkZJRg=="})
            ],
            timestamp=datetime.now(timezone.utc)
        ),
        Message(
            role="assistant",
            content="Previous response",
            timestamp=datetime.now(timezone.utc)
        )
    ]
    
    response = await chat_service.process_message(
        text="Hello",
        conversation_messages=history
    )
    
    assert response.content == "Mock response"
    assert response.model == "mock-model"
    assert response.timestamp.tzinfo == timezone.utc

@pytest.mark.asyncio
async def test_stream_text_response(chat_service):
    # Test streaming response for text message
    chunks = []
    async for chunk in chat_service.stream_response(text="Hello"):
        chunks.append(chunk)
    
    assert chunks == ["Mock ", "streaming ", "response"]

@pytest.mark.asyncio
async def test_stream_response_with_image(chat_service):
    # Test streaming response for message with image
    chunks = []
    async for chunk in chat_service.stream_response(
        text="What's in this image?",
        images=["data:image/jpeg;base64,/9j/4AAQSkZJRg=="]
    ):
        chunks.append(chunk)
    
    assert chunks == ["Mock ", "streaming ", "response"] 