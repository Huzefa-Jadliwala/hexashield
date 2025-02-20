import logging
import httpx
from bson import ObjectId
from fastapi import HTTPException

from c2_server.events.utils import current_utc_time
from db.message_repository import MessageRepository
from db.report_repository import ReportRepository
from db.conversation_repository import ConversationRepository
from models.report import ReportModel

# Create an instance of ConversationRepository
conversation_repo = ConversationRepository()

logger = logging.getLogger(__name__)


class ZAPService:
    def __init__(self, base_api_url: str, api_key: str):
        self.base_api_url = base_api_url
        self.api_key = api_key

    async def make_request(self, endpoint: str, params: dict) -> dict:
        """
        Make a request to the ZAP API.
        """
        url = f"{self.base_api_url}/{endpoint}"
        params["apikey"] = self.api_key

        try:
            async with httpx.AsyncClient(timeout=30) as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                return response.json()
        except httpx.RequestError as e:
            logger.error(f"HTTP Request Error for {url}: {e}")
            raise HTTPException(
                status_code=500, detail="Failed to communicate with the ZAP API."
            )
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP Status Error for {url}: {e}")
            raise HTTPException(
                status_code=e.response.status_code, detail="ZAP API returned an error."
            )


class ScanService:
    def __init__(
        self,
        zap_service: ZAPService,
        message_repository: MessageRepository,
        report_repository: ReportRepository,
    ):
        self.zap_service = zap_service
        self.message_repository = message_repository
        self.report_repository = report_repository

    async def initiate_scan(
        self, url: str, conversation_id: str, scan_type: str = "passive"
    ) -> dict:
        """
        Initiates a ZAP scan and updates the database.

        Args:
            url (str): The target URL to scan.
            conversation_id (str): The conversation ID associated with the scan.
            scan_type (str): The type of scan to initiate ("passive" or "active").

        Returns:
            dict: Details of the initiated scan, including the scan ID and associated message data.
        """
        try:
            scan_id = None
            active_scan_id = None

            if scan_type == "passive":
                # Step 1: Initiate spider scan
                spider_response = await self.zap_service.make_request(
                    "spider/action/scan/", {"url": url, "recurse": False}
                )
                scan_id = spider_response.get("scan")
                if not scan_id:
                    raise HTTPException(
                        status_code=400,
                        detail="Failed to obtain scan ID during spider registration.",
                    )

                # Step 2: Monitor spider scan progress
                while True:
                    spider_status = await self.zap_service.make_request(
                        "spider/view/status/", {"scanId": scan_id}
                    )
                    if spider_status.get("status") == "100":
                        break

            elif scan_type == "active":
                # Step 3: Initiate active scan
                active_scan_response = await self.zap_service.make_request(
                    "ascan/action/scan/",
                    {"url": url, "recurse": True, "scanPolicyName": "Default Policy"},
                )
                active_scan_id = active_scan_response.get("scan")
                if not active_scan_id:
                    raise HTTPException(
                        status_code=400, detail="Failed to retrieve active scan ID."
                    )

            else:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid scan type. Choose 'passive' or 'active'.",
                )

            # Generate unique IDs for the message and report
            msg_id = ObjectId()
            report_id = ObjectId()

            # Retrieve conversation data
            conversation_data = conversation_repo.get_conversation_by_id(
                conversation_id
            )
            if not conversation_data:
                raise HTTPException(status_code=404, detail="Conversation not found.")

            # Prepare report data
            report_data = {
                "_id": report_id,
                "message_id": msg_id,
                "type": "webhex",
                "details": {
                    "scan_id": active_scan_id if scan_type == "active" else scan_id,
                    "url": url,
                    "scan_type": scan_type,
                },
                "created_at": current_utc_time().isoformat(),
                "updated_at": current_utc_time().isoformat(),
                "created_by": conversation_data.get("created_by"),
            }

            # Save the report to the database
            self.report_repository.create_report(report_data)

            # Step 4: Save scan initiation details as a message
            ai_message_data = {
                "_id": msg_id,
                "conversation_id": ObjectId(conversation_id),
                "role": "assistant",
                "content": f"Scan started successfully for {url}",
                "type": "webhex",
                "report": report_data,
                "created_at": current_utc_time().isoformat(),
                "updated_at": current_utc_time().isoformat(),
            }

            # Save the message to the database
            self.message_repository.create_message(ai_message_data)

            return ai_message_data

        except HTTPException as http_exc:
            raise http_exc
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"An error occurred during scan initiation: {str(e)}",
            )

    async def fetch_scan_progress(self, report_id: str):
        """
        Fetches the scan progress and alerts for a given report ID.

        Args:
            report_id (str): The ID of the report to fetch progress for.

        Returns:
            dict: A dictionary containing the scan progress and alert details.

        Raises:
            HTTPException: If the report is not found, invalid, or an unexpected error occurs.
        """
        try:
            logger.info(f"Fetching scan progress for report_id: {report_id}")

            # Retrieve the report from the repository
            report = self.report_repository.get_report_by_id(report_id)
            if not report:
                logger.error(f"Report with ID {report_id} not found.")
                raise HTTPException(status_code=404, detail="Report not found.")

            # Check for existing alerts in the report
            if report.get("details", {}).get("alerts"):
                return {
                    "progress": 100,
                    "report": report["details"]["alerts"],
                }

            # Extract scan details
            details = report.get("details", {})
            scan_id = details.get("scan_id")
            url = details.get("url")
            scan_type = details.get("scan_type")

            if not scan_id or not url:
                logger.error(
                    f"Missing scan_id or URL in report details for report_id: {report_id}"
                )
                raise HTTPException(
                    status_code=400,
                    detail="Scan ID or URL not found in the report details.",
                )

            logger.info(f"Scan ID: {scan_id}, URL: {url}")
            progress_data = {}
            if scan_type == "active":
                # Fetch scan progress
                progress_data = await self.zap_service.make_request(
                    "ascan/view/status/", {"scanId": scan_id}
                )
            if scan_type == "passive":
                # Fetch scan progress
                progress_data = await self.zap_service.make_request(
                    "spider/view/status/", {"scanId": scan_id}
                )
            progress_percentage = progress_data.get("status")

            if progress_percentage is None:
                logger.error("Progress data not found in ZAP response.")
                raise HTTPException(status_code=400, detail="Progress data not found.")

            logger.info(f"Scan progress: {progress_percentage}%")

            if scan_type == "active":
                # Fetch detailed scan progress
                scan_progress_response = await self.zap_service.make_request(
                    "spider/view/scanProgress/", {"scanId": scan_id}
                )
                scan_progress_data = scan_progress_response.get("scanProgress", [])
                return {
                    "progress": int(progress_percentage),
                    "scan_progress": (
                        scan_progress_data[1] if len(scan_progress_data) > 1 else None
                    ),
                }

            # Handle scan completion
            if progress_percentage == "100":
                raw_alerts = details.get("alerts", [])

                if not raw_alerts:
                    logger.info(
                        "No alerts found in the report. Fetching alerts from ZAP."
                    )
                    alerts_data = await self.zap_service.make_request(
                        "core/view/alerts/", {"baseurl": url}
                    )
                    raw_alerts = alerts_data.get("alerts", [])

                # Deduplicate alerts based on alert name
                unique_alerts = []
                seen_names = set()
                for alert in raw_alerts:
                    alert_name = alert.get("name")
                    if alert_name and alert_name not in seen_names:
                        seen_names.add(alert_name)
                        unique_alerts.append(alert)

                logger.info(f"Fetched {len(unique_alerts)} unique alerts from ZAP.")

                # Update report with fetched alerts
                report["details"]["alerts"] = unique_alerts
                report.pop("_id", None)  # Remove MongoDB's internal field
                self.report_repository.update_report(
                    report_id=report_id, update_data=report
                )
                logger.info("Report updated with fetched alerts.")

                # Update related message with the updated report
                message = self.message_repository.get_message_by_report_id(report_id)
                if message:
                    msg_id = str(
                        message.pop("_id", None)
                    )  # Remove MongoDB's internal field
                    message["report"] = report
                    message["report"]["_id"] = report_id
                    self.message_repository.update_message(
                        message_id=msg_id, update_data=message
                    )
                    logger.info("Related message updated with the latest report.")

                return {
                    "progress": 100,
                    "report": unique_alerts,
                }

            # Return ongoing scan progress
            return {
                "progress": int(progress_percentage),
                "scan_progress": (
                    scan_progress_data[1] if len(scan_progress_data) > 1 else None
                ),
            }

        except HTTPException as http_exc:
            logger.error(f"HTTPException: {http_exc.detail}")
            raise
        except Exception as e:
            logger.exception("Unexpected error in fetch_scan_progress.")
            raise HTTPException(status_code=500, detail="Internal Server Error")


# {
#     "_id" : ObjectId("6767eef1b221d7140113c2b8"),
#     "conversation_id" : ObjectId("67667d95fabae8d63065e788"),
#     "message_id" : ObjectId("6767eef1b221d7140113c2b7"),
#     "user_id" : ObjectId("676327ef659f05603dd71caf"),
#     "type" : "webhex",
#     "details" : {
#         "scan_id" : "0",
#         "url" : "https://jinx-team.vercel.app",
#         "alerts" : []
#     },
#     "created_at" : "2024-12-22T10:50:25.943126+00:00",
#     "updated_at" : "2024-12-22T10:50:25.943137+00:00"
# }
