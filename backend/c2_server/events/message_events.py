import os
from bson.objectid import ObjectId
from logger.fastapi_logger import socket_listener_logger
from db.message_repository import MessageRepository
from db.report_repository import ReportRepository
from db.agent_repository import AgentRepository
from models.message import MessageModel
from models.task import TaskModel
from models.report import ReportModel
from pydantic import ValidationError
from c2_server.events.utils import (
    current_utc_time,
    get_agent_id_by_sid,
    format_agent_client_info,
)
from models.report import ReportModel
from utils.chatgpt_client import ChatGPTClient
from utils.grok_client import XAIChatClient
from utils.deepseek_client import DeepSeekChatClient
from services.webhex_services import ZAPService, ScanService
import asyncio
import json
import gevent
from web_server.scheduler.cve_scheduler import fetch_relevant_cve_context

BASE_API_URL = os.getenv("WEBHEX_URL", "http://134.209.237.212:8090/JSON")
API_KEY = os.getenv("WEBHEX_API_KEY", "hexashield")

logger = socket_listener_logger

# Initialize MessageRepository, ChatGPTClient
message_repo = MessageRepository()
report_repository = ReportRepository()
agent_repository = AgentRepository()
chatgpt_client = ChatGPTClient()
x_ai_client = XAIChatClient()
deepseek_client = DeepSeekChatClient()

zap_service = ZAPService(base_api_url=BASE_API_URL, api_key=API_KEY)
scan_service = ScanService(
    zap_service=zap_service,
    message_repository=message_repo,
    report_repository=report_repository,
)


async def handle_send_message(sio, sid, data):
    """
    Handle a client sending a message to a conversation.

    Args:
        sid (str): Socket.IO session ID.
        data (dict): Should include 'conversation_id', 'role', and 'content'.
    """
    try:
        logger.info("Message received from SID %s: %s", sid, data)

        # Validate the message using Pydantic
        message = MessageModel(**data)

        # Convert message to dictionary with alias for fields
        message_data = message.dict(by_alias=True)

        # Convert `_id` and `conversation_id` to ObjectId if necessary
        if "_id" in message_data and isinstance(message_data["_id"], str):
            message_data["_id"] = ObjectId(message_data["_id"])
        if "conversation_id" in message_data and isinstance(
            message_data["conversation_id"], str
        ):
            message_data["conversation_id"] = ObjectId(message_data["conversation_id"])

        # Save the message to the database
        saved_message_id = message_repo.create_message(message_data)
        saved_message = message_repo.get_message_by_id(saved_message_id)

        if not saved_message:
            logger.error(
                "Failed to retrieve saved message with ID: %s", saved_message_id
            )
            return

        new_message = MessageModel(**saved_message).dict(by_alias=True)

        # Broadcast the new message to the conversation room
        await sio.emit("new_message", new_message, to=str(message.conversation_id))

        # # Generate AI response
        # ai_message_content = client.ask(message_data.get("content"))
        # if not ai_message_content:
        #     logger.warning(
        #         "AI response is empty for content: %s", message_data.get("content")
        #     )
        #     return

        # Generate AI response
        # ai_message_content = x_ai_client.ask(message_data.get("content"))
        # if not ai_message_content:
        #     logger.warning(
        #         "AI response is empty for content: %s", message_data.get("content")
        #     )
        #     return

        # Clean the string
        # cleaned_json_string = re.sub(r'^```json|```$', '', ai_message_content['choices'][0]['message']['content'], flags=re.MULTILINE).strip()

        # Save the AI-generated message
        ai_message_data = {
            "conversation_id": message_data["conversation_id"],
            "role": "assistant",
            # "content": json.dumps(ai_message_content),
            # "content": cleaned_json_string,
            "content": "ok",
            "created_at": current_utc_time().isoformat(),
            "updated_at": current_utc_time().isoformat(),
        }
        ai_message_id = message_repo.create_message(ai_message_data)
        ai_saved_message = message_repo.get_message_by_id(ai_message_id)

        if not ai_saved_message:
            logger.error(
                "Failed to retrieve AI-generated message with ID: %s", ai_message_id
            )
            return

        ai_message = MessageModel(**ai_saved_message).dict(by_alias=True)

        # Broadcast the AI-generated message to the conversation room
        await sio.emit("ai_message", ai_message, to=str(message.conversation_id))

    except ValidationError as e:
        logger.error("Message validation error: %s", e)
        await sio.emit("error", {"error": "Invalid message format."}, to=sid)

    except Exception as e:
        logger.exception("An error occurred while processing the message: %s", e)
        await sio.emit("error", {"error": "An internal server error occurred."}, to=sid)


