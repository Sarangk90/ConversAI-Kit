# app.py

import json

from flask import Flask, request, jsonify, Response
from flask_cors import CORS

from chat import get_bot_response, generate_conversation_name, get_bot_response_stream
from database import init_db, save_conversation, get_conversations, get_conversation
from datetime import datetime, timezone

app = Flask(__name__)
CORS(app)

# Initialize the database when the app starts
init_db()


# Route to handle chat interaction
@app.route("/api/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json()

        # Extract conversation details
        conversation_id = data.get("conversation_id")
        messages = data.get("messages")

        if not conversation_id or not messages or not isinstance(messages, list):
            return jsonify({"error": "Invalid conversation ID or messages"}), 400

        # Get the user's last message
        user_message = messages[-1]["content"]

        # Get the bot's response from chat logic
        bot_reply = get_bot_response(user_message)

        # Return the bot's reply
        return jsonify({"reply": bot_reply}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Route to generate conversation name
@app.route("/api/generate_name", methods=["POST"])
def generate_conversation_name_route():
    data = request.get_json()

    # Extract the first message
    first_message = data.get("message", "")

    if not first_message:
        return jsonify({"error": "Message is missing"}), 400

    # Generate the conversation name using the OpenAI API
    conversation_name = generate_conversation_name(first_message)

    # Check for errors in name generation
    if not conversation_name or "error" in conversation_name.lower():
        return jsonify({"error": "Failed to generate conversation name"}), 500

    return jsonify({"name": conversation_name}), 200


# Route to save a conversation
@app.route("/api/conversations", methods=["POST"])
def save_conversation_route():
    data = request.get_json()

    conversation_id = data.get("conversation_id")
    conversation_name = data.get("conversation_name")
    messages = data.get("messages")

    if not conversation_id or not conversation_name or not messages:
        return jsonify({"error": "Missing conversation ID, name, or messages"}), 400

    # Convert messages to JSON string for storage
    messages_json = json.dumps(messages)

    # Set the current timestamp as last_updated in the backend
    last_updated = datetime.now(timezone.utc).isoformat()

    # Save the conversation (last_updated handled in the database)
    save_conversation(conversation_id, conversation_name, messages_json, last_updated)

    return (
        jsonify(
            {
                "message": "Conversation saved successfully",
                "conversation_id": conversation_id,
                "conversation_name": conversation_name,
                "last_updated": last_updated,  # Return the generated lastUpdated timestamp to the frontend
            }
        ),
        201,
    )


# Route to get all conversations (IDs, names, and lastUpdated)
@app.route("/api/conversations", methods=["GET"])
def get_conversations_route():
    conversations = get_conversations()

    # Prepare response excluding messages
    conversations_list = [
        {
            "conversation_id": conv["conversation_id"],
            "conversation_name": conv["conversation_name"],
            "last_updated": conv["last_updated"],
        }
        for conv in conversations
    ]
    return jsonify(conversations_list), 200


# Route to get messages for a specific conversation
@app.route("/api/conversations/<conversation_id>", methods=["GET"])
def get_conversation_messages(conversation_id):
    conversation = get_conversation(conversation_id)
    if conversation:
        # Convert messages from JSON string to Python object
        conversation["messages"] = json.loads(conversation["messages"])
        return jsonify(conversation), 200
    else:
        return jsonify({"error": "Conversation not found"}), 404


def process_message(msg):
    """Process a single message and format it according to API requirements."""
    # If content is already an array (properly formatted), return as is
    if isinstance(msg.get("content"), list):
        return {"role": msg["role"], "content": msg["content"]}

    # If content is a string, return as is
    return {"role": msg["role"], "content": msg.get("content", "")}


def validate_request(data):
    """Validate the incoming request data."""
    if not data.get("conversation_id"):
        raise ValueError("Missing conversation ID")
    if not data.get("messages") or not isinstance(data.get("messages"), list):
        raise ValueError("Invalid messages format")
    return data["conversation_id"], data["messages"], data.get("model", "gpt-4o")


# Route to handle streaming chat
@app.route("/api/stream_chat", methods=["POST"])
def stream_chat():
    try:
        data = request.get_json()
        conversation_id, messages, model = validate_request(data)

        # Process all messages
        processed_messages = [process_message(msg) for msg in messages]

        # Get the bot's response generator
        def generate():
            for chunk in get_bot_response_stream(processed_messages, model):
                json_data = json.dumps(chunk)
                yield f"data: {json_data}\n\n"

        headers = {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        }

        return Response(generate(), headers=headers)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5001)
