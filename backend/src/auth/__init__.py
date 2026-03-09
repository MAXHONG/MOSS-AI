"""Authentication module for MOSS AI.

Provides user authentication, JWT token management, and authorization.
"""

from src.auth.middleware import (
    CurrentUser,
    get_current_user,
    get_current_user_optional,
    require_admin,
    require_role,
)
from src.auth.models import (
    LoginRequest,
    Project,
    TokenResponse,
    UserConfig,
    UserCreate,
    UserResponse,
    UserRole,
    UserUpdate,
)
from src.auth.service import AuthService, get_auth_service
from src.auth.store import UserStore, get_user_store

__all__ = [
    # Middleware
    "CurrentUser",
    "get_current_user",
    "get_current_user_optional",
    "require_admin",
    "require_role",
    # Models
    "LoginRequest",
    "Project",
    "TokenResponse",
    "UserConfig",
    "UserCreate",
    "UserResponse",
    "UserRole",
    "UserUpdate",
    # Service
    "AuthService",
    "get_auth_service",
    # Store
    "UserStore",
    "get_user_store",
]