async def handle_stream_to_ai(sio, sid, data):
    """
    Handle the streaming of an AI response for a conversation.

    Args:
        sid (str): Socket.IO session ID.
        data (dict): Contains 'conversation_id' and 'message'.
    """
    # Validate the message using Pydantic
    message = MessageModel(**data)

    # Convert message to dictionary with alias for fields
    message_data = message.dict(by_alias=True)

    if message_data["type"] == "manual":
        await handle_stream_to_ai_manual(sio, sid, data)
    if message_data["type"] == "webhex":
        await handle_stream_to_ai_webhex(sio, sid, data)
    if message_data["type"] == "auto":
        await handle_stream_to_ai_auto(sio, sid, data)


async def handle_stream_to_ai_manual(sio, sid, data):
    """
    Handle streaming of an AI response for a manual message type.
    """
    compliance_context = data.pop("standard", None)

    message_data = MessageModel(**data).dict(by_alias=True)

    # Convert `_id` and `conversation_id` to ObjectId if necessary
    if "_id" in message_data and isinstance(message_data["_id"], str):
        message_data["_id"] = ObjectId(message_data["_id"])
    if "conversation_id" in message_data and isinstance(
        message_data["conversation_id"], str
    ):
        message_data["conversation_id"] = ObjectId(message_data["conversation_id"])

    # Save the initial message to the database
    saved_message_id = message_repo.create_message(message_data)
    saved_message = message_repo.get_message_by_id(saved_message_id)

    # Create an AI message (empty content initially)
    ai_message_data = {
        "_id": ObjectId(),  # Create a new ObjectId for the message
        "conversation_id": saved_message["conversation_id"],  # Conversation ID
        "role": "assistant",  # The role is "assistant"
        "content": "",  # Set the initial content as empty
        "type": message_data["type"],
        "created_at": current_utc_time().isoformat(),  # Timestamp
        "updated_at": current_utc_time().isoformat(),  # Timestamp
    }

    # Save the AI message to the database
    ai_saved_message_id = message_repo.create_message(ai_message_data)

    # Optionally, retrieve the saved message by ID
    ai_saved_message = message_repo.get_message_by_id(ai_saved_message_id)

    # Variable to hold the complete content as chunks come in
    complete_content = ""
    try:
        # Start streaming the AI response from the external AI client
        logger.info(
            "Streaming AI response for SID %s and message %s", sid, ai_saved_message
        )

        ai_message = MessageModel(**ai_saved_message).dict(by_alias=True)

        messages = message_repo.list_messages_with_pagination(
            filter_criteria={
                "conversation_id": ObjectId(message_data["conversation_id"])
            },
            skip=0,
            limit=500,
            sort=[("created_at", 1)],
        )

        message_history = [
            {"role": message["role"], "content": message["content"]}
            for message in messages
            if message[
                "content"
            ].strip()  # Ignore messages with empty or whitespace-only content
        ]

        # Fetch CVE context based on the user message
        cve_context = await fetch_relevant_cve_context(message_data["content"])

        # # Using the DeepSeekClient to stream the response
        # for chunk in deepseek_client.ask(
        #     saved_message.get("content"),
        #     stream=True,
        #     message_history=message_history,
        #     cve_context=cve_context,
        # ):
        #     if chunk is not None:
        #         complete_content += chunk
        #         ai_message["content"] = chunk
        #         await sio.emit(
        #             "ai_message_stream",
        #             ai_message,
        #             to=str(message_data["conversation_id"]),
        #         )
        #         # print(f"Chunk emitted: {chunk}")  # Logs after emit
        #         await asyncio.sleep(0)

        for chunk in chatgpt_client.ask(
            stream=True,
            message_history=message_history,
            cve_context=cve_context,
            standard_context=compliance_context,
        ):
            # print(f"Chunk received: {chunk}")  # Log each chunk
            if chunk is not None:
                complete_content += chunk
                ai_message["content"] = chunk
                await sio.emit(
                    "ai_message_stream",
                    ai_message,
                    to=str(message_data["conversation_id"]),
                )
                # print(f"Chunk emitted: {chunk}")  # Logs after emit
                await asyncio.sleep(0)

        # Once the streaming is complete, update the MongoDB message with the full content
        ai_message["content"] = complete_content  # Set the complete content

        # Before updating the message in MongoDB, remove the '_id' field from ai_message
        if "_id" in ai_message:
            del ai_message["_id"]  # Remove the _id field to avoid MongoDB update errors

        # Update the message in MongoDB with the full content
        message_repo.update_message(ai_saved_message_id, ai_message)

    except Exception as e:
        logger.error("Error while streaming AI response: %s", str(e))
        await sio.emit("error", {"error": "Error while streaming AI response"}, to=sid)


