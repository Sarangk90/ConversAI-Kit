import pytest
import sqlite3
import os
from datetime import datetime
from src.database import init_db, save_conversation, get_conversations, get_conversation

# Test database file
TEST_DB = "test_conversations.db"


@pytest.fixture(autouse=True)
def setup_test_db(monkeypatch):
    """Set up a test database before each test"""
    monkeypatch.setattr("src.database.DB_NAME", TEST_DB)
    init_db()
    yield
    if os.path.exists(TEST_DB):
        os.remove(TEST_DB)


def test_database_should_initialize_with_required_tables():
    """Test database initialization creates necessary tables"""
    assert os.path.exists(TEST_DB)

    conn = sqlite3.connect(TEST_DB)
    cursor = conn.cursor()
    cursor.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='conversations'"
    )
    assert cursor.fetchone() is not None
    conn.close()


def test_conversation_should_support_create_read_update_operations():
    """Test conversation storage supports basic CRUD operations (except Delete)"""
    # Test saving new conversation (Create)
    conv_id = "test-conv"
    conv_name = "Test Conversation"
    messages = '["Hello", "Hi there"]'
    timestamp = datetime.utcnow().isoformat()

    save_conversation(conv_id, conv_name, messages, timestamp)

    # Test retrieving single conversation (Read)
    result = get_conversation(conv_id)
    assert result is not None
    assert result["conversation_id"] == conv_id
    assert result["conversation_name"] == conv_name
    assert result["messages"] == messages
    assert result["last_updated"] == timestamp

    # Test updating existing conversation (Update)
    new_name = "Updated Name"
    new_messages = '["Updated message"]'
    new_timestamp = datetime.utcnow().isoformat()
    save_conversation(conv_id, new_name, new_messages, new_timestamp)

    updated = get_conversation(conv_id)
    assert updated["conversation_name"] == new_name
    assert updated["messages"] == new_messages
    assert updated["last_updated"] == new_timestamp

    # Test retrieving non-existent conversation
    assert get_conversation("non-existent") is None


def test_conversations_should_be_retrievable_as_list():
    """Test retrieving multiple conversations as a list"""
    # Save test conversations
    conversations = [
        ("conv-1", "First Conv", '["Message 1"]', datetime.utcnow().isoformat()),
        ("conv-2", "Second Conv", '["Message 2"]', datetime.utcnow().isoformat()),
    ]

    for conv in conversations:
        save_conversation(*conv)

    # Test retrieval
    result = get_conversations()
    assert len(result) == 2
    assert result[0]["conversation_id"] == "conv-1"
    assert result[1]["conversation_id"] == "conv-2"
