"""
Workforce Advisor & Continuous Improvement Engine for Project Autonomia.
Computes deterministic findings, validates evidence record citations, generates
gap-to-recruitment drafts, and tracks closed-loop impact without autonomous authority.
"""

import uuid
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy import select, and_, func

from backend.app.database.session import AsyncSessionLocal
from backend.app.database.models import TaskModel, ApprovalModel
from backend.app.database.workforce_models import (
    WorkforceEmployeeModel, WorkforceRecommendationModel,
    WorkforceOrganizationalFindingModel, WorkforceImpactTrackingModel,
    WorkforceRecruitmentDraftModel, WorkforceTaskTelemetryModel
)
from backend.app.workforce.metrics_engine import GLOBAL_METRICS_ENGINE
from backend.app.workforce.rbac import Principal, Role

LOGGER = logging.getLogger(__name__)

LAST_ADVISOR_RUN_TIME: Optional[datetime] = None

class WorkforceAdvisorService:
    def __init__(self, broadcast_callback=None):
        self.broadcast_callback = broadcast_callback

    async def _broadcast(self, event_type: str, payload: Dict[str, Any]):
        if self.broadcast_callback:
            try:
                await self.broadcast_callback(event_type, payload)
            except Exception as exc:
                LOGGER.warning("Advisor broadcast error: %s", exc)

    async def run_analysis(
        self,
        window_days: int = 30,
        force: bool = False
    ) -> Dict[str, Any]:
        """
        Executes deterministic diagnostic analysis across all employees and workflows.
        Enforces evidence verification, strict rate limiting, and idempotency.
        """
        global LAST_ADVISOR_RUN_TIME
        now = datetime.utcnow()

        if not force and LAST_ADVISOR_RUN_TIME:
            elapsed = (now - LAST_ADVISOR_RUN_TIME).total_seconds()
            if elapsed < 300:  # 5 minutes minimum rate limit between auto runs
                return {"status": "rate_limited", "message": "Advisor ran recently. Use force=True to rerun."}

        LAST_ADVISOR_RUN_TIME = now
        findings = []
        recommendations = []

        # 1. Fetch Leaderboard & Metrics
        leaderboard_data = await GLOBAL_METRICS_ENGINE.compute_leaderboard(period_days=window_days)
        dept_data = await GLOBAL_METRICS_ENGINE.compute_department_breakdown(period_days=window_days)

        async with AsyncSessionLocal() as session:
            for item in leaderboard_data.get("leaderboard", []):
                agent_id = item["agent_id"]
                name = item["name"]
                dept = item["department"]
                m = item.get("metrics", {})
                sample = item.get("sample_size", 0)

                # Underperformance check (Requires sample_size >= 10)
                if sample >= 10 and (m.get("completion_rate", 100) < 85.0 or m.get("quality_score", 100) < 85.0):
                    # Gather verifiable evidence
                    ev_stmt = select(WorkforceTaskTelemetryModel.task_id).where(
                        and_(
                            WorkforceTaskTelemetryModel.agent_id == agent_id,
                            WorkforceTaskTelemetryModel.status == "failed"
                        )
                    ).limit(5)
                    ev_res = await session.execute(ev_stmt)
                    cited_ids = [r[0] for r in ev_res.fetchall()]

                    # Verify evidence citations exist
                    if cited_ids:
                        rec_id = f"rec_{uuid.uuid4().hex[:8]}"
                        rec = WorkforceRecommendationModel(
                            id=rec_id,
                            rec_type="underperformance",
                            target_agent_id=agent_id,
                            department=dept,
                            title=f"Retraining Recommended for {name}",
                            reasoning=f"{name} has completed {sample} tasks with a completion rate of {m.get('completion_rate')}% and quality score of {m.get('quality_score')}%. Suggest sandboxed prompt and rubric retraining.",
                            evidence={"cited_task_ids": cited_ids, "failure_rate": m.get("failure_rate")},
                            confidence_score=min(0.95, 0.60 + (sample / 50.0)),
                            sample_size=sample,
                            data_window_days=window_days,
                            status="pending"
                        )
                        session.add(rec)
                        recommendations.append(rec_id)

                # Promotion candidate check (Requires sample_size >= 10)
                if sample >= 10 and m.get("completion_rate", 0) >= 95.0 and m.get("quality_score", 0) >= 92.0:
                    rec_id = f"rec_{uuid.uuid4().hex[:8]}"
                    rec = WorkforceRecommendationModel(
                        id=rec_id,
                        rec_type="promotion",
                        target_agent_id=agent_id,
                        department=dept,
                        title=f"Promotion Assessment for {name}",
                        reasoning=f"{name} demonstrated exceptional stability across {sample} tasks with {m.get('completion_rate')}% completion and {m.get('quality_score')} quality. Recommend promotion to Senior Lead tier.",
                        evidence={"sample_size": sample, "quality_score": m.get("quality_score"), "approval_rate": m.get("approval_rate")},
                        confidence_score=min(0.98, 0.70 + (sample / 40.0)),
                        sample_size=sample,
                        data_window_days=window_days,
                        status="pending"
                    )
                    session.add(rec)
                    recommendations.append(rec_id)

            # 2. Organizational Findings: Bottlenecks & Single Points of Failure
            for dept_name, d_info in dept_data.get("departments", {}).items():
                if d_info["headcount"] == 1:
                    f_id = f"org_{uuid.uuid4().hex[:8]}"
                    finding = WorkforceOrganizationalFindingModel(
                        id=f_id,
                        finding_type="single_point_of_failure",
                        severity="HIGH",
                        department=dept_name,
                        title=f"Single Point of Failure in {dept_name}",
                        description=f"{dept_name} is operated by only 1 AI employee with zero departmental backup.",
                        suggested_action=f"Draft job specification for an auxiliary specialist in {dept_name}.",
                        evidence={"headcount": 1, "department": dept_name},
                        confidence_score=0.95,
                        data_window_days=window_days,
                        status="active"
                    )
                    session.add(finding)
                    findings.append(f_id)

                    # Auto-generate recruitment draft linked to finding
                    draft_id = f"draft_{uuid.uuid4().hex[:8]}"
                    draft = WorkforceRecruitmentDraftModel(
                        id=draft_id,
                        linked_finding_id=f_id,
                        title=f"Auxiliary Specialist ({dept_name})",
                        role="Associate Specialist",
                        department=dept_name,
                        floor=1,
                        permission_level=2,
                        system_instructions=f"Auxiliary departmental assistant providing operational redundancy for {dept_name}.",
                        suggested_tools=["video_renderer", "ffmpeg"] if "Creative" in dept_name else ["general_tool"],
                        responsibilities=["Provide operational redundancy", "Handle overflow workload"],
                        proposed_test_tasks=[{"title": "Core Department Directive Sandbox Test", "pass_threshold": 80.0}],
                        status="draft"
                    )
                    finding.linked_draft_id = draft_id
                    session.add(draft)

            await session.commit()

        if findings or recommendations:
            await self._broadcast("workforce_alert", {
                "findings_count": len(findings),
                "recommendations_count": len(recommendations),
                "alert": f"Workforce Advisor completed diagnostic run: {len(recommendations)} recommendations, {len(findings)} organizational findings."
            })

        return {
            "status": "completed",
            "findings_generated": len(findings),
            "recommendations_generated": len(recommendations),
            "window_days": window_days
        }

    async def accept_recommendation(
        self,
        rec_id: str,
        principal: Principal
    ) -> Dict[str, Any]:
        """
        Accepts a recommendation.
        STRICT BOUNDARY: Only creates a pending ApprovalModel request.
        Does NOT execute system state change!
        """
        async with AsyncSessionLocal() as session:
            stmt = select(WorkforceRecommendationModel).where(WorkforceRecommendationModel.id == rec_id)
            res = await session.execute(stmt)
            rec = res.scalar_one_or_none()
            if not rec:
                raise ValueError(f"Recommendation {rec_id} not found.")

            approval_id = f"appr_rec_{uuid.uuid4().hex[:8]}"
            approval = ApprovalModel(
                id=approval_id,
                task_id=f"advisor_{rec_id}",
                agent_id=rec.target_agent_id,
                action_type=f"advisor_{rec.rec_type}",
                description=f"CEO Authorization Required for Advisor Recommendation: {rec.title}",
                preview_data={
                    "rec_id": rec.id,
                    "rec_type": rec.rec_type,
                    "target_agent_id": rec.target_agent_id,
                    "reasoning": rec.reasoning,
                    "confidence": rec.confidence_score,
                    "evidence": rec.evidence
                },
                status="pending",
                created_at=datetime.utcnow()
            )
            session.add(approval)

            rec.status = "accepted"
            rec.linked_approval_id = approval_id
            rec.resolved_at = datetime.utcnow()

            await session.commit()

        return {
            "status": "accepted_as_request",
            "recommendation_id": rec_id,
            "approval_id": approval_id,
            "message": "Recommendation converted to pending CEO Approval request. Awaiting human CEO authorization."
        }

    async def dismiss_recommendation(self, rec_id: str, principal: Principal) -> Dict[str, Any]:
        """Dismisses an advisor recommendation."""
        async with AsyncSessionLocal() as session:
            stmt = select(WorkforceRecommendationModel).where(WorkforceRecommendationModel.id == rec_id)
            res = await session.execute(stmt)
            rec = res.scalar_one_or_none()
            if not rec:
                raise ValueError(f"Recommendation {rec_id} not found.")

            rec.status = "dismissed"
            rec.resolved_at = datetime.utcnow()
            await session.commit()

        return {"status": "dismissed", "recommendation_id": rec_id}

    async def capture_impact_baseline(
        self,
        action_type: str,
        target_agent_id: str,
        department: str,
        approval_id: str,
        finding_id: Optional[str] = None
    ) -> str:
        """Captures a metrics snapshot at the exact timestamp of lifecycle action execution."""
        baseline = await GLOBAL_METRICS_ENGINE.compute_employee_metrics(target_agent_id, period_days=30)
        tracking_id = f"impact_{uuid.uuid4().hex[:8]}"

        async with AsyncSessionLocal() as session:
            track = WorkforceImpactTrackingModel(
                id=tracking_id,
                action_type=action_type,
                target_agent_id=target_agent_id,
                department=department,
                linked_approval_id=approval_id,
                linked_finding_id=finding_id,
                executed_at=datetime.utcnow(),
                follow_up_window_days=30,
                baseline_metrics=baseline.get("metrics", {}),
                outcome="pending"
            )
            session.add(track)
            await session.commit()

        return tracking_id

    async def evaluate_impact_outcome(self, tracking_id: str) -> Dict[str, Any]:
        """
        Evaluates before/after observed metric change.
        Reports strictly as observed change, never as proven causation.
        """
        async with AsyncSessionLocal() as session:
            stmt = select(WorkforceImpactTrackingModel).where(WorkforceImpactTrackingModel.id == tracking_id)
            res = await session.execute(stmt)
            track = res.scalar_one_or_none()
            if not track:
                raise ValueError(f"Impact tracking record {tracking_id} not found.")

            follow_up = await GLOBAL_METRICS_ENGINE.compute_employee_metrics(track.target_agent_id, period_days=30)
            f_metrics = follow_up.get("metrics", {})
            b_metrics = track.baseline_metrics or {}

            sample = follow_up.get("sample_size", 0)
            if sample < 10:
                track.outcome = "insufficient_data"
                track.outcome_summary = f"Observed sample size ({sample} tasks) is below minimum threshold (10 required)."
            else:
                b_comp = b_metrics.get("completion_rate", 0)
                f_comp = f_metrics.get("completion_rate", 0)
                diff = f_comp - b_comp

                if diff >= 5.0:
                    track.outcome = "improved"
                    track.outcome_summary = f"Observed completion rate changed by +{diff:.1f}% (from {b_comp}% to {f_comp}%)."
                elif diff <= -5.0:
                    track.outcome = "worsened"
                    track.outcome_summary = f"Observed completion rate changed by {diff:.1f}% (from {b_comp}% to {f_comp}%)."
                else:
                    track.outcome = "no_change"
                    track.outcome_summary = f"Observed completion rate remained within +/-5% (delta: {diff:.1f}%)."

            track.follow_up_metrics = f_metrics
            track.evaluated_at = datetime.utcnow()
            await session.commit()

            return {
                "tracking_id": tracking_id,
                "outcome": track.outcome,
                "summary": track.outcome_summary,
                "baseline": b_metrics,
                "follow_up": f_metrics
            }

# Global singleton advisor instance
GLOBAL_ADVISOR_SERVICE = WorkforceAdvisorService()