async def handle_stream_to_ai_webhex(sio, sid, data):
    """
    Handle streaming of an AI response for a webhex message type.
    """
    webhex_complete = data.pop("isWebhexComplete", None)

    if webhex_complete:
        message_data = MessageModel(**data).dict(by_alias=True)
        # Convert `_id` and `conversation_id` to ObjectId if necessary
        if "_id" in message_data and isinstance(message_data["_id"], str):
            message_data["_id"] = ObjectId(message_data["_id"])
        if "conversation_id" in message_data and isinstance(
            message_data["conversation_id"], str
        ):
            message_data["conversation_id"] = ObjectId(message_data["conversation_id"])

        # Save the initial message to the database
        saved_message_id = message_repo.create_message(message_data)
        saved_message = message_repo.get_message_by_id(saved_message_id)

        # Create an AI message (empty content initially)
        ai_message_data = {
            "_id": ObjectId(),  # Create a new ObjectId for the message
            "conversation_id": saved_message["conversation_id"],  # Conversation ID
            "role": "assistant",  # The role is "assistant"
            "content": "",  # Set the initial content as empty
            "type": message_data["type"],
            "created_at": current_utc_time().isoformat(),  # Timestamp
            "updated_at": current_utc_time().isoformat(),  # Timestamp
        }

        # Save the AI message to the database
        ai_saved_message_id = message_repo.create_message(ai_message_data)

        # Optionally, retrieve the saved message by ID
        ai_saved_message = message_repo.get_message_by_id(ai_saved_message_id)

        # Variable to hold the complete content as chunks come in
        complete_content = ""
        try:
            # Start streaming the AI response from the external AI client
            logger.info(
                "Streaming AI response for SID %s and message %s", sid, ai_saved_message
            )

            ai_message = MessageModel(**ai_saved_message).dict(by_alias=True)

            # messages = message_repo.list_messages_with_pagination(
            #     filter_criteria={
            #         "conversation_id": ObjectId(message_data["conversation_id"])
            #     },
            #     skip=0,
            #     limit=500,
            #     sort=[("created_at", 1)],
            # )

            # message_history = [
            #     {"role": message["role"], "content": message["content"]}
            #     for message in messages
            #     if message[
            #         "content"
            #     ].strip()  # Ignore messages with empty or whitespace-only content
            # ]

            # # Using the XAIChatClient to stream the response
            # for chunk in deepseek_client.ask(
            #     message=saved_message.get("content"), stream=True
            # ):
            #     # Append the chunk to the existing content in memory
            #     complete_content += chunk  # Accumulate the chunks
            #     ai_message["content"] = chunk
            #     # Emit the chunk of the response back to the client
            #     await sio.emit(
            #         "ai_message_stream",
            #         ai_message,
            #         to=str(message_data["conversation_id"]),
            #     )

            for chunk in chatgpt_client.ask(
                message=saved_message.get("content"),
                stream=True,
            ):
                # print(f"Chunk received: {chunk}")  # Log each chunk
                if chunk is not None:
                    complete_content += chunk
                    ai_message["content"] = chunk
                    await sio.emit(
                        "ai_message_stream",
                        ai_message,
                        to=str(message_data["conversation_id"]),
                    )
                    # print(f"Chunk emitted: {chunk}")  # Logs after emit
                    await asyncio.sleep(0)

            # Once the streaming is complete, update the MongoDB message with the full content
            ai_message["content"] = complete_content  # Set the complete content

            # Before updating the message in MongoDB, remove the '_id' field from ai_message
            if "_id" in ai_message:
                del ai_message[
                    "_id"
                ]  # Remove the _id field to avoid MongoDB update errors

            # Update the message in MongoDB with the full content
            message_repo.update_message(ai_saved_message_id, ai_message)

        except Exception as e:
            logger.error("Error while streaming AI response: %s", str(e))
            await sio.emit(
                "error", {"error": "Error while streaming AI response"}, to=sid
            )

    message = MessageModel(**data)
    message_data = message.dict(by_alias=True)

    if message_data["details"]["url"]:
        try:
            user_webhex_message = {
                "_id": ObjectId(message_data["_id"]),
                "conversation_id": ObjectId(message_data["conversation_id"]),
                "role": message_data["role"],
                "content": message_data["content"],
                "type": message_data["type"],
                "details": message_data["details"],
                "created_at": current_utc_time().isoformat(),
                "updated_at": current_utc_time().isoformat(),
            }
            message_repo.create_message(user_webhex_message)
            initiated_data = await scan_service.initiate_scan(
                message_data["details"]["url"], message_data["conversation_id"]
            )
            ai_message = MessageModel(**initiated_data).dict(by_alias=True)

            ai_message["report"] = ReportModel(**ai_message["report"]).dict(
                by_alias=True
            )
            await sio.emit(
                "ai_message_stream",
                ai_message,
                to=str(initiated_data["conversation_id"]),
            )
        except Exception as e:
            await sio.emit(
                "error", {"error": f"Failed to initiate scan: {str(e)}"}, to=sid
            )


