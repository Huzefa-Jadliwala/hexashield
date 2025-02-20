# routes/message_routes.py

from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query
from db.message_repository import MessageRepository
from models.message import MessageModel
from models.base import PaginatedResponseModel
from bson.objectid import ObjectId

# Create an instance of the MessageRepository
message_repo = MessageRepository()

# Create a FastAPI router for message routes
router = APIRouter()


@router.get(
    "/query",
    response_model=PaginatedResponseModel[MessageModel],
    summary="Query messages with pagination and sorting",
    description="Fetch a paginated list of messages, optionally filtered by conversation_id and sorted by a specified field.",
)
async def query_messages(
    conversation_id: Optional[str] = Query(
        None, description="Filter by conversation_id"
    ),
    page: int = Query(1, ge=1, description="Page number (default is 1)"),
    page_size: int = Query(
        10,
        ge=1,
        le=100,
        description="Number of items per page (default is 10, max is 100)",
    ),
    sort_by: str = Query(
        "created_at", description="Field to sort by (default is 'created_at')"
    ),
    sort_order: str = Query(
        "asc",
        regex="^(asc|desc)$",
        description="Sort order: 'asc' for ascending, 'desc' for descending (default is 'asc')",
    ),
):
    """
    Query messages with pagination and sorting.

    - **conversation_id**: Filter messages by the associated conversation ID.
    - **page**: The page number to retrieve.
    - **page_size**: The number of items per page.
    - **sort_by**: Field to sort by (default is 'created_at').
    - **sort_order**: Sorting direction: 'asc' (ascending) or 'desc' (descending).

    Returns:
    - A paginated and sorted list of messages matching the criteria.
    """
    filter_criteria = {}
    if conversation_id:
        if not ObjectId.is_valid(conversation_id):
            raise ValueError("Invalid conversation ID")
        filter_criteria["conversation_id"] = ObjectId(conversation_id)

    skip = (page - 1) * page_size
    sort_criteria = [(sort_by, 1 if sort_order == "asc" else -1)]

    try:
        messages = message_repo.list_messages_with_pagination(
            filter_criteria, skip=skip, limit=page_size, sort=sort_criteria
        )
        total_items = message_repo.collection.count_documents(filter_criteria)
        total_pages = (total_items + page_size - 1) // page_size

        return {
            "page": page,
            "page_size": page_size,
            "total_items": total_items,
            "total_pages": total_pages,
            "data": messages,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get(
    "/{message_id}",
    response_model=MessageModel,
    summary="Get a message by ID",
    description="Fetch the details of a specific message using its ID.",
)
async def get_message(message_id: str):
    """
    Get a message by its ID.

    - **message_id**: The ID of the message to retrieve.

    Returns:
    - The message details if found, or a 404 error if the message does not exist.
    """
    message = message_repo.get_message_by_id(message_id)
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    return message


@router.post(
    "/",
    response_model=MessageModel,
    status_code=201,
    summary="Create a new message",
    description="Endpoint to create a new message in the system.",
)
async def create_message(message: MessageModel) -> MessageModel:
    """
    Create a new message in the system.

    - **message**: The message details, validated using the MessageModel.

    Returns:
    - The details of the newly created message.
    """
    try:
        message_data = message.dict(by_alias=True)
        message_id = message_repo.create_message(message_data)
        created_message = message_repo.get_message_by_id(message_id)
        if not created_message:
            raise HTTPException(
                status_code=500, detail="Failed to retrieve the created message"
            )
        return created_message
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="An unexpected error occurred")


@router.put(
    "/{message_id}",
    response_model=MessageModel,
    summary="Update a message",
    description="Update the details of an existing message by its ID.",
)
async def update_message(message_id: str, update_data: MessageModel):
    """
    Update an existing message.

    - **message_id**: The ID of the message to update.
    - **update_data**: The updated message details.

    Returns:
    - A success message if the message was updated, or a 404 error if the message does not exist.
    """
    updated_count = message_repo.update_message(
        message_id, update_data.dict(exclude_unset=True)
    )
    if updated_count == 0:
        raise HTTPException(status_code=404, detail="Message not found")
    return update_data


@router.delete(
    "/{message_id}",
    response_model=Dict[str, str],
    summary="Delete a message",
    description="Delete a message from the system by its ID.",
)
async def delete_message(message_id: str):
    """
    Delete a message from the system.

    - **message_id**: The ID of the message to delete.

    Returns:
    - A success message if the message was deleted, or a 404 error if the message does not exist.
    """
    deleted_count = message_repo.delete_message(message_id)
    if deleted_count == 0:
        raise HTTPException(status_code=404, detail="Message not found")
    return {"message": "Message deleted"}
