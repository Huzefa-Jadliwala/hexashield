from typing import Optional, Dict, Union
from datetime import datetime
from pydantic import BaseModel, Field, ValidationError, model_validator
from c2_server.events.utils import current_utc_time
from models.base import PyObjectId
from bson.objectid import ObjectId
from models.report import ReportModel
from models.task import TaskModel


class MessageModel(BaseModel):
    """
    Pydantic model representing a message entity.
    """

    id: PyObjectId = Field(
        ...,
        description="MongoDB ObjectId",
        alias="_id",
        example="64309628d1cd938d5163ad52",
    )
    conversation_id: PyObjectId = Field(
        ...,
        description="ID of the conversation this message belongs to",
        example="64309628d1cd938d5163ad49",
    )
    role: str = Field(
        ...,
        description="Sender of the message, either 'user' or 'assistant'",
        example="user",
    )
    content: str = Field(
        ...,
        description="Text content of the message",
        example="Hello, how can I help you?",
    )
    type: Optional[str] = Field(
        None, description="Type of the message", example="webhex"
    )
    details: Optional[Dict[str, Union[str, Dict]]] = Field(
        None,
        description="Additional details about the message",
        example={"scanId": 1, "url": "https://example.com", "report": {}},
    )
    report: Optional[ReportModel] = Field(
        None,
        description="Optional report data associated with the message",
    )
    task: Optional[TaskModel] = Field(
        None,
        description="Optional report data associated with the message",
    )
    created_at: Optional[datetime] = Field(
        default_factory=lambda: current_utc_time().isoformat(),
        description="Timestamp when the message was created",
        example="2024-12-01T12:00:00Z",
    )
    updated_at: Optional[datetime] = Field(
        default_factory=lambda: current_utc_time().isoformat(),
        description="Timestamp when the message was last updated",
        example="2024-12-01T12:10:00Z",
    )

    @model_validator(mode="before")
    def convert_objectid(cls, values):
        """
        Convert string fields to PyObjectId during validation.
        """
        for field in ["id", "conversation_id"]:
            if field in values and isinstance(values[field], str):
                try:
                    values[field] = PyObjectId(values[field])
                except ValueError:
                    raise ValidationError(
                        f"Invalid ObjectId for field {field}: {values[field]}"
                    )
        return values

    @model_validator(mode="after")
    def validate_report(cls, values):
        """
        Ensure `report` field is parsed correctly.
        """
        if "report" in values and isinstance(values["report"], dict):
            try:
                values["report"] = ReportModel(**values["report"])
            except ValidationError as e:
                raise ValidationError(f"Invalid report data: {e}")

        if "task" in values and isinstance(values["task"], dict):
            try:
                values["task"] = TaskModel(**values["task"])
            except ValidationError as e:
                raise ValidationError(f"Invalid task data: {e}")

        return values

    def dict(self, **kwargs):
        """
        Override `dict` to ensure `created_at` and `updated_at` are serialized to strings,
        and `_id` and `conversation_id` are properly converted to strings if they are ObjectId.
        """
        kwargs["by_alias"] = True
        data = super().dict(**kwargs)

        # Ensure `_id` is converted to a string if it exists and is an ObjectId
        if "_id" in data and isinstance(data["_id"], ObjectId):
            data["_id"] = str(data["_id"])

        # Ensure `conversation_id` is converted to a string if it exists and is an ObjectId
        if "conversation_id" in data and isinstance(data["conversation_id"], ObjectId):
            data["conversation_id"] = str(data["conversation_id"])

        # Serialize `created_at` and `updated_at` to ISO format strings
        if "created_at" in data and isinstance(data["created_at"], datetime):
            data["created_at"] = data["created_at"].isoformat()
        if "updated_at" in data and isinstance(data["updated_at"], datetime):
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
                "id": "64309628d1cd938d5163ad52",
                "conversation_id": "64309628d1cd938d5163ad49",
                "role": "user",
                "content": "Hello, how can I help you?",
                "type": "webhex",
                "details": {"scanId": 1, "url": "https://example.com", "report": {}},
                "report": {
                    "id": "64309628d1cd938d5163ad51",
                    "title": "Security Scan Report",
                    "summary": "All checks passed",
                },
                "created_at": "2024-12-01T12:00:00+00:00",
                "updated_at": "2024-12-01T12:10:00+00:00",
            }
        }
