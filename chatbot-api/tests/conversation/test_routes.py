from datetime import datetime, timezone
from fastapi.testclient import TestClient
from fastapi import FastAPI
from src.conversation.routes import router, get_conversation_service
from src.conversation.service import ConversationService
from tests.conversation.mocks import mock_repository, mock_ai_provider

# Create test app
app = FastAPI()
app.include_router(router)

# Override dependency
def get_test_conversation_service():
    return ConversationService(
        repository=mock_repository,
        ai_provider=mock_ai_provider
    )

app.dependency_overrides[get_conversation_service] = get_test_conversation_service
client = TestClient(app)

def test_list_conversations():
    # Clear repository
    mock_repository.conversations.clear()
    mock_repository.conversation_summaries.clear()
    
    # Initial list should be empty
    response = client.get("/api/conversations")
    assert response.status_code == 200
    assert response.json() == []
    
    # Create a conversation
    conversation_data = {
        "conversation_id": "test-id",
        "conversation_name": "Test Conversation",
        "messages": [
            {
                "role": "user",
                "content": "Hello",
                "model": "gpt-4",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        ]
    }
    
    response = client.post("/api/conversations", json=conversation_data)
    assert response.status_code == 200
    
    # List should now contain one conversation
    response = client.get("/api/conversations")
    assert response.status_code == 200
    conversations = response.json()
    assert len(conversations) == 1
    assert conversations[0]["conversation_id"] == "test-id"
    assert conversations[0]["conversation_name"] == "Test Conversation"

def test_get_conversation():
    # Clear repository
    mock_repository.conversations.clear()
    mock_repository.conversation_summaries.clear()
    
    # Create a conversation
    conversation_data = {
        "conversation_id": "test-id",
        "conversation_name": "Test Conversation",
        "messages": [
            {
                "role": "user",
                "content": "Hello",
                "model": "gpt-4",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        ]
    }
    
    response = client.post("/api/conversations", json=conversation_data)
    assert response.status_code == 200
    
    # Get the conversation
    response = client.get("/api/conversations/test-id")
    assert response.status_code == 200
    conversation = response.json()
    assert conversation["conversation_id"] == "test-id"
    assert conversation["conversation_name"] == "Test Conversation"
    assert len(conversation["messages"]) == 1
    
    # Test non-existent conversation
    response = client.get("/api/conversations/non-existent")
    assert response.status_code == 404

def test_save_conversation():
    # Clear repository
    mock_repository.conversations.clear()
    mock_repository.conversation_summaries.clear()
    
    # Save a new conversation
    conversation_data = {
        "conversation_id": "test-id",
        "conversation_name": "Test Conversation",
        "messages": [
            {
                "role": "user",
                "content": "Hello",
                "model": "gpt-4",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        ]
    }
    
    response = client.post("/api/conversations", json=conversation_data)
    assert response.status_code == 200
    saved_conv = response.json()
    assert saved_conv["conversation_id"] == "test-id"
    assert saved_conv["conversation_name"] == "Test Conversation"
    assert "last_updated" in saved_conv
    
    # Test saving with structured content
    conversation_data = {
        "conversation_id": "test-id-2",
        "conversation_name": "Test Conversation 2",
        "messages": [
            {
                "role": "user",
                "content": {
                    "type": "text",
                    "text": "Hello with structure"
                },
                "model": "gpt-4",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        ]
    }
    
    response = client.post("/api/conversations", json=conversation_data)
    assert response.status_code == 200

def test_generate_name():
    # Test name generation
    response = client.post(
        "/api/generate_name",
        json={"message": "Hello, how are you?"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "name" in data
    assert data["name"] == "Mock Conversation Title" 