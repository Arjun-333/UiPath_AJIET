"""
Append-Only Forensic Audit Logger for Project Autonomia Workforce Management.
Every consequential operation writes an immutable entry. No update or delete paths exist.
"""

import uuid
import logging
from datetime import datetime
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.database.workforce_models import WorkforceAuditLogModel

LOGGER = logging.getLogger(__name__)

class WorkforceAuditLogger:
    @staticmethod
    async def log_action(
        session: AsyncSession,
        actor_principal: str,
        actor_role: str,
        action: str,
        target_agent_id: str,
        target_agent_name: str,
        before_state: Dict[str, Any],
        after_state: Dict[str, Any],
        reason: str,
        linked_approval_id: str,
        correlation_id: Optional[str] = None,
        linked_recommendation_id: Optional[str] = None,
        ip_address: Optional[str] = None
    ) -> WorkforceAuditLogModel:
        """
        Appends an immutable audit log entry.
        Strictly append-only: this module contains NO update or delete logic.
        """
        entry_id = f"audit_{uuid.uuid4().hex[:12]}"
        corr_id = correlation_id or f"corr_{uuid.uuid4().hex[:8]}"

        audit_entry = WorkforceAuditLogModel(
            id=entry_id,
            actor_principal=actor_principal,
            actor_role=actor_role,
            action=action,
            target_agent_id=target_agent_id,
            target_agent_name=target_agent_name,
            before_state=before_state,
            after_state=after_state,
            reason=reason,
            linked_approval_id=linked_approval_id,
            linked_recommendation_id=linked_recommendation_id,
            correlation_id=corr_id,
            ip_address=ip_address or "127.0.0.1",
            timestamp=datetime.utcnow()
        )
        session.add(audit_entry)
        LOGGER.info(
            "AUDIT LOGGED [%s]: actor=%s action=%s target=%s approval=%s",
            entry_id, actor_principal, action, target_agent_id, linked_approval_id
        )
        return audit_entry
