import os
from fastapi import APIRouter, Form
from typing import Dict
from services.webhex_services import ZAPService, ScanService
from db.message_repository import MessageRepository
from db.report_repository import ReportRepository

BASE_API_URL = os.getenv("WEBHEX_URL", "http://134.209.237.212:8090/JSON")
API_KEY = os.getenv("WEBHEX_API_KEY", "hexashield")

zap_service = ZAPService(base_api_url=BASE_API_URL, api_key=API_KEY)
message_repository = MessageRepository()
report_repository = ReportRepository()
scan_service = ScanService(
    zap_service=zap_service,
    message_repository=message_repository,
    report_repository=report_repository,
)

router = APIRouter()


@router.post("/scans/initiate", response_model=Dict[str, str], status_code=200)
async def scan_initiate(
    url: str = Form(...), conversation_id: str = Form(...)
) -> Dict[str, str]:
    return await scan_service.initiate_scan(url, conversation_id)


@router.get("/scans/{report_id}/progress", status_code=200)
async def scan_progress(report_id: str):
    # Await the async service method to get the scan progress
    return await scan_service.fetch_scan_progress(report_id)
