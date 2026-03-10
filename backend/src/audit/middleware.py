"""Audit logging middleware."""

import logging
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from src.audit.models import AuditAction
from src.audit.store import get_audit_store

logger = logging.getLogger(__name__)


class AuditMiddleware(BaseHTTPMiddleware):
    """Middleware to automatically log API requests."""

    # Paths to exclude from audit logging
    EXCLUDE_PATHS = {"/health", "/metrics", "/docs", "/openapi.json", "/redoc"}

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request and log audit information."""
        # Skip excluded paths
        if request.url.path in self.EXCLUDE_PATHS or request.url.path.startswith(
            "/docs"
        ):
            return await call_next(request)

        # Get client info
        ip_address = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent")

        # Extract user info if available
        user_id = None
        username = None

        # Try to get user from request state (set by auth middleware)
        if hasattr(request.state, "user_id"):
            user_id = request.state.user_id
            username = getattr(request.state, "username", None)

        # Log the request
        store = get_audit_store()

        # Determine action type based on path and method
        action = self._get_action(request)

        try:
            response = await call_next(request)

            # Log successful request
            if response.status_code < 400:
                store.create_log(
                    action=action,
                    user_id=user_id,
                    username=username,
                    ip_address=ip_address,
                    user_agent=user_agent,
                    resource=request.url.path,
                    status="success",
                )
            else:
                # Log failed request
                store.create_log(
                    action=action,
                    user_id=user_id,
                    username=username,
                    ip_address=ip_address,
                    user_agent=user_agent,
                    resource=request.url.path,
                    details={"status_code": response.status_code},
                    status="failed",
                )

            return response
        except Exception as e:
            # Log exception
            store.create_log(
                action=action,
                user_id=user_id,
                username=username,
                ip_address=ip_address,
                user_agent=user_agent,
                resource=request.url.path,
                details={"error": str(e)},
                status="failed",
            )
            raise

    def _get_action(self, request: Request) -> AuditAction:
        """Determine audit action based on request."""
        path = request.url.path
        method = request.method

        # Auth endpoints
        if path == "/api/auth/login":
            return AuditAction.LOGIN
        if path == "/api/auth/logout":
            return AuditAction.LOGOUT
        if path == "/api/auth/register":
            return AuditAction.REGISTER

        # Admin endpoints
        if path.startswith("/api/admin/users"):
            if method == "POST":
                return AuditAction.USER_CREATE
            if method in ["PUT", "PATCH"]:
                return AuditAction.USER_UPDATE
            if method == "DELETE":
                return AuditAction.USER_DELETE
            if method == "GET":
                return AuditAction.USER_VIEW

        # Default to API call
        return AuditAction.API_CALL
