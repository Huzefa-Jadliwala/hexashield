# routes/chatgpt_routes.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from utils.chatgpt_client import ChatGPTClient
from typing import Union, Dict

# Define the router for ChatGPT-related endpoints
router = APIRouter()

# Initialize the ChatGPT client
chatgpt_client = ChatGPTClient()


class QueryRequest(BaseModel):
    prompt: str  # Input prompt for the query


class QueryResponse(BaseModel):
    response: Union[Dict, str]  # Response content from ChatGPT (JSON or raw string)


@router.post("/query", response_model=QueryResponse)
async def query_chatgpt(request: QueryRequest):
    """
    Endpoint to query ChatGPT for cybersecurity scenarios.

    - Accepts a QueryRequest with `prompt` of the scenario.
    - Returns a structured QueryResponse with the ChatGPT output.
    """
    try:
        # Use the ChatGPT client to process the query
        response_content = chatgpt_client.ask(request.prompt)
        if not response_content:
            raise HTTPException(
                status_code=500, detail="Failed to get a response from ChatGPT"
            )
        # Return the response wrapped in a QueryResponse model
        return {"response": response_content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
