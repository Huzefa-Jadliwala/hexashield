from typing import Dict, Any
from logger.fastapi_logger import socket_listener_logger
from db.task_repository import TaskRepository
from db.agent_repository import AgentRepository
from db.conversation_repository import ConversationRepository
from db.message_repository import MessageRepository
from models.task import TaskModel
from c2_server.events.utils import current_utc_time
from models.agent import AgentModel
from models.task import TaskModel
from models.message import MessageModel
from models.conversation import ConversationModel
import json
from bson.objectid import ObjectId
from pydantic import ValidationError


agent_repository = AgentRepository()  # Initialize the repository

# Configure logger
logger = socket_listener_logger

# Create an instance of TaskRepository
task_repo = TaskRepository()

# Create an instance of ConversationRepository
conversation_repo = ConversationRepository()

# Create an instance of ConversationRepository
message_repo = MessageRepository()

# Dictionary to track connected agents: agent_id -> sid
connected_agents = {}


async def handle_client_connect(sid, environ):
    """Handle a new client connection."""
    logger.info("Client connected SID: %s and environ %s", sid, environ)


async def handle_client_disconnect(sio, sid):
    """
    Handle agent disconnection and update its status to 'offline'.
    """
    # Find the agent_id associated with the given SID
    agent_id = next(
        (key for key, value in connected_agents.items() if value == sid), None
    )
    if agent_id:
        # Remove the agent from the connected_agents dictionary
        del connected_agents[agent_id]

        # Update the agent's status in the database
        try:
            agent_repository.upsert_agent(
                agent_id=agent_id,
                agent_data={
                    "status": "offline",
                    "last_seen": current_utc_time().isoformat(),  # Update last seen timestamp
                },
            )
            await sio.emit(
                "handle_agent_to_conversation_connection",
                {"agent_id": agent_id, "status": "offline"},
            )
            logger.info("Agent %s marked as offline in the database.", agent_id)
        except ValueError as e:
            logger.error("Failed to update status for agent %s: %s", agent_id, str(e))
    else:
        logger.warning("No agent_id found for disconnected SID: %s", sid)

    logger.info("Client disconnected: %s", sid)


async def handle_agent_registration(sio, sid, data):
    """
    Register an agent by its agent_id and update its status to 'online'.

    Args:
        sid (str): Socket.IO session ID.
        data (dict): Data sent by the agent (should include agent_id).
    """
    agent_id = data.get("agent_id")
    if not agent_id:
        logger.error("Agent registration failed: Missing agent_id from SID %s", sid)
        return

    # Validate agent data using the AgentModel
    validated_agent = AgentModel(**data)

    # Update the agent's status in the database
    try:
        agent_repository.upsert_agent(
            agent_id=agent_id, agent_data=validated_agent.dict(by_alias=True)
        )
        logger.info(
            "Agent %s registered and marked as online in the database.", agent_id
        )
        # Store the agent_id and sid mapping
        connected_agents[agent_id] = sid
        await sio.emit(
            "handle_agent_to_conversation_connection",
            json.loads(validated_agent.json()),
        )
    except ValueError as e:
        logger.error("Failed to register agent %s: %s", agent_id, str(e))

    logger.info("Agent %s registered with SID %s", agent_id, sid)


async def handle_command_response(sio, sid: str, data: Dict[str, Any]):
    """
    Handle responses from the agent for executed commands.

    Args:
        sid (str): Socket.IO session ID of the agent sending the response.
        data (Dict[str, Any]): The data payload from the agent, including the command response.
    """
    try:
        logger.info("Command response received from SID %s: %s", sid, data)

        # Use Pydantic to validate the task data
        data["_id"] = ObjectId()  # Assign a new ObjectId for the task

        conversation_data = conversation_repo.get_conversation_by_id(
            data["conversation_id"]
        )
        data["conversation"] = ConversationModel(**conversation_data).dict(
            by_alias=True
        )

        # Store the task in the database
        task_id = task_repo.create_task(data)
        logger.info("Task created with ID: %s", task_id)

        # Retrieve the task to ensure consistency
        task_data = task_repo.get_task_by_id(task_id)

        # Prepare the message to be stored in the database
        task_execution_message = {
            "_id": ObjectId(),
            "conversation_id": ObjectId(task_data.get("conversation_id")),
            "role": "assistant",
            "content": "Task Executed",
            "type": "auto",
            "created_at": current_utc_time().isoformat(),
            "updated_at": current_utc_time().isoformat(),
            "task": TaskModel(**task_data).dict(by_alias=True),
        }

        # Save the message to the database
        message_repo.create_message(task_execution_message)

        # Emit the AI message to the frontend
        ai_message = MessageModel(**task_execution_message).dict(by_alias=True)
        ai_message["task"] = TaskModel(**ai_message["task"]).dict(by_alias=True)
        ai_message["task"]["conversation"] = ConversationModel(
            **ai_message["task"]["conversation"]
        ).dict(by_alias=True)
        await sio.emit(
            "ai_message_stream",
            ai_message,
            to=str(task_execution_message["conversation_id"]),
        )
    except ValidationError as ve:
        logger.error("Validation error: %s", ve.json())
    except Exception as e:
        logger.error("Error handling command response: %s", e)
    except ValueError as ve:
        logger.error("Validation error while processing command response: %s", ve)
    except KeyError as ke:
        logger.error("Missing expected key in data: %s", ke)
    except Exception as e:
        logger.error(
            "Unexpected error processing command response: %s", e, exc_info=True
        )
        raise
