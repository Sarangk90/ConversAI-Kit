import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timezone
import json

from src.app import app

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
    
    # Mock the database call
    mocker.patch('src.app.get_conversations', return_value=mock_conversations)
    
    # Make request to the endpoint
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

def test_get_single_conversation(mocker):
    conversation_id = "conv1"
    mock_messages = [
        {"role": "user", "content": "Hello"},
        {"role": "assistant", "content": "Hi there!"}
    ]
    
    mock_conversation = {
        "conversation_id": conversation_id,
        "conversation_name": "Test Conversation",
        "messages": json.dumps(mock_messages),
        "last_updated": datetime.now(timezone.utc).isoformat()
    }
    
    # Mock the database call
    mocker.patch('src.app.get_conversation', return_value=mock_conversation)
    
    response = client.get(f"/api/conversations/{conversation_id}")
    
    assert response.status_code == 200
    data = response.json()
    assert data["conversation_id"] == conversation_id
    assert data["conversation_name"] == "Test Conversation"
    assert len(data["messages"]) == 2
    assert "last_updated" in data

def test_get_nonexistent_conversation(mocker):
    # Mock the database call to return None for non-existent conversation
    mocker.patch('src.app.get_conversation', return_value=None)
    
    response = client.get("/api/conversations/nonexistent")
    
    assert response.status_code == 404
    assert response.json()["detail"] == "Conversation not found"

def test_save_conversation(mocker):
    # Mock data
    conversation_data = {
        "conversation_id": "new_conv",
        "conversation_name": "New Conversation",
        "messages": [
            {"role": "user", "content": "Hello"},
            {"role": "assistant", "content": "Hi there!"}
        ]
    }
    
    # Mock the database save function
    save_mock = mocker.patch('src.app.save_conversation')
    
    response = client.post("/api/conversations", json=conversation_data)
    
    assert response.status_code == 201
    data = response.json()
    assert data["conversation_id"] == "new_conv"
    assert data["conversation_name"] == "New Conversation"
    assert "last_updated" in data
    
    # Verify save_conversation was called with correct arguments
    save_mock.assert_called_once()

def test_save_conversation_invalid_data():
    # Test missing required fields
    invalid_data = {
        "conversation_name": "Invalid Conversation"
    }
    
    response = client.post("/api/conversations", json=invalid_data)
    
    assert response.status_code == 422  # FastAPI validation error

def test_generate_conversation_name(mocker):
    # Mock data
    request_data = {
        "message": "Hello, how are you?"
    }
    mock_name = "Casual Check-In"
    
    # Mock the generate_conversation_name function
    mocker.patch('src.app.generate_conversation_name', return_value=mock_name)
    
    response = client.post("/api/generate_name", json=request_data)
    
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == mock_name

def test_generate_conversation_name_missing_message():
    response = client.post("/api/generate_name", json={})
    
    assert response.status_code == 422  # FastAPI validation error

def test_generate_conversation_name_error(mocker):
    # Mock generate_conversation_name to return an error
    mocker.patch('src.app.generate_conversation_name', return_value="error: API failed")
    
    response = client.post("/api/generate_name", json={"message": "Hello"})
    
    assert response.status_code == 500
    assert "Failed to generate conversation name" in response.json()["detail"]

def test_chat_endpoint(mocker):
    # Mock data
    request_data = {
        "conversation_id": "test_conv",
        "messages": [
            {"role": "user", "content": "Hello"},
            {"role": "assistant", "content": "Hi there!"},
            {"role": "user", "content": "How are you?"}
        ],
        "model": "gpt-4o"
    }
    
    # Mock the get_bot_response function
    mock_response = "Thank you for asking! How may I assist you today?"
    mocker.patch('src.app.get_bot_response', return_value=mock_response)
    
    response = client.post("/api/chat", json=request_data)
    
    assert response.status_code == 200
    data = response.json()
    assert data["reply"] == mock_response

def test_chat_endpoint_invalid_data():
    # Test missing required fields
    invalid_data = {
        "conversation_id": "test_conv"
    }
    
    response = client.post("/api/chat", json=invalid_data)
    assert response.status_code == 422

def test_stream_chat_endpoint(mocker):
    request_data = {
        "conversation_id": "test_conv",
        "messages": [
            {"role": "user", "content": "Hello"},
            {"role": "assistant", "content": "Hi there!"},
            {"role": "user", "content": "How are you?"}
        ],
        "model": "gpt-4o"
    }
    
    # Mock the streaming response
    mock_chunks = [
        {"content": "I'm "},
        {"content": "doing "},
        {"content": "well!"}
    ]
    
    mocker.patch('src.app.get_bot_response_stream', return_value=iter(mock_chunks))
    
    with client.stream("POST", "/api/stream_chat", json=request_data) as response:
        assert response.status_code == 200
        
        # Collect all chunks
        chunks = []
        for chunk in response.iter_lines():
            if chunk:
                # Handle both string and bytes
                chunk_str = chunk if isinstance(chunk, str) else chunk.decode()
                # Remove "data: " prefix and parse JSON
                chunk_data = json.loads(chunk_str.replace("data: ", ""))
                chunks.append(chunk_data)
        
        # Verify chunks
        assert len(chunks) == 3
        assert chunks[0]["content"] == "I'm "
        assert chunks[1]["content"] == "doing "
        assert chunks[2]["content"] == "well!"

def test_stream_chat_endpoint_invalid_data():
    invalid_data = {
        "conversation_id": "test_conv"
    }
    
    response = client.post("/api/stream_chat", json=invalid_data)
    assert response.status_code == 422 