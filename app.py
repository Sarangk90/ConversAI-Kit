# app.py

import json

from flask import Flask, request, jsonify, Response
from flask_cors import CORS

from chat import get_bot_response, generate_conversation_name, get_bot_response_stream
from database import init_db, save_conversation, get_conversations, get_conversation

app = Flask(__name__)
CORS(app)

# Initialize the database when the app starts
init_db()


# Route to handle chat interaction
@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()

        # Extract conversation details
        conversation_id = data.get('conversation_id')
        messages = data.get('messages')

        if not conversation_id or not messages or not isinstance(messages, list):
            return jsonify({'error': 'Invalid conversation ID or messages'}), 400

        # Get the user's last message
        user_message = messages[-1]['content']

        # Get the bot's response from chat logic
        bot_reply = get_bot_response(user_message)

        # Return the bot's reply
        return jsonify({'reply': bot_reply}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Route to generate conversation name
@app.route('/api/generate_name', methods=['POST'])
def generate_conversation_name_route():
    data = request.get_json()

    # Extract the first message
    first_message = data.get('message', '')

    if not first_message:
        return jsonify({'error': 'Message is missing'}), 400

    # Generate the conversation name using the OpenAI API
    conversation_name = generate_conversation_name(first_message)

    # Check for errors in name generation
    if not conversation_name or 'error' in conversation_name.lower():
        return jsonify({'error': 'Failed to generate conversation name'}), 500

    return jsonify({'name': conversation_name}), 200


# Route to save a conversation
@app.route('/api/conversations', methods=['POST'])
def save_conversation_route():
    data = request.get_json()

    conversation_id = data.get('conversation_id')
    conversation_name = data.get('conversation_name')
    messages = data.get('messages')

    if not conversation_id or not messages or not conversation_name:
        return jsonify({'error': 'Missing conversation ID, name, or messages'}), 400

    # Convert messages to JSON string for storage
    messages_json = json.dumps(messages)

    save_conversation(conversation_id, conversation_name, messages_json)
    return jsonify({'message': 'Conversation saved successfully'}), 201


# Route to get all conversations (IDs and names only)
@app.route('/api/conversations', methods=['GET'])
def get_conversations_route():
    conversations = get_conversations()
    # Exclude messages from the response to keep it lightweight
    conversations_list = [
        {
            'conversation_id': conv['conversation_id'],
            'conversation_name': conv['conversation_name']
        }
        for conv in conversations
    ]
    return jsonify(conversations_list), 200

# New endpoint to get messages for a specific conversation
@app.route('/api/conversations/<conversation_id>', methods=['GET'])
def get_conversation_messages(conversation_id):
    conversation = get_conversation(conversation_id)
    if conversation:
        # Convert messages from JSON string to Python object
        conversation['messages'] = json.loads(conversation['messages'])
        return jsonify(conversation), 200
    else:
        return jsonify({'error': 'Conversation not found'}), 404

@app.route('/api/stream_chat', methods=['POST'])
def stream_chat():
    try:
        data = request.get_json()

        # Extract conversation details
        conversation_id = data.get('conversation_id')
        messages = data.get('messages')

        if not conversation_id or not messages or not isinstance(messages, list):
            return jsonify({'error': 'Invalid conversation ID or messages'}), 400

        # Get the bot's response generator
        def generate():
            for chunk in get_bot_response_stream(messages):
                # Convert the chunk to a JSON-formatted string
                json_data = json.dumps(chunk)
                # SSE format: data: <message>\n\n
                yield f"data: {json_data}\n\n"

        # Set appropriate headers for SSE
        headers = {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no'  # Disable buffering for Nginx
        }

        return Response(generate(), headers=headers)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)
