from datetime import datetime, timezone
from src.conversation.models import Conversation, ConversationSummary
from src.chat.models import Message, TextContent

def test_conversation_creation():
    # Create a test message
    message = Message(
        role="user",
        content="Test message",
        model="gpt-4",
        timestamp=datetime.now(timezone.utc)
    )
    
    # Create a conversation
    conversation = Conversation(
        conversation_id="test-id",
        conversation_name="Test Conversation",
        messages=[message]
    )
    
    # Assert conversation properties
    assert conversation.conversation_id == "test-id"
    assert conversation.conversation_name == "Test Conversation"
    assert len(conversation.messages) == 1
    assert conversation.messages[0] == message
    assert isinstance(conversation.last_updated, datetime)

def test_conversation_summary_creation():
    # Create a conversation summary
    now = datetime.now(timezone.utc)
    summary = ConversationSummary(
        conversation_id="test-id",
        conversation_name="Test Conversation",
        last_updated=now
    )
    
    # Assert summary properties
    assert summary.conversation_id == "test-id"
    assert summary.conversation_name == "Test Conversation"
    assert summary.last_updated == now 