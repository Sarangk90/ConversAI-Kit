from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime

class MessageSchema(BaseModel):
    role: str
    content: str
    model: Optional[str] = None
    timestamp: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class ChatRequestSchema(BaseModel):
    conversation_id: str
    messages: List[MessageSchema]
    model: str = "gpt-4o"

class ChatResponseSchema(BaseModel):
    reply: str
    model: str
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True) 