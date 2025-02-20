from typing import Optional, Any, List
from datetime import datetime
from bson.objectid import ObjectId
from models.base import PyObjectId, PaginatedResponseModel
from pydantic import BaseModel, Field, model_validator


class ReportModel(BaseModel):
    """
    Pydantic model representing a report entity.
    """

    id: PyObjectId = Field(
        default_factory=PyObjectId, alias="_id", description="MongoDB ObjectId"
    )
    message_id: Optional[PyObjectId] = Field(
        None,
        description="ID of the message associated with the report",
        example="676714d997ed07aa9af95abb",
    )
    type: str = Field(
        ...,
        description="Type of the report (e.g., 'webhex').",
        example="webhex",
    )
    conversation_name: Optional[str] = Field(
        None,
        description="Name of the conversation associated with the report.",
        example="WebHex Analysis Report",
    )
    data: Optional[List[Any]] = Field(
        default_factory=list,
        description="Optional additional details about the report.",
        example=[
            {"scan_id": "0", "url": "https://jinx-team.vercel.app/", "report": {}},
            {"scan_id": "1", "url": "https://another-url.com/", "report": {}},
        ],
    )
    details: Optional[Any] = Field(
        default_factory=dict,
        description="Detailed information about the report.",
        example={"scan_id": "0", "url": "https://jinx-team.vercel.app/", "report": {}},
    )
    created_by: Optional[str] = Field(
        None,
        description="ID of the user who created the conversation",
        example="64309628d1cd938d5163ad51",  # Example ObjectId as a string
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="Timestamp when the report was created.",
        example="2024-12-21T19:19:57.788091+00:00",
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="Timestamp when the report was last updated.",
        example="2024-12-21T19:19:57.788114+00:00",
    )

    @model_validator(mode="before")
    def convert_objectid(cls, values):
        """
        Convert string fields to PyObjectId during validation.
        """
        objectid_fields = ["id", "message_id"]
        for field in objectid_fields:
            if field in values and isinstance(values[field], str):
                try:
                    values[field] = PyObjectId(values[field])
                except ValueError:
                    raise ValueError(
                        f"Invalid ObjectId for field {field}: {values[field]}"
                    )
        return values

    def dict(self, **kwargs):
        """
        Override `dict` to ensure proper serialization of ObjectId and timestamps.
        """
        kwargs["by_alias"] = True
        data = super().dict(**kwargs)

        # Ensure `_id` and `message_id` are strings
        if "_id" in data and isinstance(data["_id"], ObjectId):
            data["_id"] = str(data["_id"])
        if "message_id" in data and isinstance(data["message_id"], ObjectId):
            data["message_id"] = str(data["message_id"])

        # Serialize datetime fields to ISO format
        if data.get("created_at"):
            data["created_at"] = data["created_at"].isoformat()
        if data.get("updated_at"):
            data["updated_at"] = data["updated_at"].isoformat()
        return data

    def json(self, **kwargs):
        """
        Override `json` to ensure proper serialization of ObjectId and timestamps.
        """
        kwargs["by_alias"] = True
        return super().json(**kwargs)

    class Config:
        """
        Pydantic configuration for JSON encoding and schema generation.
        """

        populate_by_name = True
        json_encoders = {ObjectId: str}
        json_schema_extra = {
            "example": {
                "_id": "676714dc97ed07aa9af95abc",
                "message_id": "676714d997ed07aa9af95abb",
                "type": "webhex",
                "conversation_name": "WebHex Analysis Report",
                "data": [
                    {
                        "scan_id": "0",
                        "url": "https://jinx-team.vercel.app/",
                        "report": {},
                    },
                    {"scan_id": "1", "url": "https://another-url.com/", "report": {}},
                ],
                "details": {
                    "scan_id": "0",
                    "url": "https://jinx-team.vercel.app/",
                    "report": {},
                },
                "created_at": "2024-12-21T19:19:57.788091+00:00",
                "updated_at": "2024-12-21T19:19:57.788114+00:00",
            }
        }


class ReportPaginatedResponseModel(PaginatedResponseModel[ReportModel]):
    """
    Paginated response model for reports.
    """

    pass
