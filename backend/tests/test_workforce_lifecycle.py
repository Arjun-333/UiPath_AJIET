"""
Automated unit & integration test suite for Workforce Lifecycle Engine & RBAC (Phase 3).
Tests state machine transitions, server-side RBAC guard, immutable audit logger,
typed termination confirmation, in-flight task safety, and configuration rollback.
"""

import pytest
import uuid
from datetime import datetime
from fastapi import HTTPException
from sqlalchemy import select

from backend.app.database.session import AsyncSessionLocal
from backend.app.database.models import TaskModel, ApprovalModel
from backend.app.database.workforce_models import (
    WorkforceEmployeeModel, WorkforceAgentConfigModel,
    WorkforceAuditLogModel
)
from backend.app.workforce.state_machine import (
    validate_lifecycle_transition, IllegalLifecycleTransitionError,
    ALLOWED_TRANSITIONS
)
from backend.app.workforce.rbac import (
    Role, Principal, require_ceo, require_department_head_or_ceo,
    AUTHORIZED_PRINCIPALS
)
from backend.app.workforce.lifecycle_engine import LifecycleEngine

def test_state_machine_allowed_and_illegal_transitions():
    """Verify all allowed transitions succeed and all illegal transitions raise error."""
    # Test all allowed transitions
    for src, targets in ALLOWED_TRANSITIONS.items():
        for target in targets:
            assert validate_lifecycle_transition(src, target) is True

    # Test illegal transitions
    illegal_cases = [
        ("candidate", "terminated"),
        ("candidate", "active"),       # must pass in_testing first
        ("candidate", "suspended"),
        ("suspended", "in_retraining"),
        ("terminated", "in_retraining"),
        ("terminated", "suspended")
    ]
    for src, target in illegal_cases:
        with pytest.raises(IllegalLifecycleTransitionError) as excinfo:
            validate_lifecycle_transition(src, target)
        assert "ILLEGAL_LIFECYCLE_TRANSITION" in str(excinfo.value)


def test_rbac_server_side_enforcement():
    """Verify non-CEO and AI agent principals are rejected server-side for consequential actions."""
    ceo_principal = AUTHORIZED_PRINCIPALS["arjun_ceo"]
    assert require_ceo(ceo_principal) == ceo_principal

    coo_principal = AUTHORIZED_PRINCIPALS["coo_marcus"]
    with pytest.raises(HTTPException) as excinfo:
        require_ceo(coo_principal)
    assert excinfo.value.status_code == 403
    assert "FORBIDDEN: Consequential workforce actions" in excinfo.value.detail

    advisor_principal = AUTHORIZED_PRINCIPALS["workforce_advisor"]
    with pytest.raises(HTTPException) as excinfo_adv:
        require_ceo(advisor_principal)
    assert excinfo_adv.value.status_code == 403

    # Department head permissions
    assert require_department_head_or_ceo(coo_principal) == coo_principal
    assert require_department_head_or_ceo(ceo_principal) == ceo_principal
    with pytest.raises(HTTPException):
        require_department_head_or_ceo(advisor_principal)


