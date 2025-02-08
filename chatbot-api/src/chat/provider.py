from typing import Protocol, AsyncIterator, List
from openai import OpenAI
from .models import Message, ChatResponse, TextContent, ImageContent
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


class AIProvider(Protocol):
    """Protocol for AI providers"""

    def generate_response(self, messages: List[Message]) -> ChatResponse: ...
    def generate_stream(self, messages: List[Message]) -> AsyncIterator[str]: ...


class OpenAIProvider:
    """OpenAI implementation of AIProvider"""

    def __init__(self, api_key: str, api_base: str | None = None, groq_api_key: str | None = None, groq_api_base: str | None = None, github_api_key: str | None = None, github_api_base: str | None = None):
        self.client = OpenAI(api_key=api_key, base_url=api_base)
        self.groq_client = OpenAI(api_key=groq_api_key, base_url=groq_api_base)
        self.github_client = OpenAI(api_key=github_api_key, base_url=github_api_base)
    def _format_message(self, message: Message) -> dict:
        """Format message for OpenAI API"""
        if isinstance(message.content, str):
            return {"role": message.role, "content": message.content}

        # For messages with text and images
        formatted_content = []
        for item in message.content:
            if isinstance(item, TextContent):
                formatted_content.append({"type": "text", "text": item.text})
            elif isinstance(item, ImageContent):
                formatted_content.append(
                    {"type": "image_url", "image_url": item.image_url}
                )
        return {"role": message.role, "content": formatted_content}

    def generate_response(self, messages: List[Message]) -> ChatResponse:
        """Generate a response for messages"""
        # Use the model from the latest message
        model = messages[-1].model if messages and messages[-1].model else "claude-3-5-sonnet"
        formatted_messages = [self._format_message(m) for m in messages]
        if model == "deepseek-r1-distill-llama-70b":  
            response = self.groq_client.chat.completions.create(
                model=model, messages=formatted_messages
            )
        elif model == "Deepseek-r1":
            response = self.github_client.chat.completions.create(
                model=model, messages=formatted_messages
            )
        else:
            response = self.client.chat.completions.create(
                model=model, messages=formatted_messages
            )

        return ChatResponse(
            content=response.choices[0].message.content,
            model=model,
            timestamp=datetime.utcnow(),
        )

    async def generate_stream(self, messages: List[Message]) -> AsyncIterator[str]:
        """Stream response for messages"""
        try:
            model = messages[-1].model
            logger.info(f"Using model: {model}")
            formatted_messages = [self._format_message(m) for m in messages]
            
            if model == "deepseek-r1-distill-llama-70b":
                stream = self.groq_client.chat.completions.create(
                    model=model, messages=formatted_messages, stream=True
                )
            elif model == "Deepseek-r1":
                stream = self.github_client.chat.completions.create(
                    model=model, messages=formatted_messages, stream=True
                )
            else:
                stream = self.client.chat.completions.create(
                    model=model, messages=formatted_messages, stream=True
                )

            for chunk in stream:
                if chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    yield content
        except Exception as e:
            logger.error(f"Error in stream: {str(e)}")
            raise
