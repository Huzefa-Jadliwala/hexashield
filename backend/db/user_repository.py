from typing import Any, Dict, Optional
from bson import ObjectId
from pymongo import MongoClient
from pydantic import ValidationError
import os

client = MongoClient(os.getenv("MONGO_URI", "hexalayer"))
db = client[os.getenv("MONGO_DB", "hexalayer")]
users_collection = db["users"]

class UserRepository:

    def create_user(self, user_data: dict) -> str:
        """
        Create a new user and return the user ID.
        """
        # Check if the email already exists in the database
        existing_user = users_collection.find_one({"email": user_data["email"]})
        if existing_user:
            raise ValueError(f"Email {user_data['email']} already exists.")
        
        # Remove the username check since it's not mandatory in the new model
        try:
            result = users_collection.insert_one(user_data)
            return str(result.inserted_id)
        except Exception as e:
            raise ValueError(f"Failed to create user: {str(e)}")

    def get_user_by_id(self, user_id: str) -> Optional[dict]:
        """
        Fetch user by ID.
        """
        return users_collection.find_one({"_id": ObjectId(user_id)})


    def get_user_by_email(self, email: str) -> Optional[dict]:
        """
        Fetch user by email.
        """
        return users_collection.find_one({"email": email})

    def update_user(self, user_id: str, update_data: dict) -> int:
        """
        Updates a user's data in the database by their ID.
        Returns the count of documents modified (1 if successful, 0 if the user is not found).
        """
        try:
            # Ensure the user_id is valid before proceeding
            if not ObjectId.is_valid(user_id):
                raise ValueError("Invalid user ID format")
            
            # Perform the update operation
            result = users_collection.update_one(
                {"_id": ObjectId(user_id)}, {"$set": update_data}
            )
            
            return result.modified_count
        except Exception as e:
            raise ValueError(f"Failed to update user: {str(e)}")

    def delete_user(self, user_id: str) -> int:
        """
        Delete user by ID.
        """
        result = users_collection.delete_one({"_id": ObjectId(user_id)})
        return result.deleted_count

    # def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
    #     """Retrieve a user by their email address."""
    #     user = users_collection.find_one({"email": email})
    #     return user
    
    def update_user_password(self, user_id: str, hashed_password: str) -> int:
        result = users_collection.update_one(
            {"_id": ObjectId(user_id)}, {"$set": {"password": hashed_password}}
        )
        return result.modified_count