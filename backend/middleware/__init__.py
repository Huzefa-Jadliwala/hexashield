from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from jose import JWTError, jwt
import os

SECRET_KEY = "your_secret_key"
ALGORITHM = "HS256"

class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Check if authentication is enabled
        if os.getenv("AUTH_ENABLED", "true").lower() == "true":
            # Skip authentication for some routes (e.g., /login, /docs)
            if request.url.path in ["/login", "/token", "/docs", "/openapi.json"]:
                return await call_next(request)
            
            # Get Authorization header
            auth_header = request.headers.get("Authorization")
            if auth_header is None or not auth_header.startswith("Bearer "):
                raise HTTPException(status_code=401, detail="Unauthorized")
            
            token = auth_header.split(" ")[1]
            try:
                # Verify the token
                payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
                request.state.user_id = payload.get("sub")  # Store user info in request state
            except JWTError:
                raise HTTPException(status_code=401, detail="Invalid token")
        
        # Proceed to the next middleware or route
        response = await call_next(request)
        return response