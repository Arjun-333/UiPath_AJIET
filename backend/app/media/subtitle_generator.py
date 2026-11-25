"""
Subtitle Generator for Project Autonomia.
Generates compliant SRT and styled ASS (SubStation Alpha) subtitle files
aligned with storyboard scene timestamps, including dynamic active-word highlights.
"""

from pathlib import Path
from typing import List, Dict, Any


class SubtitleGenerator:
    @staticmethod
    def format_timestamp_srt(seconds: float) -> str:
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        millis = int((seconds - int(seconds)) * 1000)
        return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"

    @staticmethod
    def format_timestamp_ass(seconds: float) -> str:
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        centis = int(round((seconds - int(seconds)) * 100))
        if centis >= 100:
            centis = 99
        return f"{hours:d}:{minutes:02d}:{secs:02d}.{centis:02d}"

    @classmethod
    def generate_srt(cls, scenes: List[Dict[str, Any]], output_path: str | Path) -> Path:
        out_p = Path(output_path)
        out_p.parent.mkdir(parents=True, exist_ok=True)

        current_time = 0.0
        lines = []

        for idx, scene in enumerate(scenes, start=1):
            duration = float(scene.get("duration", 5.0))
            start_str = cls.format_timestamp_srt(current_time)
            end_str = cls.format_timestamp_srt(current_time + duration)
            text = scene.get("narration", scene.get("title", ""))

            lines.append(f"{idx}\n{start_str} --> {end_str}\n{text}\n\n")
            current_time += duration

        out_p.write_text("".join(lines), encoding="utf-8")
        return out_p

    @classmethod
    def generate_srt_from_scenes(cls, scenes: List[Dict[str, Any]], output_path: str | Path) -> Path:
        return cls.generate_srt(scenes, output_path)

    @classmethod
    def generate_ass(
        cls,
        scenes: List[Dict[str, Any]],
        output_path: str | Path,
        width: int = 1920,
        height: int = 1080,
        chunk_words: int = 4,
        margin_v: int = 68,
        font_size: int = 42
    ) -> Path:
        """
        Generates a styled SubStation Alpha (.ass) subtitle file with dynamic 3-4 word chunks
        and karaoke-style active-word color highlighting for YouTube & Reels.
        """
        out_p = Path(output_path)
        out_p.parent.mkdir(parents=True, exist_ok=True)

        header = (
            "[Script Info]\n"
            "ScriptType: v4.00+\n"
            f"PlayResX: {width}\n"
            f"PlayResY: {height}\n"
            "WrapStyle: 2\n"
            "ScaledBorderAndShadow: yes\n\n"
            "[V4+ Styles]\n"
            "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, "
            "Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, "
            "Alignment, MarginL, MarginR, MarginV, Encoding\n"
            f"Style: Default,Ubuntu,{font_size},&H00FFFFFF,&H0000A5FF,&H00140F0A,&H96080C14,"
            f"-1,0,0,0,100,100,0,0,1,3,1.5,2,60,60,{margin_v},1\n\n"
            "[Events]\n"
            "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n"
        )

        events: List[str] = []
        current_time = 0.0

        for scene in scenes:
            duration = float(scene.get("duration", 5.0))
            # Leave ~0.45s tail padding uncaptioned if scene has padding
            spoken_dur = max(1.0, duration - 0.35)
            narration = (scene.get("narration") or scene.get("title") or "").strip()
            words = narration.split()

            if words:
                chunks = [words[i:i + chunk_words] for i in range(0, len(words), chunk_words)]
                t_per_chunk = spoken_dur / len(chunks)
                for c_idx, chunk in enumerate(chunks):
                    c_start = current_time + c_idx * t_per_chunk
                    c_end = current_time + min(spoken_dur, (c_idx + 1) * t_per_chunk)
                    # Karaoke \kf timing in centiseconds per word for smooth orange-gold highlight
                    k_cs = max(8, int(round((t_per_chunk / len(chunk)) * 100)))
                    karaoke_parts = [f"{{\\kf{k_cs}}}{w.replace('{', '').replace('}', '')}" for w in chunk]
                    line_text = " ".join(karaoke_parts)
                    events.append(
                        f"Dialogue: 0,{cls.format_timestamp_ass(c_start)},{cls.format_timestamp_ass(c_end)},"
                        f"Default,,0,0,0,,{line_text}\n"
                    )

            current_time += duration

        out_p.write_text(header + "".join(events), encoding="utf-8")
        return out_p
