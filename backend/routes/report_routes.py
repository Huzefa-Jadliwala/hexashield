from typing import Optional
from fastapi import APIRouter, Query, HTTPException
from db.report_repository import ReportRepository
from models.report import ReportModel

report_repository = ReportRepository()

router = APIRouter()


@router.get("/query", response_model=dict, status_code=200)
async def query_reports(
    created_by: Optional[str] = Query(None, description="Filter by user_id"),
    conversation_id: Optional[str] = Query(
        None, description="Filter by conversation_id"
    ),
    message_id: Optional[str] = Query(None, description="Filter by message_id"),
    type: Optional[str] = Query(None, description="Filter by report type"),
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
    Query reports with pagination and sorting.
    """
    # Build filter criteria based on query parameters
    filter_criteria = {}
    if created_by:
        filter_criteria["created_by"] = created_by
    if conversation_id:
        filter_criteria["conversation_id"] = conversation_id
    if message_id:
        filter_criteria["message_id"] = message_id
    if type:
        filter_criteria["type"] = type

    # Calculate pagination skip value
    skip = (page - 1) * page_size

    # Set up sorting
    sort_criteria = [(sort_by, 1 if sort_order == "asc" else -1)]

    # Get the list of reports using the repository method
    reports = report_repository.list_reports_with_pagination(
        filter_criteria, skip=skip, limit=page_size, sort=sort_criteria
    )

    # Total item count for pagination
    total_items = report_repository.collection.count_documents(filter_criteria)
    total_pages = (total_items + page_size - 1) // page_size

    # Map the reports using the ReportModel to ensure proper validation
    reports_data = [ReportModel(**report) for report in reports]

    return {
        "page": page,
        "page_size": page_size,
        "total_items": total_items,
        "total_pages": total_pages,
        "data": reports_data,  # Return the properly mapped reports
    }


@router.get("/{report_id}", response_model=ReportModel, status_code=200)
async def get_report_by_id(report_id: str):
    """
    Fetch a specific report by its ID.
    """
    report = report_repository.get_report_by_id(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")
    return report
