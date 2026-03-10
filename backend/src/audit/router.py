"""Audit log API routes."""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query

from src.auth.middleware import CurrentUser, require_admin
from src.audit.models import AuditAction, AuditLog, AuditLogQuery, AuditStats
from src.audit.store import get_audit_store

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("/logs", response_model=list[AuditLog])
async def get_audit_logs(
    action: Optional[AuditAction] = None,
    user_id: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    limit: int = Query(default=100, le=1000),
    offset: int = Query(default=0, ge=0),
    current_user: CurrentUser = Depends(require_admin),
) -> list[AuditLog]:
    """Get audit logs with optional filters."""
    store = get_audit_store()

    query = AuditLogQuery(
        action=action,
        user_id=user_id,
        start_date=start_date,
        end_date=end_date,
        limit=limit,
        offset=offset,
    )

    return store.query_logs(query)


@router.get("/stats", response_model=AuditStats)
async def get_audit_stats(
    current_user: CurrentUser = Depends(require_admin),
) -> AuditStats:
    """Get audit statistics."""
    store = get_audit_store()
    return store.get_stats()
