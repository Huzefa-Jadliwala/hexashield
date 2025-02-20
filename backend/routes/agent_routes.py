from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from db.agent_repository import AgentRepository
from models.agent import AgentModel, AgentPaginatedResponseModel

# Initialize the router and repository
router = APIRouter()
agent_repo = AgentRepository()


class ErrorResponse(BaseModel):
    """Model for error responses."""

    detail: str = Field(..., description="Error message.")


@router.post(
    "/",
    response_model=AgentModel,
    responses={
        201: {"description": "Agent successfully created.", "model": AgentModel},
        400: {"description": "Validation error.", "model": ErrorResponse},
    },
    status_code=201,
    summary="Create a new agent",
    description=(
        "Creates a new agent with the provided data and returns the full agent object. "
        "This endpoint expects a valid agent payload and stores it in the database."
    ),
)
async def create_agent(agent: AgentModel) -> AgentModel:
    """
    **Create Agent**

    Inserts a new agent into the database and returns the full agent object upon successful creation.

    **Parameters**:
    - `agent`: The details of the agent to be created.

    **Returns**:
    - `AgentModel`: The created agent object.
    """
    try:
        agent_data = agent.dict(by_alias=True)  # Handle MongoDB `_id` field
        agent_id = agent_repo.create_agent(agent_data)
        created_agent = agent_repo.get_agent_by_id(agent_id)
        if not created_agent:
            raise HTTPException(
                status_code=500, detail="Failed to retrieve the created agent."
            )
        return created_agent
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get(
    "/{agent_id}",
    response_model=AgentModel,
    responses={
        200: {"description": "Agent found.", "model": AgentModel},
        404: {"description": "Agent not found.", "model": ErrorResponse},
        400: {"description": "Invalid request.", "model": ErrorResponse},
    },
    summary="Retrieve an agent by ID",
    description="Fetches the details of an agent using its unique identifier.",
)
async def get_agent(agent_id: str) -> AgentModel:
    """
    **Get Agent by ID**

    Retrieves the agent with the specified ID from the database.

    **Parameters**:
    - `agent_id` (str): The unique identifier of the agent.

    **Returns**:
    - `AgentModel`: The agent details.

    **Raises**:
    - `404`: If the agent is not found.
    - `400`: If the ID is invalid.
    """
    try:
        agent = agent_repo.get_agent_by_id(agent_id)
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")
        return agent
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put(
    "/{id}",
    response_model=Dict[str, str],
    responses={
        200: {"description": "Agent successfully updated.", "model": Dict[str, str]},
        404: {"description": "Agent not found.", "model": ErrorResponse},
        400: {"description": "Invalid request.", "model": ErrorResponse},
    },
    summary="Update an existing agent",
    description="Updates the information of an agent identified by its ID.",
)
async def update_agent(id: str, update_data: AgentModel) -> Dict[str, str]:
    """
    **Update Agent**

    Updates the details of an agent with the specified ID. Only fields provided in the request will be updated.

    **Parameters**:
    - `id` (str): The unique identifier of the agent.
    - `update_data` (AgentModel): The updated data for the agent.

    **Returns**:
    - A success message.

    **Raises**:
    - `404`: If the agent is not found.
    - `400`: If the request is invalid.
    """
    try:
        updated_count = agent_repo.update_agent(
            id, update_data.dict(exclude_unset=True)
        )
        if updated_count == 0:
            raise HTTPException(status_code=404, detail="Agent not found")
        return {"message": "Agent updated"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete(
    "/{agent_id}",
    response_model=Dict[str, str],
    responses={
        200: {"description": "Agent successfully deleted.", "model": Dict[str, str]},
        404: {"description": "Agent not found.", "model": ErrorResponse},
        400: {"description": "Invalid request.", "model": ErrorResponse},
    },
    summary="Delete an agent",
    description="Deletes an agent identified by its ID from the database.",
)
async def delete_agent(agent_id: str) -> Dict[str, str]:
    """
    **Delete Agent**

    Removes the agent with the specified ID from the database.

    **Parameters**:
    - `agent_id` (str): The unique identifier of the agent.

    **Returns**:
    - A success message.

    **Raises**:
    - `404`: If the agent is not found.
    - `400`: If the request is invalid.
    """
    try:
        deleted_count = agent_repo.delete_agent(agent_id)
        if deleted_count == 0:
            raise HTTPException(status_code=404, detail="Agent not found")
        return {"message": "Agent deleted"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get(
    "/",
    response_model=List[AgentModel],
    responses={
        200: {"description": "List of agents retrieved.", "model": List[AgentModel]},
        400: {"description": "Invalid request.", "model": ErrorResponse},
    },
    summary="List all agents with optional filters",
    description="Retrieves a list of agents from the database. Optional filters can be applied.",
)
async def list_agents(
    created_by: Optional[str] = Query(None, description="Filter by created_by"),
    filter_codename: Optional[str] = Query(
        None, description="Filter agents by codename."
    ),
    filter_hostname: Optional[str] = Query(
        None, description="Filter agents by hostname."
    ),
) -> List[AgentModel]:
    """
    **List Agents**

    Fetches all agents from the database with optional filters for codename and hostname.

    **Parameters**:
    - `filter_codename` (str, optional): Filter by the agent's codename.
    - `filter_hostname` (str, optional): Filter by the agent's hostname.

    **Returns**:
    - A list of agents matching the criteria.
    """
    try:
        filter_criteria = {}
        if created_by:
            filter_criteria["created_by"] = created_by
        if filter_codename:
            filter_criteria["client_info.codename"] = filter_codename
        if filter_hostname:
            filter_criteria["client_info.hostname"] = filter_hostname

        agents = agent_repo.list_agents(filter_criteria)
        return agents
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get(
    "/query",
    response_model=AgentPaginatedResponseModel,
    summary="Query tasks with pagination and sorting",
    description="Fetch a paginated list of tasks, optionally filtered by agent_id and sorted by a specified field.",
)
async def query_agents(
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
        conversations = agent_repo.list_agents_with_pagination(
            filter_criteria, skip=skip, limit=page_size, sort=sort_criteria
        )
        total_items = agent_repo.collection.count_documents(filter_criteria)
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
