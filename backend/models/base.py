from typing import Generic, List, TypeVar
from bson import ObjectId
from pydantic_core import core_schema
from pydantic import BaseModel, GetCoreSchemaHandler
from pydantic.json_schema import JsonSchemaValue


class PyObjectId(ObjectId):
    """
    A custom Pydantic-compatible ObjectId type for MongoDB.
    """

    @classmethod
    def __get_pydantic_core_schema__(
        cls, source: core_schema.CoreSchema | None, handler: GetCoreSchemaHandler
    ) -> core_schema.CoreSchema:
        """
        Generates the Pydantic core schema for this custom type.
        Validates that the value is a valid ObjectId.
        """
        return core_schema.with_info_plain_validator_function(cls.validate)

    @classmethod
    def __get_pydantic_json_schema__(
        cls, core_schema: core_schema.CoreSchema, handler: GetCoreSchemaHandler
    ) -> JsonSchemaValue:
        """
        Generates the JSON schema for this custom type.
        Specifies that the ObjectId is represented as a string in JSON.
        """
        return {"type": "string", "format": "objectid"}

    @classmethod
    def validate(cls, value: str, info: core_schema.ValidationInfo) -> ObjectId:
        """
        Validates whether the provided value is a valid MongoDB ObjectId.
        Raises a ValueError if the value is invalid.
        """
        if not ObjectId.is_valid(value):
            raise ValueError(f"Invalid ObjectId: {value}")
        return ObjectId(value)


T = TypeVar("T")


class PaginatedResponseModel(BaseModel, Generic[T]):
    """
    A generic model for paginated responses.
    """

    page: int
    page_size: int
    total_items: int
    total_pages: int
    data: List[T]

    class Config:
        """
        Pydantic configuration for JSON schema generation.
        """

        json_schema_extra = {
            "example": {
                "page": 1,
                "page_size": 10,
                "total_items": 100,
                "total_pages": 10,
                "data": [],
            }
        }
