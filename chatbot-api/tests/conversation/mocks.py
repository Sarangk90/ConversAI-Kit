from datetime import datetime, timezone
from src.chat.models import Message

class MockRepository:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance.conversations = {}
            cls._instance.conversation_summaries = []
        return cls._instance
    
    def get_conversations(self):
        return self.conversation_summaries
    
    def get_conversation(self, conversation_id: str):
        return self.conversations.get(conversation_id)
    
    def save_conversation(self, conversation):
        self.conversations[conversation.conversation_id] = conversation
        # Update summary
        summary = {
            "conversation_id": conversation.conversation_id,
            "conversation_name": conversation.conversation_name,
            "last_updated": conversation.last_updated
        }
        self.conversation_summaries = [s for s in self.conversation_summaries if s["conversation_id"] != conversation.conversation_id]
        self.conversation_summaries.append(summary)

class MockAIProvider:
    def generate_response(self, messages):
        return Message(
            role="assistant",
            content="Mock Conversation Title",
            model="mock-model",
            timestamp=datetime.now(timezone.utc)
        )

# Create singleton instances
mock_repository = MockRepository()
mock_ai_provider = MockAIProvider() 