# routes/task_routes.py

from fastapi import APIRouter, HTTPException, Query, Request
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from db.task_repository import TaskRepository
from db.agent_repository import AgentRepository
from bson import ObjectId
from bson.json_util import dumps
from models.task import TaskModel, TaskPaginatedResponseModel
from jose import jwt, JWTError
import os


SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")

# Create an instance of the TaskRepository
task_repo = TaskRepository()
agent_repo = AgentRepository()

# Create a FastAPI router for task routes
router = APIRouter()


@router.get(
    "/query",
    response_model=TaskPaginatedResponseModel,
    summary="Query tasks with pagination and sorting",
    description="Fetch a paginated list of tasks, optionally filtered by agent_id and sorted by a specified field.",
)
async def query_tasks(
    agent_id: Optional[str] = Query(None, description="Filter by agent_id"),
    created_by: Optional[str] = Query(None, description="Filter by agent_id"),
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

    - **agent_id**: Filter conversations by the associated user ID.
    - **created_by**: Filter conversations by the creator's ID.
    - **page**: The page number to retrieve.
    - **page_size**: The number of items per page.
    - **sort_by**: Field to sort by (default is 'created_at').
    - **sort_order**: Sorting direction: 'asc' (ascending) or 'desc' (descending).

    Returns:
    - A paginated and sorted list of conversations matching the criteria.
    """
    filter_criteria = {}
    if agent_id:
        filter_criteria["agent_id"] = agent_id

    if created_by:
        filter_criteria["created_by"] = created_by

    skip = (page - 1) * page_size
    sort_criteria = [(sort_by, 1 if sort_order == "asc" else -1)]

    try:
        conversations = task_repo.list_tasks_with_pagination(
            filter_criteria, skip=skip, limit=page_size, sort=sort_criteria
        )
        total_items = task_repo.collection.count_documents(filter_criteria)
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


@router.post(
    "/",
    response_model=Dict[str, str],
    status_code=201,
    summary="Create a new task",
    description="Endpoint to create a new task in the system. The task data is validated using the TaskModel.",
)
async def create_task(task: TaskModel):
    """
    Create a new task in the system.

    - **task**: The task details, validated using the TaskModel.

    Returns:
    - A dictionary containing a success message and the ID of the newly created task.

    Example:
    ```json
    {
        "agent_id": "63A2CE8B-23F0-5179-B0B7-6AFA5D6B8541",
        "command": "ls",
        "status": "pending",
        "created_at": "2024-11-19T17:21:26+00:00"
    }
    ```
    """
    task_id = task_repo.create_task(task.dict(by_alias=True))
    return {"message": "Task created", "task_id": str(task_id)}


@router.get(
    "/{task_id}",
    response_model=TaskModel,
    summary="Get a task by ID",
    description="Fetch the details of a specific task using its ID.",
)
async def get_task(task_id: str):
    """
    Get a task by its ID.

    - **task_id**: The ID of the task to retrieve.

    Returns:
    - The task details if found, or a 404 error if the task does not exist.

    Example Response:
    ```json
    {
        "id": "64309628d1cd938d5163ad49",
        "agent_id": "63A2CE8B-23F0-5179-B0B7-6AFA5D6B8541",
        "command": "ls",
        "command_output": {"status": "success", "output": "file1.txt file2.txt"},
        "status": "completed",
        "created_at": "2024-11-19T17:21:26+00:00"
    }
    ```
    """
    task = task_repo.get_task_by_id(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.put(
    "/{task_id}",
    response_model=Dict[str, str],
    summary="Update a task",
    description="Update the details of an existing task by its ID.",
)
async def update_task(task_id: str, update_data: TaskModel):
    """
    Update an existing task.

    - **task_id**: The ID of the task to update.
    - **update_data**: The updated task details.

    Returns:
    - A success message if the task was updated, or a 404 error if the task does not exist.

    Example Update:
    ```json
    {
        "command": "pwd",
        "status": "completed"
    }
    ```
    """
    updated_count = task_repo.update_task(task_id, update_data.dict(exclude_unset=True))
    if updated_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task updated"}


@router.delete(
    "/{task_id}",
    response_model=Dict[str, str],
    summary="Delete a task",
    description="Delete a task from the system by its ID.",
)
async def delete_task(task_id: str):
    """
    Delete a task from the system.

    - **task_id**: The ID of the task to delete.

    Returns:
    - A success message if the task was deleted, or a 404 error if the task does not exist.
    """
    deleted_count = task_repo.delete_task(task_id)
    if deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task deleted"}


@router.get("/", response_model=List[TaskModel])
async def list_tasks(
    request: Request,
    agent_id: Optional[str] = Query(None, description="Filter by agent_id"),
):
    """
    Endpoint to list tasks with optional filters.
    """
    try:
        filter_criteria = {"conversation.created_by": request.state.user_id}
        tasks = task_repo.list_tasks(filter_criteria)
        for task in tasks:
            agent_id = task.get("agent_id")
            if agent_id:
                agent_details = agent_repo.get_agent_by_id(str(agent_id))
                if agent_details and "client_info" in agent_details:
                    hostname = agent_details["client_info"].get("hostname")
                    agent_object_id = agent_details.get("_id")
                    print("Agent object id", agent_object_id)
                    if hostname:
                        task["agent_name"] = hostname
                        task["agent_id"] = str(agent_object_id)
        return tasks
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
