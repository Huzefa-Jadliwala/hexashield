# routes/conversation_routes.py

from fastapi import APIRouter, HTTPException, Query, Request
from typing import Optional, List, Dict, Any
from db.conversation_repository import ConversationRepository
from models.conversation import ConversationModel, ConversationPaginatedResponseModel
from bson.objectid import ObjectId
from db.message_repository import MessageRepository
from db.report_repository import ReportRepository
from utils.deepseek_client import DeepSeekChatClient
from utils.cybersecurity_expert_prompt import AUTO_AND_MANUAL_REPORT_PROMPT
from c2_server.events.utils import current_utc_time
import re
import json

# Create an instance of the ConversationRepository
conversation_repo = ConversationRepository()

# Create a FastAPI router for conversation routes
router = APIRouter()

message_repo = MessageRepository()
report_repo = ReportRepository()

deepseek_client = DeepSeekChatClient()


@router.get(
    "/query",
    response_model=ConversationPaginatedResponseModel,
    summary="Query conversations with pagination and sorting",
    description="Fetch a paginated list of conversations, optionally filtered by user_id, created_by, and sorted by a specified field.",
)
async def query_conversations(
    created_by: Optional[str] = Query(None, description="Filter by created_by"),
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
    Query conversations with pagination and sorting.

    - **user_id**: Filter conversations by the associated user ID.
    - **created_by**: Filter conversations by the creator's ID.
    - **page**: The page number to retrieve.
    - **page_size**: The number of items per page.
    - **sort_by**: Field to sort by (default is 'created_at').
    - **sort_order**: Sorting direction: 'asc' (ascending) or 'desc' (descending).

    Returns:
    - A paginated and sorted list of conversations matching the criteria.
    """
    filter_criteria = {}
    if created_by:
        filter_criteria["created_by"] = created_by

    skip = (page - 1) * page_size
    sort_criteria = [(sort_by, 1 if sort_order == "asc" else -1)]

    try:
        conversations = conversation_repo.list_conversations_with_pagination(
            filter_criteria, skip=skip, limit=page_size, sort=sort_criteria
        )
        total_items = conversation_repo.collection.count_documents(filter_criteria)
        total_pages = (total_items + page_size - 1) // page_size

        return {
            "page": page,
            "page_size": page_size,
            "total_items": total_items,
            "total_pages": total_pages,
            "data": conversations,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get(
    "/{conversation_id}",
    response_model=ConversationModel,
    summary="Get a conversation by ID",
    description="Fetch the details of a specific conversation using its ID.",
)
async def get_conversation(conversation_id: str):
    """
    Get a conversation by its ID.

    - **conversation_id**: The ID of the conversation to retrieve.

    Returns:
    - The conversation details if found, or a 404 error if the conversation does not exist.

    Example Response:
    ```json
    {
        "id": 1,
        "title": "Team Meeting Notes",
        "user_id": 42,
        "created_by": 42,
        "created_at": "2024-12-01T12:00:00Z",
        "updated_at": "2024-12-01T12:30:00Z"
    }
    ```
    """
    conversation = conversation_repo.get_conversation_by_id(conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversation


@router.get(
    "/",
    response_model=List[ConversationModel],
    summary="List conversations",
    description="Fetch a list of conversations, optionally filtered by criteria.",
)
async def list_conversations(
    user_id: Optional[int] = Query(None, description="Filter by user_id"),
    created_by: Optional[int] = Query(None, description="Filter by created_by"),
):
    """
    Endpoint to list conversations with optional filters.

    - **user_id**: Filter conversations by the associated user ID.
    - **created_by**: Filter conversations by the creator's ID.

    Returns:
    - A list of conversations matching the criteria.
    """
    filter_criteria = {}
    if created_by:
        filter_criteria["created_by"] = created_by

    conversations = conversation_repo.list_conversations(filter_criteria)
    return conversations


@router.post(
    "/",
    response_model=ConversationModel,
    status_code=201,
    summary="Create a new conversation",
    description="Endpoint to create a new conversation in the system. The conversation data is validated using the ConversationModel.",
)
async def create_conversation(conversation: ConversationModel) -> Any:
    """
    Create a new conversation in the system.

    - **conversation**: The conversation details, validated using the ConversationModel.

    Returns:
    - A dictionary containing a success message and the ID of the newly created conversation.

    Example:
    ```json
    {
        "title": "Team Meeting Notes",
        "user_id": 42,
        "created_by": 42
    }
    ```
    """
    try:
        # Ensure `_id` is properly handled for MongoDB
        conversation_data = conversation.dict(by_alias=True)

        # Create the conversation in the database
        conv_data = conversation_data
        conv_data["_id"] = ObjectId(conversation_data["_id"])
        conversation_id = conversation_repo.create_conversation(conv_data)

        # Fetch the inserted agent from the database
        created_conversation = conversation_repo.get_conversation_by_id(conversation_id)
        if not created_conversation:
            raise HTTPException(
                status_code=500, detail="Failed to retrieve the created conversation"
            )

        # Return success response
        return created_conversation
    except ValueError as e:
        # Raise an HTTP 400 Bad Request error for validation issues
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Catch all other exceptions and raise an HTTP 500 Internal Server Error
        raise HTTPException(status_code=500, detail="An unexpected error occurred")


@router.put(
    "/{conversation_id}",
    response_model=ConversationModel,
    summary="Update a conversation",
    description="Update the details of an existing conversation by its ID.",
)
async def update_conversation(conversation_id: str, update_data: ConversationModel):
    """
    Update an existing conversation.

    - **conversation_id**: The ID of the conversation to update.
    - **update_data**: The updated conversation details.

    Returns:
    - A success message if the conversation was updated, or a 404 error if the conversation does not exist.

    Example Update:
    ```json
    {
        "title": "Updated Meeting Notes"
    }
    ```
    """
    updated_count = conversation_repo.update_conversation(
        conversation_id, update_data.dict(exclude_unset=True)
    )
    if updated_count == 0:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return update_data


@router.delete(
    "/{conversation_id}",
    response_model=Dict[str, str],
    summary="Delete a conversation",
    description="Delete a conversation from the system by its ID.",
)
async def delete_conversation(conversation_id: str):
    """
    Delete a conversation from the system.

    - **conversation_id**: The ID of the conversation to delete.

    Returns:
    - A success message if the conversation was deleted, or a 404 error if the conversation does not exist.
    """
    deleted_count = conversation_repo.delete_conversation(conversation_id)
    if deleted_count == 0:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"message": "Conversation deleted"}


@router.get(
    "/{conversation_id}/generate/report",
    response_model=Any,
    summary="Generate a conversation report by ID",
    description="Fetch the details of a specific conversation using its ID and generate a report.",
)
async def generate_conversation_report(request: Request, conversation_id: str):
    """
    Generate a conversation report by its ID.

    - **conversation_id**: The ID of the conversation to retrieve.

    Returns:
    - A generated report based on the conversation history.

    Example Response:
    ```json
    {
        "report": "Detailed summary of the conversation..."
    }
    """
    if not conversation_id or not ObjectId.is_valid(conversation_id):
        raise HTTPException(status_code=400, detail="Invalid conversation ID")

    # Fetch messages from the repository
    messages = message_repo.list_messages_with_pagination(
        filter_criteria={"conversation_id": ObjectId(conversation_id)},
        skip=0,
        limit=10,
        sort=[("created_at", 1)],
    )

    if not messages:
        raise HTTPException(status_code=404, detail="Conversation not found or empty")

    # Prepare the message history for report generation
    message_history = [
        {"role": message["role"], "content": message["content"]}
        for message in messages
        if message["content"].strip()  # Exclude empty or whitespace-only content
    ]

    if not message_history:
        raise HTTPException(
            status_code=400,
            detail="Conversation has no valid content to generate a report",
        )

    # Generate report using the deepseek client
    try:
        response = deepseek_client.ask(
            message_history=message_history,
            system_prompt=AUTO_AND_MANUAL_REPORT_PROMPT,
        )
        text = response.get("choices", [{}])[0].get("message", {}).get("content", "")
        try:
            # First, try to parse the entire text as JSON
            parsed_data = json.loads(text)
        except json.JSONDecodeError:
            # If full text isn't valid JSON, attempt to extract JSON block
            json_match = re.search(r"```json\n(.*?)\n```", text, re.DOTALL)
            if not json_match:
                raise ValueError("Invalid response format: JSON block not found")

            # Parse the extracted JSON content
            json_content = json_match.group(1)
            parsed_data = json.loads(json_content)

        # Convert parsed data to a formatted string and reload as JSON (if needed)
        report_string = json.dumps(parsed_data, indent=4)
        report_json = json.loads(
            report_string
        )  # Can directly use `parsed_data` if not needed

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to generate report: {str(e)}"
        )

    # Fetch conversation details
    conversation = conversation_repo.get_conversation_by_id(conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Create report data
    report_data = {
        "_id": ObjectId(),
        "message_id": None,
        "conversation_name": conversation.get("title"),
        "type": conversation.get("type"),
        "details": None,
        "data": report_json,
        "created_at": current_utc_time().isoformat(),
        "updated_at": current_utc_time().isoformat(),
        "created_by": request.state.user_id,
    }

    # Save the report in the repository
    try:
        report_repo.create_report(report_data)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to save the report: {str(e)}"
        )

    return {"message": "success", "report_id": str(report_data["_id"])}
