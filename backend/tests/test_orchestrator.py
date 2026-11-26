"""
Tests for Project Autonomia Multi-Agent Orchestrator & Approval Gates with Custom Team.
"""

import pytest
from backend.app.database.session import AsyncSessionLocal, init_db
from backend.app.database.models import ProjectModel, TaskModel
from backend.app.engine.orchestrator import GLOBAL_ORCHESTRATOR
from sqlalchemy import delete

@pytest.mark.asyncio
async def test_ceo_command_orchestration():
    await init_db()
    prompt = "Create a YouTube video explaining UiPath Document Understanding"
    res = await GLOBAL_ORCHESTRATOR.create_project_from_ceo_prompt(prompt)
    project_id = res["project_id"]

    try:
        assert "project_id" in res
        assert res["title"] == prompt
        assert res["status"] == "in_progress"
        assert res["tasks_count"] == 7
    finally:
        async with AsyncSessionLocal() as session:
            await session.execute(delete(TaskModel).where(TaskModel.project_id == project_id))
            await session.execute(delete(ProjectModel).where(ProjectModel.id == project_id))
            await session.commit()
