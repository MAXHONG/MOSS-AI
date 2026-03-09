"""Admin API routes for user management."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from src.auth.middleware import CurrentUser, get_current_user, require_admin
from src.auth.models import UserCreate, UserResponse, UserUpdate
from src.auth.service import AuthService, get_auth_service

router = APIRouter(prefix="/api/admin/users", tags=["admin"])


@router.get(
    "",
    response_model=list[UserResponse],
    summary="List All Users",
    description="Get all users (admin only).",
)
async def list_users(
    _: Annotated[CurrentUser, Depends(require_admin)],
    auth_service: AuthService = Depends(get_auth_service),
):
    """List all users."""
    return auth_service.list_users()


@router.post(
    "",
    response_model=UserResponse,
    summary="Create User",
    description="Create a new user (admin only).",
)
async def create_user(
    user_data: UserCreate,
    _: Annotated[CurrentUser, Depends(require_admin)],
    auth_service: AuthService = Depends(get_auth_service),
):
    """Create a new user."""
    try:
        user, _ = auth_service.register(user_data)
        return user
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get(
    "/{user_id}",
    response_model=UserResponse,
    summary="Get User",
    description="Get user by ID (admin only).",
)
async def get_user(
    user_id: str,
    _: Annotated[CurrentUser, Depends(require_admin)],
    auth_service: AuthService = Depends(get_auth_service),
):
    """Get user by ID."""
    user = auth_service.get_user(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user


@router.put(
    "/{user_id}",
    response_model=UserResponse,
    summary="Update User",
    description="Update user information (admin only).",
)
async def update_user(
    user_id: str,
    user_data: UserUpdate,
    _: Annotated[CurrentUser, Depends(require_admin)],
    auth_service: AuthService = Depends(get_auth_service),
):
    """Update user."""
    user = auth_service.update_user(user_id, user_data)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user


@router.delete(
    "/{user_id}",
    response_model=dict,
    summary="Delete User",
    description="Delete a user (admin only).",
)
async def delete_user(
    user_id: str,
    current_user: Annotated[CurrentUser, Depends(require_admin)],
    auth_service: AuthService = Depends(get_auth_service),
):
    """Delete user."""
    # Prevent self-deletion
    if user_id == current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete yourself",
        )

    success = auth_service.delete_user(user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return {"message": "User deleted successfully"}
