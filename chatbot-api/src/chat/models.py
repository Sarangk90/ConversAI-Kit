from dataclasses import dataclass
from typing import List, Optional
from datetime import datetime

@dataclass
class Message:
    role: str
    content: str
    model: Optional[str] = None
    timestamp: datetime = datetime.utcnow()

@dataclass
class ChatResponse:
    content: str
    model: str
    timestamp: datetime = datetime.utcnow() 