# chat.py

import openai
import os

# Set up OpenAI API key securely using environment variables
openai.api_key = os.getenv('OPENAI_API_KEY')
openai.api_base = os.getenv('OPENAI_API_BASE')

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

        # Call the model
        response = openai.ChatCompletion.create(
            model=model,
            messages=messages,
            stream=stream
        )

        if stream:
            # Stream response chunks
            for chunk in response:
                chunk_content = chunk['choices'][0]['delta'].get('content', '')
                if chunk_content:
                    yield {'content': chunk_content}
        else:
            # Return the full response for non-streaming models
            full_response = response['choices'][0]['message']['content']
            yield {'content': full_response}

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
