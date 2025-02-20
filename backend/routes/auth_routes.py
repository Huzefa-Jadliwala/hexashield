import os
from fastapi import (
    APIRouter,
    HTTPException,
    Depends,
    Response,
    Request,
    UploadFile,
    File,
    Form,
)
from pydantic import BaseModel, EmailStr
from typing import Dict, Optional
from db.auth_repository import AuthRepository, REFRESH_SECRET_KEY, ALGORITHM, SECRET_KEY
from db.user_repository import UserRepository
from models.auth import (
    Token,
    User,
    UserResponse,
    PasswordReset,
    PasswordResetRequest,
    GoogleSignInRequest,
    UserRegister,
    UserLogin,
)  # Import the Token model
from fastapi.security import OAuth2PasswordRequestForm
from jose import JWTError, jwt
from fastapi import Form
from fastapi.responses import JSONResponse
import base64
from utils.email_utils import (
    send_reset_password_email,
)  # Import the send_reset_password_email function
import random
import string
import firebase_admin
from firebase_admin import credentials, auth as firebase_auth
from dependencies.auth import get_current_user
import jwt
import logging

# Load cookie settings from environment variables
cookie_secure = (
    os.getenv("COOKIE_SECURE", "false").lower() == "true"
)  # Convert to boolean
cookie_samesite = os.getenv("COOKIE_SAMESITE", "Lax")  # Default to "Lax"
cookie_max_age = int(os.getenv("COOKIE_MAX_AGE", 30 * 60))  # Default to 30 minutes

router = APIRouter()
auth_repo = AuthRepository()
user_repo = UserRepository()

cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH")

if not cred_path:
    raise ValueError("FIREBASE_CREDENTIALS_PATH environment variable is not set")

# Initialize the Firebase Admin SDK
cred = credentials.Certificate(cred_path)
firebase_admin.initialize_app(cred)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

ACCESS_TOKEN_SECRET = os.getenv("SECRET_KEY")


@router.get("/check-token")
async def check_token(request: Request):
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Access token missing")

    try:
        payload = jwt.decode(token, ACCESS_TOKEN_SECRET, algorithms=["HS256"])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        return JSONResponse(status_code=200, content={"message": "Token is valid"})
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


