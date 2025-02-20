# models/conversations.py

from typing import Optional
from datetime import datetime
from bson.objectid import ObjectId
from models.base import PyObjectId, PaginatedResponseModel
from pydantic import BaseModel, Field, ValidationError, model_validator


class ConversationModel(BaseModel):
    """
    Pydantic model representing a conversation entity.
    """
    id: PyObjectId = Field(
        default_factory=PyObjectId, alias="_id", description="MongoDB ObjectId"
    )
    title: str = Field(
        ...,
        description="Title of the conversation",
        example="Team Meeting Notes",
    )
    type: Optional[str] = Field(
        default=None,
        description="Type of the conversation",
        example="manual, webhex, auto",
    )
    standard: Optional[str] = Field(
        default=None,
        description="Standard of the conversation",
        example="OWASP, PCIDSS, NIST CSF, ISO27001-A, GDPR, HIPAA",
    )
    created_by: str = Field(
        ...,
        description="ID of the user who created the conversation",
        example="64309628d1cd938d5163ad51",  # Example ObjectId as a string
    )
    created_at: Optional[datetime] = Field(
        default_factory=datetime.utcnow,
        description="Timestamp when the conversation was created",
        example="2024-12-01T12:00:00Z",
    )
    updated_at: Optional[datetime] = Field(
        default_factory=datetime.utcnow,
        description="Timestamp when the conversation was last updated",
        example="2024-12-01T12:30:00Z",
    )

    @model_validator(mode="before")
    def convert_objectid(cls, values):
        """
        Convert string fields to PyObjectId during validation.
        """
        for field in ["id"]:
            if field in values and isinstance(values[field], str):
                try:
                    values[field] = PyObjectId(values[field])
                except ValueError:
                    raise ValidationError(
                        f"Invalid ObjectId for field {field}: {values[field]}"
                    )
        return values

    def dict(self, **kwargs):
        """
        Override `dict` to ensure `created_at` and `updated_at` are serialized to strings.
        """
        kwargs["by_alias"] = True
        data = super().dict(**kwargs)
        if "_id" in data and isinstance(data["_id"], ObjectId):
            data["_id"] = str(data["_id"])
        if data.get("created_at"):
            data["created_at"] = data["created_at"].isoformat()
        if data.get("updated_at"):
            data["updated_at"] = data["updated_at"].isoformat()
        return data

    def json(self, **kwargs):
        """
        Override `json` to ensure `created_at` and `updated_at` are serialized to strings.
        """
        kwargs["by_alias"] = True
        return super().json(**kwargs)

    class Config:
        """
        Pydantic configuration for JSON encoding and schema generation.
        """

        populate_by_name = True
        json_encoders = {PyObjectId: str}
        json_schema_extra = {
            "example": {
                "_id": "64309628d1cd938d5163ad49",
                "title": "Team Meeting Notes",
                "type": "manual",
                "created_by": "64309628d1cd938d5163ad51",
                "created_at": "2024-12-01T12:00:00Z",
                "updated_at": "2024-12-01T12:30:00Z",
            }
        }


class ConversationPaginatedResponseModel(PaginatedResponseModel[ConversationModel]):
    """
    Paginated response model for conversations.
    """

    pass
