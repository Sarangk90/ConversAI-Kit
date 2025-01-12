import sqlite3
from datetime import datetime

DB_NAME = 'conversations.db'

# Initialize the database and create the conversations table if it doesn't exist
def init_db():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    # Create table for conversations if it doesn't exist
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS conversations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            conversation_id TEXT NOT NULL,
            conversation_name TEXT NOT NULL,
            messages TEXT NOT NULL,
            last_updated TEXT NOT NULL  -- Add last_updated field for timestamp
        )
    ''')

    conn.commit()
    conn.close()


# Save conversation to the database (create or update)
def save_conversation(conversation_id, conversation_name, messages, last_updated=None):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    # Check if the conversation already exists
    cursor.execute('SELECT id FROM conversations WHERE conversation_id = ?', (conversation_id,))
    existing_conversation = cursor.fetchone()

    if last_updated is None:
        last_updated = datetime.utcnow().isoformat()  # Set current timestamp if not provided

    if existing_conversation:
        # Update the existing conversation
        cursor.execute('''
            UPDATE conversations
            SET messages = ?, conversation_name = ?, last_updated = ?
            WHERE conversation_id = ?
        ''', (messages, conversation_name, last_updated, conversation_id))
    else:
        # Insert a new conversation
        cursor.execute('''
            INSERT INTO conversations (conversation_id, conversation_name, messages, last_updated)
            VALUES (?, ?, ?, ?)
        ''', (conversation_id, conversation_name, messages, last_updated))

    conn.commit()
    conn.close()


# Fetch all conversations from the database
def get_conversations():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    cursor.execute('SELECT conversation_id, conversation_name, last_updated FROM conversations')
    rows = cursor.fetchall()

    conversations = [{'conversation_id': row[0], 'conversation_name': row[1], 'last_updated': row[2]} for row in rows]

    conn.close()
    return conversations

def get_conversation(conversation_id):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    cursor.execute('SELECT conversation_id, conversation_name, messages, last_updated FROM conversations WHERE conversation_id = ?', (conversation_id,))
    row = cursor.fetchone()

    conn.close()

    if row:
        conversation = {
            'conversation_id': row[0],
            'conversation_name': row[1],
            'messages': row[2],
            'last_updated': row[3]
        }
        return conversation
    else:
        return None
