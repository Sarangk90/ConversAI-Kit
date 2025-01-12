from dataclasses import dataclass
from typing import List, Optional, Union, Dict
from datetime import datetime

@dataclass
class ImageContent:
    type: str = "image_url"
    image_url: Dict[str, str] = None

@dataclass
class TextContent:
    type: str = "text"
    text: str = ""

@dataclass
class Message:
    role: str
    content: Union[str, List[Union[TextContent, ImageContent]]]
    model: Optional[str] = None
    timestamp: datetime = datetime.utcnow()

@dataclass
class ChatResponse:
    content: str
    model: str
    timestamp: datetime = datetime.utcnow() 