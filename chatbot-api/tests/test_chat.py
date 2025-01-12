import pytest
from unittest.mock import patch, MagicMock
import os
from chat import get_bot_response, generate_conversation_name, get_bot_response_stream, get_openai_client

@pytest.fixture
def mock_openai():
    """Mock OpenAI client for testing"""
    with patch('chat.client') as mock_client:
        yield mock_client

def test_client_should_require_api_key():
    """Test OpenAI client creation requires API key"""
    with patch.dict(os.environ, {'OPENAI_API_KEY': ''}):
        with pytest.raises(ValueError, match="OPENAI_API_KEY environment variable is not set"):
            get_openai_client()

def test_bot_response_should_handle_success_and_errors(mock_openai):
    """Test bot response handles both successful and error cases"""
    # Test successful response
    mock_response = MagicMock()
    mock_response.choices[0].message.content = "Hello, I'm the assistant"
    mock_openai.chat.completions.create.return_value = mock_response

    response = get_bot_response("Hello")
    assert response == "Hello, I'm the assistant"
    
    # Verify API parameters
    mock_openai.chat.completions.create.assert_called_with(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Hello"}
        ]
    )

    # Test error handling
    mock_openai.chat.completions.create.side_effect = Exception("API Error")
    response = get_bot_response("Hello")
    assert response == "API Error"

def test_conversation_name_should_be_generated_from_message(mock_openai):
    """Test conversation name generation from user message"""
    # Test successful name generation
    mock_response = MagicMock()
    mock_response.choices[0].message.content = "Test Conversation Title"
    mock_openai.chat.completions.create.return_value = mock_response

    name = generate_conversation_name("What is Python?")
    assert name == "Test Conversation Title"
    
    # Verify API parameters
    call_args = mock_openai.chat.completions.create.call_args[1]
    assert call_args["model"] == "gpt-4o-mini"
    assert call_args["max_tokens"] == 10
    assert call_args["temperature"] == 0.7

    # Test error handling
    mock_openai.chat.completions.create.side_effect = Exception("API Error")
    name = generate_conversation_name("What is Python?")
    assert name == "API Error"

def test_stream_response_should_handle_different_models(mock_openai):
    """Test streaming responses for different model types and error cases"""
    # Test streaming response
    mock_chunk = MagicMock()
    mock_chunk.choices[0].delta.content = "Hello"
    mock_openai.chat.completions.create.return_value = [mock_chunk]

    messages = [{"role": "user", "content": "Hi"}]
    stream = list(get_bot_response_stream(messages, "gpt-4o"))
    assert stream == [{"content": "Hello"}]

    # Test o1 model (non-streaming)
    mock_response = MagicMock()
    mock_response.choices[0].message.content = "Hello from o1"
    mock_openai.chat.completions.create.return_value = mock_response

    stream = list(get_bot_response_stream(messages, "o1-preview"))
    assert stream == [{"content": "Hello from o1"}]

    # Test error handling
    mock_openai.chat.completions.create.side_effect = Exception("Stream Error")
    stream = list(get_bot_response_stream(messages, "gpt-4o"))
    assert stream == [{"error": "Stream Error"}] 