@pytest.mark.asyncio
async def test_promotion_and_immutable_config_versioning():
    """Verify promotion increments version, saves new config version, and logs audit."""
    uid = uuid.uuid4().hex[:6]
    agent_id = f"test_promo_{uid}"
    now = datetime.utcnow()

    async with AsyncSessionLocal() as session:
        emp = WorkforceEmployeeModel(
            agent_id=agent_id,
            name="Promotion Candidate",
            current_title="Junior Scriptwriter",
            department="Creative & Video Production",
            floor=1,
            current_config_version=1,
            lifecycle_state="active",
            hire_date=now,
            last_state_change=now
        )
        session.add(emp)

        cfg1 = WorkforceAgentConfigModel(
            id=f"cfg_{agent_id}_v1",
            agent_id=agent_id,
            version_number=1,
            title="Junior Scriptwriter",
            role="Scriptwriter",
            department="Creative & Video Production",
            floor=1,
            permission_level=2,
            model_name="nvidia/nemotron-3-ultra-550b-a55b",
            system_instructions="Draft initial outlines.",
            tools_whitelist=["script_editor"],
            permission_scopes=["write_scripts"],
            change_reason="Initial setup",
            authorized_by_principal="arjun_ceo",
            created_at=now
        )
        session.add(cfg1)
        await session.commit()

    engine = LifecycleEngine()
    ceo = AUTHORIZED_PRINCIPALS["arjun_ceo"]
    promo_result = await engine.execute_promotion(
        agent_id=agent_id,
        new_title="Senior Lead Scriptwriter",
        new_role="Lead Scriptwriter",
        new_permission_level=3,
        change_reason="Demonstrated outstanding output quality and high CTR narrative scripts.",
        approval_id=f"appr_{uid}",
        principal=ceo
    )

    assert promo_result["status"] == "success"
    assert promo_result["new_version"] == 2
    assert promo_result["title"] == "Senior Lead Scriptwriter"

    async with AsyncSessionLocal() as session:
        # Check employee updated
        res = await session.execute(
            select(WorkforceEmployeeModel).where(WorkforceEmployeeModel.agent_id == agent_id)
        )
        updated_emp = res.scalar_one()
        assert updated_emp.current_title == "Senior Lead Scriptwriter"
        assert updated_emp.current_config_version == 2

        # Check immutable config record v2 created
        res_cfg = await session.execute(
            select(WorkforceAgentConfigModel).where(
                WorkforceAgentConfigModel.agent_id == agent_id,
                WorkforceAgentConfigModel.version_number == 2
            )
        )
        v2_cfg = res_cfg.scalar_one()
        assert v2_cfg.title == "Senior Lead Scriptwriter"
        assert v2_cfg.permission_level == 3

        # Check audit entry created
        audit_res = await session.execute(
            select(WorkforceAuditLogModel).where(WorkforceAuditLogModel.target_agent_id == agent_id)
        )
        audit_logs = audit_res.scalars().all()
        assert len(audit_logs) >= 1
        assert audit_logs[0].action == "promote"
        assert audit_logs[0].actor_principal == "arjun_ceo"


@pytest.mark.asyncio
async def test_typed_termination_confirmation_and_soft_delete():
    """Verify termination requires exact typed name confirmation and NEVER hard deletes."""
    uid = uuid.uuid4().hex[:6]
    agent_id = f"test_term_{uid}"
    employee_name = f"Darshan Specialist {uid}"
    now = datetime.utcnow()

    async with AsyncSessionLocal() as session:
        emp = WorkforceEmployeeModel(
            agent_id=agent_id,
            name=employee_name,
            current_title="Video Compositor",
            department="Creative & Video Production",
            floor=1,
            current_config_version=1,
            lifecycle_state="active",
            hire_date=now,
            last_state_change=now
        )
        session.add(emp)

        # In-flight task
        task = TaskModel(
            id=f"task_inflight_{uid}",
            title="In-flight Render Task",
            department="Creative & Video Production",
            assigned_agent_id=agent_id,
            status="in_progress"
        )
        session.add(task)
        await session.commit()

    engine = LifecycleEngine()
    ceo = AUTHORIZED_PRINCIPALS["arjun_ceo"]

    # 1. Attempt termination with mismatched name -> MUST FAIL
    with pytest.raises(ValueError) as excinfo:
        await engine.execute_termination(
            agent_id=agent_id,
            typed_confirmation_name="Wrong Name",
            reason="Downsizing department",
            approval_id=f"appr_{uid}",
            principal=ceo
        )
    assert "TYPED_CONFIRMATION_MISMATCH" in str(excinfo.value)

    # 2. Attempt with exact matching name -> MUST SUCCEED
    term_res = await engine.execute_termination(
        agent_id=agent_id,
        typed_confirmation_name=employee_name,
        reason="Redundant capability after automated pipeline upgrade",
        approval_id=f"appr_{uid}",
        principal=ceo
    )
    assert term_res["status"] == "success"
    assert term_res["lifecycle_state"] == "terminated"
    assert term_res["archived"] is True

    # 3. Verify Soft-Delete Invariant: Employee row STILL EXISTS in database
    async with AsyncSessionLocal() as session:
        res = await session.execute(
            select(WorkforceEmployeeModel).where(WorkforceEmployeeModel.agent_id == agent_id)
        )
        archived_emp = res.scalar_one_or_none()
        assert archived_emp is not None
        assert archived_emp.lifecycle_state == "terminated"
        assert archived_emp.is_archived is True
        assert archived_emp.archived_at is not None

        # Verify in-flight task was gracefully failed (not silently dropped)
        task_res = await session.execute(
            select(TaskModel).where(TaskModel.id == f"task_inflight_{uid}")
        )
        inflight_task = task_res.scalar_one()
        assert inflight_task.status == "failed"
        assert "Assigned employee was suspended/terminated" in inflight_task.error_message


