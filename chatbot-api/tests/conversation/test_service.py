from datetime import datetime, timezone
from unittest.mock import Mock
import pytest
from src.conversation.service import ConversationService
from src.conversation.models import Conversation
from src.chat.provider import AIProvider
from tests.conversation.mocks import mock_repository, mock_ai_provider


@pytest.fixture
def conversation_service():
    # Clear repository before each test
    mock_repository.conversations.clear()
    mock_repository.conversation_summaries.clear()
    return ConversationService(repository=mock_repository, ai_provider=mock_ai_provider)


def test_get_conversations(conversation_service):
    # Create test conversations
    conv1 = Conversation(
        conversation_id="test-id-1",
        conversation_name="Test Conversation 1",
        messages=[],
        last_updated=datetime.now(timezone.utc),
    )
    conv2 = Conversation(
        conversation_id="test-id-2",
        conversation_name="Test Conversation 2",
        messages=[],
        last_updated=datetime.now(timezone.utc),
    )

    # Save conversations
    conversation_service.save_conversation(conv1)
    conversation_service.save_conversation(conv2)

    # Get conversations
    conversations = conversation_service.get_conversations()

    # Assert
    assert len(conversations) == 2
    assert any(c["conversation_id"] == "test-id-1" for c in conversations)
    assert any(c["conversation_id"] == "test-id-2" for c in conversations)


def test_get_conversation(conversation_service):
    # Create and save a test conversation
    conv = Conversation(
        conversation_id="test-id",
        conversation_name="Test Conversation",
        messages=[],
        last_updated=datetime.now(timezone.utc),
    )
    conversation_service.save_conversation(conv)

    # Get conversation
    retrieved_conv = conversation_service.get_conversation("test-id")

    # Assert
    assert retrieved_conv is not None
    assert retrieved_conv.conversation_id == "test-id"
    assert retrieved_conv.conversation_name == "Test Conversation"


def test_save_conversation(conversation_service):
    # Create a conversation
    conv = Conversation(
        conversation_id="test-id",
        conversation_name="Test Conversation",
        messages=[],
        last_updated=datetime.now(),  # Naive datetime
    )

    # Save conversation
    conversation_service.save_conversation(conv)

    # Retrieve and verify
    saved_conv = conversation_service.get_conversation("test-id")
    assert saved_conv is not None
    assert saved_conv.conversation_id == "test-id"
    assert saved_conv.last_updated.tzinfo is not None  # Should be timezone-aware


def test_generate_name(conversation_service):
    # Generate name
    name = conversation_service.generate_name("Hello, how are you?")

    # Assert
    assert name == "Mock Conversation Title"


def test_generate_name_error():
    # Create mock AI provider that raises an exception
    mock_ai_provider = Mock(spec=AIProvider)
    mock_ai_provider.generate_response.side_effect = Exception("Mock error")

    service = ConversationService(
        repository=mock_repository, ai_provider=mock_ai_provider
    )

    # Assert that generate_name raises the exception
    with pytest.raises(Exception):
        service.generate_name("Hello")
