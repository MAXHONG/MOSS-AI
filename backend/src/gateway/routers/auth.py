"""Authentication API routes."""

from fastapi import APIRouter, Depends, HTTPException, Response, status

from src.auth.middleware import CurrentUser, get_current_user
from src.auth.models import LoginRequest, TokenResponse, UserCreate, UserResponse
from src.auth.service import AuthService, get_auth_service

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post(
    "/register",
    response_model=dict,
    summary="Register New User",
    description="Register a new user account.",
)
async def register(
    user_data: UserCreate,
    auth_service: AuthService = Depends(get_auth_service),
):
    """Register a new user."""
    try:
        user, token = auth_service.register(user_data)
        return {
            "user": user.model_dump(),
            "token": token.model_dump(),
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post(
    "/login",
    response_model=dict,
    summary="User Login",
    description="Authenticate and get access token.",
)
async def login(
    login_data: LoginRequest,
    response: Response,
    auth_service: AuthService = Depends(get_auth_service),
):
    """Login with username and password."""
    result = auth_service.login(login_data)

    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user, token = result

    # Set cookie for web clients
    response.set_cookie(
        key="access_token",
        value=token.access_token,
        httponly=True,
        max_age=token.expires_in,
        samesite="lax",
    )

    return {
        "user": user.model_dump(),
        "token": token.model_dump(),
    }


@router.post(
    "/logout",
    summary="User Logout",
    description="Clear authentication cookie.",
)
async def logout(response: Response):
    """Logout and clear cookie."""
    response.delete_cookie(key="access_token")
    return {"message": "Logged out successfully"}


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get Current User",
    description="Get authenticated user information.",
)
async def get_me(
    current_user: CurrentUser = Depends(get_current_user),
    auth_service: AuthService = Depends(get_auth_service),
):
    """Get current user info."""
    user = auth_service.get_user(current_user.user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Refresh Token",
    description="Refresh access token.",
)
async def refresh_token(
    current_user: CurrentUser = Depends(get_current_user),
    auth_service: AuthService = Depends(get_auth_service),
):
    """Refresh access token."""
    user = auth_service.get_user(current_user.user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return auth_service.create_access_token(user.id, user.username, user.role)
