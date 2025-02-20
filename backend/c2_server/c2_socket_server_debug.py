# c2_server/c2_socket_server_debug.py

import os
import sys
import time
from multiprocessing import Process
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# Add the backend directory to the Python path
# sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../")))

from c2_server.c2_socket_server import run_socket_server

HOST = os.getenv("SOCKET_HOST", "0.0.0.0")
PORT = os.getenv("SOCKET_PORT", "5003")


class RestartHandler(FileSystemEventHandler):
    """
    Handles file changes and restarts the server.
    """

    def __init__(self, restart_callback):
        super().__init__()
        self.restart_callback = restart_callback

    def on_any_event(self, event):
        """
        Triggers on any file change event.
        """
        if event.is_directory:
            return
        if event.src_path.endswith(".py"):
            print(f"[DEBUG] Detected change in: {event.src_path}. Restarting server...")
            self.restart_callback()


def restart_server():
    """
    Restarts the server by reloading the script.
    """
    print("[DEBUG] Restarting Socket.IO server...")
    os.execv(sys.executable, [sys.executable] + sys.argv)


def start_listener():
    """
    Starts the Socket.IO server in a separate process.
    """
    run_socket_server(HOST, PORT)


if __name__ == "__main__":
    # Start the Socket.IO server in a separate process
    server_process = Process(target=start_listener, daemon=True)
    server_process.start()

    print(f"[DEBUG] Socket.IO server running on http://{HOST}:{PORT}")

    # Set up file watcher
    observer = Observer()
    restart_handler = RestartHandler(restart_server)
    observer.schedule(restart_handler, path="c2_server", recursive=True)
    observer.start()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("[DEBUG] Shutting down server...")
        observer.stop()
        server_process.terminate()

    observer.join()
    server_process.join()
