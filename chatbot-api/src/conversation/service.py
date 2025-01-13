from dataclasses import dataclass
from typing import List, Optional
from datetime import datetime, timezone
from .models import Conversation, ConversationSummary
from .repository import ConversationRepository
from ..chat.provider import AIProvider
from ..chat.models import Message
import logging

logger = logging.getLogger(__name__)


@dataclass
class ConversationService:
    """Service for managing conversations"""

    repository: ConversationRepository
    ai_provider: AIProvider

    def get_conversations(self) -> List[ConversationSummary]:
        """Get all conversations"""
        logger.info("Fetching all conversations")
        return self.repository.get_conversations()

    def get_conversation(self, conversation_id: str) -> Optional[Conversation]:
        """Get a specific conversation"""
        logger.info(f"Fetching conversation: {conversation_id}")
        return self.repository.get_conversation(conversation_id)

    def save_conversation(self, conversation: Conversation) -> None:
        """Save a conversation"""
        logger.info(f"Saving conversation: {conversation.conversation_id}")
        # Ensure last_updated is timezone-aware
        if conversation.last_updated.tzinfo is None:
            conversation.last_updated = conversation.last_updated.replace(
                tzinfo=timezone.utc
            )
        self.repository.save_conversation(conversation)

    def generate_name(self, message: str) -> str:
        """Generate a name for a conversation"""
        logger.info("Generating conversation name")
        prompt = f"Generate a concise title (3-4 words) for a conversation that starts with this message: {message}"
        try:
            response = self.ai_provider.generate_response(
                [
                    Message(
                        role="user",
                        content=prompt,
                        timestamp=datetime.now(timezone.utc),
                        model="gpt-4o-mini",
                    )
                ]
            )

            # Limit to 3-4 words
            words = response.content.strip().split()
            name = " ".join(words[:4])
            logger.info(f"Generated name: {name}")
            return name
        except Exception as e:
            logger.error(f"Error generating name: {str(e)}")
            raise
