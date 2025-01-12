import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timezone
from src.chat.routes import router, get_chat_service
from src.chat.service import ChatService
from tests.chat.test_chat import MockAIProvider
import json

# Create test client
from fastapi import FastAPI
app = FastAPI()
app.include_router(router)

# Override dependency
def get_test_chat_service():
    return ChatService(ai_provider=MockAIProvider())

app.dependency_overrides[get_chat_service] = get_test_chat_service
client = TestClient(app)

def test_chat_text_endpoint():
    # Test the chat endpoint with text-only message
    response = client.post(
        "/chat",
        json={
            "messages": [
                {
                    "role": "user",
                    "content": "Hello",
                    "model": "gpt-4",
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
            ]
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["reply"] == "Mock response"
    assert data["model"] == "mock-model"
    assert "timestamp" in data

def test_chat_image_endpoint():
    # Test the chat endpoint with image message
    response = client.post(
        "/chat",
        json={
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "What's in this image?"
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": "data:image/jpeg;base64,/9j/4AAQSkZJRg=="
                            }
                        }
                    ],
                    "model": "gpt-4",
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
            ]
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["reply"] == "Mock response"
    assert data["model"] == "mock-model"
    assert "timestamp" in data

def test_stream_text_endpoint():
    # Test the streaming endpoint with text-only message
    with client:
        response = client.post(
            "/chat/stream",
            json={
                "messages": [
                    {
                        "role": "user",
                        "content": "Hello",
                        "model": "gpt-4",
                        "timestamp": datetime.now(timezone.utc).isoformat()
                    }
                ]
            },
            headers={"Accept": "text/event-stream"}
        )
        
        assert response.status_code == 200
        assert "text/event-stream" in response.headers["content-type"]
        
        # Read the streaming response
        chunks = []
        for line in response.iter_lines():
            if line:
                data = line.replace("data: ", "") if isinstance(line, str) else line.decode().replace("data: ", "")
                chunks.append(json.loads(data)["content"])
        
        assert chunks == ["Mock ", "streaming ", "response"]

def test_stream_image_endpoint():
    # Test the streaming endpoint with image message
    with client:
        response = client.post(
            "/chat/stream",
            json={
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": "What's in this image?"
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": "data:image/jpeg;base64,/9j/4AAQSkZJRg=="
                                }
                            }
                        ],
                        "model": "gpt-4",
                        "timestamp": datetime.now(timezone.utc).isoformat()
                    }
                ]
            },
            headers={"Accept": "text/event-stream"}
        )
        
        assert response.status_code == 200
        assert "text/event-stream" in response.headers["content-type"]
        
        # Read the streaming response
        chunks = []
        for line in response.iter_lines():
            if line:
                data = line.replace("data: ", "") if isinstance(line, str) else line.decode().replace("data: ", "")
                chunks.append(json.loads(data)["content"])
        
        assert chunks == ["Mock ", "streaming ", "response"] 