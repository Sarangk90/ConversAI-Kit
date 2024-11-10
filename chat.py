# chat.py

import openai
import os

# Set up OpenAI API key securely using environment variables
openai.api_key = os.getenv('OPENAI_API_KEY')
openai.api_base = 'https://chat.int.bayer.com/api/v2'

# Function to get bot response using GPT-4
def get_bot_response(user_message):
    try:
        # Call the GPT-4 model
        response = openai.ChatCompletion.create(
            model="gpt-4o",  # Use the GPT-4 model
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": user_message}
            ]
        )

        # Extract the assistant's response
        bot_reply = response['choices'][0]['message']['content'].strip()

        # Return the bot's reply
        return bot_reply
    except Exception as e:
        return str(e)


def get_bot_response_stream(messages):
    try:
        # Ensure system prompt is included
        system_prompt = {"role": "system", "content": "You are a helpful assistant."}

        if messages[0]['role'] != 'system':
            messages.insert(0, system_prompt)

        # Call the GPT-4 model with stream=True
        response = openai.ChatCompletion.create(
            model="gpt-4o",
            messages=messages,
            stream=True
        )
        # response is an iterator
        for chunk in response:
            # Each chunk may have 'choices' and 'delta'
            chunk_content = chunk['choices'][0]['delta'].get('content', '')
            if chunk_content:
                # Yield a dictionary with additional metadata if needed
                yield {'content': chunk_content}
    except Exception as e:
        yield {'error': str(e)}
# Function to generate conversation name
def generate_conversation_name(first_user_message):
    try:
        # Prompt to generate a concise conversation title
        prompt = f"Generate a brief, 3-4 word conversation title for the following message:\n\n\"{first_user_message}\""

        response = openai.ChatCompletion.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an assistant that generates concise conversation titles."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=10,  # Limit the response length
            temperature=0.7,  # Adjust for creativity
            n=1,
        )

        # Extract the generated conversation name
        conversation_name = response['choices'][0]['message']['content'].strip()

        # Ensure the name is at most 4 words
        words = conversation_name.split()
        conversation_name = ' '.join(words[:4])

        return conversation_name
    except Exception as e:
        return str(e)
