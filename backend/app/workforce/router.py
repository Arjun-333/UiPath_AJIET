"""
FastAPI Router for Workforce Intelligence & Talent Management Module.
Exposes leaderboard, employee dossiers, lifecycle actions, recruitment sandbox,
advisor recommendations, and forensic audit logs.
"""

from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from backend.app.workforce.rbac import (
    Principal, Role, require_ceo, require_department_head_or_ceo, get_current_principal
)
from backend.app.workforce.metrics_engine import GLOBAL_METRICS_ENGINE
from backend.app.workforce.lifecycle_engine import GLOBAL_LIFECYCLE_ENGINE
from backend.app.workforce.recruitment import RecruitmentService, CandidateCreateRequest
from backend.app.workforce.advisor import GLOBAL_ADVISOR_SERVICE
from backend.app.database.session import AsyncSessionLocal
from backend.app.database.workforce_models import (
    WorkforceEmployeeModel, WorkforceAgentConfigModel,
    WorkforceAuditLogModel, WorkforceRecommendationModel,
    WorkforceOrganizationalFindingModel, WorkforceImpactTrackingModel
)
from sqlalchemy import select, and_, desc

router = APIRouter(prefix="/api/workforce", tags=["Workforce Intelligence"])

# =====================================================================
# PERFORMANCE ANALYTICS & LEADERBOARD ENDPOINTS
# =====================================================================

@router.get("/analytics/leaderboard")
async def get_leaderboard(
    period_days: int = Query(default=30, ge=1, le=365),
    department: Optional[str] = None,
    sort_by: str = "composite_score"
):
    """Returns real computed performance leaderboard with minimum sample size flags."""
    return await GLOBAL_METRICS_ENGINE.compute_leaderboard(
        department=department,
        period_days=period_days,
        sort_by=sort_by
    )

@router.get("/analytics/department-breakdown")
async def get_department_breakdown(period_days: int = Query(default=30, ge=1, le=365)):
    """Returns normalized department-level productivity, workload, and cost metrics."""
    return await GLOBAL_METRICS_ENGINE.compute_department_breakdown(period_days=period_days)

@router.get("/analytics/trends/{agent_id}")
async def get_employee_trends(agent_id: str, days: int = Query(default=30, ge=7, le=90)):
    """Returns 4-interval historical trend points for the specified employee."""
    return await GLOBAL_METRICS_ENGINE.compute_employee_trends(agent_id=agent_id, days=days)


# =====================================================================
# EMPLOYEE DOSSIER & LIFECYCLE MANAGEMENT ENDPOINTS
# =====================================================================

@router.get("/employees")
async def list_employees(
    department: Optional[str] = None,
    include_archived: bool = False
):
    """Lists all employees with their current lifecycle states and active configuration versions."""
    async with AsyncSessionLocal() as session:
        stmt = select(WorkforceEmployeeModel)
        if not include_archived:
            stmt = stmt.where(WorkforceEmployeeModel.is_archived == False)
        if department and department.lower() != "all":
            stmt = stmt.where(WorkforceEmployeeModel.department.ilike(department))
        res = await session.execute(stmt)
        employees = res.scalars().all()

        return [
            {
                "agent_id": e.agent_id,
                "name": e.name,
                "current_title": e.current_title,
                "department": e.department,
                "floor": e.floor,
                "current_config_version": e.current_config_version,
                "lifecycle_state": e.lifecycle_state,
                "hire_date": e.hire_date.isoformat() if e.hire_date else None,
                "last_state_change": e.last_state_change.isoformat() if e.last_state_change else None,
                "avatar_file": e.avatar_file,
                "shirt_color": e.shirt_color,
                "is_archived": e.is_archived
            }
            for e in employees
        ]

