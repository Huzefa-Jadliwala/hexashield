"""
Custom logging setup for FastAPI servers.
Includes JSON formatting, level-based filtering, and file/console handlers.
"""

import logging
import json
import os
from datetime import datetime
from logger.config import LOGGER_CONFIG


class JsonFormatter(logging.Formatter):
    """
    Custom JSON formatter for logging. Converts log records to JSON format.
    """

    def format(self, record):
        log_record = {
            "timestamp": datetime.fromtimestamp(record.created).isoformat(),
            "level": record.levelname,
            "message": record.getMessage(),
            "name": record.name,
            "filename": record.filename,
            "function": record.funcName,
            "line": record.lineno,
        }
        return json.dumps(log_record)


class LevelFilter(logging.Filter):
    """
    A filter to allow only specific log levels for a handler.
    """

    def __init__(self, level: int):
        """
        Initialize the level filter.

        Args:
            level (int): Log level to filter (e.g., logging.DEBUG, logging.INFO).
        """
        super().__init__()  # Call the base class constructor
        self.level = level

    def filter(self, record: logging.LogRecord) -> bool:
        """
        Filter log records by level.

        Args:
            record (logging.LogRecord): Log record to evaluate.

        Returns:
            bool: True if the record's level matches the filter level.
        """
        return record.levelno == self.level


def setup_fastapi_logger(server_name: str):
    """
    Set up a logger with JSON formatting specific to a server.

    Args:
        server_name (str): Name of the server (e.g., "web_server", "c2_server", "socket_listener").

    Returns:
        logging.Logger: Configured logger instance.
    """
    # Create a directory for log files
    log_dir = LOGGER_CONFIG["log_dir"]
    os.makedirs(log_dir, exist_ok=True)

    # Generate unique timestamp for log filenames
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")

    # File paths for different log levels
    info_log_file = os.path.join(log_dir, f"{server_name}_info_{timestamp}.log")
    error_log_file = os.path.join(log_dir, f"{server_name}_error_{timestamp}.log")
    debug_log_file = os.path.join(log_dir, f"{server_name}_debug_{timestamp}.log")

    # JSON formatter
    json_formatter = JsonFormatter()

    # Create the logger
    logger = logging.getLogger(server_name)
    logger.setLevel(logging.DEBUG)  # Allow all levels to be processed by handlers

    # Console handler (for real-time output)
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(json_formatter)
    console_handler.setLevel(logging.INFO)  # Only INFO and above for console

    # File handler for DEBUG logs
    debug_handler = logging.FileHandler(debug_log_file)
    debug_handler.setFormatter(json_formatter)
    debug_handler.setLevel(logging.DEBUG)
    debug_handler.addFilter(LevelFilter(logging.DEBUG))  # Only DEBUG logs

    # File handler for INFO logs
    info_handler = logging.FileHandler(info_log_file)
    info_handler.setFormatter(json_formatter)
    info_handler.setLevel(logging.INFO)
    info_handler.addFilter(LevelFilter(logging.INFO))  # Only INFO logs

    # File handler for ERROR logs
    error_handler = logging.FileHandler(error_log_file)
    error_handler.setFormatter(json_formatter)
    error_handler.setLevel(logging.ERROR)
    error_handler.addFilter(LevelFilter(logging.ERROR))  # Only ERROR logs

    # Clear existing handlers to avoid duplicates
    logger.handlers.clear()

    # Add handlers to the logger
    logger.addHandler(console_handler)
    logger.addHandler(debug_handler)
    logger.addHandler(info_handler)
    logger.addHandler(error_handler)

    # Prevent logs from propagating to the root logger
    logger.propagate = False

    return logger


# Configure loggers for different servers
web_server_logger = setup_fastapi_logger("web_server")
c2_server_logger = setup_fastapi_logger("c2_server")
socket_listener_logger = setup_fastapi_logger("socket_listener")
