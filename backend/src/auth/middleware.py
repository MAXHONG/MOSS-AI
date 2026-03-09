"""JWT authentication middleware."""

from typing import Annotated

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from src.auth.models import UserResponse, UserRole
from src.auth.service import AuthService, get_auth_service

# Security scheme
security = HTTPBearer(auto_error=False)


class CurrentUser:
    """Current authenticated user context."""

    def __init__(self, user_id: str, username: str, role: UserRole):
        self.user_id = user_id
        self.username = username
        self.role = role

    def is_admin(self) -> bool:
        """Check if user is admin."""
        return self.role == UserRole.ADMIN


async def get_current_user(
    request: Request,
    auth_service: AuthService = Depends(get_auth_service),
) -> CurrentUser:
    """Get current authenticated user from JWT token."""
    # Get token from Authorization header
    auth_header = request.headers.get("Authorization")
    token = None

    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header[7:]  # Remove "Bearer " prefix
    else:
        # Try to get token from cookie
        token = request.cookies.get("access_token")

    if not token:
        # For development, allow anonymous access
        # In production, this should raise an exception
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = auth_service.decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return CurrentUser(
        user_id=payload["sub"],
        username=payload["username"],
        role=UserRole(payload["role"]),
    )


async def get_current_user_optional(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = None,
    auth_service: AuthService = Depends(get_auth_service),
) -> CurrentUser | None:
    """Get current user, or None if not authenticated."""
    try:
        return await get_current_user(request, credentials, auth_service)
    except HTTPException:
        return None


async def require_admin(current_user: Annotated[CurrentUser, Depends(get_current_user)]) -> CurrentUser:
    """Require admin role."""
    if not current_user.is_admin():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user


def require_role(role: UserRole):
    """Dependency factory for requiring specific role."""

    async def role_checker(
        current_user: Annotated[CurrentUser, Depends(get_current_user)]
    ) -> CurrentUser:
        if current_user.role != role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{role.value}' required",
            )
        return current_user

    return role_checker
