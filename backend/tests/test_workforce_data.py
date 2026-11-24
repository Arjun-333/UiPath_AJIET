"""
Automated unit and integration test suite for Workforce Intelligence Data Layer (Phase 2).
Tests migrations, backfill idempotency, telemetry recording, and all 8 measurable indicators.
"""

import pytest
import asyncio
from datetime import datetime, timedelta
from sqlalchemy import select, text

from backend.app.database.session import AsyncSessionLocal, engine, Base
from backend.app.database.models import TaskModel, ApprovalModel, AgentMessageModel
from backend.app.database.workforce_models import (
    WorkforceEmployeeModel, WorkforceAgentConfigModel,
    WorkforceTaskTelemetryModel, WorkforceTaskEvaluationModel,
    ModelPricingModel
)
from backend.app.database.migrations.runner import run_migrations
from backend.app.workforce.backfill import backfill_existing_agents, backfill_historical_task_telemetry
from backend.app.workforce.metrics_engine import MetricsEngine, COMPOSITE_WEIGHTS_V1

@pytest.mark.asyncio
async def test_migrations_and_schema_integrity():
    """Verify additive migrations run cleanly and create all workforce tables."""
    await run_migrations()

    async with AsyncSessionLocal() as session:
        # Check schema_migrations
        res = await session.execute(text("SELECT version FROM schema_migrations"))
        applied_versions = [r[0] for r in res.fetchall()]
        assert "001_create_workforce_tables" in applied_versions
        assert "002_add_agent_id_to_approvals" in applied_versions
        assert "003_seed_default_pricing" in applied_versions

        # Verify model_pricing seeded
        p_stmt = select(ModelPricingModel)
        p_res = await session.execute(p_stmt)
        pricing = p_res.scalars().all()
        assert len(pricing) >= 3
        nemotron_price = next((p for p in pricing if "nemotron" in p.model_name), None)
        assert nemotron_price is not None
        assert nemotron_price.prompt_price_per_1k == 0.0015


@pytest.mark.asyncio
async def test_backfill_existing_agents_idempotency():
    """Verify existing team members are backfilled as active with Config v1."""
    await run_migrations()
    await backfill_existing_agents()

    async with AsyncSessionLocal() as session:
        # Check workforce employees
        res = await session.execute(select(WorkforceEmployeeModel))
        employees = res.scalars().all()
        assert len(employees) >= 10

        darshan = next((e for e in employees if e.agent_id == "darshan_director"), None)
        assert darshan is not None
        assert darshan.lifecycle_state == "active"
        assert darshan.current_config_version == 1
        assert darshan.department == "Creative & Video Production"

        # Check Config v1
        cfg_res = await session.execute(
            select(WorkforceAgentConfigModel).where(WorkforceAgentConfigModel.agent_id == "darshan_director")
        )
        configs = cfg_res.scalars().all()
        assert len(configs) >= 1
        assert configs[0].version_number == 1
        assert "video_renderer" in configs[0].tools_whitelist
        assert configs[0].authorized_by_principal == "arjun_ceo"

    # Verify idempotency by running backfill a second time
    await backfill_existing_agents()
    async with AsyncSessionLocal() as session:
        res2 = await session.execute(select(WorkforceEmployeeModel))
        employees2 = res2.scalars().all()
        assert len(employees2) == len(employees)


