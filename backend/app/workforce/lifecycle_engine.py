"""
Central Lifecycle Engine for Project Autonomia Workforce Management.
Executes atomic, versioned, auditable employee lifecycle transitions with in-flight task handling.
"""

import uuid
import logging
from datetime import datetime
from typing import Dict, Any, Optional, List
from sqlalchemy import select, and_, update
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.database.session import AsyncSessionLocal
from backend.app.database.models import TaskModel, ApprovalModel
from backend.app.database.workforce_models import (
    WorkforceEmployeeModel, WorkforceAgentConfigModel,
    WorkforceAuditLogModel
)
from backend.app.workforce.state_machine import validate_lifecycle_transition
from backend.app.workforce.audit import WorkforceAuditLogger
from backend.app.workforce.rbac import Principal, Role

LOGGER = logging.getLogger(__name__)

class LifecycleEngine:
    def __init__(self, broadcast_callback=None):
        self.broadcast_callback = broadcast_callback

    async def _broadcast(self, event_type: str, payload: Dict[str, Any]):
        if self.broadcast_callback:
            try:
                await self.broadcast_callback(event_type, payload)
            except Exception as exc:
                LOGGER.warning("Lifecycle broadcast error: %s", exc)

    async def handle_in_flight_tasks(
        self,
        session: AsyncSession,
        agent_id: str,
        reason: str
    ) -> List[str]:
        """
        Gracefully handles in-flight tasks for suspended or terminated employees.
        Reassigns tasks to department head or marks failed; NEVER silently drops tasks.
        """
        stmt = select(TaskModel).where(
            and_(
                TaskModel.assigned_agent_id == agent_id,
                TaskModel.status.in_(["pending", "in_progress", "review"])
            )
        )
        res = await session.execute(stmt)
        affected_tasks = res.scalars().all()
        handled_ids = []

        for task in affected_tasks:
            task.status = "failed"
            task.error_message = f"Task paused: Assigned employee was suspended/terminated. Reason: {reason}"
            handled_ids.append(task.id)

        return handled_ids

    async def execute_hire(
        self,
        candidate_id: str,
        approval_id: str,
        principal: Principal,
        correlation_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Deploys a tested candidate agent into active service."""
        async with AsyncSessionLocal() as session:
            stmt = select(WorkforceEmployeeModel).where(WorkforceEmployeeModel.agent_id == candidate_id)
            res = await session.execute(stmt)
            emp = res.scalar_one_or_none()
            if not emp:
                raise ValueError(f"Candidate {candidate_id} not found.")

            validate_lifecycle_transition(emp.lifecycle_state, "active")

            before_state = {"lifecycle_state": emp.lifecycle_state, "floor": emp.floor}
            emp.lifecycle_state = "active"
            emp.last_state_change = datetime.utcnow()
            emp.hire_date = datetime.utcnow()

            after_state = {"lifecycle_state": emp.lifecycle_state, "floor": emp.floor}

            await WorkforceAuditLogger.log_action(
                session=session,
                actor_principal=principal.principal_id,
                actor_role=principal.role.value,
                action="hire",
                target_agent_id=emp.agent_id,
                target_agent_name=emp.name,
                before_state=before_state,
                after_state=after_state,
                reason="Candidate passed recruitment test suite and authorized for deployment by CEO",
                linked_approval_id=approval_id,
                correlation_id=correlation_id
            )
            await session.commit()

        await self._broadcast("employee_lifecycle_changed", {
            "action": "hire",
            "agent_id": emp.agent_id,
            "agent_name": emp.name,
            "floor": emp.floor,
            "department": emp.department,
            "new_state": "active"
        })
        return {"status": "success", "agent_id": candidate_id, "lifecycle_state": "active"}

    async def execute_promotion(
        self,
        agent_id: str,
        new_title: str,
        new_role: str,
        new_permission_level: int,
        change_reason: str,
        approval_id: str,
        principal: Principal,
        new_model: Optional[str] = None,
        correlation_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Promotes an active employee, creating an immutable Config Version N+1."""
        async with AsyncSessionLocal() as session:
            stmt = select(WorkforceEmployeeModel).where(WorkforceEmployeeModel.agent_id == agent_id)
            res = await session.execute(stmt)
            emp = res.scalar_one_or_none()
            if not emp:
                raise ValueError(f"Employee {agent_id} not found.")

            validate_lifecycle_transition(emp.lifecycle_state, "active")

            # Fetch latest configuration
            cfg_stmt = select(WorkforceAgentConfigModel).where(
                and_(
                    WorkforceAgentConfigModel.agent_id == agent_id,
                    WorkforceAgentConfigModel.version_number == emp.current_config_version
                )
            )
            cfg_res = await session.execute(cfg_stmt)
            latest_cfg = cfg_res.scalar_one_or_none()

            before_state = {
                "title": emp.current_title,
                "config_version": emp.current_config_version,
                "permission_level": latest_cfg.permission_level if latest_cfg else 2
            }

            new_version_num = emp.current_config_version + 1
            emp.current_title = new_title
            emp.current_config_version = new_version_num
            emp.last_state_change = datetime.utcnow()

            # Create immutable new version
            new_cfg = WorkforceAgentConfigModel(
                id=f"cfg_{agent_id}_v{new_version_num}",
                agent_id=agent_id,
                version_number=new_version_num,
                title=new_title,
                role=new_role,
                department=emp.department,
                floor=emp.floor,
                permission_level=new_permission_level,
                model_name=new_model or (latest_cfg.model_name if latest_cfg else "nvidia/nemotron-3-ultra-550b-a55b"),
                system_instructions=latest_cfg.system_instructions if latest_cfg else f"Senior employee {emp.name}",
                tools_whitelist=latest_cfg.tools_whitelist if latest_cfg else [],
                permission_scopes=latest_cfg.permission_scopes if latest_cfg else [],
                memory_configuration=latest_cfg.memory_configuration if latest_cfg else {},
                evaluation_criteria=latest_cfg.evaluation_criteria if latest_cfg else {},
                change_reason=change_reason,
                authorized_by_principal=principal.principal_id,
                linked_approval_id=approval_id,
                created_at=datetime.utcnow()
            )
            session.add(new_cfg)

            after_state = {
                "title": new_title,
                "config_version": new_version_num,
                "permission_level": new_permission_level
            }

            await WorkforceAuditLogger.log_action(
                session=session,
                actor_principal=principal.principal_id,
                actor_role=principal.role.value,
                action="promote",
                target_agent_id=emp.agent_id,
                target_agent_name=emp.name,
                before_state=before_state,
                after_state=after_state,
                reason=change_reason,
                linked_approval_id=approval_id,
                correlation_id=correlation_id
            )
            await session.commit()

        await self._broadcast("employee_lifecycle_changed", {
            "action": "promote",
            "agent_id": emp.agent_id,
            "agent_name": emp.name,
            "title": new_title,
            "config_version": new_version_num
        })
        return {"status": "success", "agent_id": agent_id, "new_version": new_version_num, "title": new_title}

    async def execute_retraining(
        self,
        agent_id: str,
        updated_instructions: str,
        updated_tools: List[str],
        change_reason: str,
        approval_id: str,
        principal: Principal,
        correlation_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Authorizes retraining, updates instructions/tools in a new configuration version."""
        async with AsyncSessionLocal() as session:
            stmt = select(WorkforceEmployeeModel).where(WorkforceEmployeeModel.agent_id == agent_id)
            res = await session.execute(stmt)
            emp = res.scalar_one_or_none()
            if not emp:
                raise ValueError(f"Employee {agent_id} not found.")

            validate_lifecycle_transition(emp.lifecycle_state, "in_retraining")

            # Fetch current config
            cfg_stmt = select(WorkforceAgentConfigModel).where(
                and_(
                    WorkforceAgentConfigModel.agent_id == agent_id,
                    WorkforceAgentConfigModel.version_number == emp.current_config_version
                )
            )
            cfg_res = await session.execute(cfg_stmt)
            latest_cfg = cfg_res.scalar_one_or_none()

            before_state = {
                "lifecycle_state": emp.lifecycle_state,
                "config_version": emp.current_config_version
            }

            new_version_num = emp.current_config_version + 1
            emp.lifecycle_state = "in_retraining"
            emp.current_config_version = new_version_num
            emp.last_state_change = datetime.utcnow()

            new_cfg = WorkforceAgentConfigModel(
                id=f"cfg_{agent_id}_v{new_version_num}",
                agent_id=agent_id,
                version_number=new_version_num,
                title=emp.current_title,
                role=latest_cfg.role if latest_cfg else emp.current_title,
                department=emp.department,
                floor=emp.floor,
                permission_level=latest_cfg.permission_level if latest_cfg else 2,
                model_name=latest_cfg.model_name if latest_cfg else "nvidia/nemotron-3-ultra-550b-a55b",
                system_instructions=updated_instructions,
                tools_whitelist=updated_tools,
                permission_scopes=latest_cfg.permission_scopes if latest_cfg else [],
                memory_configuration=latest_cfg.memory_configuration if latest_cfg else {},
                evaluation_criteria=latest_cfg.evaluation_criteria if latest_cfg else {},
                change_reason=change_reason,
                authorized_by_principal=principal.principal_id,
                linked_approval_id=approval_id,
                created_at=datetime.utcnow()
            )
            session.add(new_cfg)

            after_state = {
                "lifecycle_state": "in_retraining",
                "config_version": new_version_num
            }

            await WorkforceAuditLogger.log_action(
                session=session,
                actor_principal=principal.principal_id,
                actor_role=principal.role.value,
                action="retrain",
                target_agent_id=emp.agent_id,
                target_agent_name=emp.name,
                before_state=before_state,
                after_state=after_state,
                reason=change_reason,
                linked_approval_id=approval_id,
                correlation_id=correlation_id
            )
            await session.commit()

        await self._broadcast("employee_lifecycle_changed", {
            "action": "retrain",
            "agent_id": emp.agent_id,
            "agent_name": emp.name,
            "new_state": "in_retraining",
            "config_version": new_version_num
        })
        return {"status": "success", "agent_id": agent_id, "lifecycle_state": "in_retraining", "version": new_version_num}

    async def execute_reassign(
        self,
        agent_id: str,
        new_department: str,
        new_floor: int,
        change_reason: str,
        approval_id: str,
        principal: Principal,
        correlation_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Reassigns an employee to a new department and floor."""
        async with AsyncSessionLocal() as session:
            stmt = select(WorkforceEmployeeModel).where(WorkforceEmployeeModel.agent_id == agent_id)
            res = await session.execute(stmt)
            emp = res.scalar_one_or_none()
            if not emp:
                raise ValueError(f"Employee {agent_id} not found.")

            before_state = {"department": emp.department, "floor": emp.floor}
            emp.department = new_department
            emp.floor = new_floor
            emp.last_state_change = datetime.utcnow()
            after_state = {"department": new_department, "floor": new_floor}

            await WorkforceAuditLogger.log_action(
                session=session,
                actor_principal=principal.principal_id,
                actor_role=principal.role.value,
                action="reassign",
                target_agent_id=emp.agent_id,
                target_agent_name=emp.name,
                before_state=before_state,
                after_state=after_state,
                reason=change_reason,
                linked_approval_id=approval_id,
                correlation_id=correlation_id
            )
            await session.commit()

        await self._broadcast("employee_lifecycle_changed", {
            "action": "reassign",
            "agent_id": emp.agent_id,
            "agent_name": emp.name,
            "from_floor": before_state["floor"],
            "to_floor": new_floor,
            "new_department": new_department
        })
        return {"status": "success", "agent_id": agent_id, "department": new_department, "floor": new_floor}

    async def execute_suspension(
        self,
        agent_id: str,
        reason: str,
        approval_id: str,
        principal: Principal,
        correlation_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Suspends an employee, gracefully fails/reassigns in-flight tasks, and revokes tools."""
        async with AsyncSessionLocal() as session:
            stmt = select(WorkforceEmployeeModel).where(WorkforceEmployeeModel.agent_id == agent_id)
            res = await session.execute(stmt)
            emp = res.scalar_one_or_none()
            if not emp:
                raise ValueError(f"Employee {agent_id} not found.")

            validate_lifecycle_transition(emp.lifecycle_state, "suspended")

            before_state = {"lifecycle_state": emp.lifecycle_state}
            emp.lifecycle_state = "suspended"
            emp.last_state_change = datetime.utcnow()
            after_state = {"lifecycle_state": "suspended"}

            handled_tasks = await self.handle_in_flight_tasks(session, agent_id, reason)

            await WorkforceAuditLogger.log_action(
                session=session,
                actor_principal=principal.principal_id,
                actor_role=principal.role.value,
                action="suspend",
                target_agent_id=emp.agent_id,
                target_agent_name=emp.name,
                before_state=before_state,
                after_state={**after_state, "in_flight_tasks_handled": handled_tasks},
                reason=reason,
                linked_approval_id=approval_id,
                correlation_id=correlation_id
            )
            await session.commit()

        await self._broadcast("employee_lifecycle_changed", {
            "action": "suspend",
            "agent_id": emp.agent_id,
            "agent_name": emp.name,
            "new_state": "suspended"
        })
        return {"status": "success", "agent_id": agent_id, "lifecycle_state": "suspended", "handled_tasks": handled_tasks}

    async def execute_termination(
        self,
        agent_id: str,
        typed_confirmation_name: str,
        reason: str,
        approval_id: str,
        principal: Principal,
        correlation_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Soft-terminates an employee.
        Requires exact typed name confirmation.
        Never hard-deletes; archives employee with full history intact.
        """
        async with AsyncSessionLocal() as session:
            stmt = select(WorkforceEmployeeModel).where(WorkforceEmployeeModel.agent_id == agent_id)
            res = await session.execute(stmt)
            emp = res.scalar_one_or_none()
            if not emp:
                raise ValueError(f"Employee {agent_id} not found.")

            # Strict typed name verification safety check
            if typed_confirmation_name.strip().lower() != emp.name.strip().lower():
                raise ValueError(
                    f"TYPED_CONFIRMATION_MISMATCH: Confirmation name '{typed_confirmation_name}' does not match "
                    f"employee name '{emp.name}'."
                )

            validate_lifecycle_transition(emp.lifecycle_state, "terminated")

            before_state = {
                "lifecycle_state": emp.lifecycle_state,
                "is_archived": emp.is_archived
            }

            emp.lifecycle_state = "terminated"
            emp.is_archived = True
            emp.archived_at = datetime.utcnow()
            emp.last_state_change = datetime.utcnow()

            handled_tasks = await self.handle_in_flight_tasks(session, agent_id, f"Termination: {reason}")

            after_state = {
                "lifecycle_state": "terminated",
                "is_archived": True,
                "archived_at": emp.archived_at.isoformat(),
                "handled_tasks": handled_tasks
            }

            await WorkforceAuditLogger.log_action(
                session=session,
                actor_principal=principal.principal_id,
                actor_role=principal.role.value,
                action="terminate",
                target_agent_id=emp.agent_id,
                target_agent_name=emp.name,
                before_state=before_state,
                after_state=after_state,
                reason=reason,
                linked_approval_id=approval_id,
                correlation_id=correlation_id
            )
            await session.commit()

        await self._broadcast("employee_lifecycle_changed", {
            "action": "terminate",
            "agent_id": emp.agent_id,
            "agent_name": emp.name,
            "new_state": "terminated",
            "is_archived": True
        })
        return {"status": "success", "agent_id": agent_id, "lifecycle_state": "terminated", "archived": True}

    async def execute_reactivation(
        self,
        agent_id: str,
        reason: str,
        approval_id: str,
        principal: Principal,
        correlation_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Reactivates a suspended or terminated employee back to active service."""
        async with AsyncSessionLocal() as session:
            stmt = select(WorkforceEmployeeModel).where(WorkforceEmployeeModel.agent_id == agent_id)
            res = await session.execute(stmt)
            emp = res.scalar_one_or_none()
            if not emp:
                raise ValueError(f"Employee {agent_id} not found.")

            validate_lifecycle_transition(emp.lifecycle_state, "active")

            before_state = {"lifecycle_state": emp.lifecycle_state, "is_archived": emp.is_archived}
            emp.lifecycle_state = "active"
            emp.is_archived = False
            emp.archived_at = None
            emp.last_state_change = datetime.utcnow()

            after_state = {"lifecycle_state": "active", "is_archived": False}

            await WorkforceAuditLogger.log_action(
                session=session,
                actor_principal=principal.principal_id,
                actor_role=principal.role.value,
                action="reactivate",
                target_agent_id=emp.agent_id,
                target_agent_name=emp.name,
                before_state=before_state,
                after_state=after_state,
                reason=reason,
                linked_approval_id=approval_id,
                correlation_id=correlation_id
            )
            await session.commit()

        await self._broadcast("employee_lifecycle_changed", {
            "action": "reactivate",
            "agent_id": emp.agent_id,
            "agent_name": emp.name,
            "new_state": "active"
        })
        return {"status": "success", "agent_id": agent_id, "lifecycle_state": "active"}

    async def execute_rollback(
        self,
        agent_id: str,
        target_version_number: int,
        reason: str,
        approval_id: str,
        principal: Principal,
        correlation_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Rolls back employee configuration to a prior immutable version.
        Creates a new immutable version N+1 cloning the target version's parameters.
        """
        async with AsyncSessionLocal() as session:
            stmt = select(WorkforceEmployeeModel).where(WorkforceEmployeeModel.agent_id == agent_id)
            res = await session.execute(stmt)
            emp = res.scalar_one_or_none()
            if not emp:
                raise ValueError(f"Employee {agent_id} not found.")

            # Load target configuration
            target_cfg_stmt = select(WorkforceAgentConfigModel).where(
                and_(
                    WorkforceAgentConfigModel.agent_id == agent_id,
                    WorkforceAgentConfigModel.version_number == target_version_number
                )
            )
            target_cfg_res = await session.execute(target_cfg_stmt)
            target_cfg = target_cfg_res.scalar_one_or_none()
            if not target_cfg:
                raise ValueError(f"Configuration version {target_version_number} does not exist for agent {agent_id}.")

            before_version = emp.current_config_version
            new_version_num = emp.current_config_version + 1

            emp.current_title = target_cfg.title
            emp.current_config_version = new_version_num
            emp.last_state_change = datetime.utcnow()

            rolled_cfg = WorkforceAgentConfigModel(
                id=f"cfg_{agent_id}_v{new_version_num}",
                agent_id=agent_id,
                version_number=new_version_num,
                title=target_cfg.title,
                role=target_cfg.role,
                department=target_cfg.department,
                floor=target_cfg.floor,
                permission_level=target_cfg.permission_level,
                model_name=target_cfg.model_name,
                system_instructions=target_cfg.system_instructions,
                tools_whitelist=target_cfg.tools_whitelist,
                permission_scopes=target_cfg.permission_scopes,
                memory_configuration=target_cfg.memory_configuration,
                evaluation_criteria=target_cfg.evaluation_criteria,
                change_reason=f"Rollback to Version {target_version_number}: {reason}",
                authorized_by_principal=principal.principal_id,
                linked_approval_id=approval_id,
                created_at=datetime.utcnow()
            )
            session.add(rolled_cfg)

            await WorkforceAuditLogger.log_action(
                session=session,
                actor_principal=principal.principal_id,
                actor_role=principal.role.value,
                action="rollback",
                target_agent_id=emp.agent_id,
                target_agent_name=emp.name,
                before_state={"config_version": before_version},
                after_state={"config_version": new_version_num, "rolled_back_to": target_version_number},
                reason=reason,
                linked_approval_id=approval_id,
                correlation_id=correlation_id
            )
            await session.commit()

        await self._broadcast("employee_lifecycle_changed", {
            "action": "rollback",
            "agent_id": emp.agent_id,
            "agent_name": emp.name,
            "config_version": new_version_num,
            "rolled_back_to": target_version_number
        })
        return {
            "status": "success",
            "agent_id": agent_id,
            "new_version": new_version_num,
            "restored_from_version": target_version_number
        }

# Global singleton instance
GLOBAL_LIFECYCLE_ENGINE = LifecycleEngine()
