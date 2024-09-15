import sqlite3

DB_NAME = 'conversations.db'


# Initialize the database and create the conversations table if it doesn't exist
def init_db():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    # Create table for conversations if not exists
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS conversations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            conversation_id TEXT NOT NULL,
            conversation_name TEXT NOT NULL,
            messages TEXT NOT NULL
        )
    ''')

    conn.commit()
    conn.close()


# Save conversation to the database
def save_conversation(conversation_id, conversation_name, messages):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    # Check if the conversation already exists
    cursor.execute('SELECT id FROM conversations WHERE conversation_id = ?', (conversation_id,))
    existing_conversation = cursor.fetchone()

    if existing_conversation:
        # Update the existing conversation
        cursor.execute('''
            UPDATE conversations
            SET messages = ?, conversation_name = ?
            WHERE conversation_id = ?
        ''', (messages, conversation_name, conversation_id))
    else:
        # Insert a new conversation
        cursor.execute('''
            INSERT INTO conversations (conversation_id, conversation_name, messages)
            VALUES (?, ?, ?)
        ''', (conversation_id, conversation_name, messages))

    conn.commit()
    conn.close()


# Fetch all conversations from the database
def get_conversations():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    # Fetch conversation_id, conversation_name, and messages
    cursor.execute('SELECT conversation_id, conversation_name, messages FROM conversations')
    rows = cursor.fetchall()

    # Prepare the conversations list
    conversations = [{'conversation_id': row[0], 'conversation_name': row[1], 'messages': row[2]} for row in rows]

    conn.close()
    return conversations

def get_conversation(conversation_id):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    cursor.execute('SELECT conversation_id, conversation_name, messages FROM conversations WHERE conversation_id = ?', (conversation_id,))
    row = cursor.fetchone()

    conn.close()

    if row:
        conversation = {
            'conversation_id': row[0],
            'conversation_name': row[1],
            'messages': row[2]
        }
        return conversation
    else:
        return None