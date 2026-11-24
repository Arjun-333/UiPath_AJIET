"""
Thumbnail Generator for Project Autonomia.
Renders high-CTR, 1280x720 YouTube thumbnails adhering to UiPath Community AJIET branding.
"""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

class ThumbnailGenerator:
    def __init__(self, brand_color=(255, 102, 0), bg_color=(15, 20, 28)):
        self.brand_color = brand_color
        self.bg_color = bg_color

    def create_thumbnail(self, title: str, subtitle: str, output_path: str | Path, mascot_path: str | Path = None) -> Path:
        out_p = Path(output_path)
        out_p.parent.mkdir(parents=True, exist_ok=True)

        width = 1280
        height = 720
        img = Image.new("RGBA", (width, height), (*self.bg_color, 255))
        draw = ImageDraw.Draw(img)

        # Background gradient / grid lines
        for y in range(0, height, 40):
            draw.line([(0, y), (width, y)], fill=(25, 33, 46, 255), width=1)
        for x in range(0, width, 40):
            draw.line([(x, 0), (x, height)], fill=(25, 33, 46, 255), width=1)

        # Diagonal Brand Glow
        for i in range(120):
            alpha = max(0, 140 - i)
            draw.line([(0, height - i * 3), (width - i * 5, 0)], fill=(*self.brand_color, alpha), width=3)

        # Top Badge: UiPath Community AJIET
        draw.rounded_rectangle([70, 60, 480, 110], radius=8, fill=(*self.brand_color, 255))
        draw.text((90, 72), "UiPath Community AJIET", fill=(255, 255, 255, 255))

        # Main Title (High contrast bold visual)
        words = title.upper().split()
        line1 = " ".join(words[:3]) if len(words) >= 3 else title.upper()
        line2 = " ".join(words[3:]) if len(words) > 3 else ""

        # Draw Title Card Background
        draw.rounded_rectangle([60, 150, 780, 440], radius=16, fill=(10, 14, 20, 230), outline=(*self.brand_color, 255), width=3)
        draw.text((90, 180), line1, fill=(255, 255, 255, 255))
        if line2:
            draw.text((90, 270), line2, fill=(*self.brand_color, 255))

        # Subtitle pill
        draw.rounded_rectangle([90, 360, 720, 410], radius=8, fill=(30, 41, 59, 255))
        draw.text((110, 372), subtitle[:60], fill=(0, 229, 255, 255))

        # Bottom features pill
        draw.rectangle([70, 520, 500, 560], fill=(234, 88, 12, 255))
        draw.text((90, 532), "OFFICIAL TUTORIAL | FULL MASTERCLASS", fill=(255, 255, 255, 255))

        # Add ORBI Mascot Artwork on the Right Side
        orbi_img = None
        if mascot_path and Path(mascot_path).exists():
            orbi_img = Image.open(mascot_path).convert("RGBA")
        else:
            # Fallback to generated ORBI sprite
            default_orbi = Path("/home/arjun/Desktop/PROJECTS/UiPathAJIET/frontend/public/assets/sprites/orbi/orbi_waving_f0.png")
            if default_orbi.exists():
                orbi_img = Image.open(default_orbi).convert("RGBA")

        if orbi_img:
            # Scale mascot cleanly to 380x380
            mascot_scaled = orbi_img.resize((380, 380), Image.Resampling.NEAREST if "sprites" in str(mascot_path or "") else Image.Resampling.LANCZOS)
            img.paste(mascot_scaled, (830, 170), mascot_scaled)

        img.save(out_p, "PNG")
        return out_p