@router.post("/google", response_model=Dict[str, str], status_code=201)
async def google_sign_in(
    response: Response,
    idToken: str = Form(...),
    first_name: str = Form(...),
    last_name: str = Form(...),
) -> Dict[str, str]:
    """
    Handle Google Sign-In.
    """
    try:
        logging.info(idToken)

        # Verify the ID token with Firebase Admin SDK
        decoded_token = firebase_auth.verify_id_token(idToken)
        logging.info(f"Decoded token: {decoded_token}")

        email = decoded_token.get("email")

        if not email:
            raise HTTPException(status_code=400, detail="Invalid token")

        existing_user = user_repo.get_user_by_email(email)
        if not existing_user:
            user_data = {
                "first_name": first_name,
                "last_name": last_name,
                "email": email,
                "password": auth_repo.hash_password(
                    "".join(random.choices(string.ascii_letters + string.digits, k=12))
                ),
            }
            user_repo.create_user(user_data)
            existing_user = user_repo.get_user_by_email(email)
            message = "User registered and logged in successfully"
        else:
            message = "User logged in successfully"

        # Generate access and refresh tokens
        access_token = auth_repo.create_access_token(
            data={"sub": str(existing_user["_id"])}
        )
        refresh_token = auth_repo.create_refresh_token(
            data={"sub": str(existing_user["_id"])}
        )

        # Set the access and refresh tokens as HTTP-only cookies
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            samesite=cookie_samesite,
            secure=cookie_secure,
            max_age=cookie_max_age,  # 30 minutes in seconds
        )
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            samesite=cookie_samesite,
            secure=cookie_secure,
            max_age=cookie_max_age,  # 30 minutes in seconds
        )

        return {"message": message}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except firebase_auth.InvalidIdTokenError:
        raise HTTPException(status_code=400, detail="Invalid ID token")
    except firebase_auth.ExpiredIdTokenError:
        raise HTTPException(status_code=400, detail="Expired ID token")
    except firebase_auth.RevokedIdTokenError:
        raise HTTPException(status_code=400, detail="Revoked ID token")
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/request-password-reset", response_model=Dict[str, str])
async def request_password_reset(request: PasswordResetRequest) -> Dict[str, str]:
    """Endpoint to request a password reset link."""
    try:
        user = user_repo.get_user_by_email(request.email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Log the user object to see its structure
        logger.info(f"User object: {user}")

        # Ensure the user object contains the required keys
        if "first_name" not in user or "email" not in user:
            raise HTTPException(status_code=500, detail="User data is incomplete")

        reset_token = auth_repo.create_reset_token(data={"sub": str(user["_id"])})
        send_reset_password_email(user["email"], user["first_name"], reset_token)

        return {"message": "Password reset link sent"}
    except Exception as e:
        logger.error(f"Error in request_password_reset: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.post("/reset-password", response_model=Dict[str, str])
async def reset_password(data: PasswordReset) -> Dict[str, str]:
    """Endpoint to reset the password using the reset token."""
    try:
        payload = jwt.decode(data.token, REFRESH_SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid reset token")

        logger.info(f"Decoded user_id from token: {user_id}")

        user = user_repo.get_user_by_id(user_id)
        if user is None:
            raise HTTPException(status_code=404, detail="User not found")

        logger.info(f"User found: {user}")

        hashed_password = auth_repo.hash_password(data.new_password)
        user_repo.update_user_password(user_id, hashed_password)

        logger.info(f"Password updated for user_id: {user_id}")

        return {"message": "Password reset successfully"}
    except JWTError as e:
        print(f"JWTError: {e}")  # Print the error for debugging
        raise HTTPException(status_code=401, detail="Invalid reset token")
    except Exception as e:
        print(f"Error: {e}")  # Print any other errors for debugging
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/register", response_model=Dict[str, str], status_code=201)
async def register_user(
    response: Response,
    first_name: str = Form(...),
    last_name: str = Form(...),
    email: EmailStr = Form(...),
    password: str = Form(...),
) -> Dict[str, str]:
    """Endpoint to register a new user."""
    try:
        # Create a Pydantic model instance from the form data
        user = UserRegister(
            first_name=first_name, last_name=last_name, email=email, password=password
        )

        # Hash the password
        hashed_password = auth_repo.hash_password(password)

        # Create the user dictionary
        user_data = {
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "password": hashed_password,
        }

        # Call the repository method to create a user
        user_id = user_repo.create_user(user_data)

        # Fetch the created user from the database
        created_user = user_repo.get_user_by_id(user_id)
        if not created_user:
            raise HTTPException(
                status_code=500, detail="Failed to retrieve the created user"
            )

        # Convert ObjectId to string
        user_id_str = str(created_user["_id"])

        # Generate access and refresh tokens
        access_token = auth_repo.create_access_token(
            data={
                "sub": user_id_str,
            }
        )
        refresh_token = auth_repo.create_refresh_token(
            data={
                "sub": user_id_str,
            }
        )

        # Set the access and refresh tokens as HTTP-only cookies
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            samesite=cookie_samesite,
            secure=cookie_secure,
            max_age=20 * 60,
        )
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            samesite=cookie_samesite,
            secure=cookie_secure,
            max_age=20 * 60,
        )

        return {"message": "User registered successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login", response_model=Dict[str, str])
async def login_user(
    response: Response, email: EmailStr = Form(...), password: str = Form(...)
) -> Dict[str, str]:
    """Endpoint to login and return an access token."""
    try:
        # Create a Pydantic model instance from the form data
        user_login = UserLogin(email=email, password=password)

        user = user_repo.get_user_by_email(user_login.email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Verify password
        if not auth_repo.verify_password(password, user["password"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        # Generate access and refresh tokens
        access_token = auth_repo.create_access_token(
            data={
                "sub": str(user["_id"]),
            }
        )
        refresh_token = auth_repo.create_refresh_token(
            data={
                "sub": str(user["_id"]),
            }
        )

        # Set the access and refresh tokens as HTTP-only cookies
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            samesite=cookie_samesite,
            secure=cookie_secure,
            max_age=cookie_max_age,
        )
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            samesite=cookie_samesite,
            secure=cookie_secure,
            max_age=cookie_max_age,
        )
        print(jwt.decode(access_token, SECRET_KEY, algorithms=["HS256"]))

        return {"message": "User logged in successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/refresh")
async def refresh_token(request: Request, response: Response):
    """Endpoint to refresh access token using refresh token."""
    try:
        refresh_token = request.cookies.get("refresh_token")
        if not refresh_token:
            raise HTTPException(status_code=401, detail="Refresh token missing")

        payload = jwt.decode(refresh_token, REFRESH_SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid refresh token")

        user = user_repo.get_user_by_id(user_id)
        if user is None:
            raise HTTPException(status_code=404, detail="User not found")

        # Generate new access token
        access_token = auth_repo.create_access_token(
            data={
                "sub": str(user["_id"]),
            }
        )

        # Optionally, generate a new refresh token
        new_refresh_token = auth_repo.create_refresh_token(
            data={"sub": str(user["_id"])}
        )

        # Set the new access and refresh tokens as HTTP-only cookies
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            samesite=cookie_samesite,
            secure=cookie_secure,
            max_age=cookie_max_age,
        )
        response.set_cookie(
            key="refresh_token",
            value=new_refresh_token,
            httponly=True,
            samesite=cookie_samesite,
            secure=cookie_secure,
            max_age=cookie_max_age,
        )
        return {
            "message": "success",
        }
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")


@router.get("/logout", response_model=Dict[str, str])
async def logout_user(response: Response) -> Dict[str, str]:
    """Endpoint to logout user."""
    # Invalidate the token (implementation depends on your token storage strategy)
    response.delete_cookie(key="access_token")  # Delete access token cookie
    response.delete_cookie(key="refresh_token")  # Delete refresh token cookie
    return {"message": "User logged out"}


@router.get("/current_user", response_model=UserResponse)
async def get_current_user(request: Request) -> UserResponse:
    try:
        token = request.cookies.get("access_token")
        if not token:
            raise HTTPException(status_code=401, detail="Token not found")

        decode_token = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        # Ensure the token contains the user ID
        user_id = decode_token.get("sub")
        print("1")
        if not user_id:
            raise HTTPException(
                status_code=400, detail="Invalid token: user ID not found"
            )

        # Call the repository method to retrieve the user by ID
        user = user_repo.get_user_by_id(user_id)

        # Handle case where the user is not found
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Remove password from the response
        user.pop("password", None)  # This will remove the 'password' key if it exists

        # Convert the _id field to string
        user["userId"] = str(user["_id"])

        return user

    except JWTError as e:
        raise HTTPException(status_code=400, detail="Token is invalid or expired")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.get("/user/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, current_user: User = Depends(get_current_user)):
    """
    Endpoint to get user data by ID.
    Returns user data if found, or raises an HTTPException if the user is not found.
    """
    try:
        # Call the repository method to retrieve the user by ID
        user = user_repo.get_user_by_id(user_id)

        # Handle case where the user is not found
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Remove password from the response
        user.pop("password", None)  # This will remove the 'password' key if it exists

        # Handle the profile field (binary data)
        if user.get("profile"):
            # Convert binary data to a Base64 string
            user["profile"] = base64.b64encode(user["profile"]).decode("utf-8")

        return user
    except Exception as e:
        raise HTTPException(
            status_code=500, detail="An error occurred while retrieving the user"
        )


@router.patch("/user/{user_id}", response_model=Dict[str, str])
async def update_user(
    user_id: str,
    first_name: Optional[str] = Form(None),
    last_name: Optional[str] = Form(None),
    password: Optional[str] = Form(None),
    confirm_password: Optional[str] = Form(None),
    profile: Optional[UploadFile] = File(None),
) -> Dict[str, str]:
    update_fields = {}

    # Handle optional fields
    if first_name:
        update_fields["first_name"] = first_name
    if last_name:
        update_fields["last_name"] = last_name
    if password and confirm_password:
        if password == confirm_password:
            update_fields["password"] = auth_repo.hash_password(password)
        else:
            raise HTTPException(status_code=400, detail="Passwords do not match")

    # Handle profile image
    if profile is not None:  # Ensure profile is an UploadFile
        try:
            # Read and encode image as a Base64 string
            profile_content = await profile.read()
            encoded_image = base64.b64encode(profile_content).decode("utf-8")
            update_fields["profile"] = encoded_image
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Failed to process profile image: {str(e)}"
            )
    elif profile is not None:
        raise HTTPException(
            status_code=400, detail="Invalid file type for profile image"
        )

    # Update user in the database
    updated_count = user_repo.update_user(user_id, update_fields)
    if updated_count == 0:
        raise HTTPException(status_code=404, detail="User not found")

    return {"message": "User updated successfully"}


@router.delete("/user/{user_id}", response_model=Dict[str, str])
async def delete_user(user_id: str) -> Dict[str, str]:
    """
    Endpoint to delete a user by ID.
    Returns a success message or raises an HTTPException if the user is not found.
    """
    try:
        deleted_count = user_repo.delete_user(user_id)
        if deleted_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        return {"message": "User deleted"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/protected-route")
async def protected_route(current_user: Dict = Depends(get_current_user)):
    print(current_user)  # Debug print statement to see the contents of current_user
    return {
        "message": f"Hello, {current_user['first_name']} {current_user['last_name']}!"
    }


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: Dict = Depends(get_current_user)):
    """Endpoint to get the current authenticated user's information."""
    return current_user
