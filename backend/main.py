# main.py
"""
This script initializes and runs multiple services:
- Web Server (FastAPI)
- C2 Server (FastAPI)
- Socket Listener
"""

import os
import threading
import signal
import uvicorn
from dotenv import load_dotenv
from c2_server.c2_socket_server import run_socket_server
from logger.fastapi_logger import setup_fastapi_logger
from db import mongodb

# Load environment variables from .env file
load_dotenv()

# Configure logger
logger = setup_fastapi_logger("main")

# Connect to the database
mongodb.connect()

# Event to signal threads to stop
shutdown_event = threading.Event()


def run_web_server():
    """
    Runs the web server on the configured port with Uvicorn.
    """
    try:
        web_server_host = os.getenv("WEB_SERVER_HOST", "0.0.0.0")
        web_server_port = int(os.getenv("WEB_SERVER_PORT", "4003"))
        print(f"\nStarting Web Server on http://{web_server_host}:{web_server_port}\n")
        uvicorn.run(
            "web_server.app:app",
            host=web_server_host,
            port=web_server_port,
            log_level="info",
        )
    except Exception as e:
        logger.error(f"Web Server failed to start: {e}")
        shutdown_event.set()


def run_c2_server():
    """
    Runs the C2 server on the configured port with Uvicorn.
    """
    try:
        c2_server_host = os.getenv("C2_SERVER_HOST", "0.0.0.0")
        c2_server_port = int(os.getenv("C2_SERVER_PORT", "4001"))
        print(f"Starting C2 Server on http://{c2_server_host}:{c2_server_port}\n")
        uvicorn.run(
            "c2_server.app:app",
            host=c2_server_host,
            port=c2_server_port,
            log_level="info",
        )
    except Exception as e:
        logger.error(f"C2 Server failed to start: {e}")
        shutdown_event.set()


def run_socket_listener():
    """
    Starts the socket listener on the configured port.
    """
    try:
        socket_host = os.getenv("SOCKET_HOST", "0.0.0.0")
        socket_port = int(os.getenv("SOCKET_PORT", "4000"))
        run_socket_server(socket_host, socket_port)
    except Exception as e:
        logger.error(f"Socket Listener failed to start: {e}")
        shutdown_event.set()


def graceful_exit(signal_received, frame):
    """
    Signal handler for graceful shutdown.
    """
    print("\nShutdown signal received. Stopping threads...")
    shutdown_event.set()


if __name__ == "__main__":
    # Register the signal handler for graceful shutdown
    signal.signal(signal.SIGINT, graceful_exit)
    signal.signal(signal.SIGTERM, graceful_exit)

    # Start services in separate threads
    threads = [
        threading.Thread(target=run_socket_listener, daemon=True),
        threading.Thread(target=run_web_server, daemon=True),
        threading.Thread(target=run_c2_server, daemon=True),
    ]

    for thread in threads:
        thread.start()

    # Wait for shutdown event
    try:
        while not shutdown_event.is_set():
            shutdown_event.wait(1)
    except Exception as e:
        logger.error(f"Error during shutdown: {e}")
    finally:
        print("Cleaning up resources...")
        for thread in threads:
            thread.join(timeout=5)

    print("Application exited cleanly.")
