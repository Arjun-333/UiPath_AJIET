"""
Masterclass Video Renderer for Project Autonomia.
Composes 1080p HTML5/CSS/SVG UiPath Studio simulations via Headless Chrome,
live Playwright browser demo captures, progressive step keyframes,
procedural ambient synth pad with sidechain ducking, styled ASS subtitles,
and produces:
1. 1920x1080 (1080p) Landscape Master MP4 (-crf 20, -16 LUFS, faststart)
2. 1080x1920 Vertical Instagram Reel MP4 with styled ASS captions
3. SRT, ASS, and YouTube Chapters packaging
"""

import subprocess
import shutil
import json
import re
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional
from PIL import Image, ImageDraw, ImageFont
import imageio_ffmpeg

from backend.app.config import FFMPEG_PATH
from backend.app.media.tts_engine import TTSEngine
from backend.app.media.subtitle_generator import SubtitleGenerator
from backend.app.media.audio_bed import generate_ambient_bed

UBUNTU_BOLD_FONT = "/usr/share/fonts/truetype/ubuntu/Ubuntu-B.ttf"
AURI_WORKING_GIF = Path("/home/arjun/Desktop/PROJECTS/UiPathAJIET/frontend/public/assets/sprites/auri/orbi_working.gif")
CHROME_RENDERER_SCRIPT = Path(__file__).resolve().parent / "chrome_scene_renderer.mjs"


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

    def _render_frames_with_chrome(self, jobs: List[Dict[str, Any]], config_path: Path) -> bool:
        """Renders crisp 1080p HTML5/CSS/SVG frames via Headless Chrome. Returns True on success."""
        if not CHROME_RENDERER_SCRIPT.exists():
            return False
        try:
            config_path.write_text(json.dumps({"mode": "frames", "jobs": jobs}), encoding="utf-8")
            res = subprocess.run(
                ["node", str(CHROME_RENDERER_SCRIPT), str(config_path)],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                timeout=60
            )
            return res.returncode == 0 and all(Path(j["outputPath"]).exists() for j in jobs)
        except Exception:
            return False

    def _record_live_demo_with_chrome(self, output_dir: Path, topic: str) -> Optional[Path]:
        """Records a real interactive Playwright browser automation demo clip (.webm)."""
        if not CHROME_RENDERER_SCRIPT.exists():
            return None
        try:
            cfg = output_dir / "demo_job.json"
            cfg.write_text(json.dumps({
                "mode": "demo",
                "outputDir": str(output_dir),
                "topic": topic,
                "width": 1280,
                "height": 720
            }), encoding="utf-8")
            res = subprocess.run(
                ["node", str(CHROME_RENDERER_SCRIPT), str(cfg)],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                timeout=45
            )
            if res.returncode == 0:
                for line in reversed(res.stdout.strip().splitlines()):
                    if line.startswith("{"):
                        data = json.loads(line)
                        p = Path(data.get("demoVideoPath", ""))
                        if p.exists():
                            return p
        except Exception:
            pass
        return None

    def render_scene_frame(
        self,
        scene: Dict[str, Any],
        scene_idx: int = 0,
        total_scenes: int = 6,
        width: int = 1920,
        height: int = 1080,
        active_step: int = 0
    ) -> Image.Image:
        """
        Pillow fallback frame renderer when Headless Chrome is unavailable.
        Renders at 1280x720 and upscales cleanly if needed.
        """
        bw, bh = 1280, 720
        img = Image.new("RGB", (bw, bh), (13, 17, 23))
        draw = ImageDraw.Draw(img)

        topic = scene.get("topic") or scene.get("title") or "UiPath Studio Automation"
        title = scene.get("title", "UiPath Studio Automation")
        points = self._extract_topic_points(scene, count=4)

        draw.rectangle([0, 0, bw, 52], fill=(255, 102, 0))
        draw.text((36, 15), "UiPath Community AJIET | Autonomia Production Studio", font=self.font_header, fill=(255, 255, 255))
        chapter_str = self._truncate(scene.get("chapter", f"Chapter {scene_idx + 1}"), 36)
        draw.rectangle([bw - 360, 10, bw - 36, 42], fill=(234, 88, 12), outline=(255, 255, 255), width=1)
        draw.text((bw - 345, 16), chapter_str, font=self.font_footer, fill=(255, 255, 255))

        draw.rectangle([36, 64, bw - 36, 108], fill=(22, 27, 34), outline=(48, 54, 61), width=1)
        draw.text((50, 72), f"TOPIC: {self._truncate(title.upper(), 68)}", font=self.font_title, fill=(0, 229, 255))

        draw.rounded_rectangle([40, 124, bw - 40, 520], radius=12, fill=(15, 23, 42), outline=(56, 189, 248), width=2)
        draw.text((64, 144), self._truncate(f"WORKFLOW OVERVIEW: {topic}", 70), font=self.font_subtitle, fill=(56, 189, 248))
        for i, pt in enumerate(points):
            hi = (i == active_step)
            draw.rounded_rectangle([64, 195 + i * 74, bw - 64, 252 + i * 74], radius=8, fill=(30, 41, 59), outline=(16, 185, 129) if hi else (51, 65, 85), width=2 if hi else 1)
            draw.text((84, 212 + i * 74), f"{i + 1}. {pt}", font=self.font_body, fill=(255, 255, 255) if hi else (203, 213, 225))

        draw.rounded_rectangle([36, 535, bw - 36, 675], radius=12, fill=(10, 15, 25), outline=(51, 65, 85), width=2)
        draw.text((54, 548), f"SCENE {scene_idx + 1}/{total_scenes}  •  LIVE NARRATION CAPTIONS", font=self.font_caption, fill=(100, 116, 139))

        draw.rectangle([0, bh - 38, bw, bh], fill=(11, 15, 23))
        draw.rectangle([36, bh - 20, bw - 36, bh - 12], fill=(30, 41, 59))
        progress_ratio = (scene_idx + 1) / max(1, total_scenes)
        draw.rectangle([36, bh - 20, int(36 + (bw - 72) * progress_ratio), bh - 12], fill=(255, 102, 0))

        if width != bw or height != bh:
            img = img.resize((width, height), Image.Resampling.LANCZOS)
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

    async def render_single_scene(self, project_dir: str | Path, scene: Dict[str, Any], total_scenes: int = 6) -> Path:
        """
        Renders an isolated 1080p scene segment (1920x1080, 30fps, -crf 20)
        using Headless Chrome HTML5/CSS/SVG keyframes, optional live browser demo PiP,
        fade transitions, live voice waveform, and AURI mascot overlay.
        """
        p_dir = Path(project_dir)
        scenes_dir = p_dir / "scenes"
        scenes_dir.mkdir(parents=True, exist_ok=True)
        temp_dir = p_dir / "temp_repair"
        temp_dir.mkdir(parents=True, exist_ok=True)

        scene_id = scene.get("scene_id", f"scene_{scene.get('scene_number', 1):02d}")
        idx = scene.get("scene_number", 1) - 1
        topic = scene.get("topic") or scene.get("title") or "UiPath Studio Automation"

        # 1. Synthesize audio if missing
        audio_path = p_dir / "audio" / f"{scene_id}.wav"
        audio_path.parent.mkdir(parents=True, exist_ok=True)
        if not audio_path.exists() or audio_path.stat().st_size < 500:
            narration_text = scene.get("narration", scene.get("title", ""))
            self.tts.synthesize_speech(narration_text, audio_path)

        duration = self.get_audio_duration(audio_path)
        scene["duration"] = max(duration, 4.0) + 0.45
        dur = float(scene["duration"])

        # 2. Render 3 Progressive 1080p Keyframe Stages via Headless Chrome (fallback to Pillow)
        points = self._extract_topic_points(scene, count=4)
        frame_paths: List[Path] = []
        jobs: List[Dict[str, Any]] = []
        for step_idx in range(3):
            fp = temp_dir / f"{scene_id}_step_{step_idx}.png"
            frame_paths.append(fp)
            jobs.append({
                "width": 1920,
                "height": 1080,
                "sceneIndex": idx,
                "totalScenes": total_scenes,
                "activeStep": step_idx,
                "topic": topic,
                "chapter": scene.get("chapter", f"Chapter {idx + 1}"),
                "title": scene.get("title", topic),
                "visualType": scene.get("visual_type", "studio_ide_walkthrough"),
                "points": points,
                "outputPath": str(fp)
            })

        chrome_ok = self._render_frames_with_chrome(jobs, temp_dir / f"{scene_id}_jobs.json")
        if not chrome_ok:
            for step_idx, fp in enumerate(frame_paths):
                img = self.render_scene_frame(
                    scene, scene_idx=idx, total_scenes=total_scenes, width=1920, height=1080, active_step=step_idx
                )
                img.save(fp)

        # Optional Live Browser Demo Recording for execution scenes
        demo_clip: Optional[Path] = None
        if scene.get("visual_type") == "live_execution_console" or scene.get("include_live_demo"):
            demo_clip = self._record_live_demo_with_chrome(temp_dir / f"{scene_id}_demo", topic)

        seg_dur = dur / 3.0
        frames_concat = temp_dir / f"{scene_id}_frames.txt"
        with open(frames_concat, "w") as f:
            for fp in frame_paths:
                f.write(f"file '{fp.resolve()}'\n")
                f.write(f"duration {seg_dur:.3f}\n")
            f.write(f"file '{frame_paths[-1].resolve()}'\n")

        # 3. Render 1080p Scene Segment
        scene_mp4 = scenes_dir / f"{scene_id}.mp4"
        fade_out_st = max(0.0, dur - 0.35)
        fade_filter = f"fade=t=in:st=0:d=0.35,fade=t=out:st={fade_out_st:.2f}:d=0.35"

        try:
            inputs = ["-f", "concat", "-safe", "0", "-i", str(frames_concat), "-i", str(audio_path)]
            fc_parts = [f"[0:v]fps=30,scale=1920:1080,{fade_filter}[bg]"]
            audio_filter = "[1:a]apad=pad_dur=0.45[aout]"
            fc_parts.append(audio_filter)
            cur_v = "[bg]"
            next_idx = 2

            if demo_clip and demo_clip.exists():
                inputs.extend(["-stream_loop", "-1", "-i", str(demo_clip)])
                fc_parts.append(f"[{next_idx}:v]scale=760:428[demo]")
                fc_parts.append(f"{cur_v}[demo]overlay=W-830:220:shortest=1[vdemo]")
                cur_v = "[vdemo]"
                next_idx += 1

            fc_parts.append("[1:a]showwaves=s=280x54:mode=line:colors=0x38bdf8@0.9:scale=sqrt[wave]")
            if AURI_WORKING_GIF.exists():
                inputs.extend(["-ignore_loop", "0", "-i", str(AURI_WORKING_GIF)])
                fc_parts.append(f"[{next_idx}:v]scale=128:128[mascot]")
                fc_parts.append(f"{cur_v}[mascot]overlay=W-190:H-220:shortest=1[vmascot]")
                cur_v = "[vmascot]"

            fc_parts.append(f"{cur_v}[wave]overlay=W-500:H-148[vwave]")
            fc_parts.append(f"[vwave]drawbox=x=48:y=1068:w='(t/{dur:.2f})*(1920-96)':h=6:color=0xff6600:t=fill[vout]")

            cmd = [
                self.ffmpeg_exe, "-y",
                *inputs,
                "-filter_complex", ";".join(fc_parts),
                "-map", "[vout]",
                "-map", "[aout]",
                "-c:v", "libx264",
                "-preset", "fast",
                "-crf", "20",
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
                "-loop", "1", "-i", str(frame_paths[0]),
                "-i", str(audio_path),
                "-c:v", "libx264", "-preset", "fast", "-crf", "20",
                "-t", f"{dur:.2f}", "-pix_fmt", "yuv420p", "-r", "30",
                "-c:a", "aac", "-b:a", "192k", "-shortest",
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
        Assembles all 1080p scene segments into:
        - master_16x9.mp4 (1920x1080, ducked ambient music + -16 LUFS narration, styled ASS captions)
        - reel_9x16.mp4 (1080x1920 vertical reel with styled ASS captions & progress bar)
        - subtitles.srt, subtitles.ass, chapters.txt
        """
        p_dir = Path(project_dir)
        scenes_dir = p_dir / "scenes"
        temp_dir = p_dir / "temp_assembly"
        temp_dir.mkdir(parents=True, exist_ok=True)

        # 1. Verify or generate all scene segments
        scene_files: List[Path] = []
        for idx, sc in enumerate(scenes):
            sc_id = sc.get("scene_id", f"scene_{idx+1:02d}")
            sc_file = scenes_dir / f"{sc_id}.mp4"
            if not sc_file.exists():
                await self.render_single_scene(p_dir, sc, total_scenes=len(scenes))
            scene_files.append(sc_file)

        # 2. Generate SRT, Styled ASS Subtitles & YouTube Chapters
        sub_gen = SubtitleGenerator()
        sub_srt = p_dir / "subtitles.srt"
        sub_ass = p_dir / "subtitles.ass"
        reel_ass = temp_dir / "reel_subtitles.ass"
        sub_gen.generate_srt(scenes, sub_srt)
        sub_gen.generate_ass(scenes, sub_ass, width=1920, height=1080, chunk_words=4, margin_v=72, font_size=42)
        sub_gen.generate_ass(scenes, reel_ass, width=1080, height=1920, chunk_words=3, margin_v=580, font_size=54)

        chapters_lines = []
        t_cursor = 0.0
        for idx, sc in enumerate(scenes):
            mins = int(t_cursor // 60)
            secs = int(t_cursor % 60)
            ch_label = sc.get("chapter") or sc.get("title") or f"Scene {idx + 1}"
            chapters_lines.append(f"{mins:02d}:{secs:02d} {ch_label}")
            t_cursor += float(sc.get("duration", 5.0))
        (p_dir / "chapters.txt").write_text("\n".join(chapters_lines) + "\n", encoding="utf-8")

        # 3. Concatenate Raw Scene Video+Audio
        concat_txt = temp_dir / "master_concat.txt"
        with open(concat_txt, "w") as f:
            for sf in scene_files:
                f.write(f"file '{sf.resolve()}'\n")

        raw_master = temp_dir / "raw_master.mp4"
        subprocess.run([
            self.ffmpeg_exe, "-y", "-f", "concat", "-safe", "0", "-i", str(concat_txt),
            "-c", "copy", str(raw_master)
        ], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        # Extract full narration audio
        full_audio_wav = p_dir / "full_narration.wav"
        subprocess.run([
            self.ffmpeg_exe, "-y", "-i", str(raw_master), "-vn",
            "-ar", "24000", "-ac", "1", str(full_audio_wav)
        ], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        # 4. Mix Procedural Ambient Synth Pad with Sidechain Ducking + Burn Styled ASS Subtitles (1080p)
        total_dur = max(self.get_audio_duration(raw_master), 4.0)
        ambient_wav = temp_dir / "ambient_bed.wav"
        generate_ambient_bed(total_dur, ambient_wav)

        master_mp4 = p_dir / "master_16x9.mp4"
        ass_escaped = str(sub_ass.resolve()).replace("\\", "\\\\").replace(":", "\\:")
        try:
            filter_master = (
                f"[0:v]ass='{ass_escaped}'[vout];"
                f"[0:a]asplit=2[voice][sc];"
                f"[1:a][sc]sidechaincompress=threshold=0.02:ratio=6:attack=40:release=350[ducked];"
                f"[voice][ducked]amix=inputs=2:duration=first:weights=1 0.35,"
                f"loudnorm=I=-16:TP=-1.5:LRA=11[aout]"
            )
            subprocess.run([
                self.ffmpeg_exe, "-y",
                "-i", str(raw_master),
                "-i", str(ambient_wav),
                "-filter_complex", filter_master,
                "-map", "[vout]", "-map", "[aout]",
                "-c:v", "libx264", "-preset", "fast", "-crf", "20",
                "-pix_fmt", "yuv420p",
                "-c:a", "aac", "-b:a", "192k",
                "-movflags", "+faststart",
                str(master_mp4)
            ], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        except Exception:
            shutil.copy2(raw_master, master_mp4)

        # 5. Render 1080x1920 Vertical Instagram Reel with Styled ASS Captions
        total_scenes = len(scenes)
        reel_segments: List[Path] = []
        for idx, scene in enumerate(scenes):
            sc_id = scene.get("scene_id", f"scene_{idx+1:02d}")
            aud_file = p_dir / "audio" / f"{sc_id}.wav"
            sc_dur = max(float(scene.get("duration", 5.0)), 4.0)

            frame_vertical = Image.new("RGB", (1080, 1920), (10, 14, 24))
            d_v = ImageDraw.Draw(frame_vertical)
            d_v.rectangle([0, 0, 1080, 130], fill=(249, 115, 22))
            d_v.text((54, 46), "UiPath Community AJIET | Reels", font=self.font_title, fill=(255, 255, 255))

            # Use 1080p Chrome frame if available
            horiz_tmp = temp_dir / f"reel_horiz_{idx:02d}.png"
            ok_h = self._render_frames_with_chrome([{
                "width": 1920, "height": 1080,
                "sceneIndex": idx, "totalScenes": total_scenes,
                "activeStep": idx % 3,
                "topic": scene.get("topic") or scene.get("title") or "UiPath",
                "chapter": scene.get("chapter", f"Chapter {idx + 1}"),
                "title": scene.get("title", ""),
                "visualType": scene.get("visual_type", "studio_ide_walkthrough"),
                "points": self._extract_topic_points(scene, count=4),
                "outputPath": str(horiz_tmp)
            }], temp_dir / f"reel_job_{idx:02d}.json")

            if ok_h and horiz_tmp.exists():
                horiz = Image.open(horiz_tmp).convert("RGB")
            else:
                horiz = self.render_scene_frame(scene, scene_idx=idx, total_scenes=total_scenes, width=1920, height=1080, active_step=idx % 3)

            horiz_resized = horiz.resize((1000, 562), Image.Resampling.LANCZOS)
            frame_vertical.paste(horiz_resized, (40, 170))

            d_v.rounded_rectangle([44, 770, 1036, 1390], radius=24, fill=(15, 23, 42), outline=(56, 189, 248), width=3)
            d_v.text((76, 804), self._truncate(scene.get("title", "").upper(), 36), font=self.font_title, fill=(56, 189, 248))

            d_v.rounded_rectangle([44, 1430, 1036, 1780], radius=24, fill=(15, 23, 42), outline=(249, 115, 22), width=3)
            d_v.text((76, 1466), "AUTOMATION QUICK TIP", font=self.font_title, fill=(249, 115, 22))
            d_v.text((76, 1524), "Follow @uipath_ajiet for weekly RPA & AI builds", font=self.font_subtitle, fill=(255, 255, 255))

            v_png = temp_dir / f"reel_frame_{idx:02d}.png"
            frame_vertical.save(v_png)

            v_seg_mp4 = temp_dir / f"reel_seg_{idx:02d}.mp4"
            fade_out_st = max(0.0, sc_dur - 0.3)
            vf_parts = [
                f"fade=t=in:st=0:d=0.3,fade=t=out:st={fade_out_st:.2f}:d=0.3",
                f"drawbox=x=44:y=1860:w='(t/{sc_dur:.2f})*992':h=10:color=0xff6600:t=fill"
            ]
            cmd_vseg = [
                self.ffmpeg_exe, "-y",
                "-loop", "1", "-i", str(v_png),
                *(["-i", str(aud_file)] if aud_file.exists() else []),
                "-vf", ",".join(vf_parts),
                "-c:v", "libx264", "-preset", "fast", "-crf", "20",
                "-t", f"{sc_dur:.2f}",
                "-pix_fmt", "yuv420p", "-r", "30",
                *(["-c:a", "aac", "-b:a", "192k"] if aud_file.exists() else []),
                str(v_seg_mp4)
            ]
            subprocess.run(cmd_vseg, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            reel_segments.append(v_seg_mp4)

        reel_concat_txt = temp_dir / "reel_concat.txt"
        with open(reel_concat_txt, "w") as f:
            for rseg in reel_segments:
                f.write(f"file '{rseg.resolve()}'\n")

        raw_reel = temp_dir / "raw_reel.mp4"
        subprocess.run([
            self.ffmpeg_exe, "-y", "-f", "concat", "-safe", "0", "-i", str(reel_concat_txt),
            "-c", "copy", str(raw_reel)
        ], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        reel_mp4 = p_dir / "reel_9x16.mp4"
        reel_ass_escaped = str(reel_ass.resolve()).replace("\\", "\\\\").replace(":", "\\:")
        try:
            subprocess.run([
                self.ffmpeg_exe, "-y",
                "-i", str(raw_reel),
                "-i", str(ambient_wav),
                "-filter_complex", (
                    f"[0:v]ass='{reel_ass_escaped}'[vout];"
                    f"[0:a]asplit=2[voice][sc];"
                    f"[1:a][sc]sidechaincompress=threshold=0.02:ratio=6:attack=40:release=350[ducked];"
                    f"[voice][ducked]amix=inputs=2:duration=first:weights=1 0.35,"
                    f"loudnorm=I=-16:TP=-1.5:LRA=11[aout]"
                ),
                "-map", "[vout]", "-map", "[aout]",
                "-c:v", "libx264", "-preset", "fast", "-crf", "20",
                "-pix_fmt", "yuv420p",
                "-c:a", "aac", "-b:a", "192k",
                "-movflags", "+faststart",
                str(reel_mp4)
            ], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        except Exception:
            shutil.copy2(raw_reel, reel_mp4)

        shutil.rmtree(temp_dir, ignore_errors=True)
        return master_mp4

    async def render_project_video(self, project_id: str, script_data: Dict[str, Any], output_dir: str | Path) -> Dict[str, str]:
        """
        Master Pipeline Method:
        1. Synthesizes neural audio per scene.
        2. Renders isolated 1080p scene segments via Headless Chrome + live demo PiP.
        3. Creates structured Production Manifest (production_manifest.json).
        4. Assembles 1080p Master Video & 1080x1920 Vertical Reel with ducked ambient audio & ASS captions.
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
            "subtitles_ass": f"/media/{project_id}/subtitles.ass",
            "chapters": f"/media/{project_id}/chapters.txt",
            "narration_audio": f"/media/{project_id}/full_narration.wav",
            "manifest": f"/media/{project_id}/production_manifest.json"
        }
