"""User store - JSON file backed user storage."""

from __future__ import annotations

import json
import logging
import secrets
import threading
from datetime import datetime
from pathlib import Path
from typing import Any

from src.auth.models import Project, UserConfig, UserRole, UserWithPassword

logger = logging.getLogger(__name__)


class UserStore:
    """JSON-file-backed user storage.

    Data layout (on disk):
        {
            "users": {
                "<user_id>": {
                    "id": "<uuid>",
                    "username": "john",
                    "email": "john@example.com",
                    "password_hash": "hashed_password",
                    "role": "user",
                    "created_at": "2025-01-01T00:00:00Z",
                    "updated_at": "2025-01-01T00:00:00Z"
                },
                ...
            },
            "user_configs": {
                "<user_id>": {
                    "id": "<uuid>",
                    "user_id": "<user_id>",
                    "default_model": null,
                    "thinking_enabled": true,
                    "theme": "system"
                },
                ...
            },
            "projects": {
                "<project_id>": {
                    "id": "<uuid>",
                    "user_id": "<user_id>",
                    "name": "My Project",
                    "description": null,
                    "config": {},
                    "created_at": "2025-01-01T00:00:00Z",
                    "updated_at": "2025-01-01T00:00:00Z"
                },
                ...
            }
        }
    """

    def __init__(self, path: str | Path | None = None) -> None:
        if path is None:
            from src.config.paths import get_paths

            path = Path(get_paths().base_dir) / "users.json"
        self._path = Path(path)
        self._path.parent.mkdir(parents=True, exist_ok=True)
        self._data: dict[str, dict[str, Any]] = self._load()
        self._lock = threading.Lock()

    def _load(self) -> dict[str, dict[str, Any]]:
        if self._path.exists():
            try:
                with open(self._path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except (json.JSONDecodeError, IOError) as e:
                logger.warning("Failed to load user store: %s, starting fresh", e)
        return {"users": {}, "user_configs": {}, "projects": {}}

    def _save(self) -> None:
        """Atomically save data to disk."""
        temp_path = self._path.with_suffix(".tmp")
        try:
            with open(temp_path, "w", encoding="utf-8") as f:
                json.dump(self._data, f, indent=2, default=str)
            temp_path.replace(self._path)
        except Exception as e:
            logger.error("Failed to save user store: %s", e)
            if temp_path.exists():
                temp_path.unlink()
            raise

    # -- User operations -----------------------------------------------------

    def create_user(
        self,
        username: str,
        password_hash: str,
        email: str | None = None,
        role: UserRole = UserRole.USER,
    ) -> UserWithPassword:
        """Create a new user."""
        with self._lock:
            # Check username uniqueness
            for user in self._data["users"].values():
                if user["username"] == username:
                    raise ValueError(f"Username '{username}' already exists")
                if email and user.get("email") == email:
                    raise ValueError(f"Email '{email}' already exists")

            user_id = secrets.token_urlsafe(16)
            now = datetime.utcnow()

            user = {
                "id": user_id,
                "username": username,
                "email": email,
                "password_hash": password_hash,
                "role": role.value,
                "created_at": now.isoformat(),
                "updated_at": now.isoformat(),
            }

            self._data["users"][user_id] = user

            # Create default user config
            config_id = secrets.token_urlsafe(16)
            self._data["user_configs"][user_id] = {
                "id": config_id,
                "user_id": user_id,
                "default_model": None,
                "thinking_enabled": True,
                "theme": "system",
            }

            self._save()

            return UserWithPassword(**user)

    def get_user_by_username(self, username: str) -> UserWithPassword | None:
        """Get user by username."""
        for user in self._data["users"].values():
            if user["username"] == username:
                return UserWithPassword(**user)
        return None

    def get_user_by_id(self, user_id: str) -> UserWithPassword | None:
        """Get user by ID."""
        user = self._data["users"].get(user_id)
        if user:
            return UserWithPassword(**user)
        return None

    def update_user(
        self,
        user_id: str,
        email: str | None = None,
        password_hash: str | None = None,
        role: UserRole | None = None,
    ) -> UserWithPassword | None:
        """Update user information."""
        with self._lock:
            user = self._data["users"].get(user_id)
            if not user:
                return None

            if email is not None:
                user["email"] = email
            if password_hash is not None:
                user["password_hash"] = password_hash
            if role is not None:
                user["role"] = role.value

            user["updated_at"] = datetime.utcnow().isoformat()
            self._save()

            return UserWithPassword(**user)

    def delete_user(self, user_id: str) -> bool:
        """Delete a user."""
        with self._lock:
            if user_id not in self._data["users"]:
                return False

            del self._data["users"][user_id]

            # Delete associated config and projects
            if user_id in self._data["user_configs"]:
                del self._data["user_configs"][user_id]

            # Delete user's projects
            self._data["projects"] = {
                k: v
                for k, v in self._data["projects"].items()
                if v["user_id"] != user_id
            }

            self._save()
            return True

    def list_users(self) -> list[UserWithPassword]:
        """List all users."""
        return [UserWithPassword(**u) for u in self._data["users"].values()]

    # -- User config operations -----------------------------------------------

    def get_user_config(self, user_id: str) -> UserConfig | None:
        """Get user configuration."""
        config = self._data["user_configs"].get(user_id)
        if config:
            return UserConfig(**config)
        return None

    def update_user_config(
        self,
        user_id: str,
        default_model: str | None = None,
        thinking_enabled: bool | None = None,
        theme: str | None = None,
    ) -> UserConfig | None:
        """Update user configuration."""
        with self._lock:
            config = self._data["user_configs"].get(user_id)
            if not config:
                return None

            if default_model is not None:
                config["default_model"] = default_model
            if thinking_enabled is not None:
                config["thinking_enabled"] = thinking_enabled
            if theme is not None:
                config["theme"] = theme

            self._save()
            return UserConfig(**config)

    # -- Project operations ---------------------------------------------------

    def create_project(
        self, user_id: str, name: str, description: str | None = None
    ) -> Project:
        """Create a new project."""
        with self._lock:
            project_id = secrets.token_urlsafe(16)
            now = datetime.utcnow()

            project = {
                "id": project_id,
                "user_id": user_id,
                "name": name,
                "description": description,
                "config": {},
                "created_at": now.isoformat(),
                "updated_at": now.isoformat(),
            }

            self._data["projects"][project_id] = project
            self._save()

            return Project(**project)

    def get_project(self, project_id: str) -> Project | None:
        """Get project by ID."""
        project = self._data["projects"].get(project_id)
        if project:
            return Project(**project)
        return None

    def list_user_projects(self, user_id: str) -> list[Project]:
        """List all projects for a user."""
        return [
            Project(**p)
            for p in self._data["projects"].values()
            if p["user_id"] == user_id
        ]

    def update_project(
        self,
        project_id: str,
        name: str | None = None,
        description: str | None = None,
        config: dict[str, Any] | None = None,
    ) -> Project | None:
        """Update project."""
        with self._lock:
            project = self._data["projects"].get(project_id)
            if not project:
                return None

            if name is not None:
                project["name"] = name
            if description is not None:
                project["description"] = description
            if config is not None:
                project["config"] = config

            project["updated_at"] = datetime.utcnow().isoformat()
            self._save()

            return Project(**project)

    def delete_project(self, project_id: str) -> bool:
        """Delete a project."""
        with self._lock:
            if project_id not in self._data["projects"]:
                return False

            del self._data["projects"][project_id]
            self._save()
            return True


# Singleton instance
_user_store: UserStore | None = None


def get_user_store() -> UserStore:
    """Get the user store singleton."""
    global _user_store
    if _user_store is None:
        _user_store = UserStore()
    return _user_store
