import os
import logging
from dotenv import load_dotenv
from openai import OpenAI
from utils.cybersecurity_expert_prompt import AUTO_PROMPT, MANUAL_PROMPT

load_dotenv()


class ChatGPTClient:
    def __init__(self, api_key=None, model="gpt-4o-mini"):
        """
        Initialize the OpenAI client with an API key and model.
        :param api_key: OpenAI API key (default: uses environment variable `OPENAI_API_KEY`).
        :param model: OpenAI model to use (default: gpt-4-turbo).
        """
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError(
                "API key must be provided or set in environment variables."
            )
        self.client = OpenAI(api_key=self.api_key)  # Initialize the OpenAI client
        self.model = model

    def ask(
        self,
        message=None,
        model=None,
        stream=True,
        temperature=0,
        system_prompt=None,
        message_history=None,
        prompt_type="manual",
        standard_context=None,
        cve_context=None,
        agent_context=None,
    ):
        """
        Query the ChatGPT API with a cybersecurity scenario.

        :param message: The user's message.
        :param model: The model to use (default: the initialized model).
        :param stream: Whether to stream the response (default: True).
        :param temperature: Sampling temperature to use for randomness (default: 0).
        :param system_prompt: A custom system prompt, if provided.
        :param message_history: List of prior messages for context.
        :param prompt_type: "manual" or "auto" for default system prompts.
        :param cve_context: Additional cybersecurity context (e.g., latest CVEs).
        :return: The streamed response (if stream=True) or the full response text.
        """
        try:
            # Use the provided model or fallback to the initialized model
            model = model or self.model

            # Ensure message_history is a list (avoid NoneType errors)
            message_history = message_history or []

            # Determine system message content
            if system_prompt:
                system_message = {"role": "system", "content": system_prompt}
            else:
                prompt_content = AUTO_PROMPT if prompt_type == "auto" else MANUAL_PROMPT
                if standard_context:
                    # prompt_content += (
                    #     f"\n\nThis conversation following the compliance standard:\n{standard_context}"
                    # )
                    prompt_content = prompt_content.replace(
                        "{COMPLIANCE_STANDARD}", standard_context
                    )
                if cve_context:
                    prompt_content += f"\n\nContext about latest CVEs:\n{cve_context}"
                if agent_context:
                    prompt_content += f"\n\nContext about the agent:\n{agent_context}"
                system_message = {"role": "system", "content": prompt_content}

            # Construct message list
            messages = [system_message] + message_history

            # Append the user's message
            if message:
                messages.append({"role": "user", "content": message})

            # Streaming response
            if stream:
                response = self.client.chat.completions.create(
                    model=model,
                    messages=messages,
                    temperature=temperature,
                    stream=True,
                )
                for chunk in response:
                    if hasattr(chunk, "choices") and chunk.choices:
                        for choice in chunk.choices:
                            if hasattr(choice, "delta") and hasattr(
                                choice.delta, "content"
                            ):
                                yield choice.delta.content

            # Non-streaming response
            else:
                response = self.client.chat.completions.create(
                    model=model,
                    messages=messages,
                    temperature=temperature,
                )
                return response.choices[0].message.content  # Corrected attribute access

        except Exception as e:
            logging.error(f"Error communicating with ChatGPT: {e}")
            return None
