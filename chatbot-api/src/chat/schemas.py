from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Union, Dict
from datetime import datetime

class ImageUrlSchema(BaseModel):
    url: str
    model_config = ConfigDict(from_attributes=True)

class ImageContentSchema(BaseModel):
    type: str = "image_url"
    image_url: ImageUrlSchema
    model_config = ConfigDict(from_attributes=True)

class TextContentSchema(BaseModel):
    type: str = "text"
    text: str
    model_config = ConfigDict(from_attributes=True)

class MessageSchema(BaseModel):
    role: str
    content: Union[str, List[Union[TextContentSchema, ImageContentSchema]]]
    model: Optional[str] = None
    timestamp: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

class ChatRequestSchema(BaseModel):
    messages: List[MessageSchema]
    model_config = ConfigDict(from_attributes=True)

class ChatResponseSchema(BaseModel):
    reply: str
    model: str
    timestamp: datetime
    model_config = ConfigDict(from_attributes=True) 