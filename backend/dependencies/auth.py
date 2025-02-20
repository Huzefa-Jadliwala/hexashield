from fastapi import Request, HTTPException
from jose import JWTError, jwt
import os


SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")


# Function to get the current user
def get_current_user(request: Request):
    if os.getenv("AUTH_ENABLED", "true").lower() == "true":
        auth_header = request.headers.get("Authorization")
        if auth_header is None or not auth_header.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Unauthorized")
        token = auth_header.split(" ")[1]
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            request.state.user_id = payload.get("sub")
            # Ensure the payload contains 'first_name' and 'email'
            if (
                "first_name" not in payload
                or "last_name" not in payload
                or "email" not in payload
            ):
                raise HTTPException(status_code=401, detail="Invalid token payload")
            return {
                "_id": payload.get("sub"),
                "first_name": payload.get("first_name"),
                "last_name": payload.get("last_name"),
                "email": payload.get("email"),
            }
        except JWTError:
            raise HTTPException(status_code=401, detail="Invalid token")
    else:
        return {
            "_id": "anonymous",
            "username": "anonymous",
            "email": "anonymous@example.com",
        }