@router.get("/employees/{agent_id}")
async def get_employee_dossier(agent_id: str):
    """Returns complete personnel dossier including configuration history and performance metrics."""
    async with AsyncSessionLocal() as session:
        stmt = select(WorkforceEmployeeModel).where(WorkforceEmployeeModel.agent_id == agent_id)
        res = await session.execute(stmt)
        emp = res.scalar_one_or_none()
        if not emp:
            raise HTTPException(status_code=404, detail=f"Employee {agent_id} not found.")

        # Fetch all immutable configs
        cfg_stmt = select(WorkforceAgentConfigModel).where(
            WorkforceAgentConfigModel.agent_id == agent_id
        ).order_by(WorkforceAgentConfigModel.version_number.desc())
        cfg_res = await session.execute(cfg_stmt)
        configs = cfg_res.scalars().all()

        metrics = await GLOBAL_METRICS_ENGINE.compute_employee_metrics(agent_id, period_days=30)

        return {
            "employee": {
                "agent_id": emp.agent_id,
                "name": emp.name,
                "current_title": emp.current_title,
                "department": emp.department,
                "floor": emp.floor,
                "current_config_version": emp.current_config_version,
                "lifecycle_state": emp.lifecycle_state,
                "hire_date": emp.hire_date.isoformat() if emp.hire_date else None,
                "avatar_file": emp.avatar_file,
                "is_archived": emp.is_archived
            },
            "metrics": metrics,
            "configuration_versions": [
                {
                    "id": c.id,
                    "version_number": c.version_number,
                    "title": c.title,
                    "role": c.role,
                    "permission_level": c.permission_level,
                    "model_name": c.model_name,
                    "system_instructions": c.system_instructions,
                    "tools_whitelist": c.tools_whitelist,
                    "permission_scopes": c.permission_scopes,
                    "change_reason": c.change_reason,
                    "authorized_by_principal": c.authorized_by_principal,
                    "created_at": c.created_at.isoformat() if c.created_at else None
                }
                for c in configs
            ]
        }


# =====================================================================
# CONSEQUENTIAL LIFECYCLE ACTION EXECUTION (CEO EXCLUSIVE)
# =====================================================================

class LifecycleActionRequest(BaseModel):
    action: str  # promote, retrain, reassign, suspend, terminate, reactivate
    agent_id: str
    approval_id: str
    reason: str
    # Parameters for specific actions
    new_title: Optional[str] = None
    new_role: Optional[str] = None
    new_permission_level: Optional[int] = None
    new_department: Optional[str] = None
    new_floor: Optional[int] = None
    updated_instructions: Optional[str] = None
    updated_tools: Optional[List[str]] = None
    typed_confirmation_name: Optional[str] = None

