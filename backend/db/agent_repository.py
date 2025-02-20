# db/agent_repository.py

from bson.objectid import ObjectId
from pymongo.collection import Collection
from pymongo.errors import PyMongoError
from typing import Optional, Dict, Any, List, Tuple
from db import mongodb


class AgentRepository:
    def __init__(self):
        """
        Initialize the AgentRepository by connecting to the MongoDB collection.
        Ensures a connection to the database before performing any operations.
        """
        if mongodb.db is None:
            mongodb.connect()
        self.collection: Collection = mongodb.get_collection("agents")

    def list_agents_with_pagination(
        self,
        filter_criteria: Optional[Dict[str, Any]],
        skip: int,
        limit: int,
        sort: Optional[List[Tuple[str, int]]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Retrieve a paginated list of agents with optional sorting.

        :param filter_criteria: Dictionary containing filter conditions for the query.
        :param skip: Number of records to skip (used for pagination).
        :param limit: Maximum number of records to return (used for pagination).
        :param sort: Optional list of sorting criteria (field, order) tuples.
        :return: A list of matching agent documents.
        :raises ValueError: If the query operation encounters an error.
        """
        try:
            filter_criteria = filter_criteria or {}
            query = self.collection.find(filter_criteria).skip(skip).limit(limit)

            if sort:
                query = query.sort(sort)

            return list(query)
        except PyMongoError as e:
            raise ValueError(f"Failed to list agents with pagination: {e}")

    def create_agent(self, agent_data: Dict[str, Any]) -> str:
        """
        Insert a new agent into the database.

        :param agent_data: Dictionary containing agent details.
        :return: The newly created agent's ID as a string.
        :raises ValueError: If the insertion fails.
        """
        try:
            result = self.collection.insert_one(agent_data)
            return str(result.inserted_id)
        except PyMongoError as e:
            raise ValueError(f"Failed to create agent: {str(e)}")

    def get_agent_by_id(self, agent_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve an agent by its unique agent_id.

        :param agent_id: The unique identifier of the agent as a string.
        :return: A dictionary containing the agent data or None if not found.
        :raises ValueError: If retrieval encounters an error.
        """
        try:
            return self.collection.find_one({"agent_id": agent_id})
        except PyMongoError as e:
            raise ValueError(f"Failed to retrieve agent with ID {agent_id}: {str(e)}")

    def update_agent(self, id: str, update_data: Any) -> int:
        """
        Update an existing agent's data.

        :param id: The MongoDB ObjectId of the agent as a string.
        :param update_data: Dictionary containing fields to update.
        :return: The number of documents modified (0 if no match is found).
        :raises ValueError: If the update fails or the ID is invalid.
        """
        try:
            if not ObjectId.is_valid(id):
                raise ValueError(f"Invalid agent ID: {id}")
            result = self.collection.update_one(
                {"_id": ObjectId(id)},
                {"$set": update_data.dict(exclude_unset=True)},
            )
            return result.modified_count
        except PyMongoError as e:
            raise ValueError(f"Failed to update agent with ID {id}: {str(e)}")

    def delete_agent(self, agent_id: str) -> int:
        """
        Delete an agent from the database by its unique ID.

        :param agent_id: The MongoDB ObjectId of the agent as a string.
        :return: The number of deleted documents (0 if no match is found).
        :raises ValueError: If deletion fails or the ID is invalid.
        """
        try:
            if not ObjectId.is_valid(agent_id):
                raise ValueError(f"Invalid agent ID: {agent_id}")
            result = self.collection.delete_one({"_id": ObjectId(agent_id)})
            return result.deleted_count
        except PyMongoError as e:
            raise ValueError(f"Failed to delete agent with ID {agent_id}: {str(e)}")

    def list_agents(
        self, filter_criteria: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Retrieve all agents that match the provided filter criteria.

        :param filter_criteria: Dictionary containing filter conditions (optional).
        :return: A list of matching agent documents.
        :raises ValueError: If retrieval fails.
        """
        try:
            filter_criteria = filter_criteria or {}
            return list(self.collection.find(filter_criteria))
        except PyMongoError as e:
            raise ValueError(f"Failed to list agents: {str(e)}")

    def upsert_agent(self, agent_id: str, agent_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Perform an upsert operation on an agent. If an agent with the given agent_id exists, update it;
        otherwise, insert a new agent record.

        :param agent_id: The unique agent identifier.
        :param agent_data: Dictionary containing agent details.
        :return: A dictionary containing the number of matched, modified, and upserted records.
        :raises ValueError: If the upsert operation fails.
        """
        try:
            agent_data = {
                key: value for key, value in agent_data.items() if key != "_id"
            }
            result = self.collection.update_one(
                {"agent_id": agent_id},  # Match condition
                {"$set": agent_data},  # Update fields
                upsert=True,  # Insert a new document if no match is found
            )
            return {
                "matched_count": result.matched_count,
                "modified_count": result.modified_count,
                "upserted_id": str(result.upserted_id) if result.upserted_id else None,
            }
        except PyMongoError as e:
            raise ValueError(
                f"Failed to upsert agent with agent_id {agent_id}: {str(e)}"
            )
