from typing import Any, List, Optional, Dict, Tuple
from bson import ObjectId
from pymongo import MongoClient
from pymongo.errors import PyMongoError
from db import mongodb
from pymongo.collection import Collection
import os

# Database connection
client = MongoClient(os.getenv("MONGO_URI", "hexalayer"))
db = client[os.getenv("MONGO_DB", "hexalayer")]
reports_collection = db["reports"]


class ReportRepository:
    """
    Repository class for performing database operations on reports.
    """

    def __init__(self):
        collection_name = "reports"
        self.collection: Collection = mongodb.db[collection_name]

    def create_report(self, report_data: dict) -> str:
        """
        Create a new report and return the report ID.
        """
        try:
            result = reports_collection.insert_one(report_data)
            return str(result.inserted_id)
        except PyMongoError as e:
            raise ValueError(f"Failed to create report: {str(e)}")

    def get_report_by_id(self, report_id: str) -> Optional[Dict[str, Any]]:
        """
        Fetch a report by its ID and ensure ObjectId is serialized as a string.

        :param report_id: The ID of the report to fetch.
        :return: A dictionary representing the report document, or None if not found.
        :raises ValueError: If the report ID format is invalid or retrieval fails.
        """
        if not ObjectId.is_valid(report_id):
            raise ValueError("Invalid report ID format")

        try:
            if not ObjectId.is_valid(report_id):
                raise ValueError(f"Invalid report ID: {report_id}")
            return self.collection.find_one({"_id": ObjectId(report_id)})
        except PyMongoError as e:
            raise ValueError(f"Failed to fetch the report: {e}")

    def get_reports_by_type(self, report_type: str) -> list:
        """
        Fetch all reports of a specific type.
        """
        try:
            return list(reports_collection.find({"type": report_type}))
        except PyMongoError as e:
            raise ValueError(f"Failed to fetch reports by type: {str(e)}")

    def update_report(self, report_id: str, update_data: Dict) -> int:
        """
        Update a report's data in the database by its ID.
        Returns the count of documents modified (1 if successful, 0 if not found).
        """
        if not ObjectId.is_valid(report_id):
            raise ValueError("Invalid report ID format")

        try:
            result = reports_collection.update_one(
                {"_id": ObjectId(report_id)}, {"$set": update_data}
            )
            return result.modified_count
        except PyMongoError as e:
            raise ValueError(f"Failed to update report: {str(e)}")

    def delete_report(self, report_id: str) -> int:
        """
        Delete a report by its ID.
        """
        if not ObjectId.is_valid(report_id):
            raise ValueError("Invalid report ID format")

        try:
            result = reports_collection.delete_one({"_id": ObjectId(report_id)})
            return result.deleted_count
        except PyMongoError as e:
            raise ValueError(f"Failed to delete report: {str(e)}")

    def list_reports_with_pagination(
        self,
        filter_criteria: Optional[Dict[str, Any]] = None,
        skip: int = 0,
        limit: int = 10,
        sort: Optional[List[Tuple[str, int]]] = None,
    ) -> List[Dict[str, Any]]:
        """
        List reports with pagination and sorting, ensuring ObjectId is serialized as a string.

        :param filter_criteria: A dictionary with MongoDB filter criteria.
        :param skip: Number of documents to skip (default: 0).
        :param limit: Maximum number of documents to retrieve (default: 10).
        :param sort: Optional list of tuples specifying sorting criteria (field, order).
        :return: A list of matching report documents.
        :raises ValueError: If the operation fails.
        """
        try:
            filter_criteria = filter_criteria or {}
            query = self.collection.find(filter_criteria).skip(skip).limit(limit)

            if sort:
                query = query.sort(sort)

            return list(query)
        except PyMongoError as e:
            raise ValueError(f"Failed to list reports with pagination: {e}")
