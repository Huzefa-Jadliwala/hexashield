from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class Token(BaseModel):
    """
    Pydantic model for representing authentication tokens.
    """
    access_token: str  # The JWT access token
    refresh_token: str  # The JWT refresh token


class User(BaseModel):
    """
    Pydantic model for representing user data.
    """
    first_name: str  # The user's first name
    last_name: str  # The user's last name
    password: str  # The user's hashed password
    email: EmailStr  # Mandatory, ensures a valid email format
    profile: Optional[bytes] = None  # Optional, defaults to None, can store user profile information

    class Config:
        from_attributes = True  # Enables compatibility with ORM objects

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordReset(BaseModel):
    token: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8, max_length=16)

class GoogleSignInRequest(BaseModel):
    idToken: str
        
class UserResponse(BaseModel):
    userId: str
    first_name: str  # The user's first name
    last_name: str  # The user's last name
    email: EmailStr
    profile: Optional[bytes] = None

    class Config:
        from_attributes = True
        # If you want to exclude password in response globally:
        # exclude = {"password"}

class UserRegister(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=20)
    last_name: str = Field(..., min_length=1, max_length=20)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=16)

class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=16)