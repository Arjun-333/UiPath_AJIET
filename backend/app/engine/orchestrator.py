"""
Central Multi-Agent Workflow Orchestrator for Project Autonomia.
Handles CEO natural-language dispatch, task sequencing, dependency checking,
quality gates, and Level 3 human CEO approval routing.
"""

import asyncio
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
import logging

from backend.app.database.session import AsyncSessionLocal
from backend.app.database.models import ProjectModel, TaskModel, ApprovalModel, AgentMessageModel
from backend.app.database.workforce_models import WorkforceTaskTelemetryModel, WorkforceTaskEvaluationModel
from backend.app.agents.registry import GLOBAL_REGISTRY

LOGGER = logging.getLogger(__name__)

class WorkflowOrchestrator:
    def __init__(self):
        self.registry = GLOBAL_REGISTRY
        self._active_listeners = []

    def register_listener(self, callback):
        self._active_listeners.append(callback)

    async def broadcast(self, event_type: str, payload: Dict[str, Any]):
        for listener in self._active_listeners:
            try:
                await listener(event_type, payload)
            except Exception as exc:
                LOGGER.warning("Broadcast listener error: %s", exc)

    async def create_project_from_ceo_prompt(self, ceo_prompt: str) -> Dict[str, Any]:
        """
        Receives natural language command from CEO via ORBI,
        decomposes it into a project with hierarchical task dependencies.
        """
        project_id = f"proj_{uuid.uuid4().hex[:8]}"
        timestamp = datetime.utcnow()

        # Step 1: AURI Interface Agent Acknowledgment
        auri = self.registry.get_agent("auri_ceo_interface") or self.registry.get_agent("orbi_ceo_interface")
        if auri:
            await auri.run({"prompt": ceo_prompt, "timestamp": str(timestamp)})
        await self.broadcast("mascot_update", {"state": "thinking", "message": f"AURI analyzing: {ceo_prompt}"})

        # Step 2: COO Decomposes into workflow
        coo = self.registry.get_agent("coo_01")
        plan_result = await coo.run({"prompt": ceo_prompt})

        # Define canonical autonomous media pipeline tasks with Arjun's official team
        task_defs = [
            {
                "id": f"{project_id}_t1_research",
                "title": "Research UiPath Topic & Technical Specs",
                "department": "Documentation & Campus",
                "assigned_agent_id": "jiya_research",
                "permission_level": 1,
                "dependencies": [],
                "input_data": {"topic": ceo_prompt}
            },
            {
                "id": f"{project_id}_t2_script",
                "title": "Write 6-Scene Narration Script",
                "department": "Media & Creative",
                "assigned_agent_id": "shrinithi_script",
                "permission_level": 2,
                "dependencies": [f"{project_id}_t1_research"],
                "input_data": {"prompt": ceo_prompt}
            },
            {
                "id": f"{project_id}_t3_render",
                "title": "Synthesize Audio & Render 16:9 Master Video",
                "department": "Media & Creative",
                "assigned_agent_id": "darshan_director",
                "permission_level": 2,
                "dependencies": [f"{project_id}_t2_script"],
                "input_data": {"project_id": project_id}
            },
            {
                "id": f"{project_id}_t4_thumbnail",
                "title": "Generate 1280x720 YouTube Thumbnail",
                "department": "Media & Creative",
                "assigned_agent_id": "vaishnavi_design",
                "permission_level": 2,
                "dependencies": [f"{project_id}_t2_script"],
                "input_data": {"project_id": project_id, "title": ceo_prompt}
            },
            {
                "id": f"{project_id}_t5_reel",
                "title": "Adapt 16:9 Master to 9:16 Vertical Reel",
                "department": "Media & Creative",
                "assigned_agent_id": "shreyank_editor",
                "permission_level": 2,
                "dependencies": [f"{project_id}_t3_render"],
                "input_data": {}
            },
            {
                "id": f"{project_id}_t6_quality_review",
                "title": "Quality & Compliance Inspection",
                "department": "Documentation & Campus",
                "assigned_agent_id": "srijana_quality",
                "permission_level": 2,
                "dependencies": [f"{project_id}_t3_render", f"{project_id}_t4_thumbnail"],
                "input_data": {}
            },
            {
                "id": f"{project_id}_t7_ceo_approval",
                "title": "Release Gate: Ready for Manual Upload",
                "department": "Media & Creative",
                "assigned_agent_id": "darshan_director",
                "permission_level": 3,  # Level 3 Execution Gate: MUST await CEO Arjun's approval
                "dependencies": [f"{project_id}_t6_quality_review"],
                "input_data": {}
            }
        ]

        async with AsyncSessionLocal() as session:
            project = ProjectModel(
                id=project_id,
                title=ceo_prompt[:250],
                description=f"Initiated by CEO: '{ceo_prompt}'",
                status="in_progress",
                target_platform="youtube_and_instagram",
                meta={"ceo_instruction": ceo_prompt}
            )
            session.add(project)

            for t in task_defs:
                task_obj = TaskModel(
                    id=t["id"],
                    project_id=project_id,
                    title=t["title"],
                    department=t["department"],
                    assigned_agent_id=t["assigned_agent_id"],
                    status="pending",
                    permission_level=t["permission_level"],
                    dependencies=t["dependencies"],
                    input_data=t["input_data"],
                    output_data={}
                )
                session.add(task_obj)

            await session.commit()

        await self.broadcast("project_created", {"project_id": project_id, "title": ceo_prompt})
        # Launch background execution pipeline
        asyncio.create_task(self.run_project_pipeline(project_id))

        return {
            "project_id": project_id,
            "title": ceo_prompt,
            "status": "in_progress",
            "tasks_count": len(task_defs)
        }

    async def run_project_pipeline(self, project_id: str):
        """Asynchronous execution loop traversing tasks by dependency order."""
        context_accumulator: Dict[str, Any] = {}

        while True:
            async with AsyncSessionLocal() as session:
                from sqlalchemy import select
                stmt = select(TaskModel).where(TaskModel.project_id == project_id)
                res = await session.execute(stmt)
                tasks: List[TaskModel] = res.scalars().all()

                all_done = True
                ready_tasks = []

                completed_ids = {t.id for t in tasks if t.status == "completed"}

                for t in tasks:
                    if t.status in ("pending", "in_progress"):
                        all_done = False
                        # Check dependencies
                        deps_satisfied = all(dep in completed_ids for dep in (t.dependencies or []))
                        if deps_satisfied and t.status == "pending":
                            ready_tasks.append(t)

                if all_done:
                    # Mark project completed
                    proj_stmt = select(ProjectModel).where(ProjectModel.id == project_id)
                    proj_res = await session.execute(proj_stmt)
                    proj = proj_res.scalar_one_or_none()
                    if proj:
                        proj.status = "completed"
                        await session.commit()
                    await self.broadcast("project_completed", {"project_id": project_id})
                    break

                if not ready_tasks:
                    # Checking if waiting on CEO approvals
                    waiting_approval = any(t.status == "review" for t in tasks)
                    if waiting_approval:
                        break
                    # If any task failed and no more tasks can become ready, fail the project
                    has_failures = any(t.status == "failed" for t in tasks)
                    if has_failures:
                        proj_stmt = select(ProjectModel).where(ProjectModel.id == project_id)
                        proj_res = await session.execute(proj_stmt)
                        proj = proj_res.scalar_one_or_none()
                        if proj:
                            proj.status = "failed"
                            await session.commit()
                        await self.broadcast("project_failed", {"project_id": project_id, "error": "Pipeline halted due to failed task dependency."})
                        break
                    await asyncio.sleep(1.0)
                    continue

                for t in ready_tasks:
                    t.status = "in_progress"
                    await session.commit()

                    agent = self.registry.get_agent(t.assigned_agent_id)
                    if not agent:
                        continue

                    await self.broadcast("task_started", {
                        "task_id": t.id,
                        "agent_id": agent.agent_id,
                        "agent_name": agent.name,
                        "title": t.title
                    })

                    task_start_time = datetime.utcnow()

                    # Prepare merged input
                    input_payload = {**t.input_data, **context_accumulator, "task_id": t.id, "title": t.title, "project_id": project_id}
                    run_result = await agent.run(input_payload)
                    task_finish_time = datetime.utcnow()
                    exec_duration = max(0.05, (task_finish_time - task_start_time).total_seconds())

                    if run_result["status"] == "success":
                        t.output_data = run_result.get("data", {})
                        context_accumulator.update(t.output_data)

                        # Enforce Quality Release Gate
                        if "quality" in t.id and (t.output_data.get("quality_status") == "REVISION_REQUIRED" or t.output_data.get("critical_defects_count", 0) > 0):
                            t.status = "failed"
                            t.error_message = f"Quality gate blocked: {t.output_data.get('critical_defects_count', 0)} critical defects detected."
                            await session.commit()
                            await self.broadcast("quality_alert", {
                                "project_id": project_id,
                                "task_id": t.id,
                                "score": t.output_data.get("score"),
                                "defects": t.output_data.get("defects", [])
                            })
                            continue

                        t.status = "completed"

                        # Record Workforce Telemetry and Evaluation
                        task_tokens = 950
                        task_cost = 0.0015 * (task_tokens / 1000.0)
                        
                        telem = WorkforceTaskTelemetryModel(
                            id=f"telem_{t.id}",
                            task_id=t.id,
                            project_id=project_id,
                            agent_id=agent.agent_id,
                            department=t.department,
                            started_at=task_start_time,
                            completed_at=task_finish_time,
                            approval_wait_seconds=0.0,
                            execution_duration_seconds=exec_duration,
                            model_name="nvidia/nemotron-3-ultra-550b-a55b",
                            prompt_tokens=int(task_tokens * 0.6),
                            completion_tokens=int(task_tokens * 0.4),
                            cost_usd=task_cost,
                            status="completed",
                            retry_count=t.retry_count or 0,
                            created_at=task_start_time
                        )
                        session.add(telem)

                        eval_score = 100.0
                        if "score" in t.output_data:
                            eval_score = float(t.output_data["score"])
                        defects_c = len(t.output_data.get("defects", [])) if isinstance(t.output_data, dict) else 0
                        acc_score = max(0.0, 100.0 - (t.retry_count * 10.0) - (defects_c * 5.0))

                        eval_obj = WorkforceTaskEvaluationModel(
                            id=f"eval_{t.id}",
                            task_id=t.id,
                            agent_id=agent.agent_id,
                            evaluator_type="automated_qa" if "score" in t.output_data else "rubric_inspector",
                            quality_score=eval_score,
                            accuracy_score=acc_score,
                            defects_count=defects_c,
                            rubric_breakdown={"score": eval_score, "defects": defects_c},
                            created_at=task_finish_time
                        )
                        session.add(eval_obj)

                        # Generate professional inter-agent handover message
                        handoff_recipient = "all"
                        if "research" in t.id:
                            handoff_recipient = "shrinithi_script"
                            handoff_text = f"Research memo on '{t.input_data.get('topic', '')}' completed. Ready for scriptwriting."
                        elif "script" in t.id:
                            handoff_recipient = "darshan_director"
                            handoff_text = "Narration script & scene durations approved. Ready for video rendering."
                        elif "render" in t.id:
                            handoff_recipient = "srijana_quality"
                            handoff_text = "Master video generated with 24kHz neural audio. Handing over for compliance inspection."
                        elif "quality" in t.id:
                            handoff_recipient = "arjun_ceo"
                            score_val = t.output_data.get("score", 9.8)
                            handoff_text = f"Quality review PASSED (Score: {score_val}/100). Staging in CEO Approval Gate for publication."
                        else:
                            handoff_recipient = "#general"
                            handoff_text = f"Task completed: {t.title}"

                        recip_agent = self.registry.get_agent(handoff_recipient)
                        recip_floor = recip_agent.floor if recip_agent else 0
                        recip_name = recip_agent.name if recip_agent else handoff_recipient

                        msg_id = f"msg_{uuid.uuid4().hex[:8]}"
                        msg_obj = AgentMessageModel(
                            id=msg_id,
                            sender_id=agent.agent_id,
                            sender_name=agent.name,
                            sender_floor=agent.floor,
                            recipient_id=handoff_recipient,
                            recipient_name=recip_name,
                            recipient_floor=recip_floor,
                            message_type="handoff",
                            content=handoff_text,
                            project_id=project_id
                        )
                        session.add(msg_obj)

                        await self.broadcast("agent_message", {
                            "id": msg_id,
                            "sender_id": agent.agent_id,
                            "sender_name": agent.name,
                            "sender_floor": agent.floor,
                            "recipient_id": handoff_recipient,
                            "recipient_name": recip_name,
                            "recipient_floor": recip_floor,
                            "message_type": "handoff",
                            "content": handoff_text,
                            "project_id": project_id,
                            "created_at": datetime.utcnow().isoformat()
                        })

                        # If cross-floor collaboration, trigger an escalator/stairs transit
                        if agent.floor != recip_floor and not handoff_recipient.startswith("#"):
                            await self.broadcast("agent_transit", {
                                "agent_id": agent.agent_id,
                                "agent_name": agent.name,
                                "from_floor": agent.floor,
                                "to_floor": recip_floor,
                                "target_agent_id": handoff_recipient,
                                "purpose": handoff_text[:50]
                            })

                        # If this is Level 3 task (Publishing / External action), route to CEO Approval
                        if t.permission_level == 3:
                            t.status = "review"
                            approval_id = f"appr_{uuid.uuid4().hex[:8]}"
                            approval = ApprovalModel(
                                id=approval_id,
                                task_id=t.id,
                                agent_id=agent.agent_id,
                                action_type="publish_content",
                                description=f"CEO Approval Required to publish: {t.title}",
                                preview_url=context_accumulator.get("master_16x9") or context_accumulator.get("thumbnail"),
                                preview_data=context_accumulator,
                                status="pending"
                            )
                            session.add(approval)
                            await session.commit()

                            auri = self.registry.get_agent("auri_ceo_interface") or self.registry.get_agent("orbi_ceo_interface")
                            if auri:
                                auri.status = "waiting_approval"

                            await self.broadcast("approval_requested", {
                                "approval_id": approval_id,
                                "task_id": t.id,
                                "description": approval.description,
                                "preview": approval.preview_url
                            })
                        else:
                            await session.commit()

                        await self.broadcast("task_completed", {
                            "task_id": t.id,
                            "agent_id": agent.agent_id,
                            "output": t.output_data
                        })
                    else:
                        t.status = "failed"
                        t.error_message = run_result.get("error", "Unknown agent failure")
                        
                        telem = WorkforceTaskTelemetryModel(
                            id=f"telem_{t.id}",
                            task_id=t.id,
                            project_id=project_id,
                            agent_id=agent.agent_id,
                            department=t.department,
                            started_at=task_start_time,
                            completed_at=task_finish_time,
                            approval_wait_seconds=0.0,
                            execution_duration_seconds=exec_duration,
                            model_name="nvidia/nemotron-3-ultra-550b-a55b",
                            status="failed",
                            retry_count=t.retry_count or 0,
                            failure_category="agent_error",
                            created_at=task_start_time
                        )
                        session.add(telem)
                        await session.commit()
                        await self.broadcast("task_failed", {"task_id": t.id, "error": t.error_message})

            await asyncio.sleep(0.5)

    async def resolve_approval(self, approval_id: str, action: str, feedback: Optional[str] = None) -> Dict[str, Any]:
        """CEO approves or rejects a Level 3 action."""
        async with AsyncSessionLocal() as session:
            from sqlalchemy import select
            stmt = select(ApprovalModel).where(ApprovalModel.id == approval_id)
            res = await session.execute(stmt)
            approval = res.scalar_one_or_none()

            if not approval:
                return {"error": "Approval request not found"}

            approval.status = "approved" if action == "approve" else "rejected"
            approval.ceo_feedback = feedback
            approval.resolved_at = datetime.utcnow()

            # Update associated task
            task_stmt = select(TaskModel).where(TaskModel.id == approval.task_id)
            task_res = await session.execute(task_stmt)
            task = task_res.scalar_one_or_none()

            if task:
                task.status = "completed" if action == "approve" else "failed"

            # Update telemetry with approval wait time
            wait_sec = (approval.resolved_at - approval.created_at).total_seconds() if approval.created_at else 0.0
            telem_stmt = select(WorkforceTaskTelemetryModel).where(WorkforceTaskTelemetryModel.task_id == approval.task_id)
            telem_res = await session.execute(telem_stmt)
            telem = telem_res.scalar_one_or_none()
            if telem:
                telem.approval_wait_seconds = wait_sec
                telem.status = "completed" if action == "approve" else "failed"

            # Check if this is an Advisor Recommendation
            if approval.action_type.startswith("advisor_") or "advisor_" in (approval.task_id or ""):
                from backend.app.database.workforce_models import WorkforceRecommendationModel
                rec_stmt = select(WorkforceRecommendationModel).where(
                    (WorkforceRecommendationModel.linked_approval_id == approval_id) |
                    (WorkforceRecommendationModel.id == (approval.task_id or "").replace("advisor_", ""))
                )
                rec_res = await session.execute(rec_stmt)
                rec = rec_res.scalar_one_or_none()
                if rec:
                    rec.status = "approved" if action == "approve" else "dismissed"
                    rec.resolved_at = datetime.utcnow()

            # Check if this is a Video Publish action
            if approval.action_type == "publish_content" and action == "approve":
                pub_msg = AgentMessageModel(
                    id=f"msg_{uuid.uuid4().hex[:8]}",
                    sender_id="arjun_ceo",
                    sender_name="Arjun (CEO)",
                    sender_floor=0,
                    recipient_id="#general",
                    recipient_name="All Company",
                    recipient_floor=0,
                    message_type="general_chat",
                    content=f"APPROVED FOR UPLOAD: {approval.description}. Local assets ready in Media Vault for manual YouTube / Instagram upload."
                )
                session.add(pub_msg)

            await session.commit()

        # Check if this is a Workforce Candidate Hire & Deploy action
        if approval.action_type == "workforce_deploy":
            if action == "approve":
                from backend.app.workforce.lifecycle_engine import GLOBAL_LIFECYCLE_ENGINE
                from backend.app.workforce.rbac import Principal, Role, AUTHORIZED_PRINCIPALS
                ceo_principal = AUTHORIZED_PRINCIPALS.get("arjun_ceo", Principal("arjun_ceo", Role.CEO, True, "Arjun (CEO)"))
                try:
                    await GLOBAL_LIFECYCLE_ENGINE.execute_hire(
                        candidate_id=approval.agent_id,
                        approval_id=approval.id,
                        principal=ceo_principal
                    )
                except Exception as e:
                    import logging
                    logging.getLogger("autonomia.orchestrator").warning(f"Error executing hire during approval: {e}")

        auri = self.registry.get_agent("auri_ceo_interface") or self.registry.get_agent("orbi_ceo_interface")
        if auri:
            auri.status = "celebrating" if action == "approve" else "idle"

        await self.broadcast("approval_resolved", {
            "approval_id": approval_id,
            "status": approval.status,
            "action_type": approval.action_type,
            "feedback": feedback
        })

        return {"approval_id": approval_id, "status": approval.status}

# Global orchestrator singleton
GLOBAL_ORCHESTRATOR = WorkflowOrchestrator()
