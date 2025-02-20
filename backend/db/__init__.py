# db/__init__.py

"""
This module provides a MongoDB connection handler using the Singleton pattern.
It supports connecting to a MongoDB instance and retrieving collections.
"""

import os
from pymongo import MongoClient
from logger.fastapi_logger import setup_fastapi_logger

logger = setup_fastapi_logger("mongodb")


class MongoDB:
    """
    A MongoDB connection handler.

    Handles connecting to MongoDB, selecting a database, and retrieving collections.
    Uses a Singleton pattern for consistent access to the database connection.
    """

    def __init__(self):
        """
        Initializes the MongoDB handler with URI and database name from environment variables.
        """
        self.uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
        self.db_name = os.getenv("MONGO_DB", "hexalayer")
        self.client = None
        self.db = None

    def connect(self):
        """
        Establishes a connection to the MongoDB server.

        Reads the URI and database name from environment variables. Logs the connection
        status and raises an exception if the connection fails.

        Raises:
            Exception: If the connection to MongoDB fails.
        """
        try:
            self.client = MongoClient(self.uri)
            self.db = self.client[self.db_name]
            logger.info(
                "Connected to MongoDB at %s, database: %s", self.uri, self.db_name
            )
        except Exception as e:
            logger.error("Error connecting to MongoDB: %s", e)
            raise e

    def get_collection(self, collection_name):
        """
        Retrieves a collection from the connected MongoDB database.

        Args:
            collection_name (str): The name of the collection to retrieve.

        Returns:
            pymongo.collection.Collection: The requested MongoDB collection.

        Raises:
            RuntimeError: If the database connection is not established.
        """
        if self.db is None:
            raise RuntimeError(
                "Database connection is not established. Call `connect` first."
            )
        return self.db[collection_name]


# Singleton instance of MongoDB
mongodb = MongoDB()
