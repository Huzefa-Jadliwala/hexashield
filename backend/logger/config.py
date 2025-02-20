import os

# Logger configuration
LOGGER_CONFIG = {
    "log_level": os.getenv("LOG_LEVEL", "INFO"),
    "log_dir": os.getenv("LOG_DIR", "logs"),
}
