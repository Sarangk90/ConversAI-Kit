import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from chat.routes import router as chat_router
from chat.service import ChatService
from chat.provider import OpenAIProvider

# Create FastAPI app
app = FastAPI(
    title="Chat API",
    version="1.0.0",
    description="Chat API with OpenAI integration"
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

# Setup dependencies
def get_chat_service() -> ChatService:
    api_key = os.getenv("OPENAI_API_KEY")
    api_base = os.getenv("OPENAI_API_BASE")
    
    if not api_key:
        raise ValueError("OPENAI_API_KEY environment variable is not set")
    
    ai_provider = OpenAIProvider(api_key=api_key, api_base=api_base)
    return ChatService(ai_provider=ai_provider)

# Override the get_chat_service in routes
chat_router.dependencies[0].dependency = get_chat_service

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=5001, reload=True) 