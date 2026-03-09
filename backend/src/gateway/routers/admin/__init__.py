"""Admin API routes."""

from fastapi import APIRouter

from src.gateway.routers.admin import users

router = APIRouter()

# Include admin routers
router.include_router(users.router)
