from pydantic import BaseModel, Field, ValidationError, model_validator
from typing import Optional, List, Literal, Union
from models.base import PyObjectId, PaginatedResponseModel
from bson.objectid import ObjectId
from models.conversation import ConversationModel


class Output(BaseModel):
    """
    Model representing the output of a command or step in the execution process.
    """

    type: Literal["precondition_test", "precondition_solve", "command", "cleanup"] = (
        Field(
            ...,
            description="The type of step (e.g., precondition_test, command, cleanup).",
        )
    )
    command: str = Field(..., description="The executed command.")
    output: str = Field(
        ..., description="The output or result of the command execution."
    )
    status: Literal["success", "failure"] = Field(
        ..., description="The status of the command execution."
    )


class TaskModel(BaseModel):
    """
    Pydantic model representing a task executed by an agent.
    """

    id: PyObjectId = Field(
        ...,
        description="MongoDB ObjectId",
        alias="_id",
        example="64309628d1cd938d5163ad52",
    )
    agent_id: str = Field(
        ..., description="The ID of the agent for which the command was executed."
    )
    agent_name: str = Field(
        ..., description="The name of the agent for which the command was executed."
    )
    conversation: Optional[ConversationModel] = Field(
        None,
        description="Optional conversation data associated with the task",
    )
    status: Literal["success", "failure"] = Field(
        ..., description="The overall status of the task."
    )
    outputs: List[Output] = Field(
        ..., description="A list of outputs generated during the task execution."
    )
    priority: Optional[Literal["low", "medium", "high"]] = Field(
        "medium", description="The priority level of the task."
    )
    execution_time: Optional[str] = Field(
        None, description="The total time taken to execute the task."
    )
    created_at: Optional[str] = Field(
        None, description="The timestamp when the task was created."
    )
    created_by: str = Field(
        ...,
        description="ID of the user that created the taks",
        example="64309628d1cd938d5163ad49",
    )
    completed_at: Optional[str] = Field(
        None, description="The timestamp when the task was completed."
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

        # Ensure `_id` is converted to a string if it exists and is an ObjectId
        if "_id" in data and isinstance(data["_id"], ObjectId):
            data["_id"] = str(data["_id"])

        return data

    def json(self, **kwargs):
        """
        Override `json` to ensure `created_at` and `updated_at` are serialized to strings.
        """
        kwargs["by_alias"] = True
        return super().json(**kwargs)

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
                "agent_id": "c7cec2c7-55a8-4c47-bb92-a538b6a0726c",
                "status": "success",
                "outputs": [
                    {
                        "type": "command",
                        "command": "ls -la",
                        "output": "/Users/hafiz/dev/planspiel/repo/hexalayer-backend",
                        "status": "success",
                    },
                    {
                        "type": "cleanup",
                        "command": "rm -f /tmp/testfile.txt",
                        "output": "",
                        "status": "failure",
                    },
                ],
                "metadata": {
                    "priority": "high",
                    "execution_time": "5s",
                    "created_at": "2024-12-15T10:00:00Z",
                    "completed_at": "2024-12-15T10:05:00Z",
                },
            }
        }


class TaskPaginatedResponseModel(PaginatedResponseModel[TaskModel]):
    """
    Paginated response model for conversations.
    """

    pass
