"""
Subtitle Generator for Project Autonomia.
Generates compliant SRT and styled ASS (SubStation Alpha) subtitle files
aligned with storyboard scene timestamps, including dynamic active-word highlights.
"""

import textwrap
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

    @staticmethod
    def _wrap_cue_chunks(text: str, max_line_chars: int = 46, max_lines_per_cue: int = 2) -> List[str]:
        """Wraps narration into balanced 2-line subtitle cues under safe margin width."""
        cleaned = " ".join((text or "").split())
        if not cleaned:
            return []
        wrapped_lines = textwrap.wrap(cleaned, width=max_line_chars, break_long_words=True, break_on_hyphens=True)
        return [
            "\n".join(wrapped_lines[i:i + max_lines_per_cue])
            for i in range(0, len(wrapped_lines), max_lines_per_cue)
        ]

    @classmethod
    def generate_srt(cls, scenes: List[Dict[str, Any]], output_path: str | Path) -> Path:
        out_p = Path(output_path)
        out_p.parent.mkdir(parents=True, exist_ok=True)

        current_time = 0.0
        cue_index = 1
        lines = []

        for scene in scenes:
            duration = float(scene.get("duration", 5.0))
            text = scene.get("narration", scene.get("title", ""))
            cues = cls._wrap_cue_chunks(text)

            if not cues:
                current_time += duration
                continue

            # Distribute scene duration proportionally by cue length so cues stay aligned and non-overlapping
            total_chars = max(1, sum(len(c) for c in cues))
            cue_start = current_time
            for c_idx, cue_text in enumerate(cues):
                if c_idx == len(cues) - 1:
                    cue_end = current_time + duration
                else:
                    cue_dur = duration * (len(cue_text) / total_chars)
                    cue_end = min(current_time + duration, cue_start + max(0.4, cue_dur))

                start_str = cls.format_timestamp_srt(cue_start)
                end_str = cls.format_timestamp_srt(cue_end)
                lines.append(f"{cue_index}\n{start_str} --> {end_str}\n{cue_text}\n\n")
                cue_index += 1
                cue_start = cue_end

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
