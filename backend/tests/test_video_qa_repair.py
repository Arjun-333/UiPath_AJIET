"""
Unit and Integration Tests for Autonomous Video Quality Assurance,
Self-Repair Engine, and NVIDIA Nemotron 3 Ultra Provider Integration.
"""

import pytest
import os
import json
import shutil
from pathlib import Path
from PIL import Image

from backend.app.media.video_qa import VideoQAService, DefectSeverity, DefectCategory
from backend.app.media.video_renderer import VideoRenderer
from backend.app.engine.llm_provider import NemotronLLMProvider, LLMFactory, HeuristicLLMProvider
from backend.app.config import PROJECTS_DIR


@pytest.fixture
def sample_project_env(tmp_path):
    """Sets up an isolated project directory with production manifest and dummy media."""
    project_id = "test_qa_proj_99"
    proj_dir = tmp_path / project_id
    proj_dir.mkdir(parents=True, exist_ok=True)
    audio_dir = proj_dir / "audio"
    scenes_dir = proj_dir / "scenes"
    audio_dir.mkdir(exist_ok=True)
    scenes_dir.mkdir(exist_ok=True)

    manifest = {
        "project_id": project_id,
        "title": "UiPath Studio Automation Masterclass",
        "status": "draft",
        "total_duration": 30.0,
        "repair_attempts": 0,
        "quality_score": 0.0,
        "scenes": [
            {
                "scene_id": "scene_01",
                "scene_number": 1,
                "chapter": "Chapter 1: The Core Automation Challenge",
                "title": "Manual Repetition vs Intelligent RPA",
                "narration": "Welcome to UiPath Community AJIET. In this masterclass we automate invoices.",
                "duration": 15.0,
                "start_timestamp": 0.0,
                "end_timestamp": 15.0,
                "voiceover_asset": str(audio_dir / "scene_01.wav"),
                "generation_history": []
            },
            {
                "scene_id": "scene_02",
                "scene_number": 2,
                "chapter": "Chapter 2: UiPath Studio Architecture & Interface",
                "title": "Studio IDE Deep Dive & Package Configuration",
                "narration": "Let us explore the modern UI automation activities in UiPath Studio.",
                "duration": 15.0,
                "start_timestamp": 15.0,
                "end_timestamp": 30.0,
                "voiceover_asset": str(audio_dir / "scene_02.wav"),
                "generation_history": []
            }
        ],
        "defects": []
    }

    manifest_file = proj_dir / "production_manifest.json"
    manifest_file.write_text(json.dumps(manifest, indent=2), encoding="utf-8")

    # Create dummy audio files
    (audio_dir / "scene_01.wav").write_bytes(b"RIFF" + b"\x00" * 1200)
    (audio_dir / "scene_02.wav").write_bytes(b"RIFF" + b"\x00" * 1200)

    # Create dummy srt
    srt_content = (
        "1\n00:00:01,000 --> 00:00:04,000\nWelcome to UiPath Community AJIET.\n\n"
        "2\n00:00:16,000 --> 00:00:20,000\nLet us explore UiPath Studio modern UI automation.\n\n"
    )
    (proj_dir / "subtitles.srt").write_text(srt_content, encoding="utf-8")

    # Mock PROJECTS_DIR redirection
    original_projects_dir = PROJECTS_DIR

    yield proj_dir, manifest

    shutil.rmtree(proj_dir, ignore_errors=True)


# =====================================================================
# 1. TEST NEMOTRON 3 ULTRA LLM PROVIDER
# =====================================================================

@pytest.mark.asyncio
async def test_nemotron_provider_initialization_and_usage_tracking():
    """Verifies Nemotron 3 Ultra configuration, token telemetry, and fallback."""
    provider = NemotronLLMProvider()
    assert provider.model == "nvidia/nemotron-3-ultra-550b-a55b"
    assert provider.base_url == "https://integrate.api.nvidia.com/v1"

    # Connection test on unconfigured key
    conn = await provider.test_connection()
    assert conn["status"] in ("unconfigured", "connected", "error", "exception")

    # Usage tracking initialization
    usage = LLMFactory.get_nemotron_usage()
    assert "prompt_tokens" in usage
    assert "completion_tokens" in usage
    assert "total_tokens" in usage
    assert "estimated_cost_usd" in usage

    # Fallback generation works reliably
    res = await provider.generate("Create a YouTube script about UiPath Automation", role="scriptwriter")
    parsed = json.loads(res)
    assert "title" in parsed
    assert "scenes" in parsed
    assert len(parsed["scenes"]) >= 5


