"""
Tests for Project Autonomia Agent Registry and Departmental Agents (Custom Team).
"""

import pytest
import pytest_asyncio
from backend.app.agents.registry import GLOBAL_REGISTRY

@pytest.mark.asyncio
async def test_agent_registry_loads_all_departments():
    summary = GLOBAL_REGISTRY.get_roster_summary()
    assert summary["total_agents"] >= 12
    assert summary["floors_count"] == 6

    # Verify key custom team agents exist
    assert GLOBAL_REGISTRY.get_agent("auri_ceo_interface") is not None
    assert GLOBAL_REGISTRY.get_agent("coo_01") is not None

    # Tech Dept
    assert GLOBAL_REGISTRY.get_agent("pratham_cto") is not None
    assert GLOBAL_REGISTRY.get_agent("mallika_tech") is not None
    assert GLOBAL_REGISTRY.get_agent("vaibhav_devops") is not None
    assert GLOBAL_REGISTRY.get_agent("faazil_sysadmin") is not None

    # Media Dept
    assert GLOBAL_REGISTRY.get_agent("darshan_director") is not None
    assert GLOBAL_REGISTRY.get_agent("shrinithi_script") is not None
    assert GLOBAL_REGISTRY.get_agent("vaishnavi_design") is not None
    assert GLOBAL_REGISTRY.get_agent("shreyank_editor") is not None

    # Documentation Dept
    assert GLOBAL_REGISTRY.get_agent("iffah_doc") is not None
    assert GLOBAL_REGISTRY.get_agent("jiya_research") is not None
    assert GLOBAL_REGISTRY.get_agent("srijana_quality") is not None


@pytest.mark.asyncio
async def test_jiya_research_agent_execution():
    agent = GLOBAL_REGISTRY.get_agent("jiya_research")
    assert agent is not None
    res = await agent.run({"topic": "UiPath Document Understanding"})
    assert res["status"] == "success"
    data = res["data"]
    assert "documentation_refs" in data
    assert len(data["documentation_refs"]) > 0


@pytest.mark.asyncio
async def test_shrinithi_scriptwriter_agent_execution():
    agent = GLOBAL_REGISTRY.get_agent("shrinithi_script")
    assert agent is not None
    res = await agent.run({"prompt": "UiPath Studio Automation"})
    assert res["status"] == "success"
    script = res["data"]["script"]
    assert "scenes" in script
    assert len(script["scenes"]) >= 3


@pytest.mark.asyncio
async def test_srijana_quality_review():
    agent = GLOBAL_REGISTRY.get_agent("srijana_quality")
    assert agent is not None
    res_pass = await agent.run({"output_data": {"master_16x9": "data/projects/test_proj_01/master_16x9.mp4"}})
    assert res_pass["status"] == "success"
    assert res_pass["data"]["quality_status"] == "APPROVED"
