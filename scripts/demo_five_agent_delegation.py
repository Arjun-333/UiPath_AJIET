"""
Standalone Verification Script for Project Autonomia with Arjun's Team.
Demonstrates end-to-end task delegation across:
- CEO: Arjun (The Overall Main)
- Mascot: ORBI (CEO Interface)
- COO: Marcus Vance (Operations Coordinator)
- Scriptwriter: Shrinithi (Lead Scriptwriter & Content Strategist)
- Video Producer: Darshan (Lead Video Director & Production Head)
- Quality Inspector: Srijana (Quality & Compliance Inspector)
"""

import asyncio
from pathlib import Path
from datetime import datetime

from backend.app.database.session import init_db
from backend.app.agents.departments import (
    CEOInterfaceAgent,
    COOAgent,
    ShrinithiScriptAgent,
    DarshanDirectorAgent,
    SrijanaQualityAgent
)

async def run_custom_team_delegation():
    print("=" * 70)
    print("  PROJECT AUTONOMIA: ARJUN'S OFFICIAL TEAM DELEGATION PIPELINE")
    print("=" * 70)

    await init_db()

    orbi = CEOInterfaceAgent()
    coo = COOAgent()
    shrinithi = ShrinithiScriptAgent()
    darshan = DarshanDirectorAgent()
    srijana = SrijanaQualityAgent()

    directive = "Create a YouTube tutorial explaining UiPath Studio Automation for beginners"
    print(f"\n[DIRECTIVE FROM CEO ARJUN]: \"{directive}\"\n")

    # STEP 1: AURI Interface Agent
    print("▶ STEP 1: CEO Interface Agent (AURI - Autonomous UiPath Robotic Intelligence)")
    auri_res = await orbi.run({"prompt": directive, "timestamp": datetime.utcnow().isoformat()})
    assert auri_res["status"] == "success"
    print(f"  ✓ AURI Status: {orbi.status} | Dispatched to Marcus Vance (COO)")

    # STEP 2: COO Marcus Vance
    print("\n▶ STEP 2: Operations Coordinator (Marcus Vance)")
    coo_res = await coo.run({"prompt": directive})
    assert coo_res["status"] == "success"
    print(f"  ✓ Workflow Scheduled: Assigned to Darshan (Media Production Head)")

    # STEP 3: Scriptwriter Shrinithi
    print("\n▶ STEP 3: Lead Scriptwriter & Content Strategist (Shrinithi)")
    script_res = await shrinithi.run({"prompt": directive})
    assert script_res["status"] == "success"
    script = script_res["data"]["script"]
    print(f"  ✓ Script Created: \"{script.get('title')}\" ({len(script.get('scenes', []))} scenes)")

    # STEP 4: Video Director & Producer Darshan
    print("\n▶ STEP 4: Lead Video Director & Producer (Darshan - Native FFmpeg Compositing)")
    proj_id = "test_proj_01"
    render_res = await darshan.run({"project_id": proj_id, "script": script})
    assert render_res["status"] == "success"
    rendered = render_res["data"]
    from backend.app.config import PROJECTS_DIR
    master = PROJECTS_DIR / proj_id / "master_16x9.mp4"
    reel = PROJECTS_DIR / proj_id / "reel_9x16.mp4"
    print(f"  ✓ 16:9 Master Video: {master.name} ({master.stat().st_size // 1024} KB)")
    print(f"  ✓ 9:16 Instagram Reel: {reel.name} ({reel.stat().st_size // 1024} KB)")

    # STEP 5: Quality & Compliance Inspector Srijana
    print("\n▶ STEP 5: Quality & Compliance Inspector (Srijana)")
    cqo_res = await srijana.run({"output_data": rendered})
    assert cqo_res["status"] == "success"
    review = cqo_res["data"]
    print(f"  ✓ Quality Status: {review['quality_status']} (Score: {review['score']}/10.0)")
    print(f"  ✓ Note: {review['notes'][0]}")

    print("\n" + "=" * 70)
    print("  DELEGATION COMPLETE: STAGED FOR CEO ARJUN'S APPROVAL GATE")
    print("=" * 70)

if __name__ == "__main__":
    asyncio.run(run_custom_team_delegation())
