# app.py

from flask import Flask, request, jsonify
from flask_cors import CORS
import json

from chat import get_bot_response, generate_conversation_name
from database import init_db, save_conversation, get_conversations

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

# Route to get all conversations
@app.route('/api/conversations', methods=['GET'])
def get_conversations_route():
    conversations = get_conversations()
    for conv in conversations:
        conv['messages'] = json.loads(conv['messages'])  # Convert JSON back to Python object

    return jsonify(conversations), 200

if __name__ == '__main__':
    app.run(debug=True)