# =====================================================================
# 2. TEST DEFECT DETECTION AGENTS
# =====================================================================

def test_technical_inspector_missing_video(tmp_path):
    """Verifies Technical Inspector catches missing/corrupt exports."""
    qa = VideoQAService()
    fake_path = tmp_path / "non_existent.mp4"
    defects, score = qa.inspect_technical(fake_path)

    assert len(defects) > 0
    assert defects[0]["severity"] == DefectSeverity.CRITICAL
    assert defects[0]["category"] == DefectCategory.TECHNICAL
    assert score == 0.0


def test_story_inspector_sequence_and_scene_count():
    """Verifies Story Inspector enforces pedagogical continuity and scene thresholds."""
    qa = VideoQAService()

    # Incomplete scene count (< 3 scenes)
    incomplete_manifest = {"scenes": [{"scene_id": "scene_01", "scene_number": 1}]}
    defects, score = qa.inspect_story(incomplete_manifest)
    assert any(d["severity"] == DefectSeverity.CRITICAL for d in defects)
    assert score < 70.0

    # Sequence mismatch (scene 1, then scene 4)
    scrambled_manifest = {
        "scenes": [
            {"scene_id": "s1", "scene_number": 1},
            {"scene_id": "s2", "scene_number": 4},
            {"scene_id": "s3", "scene_number": 3}
        ]
    }
    defects2, score2 = qa.inspect_story(scrambled_manifest)
    assert any(d["category"] == DefectCategory.STORY for d in defects2)


def test_subtitle_inspector_detects_overlap_and_overflow(tmp_path):
    """Verifies Subtitle Inspector catches overlapping cues and line length overflow."""
    qa = VideoQAService()
    proj_dir = tmp_path / "sub_test"
    proj_dir.mkdir(parents=True)

    # Deliberately overlapping subtitle cues
    bad_srt = (
        "1\n00:00:01,000 --> 00:00:05,000\nFirst line caption that plays for 5 seconds.\n\n"
        "2\n00:00:04,000 --> 00:00:08,000\nThis line overlaps the previous one by a whole second and is excessively long exceeding safe margins.\n\n"
    )
    (proj_dir / "subtitles.srt").write_text(bad_srt, encoding="utf-8")

    manifest = {"scenes": [], "total_duration": 10.0}
    defects, score = qa.inspect_subtitles(manifest, proj_dir)

    assert len(defects) >= 1
    assert any(d["category"] == DefectCategory.SUBTITLE for d in defects)
    assert score < 100.0


def test_audio_inspector_detects_missing_voiceover(tmp_path):
    """Verifies Audio Inspector catches missing voiceover audio assets."""
    qa = VideoQAService()
    proj_dir = tmp_path / "audio_test"
    proj_dir.mkdir(parents=True)

    manifest = {
        "scenes": [
            {
                "scene_id": "scene_01",
                "chapter": "Chapter 1",
                "voiceover_asset": str(proj_dir / "missing_audio.wav"),
                "duration": 10.0
            }
        ]
    }
    defects, score = qa.inspect_audio(manifest, proj_dir)
    assert len(defects) >= 1
    assert defects[0]["severity"] == DefectSeverity.CRITICAL
    assert defects[0]["category"] == DefectCategory.AUDIO


# =====================================================================
# 3. TEST AUTONOMOUS SCENE REPAIR & INDEPENDENT RE-RENDERING
# =====================================================================

