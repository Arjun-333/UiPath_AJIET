"""
Masterclass Video Renderer for Project Autonomia.
Composes topic-driven UiPath Studio IDE simulations, progressive workflow animations,
data tables, live execution consoles, neural speech narration, and generates:
1. 16:9 Landscape Full Master MP4 (1280x720) with progressive step highlights,
   live voice waveform, AURI mascot overlay, and synchronized burned-in captions.
2. 9:16 Vertical Instagram Reel MP4 (720x1280) with animated progress bar and captions.
"""

import subprocess
import shutil
import json
import re
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any
from PIL import Image, ImageDraw, ImageFont
import imageio_ffmpeg

from backend.app.config import FFMPEG_PATH
from backend.app.media.tts_engine import TTSEngine
from backend.app.media.subtitle_generator import SubtitleGenerator

UBUNTU_BOLD_FONT = "/usr/share/fonts/truetype/ubuntu/Ubuntu-B.ttf"
AURI_WORKING_GIF = Path("/home/arjun/Desktop/PROJECTS/UiPathAJIET/frontend/public/assets/sprites/auri/orbi_working.gif")


class VideoRenderer:
    def __init__(self):
        self.ffmpeg_exe = FFMPEG_PATH if Path(FFMPEG_PATH).exists() else imageio_ffmpeg.get_ffmpeg_exe()
        self.tts = TTSEngine(voice="en-US-ChristopherNeural")
        self._load_fonts()

    def _load_fonts(self):
        bold_path = UBUNTU_BOLD_FONT
        reg_path = "/usr/share/fonts/truetype/ubuntu/Ubuntu-R.ttf"
        mono_path = "/usr/share/fonts/truetype/ubuntu/UbuntuMono-B.ttf"
        mono_reg = "/usr/share/fonts/truetype/ubuntu/UbuntuMono-R.ttf"

        try:
            self.font_header = ImageFont.truetype(bold_path, 20)
            self.font_title = ImageFont.truetype(bold_path, 24)
            self.font_subtitle = ImageFont.truetype(bold_path, 19)
            self.font_body = ImageFont.truetype(reg_path, 17)
            self.font_caption = ImageFont.truetype(reg_path, 15)
            self.font_code = ImageFont.truetype(mono_path, 16)
            self.font_code_sm = ImageFont.truetype(mono_reg, 14)
            self.font_footer = ImageFont.truetype(reg_path, 14)
        except Exception:
            self.font_header = ImageFont.load_default()
            self.font_title = ImageFont.load_default()
            self.font_subtitle = ImageFont.load_default()
            self.font_body = ImageFont.load_default()
            self.font_caption = ImageFont.load_default()
            self.font_code = ImageFont.load_default()
            self.font_code_sm = ImageFont.load_default()
            self.font_footer = ImageFont.load_default()

    @staticmethod
    def _wrap_text(text: str, max_chars: int) -> List[str]:
        words = (text or "").split()
        lines, cur = [], []
        for w in words:
            if len(" ".join(cur + [w])) > max_chars:
                if cur:
                    lines.append(" ".join(cur))
                cur = [w]
            else:
                cur.append(w)
        if cur:
            lines.append(" ".join(cur))
        return lines

    @staticmethod
    def _truncate(text: str, max_len: int) -> str:
        t = (text or "").strip()
        return t if len(t) <= max_len else t[: max_len - 3].rstrip() + "..."

    def _extract_topic_points(self, scene: Dict[str, Any], count: int = 4) -> List[str]:
        """Extracts concise, topic-specific points from scene metadata or narration."""
        explicit = scene.get("steps") or scene.get("key_points")
        if isinstance(explicit, list) and explicit:
            cleaned = [self._truncate(str(item), 62) for item in explicit if str(item).strip()]
            if cleaned:
                while len(cleaned) < count:
                    cleaned.append(cleaned[-1])
                return cleaned[:count]

        narration = (scene.get("narration") or "").strip()
        sentences = [s.strip() for s in re.split(r"[.!?]+", narration) if len(s.strip()) > 12]
        points = [self._truncate(s, 62) for s in sentences[:count]]
        topic = scene.get("topic") or scene.get("title") or "UiPath Automation"
        defaults = [
            f"Configure {self._truncate(topic, 36)} workflow",
            "Validate selectors, variables, and data schema",
            "Execute automated pipeline with error handling",
            "Publish verified package to Orchestrator"
        ]
        while len(points) < count:
            points.append(defaults[len(points) % len(defaults)])
        return points[:count]

    def render_scene_frame(
        self,
        scene: Dict[str, Any],
        scene_idx: int = 0,
        total_scenes: int = 6,
        width: int = 1280,
        height: int = 720,
        active_step: int = 0
    ) -> Image.Image:
        """
        Renders topic-driven visual frames simulating the UiPath Studio IDE,
        progressive workflow diagrams, data tables, and live execution consoles.
        `active_step` (0..2) highlights progressive stages for multi-keyframe motion.
        """
        img = Image.new("RGB", (width, height), (13, 17, 23))
        draw = ImageDraw.Draw(img)

        topic = scene.get("topic") or scene.get("title") or "UiPath Studio Automation"
        title = scene.get("title", "UiPath Studio Automation")
        points = self._extract_topic_points(scene, count=4)

        # 1. Top Ribbon Navigation Bar
        draw.rectangle([0, 0, width, 52], fill=(255, 102, 0))
        draw.text((36, 15), "UiPath Community AJIET | Autonomia Production Studio", font=self.font_header, fill=(255, 255, 255))

        chapter_str = self._truncate(scene.get("chapter", f"Chapter {scene_idx + 1}"), 36)
        draw.rectangle([width - 360, 10, width - 36, 42], fill=(234, 88, 12), outline=(255, 255, 255), width=1)
        draw.text((width - 345, 16), chapter_str, font=self.font_footer, fill=(255, 255, 255))

        # 2. Main Title Banner
        draw.rectangle([36, 64, width - 36, 108], fill=(22, 27, 34), outline=(48, 54, 61), width=1)
        draw.text((50, 72), f"TOPIC: {self._truncate(title.upper(), 68)}", font=self.font_title, fill=(0, 229, 255))

        visual_type = scene.get("visual_type", "studio_ide_walkthrough")

        # 3. Topic-Driven Visual Content Area (120px to 520px)
        if visual_type == "challenge_comparison":
            left_outline = (244, 63, 94) if active_step == 0 else (159, 18, 57)
            right_outline = (16, 185, 129) if active_step >= 1 else (6, 95, 70)

            draw.rounded_rectangle([40, 120, 610, 440], radius=12, fill=(28, 15, 19), outline=left_outline, width=3 if active_step == 0 else 1)
            draw.rectangle([40, 120, 610, 160], fill=(225, 29, 72))
            draw.text((60, 130), "MANUAL PROCESS BOTTLENECKS", font=self.font_subtitle, fill=(255, 255, 255))

            manual_items = [
                f"• Slow manual handling for {self._truncate(topic, 28)}",
                "• High human error rate across repetitive data entry",
                "• Queue backlogs and inconsistent validation rules",
                "• Limited audit trail and SLA visibility"
            ]
            for i, line in enumerate(manual_items):
                draw.text((60, 185 + i * 52), line, font=self.font_body, fill=(254, 205, 211))

            draw.rounded_rectangle([670, 120, width - 40, 440], radius=12, fill=(10, 30, 22), outline=right_outline, width=3 if active_step >= 1 else 1)
            draw.rectangle([670, 120, width - 40, 160], fill=(16, 185, 129))
            draw.text((690, 130), "AUTONOMIA UIPATH PIPELINE", font=self.font_subtitle, fill=(255, 255, 255))

            for i, pt in enumerate(points):
                highlight = (active_step >= 1 and i == min(active_step, 3))
                col = (255, 255, 255) if highlight else (167, 243, 208)
                prefix = "▶ " if highlight else "• "
                draw.text((690, 185 + i * 52), self._truncate(prefix + pt, 48), font=self.font_body, fill=col)

            pipe_border = (56, 189, 248) if active_step == 2 else (30, 58, 138)
            draw.rounded_rectangle([40, 455, width - 40, 512], radius=8, fill=(15, 23, 42), outline=pipe_border, width=2)
            draw.text(
                (60, 474),
                self._truncate(f"PIPELINE [{topic}]: [Trigger] -> [Extract & Validate] -> [Automate] -> [Verify & Report]", 98),
                font=self.font_code,
                fill=(56, 189, 248)
            )

        elif visual_type == "studio_ide_walkthrough":
            draw.rectangle([40, 120, width - 40, 160], fill=(30, 41, 59))
            draw.text((60, 132), "UiPath Studio v2024.10  |  File    Design    Debug    Manage Packages    Data Manager", font=self.font_code, fill=(241, 245, 249))

            # Left Sidebar: Activities Palette
            draw.rectangle([40, 160, 330, 520], fill=(15, 23, 42), outline=(51, 65, 85))
            draw.rectangle([40, 160, 330, 195], fill=(2, 132, 199))
            draw.text((55, 170), "ACTIVITIES PALETTE", font=self.font_subtitle, fill=(255, 255, 255))
            palette_items = [
                ("Modern UI Automation", True),
                ("[+] Use App/Browser", False),
                ("[+] Click / Type Into", False),
                ("[+] Table Extraction", False),
                ("System & Workflow", True),
                ("[+] Assign & Log Message", False),
                ("[+] Try Catch Handler", False),
                ("[+] Add Queue Item", False),
            ]
            for idx_p, (label, is_hdr) in enumerate(palette_items):
                y_p = 212 + idx_p * 34
                col = (56, 189, 248) if is_hdr else (226, 232, 240)
                draw.text((55 if is_hdr else 70, y_p), label, font=self.font_code if is_hdr else self.font_code_sm, fill=col)

            # Center: Designer Canvas
            draw.rectangle([340, 160, 930, 520], fill=(22, 27, 34), outline=(51, 65, 85))
            draw.rectangle([340, 160, 930, 195], fill=(30, 41, 59))
            draw.text((360, 170), f"DESIGNER: {self._truncate(title, 40)}", font=self.font_subtitle, fill=(241, 245, 249))

            draw.rounded_rectangle([365, 210, 905, 505], radius=10, fill=(15, 23, 42), outline=(255, 102, 0), width=2)
            draw.rectangle([365, 210, 905, 242], fill=(255, 102, 0))
            draw.text((385, 218), self._truncate(f"Sequence - {topic}", 48), font=self.font_body, fill=(255, 255, 255))

            node_colors = [(56, 189, 248), (16, 185, 129), (245, 158, 11)]
            for step_i in range(3):
                y_n = 256 + step_i * 80
                is_active = (active_step == step_i)
                col = node_colors[step_i]
                draw.rounded_rectangle(
                    [390, y_n, 880, y_n + 66],
                    radius=8,
                    fill=(38, 50, 70) if is_active else (26, 34, 48),
                    outline=col,
                    width=3 if is_active else 1
                )
                badge = "ACTIVE STEP" if is_active else f"STEP {step_i + 1}"
                draw.text((408, y_n + 10), f"[{badge}] {self._truncate(points[step_i], 40)}", font=self.font_body, fill=col)
                draw.text((408, y_n + 38), f"Target: Modern Experience | Verified Execution", font=self.font_code_sm, fill=(148, 163, 184))

            # Right Sidebar: Properties Panel
            draw.rectangle([940, 160, width - 40, 520], fill=(15, 23, 42), outline=(51, 65, 85))
            draw.rectangle([940, 160, width - 40, 195], fill=(71, 85, 105))
            draw.text((955, 170), "PROPERTIES", font=self.font_subtitle, fill=(255, 255, 255))
            props = [
                f"ActiveNode: Step {active_step + 1}",
                "InputMode: Modern",
                "SimulateType: True",
                "Timeout: 30,000ms",
                "VerifyExecution: True",
                "FuzzyAccuracy: 0.85",
                "RetryScope: Enabled"
            ]
            for p_i, p_txt in enumerate(props):
                draw.text((955, 218 + p_i * 36), f"• {p_txt}", font=self.font_code_sm, fill=(16, 185, 129) if p_i == 0 else (226, 232, 240))

        elif visual_type == "workflow_sequence_builder":
            draw.rounded_rectangle([40, 120, 690, 520], radius=12, fill=(15, 23, 42), outline=(255, 102, 0), width=2)
            draw.text((60, 134), "WORKFLOW SEQUENCE DESIGNER (LIVE STEP TRACE)", font=self.font_subtitle, fill=(255, 102, 0))

            step_colors = [(56, 189, 248), (16, 185, 129), (245, 158, 11), (168, 85, 247)]
            y_pos = 175
            for s_i, pt in enumerate(points):
                col = step_colors[s_i % len(step_colors)]
                is_active = (s_i == active_step) or (active_step == 2 and s_i == 3)
                draw.rounded_rectangle(
                    [68, y_pos, 662, y_pos + 64],
                    radius=8,
                    fill=(40, 52, 74) if is_active else (26, 35, 52),
                    outline=col,
                    width=3 if is_active else 1
                )
                prefix = f"▶ {s_i + 1}." if is_active else f"{s_i + 1}."
                draw.text((88, y_pos + 11), f"{prefix} {self._truncate(pt, 46)}", font=self.font_body, fill=col)
                draw.text((88, y_pos + 38), "Status: Executing node" if is_active else "Status: Ready in sequence", font=self.font_caption, fill=(203, 213, 225))
                if s_i < 3:
                    draw.polygon([(365, y_pos + 66), (360, y_pos + 77), (370, y_pos + 77)], fill=(255, 255, 255))
                    draw.rectangle([364, y_pos + 64, 366, y_pos + 77], fill=(255, 255, 255))
                y_pos += 84

            draw.rounded_rectangle([710, 120, width - 40, 520], radius=12, fill=(22, 27, 34), outline=(56, 189, 248), width=2)
            draw.rectangle([710, 120, width - 40, 160], fill=(2, 132, 199))
            draw.text((730, 132), "UI EXPLORER & VALIDATION", font=self.font_subtitle, fill=(255, 255, 255))

            draw.text((730, 182), f"Active Focus: Step {active_step + 1}", font=self.font_body, fill=(245, 158, 11))
            draw.rectangle([730, 215, width - 60, 310], fill=(13, 17, 23), outline=(48, 54, 61))
            draw.text((745, 228), self._truncate(f"<workflow topic='{topic}' />", 42), font=self.font_code, fill=(244, 63, 94))
            draw.text((745, 255), f"<step index='{active_step + 1}' state='verified' />", font=self.font_code, fill=(56, 189, 248))
            draw.text((745, 282), "<fuzzySelector confidence='0.94' />", font=self.font_code, fill=(16, 185, 129))

            checks = [
                "Strict Native & Web Selector",
                "Fuzzy Element Match (0.85+)",
                "Computer Vision Anchor Fallback",
                "Exception Retry Scope Active"
            ]
            for c_i, chk in enumerate(checks):
                draw.text((740, 345 + c_i * 34), f"[OK] {chk}", font=self.font_caption, fill=(16, 185, 129))

        elif visual_type == "variables_data_manager":
            draw.rounded_rectangle([40, 120, width - 40, 300], radius=12, fill=(15, 23, 42), outline=(56, 189, 248), width=2)
            draw.rectangle([40, 120, width - 40, 160], fill=(30, 41, 59))
            draw.text((60, 132), self._truncate(f"DATA MANAGER & VARIABLES // {topic}", 68), font=self.font_subtitle, fill=(56, 189, 248))

            draw.rectangle([50, 170, width - 50, 205], fill=(51, 65, 85))
            draw.text((65, 180), "VARIABLE NAME", font=self.font_code, fill=(255, 255, 255))
            draw.text((360, 180), "VARIABLE TYPE", font=self.font_code, fill=(255, 255, 255))
            draw.text((680, 180), "SCOPE", font=self.font_code, fill=(255, 255, 255))
            draw.text((950, 180), "VALUE", font=self.font_code, fill=(255, 255, 255))

            var_rows = [
                ("dt_PipelineRecords", "System.Data.DataTable", "Main Sequence", "Loaded"),
                ("in_WorkflowTopic", "System.String", "Process Scope", f"\"{self._truncate(topic, 18)}\""),
                ("out_ValidationPass", "System.Boolean", "Process Scope", "True"),
                ("queue_Transaction", "UiPath.Core.QueueItem", "Global Scope", "Active")
            ]
            for v_i, (vname, vtype, vscope, vdef) in enumerate(var_rows):
                y_v = 215 + v_i * 22
                hi = (v_i == active_step)
                draw.text((65, y_v), vname, font=self.font_code_sm, fill=(255, 255, 255) if hi else (56, 189, 248))
                draw.text((360, y_v), vtype, font=self.font_code_sm, fill=(245, 158, 11))
                draw.text((680, y_v), vscope, font=self.font_code_sm, fill=(203, 213, 225))
                draw.text((950, y_v), vdef, font=self.font_code_sm, fill=(16, 185, 129) if hi else (148, 163, 184))

            draw.rounded_rectangle([40, 315, width - 40, 520], radius=12, fill=(22, 27, 34), outline=(16, 185, 129), width=2)
            draw.text((60, 328), "PROCESSING QUEUE TELEMETRY (IN-MEMORY DATATABLE)", font=self.font_subtitle, fill=(16, 185, 129))

            draw.rectangle([50, 360, width - 50, 395], fill=(30, 41, 59))
            draw.text((65, 370), "ITEM ID", font=self.font_code, fill=(255, 255, 255))
            draw.text((240, 370), "WORKFLOW STAGE", font=self.font_code, fill=(255, 255, 255))
            draw.text((780, 370), "CONFIDENCE", font=self.font_code, fill=(255, 255, 255))
            draw.text((1020, 370), "STATUS", font=self.font_code, fill=(255, 255, 255))

            for r_i, pt in enumerate(points[:4]):
                y_d = 405 + r_i * 26
                status = "COMPLETED" if r_i <= active_step else "QUEUED"
                st_col = (16, 185, 129) if status == "COMPLETED" else (56, 189, 248)
                draw.text((65, y_d), f"TXN-{101 + r_i}", font=self.font_code_sm, fill=(226, 232, 240))
                draw.text((240, y_d), self._truncate(pt, 46), font=self.font_code_sm, fill=(226, 232, 240))
                draw.text((780, y_d), "99.8%", font=self.font_code_sm, fill=(16, 185, 129))
                draw.text((1020, y_d), status, font=self.font_code_sm, fill=st_col)

        elif visual_type == "live_execution_console":
            draw.rounded_rectangle([40, 120, width - 40, 520], radius=12, fill=(10, 15, 23), outline=(16, 185, 129), width=2)
            draw.rectangle([40, 120, width - 40, 160], fill=(22, 27, 34))
            draw.text((60, 132), "UIPATH ROBOT EXECUTION CONSOLE // LIVE STREAM", font=self.font_subtitle, fill=(16, 185, 129))

            draw.rounded_rectangle([width - 250, 128, width - 60, 152], radius=6, fill=(6, 78, 59), outline=(16, 185, 129))
            draw.text((width - 235, 134), "ROBOT ACTIVE (0 ERRORS)", font=self.font_code_sm, fill=(167, 243, 208))

            logs = [
                ("[INF 00:01]", f"Initialized runtime for: {self._truncate(topic, 55)}", (56, 189, 248)),
                ("[INF 00:02]", f"Stage 1: {self._truncate(points[0], 62)}", (16, 185, 129)),
                ("[INF 00:03]", f"Stage 2: {self._truncate(points[1], 62)}", (245, 158, 11)),
                ("[INF 00:04]", f"Stage 3: {self._truncate(points[2], 62)}", (56, 189, 248)),
                ("[INF 00:05]", f"Stage 4: {self._truncate(points[3], 62)}", (16, 185, 129)),
                ("[OK  00:06]", "Orchestrator queue dispatch & telemetry verified (100% pass).", (168, 85, 247)),
            ]
            visible_count = 3 + active_step * 2
            for l_i, (tag, msg, col) in enumerate(logs[:visible_count]):
                y_log = 185 + l_i * 50
                draw.text((65, y_log), tag, font=self.font_code, fill=col)
                draw.text((205, y_log), msg, font=self.font_code, fill=(241, 245, 249))

        else:
            draw.rounded_rectangle([40, 120, width - 40, 520], radius=12, fill=(15, 23, 42), outline=(255, 102, 0), width=2)
            draw.rectangle([40, 120, width - 40, 160], fill=(255, 102, 0))
            draw.text((60, 132), "DEPLOYMENT & COMMUNITY BEST PRACTICES", font=self.font_subtitle, fill=(255, 255, 255))

            draw.rounded_rectangle([70, 180, 580, 330], radius=10, fill=(30, 41, 59), outline=(56, 189, 248), width=2 if active_step == 0 else 1)
            draw.text((90, 195), "ORCHESTRATOR PACKAGE PUBLISHED", font=self.font_subtitle, fill=(56, 189, 248))
            draw.text((90, 235), self._truncate(f"Package: AJIET.{re.sub(r'[^A-Za-z0-9]+', '', topic)[:20]}.1.0", 44), font=self.font_code_sm, fill=(226, 232, 240))
            draw.text((90, 265), "Runtime: Unattended Robot Fleet", font=self.font_code_sm, fill=(226, 232, 240))
            draw.text((90, 295), "Verification: QA Passed & CEO Approved", font=self.font_code_sm, fill=(16, 185, 129))

            draw.rounded_rectangle([620, 180, width - 70, 330], radius=10, fill=(30, 41, 59), outline=(245, 158, 11), width=2 if active_step == 1 else 1)
            draw.text((640, 195), "KEY TAKEAWAYS", font=self.font_subtitle, fill=(245, 158, 11))
            for k_i, pt in enumerate(points[:3]):
                draw.text((640, 235 + k_i * 30), f"{k_i + 1}. {self._truncate(pt, 44)}", font=self.font_caption, fill=(226, 232, 240))

            draw.rounded_rectangle([70, 350, width - 70, 490], radius=10, fill=(24, 24, 27), outline=(225, 29, 72), width=2 if active_step == 2 else 1)
            draw.text((90, 370), "UIPATH COMMUNITY AJIET // AUTONOMIA MEDIA", font=self.font_subtitle, fill=(244, 63, 94))
            draw.text((90, 410), "• Complete workflow templates and guides available in the Media Vault", font=self.font_body, fill=(226, 232, 240))
            draw.text((90, 445), "• Subscribe for weekly autonomous engineering masterclasses", font=self.font_body, fill=(226, 232, 240))

        # 4. Clean Live Caption & Telemetry Stage (535px to 675px)
        # Left zone reserved for burned-in synchronized drawtext subtitles; right zone for waveform & AURI mascot
        draw.rounded_rectangle([36, 535, width - 36, 675], radius=12, fill=(10, 15, 25), outline=(51, 65, 85), width=2)
        draw.text((54, 548), f"SCENE {scene_idx + 1}/{total_scenes}  •  LIVE NARRATION CAPTIONS", font=self.font_caption, fill=(100, 116, 139))

        # 5. Bottom Timeline Scrubber & Chapter Notches
        draw.rectangle([0, height - 38, width, height], fill=(11, 15, 23))
        draw.rectangle([36, height - 20, width - 36, height - 12], fill=(30, 41, 59))
        progress_ratio = (scene_idx + 1) / max(1, total_scenes)
        draw.rectangle([36, height - 20, int(36 + (width - 72) * progress_ratio), height - 12], fill=(255, 102, 0))

        for ch in range(1, total_scenes):
            notch_x = int(36 + (width - 72) * (ch / total_scenes))
            draw.rectangle([notch_x - 1, height - 24, notch_x + 1, height - 8], fill=(255, 255, 255))

        draw.text((36, height - 34), f"Autonomia Masterclass  |  Scene {scene_idx + 1} of {total_scenes}", font=self.font_footer, fill=(148, 163, 184))

        # 6. Live Voice Waveform Box
        draw.rounded_rectangle([width - 360, height - 96, width - 140, height - 45], radius=6, fill=(15, 23, 42), outline=(51, 65, 85), width=1)
        draw.text((width - 350, height - 92), "VOICE WAVEFORM", font=self.font_caption, fill=(100, 116, 139))
        return img

    def get_audio_duration(self, audio_path: Path) -> float:
        """Returns exact duration in seconds of an audio file using ffmpeg."""
        cmd = [self.ffmpeg_exe, "-i", str(audio_path)]
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        m = re.search(r"Duration:\s*(\d+):(\d+):(\d+\.\d+)", res.stderr)
        if m:
            h, m_m, s = float(m.group(1)), float(m.group(2)), float(m.group(3))
            return h * 3600 + m_m * 60 + s
        return 10.0

    @staticmethod
    def _build_drawtext_subtitles(narration_text: str, duration: float, y_expr: str = "h-120", font_size: int = 22, chunk_size: int = 8) -> List[str]:
        words = (narration_text or "").split()
        sub_filters = []
        if not words:
            return sub_filters
        chunks = [" ".join(words[i:i + chunk_size]) for i in range(0, len(words), chunk_size)]
        t_per_chunk = max(0.5, duration / len(chunks))
        for c_idx, chunk in enumerate(chunks):
            t_s = round(c_idx * t_per_chunk, 2)
            t_e = round(min(duration, (c_idx + 1) * t_per_chunk), 2)
            safe_c = chunk.replace("\\", "\\\\").replace(":", "\\:").replace("'", "").replace('"', '').replace("%", "\\%")
            sub_filters.append(
                f"drawtext=fontfile={UBUNTU_BOLD_FONT}:text='{safe_c}':"
                f"x=56:y={y_expr}:fontsize={font_size}:fontcolor=white:box=1:boxcolor=black@0.72:boxborderw=8:"
                f"enable='between(t,{t_s},{t_e})'"
            )
        return sub_filters

    async def render_single_scene(self, project_dir: str | Path, scene: Dict[str, Any], total_scenes: int = 6) -> Path:
        """
        Renders an individual scene segment into an isolated MP4 file with
        3 progressive step keyframes, full-duration Ken Burns motion,
        fade transitions, live waveform, mascot overlay, and synchronized captions.
        """
        p_dir = Path(project_dir)
        scenes_dir = p_dir / "scenes"
        scenes_dir.mkdir(parents=True, exist_ok=True)
        temp_dir = p_dir / "temp_repair"
        temp_dir.mkdir(parents=True, exist_ok=True)

        scene_id = scene.get("scene_id", f"scene_{scene.get('scene_number', 1):02d}")
        idx = scene.get("scene_number", 1) - 1

        # 1. Synthesize audio if missing
        audio_path = p_dir / "audio" / f"{scene_id}.wav"
        audio_path.parent.mkdir(parents=True, exist_ok=True)
        if not audio_path.exists() or audio_path.stat().st_size < 500:
            narration_text = scene.get("narration", scene.get("title", ""))
            self.tts.synthesize_speech(narration_text, audio_path)

        duration = self.get_audio_duration(audio_path)
        scene["duration"] = max(duration, 4.0) + 0.45
        dur = float(scene["duration"])

        # 2. Render 3 Progressive Keyframe Stages for animated step highlights
        frame_paths: List[Path] = []
        for step_idx in range(3):
            frame_img = self.render_scene_frame(
                scene, scene_idx=idx, total_scenes=total_scenes, width=1280, height=720, active_step=step_idx
            )
            fp = temp_dir / f"{scene_id}_step_{step_idx}.png"
            frame_img.save(fp)
            frame_paths.append(fp)

        # Build concat file for progressive keyframes across full scene duration
        seg_dur = dur / 3.0
        frames_concat = temp_dir / f"{scene_id}_frames.txt"
        with open(frames_concat, "w") as f:
            for fp in frame_paths:
                f.write(f"file '{fp.resolve()}'\n")
                f.write(f"duration {seg_dur:.3f}\n")
            f.write(f"file '{frame_paths[-1].resolve()}'\n")

        # 3. Render Scene Video Segment with Full-Duration Motion, Transitions & Overlays
        scene_mp4 = scenes_dir / f"{scene_id}.mp4"
        total_frames = max(120, int(dur * 30) + 15)

        if idx % 3 == 0:
            zoom_filter = f"zoompan=z='min(zoom+0.00025,1.08)':d={total_frames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1280x720:fps=30"
        elif idx % 3 == 1:
            zoom_filter = f"zoompan=z=1.05:d={total_frames}:x='if(lte(on,1),(iw-iw/zoom)/2,x+0.25)':y='ih/2-(ih/zoom/2)':s=1280x720:fps=30"
        else:
            zoom_filter = f"zoompan=z='max(1.08-0.00025*on,1.0)':d={total_frames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1280x720:fps=30"

        fade_out_st = max(0.0, dur - 0.35)
        fade_filter = f"fade=t=in:st=0:d=0.35,fade=t=out:st={fade_out_st:.2f}:d=0.35"

        narration_text = scene.get("narration", scene.get("title", ""))
        sub_filters = self._build_drawtext_subtitles(narration_text, dur, y_expr="h-115", font_size=22, chunk_size=8)

        try:
            audio_filter = "[1:a]apad=pad_dur=0.45,loudnorm=I=-16:TP=-1.5:LRA=11[aout]"
            if AURI_WORKING_GIF.exists():
                filter_complex = (
                    f"[0:v]fps=30,scale=1280:720,{fade_filter}[bg];"
                    f"{audio_filter};"
                    f"[1:a]showwaves=s=200x36:mode=line:colors=0x38bdf8@0.9:scale=sqrt[wave];"
                    f"[2:v]scale=96:96[mascot];"
                    f"[bg][mascot]overlay=W-132:H-158:shortest=1[v1];"
                    f"[v1][wave]overlay=W-348:H-82[v2];"
                    f"[v2]drawbox=x=36:y=702:w='(t/{dur:.2f})*(1280-72)':h=8:color=0xff6600:t=fill[v3]"
                )
                if sub_filters:
                    filter_complex += f";[v3]{','.join(sub_filters)}[vout]"
                    out_map = "[vout]"
                else:
                    out_map = "[v3]"

                cmd = [
                    self.ffmpeg_exe, "-y",
                    "-f", "concat", "-safe", "0", "-i", str(frames_concat),
                    "-i", str(audio_path),
                    "-ignore_loop", "0", "-i", str(AURI_WORKING_GIF),
                    "-filter_complex", filter_complex,
                    "-map", out_map,
                    "-map", "[aout]",
                    "-c:v", "libx264",
                    "-preset", "veryfast",
                    "-t", f"{dur:.2f}",
                    "-pix_fmt", "yuv420p",
                    "-r", "30",
                    "-c:a", "aac",
                    "-b:a", "192k",
                    str(scene_mp4)
                ]
            else:
                filter_complex = (
                    f"[0:v]fps=30,{zoom_filter},{fade_filter}[bg];"
                    f"{audio_filter};"
                    f"[bg]drawbox=x=36:y=702:w='(t/{dur:.2f})*(1280-72)':h=8:color=0xff6600:t=fill[v1]"
                )
                if sub_filters:
                    filter_complex += f";[v1]{','.join(sub_filters)}[vout]"
                    out_map = "[vout]"
                else:
                    out_map = "[v1]"
                cmd = [
                    self.ffmpeg_exe, "-y",
                    "-f", "concat", "-safe", "0", "-i", str(frames_concat),
                    "-i", str(audio_path),
                    "-filter_complex", filter_complex,
                    "-map", out_map,
                    "-map", "[aout]",
                    "-c:v", "libx264",
                    "-preset", "veryfast",
                    "-t", f"{dur:.2f}",
                    "-pix_fmt", "yuv420p",
                    "-r", "30",
                    "-c:a", "aac",
                    "-b:a", "192k",
                    str(scene_mp4)
                ]
            subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        except Exception:
            cmd_fallback = [
                self.ffmpeg_exe, "-y",
                "-loop", "1",
                "-i", str(frame_paths[0]),
                "-i", str(audio_path),
                "-c:v", "libx264",
                "-preset", "veryfast",
                "-t", f"{dur:.2f}",
                "-pix_fmt", "yuv420p",
                "-r", "30",
                "-c:a", "aac",
                "-b:a", "192k",
                "-shortest",
                str(scene_mp4)
            ]
            subprocess.run(cmd_fallback, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        for fp in frame_paths + [frames_concat]:
            try:
                fp.unlink(missing_ok=True)
            except Exception:
                pass

        return scene_mp4

    async def assemble_video_from_scenes(self, project_dir: str | Path, scenes: List[Dict[str, Any]]) -> Path:
        """
        Assembles all individual scene MP4 segments into a cohesive 16:9 Master Video
        and animated 9:16 Vertical Reel with audio and synchronized captions.
        Preserves approved unaffected scenes during autonomous repair.
        """
        p_dir = Path(project_dir)
        scenes_dir = p_dir / "scenes"
        temp_dir = p_dir / "temp_assembly"
        temp_dir.mkdir(parents=True, exist_ok=True)

        # 1. Verify or generate all scene segments
        scene_files = []
        audio_files = []
        for idx, sc in enumerate(scenes):
            sc_id = sc.get("scene_id", f"scene_{idx+1:02d}")
            sc_file = scenes_dir / f"{sc_id}.mp4"
            aud_file = p_dir / "audio" / f"{sc_id}.wav"

            if not sc_file.exists():
                await self.render_single_scene(p_dir, sc, total_scenes=len(scenes))

            scene_files.append(sc_file)
            if aud_file.exists():
                audio_files.append(aud_file)

        # 2. Assemble 16:9 Master MP4 with faststart for browser streaming
        concat_txt = temp_dir / "master_concat.txt"
        with open(concat_txt, "w") as f:
            for sf in scene_files:
                f.write(f"file '{sf.resolve()}'\n")

        master_mp4 = p_dir / "master_16x9.mp4"
        cmd_concat = [
            self.ffmpeg_exe, "-y",
            "-f", "concat",
            "-safe", "0",
            "-i", str(concat_txt),
            "-c:v", "copy",
            "-c:a", "aac",
            "-b:a", "192k",
            "-movflags", "+faststart",
            str(master_mp4)
        ]
        subprocess.run(cmd_concat, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        # 3. Concatenate Full Audio Track
        full_audio_wav = p_dir / "full_narration.wav"
        if audio_files:
            aud_concat_txt = temp_dir / "audio_concat.txt"
            with open(aud_concat_txt, "w") as f:
                for af in audio_files:
                    f.write(f"file '{af.resolve()}'\n")

            cmd_aud = [
                self.ffmpeg_exe, "-y",
                "-f", "concat",
                "-safe", "0",
                "-i", str(aud_concat_txt),
                "-c", "copy",
                str(full_audio_wav)
            ]
            subprocess.run(cmd_aud, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        # 4. Generate SRT Subtitles & YouTube Chapters
        sub_gen = SubtitleGenerator()
        sub_srt = p_dir / "subtitles.srt"
        sub_gen.generate_srt(scenes, sub_srt)

        chapters_lines = []
        t_cursor = 0.0
        for idx, sc in enumerate(scenes):
            mins = int(t_cursor // 60)
            secs = int(t_cursor % 60)
            ch_label = sc.get("chapter") or sc.get("title") or f"Scene {idx + 1}"
            chapters_lines.append(f"{mins:02d}:{secs:02d} {ch_label}")
            t_cursor += float(sc.get("duration", 5.0))
        (p_dir / "chapters.txt").write_text("\n".join(chapters_lines) + "\n", encoding="utf-8")

        # 5. Render Animated 9:16 Vertical Instagram Reel
        total_scenes = len(scenes)
        reel_segments: List[Path] = []
        for idx, scene in enumerate(scenes):
            sc_id = scene.get("scene_id", f"scene_{idx+1:02d}")
            aud_file = p_dir / "audio" / f"{sc_id}.wav"
            sc_dur = max(float(scene.get("duration", 5.0)), 4.0)

            frame_vertical = Image.new("RGB", (720, 1280), (13, 17, 23))
            d_v = ImageDraw.Draw(frame_vertical)

            d_v.rectangle([0, 0, 720, 90], fill=(255, 102, 0))
            d_v.text((40, 32), "UiPath Community AJIET | Reels", font=self.font_header, fill=(255, 255, 255))

            horiz = self.render_scene_frame(scene, scene_idx=idx, total_scenes=total_scenes, width=1280, height=720, active_step=idx % 3)
            horiz_resized = horiz.resize((680, 382), Image.Resampling.BILINEAR)
            frame_vertical.paste(horiz_resized, (20, 115))

            d_v.rounded_rectangle([30, 520, 690, 880], radius=16, fill=(22, 27, 34), outline=(56, 189, 248), width=2)
            d_v.text((50, 540), self._truncate(scene.get("title", "").upper(), 36), font=self.font_subtitle, fill=(0, 229, 255))
            d_v.text((50, 575), "LIVE CAPTIONS", font=self.font_caption, fill=(100, 116, 139))

            d_v.rounded_rectangle([30, 905, 690, 1165], radius=16, fill=(15, 23, 42), outline=(255, 102, 0), width=2)
            d_v.text((50, 930), "AUTOMATION QUICK TIP", font=self.font_subtitle, fill=(255, 102, 0))
            d_v.text((50, 975), "Follow @uipath_ajiet on Instagram", font=self.font_body, fill=(255, 255, 255))
            d_v.text((50, 1015), "Save this Reel for your next RPA lab!", font=self.font_body, fill=(148, 163, 184))

            v_png = temp_dir / f"reel_frame_{idx:02d}.png"
            frame_vertical.save(v_png)

            v_seg_mp4 = temp_dir / f"reel_seg_{idx:02d}.mp4"
            reel_subs = self._build_drawtext_subtitles(
                scene.get("narration", scene.get("title", "")),
                sc_dur,
                y_expr="630",
                font_size=24,
                chunk_size=5
            )
            fade_out_st = max(0.0, sc_dur - 0.3)
            vf_parts = [
                f"fade=t=in:st=0:d=0.3,fade=t=out:st={fade_out_st:.2f}:d=0.3",
                f"drawbox=x=30:y=1240:w='(t/{sc_dur:.2f})*660':h=8:color=0xff6600:t=fill"
            ] + reel_subs

            if aud_file.exists():
                cmd_vseg = [
                    self.ffmpeg_exe, "-y",
                    "-loop", "1", "-i", str(v_png),
                    "-i", str(aud_file),
                    "-vf", ",".join(vf_parts),
                    "-c:v", "libx264", "-preset", "veryfast",
                    "-t", f"{sc_dur:.2f}",
                    "-pix_fmt", "yuv420p", "-r", "30",
                    "-c:a", "aac", "-b:a", "192k",
                    str(v_seg_mp4)
                ]
            else:
                cmd_vseg = [
                    self.ffmpeg_exe, "-y",
                    "-loop", "1", "-i", str(v_png),
                    "-vf", ",".join(vf_parts),
                    "-c:v", "libx264", "-preset", "veryfast",
                    "-t", f"{sc_dur:.2f}",
                    "-pix_fmt", "yuv420p", "-r", "30",
                    str(v_seg_mp4)
                ]
            subprocess.run(cmd_vseg, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            reel_segments.append(v_seg_mp4)

        reel_concat_txt = temp_dir / "reel_concat.txt"
        with open(reel_concat_txt, "w") as f:
            for rseg in reel_segments:
                f.write(f"file '{rseg.resolve()}'\n")

        reel_mp4 = p_dir / "reel_9x16.mp4"
        cmd_reel = [
            self.ffmpeg_exe, "-y",
            "-f", "concat",
            "-safe", "0",
            "-i", str(reel_concat_txt),
            "-c:v", "copy",
            "-c:a", "aac",
            "-b:a", "192k",
            "-movflags", "+faststart",
            str(reel_mp4)
        ]
        subprocess.run(cmd_reel, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        shutil.rmtree(temp_dir, ignore_errors=True)
        return master_mp4

    async def render_project_video(self, project_id: str, script_data: Dict[str, Any], output_dir: str | Path) -> Dict[str, str]:
        """
        Master Pipeline Method:
        1. Synthesizes neural audio per scene.
        2. Renders isolated scene segments with progressive animation.
        3. Creates structured Production Manifest (production_manifest.json).
        4. Assembles 16:9 Master Video and animated 9:16 Vertical Reel.
        """
        out_dir = Path(output_dir)
        out_dir.mkdir(parents=True, exist_ok=True)
        audio_dir = out_dir / "audio"
        scenes_dir = out_dir / "scenes"
        audio_dir.mkdir(parents=True, exist_ok=True)
        scenes_dir.mkdir(parents=True, exist_ok=True)

        project_title = script_data.get("title", "UiPath Studio Masterclass")
        scenes = script_data.get("scenes", [])
        if not scenes:
            from backend.app.engine.llm_provider import HeuristicLLMProvider
            provider = HeuristicLLMProvider()
            raw = await provider.generate(project_title, role="scriptwriter")
            parsed = json.loads(raw)
            scenes = parsed.get("scenes", [])

        # 1. Synthesize Audio and Setup Timestamps
        total_time = 0.0
        structured_scenes = []
        for idx, scene in enumerate(scenes):
            scene_id = f"scene_{idx+1:02d}"
            scene["scene_id"] = scene_id
            scene["scene_number"] = idx + 1
            scene.setdefault("topic", project_title)

            audio_file = audio_dir / f"{scene_id}.wav"
            narration_text = scene.get("narration", scene.get("title", ""))
            self.tts.synthesize_speech(narration_text, audio_file)
            dur = max(self.get_audio_duration(audio_file), 4.0) + 0.45

            scene["start_timestamp"] = round(total_time, 2)
            scene["end_timestamp"] = round(total_time + dur, 2)
            scene["duration"] = round(dur, 2)
            scene["voiceover_asset"] = str(audio_file)
            scene["visual_description"] = scene.get("chapter", scene.get("title", ""))
            scene["expected_narration"] = narration_text
            scene["generation_history"] = [{
                "action": "initial_generation",
                "timestamp": datetime.utcnow().isoformat()
            }]
            total_time += dur
            structured_scenes.append(scene)

        # 2. Render Each Scene Segment
        for sc in structured_scenes:
            await self.render_single_scene(out_dir, sc, total_scenes=len(structured_scenes))

        # 3. Assemble Complete Master Video & Reel
        await self.assemble_video_from_scenes(out_dir, structured_scenes)

        # 4. Generate & Save Video Production Manifest
        manifest = {
            "project_id": project_id,
            "title": project_title,
            "target_platform": "youtube_and_instagram",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "status": "draft",
            "total_duration": round(total_time, 2),
            "scenes": structured_scenes,
            "assembled_master_path": str(out_dir / "master_16x9.mp4"),
            "assembled_reel_path": str(out_dir / "reel_9x16.mp4"),
            "repair_attempts": 0,
            "quality_score": 0.0,
            "defects": []
        }

        manifest_file = out_dir / "production_manifest.json"
        manifest_file.write_text(json.dumps(manifest, indent=2), encoding="utf-8")

        return {
            "master_16x9": f"/media/{project_id}/master_16x9.mp4",
            "reel_9x16": f"/media/{project_id}/reel_9x16.mp4",
            "subtitles": f"/media/{project_id}/subtitles.srt",
            "chapters": f"/media/{project_id}/chapters.txt",
            "narration_audio": f"/media/{project_id}/full_narration.wav",
            "manifest": f"/media/{project_id}/production_manifest.json"
        }
