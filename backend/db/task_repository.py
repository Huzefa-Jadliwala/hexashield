# db/task_repository.py

from typing import Optional, Dict, Any, List, Tuple
from bson.objectid import ObjectId
from pymongo.collection import Collection
from pymongo.errors import PyMongoError
from db import mongodb


class TaskRepository:
    """
    TaskRepository handles database operations for tasks, including creation, retrieval, updates, deletion, and listing.
    """

    def __init__(self):
        """Initialize the TaskRepository and ensure MongoDB connection."""
        if mongodb.db is None:
            mongodb.connect()
        self.collection: Collection = mongodb.get_collection(
            "tasks"
        )  # Collection name: "tasks"

    def list_tasks_with_pagination(
        self,
        filter_criteria: Optional[Dict[str, Any]],
        skip: int,
        limit: int,
        sort: Optional[List[Tuple[str, int]]] = None,
    ) -> List[Dict[str, Any]]:
        """
        List tasks with pagination and sorting.

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
            raise ValueError(f"Failed to list tasks with pagination: {e}")

    def create_task(self, task_data: Dict[str, Any]) -> str:
        """
        Insert a new task into the database.

        :param task_data: A dictionary containing task details.
        :return: The inserted task's ID as a string.
        :raises ValueError: If the insertion fails.
        """
        try:
            result = self.collection.insert_one(task_data)
            return str(result.inserted_id)
        except PyMongoError as e:
            raise ValueError(f"Failed to create task: {e}")

    def get_task_by_id(self, task_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve a task by its MongoDB ObjectId.

        :param task_id: The ObjectId of the task as a string.
        :return: The task document or None if not found.
        :raises ValueError: If the task ID is invalid or retrieval fails.
        """
        try:
            if not ObjectId.is_valid(task_id):
                raise ValueError(f"Invalid task ID: {task_id}")
            return self.collection.find_one({"_id": ObjectId(task_id)})
        except PyMongoError as e:
            raise ValueError(f"Failed to retrieve task: {e}")

    def update_task(self, task_id: str, update_data: Dict[str, Any]) -> int:
        """
        Update an existing task's data.

        :param task_id: The ObjectId of the task as a string.
        :param update_data: A dictionary containing fields to update.
        :return: The number of documents modified (0 if no match found).
        :raises ValueError: If the task ID is invalid or the update fails.
        """
        try:
            if not ObjectId.is_valid(task_id):
                raise ValueError(f"Invalid task ID: {task_id}")
            result = self.collection.update_one(
                {"_id": ObjectId(task_id)},
                {"$set": update_data},
            )
            return result.modified_count
        except PyMongoError as e:
            raise ValueError(f"Failed to update task: {e}")

    def delete_task(self, task_id: str) -> int:
        """
        Delete a task by its ID.

        :param task_id: The ObjectId of the task as a string.
        :return: The number of documents deleted (0 if no match found).
        :raises ValueError: If the task ID is invalid or the delete operation fails.
        """
        try:
            if not ObjectId.is_valid(task_id):
                raise ValueError(f"Invalid task ID: {task_id}")
            result = self.collection.delete_one({"_id": ObjectId(task_id)})
            return result.deleted_count
        except PyMongoError as e:
            raise ValueError(f"Failed to delete task: {e}")

    def list_tasks(
        self, filter_criteria: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        List all tasks matching the given criteria.

        :param filter_criteria: A dictionary with MongoDB filter criteria.
        :return: A list of matching task documents.
        :raises ValueError: If the list operation fails.
        """
        try:
            filter_criteria = filter_criteria or {}
            return list(self.collection.find(filter_criteria))
        except PyMongoError as e:
            raise ValueError(f"Failed to list tasks: {e}")

    def upsert_task(self, task_id: str, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Upsert a task by its task_id.
        If a task with the given ID exists, update it. Otherwise, insert a new document.

        :param task_id: The unique task ID (not MongoDB `_id`).
        :param task_data: A dictionary containing task details.
        :return: A dictionary with `matched_count`, `modified_count`, and `upserted_id`.
        :raises ValueError: If the upsert operation fails.
        """
        try:
            # Remove `_id` from task_data to prevent modifying the immutable `_id` field
            task_data = {key: value for key, value in task_data.items() if key != "_id"}
            result = self.collection.update_one(
                {"taskid": task_id},  # Match criteria
                {"$set": task_data},  # Fields to update
                upsert=True,  # Create a new document if no match is found
            )
            return {
                "matched_count": result.matched_count,
                "modified_count": result.modified_count,
                "upserted_id": str(result.upserted_id) if result.upserted_id else None,
            }
        except PyMongoError as e:
            raise ValueError(f"Failed to upsert task: {e}")
