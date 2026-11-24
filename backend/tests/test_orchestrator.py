"""
Tests for Project Autonomia Multi-Agent Orchestrator & Approval Gates with Custom Team.
"""

import pytest
import pytest_asyncio
from backend.app.database.session import init_db
from backend.app.engine.orchestrator import GLOBAL_ORCHESTRATOR

@pytest.mark.asyncio
async def test_ceo_command_orchestration():
    await init_db()
    prompt = "Create a YouTube video explaining UiPath Document Understanding"
    res = await GLOBAL_ORCHESTRATOR.create_project_from_ceo_prompt(prompt)

    assert "project_id" in res
    assert res["title"] == prompt
    assert res["status"] == "in_progress"
    assert res["tasks_count"] == 7
