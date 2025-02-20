# db/message_repository.py

from typing import Optional, Dict, Any, List, Tuple
from bson.objectid import ObjectId
from pymongo.collection import Collection
from pymongo.errors import PyMongoError
from db import mongodb


class MessageRepository:
    """
    MessageRepository handles database operations for messages, including creation, retrieval, updates, deletion, and listing.
    """

    def __init__(self):
        """Initialize the MessageRepository and ensure MongoDB connection."""
        if mongodb.db is None:
            mongodb.connect()
        # self.collection: Collection = mongodb.get_collection(
        #     "messages"
        # )  # Collection name: "messages"
        collection_name = "messages"
        if collection_name not in mongodb.db.list_collection_names():
            # Create the collection with custom options
            mongodb.db.create_collection(
                collection_name, capped=True, size=5242880, autoIndexId=True
            )
        self.collection: Collection = mongodb.db[collection_name]

    def create_message(self, message_data: Dict[str, Any]) -> str:
        """
        Insert a new message into the database.

        :param message_data: A dictionary containing message details.
        :return: The inserted message's ID as a string.
        :raises ValueError: If the insertion fails.
        """
        try:
            result = self.collection.insert_one(message_data)
            return str(result.inserted_id)
        except PyMongoError as e:
            raise ValueError(f"Failed to create message: {e}")

    def get_message_by_id(self, message_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve a message by its MongoDB ObjectId.

        :param message_id: The ObjectId of the message as a string.
        :return: The message document or None if not found.
        :raises ValueError: If the message ID is invalid or retrieval fails.
        """
        try:
            if not ObjectId.is_valid(message_id):
                raise ValueError(f"Invalid message ID: {message_id}")
            return self.collection.find_one({"_id": ObjectId(message_id)})
        except PyMongoError as e:
            raise ValueError(f"Failed to retrieve message: {e}")

    def update_message(self, message_id: str, update_data: Dict[str, Any]) -> int:
        """
        Update an existing message's data.

        :param message_id: The ObjectId of the message as a string.
        :param update_data: A dictionary containing fields to update.
        :return: The number of documents modified (0 if no match found).
        :raises ValueError: If the message ID is invalid or the update fails.
        """
        try:
            if not ObjectId.is_valid(message_id):
                raise ValueError(f"Invalid message ID: {message_id}")
            update_data["conversation_id"] = ObjectId(update_data["conversation_id"])
            result = self.collection.update_one(
                {"_id": ObjectId(message_id)},
                {"$set": update_data},
            )
            return result.modified_count
        except PyMongoError as e:
            raise ValueError(f"Failed to update message: {e}")

    def delete_message(self, message_id: str) -> int:
        """
        Delete a message by its ID.

        :param message_id: The ObjectId of the message as a string.
        :return: The number of documents deleted (0 if no match found).
        :raises ValueError: If the message ID is invalid or the delete operation fails.
        """
        try:
            if not ObjectId.is_valid(message_id):
                raise ValueError(f"Invalid message ID: {message_id}")
            result = self.collection.delete_one({"_id": ObjectId(message_id)})
            return result.deleted_count
        except PyMongoError as e:
            raise ValueError(f"Failed to delete message: {e}")

    def list_messages(
        self, filter_criteria: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        List all messages matching the given criteria.

        :param filter_criteria: A dictionary with MongoDB filter criteria.
        :return: A list of matching message documents.
        :raises ValueError: If the list operation fails.
        """
        try:
            filter_criteria = filter_criteria or {}
            return list(self.collection.find(filter_criteria))
        except PyMongoError as e:
            raise ValueError(f"Failed to list messages: {e}")

    def list_messages_with_pagination(
        self,
        filter_criteria: Optional[Dict[str, Any]],
        skip: int,
        limit: int,
        sort: Optional[List[Tuple[str, int]]] = None,
    ) -> List[Dict[str, Any]]:
        """
        List messages with pagination and sorting.

        :param filter_criteria: A dictionary with MongoDB filter criteria.
        :param skip: Number of documents to skip (for pagination).
        :param limit: Maximum number of documents to retrieve (for pagination).
        :param sort: Optional list of tuples specifying sorting criteria (field, order).
        :return: A list of matching message documents.
        :raises ValueError: If the operation fails.
        """
        try:
            filter_criteria = filter_criteria or {}
            query = self.collection.find(filter_criteria).skip(skip).limit(limit)

            if sort:
                query = query.sort(sort)

            return list(query)
        except PyMongoError as e:
            raise ValueError(f"Failed to list messages with pagination: {e}")

    def get_message_by_report_id(self, report_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve a message by its associated report ID.

        :param report_id: The ID of the associated report as a string.
        :return: The message document or None if not found.
        :raises ValueError: If the report ID is invalid or retrieval fails.
        """
        try:
            if not ObjectId.is_valid(report_id):
                raise ValueError(f"Invalid report ID: {report_id}")
            return self.collection.find_one({"report._id": ObjectId(report_id)})
        except PyMongoError as e:
            raise ValueError(f"Failed to retrieve message by report ID: {e}")