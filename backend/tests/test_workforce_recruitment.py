"""
Automated unit & integration test suite for AI Recruitment Centre (Phase 4).
Tests candidate definition, department least-privilege policies, sandboxed execution,
and the CEO deployment authorization gate.
"""

import pytest
import uuid
from backend.app.database.session import AsyncSessionLocal
from backend.app.database.workforce_models import (
    WorkforceEmployeeModel, WorkforceRecruitmentTestModel
)
from backend.app.database.models import ApprovalModel
from backend.app.workforce.recruitment import (
    RecruitmentService, CandidateCreateRequest
)
from backend.app.workforce.rbac import AUTHORIZED_PRINCIPALS
from backend.app.workforce.lifecycle_engine import LifecycleEngine

@pytest.mark.asyncio
async def test_candidate_creation_and_department_policy_enforcement():
    """Verify department policy enforcement rejects unauthorized tools or excessive permissions."""
    ceo = AUTHORIZED_PRINCIPALS["arjun_ceo"]

    # 1. Violation: Level 3 permission requested for Media department (only allows max Level 2)
    with pytest.raises(ValueError) as exc1:
        req_bad_perm = CandidateCreateRequest(
            name="Overprivileged Agent",
            title="Video Editor",
            role="Editor",
            department="Creative & Video Production",
            floor=1,
            permission_level=3,  # Violation!
            system_instructions="High level editing with external authority",
            tools=["video_renderer"]
        )
        await RecruitmentService.create_candidate(req_bad_perm, ceo)
    assert "PERMISSION_SCOPE_EXCEEDED" in str(exc1.value)

    # 2. Violation: Unauthorized tool requested for Documentation department
    with pytest.raises(ValueError) as exc2:
        req_bad_tool = CandidateCreateRequest(
            name="Unsafe Tool Agent",
            title="Doc Specialist",
            role="Documentation",
            department="Documentation & Campus",
            floor=4,
            permission_level=2,
            system_instructions="Documentation specialist",
            tools=["docker_runner"]  # Violation! (docker is Tech only)
        )
        await RecruitmentService.create_candidate(req_bad_tool, ceo)
    assert "UNAUTHORIZED_TOOLS_REQUESTED" in str(exc2.value)

    # 3. Success: Valid candidate specification conforming to policy
    req_valid = CandidateCreateRequest(
        name="Valid Candidate Specialist",
        title="Motion Graphics Designer",
        role="Motion Designer",
        department="Creative & Video Production",
        floor=1,
        permission_level=2,
        system_instructions="Create 60-second video motion sequences adhering to brand guidelines.",
        tools=["video_renderer", "ffmpeg"]
    )
    result = await RecruitmentService.create_candidate(req_valid, ceo)
    assert result["status"] == "created"
    assert result["lifecycle_state"] == "candidate"
    assert result["candidate_id"].startswith("cand_")


@pytest.mark.asyncio
async def test_sandboxed_tests_and_deployment_gate():
    """Verify candidate must pass sandboxed test tasks before CEO deployment request can be created."""
    ceo = AUTHORIZED_PRINCIPALS["arjun_ceo"]

    # Step 1: Create candidate
    req = CandidateCreateRequest(
        name=f"Tester Agent {uuid.uuid4().hex[:6]}",
        title="Scriptwriter Specialist",
        role="Scriptwriter",
        department="Creative & Video Production",
        floor=1,
        permission_level=2,
        system_instructions="Write structured video scripts.",
        tools=["script_editor"]
    )
    cand = await RecruitmentService.create_candidate(req, ceo)
    cand_id = cand["candidate_id"]

    # Step 2: Attempt deployment BEFORE running tests -> MUST BE BLOCKED
    with pytest.raises(ValueError) as exc_blocked:
        await RecruitmentService.create_deployment_request(cand_id, ceo)
    assert "DEPLOYMENT_GATE_BLOCKED" in str(exc_blocked.value)

    # Step 3: Run Sandboxed Test Suite
    test_results = await RecruitmentService.run_sandboxed_tests(cand_id)
    assert test_results["passed"] is True
    assert test_results["overall_score"] >= 80.0
    assert test_results["lifecycle_state"] == "in_testing"
    assert test_results["tests_run"] >= 2

    # Step 4: Now create deployment request -> MUST SUCCEED
    deploy_req = await RecruitmentService.create_deployment_request(cand_id, ceo)
    assert deploy_req["status"] == "pending_approval"
    approval_id = deploy_req["approval_id"]
    assert approval_id.startswith("appr_hire_")

    # Step 5: CEO Authorizes Deployment via Lifecycle Engine
    lifecycle = LifecycleEngine()
    hire_res = await lifecycle.execute_hire(
        candidate_id=cand_id,
        approval_id=approval_id,
        principal=ceo
    )
    assert hire_res["status"] == "success"
    assert hire_res["lifecycle_state"] == "active"
