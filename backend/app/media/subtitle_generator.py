"""
Subtitle Generator for Project Autonomia.
Generates compliant SRT and ASS subtitle files aligned with storyboard scene timestamps.
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

