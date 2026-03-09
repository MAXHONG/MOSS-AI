"""Authentication service for user management and JWT tokens."""

import logging
from datetime import datetime, timedelta

import bcrypt
import jwt

from src.auth.models import (
    LoginRequest,
    TokenResponse,
    UserCreate,
    UserResponse,
    UserRole,
    UserUpdate,
)
from src.auth.store import UserStore, get_user_store

logger = logging.getLogger(__name__)

# JWT configuration (should be loaded from config in production)
JWT_SECRET_KEY = "your-secret-key-change-in-production"
JWT_ALGORITHM = "HS256"
JWT_ACCESS_TOKEN_EXPIRE_DAYS = 7


class AuthService:
    """Authentication service for user management."""

    def __init__(self, store: UserStore | None = None):
        self._store = store or get_user_store()

    def hash_password(self, password: str) -> str:
        """Hash a password."""
        return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against a hash."""
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

    def create_access_token(self, user_id: str, username: str, role: UserRole) -> TokenResponse:
        """Create a JWT access token."""
        expires = datetime.utcnow() + timedelta(days=JWT_ACCESS_TOKEN_EXPIRE_DAYS)

        payload = {
            "sub": user_id,
            "username": username,
            "role": role.value,
            "exp": expires,
            "iat": datetime.utcnow(),
        }

        token = jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

        return TokenResponse(
            access_token=token,
            token_type="bearer",
            expires_in=int(JWT_ACCESS_TOKEN_EXPIRE_DAYS * 24 * 3600),
        )

    def decode_token(self, token: str) -> dict | None:
        """Decode and verify a JWT token."""
        try:
            payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
            return payload
        except jwt.ExpiredSignatureError:
            logger.warning("Token has expired")
            return None
        except jwt.InvalidTokenError as e:
            logger.warning("Invalid token: %s", e)
            return None

    def register(self, user_data: UserCreate) -> tuple[UserResponse, TokenResponse]:
        """Register a new user."""
        password_hash = self.hash_password(user_data.password)

        user = self._store.create_user(
            username=user_data.username,
            password_hash=password_hash,
            email=user_data.email,
            role=user_data.role,
        )

        token = self.create_access_token(user.id, user.username, user.role)

        return UserResponse(**user.model_dump()), token

    def login(self, login_data: LoginRequest) -> tuple[UserResponse, TokenResponse] | None:
        """Authenticate a user and return token."""
        user = self._store.get_user_by_username(login_data.username)

        if not user:
            return None

        if not self.verify_password(login_data.password, user.password_hash):
            return None

        token = self.create_access_token(user.id, user.username, user.role)

        return UserResponse(**user.model_dump()), token

    def get_user(self, user_id: str) -> UserResponse | None:
        """Get user by ID."""
        user = self._store.get_user_by_id(user_id)
        if user:
            return UserResponse(**user.model_dump())
        return None

    def get_user_by_username(self, username: str) -> UserResponse | None:
        """Get user by username."""
        user = self._store.get_user_by_username(username)
        if user:
            return UserResponse(**user.model_dump())
        return None

    def update_user(self, user_id: str, user_data: UserUpdate) -> UserResponse | None:
        """Update user information."""
        password_hash = None
        if user_data.password:
            password_hash = self.hash_password(user_data.password)

        user = self._store.update_user(
            user_id=user_id,
            email=user_data.email,
            password_hash=password_hash,
            role=user_data.role,
        )

        if user:
            return UserResponse(**user.model_dump())
        return None

    def delete_user(self, user_id: str) -> bool:
        """Delete a user."""
        return self._store.delete_user(user_id)

    def list_users(self) -> list[UserResponse]:
        """List all users."""
        return [UserResponse(**u.model_dump()) for u in self._store.list_users()]

    def get_user_config(self, user_id: str):
        """Get user configuration."""
        return self._store.get_user_config(user_id)

    def update_user_config(self, user_id: str, **kwargs):
        """Update user configuration."""
        return self._store.update_user_config(user_id, **kwargs)

    def create_project(self, user_id: str, name: str, description: str | None = None):
        """Create a new project."""
        return self._store.create_project(user_id, name, description)

    def list_projects(self, user_id: str):
        """List all projects for a user."""
        return self._store.list_user_projects(user_id)

    def get_project(self, project_id: str):
        """Get project by ID."""
        return self._store.get_project(project_id)

    def update_project(self, project_id: str, **kwargs):
        """Update project."""
        return self._store.update_project(project_id, **kwargs)

    def delete_project(self, project_id: str) -> bool:
        """Delete a project."""
        return self._store.delete_project(project_id)


# Singleton instance
_auth_service: AuthService | None = None


def get_auth_service() -> AuthService:
    """Get the auth service singleton."""
    global _auth_service
    if _auth_service is None:
        _auth_service = AuthService()
    return _auth_service
