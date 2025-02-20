from datetime import datetime, timedelta
from jose import JWTError, jwt
from typing import Any, Dict, Optional
from fastapi import  Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
import logging
from db.user_repository import UserRepository
import os


SECRET_KEY = os.getenv("SECRET_KEY")
REFRESH_SECRET_KEY = os.getenv("REFRESH_SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", 7))

# Ensure the variables are loaded correctly
if not SECRET_KEY or not REFRESH_SECRET_KEY or not ALGORITHM:
    raise ValueError("Environment variables for SECRET_KEY, REFRESH_SECRET_KEY, or ALGORITHM are not set.")

class AuthRepository:
    def __init__(self):
        self.pwd_context = PasswordHasher()
        self.oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

    def create_access_token(self, data: Dict[str, Any], expires_delta: timedelta = None) -> str:
        """
        Create a JWT access token with the given data.
        """
        try:
            if expires_delta:
                expire = datetime.utcnow() + expires_delta
            else:
                expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
            
            to_encode = data.copy()
            to_encode.update({"exp": expire})
            
            encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
            return encoded_jwt
        except JWTError as e:
            logging.error(f"Error creating access token: {e}")
            raise HTTPException(status_code=500, detail="Could not create access token")
    
    def create_refresh_token(self, data: Dict[str, Any], expires_delta: timedelta = None) -> str:
        """
        Create a JWT refresh token with the given data.
        """
        try:
            if expires_delta:
                expire = datetime.utcnow() + expires_delta
            else:
                expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
            
            to_encode = data.copy()
            to_encode.update({"exp": expire})
            
            encoded_jwt = jwt.encode(to_encode, REFRESH_SECRET_KEY, algorithm=ALGORITHM)
            return encoded_jwt
        except JWTError as e:
            logging.error(f"Error creating refresh token: {e}")
            raise HTTPException(status_code=500, detail="Could not create refresh token")

    def verify_password(self, plain_password, hashed_password):
        """
        Verify password against hash.
        """
        try:
            self.pwd_context.verify(hashed_password, plain_password)
            return True
        except VerifyMismatchError:
            return False
        except Exception as e:
            logging.error(f"Error verifying password: {e}")
            raise HTTPException(status_code=500, detail="Could not verify password")

    def hash_password(self, password: str) -> str:
        """
        Hash the password using Argon2.
        """
        try:
            return self.pwd_context.hash(password)
        except Exception as e:
            logging.error(f"Error hashing password: {e}")
            raise HTTPException(status_code=500, detail="Could not hash password")

     
    def create_reset_token(self, data: Dict[str, str], expires_delta: timedelta = timedelta(hours=1)) -> str:
        """
        Create a JWT reset token with the given data.
        """
        try: 
            to_encode = data.copy()
            expire = datetime.utcnow() + expires_delta
            to_encode.update({"exp": expire})
            encoded_jwt = jwt.encode(to_encode, REFRESH_SECRET_KEY, algorithm=ALGORITHM)  # Use REFRESH_SECRET_KEY
            return encoded_jwt
        except JWTError as e:
            logging.error(f"Error creating reset token: {e}")
            raise HTTPException(status_code=500, detail="Could not create reset token")