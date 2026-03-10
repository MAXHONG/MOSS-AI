"""Audit log store - JSON file backed storage."""

import json
import logging
import secrets
import threading
from datetime import datetime
from pathlib import Path
from typing import Any

from src.audit.models import AuditAction, AuditLog, AuditLogQuery, AuditStats

logger = logging.getLogger(__name__)


class AuditStore:
    """JSON-file-backed audit log storage."""

    _instance = None
    _lock = threading.Lock()

    def __init__(self, path: Path | None = None):
        if path is None:
            # Default to backend/.deer-flow/audit.json
            base_dir = Path(__file__).parent.parent.parent.parent / ".deer-flow"
            path = base_dir / "audit.json"

        self._path = path
        self._data: dict[str, Any] = {"logs": []}

        # Ensure directory exists
        self._path.parent.mkdir(parents=True, exist_ok=True)

        # Load existing data
        self._load()

    def _load(self):
        """Load data from file."""
        if self._path.exists():
            try:
                with open(self._path, "r") as f:
                    self._data = json.load(f)
            except Exception as e:
                logger.warning(f"Failed to load audit log: {e}")
                self._data = {"logs": []}

    def _save(self):
        """Save data to file."""
        try:
            with open(self._path, "w") as f:
                json.dump(self._data, f, indent=2, default=str)
        except Exception as e:
            logger.error(f"Failed to save audit log: {e}")

    def create_log(
        self,
        action: AuditAction,
        user_id: str | None = None,
        username: str | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
        resource: str | None = None,
        details: dict[str, Any] | None = None,
        status: str = "success",
    ) -> AuditLog:
        """Create a new audit log entry."""
        with self._lock:
            log_id = secrets.token_urlsafe(16)
            log = AuditLog(
                id=log_id,
                timestamp=datetime.utcnow(),
                action=action,
                user_id=user_id,
                username=username,
                ip_address=ip_address,
                user_agent=user_agent,
                resource=resource,
                details=details or {},
                status=status,
            )

            self._data["logs"].append(log.model_dump())
            self._save()

            return log

    def query_logs(self, query: AuditLogQuery) -> list[AuditLog]:
        """Query audit logs."""
        with self._lock:
            logs = []

            for log_data in self._data.get("logs", []):
                log = AuditLog(**log_data)

                # Apply filters
                if query.action and log.action != query.action:
                    continue
                if query.user_id and log.user_id != query.user_id:
                    continue
                if query.start_date and log.timestamp < query.start_date:
                    continue
                if query.end_date and log.timestamp > query.end_date:
                    continue

                logs.append(log)

            # Sort by timestamp descending
            logs.sort(key=lambda x: x.timestamp, reverse=True)

            # Apply pagination
            return logs[query.offset : query.offset + query.limit]

    def get_stats(self) -> AuditStats:
        """Get audit statistics."""
        with self._lock:
            logs = self._data.get("logs", [])
            total = len(logs)

            login_count = sum(1 for l in logs if l.get("action") == AuditAction.LOGIN.value)
            user_actions = sum(
                1
                for l in logs
                if l.get("action")
                in [
                    AuditAction.USER_CREATE.value,
                    AuditAction.USER_UPDATE.value,
                    AuditAction.USER_DELETE.value,
                ]
            )
            failed_logins = sum(
                1 for l in logs if l.get("action") == AuditAction.LOGIN_FAILED.value
            )

            # Count by action type
            actions_by_type: dict[str, int] = {}
            for log in logs:
                action = log.get("action")
                actions_by_type[action] = actions_by_type.get(action, 0) + 1

            return AuditStats(
                total_logs=total,
                login_count=login_count,
                user_actions=user_actions,
                failed_logins=failed_logins,
                actions_by_type=actions_by_type,
            )

    @classmethod
    def get_instance(cls) -> "AuditStore":
        """Get singleton instance."""
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = cls()
        return cls._instance


def get_audit_store() -> AuditStore:
    """Get audit store singleton."""
    return AuditStore.get_instance()
