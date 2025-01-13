from dataclasses import dataclass
from datetime import datetime, timezone
from typing import List, Optional
from ..chat.models import Message


@dataclass
class Conversation:
    """Represents a conversation"""

    conversation_id: str
    conversation_name: str
    messages: List[Message]
    last_updated: datetime = datetime.now(timezone.utc)


@dataclass
class ConversationSummary:
    """Summary of a conversation for listing"""

    conversation_id: str
    conversation_name: str
    last_updated: datetime