@pytest.mark.asyncio
async def test_autonomous_scene_repair_preserves_unaffected_scenes(tmp_path, monkeypatch):
    """
    CRITICAL TEST:
    Verifies that autonomous repair:
    1. Identifies the defective scene (scene_02).
    2. Re-renders ONLY the defective scene.
    3. Preserves approved, unaffected scenes (scene_01 is untouched).
    4. Reassembles the full video and updates manifest.
    """
    project_id = "test_repair_pipeline"
    proj_dir = tmp_path / project_id
    proj_dir.mkdir(parents=True, exist_ok=True)
    scenes_dir = proj_dir / "scenes"
    audio_dir = proj_dir / "audio"
    scenes_dir.mkdir(exist_ok=True)
    audio_dir.mkdir(exist_ok=True)

    # Monkeypatch PROJECTS_DIR
    import backend.app.media.video_qa as vqa_module
    monkeypatch.setattr(vqa_module, "PROJECTS_DIR", tmp_path)

    # Scene 1 is approved and already rendered
    s1_file = scenes_dir / "scene_01.mp4"
    s1_file.write_bytes(b"EXISTING_VALID_SCENE_1_BYTES")
    s1_mtime_before = s1_file.stat().st_mtime

    # Scene 2 is defective (e.g. black frame defect)
    s2_file = scenes_dir / "scene_02.mp4"
    s2_file.write_bytes(b"DEFECTIVE_SCENE_2_BYTES")

    manifest = {
        "project_id": project_id,
        "title": "UiPath Test Automation",
        "status": "repair_required",
        "repair_attempts": 0,
        "quality_score": 65.0,
        "total_duration": 20.0,
        "scenes": [
            {
                "scene_id": "scene_01",
                "scene_number": 1,
                "chapter": "Chapter 1",
                "title": "Intro",
                "narration": "Intro narration",
                "duration": 10.0,
                "start_timestamp": 0.0,
                "end_timestamp": 10.0,
                "voiceover_asset": str(audio_dir / "scene_01.wav"),
                "generation_history": []
            },
            {
                "scene_id": "scene_02",
                "scene_number": 2,
                "chapter": "Chapter 2",
                "title": "Core Automation",
                "narration": "Core narration",
                "duration": 10.0,
                "start_timestamp": 10.0,
                "end_timestamp": 20.0,
                "voiceover_asset": str(audio_dir / "scene_02.wav"),
                "generation_history": []
            }
        ],
        "defects": [
            {
                "defect_id": "def_vis_sample",
                "scene_id": "scene_02",
                "timestamp_range": [10.0, 20.0],
                "severity": DefectSeverity.CRITICAL,
                "category": DefectCategory.VISUAL,
                "explanation": "Black frame detected in scene_02.",
                "evidence": {"mean_luminance": 1.2},
                "recommended_correction": "Regenerate visual graphics.",
                "responsible_agent": "darshan_director",
                "correction_status": "detected"
            }
        ]
    }

    manifest_file = proj_dir / "production_manifest.json"
    manifest_file.write_text(json.dumps(manifest, indent=2), encoding="utf-8")

    # Mock video renderer to test preservation logic
    class MockVideoRenderer:
        def __init__(self):
            self.rendered_scenes = []

        async def render_single_scene(self, p_dir, sc, total_scenes=2):
            self.rendered_scenes.append(sc["scene_id"])
            repaired_file = Path(p_dir) / "scenes" / f"{sc['scene_id']}.mp4"
            repaired_file.write_bytes(b"REPAIRED_SCENE_NEW_BYTES")
            return repaired_file

        async def assemble_video_from_scenes(self, p_dir, scs):
            master_file = Path(p_dir) / "master_16x9.mp4"
            master_file.write_bytes(b"ASSEMBLED_MASTER_BYTES")
            return master_file

    qa_service = VideoQAService()
    mock_renderer = MockVideoRenderer()

    # Execute Autonomous Repair
    repair_result = await qa_service.autonomous_repair(project_id, mock_renderer)

    # 1. Verify that ONLY scene_02 was re-rendered
    assert "scene_02" in mock_renderer.rendered_scenes
    assert "scene_01" not in mock_renderer.rendered_scenes  # Scene 1 was preserved untouched!

    # 2. Verify Scene 1 file content was NOT overwritten
    assert s1_file.read_bytes() == b"EXISTING_VALID_SCENE_1_BYTES"

    # 3. Verify Scene 2 was updated with repaired content
    assert s2_file.read_bytes() == b"REPAIRED_SCENE_NEW_BYTES"

    # 4. Verify updated manifest attempts
    updated_manifest = json.loads(manifest_file.read_text(encoding="utf-8"))
    assert updated_manifest["repair_attempts"] == 1
    assert len(updated_manifest["scenes"][1]["generation_history"]) == 1
    assert updated_manifest["scenes"][1]["generation_history"][0]["action"] == "autonomous_repair_rerender"
