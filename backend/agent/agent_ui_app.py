import os
import sys
import logging
from PyQt6.QtWidgets import (
    QApplication,
    QMainWindow,
    QVBoxLayout,
    QHBoxLayout,
    QWidget,
    QPushButton,
    QLabel,
    QTextEdit,
    QMessageBox,
)
from socketio import Client
import requests
from datetime import datetime
from zoneinfo import ZoneInfo

# Add the parent directory of the `agent` package to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from agent.helper import get_agent_id, get_client_info, run_command_in_script_mode

# Logger setup
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler()],
)

# Initialize Hexashield client
sio = Client(reconnection=True, reconnection_attempts=5)


class AgentApp(QMainWindow):
    def __init__(self, agent_details):
        super().__init__()
        self.setWindowTitle("Agent UI")
        self.setGeometry(100, 100, 800, 600)

        self.agent_details = agent_details
        self.connected = False
        self.is_registered = False

        # Main layout
        self.main_widget = QWidget()
        self.main_layout = QVBoxLayout()

        # Agent details section
        self.details_layout = QVBoxLayout()
        self.details_label = QLabel("Agent Details")
        self.details_text = QTextEdit()
        self.details_text.setReadOnly(True)
        self.update_agent_details()
        self.details_layout.addWidget(self.details_label)
        self.details_layout.addWidget(self.details_text)

        # Buttons
        self.button_layout = QHBoxLayout()
        self.connect_button = QPushButton("Connect to Hexashield")
        self.disconnect_button = QPushButton("Disconnect from Hexashield")
        # self.register_button = QPushButton("Register with C2 Server")
        self.button_layout.addWidget(self.connect_button)
        self.button_layout.addWidget(self.disconnect_button)
        # self.button_layout.addWidget(self.register_button)

        # Event handlers for buttons
        self.connect_button.clicked.connect(self.connect_to_socket)
        self.disconnect_button.clicked.connect(self.disconnect_socket)
        # self.register_button.clicked.connect(self.register_agent)

        # Execution log
        self.log_label = QLabel("Execution Log")
        self.log_text = QTextEdit()
        self.log_text.setReadOnly(True)

        # Add all components to the main layout
        self.main_layout.addLayout(self.details_layout)
        self.main_layout.addLayout(self.button_layout)
        self.main_layout.addWidget(self.log_label)
        self.main_layout.addWidget(self.log_text)

        self.main_widget.setLayout(self.main_layout)
        self.setCentralWidget(self.main_widget)

        # Register Hexashield event handlers
        self.register_socket_events()

    def update_agent_details(self):
        """
        Update the agent details text area with the current agent information.
        """
        details = "\n".join(
            f"{key}: {value}" for key, value in self.agent_details.items()
        )
        self.details_text.setText(details)

    def log_message(self, message):
        """
        Log a message to the execution log text area.
        """
        self.log_text.append(message)
        self.log_text.verticalScrollBar().setValue(
            self.log_text.verticalScrollBar().maximum()
        )

    def connect_to_socket(self):
        """
        Connect to the Hexashield server.
        """
        if self.connected:
            QMessageBox.information(self, "Info", "Already connected!")
            return
        try:
            logging.info("Connecting to Hexashield server.")
            sio.connect(self.agent_details["Socket URL"], transports=["websocket"])
            self.connected = True
            self.agent_details["Status"] = "Online"
            self.log_message("Connected to Hexashield server.")
        except Exception as e:
            QMessageBox.critical(
                self, "Error", f"Failed to connect to Hexashield server: {e}"
            )
            self.log_message(f"Error connecting to Hexashield server: {e}")

    def disconnect_socket(self):
        """
        Disconnect from the Hexashield server.
        """
        if not self.connected:
            QMessageBox.information(self, "Info", "Not connected!")
            return

        try:
            logging.info("Disconnecting from Hexashield server.")
            sio.disconnect()
            self.connected = False
            self.agent_details["Status"] = "Offline"
            self.log_message("Disconnected from Hexashield server.")
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Failed to disconnect: {e}")
            self.log_message(f"Error disconnecting from Hexashield server: {e}")

    def register_agent(self):
        """
        Register the agent with the C2 API server.
        """
        if self.is_registered:
            QMessageBox.information(self, "Info", "Agent already registered!")
            return

        client_info = get_client_info()
        agent_id, error = get_agent_id()

        if error or not agent_id:
            QMessageBox.critical(self, "Error", f"Failed to fetch Agent ID: {error}")
            return

        self.agent_details["Agent ID"] = agent_id
        client_data = {
            "agent_id": agent_id,
            "conversation_id": self.agent_details.get("Conversation ID"),
            "created_by": self.agent_details.get("User ID"),
            "client_info": client_info,
            "status": "online",
            "last_seen": datetime.now(ZoneInfo("UTC")).isoformat(),
        }
        self.log_message(f"Registering agent with C2 API: {client_data}")

        try:
            self.is_registered = False
            sio.emit("on_agent_registration", client_data)
            self.log_message("Agent registered successfully with C2 API.")
        except requests.exceptions.RequestException as e:
            QMessageBox.critical(self, "Error", f"Failed to register agent: {e}")
            self.log_message(f"Error registering agent: {e}")

    def register_socket_events(self):
        """
        Register event handlers for the Hexashield client.
        """

        @sio.on("connect")
        def on_connect():
            self.register_agent()
            self.log_message("Hexashield connected.")

        @sio.on("disconnect")
        def on_disconnect():
            self.log_message("Hexashield disconnected.")

        @sio.on("on_execute_command")
        def on_execute_command(data):
            logging.info("Executing received command: %s", data)
            self.log_message(f"Received command: {data}")

            created_at = datetime.now(ZoneInfo("UTC"))
            # Execute preconditions, commands, and cleanups
            all_outputs = []
            overall_status = "success"

            # Extract metadata
            metadata = data.get("metadata", {})
            priority = metadata.get(
                "priority", "medium"
            )  # Default priority to "medium"

            preconditions = data.get("preconditions", [])
            commands = data.get("commands", [])
            cleanups = data.get("cleanups", [])

            for precondition in preconditions:
                test_cmd = precondition.get("test_cmd")
                solve_cmd = precondition.get("solve_cmd")

                if test_cmd:
                    test_output = run_command_in_script_mode(test_cmd)
                    test_status = (
                        "failure" if "failure" in test_output.lower() else "success"
                    )
                    all_outputs.append(
                        {
                            "type": "precondition_test",
                            "command": test_cmd,
                            "output": test_output,
                            "status": test_status,
                        }
                    )

                    if test_status == "failure" and solve_cmd:
                        solve_output = run_command_in_script_mode(solve_cmd)
                        solve_status = (
                            "success"
                            if "success" in solve_output.lower()
                            else "failure"
                        )
                        all_outputs.append(
                            {
                                "type": "precondition_solve",
                                "command": solve_cmd,
                                "output": solve_output,
                                "status": solve_status,
                            }
                        )
                        if solve_status == "failure":
                            overall_status = "failure"
                            break

            if overall_status == "success":
                for command in commands:
                    command_output = run_command_in_script_mode(command)
                    command_status = (
                        "failure" if "failure" in command_output.lower() else "success"
                    )
                    all_outputs.append(
                        {
                            "type": "command",
                            "command": command,
                            "output": command_output,
                            "status": command_status,
                        }
                    )
                    if command_status == "failure":
                        overall_status = "failure"

            for cleanup_command in cleanups:
                cleanup_output = run_command_in_script_mode(cleanup_command)
                cleanup_status = (
                    "failure" if "failure" in cleanup_output.lower() else "success"
                )
                all_outputs.append(
                    {
                        "type": "cleanup",
                        "command": cleanup_command,
                        "output": cleanup_output,
                        "status": cleanup_status,
                    }
                )
                if cleanup_status == "failure":
                    overall_status = "failure"

            # Calculate execution time
            completed_at = datetime.now(ZoneInfo("UTC"))
            execution_time = (completed_at - created_at).total_seconds()

            response = {
                "agent_id": data.get("agent_id"),
                "conversation_id": self.agent_details["Conversation ID"],
                "status": overall_status,
                "outputs": all_outputs,
                "priority": priority,
                "execution_time": f"{execution_time:.2f}s",
                "completed_at": completed_at.isoformat(),
                "created_at": created_at.isoformat(),
                "created_by": self.agent_details["User ID"],
            }
            self.log_message(f"Command response: {response}")

            # Send response back to C2 API
            try:
                sio.emit("on_command_response", response)
                logging.info("Response sent for command: %s", response.get("command"))
                logging.debug("Response data: %s", response)
            except requests.exceptions.RequestException as e:
                logging.error("Failed to send command response to C2 API: %s", e)
                self.log_message(f"Error sending command response to C2 API: {e}")


def main():
    conversation_id = os.getenv("conversation_id", "677c4fe73b87c8bd48c2fe2d")
    user_id = os.getenv("user_id", "677ec4335555a3b7bc1b1969")
    # Example agent details (replace with actual details from the agent)
    agent_details = {
        "Agent ID": "Unknown",
        "Conversation ID": conversation_id,
        "User ID": user_id,
        "Status": "Offline",
        "Last Seen": datetime.now(ZoneInfo("UTC")).isoformat(),
        "Socket URL": "http://localhost:5003",
        "C2 URL": "http://localhost:5001/c2/api/v1",
    }

    app = QApplication(sys.argv)
    window = AgentApp(agent_details)
    window.show()
    sys.exit(app.exec())


if __name__ == "__main__":
    main()
