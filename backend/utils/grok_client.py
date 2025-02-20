import requests
from utils.cybersecurity_expert_prompt import AUTO_PROMPT, MANUAL_PROMPT
import os
from dotenv import load_dotenv
import json

load_dotenv()


class XAIChatClient:
    def __init__(self, base_url="https://api.x.ai/v1"):
        """
        Initializes the X.AI Chat Client.

        :param api_key: API key for authentication.
        :param base_url: Base URL of the X.AI API.
        """
        self.api_key = os.getenv("XAI_API_KEY")
        self.base_url = base_url.rstrip("/")
        self.headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
        }

    def ask(
        self,
        message,
        model="grok-beta",
        stream=False,
        temperature=0,
        message_history=None,
        prompt_type="manual",
    ):
        """
        Sends a chat completion request to the X.AI API.

        :param messages: List of messages in the chat history (list of dicts with "role" and "content").
        :param model: Model name (default is "grok-beta").
        :param stream: Whether to enable streaming responses (default is False).
        :param temperature: Sampling temperature (default is 0).
        :return: Response JSON from the API.
        """
        url = f"{self.base_url}/chat/completions"

        # Prepare the initial payload
        payload = {
            "messages": [
                {
                    "role": "system",
                    "content": (
                        AUTO_PROMPT
                        if prompt_type == "auto"
                        else MANUAL_PROMPT
                    ),
                }
            ],
            "model": model,
            "stream": stream,
            "temperature": temperature,
        }

        # Add message history if provided
        if message_history:
            payload["messages"].extend(message_history)

        # # Append the user's new message
        # payload["messages"].append({"role": "user", "content": message})

        try:
            response = requests.post(
                url, headers=self.headers, json=payload, stream=stream, timeout=20
            )
            response.raise_for_status()

            if stream:
                return self._handle_streaming_response(response)
            else:
                return response.json()

        except requests.exceptions.RequestException as e:
            raise Exception(f"Error while making request to {url}: {e}")

    def _handle_streaming_response(self, response):
        """
        Handles the streaming response by processing chunks of data as they arrive.

        :param response: The response object from the requests library with stream enabled.
        :return: A generator that yields parts of the response.
        """
        accumulated_data = ""  # Variable to accumulate chunked data
        try:
            # Iterating over each chunk in the stream
            for chunk in response.iter_lines():
                if chunk:
                    # Decode the chunk and remove the 'data: ' prefix
                    chunk = chunk.decode("utf-8").strip()

                    # Ensure we remove the 'data: ' prefix before parsing the JSON
                    if chunk.startswith("data:"):
                        chunk = chunk[
                            len("data:") :
                        ].strip()  # Remove 'data: ' from the start

                    # Accumulate the chunked data
                    accumulated_data += chunk

                    try:
                        # Attempt to parse the accumulated data as JSON
                        if accumulated_data != "[DONE]":
                            data = json.loads(accumulated_data)

                            # Check if the data has the expected structure
                            if "choices" in data and len(data["choices"]) > 0:
                                # Extract and yield the content from the chunk
                                message_content = (
                                    data["choices"][0]
                                    .get("delta", {})
                                    .get("content", "")
                                )
                                if message_content:
                                    yield message_content

                                # If the message content was successfully extracted, reset accumulated data
                                accumulated_data = ""
                    except json.JSONDecodeError:
                        # If we have a partial JSON, just continue accumulating data
                        continue
                    except Exception as e:
                        print(f"Error processing chunk: {e}")
                        continue
        except Exception as e:
            raise Exception(f"Error while streaming response: {e}")