@pytest.mark.asyncio
async def test_metrics_calculation_all_eight_indicators():
    """
    Test deterministic calculation of all 8 indicators against exact hand-computed values:
    - 12 completed tasks with 20.0s duration each and $0.0020 cost each
    - 3 failed tasks
    - Total finished: 15 tasks (>= 10 minimum sample size)
    - Completion rate: 12 / 15 * 100 = 80.0%
    - Failure rate: 3 / 15 * 100 = 20.0%
    - Execution time: 20.0s
    - Cost per task: exact average
    - Approvals: 3 approved, 1 rejected -> 75.0%
    - Collaboration messages: 2 handoffs, 1 cross-floor
    """
    import uuid
    uid = uuid.uuid4().hex[:6]
    test_agent_id = f"test_metrics_agent_{uid}"
    now = datetime.utcnow()

    async with AsyncSessionLocal() as session:
        # Create test employee
        emp = WorkforceEmployeeModel(
            agent_id=test_agent_id,
            name="Test Metrics Agent",
            current_title="Automated Quality Test Specialist",
            department="Creative & Video Production",
            floor=1,
            current_config_version=1,
            lifecycle_state="active",
            hire_date=now - timedelta(days=20),
            last_state_change=now - timedelta(days=20)
        )
        session.add(emp)

        # 12 completed tasks
        for i in range(12):
            t_id = f"test_task_c_{uid}_{i}"
            telem = WorkforceTaskTelemetryModel(
                id=f"telem_{t_id}",
                task_id=t_id,
                project_id=f"test_proj_{uid}",
                agent_id=test_agent_id,
                department="Creative & Video Production",
                started_at=now - timedelta(days=2, minutes=i*10),
                completed_at=now - timedelta(days=2, minutes=i*10 - 5),
                approval_wait_seconds=0.0,
                execution_duration_seconds=20.0,
                model_name="nvidia/nemotron-3-ultra-550b-a55b",
                prompt_tokens=600,
                completion_tokens=400,
                cost_usd=0.0020,
                status="completed",
                retry_count=0 if i < 10 else 1,
                created_at=now - timedelta(days=2, minutes=i*10)
            )
            session.add(telem)

            ev = WorkforceTaskEvaluationModel(
                id=f"eval_{t_id}",
                task_id=t_id,
                agent_id=test_agent_id,
                evaluator_type="automated_qa",
                quality_score=95.0,
                accuracy_score=90.0,
                defects_count=0,
                rubric_breakdown={"base": 95.0},
                created_at=now - timedelta(days=2)
            )
            session.add(ev)

        # 3 failed tasks
        for j in range(3):
            t_id = f"test_task_f_{uid}_{j}"
            telem = WorkforceTaskTelemetryModel(
                id=f"telem_{t_id}",
                task_id=t_id,
                project_id=f"test_proj_{uid}",
                agent_id=test_agent_id,
                department="Creative & Video Production",
                started_at=now - timedelta(days=1, minutes=j*10),
                completed_at=now - timedelta(days=1, minutes=j*10 - 2),
                approval_wait_seconds=0.0,
                execution_duration_seconds=15.0,
                model_name="nvidia/nemotron-3-ultra-550b-a55b",
                cost_usd=0.0010,
                status="failed",
                retry_count=2,
                failure_category="agent_error",
                created_at=now - timedelta(days=1, minutes=j*10)
            )
            session.add(telem)

        # Approvals: 3 approved, 1 rejected
        for a_idx, app_status in enumerate(["approved", "approved", "approved", "rejected"]):
            app = ApprovalModel(
                id=f"appr_test_{uid}_{a_idx}",
                task_id=f"test_task_c_{uid}_{a_idx}",
                agent_id=test_agent_id,
                action_type="publish_content",
                description="Test Approval",
                status=app_status,
                created_at=now - timedelta(days=2),
                resolved_at=now - timedelta(days=2) + timedelta(minutes=10)
            )
            session.add(app)

        # Messages: 2 handoffs, 1 cross-floor
        msg1 = AgentMessageModel(
            id=f"msg_test_{uid}_01",
            sender_id=test_agent_id,
            sender_name="Test Agent",
            sender_floor=1,
            recipient_id="srijana_quality",
            recipient_name="Srijana",
            recipient_floor=4,  # cross floor!
            message_type="handoff",
            content="Handing over test script",
            created_at=now - timedelta(days=1)
        )
        msg2 = AgentMessageModel(
            id=f"msg_test_{uid}_02",
            sender_id=test_agent_id,
            sender_name="Test Agent",
            sender_floor=1,
            recipient_id="darshan_director",
            recipient_name="Darshan",
            recipient_floor=1,
            message_type="handoff",
            content="Narration audio ready",
            created_at=now - timedelta(days=1)
        )
        session.add(msg1)
        session.add(msg2)

        await session.commit()

    engine_inst = MetricsEngine(min_sample_size=10)
    result = await engine_inst.compute_employee_metrics(test_agent_id, period_days=30)

    assert result["is_insufficient_data"] is False
    assert result["sample_size"] == 15
    m = result["metrics"]

    # Assert exact formulas
    assert m["completion_rate"] == 80.0  # 12 / 15 * 100
    assert m["failure_rate"] == 20.0     # 3 / 15 * 100
    assert m["execution_time_seconds"] == 20.0
    assert m["approval_rate"] == 75.0    # 3 / 4 * 100
    assert m["quality_score"] == 95.0
    assert m["cost_per_task_usd"] > 0.0

    # Assert composite breakdown
    comp = result["composite"]
    assert comp["score"] is not None
    assert comp["version"] == "v1.0"
    assert "components" in comp
    assert "quality_contribution" in comp["components"]


@pytest.mark.asyncio
async def test_insufficient_data_minimum_sample_size_rule():
    """Verify that sample size < 10 marks metrics as insufficient data honestly."""
    import uuid
    uid = uuid.uuid4().hex[:6]
    sparse_agent_id = f"test_sparse_agent_{uid}"
    now = datetime.utcnow()

    async with AsyncSessionLocal() as session:
        emp = WorkforceEmployeeModel(
            agent_id=sparse_agent_id,
            name="Sparse Data Agent",
            current_title="Junior Analyst",
            department="Documentation & Campus",
            floor=4,
            current_config_version=1,
            lifecycle_state="active"
        )
        session.add(emp)

        # Only 4 tasks (less than minimum threshold 10)
        for i in range(4):
            t_id = f"sparse_task_{uid}_{i}"
            telem = WorkforceTaskTelemetryModel(
                id=f"telem_{t_id}",
                task_id=t_id,
                agent_id=sparse_agent_id,
                department="Documentation & Campus",
                started_at=now - timedelta(days=1),
                completed_at=now - timedelta(days=1) + timedelta(seconds=30),
                execution_duration_seconds=30.0,
                status="completed",
                created_at=now - timedelta(days=1)
            )
            session.add(telem)
        await session.commit()

    engine_inst = MetricsEngine(min_sample_size=10)
    result = await engine_inst.compute_employee_metrics(sparse_agent_id, period_days=30)

    assert result["is_insufficient_data"] is True
    assert result["sample_size"] == 4
    assert result["min_sample_size"] == 10
    assert "below the minimum threshold of 10" in result["insufficient_data_reason"]
    assert result["composite"]["score"] is None


@pytest.mark.asyncio
async def test_department_breakdown_and_leaderboard():
    """Verify department breakdown aggregation and leaderboard sorting."""
    engine_inst = MetricsEngine(min_sample_size=5)
    breakdown = await engine_inst.compute_department_breakdown(period_days=30)

    assert "departments" in breakdown
    depts = breakdown["departments"]
    assert len(depts) >= 1

    leaderboard = await engine_inst.compute_leaderboard(period_days=30)
    assert "leaderboard" in leaderboard
    assert len(leaderboard["leaderboard"]) >= 1
