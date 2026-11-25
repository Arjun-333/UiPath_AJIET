"""
100% Free Procedural Ambient Audio & Transition Cue Generator for Project Autonomia.
Synthesizes a warm, copyright-free ambient synth pad and subtle chapter transition cues
using pure Python PCM math (zero external APIs or paid assets).
"""

import math
import struct
import wave
from pathlib import Path
from typing import List


def generate_ambient_bed(duration_seconds: float, output_path: str | Path, sample_rate: int = 24000) -> Path:
    """
    Generates a warm, subtle ambient synth pad chord progression (Cmaj7 -> Am7 -> Fmaj7 -> G6)
    with smooth envelope shaping so it sits cleanly underneath voiceover narration.
    """
    out_p = Path(output_path)
    out_p.parent.mkdir(parents=True, exist_ok=True)
    dur = max(float(duration_seconds), 2.0)
    num_samples = int(sample_rate * dur)

    # Warm low-mid pad frequencies (Hz)
    chords: List[List[float]] = [
        [130.81, 164.81, 196.00, 246.94],  # Cmaj7
        [110.00, 130.81, 164.81, 196.00],  # Am7
        [87.31,  130.81, 164.81, 220.00],  # Fmaj7
        [98.00,  146.83, 196.00, 246.94],  # G6
    ]
    chord_len = 8.0  # seconds per chord

    raw_bytes = bytearray()
    fade_samples = min(int(sample_rate * 1.5), num_samples // 4)

    for i in range(num_samples):
        t = i / sample_rate
        chord_idx = int(t / chord_len) % len(chords)
        local_t = t % chord_len
        freqs = chords[chord_idx]

        # Smooth crossfade envelope within each chord
        chord_env = 1.0
        if local_t < 0.6:
            chord_env = local_t / 0.6
        elif local_t > chord_len - 0.6:
            chord_env = (chord_len - local_t) / 0.6

        # Global fade in/out
        global_env = 1.0
        if i < fade_samples:
            global_env = i / max(1, fade_samples)
        elif i > num_samples - fade_samples:
            global_env = (num_samples - i) / max(1, fade_samples)

        # Gentle LFO shimmer
        lfo = 0.85 + 0.15 * math.sin(2.0 * math.pi * 0.25 * t)

        val = 0.0
        for idx_f, f in enumerate(freqs):
            detune = 1.0 + (0.0025 if idx_f % 2 == 0 else -0.0025)
            val += math.sin(2.0 * math.pi * f * t)
            val += 0.35 * math.sin(2.0 * math.pi * (f * detune) * t)

        # Normalize & keep subtle (-26dB range before ducking)
        sample = (val / (len(freqs) * 1.35)) * chord_env * global_env * lfo * 0.14
        pcm = int(max(-1.0, min(1.0, sample)) * 32767)
        raw_bytes.extend(struct.pack("<h", pcm))

    with wave.open(str(out_p), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(bytes(raw_bytes))

    return out_p
