import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timezone
import json

from src.fastapi_app import app

client = TestClient(app)

def test_get_conversations(mocker):
    # Mock data
    mock_conversations = [
        {
            "conversation_id": "conv1",
            "conversation_name": "Test Conversation 1",
            "last_updated": datetime.now(timezone.utc).isoformat()
        },
        {
            "conversation_id": "conv2",
            "conversation_name": "Test Conversation 2",
            "last_updated": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    # Mock the database call with correct import path
    mocker.patch('src.fastapi_app.get_conversations', return_value=mock_conversations)
    
    # Make request to the FastAPI endpoint
    response = client.get("/api/conversations")
    
    # Assert response
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["conversation_id"] == "conv1"
    assert data[0]["conversation_name"] == "Test Conversation 1"
    assert "last_updated" in data[0]
    assert data[1]["conversation_id"] == "conv2"
    assert data[1]["conversation_name"] == "Test Conversation 2"
    assert "last_updated" in data[1] 