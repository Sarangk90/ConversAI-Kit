from typing import Protocol, AsyncIterator, List
from openai import OpenAI
from .models import Message, ChatResponse

class AIProvider(Protocol):
    """Protocol for AI providers"""
    async def generate_response(self, messages: List[Message]) -> ChatResponse: ...
    async def generate_stream(self, messages: List[Message]) -> AsyncIterator[str]: ...

class OpenAIProvider:
    """OpenAI implementation of AIProvider"""
    def __init__(self, api_key: str, api_base: str | None = None):
        self.client = OpenAI(api_key=api_key, base_url=api_base)

    async def generate_response(self, messages: List[Message]) -> ChatResponse:
        response = await self.client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": m.role, "content": m.content} for m in messages]
        )
        return ChatResponse(
            content=response.choices[0].message.content,
            model=response.model
        )

    async def generate_stream(self, messages: List[Message]) -> AsyncIterator[str]:
        stream = await self.client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": m.role, "content": m.content} for m in messages],
            stream=True
        )
        async for chunk in stream:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content 