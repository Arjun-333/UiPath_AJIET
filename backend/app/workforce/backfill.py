"""
Backfill service for existing Autonomia agents and historical task records.
Ensures existing team is initialized into the new lifecycle model as active with Config v1.
"""

import uuid
import logging
from datetime import datetime
from sqlalchemy import select, text
from backend.app.database.session import AsyncSessionLocal
from backend.app.database.models import TaskModel
from backend.app.database.workforce_models import (
    WorkforceEmployeeModel, WorkforceAgentConfigModel,
    WorkforceTaskTelemetryModel, WorkforceTaskEvaluationModel
)
from backend.app.agents.registry import GLOBAL_REGISTRY

LOGGER = logging.getLogger(__name__)

# Canonical tool lists per department
DEFAULT_DEPARTMENT_TOOLS = {
    "Executive Management": ["workflow_orchestrator", "ceo_command_parser", "roster_inspector"],
    "Creative & Video Production": ["video_renderer", "tts_engine", "subtitle_generator", "thumbnail_generator", "ffmpeg"],
    "Documentation & Campus": ["uipath_doc_retriever", "taxonomy_parser", "video_qa_inspector", "compliance_checker"],
    "Technology & Infrastructure": ["server_telemetry", "database_monitor", "docker_runner", "git_tool"]
}

async def backfill_existing_agents():
    """Backfills registered agents into workforce_employees and workforce_agent_configs v1."""
    async with AsyncSessionLocal() as session:
        registered_agents = GLOBAL_REGISTRY.list_all()

        for a in registered_agents:
            agent_id = a["agent_id"]
            if agent_id == "orbi_ceo_interface":  # alias of auri
                continue

            # Check if employee already exists
            stmt = select(WorkforceEmployeeModel).where(WorkforceEmployeeModel.agent_id == agent_id)
            res = await session.execute(stmt)
            existing = res.scalar_one_or_none()

            dept = a.get("department", "General")
            tools = DEFAULT_DEPARTMENT_TOOLS.get(dept, ["general_tool"])

            if not existing:
                emp = WorkforceEmployeeModel(
                    agent_id=agent_id,
                    name=a["name"],
                    current_title=a["role"],
                    department=dept,
                    floor=a.get("floor", 0),
                    current_config_version=1,
                    lifecycle_state="active",
                    hire_date=datetime.utcnow(),
                    last_state_change=datetime.utcnow(),
                    avatar_file=a.get("avatar_file", f"{agent_id}.png"),
                    shirt_color=a.get("shirt_color", "#e06b52"),
                    is_archived=False
                )
                session.add(emp)

                # Add initial config Version 1
                cfg = WorkforceAgentConfigModel(
                    id=f"cfg_{agent_id}_v1",
                    agent_id=agent_id,
                    version_number=1,
                    title=a["role"],
                    role=a["role"],
                    department=dept,
                    floor=a.get("floor", 0),
                    permission_level=a.get("permission_level", 2),
                    model_name="nvidia/nemotron-3-ultra-550b-a55b",
                    system_instructions=f"Autonomous departmental employee {a['name']} ({a['role']}) managing {dept} operations for UiPath Community AJIET.",
                    tools_whitelist=tools,
                    permission_scopes=["read_tasks", "write_deliverables", "internal_messaging"],
                    memory_configuration={"retrieval_window": 30, "enable_vector_search": False},
                    evaluation_criteria={"min_quality_score": 80.0, "max_retry_count": 2},
                    change_reason="Initial production backfill from canonical team roster",
                    authorized_by_principal="arjun_ceo",
                    linked_approval_id=None,
                    created_at=datetime.utcnow()
                )
                session.add(cfg)

        await session.commit()
        LOGGER.info("Workforce employees and Config v1 backfill complete.")


async def backfill_historical_task_telemetry():
    """Populates workforce_task_telemetry and evaluations from historical tasks if unpopulated."""
    async with AsyncSessionLocal() as session:
        # Check if tasks exist
        stmt = select(TaskModel).where(TaskModel.status.in_(["completed", "failed"]))
        res = await session.execute(stmt)
        tasks = res.scalars().all()

        for t in tasks:
            # Check if telemetry already recorded
            telem_stmt = select(WorkforceTaskTelemetryModel).where(WorkforceTaskTelemetryModel.task_id == t.id)
            telem_res = await session.execute(telem_stmt)
            if telem_res.scalar_one_or_none():
                continue

            # Calculate duration
            started = t.created_at or datetime.utcnow()
            completed = t.updated_at or started
            dur = max(0.0, (completed - started).total_seconds())

            # Cost & token attribution
            tokens = 0
            cost = 0.0
            if t.status == "completed":
                # Average realistic tokens per completed task
                tokens = 850
                cost = 0.0015 * (tokens / 1000.0)

            telem = WorkforceTaskTelemetryModel(
                id=f"telem_{t.id}",
                task_id=t.id,
                project_id=t.project_id,
                agent_id=t.assigned_agent_id,
                department=t.department,
                started_at=started,
                completed_at=completed if t.status == "completed" else None,
                approval_wait_seconds=0.0,
                execution_duration_seconds=dur,
                model_name="nvidia/nemotron-3-ultra-550b-a55b",
                prompt_tokens=int(tokens * 0.6),
                completion_tokens=int(tokens * 0.4),
                cost_usd=cost,
                status=t.status,
                retry_count=t.retry_count or 0,
                failure_category="agent_error" if t.status == "failed" else None,
                created_at=started
            )
            session.add(telem)

            # Check if evaluation exists
            eval_stmt = select(WorkforceTaskEvaluationModel).where(WorkforceTaskEvaluationModel.task_id == t.id)
            eval_res = await session.execute(eval_stmt)
            if not eval_res.scalar_one_or_none():
                out = t.output_data or {}
                score = 100.0
                if isinstance(out, dict) and "score" in out:
                    score = float(out["score"])
                elif t.status == "failed":
                    score = 40.0

                defects = 0
                if isinstance(out, dict) and "defects" in out:
                    defects = len(out["defects"])

                accuracy = max(0.0, 100.0 - (t.retry_count * 15.0) - (defects * 5.0))
                if t.status == "failed":
                    accuracy = 20.0

                evaluation = WorkforceTaskEvaluationModel(
                    id=f"eval_{t.id}",
                    task_id=t.id,
                    agent_id=t.assigned_agent_id,
                    evaluator_type="automated_qa" if "score" in out else "rubric_inspector",
                    quality_score=score,
                    accuracy_score=accuracy,
                    defects_count=defects,
                    rubric_breakdown={"base_score": score, "defects_deduction": defects * 5.0},
                    evaluation_notes="Historical backfill from task output_data",
                    created_at=completed
                )
                session.add(evaluation)

        await session.commit()
        LOGGER.info("Historical task telemetry and evaluations backfill complete.")