@pytest.mark.asyncio
async def test_configuration_rollback():
    """Verify rollback restores previous configuration version as a new version N+1."""
    uid = uuid.uuid4().hex[:6]
    agent_id = f"test_rollback_{uid}"
    now = datetime.utcnow()

    async with AsyncSessionLocal() as session:
        emp = WorkforceEmployeeModel(
            agent_id=agent_id,
            name="Rollback Test Agent",
            current_title="Experimental Version 2 Title",
            department="Technology & Infrastructure",
            floor=5,
            current_config_version=2,
            lifecycle_state="active"
        )
        session.add(emp)

        # Config Version 1 (Stable)
        cfg1 = WorkforceAgentConfigModel(
            id=f"cfg_{agent_id}_v1",
            agent_id=agent_id,
            version_number=1,
            title="Stable DevOps Engineer",
            role="DevOps",
            department="Technology & Infrastructure",
            floor=5,
            permission_level=2,
            model_name="nvidia/nemotron-3-ultra-550b-a55b",
            system_instructions="Strict stable infrastructure protocols.",
            tools_whitelist=["docker", "git"],
            change_reason="Initial stable version",
            authorized_by_principal="arjun_ceo",
            created_at=now
        )
        session.add(cfg1)

        # Config Version 2 (Buggy experimental)
        cfg2 = WorkforceAgentConfigModel(
            id=f"cfg_{agent_id}_v2",
            agent_id=agent_id,
            version_number=2,
            title="Experimental Version 2 Title",
            role="DevOps",
            department="Technology & Infrastructure",
            floor=5,
            permission_level=3,
            model_name="experimental-beta",
            system_instructions="Aggressive fast deploy.",
            tools_whitelist=["docker", "git", "danger_root"],
            change_reason="Experimental release",
            authorized_by_principal="arjun_ceo",
            created_at=now
        )
        session.add(cfg2)
        await session.commit()

    engine = LifecycleEngine()
    ceo = AUTHORIZED_PRINCIPALS["arjun_ceo"]

    rollback_res = await engine.execute_rollback(
        agent_id=agent_id,
        target_version_number=1,
        reason="Experimental version 2 caused high defect rates. Restoring verified v1 config.",
        approval_id=f"appr_{uid}",
        principal=ceo
    )

    assert rollback_res["status"] == "success"
    assert rollback_res["new_version"] == 3
    assert rollback_res["restored_from_version"] == 1

    async with AsyncSessionLocal() as session:
        res = await session.execute(
            select(WorkforceEmployeeModel).where(WorkforceEmployeeModel.agent_id == agent_id)
        )
        emp = res.scalar_one()
        assert emp.current_config_version == 3
        assert emp.current_title == "Stable DevOps Engineer"

        # Check config version 3
        v3_res = await session.execute(
            select(WorkforceAgentConfigModel).where(
                WorkforceAgentConfigModel.agent_id == agent_id,
                WorkforceAgentConfigModel.version_number == 3
            )
        )
        v3 = v3_res.scalar_one()
        assert v3.title == "Stable DevOps Engineer"
        assert v3.tools_whitelist == ["docker", "git"]
        assert "Rollback to Version 1" in v3.change_reason
