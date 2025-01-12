import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from src.chat.routes import router as chat_router, get_chat_service
from src.chat.service import ChatService
from src.chat.provider import OpenAIProvider
from src.conversation.routes import (
    router as conversation_router,
    get_conversation_service,
)
from src.conversation.service import ConversationService
from src.conversation.repository import SQLiteConversationRepository

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="Chat API", version="1.0.0", description="Chat API with OpenAI integration"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chat_router)
app.include_router(conversation_router)


# Setup dependencies
def get_chat_service_override() -> ChatService:
    api_key = os.getenv("OPENAI_API_KEY")
    api_base = os.getenv("OPENAI_API_BASE")

    if not api_key:
        raise ValueError(
            "OPENAI_API_KEY environment variable is not set. Please check your .env file."
        )

    ai_provider = OpenAIProvider(api_key=api_key, api_base=api_base)
    return ChatService(ai_provider=ai_provider)


def get_conversation_service_override() -> ConversationService:
    api_key = os.getenv("OPENAI_API_KEY")
    api_base = os.getenv("OPENAI_API_BASE")

    if not api_key:
        raise ValueError(
            "OPENAI_API_KEY environment variable is not set. Please check your .env file."
        )

    ai_provider = OpenAIProvider(api_key=api_key, api_base=api_base)
    repository = SQLiteConversationRepository()
    return ConversationService(repository=repository, ai_provider=ai_provider)


# Override the dependencies
app.dependency_overrides[get_chat_service] = get_chat_service_override
app.dependency_overrides[get_conversation_service] = get_conversation_service_override

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("src.main:app", host="0.0.0.0", port=5001, reload=True)
