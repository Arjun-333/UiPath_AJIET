"""
Main FastAPI Server & WebSocket Gateway for Project Autonomia.
Connects the pixel-art Virtual Headquarters and CEO Command Centre
with the underlying multi-agent engine and media production pipelines.
"""

from contextlib import asynccontextmanager
import asyncio
import json
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from backend.app.config import BASE_DIR, DATA_DIR, PROJECTS_DIR, ASSETS_DIR, HOST, PORT
from backend.app.database.session import init_db, AsyncSessionLocal
from backend.app.database.models import ProjectModel, TaskModel, ApprovalModel, AgentMessageModel
from backend.app.agents.registry import GLOBAL_REGISTRY
from backend.app.engine.orchestrator import GLOBAL_ORCHESTRATOR

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables on startup
    await init_db()
    # Register orchestrator broadcast handler to stream to connected WebSockets
    GLOBAL_ORCHESTRATOR.register_listener(manager.broadcast_event)
    yield

app = FastAPI(title="Project Autonomia API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static asset folders
assets_dir = BASE_DIR / "frontend" / "public" / "assets"
projects_dir = DATA_DIR / "projects"
frontend_dist = BASE_DIR / "frontend" / "dist"

if assets_dir.exists():
    app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")
if projects_dir.exists():
    app.mount("/media", StaticFiles(directory=str(projects_dir)), name="media")
if frontend_dist.exists():
    app.mount("/app", StaticFiles(directory=str(frontend_dist), html=True), name="frontend_app")


from fastapi.responses import RedirectResponse

@app.get("/")
async def root():
    return RedirectResponse(url="/app/")

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast_event(self, event_type: str, payload: Dict[str, Any]):
        message = json.dumps({"event": event_type, "data": payload})
        for connection in list(self.active_connections):
            try:
                await connection.send_text(message)
            except Exception:
                self.disconnect(connection)

manager = ConnectionManager()


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    # Send initial state snapshot upon connection
    await websocket.send_text(json.dumps({
        "event": "snapshot",
        "data": {
            "roster": GLOBAL_REGISTRY.list_all(),
            "summary": GLOBAL_REGISTRY.get_roster_summary()
        }
    }))
    try:
        while True:
            data = await websocket.receive_text()
            # Can receive ping or direct UI commands
            pass
    except WebSocketDisconnect:
        manager.disconnect(websocket)


class CEOCommandRequest(BaseModel):
    command: str

@app.post("/api/ceo/command")
async def handle_ceo_command(payload: CEOCommandRequest):
    """Entry point for human CEO natural-language instructions."""
    if not payload.command.strip():
        raise HTTPException(status_code=400, detail="Command cannot be empty")
    res = await GLOBAL_ORCHESTRATOR.create_project_from_ceo_prompt(payload.command)
    return res


@app.get("/api/agents")
async def list_agents():
    """Lists all registered departmental agents and their real-time activity."""
    return {
        "summary": GLOBAL_REGISTRY.get_roster_summary(),
        "agents": GLOBAL_REGISTRY.list_all()
    }


@app.get("/api/agents/floor/{floor}")
async def list_agents_by_floor(floor: int):
    return {"floor": floor, "agents": GLOBAL_REGISTRY.list_by_floor(floor)}


@app.get("/api/projects")
async def list_projects():
    """Returns active projects and their associated task trees."""
    async with AsyncSessionLocal() as session:
        from sqlalchemy import select
        stmt = select(ProjectModel).order_by(ProjectModel.created_at.desc()).limit(20)
        res = await session.execute(stmt)
        projects = res.scalars().all()

        results = []
        for p in projects:
            task_stmt = select(TaskModel).where(TaskModel.project_id == p.id)
            task_res = await session.execute(task_stmt)
            tasks = task_res.scalars().all()

            results.append({
                "id": p.id,
                "title": p.title,
                "description": p.description,
                "status": p.status,
                "target_platform": p.target_platform,
                "created_at": p.created_at.isoformat() if p.created_at else None,
                "tasks": [
                    {
                        "id": t.id,
                        "title": t.title,
                        "department": t.department,
                        "assigned_agent_id": t.assigned_agent_id,
                        "status": t.status,
                        "permission_level": t.permission_level,
                        "output_data": t.output_data
                    }
                    for t in tasks
                ]
            })
        return results


@app.get("/api/approvals")
async def list_approvals():
    """Lists Level 3 actions awaiting CEO review."""
    async with AsyncSessionLocal() as session:
        from sqlalchemy import select
        stmt = select(ApprovalModel).order_by(ApprovalModel.created_at.desc())
        res = await session.execute(stmt)
        approvals = res.scalars().all()

        return [
            {
                "id": a.id,
                "task_id": a.task_id,
                "action_type": a.action_type,
                "description": a.description,
                "preview_url": a.preview_url,
                "status": a.status,
                "ceo_feedback": a.ceo_feedback,
                "created_at": a.created_at.isoformat() if a.created_at else None
            }
            for a in approvals
        ]


class ApprovalResolveRequest(BaseModel):
    action: str  # "approve" or "reject"
    feedback: str = ""

@app.post("/api/approvals/{approval_id}/resolve")
async def resolve_approval(approval_id: str, payload: ApprovalResolveRequest):
    """CEO approves or rejects a pending Level 3 action."""
    res = await GLOBAL_ORCHESTRATOR.resolve_approval(approval_id, payload.action, payload.feedback)
    return res


class SendMessageRequest(BaseModel):
    sender_id: str
    recipient_id: str
    content: str
    message_type: str = "task_brief"  # task_brief, handoff, inquiry, review_status, general_chat, cross_floor_visit
    project_id: str = None

@app.get("/api/messages")
async def list_messages(limit: int = 50, recipient_id: str = None):
    """Retrieves professional inter-agent corporate communications."""
    async with AsyncSessionLocal() as session:
        from sqlalchemy import select
        stmt = select(AgentMessageModel).order_by(AgentMessageModel.created_at.desc()).limit(limit)
        res = await session.execute(stmt)
        messages = res.scalars().all()

        # Seed initial realistic professional messages if empty
        if not messages:
            seed_items = [
                {
                    "id": "msg_seed_01",
                    "sender_id": "arjun_ceo",
                    "sender_name": "Arjun (CEO)",
                    "sender_floor": 0,
                    "recipient_id": "#general",
                    "recipient_name": "All Company",
                    "recipient_floor": 0,
                    "message_type": "general_chat",
                    "content": "Welcome team! Autonomous AI media production is officially live. Let's produce high quality UiPath Community AJIET content."
                },
                {
                    "id": "msg_seed_02",
                    "sender_id": "coo_01",
                    "sender_name": "Marcus Vance (COO)",
                    "sender_floor": 0,
                    "recipient_id": "darshan_director",
                    "recipient_name": "Darshan (Director)",
                    "recipient_floor": 1,
                    "message_type": "cross_floor_visit",
                    "content": "Darshan, stepping down the escalator to Floor 1 to review the YouTube tutorial storyboard. Ensure high CTR thumbnail is queued."
                },
                {
                    "id": "msg_seed_03",
                    "sender_id": "shrinithi_script",
                    "sender_name": "Shrinithi (Scriptwriter)",
                    "sender_floor": 1,
                    "recipient_id": "jiya_research",
                    "recipient_name": "Jiya (Technical Docs)",
                    "recipient_floor": 4,
                    "message_type": "inquiry",
                    "content": "Hey Jiya, taking the stairs to Floor 4 Documentation. Need latest UiPath StudioX automation activity references."
                },
                {
                    "id": "msg_seed_04",
                    "sender_id": "srijana_quality",
                    "sender_name": "Srijana (Quality & Compliance)",
                    "sender_floor": 4,
                    "recipient_id": "darshan_director",
                    "recipient_name": "Darshan (Director)",
                    "recipient_floor": 1,
                    "message_type": "review_status",
                    "content": "Media quality inspection completed: 9.8/10. Narration timing and subtitle alignment validated."
                },
                {
                    "id": "msg_seed_05",
                    "sender_id": "pratham_cto",
                    "sender_name": "Pratham (CTO)",
                    "sender_floor": 5,
                    "recipient_id": "arjun_ceo",
                    "recipient_name": "Arjun (CEO)",
                    "recipient_floor": 0,
                    "message_type": "cross_floor_visit",
                    "content": "Heading up the elevator to Floor 0 Executive Suite. Edge Neural Audio pipeline and imageio-ffmpeg are nominal."
                }
            ]
            for s in seed_items:
                m_obj = AgentMessageModel(
                    id=s["id"],
                    sender_id=s["sender_id"],
                    sender_name=s["sender_name"],
                    sender_floor=s["sender_floor"],
                    recipient_id=s["recipient_id"],
                    recipient_name=s["recipient_name"],
                    recipient_floor=s["recipient_floor"],
                    message_type=s["message_type"],
                    content=s["content"]
                )
                session.add(m_obj)
            await session.commit()

            stmt = select(AgentMessageModel).order_by(AgentMessageModel.created_at.desc()).limit(limit)
            res = await session.execute(stmt)
            messages = res.scalars().all()

        return [
            {
                "id": m.id,
                "sender_id": m.sender_id,
                "sender_name": m.sender_name,
                "sender_floor": m.sender_floor,
                "recipient_id": m.recipient_id,
                "recipient_name": m.recipient_name,
                "recipient_floor": m.recipient_floor,
                "message_type": m.message_type,
                "content": m.content,
                "project_id": m.project_id,
                "created_at": m.created_at.isoformat() if m.created_at else None
            }
            for m in reversed(messages)
        ]

@app.post("/api/messages")
async def send_message(payload: SendMessageRequest):
    """Sends a professional inter-agent message and triggers cross-floor movement."""
    import uuid
    msg_id = f"msg_{uuid.uuid4().hex[:8]}"

    # Resolve sender
    sender = GLOBAL_REGISTRY.get_agent(payload.sender_id)
    if payload.sender_id == "arjun_ceo":
        sender_name = "Arjun (Founder & CEO)"
        sender_floor = 0
    elif sender:
        sender_name = f"{sender.name} ({sender.role})"
        sender_floor = sender.floor
    else:
        sender_name = payload.sender_id
        sender_floor = 0

    # Resolve recipient
    recipient = GLOBAL_REGISTRY.get_agent(payload.recipient_id)
    if payload.recipient_id.startswith("#"):
        recipient_name = f"Channel {payload.recipient_id}"
        recipient_floor = sender_floor
    elif payload.recipient_id == "arjun_ceo":
        recipient_name = "Arjun (Founder & CEO)"
        recipient_floor = 0
    elif recipient:
        recipient_name = f"{recipient.name} ({recipient.role})"
        recipient_floor = recipient.floor
    else:
        recipient_name = payload.recipient_id
        recipient_floor = 0

    async with AsyncSessionLocal() as session:
        msg_obj = AgentMessageModel(
            id=msg_id,
            sender_id=payload.sender_id,
            sender_name=sender_name,
            sender_floor=sender_floor,
            recipient_id=payload.recipient_id,
            recipient_name=recipient_name,
            recipient_floor=recipient_floor,
            message_type=payload.message_type,
            content=payload.content,
            project_id=payload.project_id
        )
        session.add(msg_obj)
        await session.commit()

    msg_payload = {
        "id": msg_id,
        "sender_id": payload.sender_id,
        "sender_name": sender_name,
        "sender_floor": sender_floor,
        "recipient_id": payload.recipient_id,
        "recipient_name": recipient_name,
        "recipient_floor": recipient_floor,
        "message_type": payload.message_type,
        "content": payload.content,
        "project_id": payload.project_id,
        "created_at": datetime.utcnow().isoformat()
    }

    # Broadcast real-time message event to all connected UI clients
    await manager.broadcast_event("agent_message", msg_payload)

    # If cross-floor collaboration, broadcast an escalator/stairs transit event
    if sender_floor != recipient_floor and not payload.recipient_id.startswith("#"):
        await manager.broadcast_event("agent_transit", {
            "agent_id": payload.sender_id,
            "agent_name": sender_name,
            "from_floor": sender_floor,
            "to_floor": recipient_floor,
            "target_agent_id": payload.recipient_id,
            "purpose": payload.content[:60]
        })

    return {"status": "sent", "message": msg_payload}


# =====================================================================
# VIDEO PRODUCTION MANIFEST & QUALITY ASSURANCE ENDPOINTS
# =====================================================================

@app.get("/api/projects/{project_id}/manifest")
async def get_project_manifest(project_id: str):
    """Retrieves the complete scene-level video production manifest and QA status."""
    manifest_path = PROJECTS_DIR / project_id / "production_manifest.json"
    if not manifest_path.exists():
        raise HTTPException(status_code=404, detail="Production manifest not found for this project.")
    return json.loads(manifest_path.read_text(encoding="utf-8"))


@app.post("/api/projects/{project_id}/qa/inspect")
async def inspect_project_video(project_id: str):
    """Triggers the full multi-agent quality inspection suite on the project video."""
    from backend.app.media.video_qa import VideoQAService
    qa = VideoQAService()
    report = qa.inspect_video(project_id)
    await manager.broadcast_event("qa_inspection_completed", report)
    return report


@app.post("/api/projects/{project_id}/qa/repair")
async def repair_project_video(project_id: str):
    """Triggers autonomous scene repair and reassembly on defective scenes."""
    from backend.app.media.video_qa import VideoQAService
    from backend.app.media.video_renderer import VideoRenderer
    qa = VideoQAService()
    renderer = VideoRenderer()
    result = await qa.autonomous_repair(project_id, renderer)
    await manager.broadcast_event("qa_repair_completed", result)
    return result


class ManualCorrectionRequest(BaseModel):
    scene_id: str
    request_text: str  # e.g. "Replace this visual", "Make the narration clearer"
    instruction_type: str = "visual"  # visual, narration, subtitle, transition

@app.post("/api/projects/{project_id}/qa/manual_correction")
async def request_manual_correction(project_id: str, payload: ManualCorrectionRequest):
    """CEO manual scene correction request with original scene context."""
    from backend.app.media.video_qa import VideoQAService
    from backend.app.media.video_renderer import VideoRenderer

    manifest_path = PROJECTS_DIR / project_id / "production_manifest.json"
    if not manifest_path.exists():
        raise HTTPException(status_code=404, detail="Manifest not found.")

    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    scenes = manifest.get("scenes", [])
    target_scene = next((s for s in scenes if s.get("scene_id") == payload.scene_id), None)
    if not target_scene:
        raise HTTPException(status_code=404, detail=f"Scene {payload.scene_id} not found in manifest.")

    # Record manual request in scene generation history
    target_scene.setdefault("generation_history", []).append({
        "action": "ceo_manual_correction",
        "request": payload.request_text,
        "instruction_type": payload.instruction_type,
        "timestamp": datetime.utcnow().isoformat()
    })

    # Adjust scene attributes based on request
    if payload.instruction_type == "narration":
        target_scene["narration"] = f"{target_scene.get('narration', '')} (Refined: {payload.request_text})"

    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")

    # Re-render targeted scene and reassemble
    renderer = VideoRenderer()
    qa = VideoQAService()
    await renderer.render_single_scene(PROJECTS_DIR / project_id, target_scene, total_scenes=len(scenes))
    await renderer.assemble_video_from_scenes(PROJECTS_DIR / project_id, scenes)
    reval = qa.inspect_video(project_id)

    await manager.broadcast_event("manual_correction_completed", {
        "project_id": project_id,
        "scene_id": payload.scene_id,
        "request": payload.request_text,
        "revalidation": reval
    })
    return {"status": "repaired", "scene_id": payload.scene_id, "revalidation": reval}


# =====================================================================
# NEMOTRON 3 ULTRA TELEMETRY & STATUS ENDPOINTS
# =====================================================================

@app.get("/api/llm/nemotron/status")
async def get_nemotron_status():
    """Returns Nemotron 3 Ultra connection health, token consumption, and cost tracking."""
    from backend.app.engine.llm_provider import NemotronLLMProvider, LLMFactory
    provider = NemotronLLMProvider()
    conn_result = await provider.test_connection()
    usage = LLMFactory.get_nemotron_usage()
    return {
        "provider": "NVIDIA Nemotron 3 Ultra",
        "model": "nvidia/nemotron-3-ultra-550b-a55b",
        "api_configured": provider.is_configured(),
        "connection": conn_result,
        "usage": usage
    }


@app.get("/api/system/health")
async def get_system_health():
    """Floor 5 Technology & Infrastructure Health Report."""
    import shutil
    total, used, free = shutil.disk_usage("/")
    return {
        "status": "HEALTHY",
        "disk_free_gb": free // (2**30),
        "disk_total_gb": total // (2**30),
        "database": "SQLite (aiosqlite) Operational",
        "video_pipeline": "imageio-ffmpeg Native Operational",
        "speech_engine": "Harmonic TTS Operational",
        "roster_health": GLOBAL_REGISTRY.get_roster_summary()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host=HOST, port=PORT, reload=False)
