from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from jose import JWTError, jwt
import os

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
AUTH_ENABLED = os.getenv("AUTH_ENABLED")

# Ensure the variables are loaded correctly
if not SECRET_KEY or not ALGORITHM or AUTH_ENABLED is None:
    raise ValueError(
        "Environment variables for SECRET_KEY, ALGORITHM, or AUTH_ENABLED are not set."
    )


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        try:
            if AUTH_ENABLED.lower() == "true":
                # Skip authentication for some routes (e.g., /login, /docs)
                if request.url.path in [
                    "/web/api/v1/auth/register",
                    "/web/api/v1/auth/login",
                    "/web/api/v1/auth/google",
                    "/web/api/v1/auth/request-password-reset",
                    "/web/api/v1/auth/reset-password",
                    "/web/api/v1/auth/check-token",
                    "/web/api/v1/docs",
                    "/web/api/v1/healthcheck",
                    "/web/api/v1/openapi.json"
                ]:
                    return await call_next(request)

                # Check for the dynamic download route
                if request.url.path.startswith("/web/api/v1/download/"):
                    # Extract the dynamic ID
                    dynamic_id = request.url.path.split("/")[-1]
                    print(f"Dynamic ID detected: {dynamic_id}")
                    return await call_next(request)

                try:
                    token = request.cookies.get("access_token")
                    if not token:
                        raise HTTPException(status_code=401, detail="Token not found")
                    # Verify the token
                    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
                    request.state.user_id = payload.get(
                        "sub"
                    )  # Store user info in request state
                except JWTError:
                    raise HTTPException(status_code=401, detail="Invalid token")

            # Proceed to the next middleware or route
            response = await call_next(request)
            return response
        except HTTPException as e:
            return JSONResponse(status_code=e.status_code, content={"detail": e.detail})
        except Exception as e:
            return JSONResponse(
                status_code=500, content={"detail": "Internal Server Error"}
            )
