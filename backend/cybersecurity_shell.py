"""
A simple shell interface for interacting with the ChatGPTClient.
This script allows users to input prompts and receive responses.
"""

import json
from utils.chatgpt_client import ChatGPTClient

# Initialize the ChatGPTClient
client = ChatGPTClient()


def main():
    """
    Main function for the CyberSecurity Shell interface.
    Provides an interactive prompt for querying the ChatGPTClient.
    """
    print("CyberSecurity Expert Shell")
    print("Type 'exit' to quit.\n")

    while True:
        # Get user input
        user_prompt = input("Enter your prompt: ")

        if user_prompt.lower() == "exit":
            print("Exiting CyberSecurity Shell. Goodbye!")
            break

        # Query the ChatGPT client
        response = client.ask(user_prompt)

        # Print the response (formatted for JSON output)
        print("Response:")
        if isinstance(response, dict):
            print(json.dumps(response, indent=4))
        else:
            print(response)


if __name__ == "__main__":
    main()