@router.post("/lifecycle/execute")
async def execute_lifecycle_action(
    payload: LifecycleActionRequest,
    principal: Principal = Depends(require_ceo)  # STRICT SERVER-SIDE CEO GATE
):
    """
    Executes a consequential employee lifecycle action.
    STRICTLY RESTRICTED TO HUMAN CEO ARJUN.
    """
    try:
        if payload.action == "promote":
            if not payload.new_title or not payload.new_role:
                raise HTTPException(status_code=400, detail="Promotion requires new_title and new_role.")
            res = await GLOBAL_LIFECYCLE_ENGINE.execute_promotion(
                agent_id=payload.agent_id,
                new_title=payload.new_title,
                new_role=payload.new_role,
                new_permission_level=payload.new_permission_level or 2,
                change_reason=payload.reason,
                approval_id=payload.approval_id,
                principal=principal
            )
        elif payload.action == "retrain":
            if not payload.updated_instructions:
                raise HTTPException(status_code=400, detail="Retraining requires updated_instructions.")
            res = await GLOBAL_LIFECYCLE_ENGINE.execute_retraining(
                agent_id=payload.agent_id,
                updated_instructions=payload.updated_instructions,
                updated_tools=payload.updated_tools or [],
                change_reason=payload.reason,
                approval_id=payload.approval_id,
                principal=principal
            )
        elif payload.action == "reassign":
            if not payload.new_department or payload.new_floor is None:
                raise HTTPException(status_code=400, detail="Reassignment requires new_department and new_floor.")
            res = await GLOBAL_LIFECYCLE_ENGINE.execute_reassign(
                agent_id=payload.agent_id,
                new_department=payload.new_department,
                new_floor=payload.new_floor,
                change_reason=payload.reason,
                approval_id=payload.approval_id,
                principal=principal
            )
        elif payload.action == "suspend":
            res = await GLOBAL_LIFECYCLE_ENGINE.execute_suspension(
                agent_id=payload.agent_id,
                reason=payload.reason,
                approval_id=payload.approval_id,
                principal=principal
            )
        elif payload.action == "terminate":
            if not payload.typed_confirmation_name:
                raise HTTPException(status_code=400, detail="Termination requires typed confirmation of employee name.")
            res = await GLOBAL_LIFECYCLE_ENGINE.execute_termination(
                agent_id=payload.agent_id,
                typed_confirmation_name=payload.typed_confirmation_name,
                reason=payload.reason,
                approval_id=payload.approval_id,
                principal=principal
            )
        elif payload.action == "reactivate":
            res = await GLOBAL_LIFECYCLE_ENGINE.execute_reactivation(
                agent_id=payload.agent_id,
                reason=payload.reason,
                approval_id=payload.approval_id,
                principal=principal
            )
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported lifecycle action '{payload.action}'.")

        # Capture baseline for closed-loop impact tracking
        await GLOBAL_ADVISOR_SERVICE.capture_impact_baseline(
            action_type=payload.action,
            target_agent_id=payload.agent_id,
            department=payload.new_department or "Active",
            approval_id=payload.approval_id
        )

        return res

    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))


class RollbackRequest(BaseModel):
    target_version_number: int
    reason: str
    approval_id: str

@router.post("/employees/{agent_id}/rollback")
async def rollback_employee_configuration(
    agent_id: str,
    payload: RollbackRequest,
    principal: Principal = Depends(require_ceo)
):
    """Rolls back an employee's configuration to a prior immutable version."""
    try:
        return await GLOBAL_LIFECYCLE_ENGINE.execute_rollback(
            agent_id=agent_id,
            target_version_number=payload.target_version_number,
            reason=payload.reason,
            approval_id=payload.approval_id,
            principal=principal
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))


# =====================================================================
# AI RECRUITMENT CENTRE ENDPOINTS
# =====================================================================

@router.post("/recruitment/candidates")
async def create_candidate(
    payload: CandidateCreateRequest,
    principal: Principal = Depends(require_department_head_or_ceo)
):
    """Creates a new candidate specification in the AI Recruitment Centre."""
    try:
        return await RecruitmentService.create_candidate(payload, principal)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))

@router.post("/recruitment/candidates/{candidate_id}/test")
async def run_candidate_tests(candidate_id: str):
    """Executes sandboxed test tasks in isolation against evaluation criteria."""
    try:
        return await RecruitmentService.run_sandboxed_tests(candidate_id)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))

@router.post("/recruitment/candidates/{candidate_id}/deploy-request")
async def request_candidate_deployment(
    candidate_id: str,
    principal: Principal = Depends(require_department_head_or_ceo)
):
    """Submits a deployment request for a candidate that passed all sandbox tests."""
    try:
        return await RecruitmentService.create_deployment_request(candidate_id, principal)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))


# =====================================================================
# WORKFORCE ADVISOR & CONTINUOUS IMPROVEMENT ENDPOINTS
# =====================================================================

