import os
import pytest
from datetime import datetime, timezone
from src.conversation.repository import SQLiteConversationRepository
from src.conversation.models import Conversation
from src.chat.models import Message


@pytest.fixture
def test_db_path(tmp_path):
    """Create a temporary database file for testing"""
    db_file = tmp_path / "test_conversations.db"
    yield str(db_file)
    # Cleanup after tests
    if os.path.exists(db_file):
        os.remove(db_file)


@pytest.fixture
def repository(test_db_path):
    """Create a fresh repository instance for each test"""
    return SQLiteConversationRepository(db_path=test_db_path)


def test_save_new_conversation(repository):
    """Test saving a new conversation"""
    # Create a test conversation
    conv = Conversation(
        conversation_id="test-id",
        conversation_name="Test Conversation",
        messages=[
            Message(
                role="user",
                content="Hello",
                model="gpt-4",
                timestamp=datetime.now(timezone.utc)
            )
        ],
        last_updated=datetime.now(timezone.utc)
    )

    # Save the conversation
    repository.save_conversation(conv)

    # Retrieve and verify
    saved_conv = repository.get_conversation("test-id")
    assert saved_conv is not None
    assert saved_conv.conversation_id == "test-id"
    assert saved_conv.conversation_name == "Test Conversation"
    assert len(saved_conv.messages) == 1
    assert saved_conv.messages[0].content == "Hello"


def test_update_existing_conversation(repository):
    """Test updating an existing conversation"""
    # Create and save initial conversation
    initial_conv = Conversation(
        conversation_id="test-id",
        conversation_name="Initial Name",
        messages=[
            Message(
                role="user",
                content="First message",
                model="gpt-4",
                timestamp=datetime.now(timezone.utc)
            )
        ],
        last_updated=datetime.now(timezone.utc)
    )
    repository.save_conversation(initial_conv)

    # Update with new name and messages
    updated_conv = Conversation(
        conversation_id="test-id",
        conversation_name="Updated Name",
        messages=[
            Message(
                role="user",
                content="First message",
                model="gpt-4",
                timestamp=datetime.now(timezone.utc)
            ),
            Message(
                role="assistant",
                content="Second message",
                model="gpt-4",
                timestamp=datetime.now(timezone.utc)
            )
        ],
        last_updated=datetime.now(timezone.utc)
    )
    repository.save_conversation(updated_conv)

    # Retrieve and verify the update
    saved_conv = repository.get_conversation("test-id")
    assert saved_conv is not None
    assert saved_conv.conversation_id == "test-id"
    assert saved_conv.conversation_name == "Updated Name"
    assert len(saved_conv.messages) == 2
    assert saved_conv.messages[1].content == "Second message"


def test_get_conversations_ordering(repository):
    """Test that conversations are returned in correct order"""
    # Create conversations with different timestamps
    conv1 = Conversation(
        conversation_id="test-id-1",
        conversation_name="Test Conversation 1",
        messages=[],
        last_updated=datetime(2024, 1, 1, tzinfo=timezone.utc)
    )
    conv2 = Conversation(
        conversation_id="test-id-2",
        conversation_name="Test Conversation 2",
        messages=[],
        last_updated=datetime(2024, 1, 2, tzinfo=timezone.utc)
    )

    # Save in reverse order
    repository.save_conversation(conv1)
    repository.save_conversation(conv2)

    # Get conversations and verify order
    conversations = repository.get_conversations()
    assert len(conversations) == 2
    assert conversations[0].conversation_id == "test-id-2"  # Most recent first
    assert conversations[1].conversation_id == "test-id-1"


def test_get_nonexistent_conversation(repository):
    """Test getting a conversation that doesn't exist"""
    conv = repository.get_conversation("nonexistent-id")
    assert conv is None


def test_save_conversation_with_structured_content(repository):
    """Test saving a conversation with structured content"""
    # Create a conversation with structured content
    conv = Conversation(
        conversation_id="test-id",
        conversation_name="Test Conversation",
        messages=[
            Message(
                role="user",
                content=[
                    {"type": "text", "text": "Hello with structure"},
                    {"type": "image_url", "image_url": {"url": "data:image/jpeg;base64,test"}}
                ],
                model="gpt-4",
                timestamp=datetime.now(timezone.utc)
            )
        ],
        last_updated=datetime.now(timezone.utc)
    )

    # Save and retrieve
    repository.save_conversation(conv)
    saved_conv = repository.get_conversation("test-id")
    
    assert saved_conv is not None
    assert len(saved_conv.messages) == 1
    assert isinstance(saved_conv.messages[0].content, list)
    assert len(saved_conv.messages[0].content) == 2
    assert saved_conv.messages[0].content[0]["type"] == "text"
    assert saved_conv.messages[0].content[1]["type"] == "image_url" 