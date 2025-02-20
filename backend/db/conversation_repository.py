# db/conversation_repository.py

from typing import Optional, Dict, Any, List, Tuple
from bson.objectid import ObjectId
from pymongo.collection import Collection
from pymongo.errors import PyMongoError
from db import mongodb


class ConversationRepository:
    """
    ConversationRepository handles database operations for conversations, including creation, retrieval, updates, deletion, and listing.
    """

    def __init__(self):
        """Initialize the ConversationRepository and ensure MongoDB connection."""
        if mongodb.db is None:
            mongodb.connect()
        self.collection: Collection = mongodb.get_collection(
            "conversations"
        )  # Collection name: "conversations"

    def create_conversation(self, conversation_data: Dict[str, Any]) -> str:
        """
        Insert a new conversation into the database.

        :param conversation_data: A dictionary containing conversation details.
        :return: The inserted conversation's ID as a string.
        :raises ValueError: If the insertion fails.
        """
        try:
            result = self.collection.insert_one(conversation_data)
            return str(result.inserted_id)
        except PyMongoError as e:
            raise ValueError(f"Failed to create conversation: {e}")

    def get_conversation_by_id(self, conversation_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve a conversation by its MongoDB ObjectId.

        :param conversation_id: The ObjectId of the conversation as a string.
        :return: The conversation document or None if not found.
        :raises ValueError: If the conversation ID is invalid or retrieval fails.
        """
        try:
            if not ObjectId.is_valid(conversation_id):
                raise ValueError(f"Invalid conversation ID: {conversation_id}")
            return self.collection.find_one({"_id": ObjectId(conversation_id)})
        except PyMongoError as e:
            raise ValueError(f"Failed to retrieve conversation: {e}")

    def update_conversation(
        self, conversation_id: str, update_data: Dict[str, Any]
    ) -> int:
        """
        Update an existing conversation's data.

        :param conversation_id: The ObjectId of the conversation as a string.
        :param update_data: A dictionary containing fields to update.
        :return: The number of documents modified (0 if no match found).
        :raises ValueError: If the conversation ID is invalid or the update fails.
        """
        try:
            if not ObjectId.is_valid(conversation_id):
                raise ValueError(f"Invalid conversation ID: {conversation_id}")
            result = self.collection.update_one(
                {"_id": ObjectId(conversation_id)},
                {"$set": update_data},
            )
            return result.modified_count
        except PyMongoError as e:
            raise ValueError(f"Failed to update conversation: {e}")

    def delete_conversation(self, conversation_id: str) -> int:
        """
        Delete a conversation by its ID.

        :param conversation_id: The ObjectId of the conversation as a string.
        :return: The number of documents deleted (0 if no match found).
        :raises ValueError: If the conversation ID is invalid or the delete operation fails.
        """
        try:
            if not ObjectId.is_valid(conversation_id):
                raise ValueError(f"Invalid conversation ID: {conversation_id}")
            result = self.collection.delete_one({"_id": ObjectId(conversation_id)})
            return result.deleted_count
        except PyMongoError as e:
            raise ValueError(f"Failed to delete conversation: {e}")

    def list_conversations(
        self, filter_criteria: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        List all conversations matching the given criteria.

        :param filter_criteria: A dictionary with MongoDB filter criteria.
        :return: A list of matching conversation documents.
        :raises ValueError: If the list operation fails.
        """
        try:
            filter_criteria = filter_criteria or {}
            return list(self.collection.find(filter_criteria))
        except PyMongoError as e:
            raise ValueError(f"Failed to list conversations: {e}")

    def upsert_conversation(
        self, conversation_id: str, conversation_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Upsert a conversation by its conversation_id.
        If a conversation with the given ID exists, update it. Otherwise, insert a new document.

        :param conversation_id: The unique conversation ID (not MongoDB `_id`).
        :param conversation_data: A dictionary containing conversation details.
        :return: A dictionary with `matched_count`, `modified_count`, and `upserted_id`.
        :raises ValueError: If the upsert operation fails.
        """
        try:
            # Remove `_id` from conversation_data to prevent modifying the immutable `_id` field
            conversation_data = {
                key: value for key, value in conversation_data.items() if key != "_id"
            }
            result = self.collection.update_one(
                {"conversation_id": conversation_id},  # Match criteria
                {"$set": conversation_data},  # Fields to update
                upsert=True,  # Create a new document if no match is found
            )
            return {
                "matched_count": result.matched_count,
                "modified_count": result.modified_count,
                "upserted_id": str(result.upserted_id) if result.upserted_id else None,
            }
        except PyMongoError as e:
            raise ValueError(f"Failed to upsert conversation: {e}")

    def list_conversations_with_pagination(
        self, 
        filter_criteria: Optional[Dict[str, Any]], 
        skip: int, 
        limit: int, 
        sort: Optional[List[Tuple[str, int]]] = None
    ) -> List[Dict[str, Any]]:
        """
        List conversations with pagination and sorting.

        :param filter_criteria: A dictionary with MongoDB filter criteria.
        :param skip: Number of documents to skip (for pagination).
        :param limit: Maximum number of documents to retrieve (for pagination).
        :param sort: Optional list of tuples specifying sorting criteria (field, order).
        :return: A list of matching conversation documents.
        :raises ValueError: If the operation fails.
        """
        try:
            filter_criteria = filter_criteria or {}
            query = self.collection.find(filter_criteria).skip(skip).limit(limit)
            
            if sort:
                query = query.sort(sort)
            
            return list(query)
        except PyMongoError as e:
            raise ValueError(f"Failed to list conversations with pagination: {e}")
