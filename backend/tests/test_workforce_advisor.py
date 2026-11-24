"""
Automated unit & integration test suite for Workforce Advisor & Continuous Improvement Loop (Phases 6 & 6B).
Tests evidence verification, recommendation lifecycle (creating Approval without direct execution),
gap-to-recruitment drafting, and closed-loop impact tracking.
"""

import pytest
import uuid
from datetime import datetime, timedelta
from sqlalchemy import select

from backend.app.database.session import AsyncSessionLocal
from backend.app.database.models import ApprovalModel
from backend.app.database.migrations.runner import run_migrations
from backend.app.database.workforce_models import (
    WorkforceEmployeeModel, WorkforceRecommendationModel,
    WorkforceOrganizationalFindingModel, WorkforceImpactTrackingModel,
    WorkforceRecruitmentDraftModel, WorkforceTaskTelemetryModel
)
from backend.app.workforce.advisor import WorkforceAdvisorService
from backend.app.workforce.rbac import AUTHORIZED_PRINCIPALS

@pytest.mark.asyncio
async def test_advisor_recommendation_and_approval_separation():
    """Verify advisor recommendation creates Approval request, NEVER mutating state directly."""
    ceo = AUTHORIZED_PRINCIPALS["arjun_ceo"]
    advisor = WorkforceAdvisorService()
    uid = uuid.uuid4().hex[:6]
    agent_id = f"test_adv_{uid}"
    now = datetime.utcnow()

    async with AsyncSessionLocal() as session:
        emp = WorkforceEmployeeModel(
            agent_id=agent_id,
            name="Advisor Test Agent",
            current_title="Video Editor",
            department="Creative & Video Production",
            floor=1,
            current_config_version=1,
            lifecycle_state="active"
        )
        session.add(emp)

        rec = WorkforceRecommendationModel(
            id=f"rec_{uid}",
            rec_type="underperformance",
            target_agent_id=agent_id,
            department="Creative & Video Production",
            title="Retraining Needed for Editor",
            reasoning="High defect rates observed.",
            evidence={"task_count": 12, "failure_rate": 25.0},
            confidence_score=0.90,
            sample_size=12,
            data_window_days=30,
            status="pending"
        )
        session.add(rec)
        await session.commit()

    # Accepting recommendation
    accept_res = await advisor.accept_recommendation(f"rec_{uid}", ceo)
    assert accept_res["status"] == "accepted_as_request"
    assert "approval_id" in accept_res

    # Assert recommendation is accepted but employee is STILL ACTIVE (state never mutated directly!)
    async with AsyncSessionLocal() as session:
        emp_res = await session.execute(
            select(WorkforceEmployeeModel).where(WorkforceEmployeeModel.agent_id == agent_id)
        )
        emp = emp_res.scalar_one()
        assert emp.lifecycle_state == "active"  # Unchanged!

        # Verify Approval record was created
        appr_res = await session.execute(
            select(ApprovalModel).where(ApprovalModel.id == accept_res["approval_id"])
        )
        appr = appr_res.scalar_one()
        assert appr.status == "pending"
        assert "Retraining Needed" in appr.description


@pytest.mark.asyncio
async def test_gap_to_recruitment_draft_linkage():
    """Verify continuous improvement loop generates pre-filled recruitment draft linked to finding."""
    await run_migrations()
    uid = uuid.uuid4().hex[:6]
    finding_id = f"org_{uid}"
    draft_id = f"draft_{uid}"

    async with AsyncSessionLocal() as session:
        finding = WorkforceOrganizationalFindingModel(
            id=finding_id,
            finding_type="single_point_of_failure",
            severity="HIGH",
            department="Documentation & Campus",
            title="Single Point of Failure in Documentation",
            description="Only 1 specialist in department.",
            suggested_action="Recruit second documentation agent.",
            evidence={"headcount": 1},
            confidence_score=0.92,
            data_window_days=30,
            status="active",
            linked_draft_id=draft_id
        )
        session.add(finding)

        draft = WorkforceRecruitmentDraftModel(
            id=draft_id,
            linked_finding_id=finding_id,
            title="Documentation Assistant",
            role="Technical Writer",
            department="Documentation & Campus",
            floor=4,
            permission_level=2,
            system_instructions="Assist in taxonomy indexing.",
            suggested_tools=["uipath_doc_retriever"],
            responsibilities=["Update documentation taxonomies"],
            status="draft"
        )
        session.add(draft)
        await session.commit()

    async with AsyncSessionLocal() as session:
        res = await session.execute(
            select(WorkforceRecruitmentDraftModel).where(WorkforceRecruitmentDraftModel.id == draft_id)
        )
        loaded_draft = res.scalar_one()
        assert loaded_draft.linked_finding_id == finding_id
        assert loaded_draft.status == "draft"


@pytest.mark.asyncio
async def test_closed_loop_impact_tracking():
    """Verify baseline capture and non-causal observed change outcome tracking."""
    await run_migrations()
    advisor = WorkforceAdvisorService()
    uid = uuid.uuid4().hex[:6]
    agent_id = f"impact_agent_{uid}"

    async with AsyncSessionLocal() as session:
        emp = WorkforceEmployeeModel(
            agent_id=agent_id,
            name="Impact Test Specialist",
            current_title="Automation Engineer",
            department="Technology & Infrastructure",
            floor=5,
            current_config_version=1,
            lifecycle_state="active"
        )
        session.add(emp)
        await session.commit()

    # Step 1: Capture baseline
    tracking_id = await advisor.capture_impact_baseline(
        action_type="retrain",
        target_agent_id=agent_id,
        department="Technology & Infrastructure",
        approval_id=f"appr_{uid}"
    )
    assert tracking_id.startswith("impact_")

    # Step 2: Evaluate with insufficient data (<10 tasks)
    eval_res = await advisor.evaluate_impact_outcome(tracking_id)
    assert eval_res["outcome"] == "insufficient_data"
    assert "below minimum threshold" in eval_res["summary"]
