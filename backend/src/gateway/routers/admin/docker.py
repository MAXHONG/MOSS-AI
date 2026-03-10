"""Docker management admin API."""

from typing import Any

from fastapi import APIRouter, Depends

from src.auth.middleware import CurrentUser, require_admin

router = APIRouter(prefix="/docker", tags=["admin-docker"])


@router.get("/status")
async def get_docker_status(
    current_user: CurrentUser = Depends(require_admin),
) -> dict[str, Any]:
    """Get Docker status."""
    try:
        import docker

        client = docker.from_env()
        info = client.info()

        return {
            "running": True,
            "version": client.version().get("Version", "Unknown"),
            "containers": info.get("Containers", 0),
            "images": len(client.images.list()),
            "memory_usage": info.get("MemTotal", 0) / (1024 * 1024 * 1024),  # GB
        }
    except Exception as e:
        return {
            "running": False,
            "version": "Not available",
            "containers": 0,
            "images": 0,
            "memory_usage": 0,
            "error": str(e),
        }


@router.get("/images")
async def get_docker_images(
    current_user: CurrentUser = Depends(require_admin),
) -> list[str]:
    """Get Docker images."""
    try:
        import docker

        client = docker.from_env()
        images = client.images.list()

        return [img.tags[0] if img.tags else img.id for img in images]
    except Exception:
        return []


@router.post("/pull")
async def pull_docker_image(
    image_name: str,
    current_user: CurrentUser = Depends(require_admin),
) -> dict[str, Any]:
    """Pull a Docker image."""
    try:
        import docker

        client = docker.from_env()
        client.images.pull(image_name)

        return {"status": "success", "image": image_name}
    except Exception as e:
        return {"status": "error", "message": str(e)}
