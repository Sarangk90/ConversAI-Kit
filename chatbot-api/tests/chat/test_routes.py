import pytest
from fastapi.testclient import TestClient
from datetime import datetime
from src.chat.routes import router, get_chat_service
from src.chat.service import ChatService
from tests.chat.test_chat import MockAIProvider

# Create test client
from fastapi import FastAPI
app = FastAPI()
app.include_router(router)

# Override dependency
def get_test_chat_service():
    return ChatService(ai_provider=MockAIProvider())

app.dependency_overrides[get_chat_service] = get_test_chat_service
client = TestClient(app)

def test_chat_endpoint():
    # Test the chat endpoint
    response = client.post(
        "/chat",
        json={
            "conversation_id": "test-conv",
            "messages": [
                {
                    "role": "user",
                    "content": "Hello",
                    "model": "gpt-4o"
                }
            ],
            "model": "gpt-4o"
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["reply"] == "Mock response"
    assert data["model"] == "mock-model"
    assert "timestamp" in data

def test_stream_chat_endpoint():
    # Test the streaming endpoint
    with client:
        response = client.post(
            "/chat/stream",
            json={
                "conversation_id": "test-conv",
                "messages": [
                    {
                        "role": "user",
                        "content": "Hello",
                        "model": "gpt-4o"
                    }
                ],
                "model": "gpt-4o"
            },
            headers={"Accept": "text/event-stream"}
        )
        
        assert response.status_code == 200
        assert "text/event-stream" in response.headers["content-type"]
        
        # Read the streaming response
        chunks = []
        for line in response.iter_lines():
            if line:
                # Remove "data: " prefix and collect the chunk
                chunks.append(line.replace("data: ", ""))
        
        assert chunks == ["Mock ", "streaming ", "response"] 