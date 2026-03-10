"""Audit log models."""

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class AuditAction(str, Enum):
    """Audit action types."""

    # Authentication
    LOGIN = "login"
    LOGOUT = "logout"
    REGISTER = "register"
    LOGIN_FAILED = "login_failed"

    # User management
    USER_CREATE = "user_create"
    USER_UPDATE = "user_update"
    USER_DELETE = "user_delete"
    USER_VIEW = "user_view"

    # System
    CONFIG_UPDATE = "config_update"
    SANDBOX_START = "sandbox_start"
    SANDBOX_STOP = "sandbox_stop"

    # API
    API_CALL = "api_call"


class AuditLog(BaseModel):
    """Audit log entry."""

    id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    action: AuditAction
    user_id: str | None = None
    username: str | None = None
    ip_address: str | None = None
    user_agent: str | None = None
    resource: str | None = None
    details: dict[str, Any] = {}
    status: str = "success"  # success, failed


class AuditLogQuery(BaseModel):
    """Query parameters for audit logs."""

    action: AuditAction | None = None
    user_id: str | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None
    limit: int = 100
    offset: int = 0


class AuditStats(BaseModel):
    """Audit statistics."""

    total_logs: int
    login_count: int
    user_actions: int
    failed_logins: int
    actions_by_type: dict[str, int]
