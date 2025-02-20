# routes/healthcheck_routes.py

from fastapi import APIRouter
from typing import Dict

router = APIRouter()


@router.get("/", response_model=Dict[str, str])
async def health_check():
    """
    Endpoint to check the health of the service.
    Returns a simple status message.
    """
    return {"status": "ok", "app": "web"}


@router.get("/details", response_model=Dict[str, str])
async def detailed_health_check():
    """
    Endpoint to check the detailed health of the service.
    This could include database, external API, or other system checks.
    """
    # Here, you would implement checks like database connectivity, etc.
    return {"status": "ok", "database": "connected", "service": "running"}
