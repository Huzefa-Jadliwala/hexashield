"""
A simple shell interface for interacting with the XAIChatClient.
This script allows users to input prompts and receive responses.
"""

import json
from utils.grok_client import XAIChatClient
from utils.cybersecurity_expert_prompt import AUTO_PROMPT


# Initialize the XAIChatClient
client = XAIChatClient()

def main():
    """
    Main function for the XAI Chat Shell interface.
    Provides an interactive prompt for querying the XAIChatClient.
    """
    print("XAI Chat Shell")
    print("Type 'exit' to quit.\n")

    while True:
        # Get user input
        user_prompt = input("Enter your prompt: ")

        if user_prompt.lower() == "exit":
            print("Exiting XAI Chat Shell. Goodbye!")
            break

        try:
            # Query the XAIChatClient with streaming enabled
            print("Streaming AI response...")
            for chunk in client.ask(user_prompt, stream=True):
                # Print the received chunk (streamed content)
                print(chunk, end="")  # `end=""` prevents extra newline after each chunk

        except Exception as e:
            print(f"Error: {e}")


if __name__ == "__main__":
    main()
