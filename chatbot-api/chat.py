# chat.py

from openai import OpenAI
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize the client with error checking
api_key = os.getenv('OPENAI_API_KEY')
api_base = os.getenv('OPENAI_API_BASE')

if not api_key:
    raise ValueError("OPENAI_API_KEY environment variable is not set")

# Initialize the client
client = OpenAI(
    api_key=api_key,
    base_url=api_base  # This is optional, only if you're using a custom API endpoint
)

print(f"API Key present: {bool(api_key)}")
print(f"API Base present: {bool(api_base)}")

# Function to get bot response using GPT-4
def get_bot_response(user_message):
    try:
        # Updated API call syntax
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": user_message}
            ]
        )

        # Updated response parsing
        bot_reply = response.choices[0].message.content.strip()
        return bot_reply
    except Exception as e:
        return str(e)


def get_bot_response_stream(messages, model):
    try:
        # Check if the model is part of the o1 series
        is_o1_model = model in ["o1-preview", "o1-mini"]

        # Add system prompt only for models that support it
        if not is_o1_model:
            system_prompt = {"role": "system", "content": "You are a helpful assistant."}
            if messages[0]['role'] != 'system':
                messages.insert(0, system_prompt)

        # Set stream to False for o1 models
        stream = not is_o1_model

        # Updated API call syntax
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            stream=stream
        )

        if stream:
            # Stream response chunks
            for chunk in response:
                chunk_content = chunk.choices[0].delta.content
                if chunk_content:
                    yield {'content': chunk_content}
        else:
            # Return the full response for non-streaming models
            full_response = response.choices[0].message.content
            yield {'content': full_response}

    except Exception as e:
        yield {'error': str(e)}

# Function to generate conversation name
def generate_conversation_name(first_user_message):
    try:
        prompt = f"Generate a brief, 3-4 word conversation title for the following message:\n\n\"{first_user_message}\""

        # Updated API call syntax
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an assistant that generates concise conversation titles."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=10,
            temperature=0.7,
            n=1,
        )

        # Updated response parsing
        conversation_name = response.choices[0].message.content.strip()
        words = conversation_name.split()
        conversation_name = ' '.join(words[:4])

        return conversation_name
    except Exception as e:
        return str(e)