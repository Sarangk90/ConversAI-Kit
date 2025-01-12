import pytest
from flask import json
from app import app
from unittest.mock import patch, MagicMock
from datetime import datetime, timezone

@pytest.fixture
def client():
    """Create a test client for the Flask app"""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

@pytest.fixture
def mock_services():
    """Mock all external services (chat and database)"""
    with patch('app.get_bot_response') as mock_chat, \
         patch('app.generate_conversation_name') as mock_name_gen, \
         patch('app.get_bot_response_stream') as mock_stream, \
         patch('app.save_conversation') as mock_save, \
         patch('app.get_conversations') as mock_get_all, \
         patch('app.get_conversation') as mock_get_one:
        yield {
            'chat': mock_chat,
            'name_gen': mock_name_gen,
            'stream': mock_stream,
            'save': mock_save,
            'get_all': mock_get_all,
            'get_one': mock_get_one
        }

def test_chat_api_should_handle_regular_and_streaming_responses(client, mock_services):
    """Test chat API endpoints handle both regular and streaming responses correctly"""
    # Test regular chat
    mock_services['chat'].return_value = "Hello, I'm the assistant"
    
    response = client.post('/api/chat', json={
        'conversation_id': 'test-conv',
        'messages': [{'role': 'user', 'content': 'Hello'}]
    })
    assert response.status_code == 200
    assert json.loads(response.data)['reply'] == "Hello, I'm the assistant"

    # Test invalid chat requests
    invalid_payloads = [
        {'messages': [{'role': 'user', 'content': 'Hello'}]},  # Missing conversation_id
        {'conversation_id': 'test-conv'},  # Missing messages
        {'conversation_id': 'test-conv', 'messages': 'not-a-list'}  # Invalid messages format
    ]
    for payload in invalid_payloads:
        response = client.post('/api/chat', json=payload)
        assert response.status_code == 400

    # Test streaming chat
    mock_services['stream'].return_value = [
        {'content': 'Hello'},
        {'content': ' World'}
    ]
    
    response = client.post('/api/stream_chat', json={
        'conversation_id': 'test-conv',
        'messages': [{'role': 'user', 'content': 'Hello'}],
        'model': 'gpt-4o'
    })
    
    assert response.status_code == 200
    assert response.headers['Content-Type'] == 'text/event-stream'
    
    data = [json.loads(line.decode().split('data: ')[1]) 
            for line in response.data.split(b'\n\n') 
            if line.startswith(b'data: ')]
    
    assert len(data) == 2
    assert data[0]['content'] == 'Hello'
    assert data[1]['content'] == ' World'

    # Test invalid streaming requests
    invalid_stream_payloads = [
        {'messages': [{'role': 'user', 'content': 'Hello'}]},  # Missing conversation_id
        {'conversation_id': 'test-conv'}  # Missing messages
    ]
    for payload in invalid_stream_payloads:
        response = client.post('/api/stream_chat', json=payload)
        assert response.status_code == 400

def test_conversations_api_should_support_crud_operations(client, mock_services):
    """Test conversation API endpoints support all CRUD operations correctly"""
    timestamp = datetime.now(timezone.utc).isoformat()
    
    # Test name generation
    mock_services['name_gen'].return_value = "Test Conversation"
    response = client.post('/api/generate_name', json={'message': 'Hello'})
    assert response.status_code == 200
    assert json.loads(response.data)['name'] == "Test Conversation"
    
    # Test invalid name generation request
    response = client.post('/api/generate_name', json={})
    assert response.status_code == 400

    # Test saving conversation (Create)
    test_data = {
        'conversation_id': 'test-conv',
        'conversation_name': 'Test Conv',
        'messages': [{'role': 'user', 'content': 'Hello'}]
    }
    
    response = client.post('/api/conversations', json=test_data)
    assert response.status_code == 201
    response_data = json.loads(response.data)
    assert response_data['conversation_id'] == test_data['conversation_id']
    assert response_data['conversation_name'] == test_data['conversation_name']
    assert 'last_updated' in response_data

    # Test invalid save request
    response = client.post('/api/conversations', json={})
    assert response.status_code == 400

    # Test retrieving all conversations (Read - List)
    mock_conversations = [
        {
            'conversation_id': 'conv-1',
            'conversation_name': 'First Conv',
            'last_updated': timestamp
        },
        {
            'conversation_id': 'conv-2',
            'conversation_name': 'Second Conv',
            'last_updated': timestamp
        }
    ]
    mock_services['get_all'].return_value = mock_conversations
    
    response = client.get('/api/conversations')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert len(data) == 2
    assert data[0]['conversation_id'] == 'conv-1'
    assert data[1]['conversation_id'] == 'conv-2'

    # Test retrieving specific conversation (Read - Single)
    mock_conversation = {
        'conversation_id': 'test-conv',
        'conversation_name': 'Test Conv',
        'messages': json.dumps([{'role': 'user', 'content': 'Hello'}]),
        'last_updated': timestamp
    }
    mock_services['get_one'].return_value = mock_conversation
    
    response = client.get('/api/conversations/test-conv')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['conversation_id'] == 'test-conv'

    # Test retrieving non-existent conversation
    mock_services['get_one'].return_value = None
    response = client.get('/api/conversations/non-existent')
    assert response.status_code == 404 