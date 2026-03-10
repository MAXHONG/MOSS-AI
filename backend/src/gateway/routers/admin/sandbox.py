"""Sandbox configuration admin API."""

from typing import Any

from fastapi import APIRouter, Depends

from src.auth.middleware import CurrentUser, require_admin

router = APIRouter(prefix="/sandbox", tags=["admin-sandbox"])


@router.get("/config")
async def get_sandbox_config(
    current_user: CurrentUser = Depends(require_admin),
) -> dict[str, Any]:
    """Get sandbox configuration."""
    from src.config.app_config import get_app_config

    config = get_app_config()
    sandbox = config.sandbox

    return {
        "use": sandbox.use,
        "image": sandbox.image,
        "port": sandbox.port,
        "auto_start": sandbox.auto_start,
        "idle_timeout": sandbox.idle_timeout,
    }


@router.put("/config")
async def update_sandbox_config(
    config_data: dict[str, Any],
    current_user: CurrentUser = Depends(require_admin),
) -> dict[str, Any]:
    """Update sandbox configuration."""
    # This would require more sophisticated implementation
    # to actually update the config file
    return {"status": "updated", "config": config_data}


@router.get("/status")
async def get_sandbox_status(
    current_user: CurrentUser = Depends(require_admin),
) -> dict[str, Any]:
    """Get sandbox runtime status."""
    # This would require connecting to the actual sandbox provider
    return {
        "active_containers": 0,
        "total_requests": 0,
        "memory_usage": 0,
    }
