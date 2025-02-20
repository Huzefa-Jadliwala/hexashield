import logging
import os
import sys
import signal
from time import sleep
from datetime import datetime
from zoneinfo import ZoneInfo
from typing import List, Dict

import requests
import socketio

# Add the parent directory of the `agent` package to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from agent.helper import (
    get_agent_id,
    get_client_info,
    run_command,
    run_command_in_script_mode,
)

# Configure logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler()],
)

# Initialize Socket.IO client
sio = socketio.Client(reconnection=True, reconnection_attempts=5)

# Global stop flag
shutdown_flag = False


# Handle Ctrl+C and SIGTERM
def handle_exit(signum, frame):
    global shutdown_flag
    logging.info(
        "Received exit signal (Ctrl+C or SIGTERM). Shutting down gracefully..."
    )
    shutdown_flag = True
    sio.disconnect()


# Register signal handlers
signal.signal(signal.SIGINT, handle_exit)  # Handle Ctrl+C
signal.signal(signal.SIGTERM, handle_exit)  # Handle Docker/Kubernetes termination


class Agent:
    """
    Represents an agent that interacts with a Command and Control (C2) server using REST and Socket.IO.

    Attributes:
        c2_url (str): URL of the C2 server REST API.
        socket_url (str): URL of the Socket.IO server.
        user_id (str): Identifier for the user associated with the agent.
        conversation_id (str): Identifier for the agent's conversation context.
        is_registered (bool): Indicates whether the agent is registered with the C2 API.
        agent_id (str): Unique identifier for the agent.
    """

    def __init__(
        self, c2_url: str, socket_url: str, user_id: str, conversation_id: str
    ):
        self.c2_url = c2_url
        self.socket_url = socket_url
        self.user_id = user_id
        self.conversation_id = conversation_id
        self.is_registered = False
        self.agent_id = None
        self.client_info = None
        self.register_socket_events()

    def register_socket_events(self):
        """Register event handlers for Socket.IO communication."""

        @sio.on("connect")
        def on_connect():
            logging.info("Connected to the Socket.IO server.")
            self.register_agent()

        @sio.on("disconnect")
        def on_disconnect():
            logging.warning("Disconnected from the Socket.IO server.")

        @sio.on("on_execute_command")
        def on_execute_command(data: dict):
            self.handle_command(data)

    def handle_command(self, data: dict):
        """Handle command execution sent from the server."""
        logging.info("Received command: %s", data)

        created_at = datetime.now(ZoneInfo("UTC"))
        # Execute preconditions, commands, and cleanups
        all_outputs = []
        overall_status = "success"

        # Extract metadata
        metadata = data.get("metadata", {})
        priority = metadata.get("priority", "medium")  # Default priority to "medium"

        preconditions = data.get("preconditions", [])
        commands = data.get("commands", [])
        cleanups = data.get("cleanups", [])

        for precondition in preconditions:
            test_cmd = precondition.get("test_cmd")
            solve_cmd = precondition.get("solve_cmd")

            if test_cmd:
                cmd_success, cmd_output = run_command_in_script_mode(test_cmd)
                command_status = "success" if cmd_success else "failure"
                all_outputs.append(
                    {
                        "type": "precondition_test",
                        "command": test_cmd,
                        "output": cmd_output,
                        "status": command_status,
                    }
                )

                if command_status == "failure" and solve_cmd:
                    cmd_success, cmd_output = run_command_in_script_mode(solve_cmd)
                    command_status = "success" if cmd_success else "failure"
                    all_outputs.append(
                        {
                            "type": "precondition_solve",
                            "command": solve_cmd,
                            "output": cmd_output,
                            "status": command_status,
                        }
                    )
                    if command_status == "failure":
                        overall_status = "failure"
                        break

        if overall_status == "success":
            for command in commands:
                cmd_success, cmd_output = run_command_in_script_mode(command)
                command_status = "success" if cmd_success else "failure"
                all_outputs.append(
                    {
                        "type": "command",
                        "command": command,
                        "output": cmd_output,
                        "status": command_status,
                    }
                )
                if command_status == "failure":
                    overall_status = "failure"

        for cleanup_command in cleanups:
            cmd_success, cmd_output = run_command_in_script_mode(cleanup_command)
            command_status = "success" if cmd_success else "failure"
            all_outputs.append(
                {
                    "type": "cleanup",
                    "command": cleanup_command,
                    "output": cmd_output,
                    "status": command_status,
                }
            )
            if command_status == "failure":
                overall_status = "failure"

        # Calculate execution time
        completed_at = datetime.now(ZoneInfo("UTC"))
        execution_time = (completed_at - created_at).total_seconds()
        response = {
            "agent_id": self.agent_id,
            "conversation_id": self.conversation_id,
            "agent_name": self.client_info.get("hostname"),
            "status": overall_status,
            "outputs": all_outputs,
            "priority": priority,
            "execution_time": f"{execution_time:.2f}s",
            "completed_at": completed_at.isoformat(),
            "created_at": created_at.isoformat(),
            "created_by": self.user_id,
        }

        logging.info("Command execution completed with response: %s", response)
        sio.emit("on_command_response", response)

    def register_agent(self):
        """Register the agent with the C2 server."""
        if self.is_registered:
            return

        self.client_info = get_client_info()
        self.agent_id, error = get_agent_id()

        if error or not self.agent_id:
            logging.error("Failed to retrieve agent ID.")
            return

        client_data = {
            "agent_id": self.agent_id,
            "conversation_id": self.conversation_id,
            "created_by": self.user_id,
            "client_info": self.client_info,
            "status": "online",
            "last_seen": datetime.now(ZoneInfo("UTC")).isoformat(),
        }

        logging.info("Registering agent with the server: %s", client_data)

        try:
            sio.emit("on_agent_registration", client_data)
            self.is_registered = True
            logging.info("Agent registered successfully.")
        except Exception as e:
            logging.error("Failed to register agent: %s", e)


if __name__ == "__main__":
    c2_url = os.getenv("C2_URL", "http://localhost:5001/c2/api/v1")
    socket_url = os.getenv("SOCKET_URL", "http://localhost:5001")
    user_id = os.getenv("U_ID", "6784dddbed134e0c447cdb18")
    conversation_id = os.getenv("C_ID", "67a0746ba9504387881723dd")

    while not shutdown_flag:
        try:
            logging.info("Starting agent...")
            logging.info("C2_URL: %s", c2_url)
            logging.info("SOCKET_URL: %s", socket_url)
            logging.info("USER_ID: %s", user_id)
            logging.info("CONVERSATION_ID: %s", conversation_id)

            agent = Agent(c2_url, socket_url, user_id, conversation_id)
            sio.connect(socket_url)
            sio.wait()

        except KeyboardInterrupt:
            logging.info("KeyboardInterrupt received. Exiting...")
            break  # Exit the loop on Ctrl+C

        except Exception as e:
            logging.error("An error occurred: %s", e, exc_info=True)
            logging.info("Retrying connection in 5 seconds...")
            sleep(5)

    logging.info("Agent has exited gracefully.")
