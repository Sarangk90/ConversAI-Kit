from typing import List, Protocol, Optional
import sqlite3
import json
from datetime import datetime, timezone
from .models import Conversation, ConversationSummary
from ..chat.models import Message


class ConversationRepository(Protocol):
    """Protocol for conversation storage"""

    def get_conversations(self) -> List[ConversationSummary]: ...
    def get_conversation(self, conversation_id: str) -> Optional[Conversation]: ...
    def save_conversation(self, conversation: Conversation) -> None: ...


class SQLiteConversationRepository:
    """SQLite implementation of ConversationRepository"""

    def __init__(self, db_path: str = "conversations.db"):
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        """Initialize the database schema"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS conversations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    conversation_id TEXT NOT NULL,
                    conversation_name TEXT NOT NULL,
                    messages TEXT NOT NULL,
                    last_updated TEXT NOT NULL
                )
            """
            )
            conn.commit()

    def _ensure_utc(self, dt: datetime) -> datetime:
        """Ensure datetime is UTC timezone-aware"""
        if dt.tzinfo is None:
            return dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)

    def get_conversations(self) -> List[ConversationSummary]:
        """Get all conversations summaries"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute(
                "SELECT conversation_id, conversation_name, last_updated FROM conversations ORDER BY last_updated DESC"
            )
            return [
                ConversationSummary(
                    conversation_id=row[0],
                    conversation_name=row[1],
                    last_updated=self._ensure_utc(datetime.fromisoformat(row[2])),
                )
                for row in cursor.fetchall()
            ]

    def get_conversation(self, conversation_id: str) -> Optional[Conversation]:
        """Get a specific conversation"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute(
                "SELECT conversation_id, conversation_name, messages, last_updated FROM conversations WHERE conversation_id = ?",
                (conversation_id,),
            )
            row = cursor.fetchone()

            if not row:
                return None

            messages_data = json.loads(row[2])
            messages = []

            for msg in messages_data:
                content = msg["content"]
                # Try to parse content if it's a string that might be JSON
                if isinstance(content, str):
                    try:
                        parsed_content = json.loads(content)
                        if isinstance(parsed_content, list):
                            content = parsed_content
                    except json.JSONDecodeError:
                        # Keep content as is if it's not valid JSON
                        pass

                messages.append(
                    Message(
                        role=msg["role"],
                        content=content,
                        model=msg.get("model"),
                        timestamp=self._ensure_utc(
                            datetime.fromisoformat(msg["timestamp"])
                        ),
                    )
                )

            return Conversation(
                conversation_id=row[0],
                conversation_name=row[1],
                messages=messages,
                last_updated=self._ensure_utc(datetime.fromisoformat(row[3])),
            )

    def save_conversation(self, conversation: Conversation) -> None:
        """Save or update a conversation"""
        # Ensure timestamps are UTC and prepare messages for storage
        messages_json = json.dumps(
            [
                {
                    "role": msg.role,
                    "content": msg.content,  # Store content as-is, whether string or structured
                    "model": msg.model,
                    "timestamp": self._ensure_utc(msg.timestamp).isoformat(),
                }
                for msg in conversation.messages
            ]
        )

        with sqlite3.connect(self.db_path) as conn:
            # Check if the conversation already exists
            cursor = conn.execute(
                "SELECT id FROM conversations WHERE conversation_id = ?",
                (conversation.conversation_id,)
            )
            existing_conversation = cursor.fetchone()

            if existing_conversation:
                # Update existing conversation
                conn.execute(
                    """
                    UPDATE conversations 
                    SET conversation_name = ?, messages = ?, last_updated = ?
                    WHERE conversation_id = ?
                    """,
                    (
                        conversation.conversation_name,
                        messages_json,
                        self._ensure_utc(conversation.last_updated).isoformat(),
                        conversation.conversation_id,
                    ),
                )
            else:
                # Insert new conversation
                conn.execute(
                    """
                    INSERT INTO conversations (conversation_id, conversation_name, messages, last_updated)
                    VALUES (?, ?, ?, ?)
                    """,
                    (
                        conversation.conversation_id,
                        conversation.conversation_name,
                        messages_json,
                        self._ensure_utc(conversation.last_updated).isoformat(),
                    ),
                )
            conn.commit()
