"""User models for authentication."""

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, EmailStr, Field


class UserRole(str, Enum):
    """User role enumeration."""

    ADMIN = "admin"
    USER = "user"


class UserCreate(BaseModel):
    """Request model for creating a new user."""

    username: str = Field(..., min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_-]+$")
    email: EmailStr | None = None
    password: str = Field(..., min_length=6)
    role: UserRole = UserRole.USER


class UserUpdate(BaseModel):
    """Request model for updating a user."""

    email: EmailStr | None = None
    password: str | None = Field(None, min_length=6)
    role: UserRole | None = None


class UserResponse(BaseModel):
    """Response model for user information (excludes password)."""

    id: str
    username: str
    email: str | None = None
    role: UserRole
    created_at: datetime
    updated_at: datetime


class UserWithPassword(BaseModel):
    """Internal model for user with password hash."""

    id: str
    username: str
    email: str | None = None
    password_hash: str
    role: UserRole
    created_at: datetime
    updated_at: datetime


class UserConfig(BaseModel):
    """User configuration model."""

    id: str
    user_id: str
    default_model: str | None = None
    thinking_enabled: bool = True
    theme: str = "system"


class Project(BaseModel):
    """User project model."""

    id: str
    user_id: str
    name: str
    description: str | None = None
    config: dict[str, Any] = {}
    created_at: datetime
    updated_at: datetime


class TokenResponse(BaseModel):
    """Response model for authentication token."""

    access_token: str
    token_type: str = "bearer"
    expires_in: int = 3600 * 24 * 7  # 7 days


class LoginRequest(BaseModel):
    """Request model for user login."""

    username: str
    password: str