@router.get("/advisor/recommendations")
async def list_recommendations(status: Optional[str] = "pending"):
    """Lists verifiable recommendations generated by the Workforce Advisor."""
    async with AsyncSessionLocal() as session:
        stmt = select(WorkforceRecommendationModel)
        if status and status.lower() != "all":
            stmt = stmt.where(WorkforceRecommendationModel.status == status)
        stmt = stmt.order_by(WorkforceRecommendationModel.created_at.desc())
        res = await session.execute(stmt)
        recs = res.scalars().all()

        return [
            {
                "id": r.id,
                "rec_type": r.rec_type,
                "target_agent_id": r.target_agent_id,
                "department": r.department,
                "title": r.title,
                "reasoning": r.reasoning,
                "evidence": r.evidence,
                "confidence_score": r.confidence_score,
                "sample_size": r.sample_size,
                "data_window_days": r.data_window_days,
                "status": r.status,
                "linked_approval_id": r.linked_approval_id,
                "created_at": r.created_at.isoformat() if r.created_at else None
            }
            for r in recs
        ]

@router.get("/advisor/findings")
async def list_organizational_findings():
    """Lists systemic organizational findings (bottlenecks, single points of failure, gaps)."""
    async with AsyncSessionLocal() as session:
        stmt = select(WorkforceOrganizationalFindingModel).order_by(
            WorkforceOrganizationalFindingModel.created_at.desc()
        )
        res = await session.execute(stmt)
        findings = res.scalars().all()

        return [
            {
                "id": f.id,
                "finding_type": f.finding_type,
                "severity": f.severity,
                "department": f.department,
                "title": f.title,
                "description": f.description,
                "suggested_action": f.suggested_action,
                "evidence": f.evidence,
                "confidence_score": f.confidence_score,
                "status": f.status,
                "linked_draft_id": f.linked_draft_id,
                "created_at": f.created_at.isoformat() if f.created_at else None
            }
            for f in findings
        ]

@router.post("/advisor/run")
async def trigger_advisor_run(force: bool = False):
    """Triggers diagnostic analysis run across workforce data."""
    return await GLOBAL_ADVISOR_SERVICE.run_analysis(window_days=30, force=force)

@router.post("/advisor/recommendations/{rec_id}/accept")
async def accept_advisor_recommendation(
    rec_id: str,
    principal: Principal = Depends(require_department_head_or_ceo)
):
    """Converts a recommendation to a pending CEO Approval request."""
    try:
        return await GLOBAL_ADVISOR_SERVICE.accept_recommendation(rec_id, principal)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))

@router.post("/advisor/recommendations/{rec_id}/dismiss")
async def dismiss_advisor_recommendation(
    rec_id: str,
    principal: Principal = Depends(require_department_head_or_ceo)
):
    """Dismisses an advisor recommendation."""
    try:
        return await GLOBAL_ADVISOR_SERVICE.dismiss_recommendation(rec_id, principal)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))


# =====================================================================
# APPEND-ONLY AUDIT LOG ENDPOINT
# =====================================================================

@router.get("/audit/logs")
async def list_audit_logs(
    target_agent_id: Optional[str] = None,
    action: Optional[str] = None,
    limit: int = Query(default=50, ge=1, le=200)
):
    """Queries forensic append-only audit trail."""
    async with AsyncSessionLocal() as session:
        stmt = select(WorkforceAuditLogModel)
        if target_agent_id:
            stmt = stmt.where(WorkforceAuditLogModel.target_agent_id == target_agent_id)
        if action:
            stmt = stmt.where(WorkforceAuditLogModel.action == action)
        stmt = stmt.order_by(WorkforceAuditLogModel.timestamp.desc()).limit(limit)
        res = await session.execute(stmt)
        logs = res.scalars().all()

        return [
            {
                "id": l.id,
                "actor_principal": l.actor_principal,
                "actor_role": l.actor_role,
                "action": l.action,
                "target_agent_id": l.target_agent_id,
                "target_agent_name": l.target_agent_name,
                "before_state": l.before_state,
                "after_state": l.after_state,
                "reason": l.reason,
                "linked_approval_id": l.linked_approval_id,
                "correlation_id": l.correlation_id,
                "timestamp": l.timestamp.isoformat() if l.timestamp else None
            }
            for l in logs
        ]
