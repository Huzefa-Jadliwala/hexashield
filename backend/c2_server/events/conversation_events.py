from bson.objectid import ObjectId
from logger.fastapi_logger import socket_listener_logger
from db.message_repository import MessageRepository
from models.message import MessageModel
from pydantic import ValidationError
from datetime import datetime
from models.report import ReportModel
from models.task import TaskModel
from models.conversation import ConversationModel

# Initialize MessageRepository
message_repo = MessageRepository()

# Configure logger
logger = socket_listener_logger


async def handle_join_room(sio, sid, data):
    """
    Handle a client joining a conversation room.

    Args:
        sid (str): Socket.IO session ID.
        data (dict): Should include 'conversation_id', 'page', and 'page_size'.
    """
    conversation_id = data.get("conversation_id")
    page = data.get("page", 1)
    page_size = data.get("page_size", 100)

    if not conversation_id or not ObjectId.is_valid(conversation_id):
        logger.error(
            "join_room failed: Invalid or missing conversation_id from SID %s",
            sid,
        )
        return

    conversation_id = ObjectId(conversation_id)

    # Join the Socket.IO room
    await sio.enter_room(sid, str(conversation_id))
    logger.info("SID %s joined room %s", sid, conversation_id)

    # Fetch paginated message history
    skip = (page - 1) * page_size
    try:
        # Fetch the messages from the database
        raw_messages = message_repo.list_messages_with_pagination(
            filter_criteria={"conversation_id": conversation_id},
            skip=skip,
            limit=page_size,
            sort=[("created_at", -1)],
        )

        # Validate and serialize messages using MessageModel
        messages = []
        for msg in raw_messages:
            message_dict = MessageModel(**msg).dict(by_alias=True)

            # Handle nested 'report' object if present
            if "report" in message_dict and message_dict["report"]:
                # Ensure nested ObjectId fields in 'report' are converted to strings
                message_dict["report"] = ReportModel(**message_dict["report"]).dict(
                    by_alias=True
                )

            # Handle nested 'task' object if present
            if "task" in message_dict and message_dict["task"]:
                # Ensure nested ObjectId fields in 'task' are converted to strings
                message_dict["task"] = TaskModel(**message_dict["task"]).dict(
                    by_alias=True
                )
                if (
                    "conversation" in message_dict["task"]
                    and message_dict["task"]["conversation"]
                ):
                    message_dict["task"]["conversation"] = ConversationModel(
                        **message_dict["task"]["conversation"]
                    ).dict(by_alias=True)

            messages.append(message_dict)

    except ValidationError as ve:
        logger.error("Validation error in messages: %s", str(ve))
        await sio.emit("error", {"error": "Message validation failed"}, to=sid)
        return
    except Exception as e:
        logger.error("Error fetching messages: %s", str(e))
        await sio.emit("error", {"error": "Failed to fetch messages"}, to=sid)
        return

    # Emit paginated message history
    await sio.emit("message_history", {"page": page, "messages": messages}, to=sid)


async def handle_leave_room(sio, sid, data):
    """
    Handle a client leaving a conversation room.

    Args:
        sid (str): Socket.IO session ID.
        data (dict): Should include 'conversation_id'.
    """
    conversation_id = data.get("conversation_id")
    if not conversation_id:
        logger.error("leave_room failed: Missing conversation_id from SID %s", sid)
        return

    # Leave the Socket.IO room
    sio.leave_room(sid, conversation_id)
    logger.info("SID %s left room %s", sid, conversation_id)


async def handle_load_more_messages(sio, sid, data):
    """
    Handle client requests to load more messages for a conversation.

    Args:
        sid (str): Socket.IO session ID.
        data (dict): Should include 'conversation_id', 'sort_by', and 'created_at'.
    """
    try:
        conversation_id = data.get("conversation_id")
        sort_by = data.get("sort_by", "desc")  # Default to descending
        created_at = data.get("created_at")  # The reference created_at for fetching

        if not conversation_id or not ObjectId.is_valid(conversation_id):
            logger.error("Invalid or missing conversation_id from SID %s", sid)
            await sio.emit("error", {"error": "Invalid or missing conversation_id"}, to=sid)
            return

        if sort_by not in ["asc", "desc"]:
            logger.error("Invalid sort_by from SID %s: %s", sid, sort_by)
            await sio.emit("error", {"error": "Direction must be 'asc' or 'desc'"}, to=sid)
            return

        if not created_at:
            logger.error("Missing created_at from SID %s", sid)
            await sio.emit("error", {"error": "Missing created_at"}, to=sid)
            return

        conversation_id = ObjectId(conversation_id)
        reference_time = datetime.fromisoformat(created_at)

        # Query filter based on sort_by
        if sort_by == "desc":
            filter_criteria = {
                "conversation_id": conversation_id,
                "created_at": {"$lt": reference_time},  # Messages older than created_at
            }
            sort_order = [("created_at", -1)]  # Descending order
        else:  # sort_by == "asc"
            filter_criteria = {
                "conversation_id": conversation_id,
                "created_at": {"$gt": reference_time},  # Messages newer than created_at
            }
            sort_order = [("created_at", 1)]  # Ascending order

        # Fetch messages from the database
        raw_messages = message_repo.list_messages_with_pagination(
            filter_criteria=filter_criteria,
            skip=0,  # Always start from the beginning for time-based fetches
            limit=20,  # Fetch a fixed number of messages
            sort=sort_order,
        )

        # Validate and serialize messages
        serialized_messages = [
            MessageModel(**msg).dict(by_alias=True) for msg in raw_messages
        ]

        # Emit the results back to the client
        await sio.emit(
            "more_messages",
            {"sort_by": sort_by, "messages": serialized_messages},
            to=sid,
        )

    except ValidationError as e:
        logger.error("Message validation failed for SID %s: %s", sid, e)
        await sio.emit("error", {"error": "Invalid message format."}, to=sid)

    except ValueError as e:
        logger.error("Invalid parameters from SID %s: %s", sid, e)
        await sio.emit("error", {"error": str(e)}, to=sid)

    except Exception as e:
        logger.error("Error loading messages for SID %s: %s", sid, e, exc_info=True)
        await sio.emit("error", {"error": "An internal server error occurred."}, to=sid)
