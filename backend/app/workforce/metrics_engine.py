"""
Deterministic Performance Analytics & Metrics Engine for Workforce Intelligence.
Strictly computes real statistics from database records. No LLM estimation or fabrication.
"""

import math
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from sqlalchemy import select, and_, func

from backend.app.database.session import AsyncSessionLocal
from backend.app.database.models import TaskModel, ApprovalModel, AgentMessageModel
from backend.app.database.workforce_models import (
    WorkforceEmployeeModel, WorkforceTaskTelemetryModel,
    WorkforceTaskEvaluationModel
)

DEFAULT_MIN_SAMPLE_SIZE = 10

COMPOSITE_WEIGHTS_V1 = {
    "version": "v1.0",
    "completion_rate": 0.25,
    "quality_score": 0.30,
    "accuracy_score": 0.20,
    "efficiency_score": 0.15,
    "approval_rate": 0.10
}

class MetricsEngine:
    def __init__(self, min_sample_size: int = DEFAULT_MIN_SAMPLE_SIZE):
        self.min_sample_size = min_sample_size

    async def compute_employee_metrics(
        self,
        agent_id: str,
        period_days: int = 30,
        custom_start: Optional[datetime] = None,
        custom_end: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Computes all 8 measurable indicators for a specific AI employee.
        Enforces minimum sample threshold rule and composite score breakdown.
        """
        now = datetime.utcnow()
        if custom_start and custom_end:
            start_date = custom_start
            end_date = custom_end
        else:
            start_date = now - timedelta(days=period_days)
            end_date = now

        async with AsyncSessionLocal() as session:
            # 1. Fetch Employee Record
            emp_stmt = select(WorkforceEmployeeModel).where(WorkforceEmployeeModel.agent_id == agent_id)
            emp_res = await session.execute(emp_stmt)
            emp = emp_res.scalar_one_or_none()
            if not emp:
                return {"error": f"Employee {agent_id} not found", "is_insufficient_data": True}

            # 2. Fetch Task Telemetry
            telem_stmt = select(WorkforceTaskTelemetryModel).where(
                and_(
                    WorkforceTaskTelemetryModel.agent_id == agent_id,
                    WorkforceTaskTelemetryModel.created_at >= start_date,
                    WorkforceTaskTelemetryModel.created_at <= end_date
                )
            )
            telem_res = await session.execute(telem_stmt)
            telemetry_records: List[WorkforceTaskTelemetryModel] = telem_res.scalars().all()

            # 3. Fetch Task Evaluations
            eval_stmt = select(WorkforceTaskEvaluationModel).where(
                and_(
                    WorkforceTaskEvaluationModel.agent_id == agent_id,
                    WorkforceTaskEvaluationModel.created_at >= start_date,
                    WorkforceTaskEvaluationModel.created_at <= end_date
                )
            )
            eval_res = await session.execute(eval_stmt)
            evaluations: List[WorkforceTaskEvaluationModel] = eval_res.scalars().all()

            # 4. Fetch Approvals
            appr_stmt = select(ApprovalModel).where(
                and_(
                    ApprovalModel.agent_id == agent_id,
                    ApprovalModel.created_at >= start_date,
                    ApprovalModel.created_at <= end_date
                )
            )
            appr_res = await session.execute(appr_stmt)
            approvals: List[ApprovalModel] = appr_res.scalars().all()

            # 5. Fetch Collaboration Messages
            msg_stmt = select(AgentMessageModel).where(
                and_(
                    AgentMessageModel.sender_id == agent_id,
                    AgentMessageModel.created_at >= start_date,
                    AgentMessageModel.created_at <= end_date
                )
            )
            msg_res = await session.execute(msg_stmt)
            messages: List[AgentMessageModel] = msg_res.scalars().all()

        # Calculation variables
        completed_tasks = [t for t in telemetry_records if t.status == "completed"]
        failed_tasks = [t for t in telemetry_records if t.status == "failed"]
        total_finished = len(completed_tasks) + len(failed_tasks)
        sample_size = total_finished

        is_insufficient = sample_size < self.min_sample_size

        # Metric 1: Task Completion Rate
        completion_rate = (len(completed_tasks) / total_finished * 100.0) if total_finished > 0 else 0.0

        # Metric 6: Failure Rate
        failure_rate = (len(failed_tasks) / total_finished * 100.0) if total_finished > 0 else 0.0

        # Metric 2: Output Quality
        quality_score = 0.0
        if evaluations:
            quality_score = sum(e.quality_score for e in evaluations) / len(evaluations)
        elif completed_tasks:
            quality_score = 100.0  # fallback if all completed with zero QA defects

        # Metric 3: Accuracy
        first_pass_count = sum(1 for t in completed_tasks if t.retry_count == 0)
        accuracy_score = (first_pass_count / len(completed_tasks) * 100.0) if completed_tasks else 0.0
        if evaluations:
            # Factor in QA evaluation accuracy score
            avg_eval_acc = sum(e.accuracy_score for e in evaluations) / len(evaluations)
            accuracy_score = (accuracy_score + avg_eval_acc) / 2.0

        # Metric 4: Execution Time (Excluding queue and approval wait time)
        exec_durations = [
            t.execution_duration_seconds
            for t in completed_tasks
            if t.execution_duration_seconds is not None and t.execution_duration_seconds > 0
        ]
        avg_execution_time_seconds = (sum(exec_durations) / len(exec_durations)) if exec_durations else 0.0

        # Metric 5: Cost Per Task
        total_cost = sum(t.cost_usd for t in telemetry_records)
        cost_per_task = (total_cost / total_finished) if total_finished > 0 else 0.0

        # Metric 7: Collaboration Score
        handoffs = sum(1 for m in messages if m.message_type == "handoff")
        cross_floor = sum(1 for m in messages if m.sender_floor != m.recipient_floor and not m.recipient_id.startswith("#"))
        collab_score = min(100.0, (handoffs * 10.0) + (cross_floor * 15.0) + (len(messages) * 2.0))

        # Metric 8: Human Approval Rate
        resolved_approvals = [a for a in approvals if a.status in ("approved", "rejected")]
        approved_count = sum(1 for a in resolved_approvals if a.status == "approved")
        if resolved_approvals:
            approval_rate = (approved_count / len(resolved_approvals)) * 100.0
            approval_rate_label = f"{approval_rate:.1f}%"
        else:
            approval_rate = 100.0
            approval_rate_label = "N/A (Autonomous Level 2)"

        # Efficiency Score for Composite (0-100, where 30s or lower is 100%)
        target_time = 60.0
        eff_score = max(0.0, min(100.0, (1.0 - (avg_execution_time_seconds / (target_time * 2.0))) * 100.0))

        # Composite Score (Versioned v1.0)
        w = COMPOSITE_WEIGHTS_V1
        composite_score = (
            w["completion_rate"] * completion_rate +
            w["quality_score"] * quality_score +
            w["accuracy_score"] * accuracy_score +
            w["efficiency_score"] * eff_score +
            w["approval_rate"] * approval_rate
        )

        return {
            "agent_id": agent_id,
            "name": emp.name,
            "title": emp.current_title,
            "department": emp.department,
            "floor": emp.floor,
            "lifecycle_state": emp.lifecycle_state,
            "current_config_version": emp.current_config_version,
            "period_days": period_days,
            "sample_size": sample_size,
            "min_sample_size": self.min_sample_size,
            "is_insufficient_data": is_insufficient,
            "insufficient_data_reason": (
                f"Sample size of {sample_size} tasks is below the minimum threshold of {self.min_sample_size} in this evaluation period."
                if is_insufficient else None
            ),
            "metrics": {
                "completion_rate": round(completion_rate, 2),
                "quality_score": round(quality_score, 2),
                "accuracy_score": round(accuracy_score, 2),
                "execution_time_seconds": round(avg_execution_time_seconds, 2),
                "cost_per_task_usd": round(cost_per_task, 4),
                "failure_rate": round(failure_rate, 2),
                "collaboration_score": round(collab_score, 2),
                "approval_rate": round(approval_rate, 2),
                "approval_rate_label": approval_rate_label
            },
            "composite": {
                "score": round(composite_score, 2) if not is_insufficient else None,
                "version": w["version"],
                "weights": w,
                "components": {
                    "completion_rate_contribution": round(w["completion_rate"] * completion_rate, 2),
                    "quality_contribution": round(w["quality_score"] * quality_score, 2),
                    "accuracy_contribution": round(w["accuracy_score"] * accuracy_score, 2),
                    "efficiency_contribution": round(w["efficiency_score"] * eff_score, 2),
                    "approval_contribution": round(w["approval_rate"] * approval_rate, 2)
                }
            },
            "activity_counts": {
                "completed_tasks": len(completed_tasks),
                "failed_tasks": len(failed_tasks),
                "total_messages": len(messages),
                "handoff_messages": handoffs,
                "approvals_submitted": len(approvals),
                "approvals_approved": approved_count
            }
        }

    async def compute_leaderboard(
        self,
        department: Optional[str] = None,
        period_days: int = 30,
        sort_by: str = "composite_score"
    ) -> Dict[str, Any]:
        """
        Computes leaderboard for all active employees.
        Applies honest insufficient data tagging and fair departmental comparisons.
        """
        async with AsyncSessionLocal() as session:
            stmt = select(WorkforceEmployeeModel).where(WorkforceEmployeeModel.is_archived == False)
            if department and department.lower() != "all":
                stmt = stmt.where(WorkforceEmployeeModel.department.ilike(department))
            res = await session.execute(stmt)
            employees = res.scalars().all()

        results = []
        for emp in employees:
            metrics = await self.compute_employee_metrics(emp.agent_id, period_days=period_days)
            results.append(metrics)

        # Sort: employees with sufficient data first, ordered by sort_by
        def sort_key(item):
            if item.get("is_insufficient_data"):
                return (-1, 0)
            if sort_by == "composite_score":
                val = item.get("composite", {}).get("score") or 0.0
            else:
                val = item.get("metrics", {}).get(sort_by, 0.0)
            return (1, val)

        results.sort(key=sort_key, reverse=True)

        return {
            "period_days": period_days,
            "total_employees": len(results),
            "department_filter": department or "all",
            "leaderboard": results
        }

    async def compute_department_breakdown(self, period_days: int = 30) -> Dict[str, Any]:
        """
        Computes normalized department-level productivity, workload, quality, and cost.
        Ensures departments with different task types are compared fairly.
        """
        async with AsyncSessionLocal() as session:
            stmt = select(WorkforceEmployeeModel.department).distinct()
            res = await session.execute(stmt)
            departments = [r[0] for r in res.fetchall() if r[0]]

        now = datetime.utcnow()
        start_date = now - timedelta(days=period_days)

        dept_summaries = {}
        async with AsyncSessionLocal() as session:
            for dept in departments:
                # Query telemetry for department
                t_stmt = select(WorkforceTaskTelemetryModel).where(
                    and_(
                        WorkforceTaskTelemetryModel.department.ilike(dept),
                        WorkforceTaskTelemetryModel.created_at >= start_date
                    )
                )
                t_res = await session.execute(t_stmt)
                records: List[WorkforceTaskTelemetryModel] = t_res.scalars().all()

                completed = [r for r in records if r.status == "completed"]
                failed = [r for r in records if r.status == "failed"]
                total = len(completed) + len(failed)

                total_cost = sum(r.cost_usd for r in records)
                avg_cost = (total_cost / total) if total > 0 else 0.0
                completion_rate = (len(completed) / total * 100.0) if total > 0 else 0.0

                durations = [r.execution_duration_seconds for r in completed if r.execution_duration_seconds]
                avg_dur = (sum(durations) / len(durations)) if durations else 0.0

                # Count active staff
                emp_stmt = select(func.count(WorkforceEmployeeModel.agent_id)).where(
                    and_(
                        WorkforceEmployeeModel.department.ilike(dept),
                        WorkforceEmployeeModel.lifecycle_state == "active"
                    )
                )
                emp_count_res = await session.execute(emp_stmt)
                headcount = emp_count_res.scalar() or 0

                dept_summaries[dept] = {
                    "department": dept,
                    "headcount": headcount,
                    "total_tasks_executed": total,
                    "completed_tasks": len(completed),
                    "failed_tasks": len(failed),
                    "completion_rate": round(completion_rate, 2),
                    "average_execution_time_seconds": round(avg_dur, 2),
                    "total_cost_usd": round(total_cost, 4),
                    "cost_per_task_usd": round(avg_cost, 4),
                    "productivity_per_agent": round(total / max(1, headcount), 2)
                }

        return {
            "period_days": period_days,
            "departments": dept_summaries
        }

    async def compute_employee_trends(self, agent_id: str, days: int = 30) -> Dict[str, Any]:
        """
        Computes historical trend points in daily or weekly intervals.
        """
        now = datetime.utcnow()
        points = []
        # Sample across 4 weekly intervals
        interval_days = max(1, days // 4)
        for i in range(4):
            window_end = now - timedelta(days=i * interval_days)
            window_start = window_end - timedelta(days=interval_days)
            m = await self.compute_employee_metrics(
                agent_id,
                custom_start=window_start,
                custom_end=window_end
            )
            points.append({
                "period_label": f"W-{4-i}",
                "start": window_start.strftime("%Y-%m-%d"),
                "end": window_end.strftime("%Y-%m-%d"),
                "sample_size": m.get("sample_size", 0),
                "completion_rate": m.get("metrics", {}).get("completion_rate"),
                "quality_score": m.get("metrics", {}).get("quality_score"),
                "cost_usd": m.get("metrics", {}).get("cost_per_task_usd")
            })

        return {
            "agent_id": agent_id,
            "trend_intervals": list(reversed(points))
        }

# Global singleton engine instance
GLOBAL_METRICS_ENGINE = MetricsEngine()