async def handle_stream_to_ai_auto(sio, sid, data):
    """
    Handle streaming of an AI response for a manual message type.
    """
    agent_id = data.pop("agentId", None)

    message_data = MessageModel(**data).dict(by_alias=True)

    # Convert `_id` and `conversation_id` to ObjectId if necessary
    if "_id" in message_data and isinstance(message_data["_id"], str):
        message_data["_id"] = ObjectId(message_data["_id"])
    if "conversation_id" in message_data and isinstance(
        message_data["conversation_id"], str
    ):
        message_data["conversation_id"] = ObjectId(message_data["conversation_id"])

    # Save the initial message to the database
    saved_message_id = message_repo.create_message(message_data)
    saved_message = message_repo.get_message_by_id(saved_message_id)

    # Create an AI message (empty content initially)
    ai_message_data = {
        "_id": ObjectId(),  # Create a new ObjectId for the message
        "conversation_id": saved_message["conversation_id"],  # Conversation ID
        "role": "assistant",  # The role is "assistant"
        "content": "",  # Set the initial content as empty
        "type": "manual",
        "created_at": current_utc_time().isoformat(),  # Timestamp
        "updated_at": current_utc_time().isoformat(),  # Timestamp
    }

    # Save the AI message to the database
    ai_saved_message_id = message_repo.create_message(ai_message_data)

    # Optionally, retrieve the saved message by ID
    ai_saved_message = message_repo.get_message_by_id(ai_saved_message_id)

    # Variable to hold the complete content as chunks come in
    complete_content = ""
    try:
        # Start streaming the AI response from the external AI client
        logger.info(
            "Streaming AI response for SID %s and message %s", sid, ai_saved_message
        )

        ai_message = MessageModel(**ai_saved_message).dict(by_alias=True)

        messages = message_repo.list_messages_with_pagination(
            filter_criteria={
                "conversation_id": ObjectId(message_data["conversation_id"])
            },
            skip=0,
            limit=200,
            sort=[("created_at", 1)],
        )

        # Process message history
        message_history = []

        for message in messages:
            # Skip messages with empty or whitespace-only content
            if not message["content"].strip():
                continue

            # Convert task and report to serializable formats, handling missing or None values
            task = (
                TaskModel(**message["task"]).dict(by_alias=True)
                if message.get("task") is not None
                else None
            )

            updated_content = (
                f'{message["content"]}\n\nTask: {task}' if task else message["content"]
            )

            # Add the processed message as a dictionary to the message history
            message_history.append(
                {"role": message["role"], "content": updated_content}
            )

        # # Using the XAIChatClient to stream the response
        # for chunk in deepseek_client.ask(
        #     stream=True, message_history=message_history, prompt_type="auto"
        # ):
        #     # Append the chunk to the existing content in memory
        #     complete_content += chunk  # Accumulate the chunks
        #     ai_message["content"] = chunk
        #     # Emit the chunk of the response back to the client
        #     await sio.emit(
        #         "ai_message_stream",
        #         ai_message,
        #         to=str(message_data["conversation_id"]),
        #     )
        agent_data = agent_repository.get_agent_by_id(agent_id=agent_id)

        agent_context = format_agent_client_info(agent_data)

        for chunk in chatgpt_client.ask(
            message_history=message_history,
            prompt_type="auto",
            stream=True,
            agent_context=agent_context,
        ):
            # print(f"Chunk received: {chunk}")  # Log each chunk
            if chunk is not None:
                complete_content += chunk
                ai_message["content"] = chunk
                await sio.emit(
                    "ai_message_stream",
                    ai_message,
                    to=str(message_data["conversation_id"]),
                )
                # print(f"Chunk emitted: {chunk}")  # Logs after emit
                await asyncio.sleep(0)

        # Once the streaming is complete, update the MongoDB message with the full content
        ai_message["content"] = complete_content  # Set the complete content

        # Before updating the message in MongoDB, remove the '_id' field from ai_message
        if "_id" in ai_message:
            del ai_message["_id"]  # Remove the _id field to avoid MongoDB update errors

        # Update the message in MongoDB with the full content
        message_repo.update_message(ai_saved_message_id, ai_message)

    except Exception as e:
        logger.error("Error while streaming AI response: %s", str(e))
        await sio.emit("error", {"error": "Error while streaming AI response"}, to=sid)
