#!/usr/bin/env python3
"""
Pixel Art Generator for Project Autonomia.
Generates:
1. ORBI - Operational Robot & Business Intelligence (Official Mascot & CEO Interface)
   - Faithfully matching the source of truth reference image
2. Human AI Employee Character Catalog tailored with Arjun's official team:
   - Arjun: Overall Main & CEO
   - Tech Dept: Pratham (CTO), Mallika (API & DB Lead), Vaibhav (DevOps & Security), Faazil (SysAdmin & Storage)
   - Media Dept: Darshan (Video Director & Producer), Shrinithi (Scriptwriter & Strategist), Vaishnavi (Thumbnail & Visual Designer), Shreyank (Video Editor & Motion Graphics)
   - Documentation Dept: Iffah (Documentation & Campus Outreach Lead), Jiya (Research & Technical Docs), Srijana (Quality & Compliance Inspector)
"""

from pathlib import Path
from PIL import Image, ImageDraw

BASE_DIR = Path(__file__).resolve().parent.parent
SPRITES_DIR = BASE_DIR / "frontend" / "public" / "assets" / "sprites"
ORBI_DIR = SPRITES_DIR / "orbi"
EMPLOYEES_DIR = SPRITES_DIR / "employees"
ARTIFACT_DIR = Path("/home/arjun/.gemini/antigravity/brain/787fc2b5-0969-4294-b652-8a0f2b79644a")

ORBI_DIR.mkdir(parents=True, exist_ok=True)
EMPLOYEES_DIR.mkdir(parents=True, exist_ok=True)

# Color Palette for ORBI
C_TRANSPARENT = (0, 0, 0, 0)
C_ORANGE_BRIGHT = (255, 102, 0, 255)      # Primary UiPath Orange
C_ORANGE_DARK = (210, 70, 0, 255)         # Orange shadow / accent
C_ORANGE_LIGHT = (255, 140, 50, 255)      # Orange highlight
C_WHITE = (255, 255, 255, 255)            # Body shell
C_WHITE_SHADOW = (210, 218, 226, 255)     # Shading on white plastic
C_WHITE_DARK = (178, 190, 195, 255)       # Joint rings / shadows
C_BLACK_SCREEN = (18, 22, 28, 255)        # Glossy face monitor
C_CYAN_EYE = (0, 235, 255, 255)           # Glowing cyan eyes
C_CYAN_GLOW = (128, 245, 255, 255)        # Eye core glow
C_MOUTH = (120, 140, 160, 255)            # Subtle mouth
C_GOLD = (255, 215, 0, 255)               # Celebration sparkles
C_RED_ALERT = (255, 59, 48, 255)          # Error badge

def draw_orbi_base(frame_type="idle", frame_idx=0, scale=8):
    img = Image.new("RGBA", (32, 32), C_TRANSPARENT)
    pixels = img.load()

    bob_y = 0
    arm_l_state = "down"
    arm_r_state = "down"
    eye_shape = "happy"
    leg_l_offset = 0
    leg_r_offset = 0
    mouth_visible = True
    particles = []
    screen_glow = False

    if frame_type == "idle":
        bob_y = 1 if frame_idx in (1, 2) else 0
    elif frame_type == "walking":
        bob_y = 1 if frame_idx % 2 == 1 else 0
        if frame_idx == 0:
            leg_l_offset = -1
            leg_r_offset = 1
            arm_l_state = "forward"
            arm_r_state = "back"
        elif frame_idx == 1:
            leg_l_offset = 0
            leg_r_offset = 0
        elif frame_idx == 2:
            leg_l_offset = 1
            leg_r_offset = -1
            arm_l_state = "back"
            arm_r_state = "forward"
        elif frame_idx == 3:
            leg_l_offset = 0
            leg_r_offset = 0
    elif frame_type == "waving":
        bob_y = 1 if frame_idx in (1, 2) else 0
        arm_r_state = "wave_high" if frame_idx % 2 == 0 else "wave_tilt"
    elif frame_type == "thinking":
        bob_y = 0
        arm_r_state = "chin"
        eye_shape = "curious"
        dot_count = (frame_idx % 3) + 1
        for d in range(dot_count):
            particles.append((24 + d * 2, 2, C_CYAN_EYE))
    elif frame_type == "working":
        bob_y = 1 if frame_idx % 2 == 1 else 0
        arm_l_state = "type_up" if frame_idx % 2 == 0 else "type_down"
        arm_r_state = "type_down" if frame_idx % 2 == 0 else "type_up"
        screen_glow = True
    elif frame_type == "celebrating":
        bob_y = -2 if frame_idx in (1, 2) else 0
        arm_l_state = "cheer"
        arm_r_state = "cheer"
        eye_shape = "gleam"
        particles.append((5 + frame_idx * 2, 3 + (frame_idx % 2) * 2, C_GOLD))
        particles.append((25 - frame_idx * 2, 4 + (frame_idx % 2) * 2, C_CYAN_GLOW))
    elif frame_type == "waiting":
        bob_y = 1 if frame_idx == 2 else 0
        arm_l_state = "clasped"
        arm_r_state = "clasped"
        eye_shape = "blink" if frame_idx == 3 else "happy"
    elif frame_type == "error":
        bob_y = 0
        eye_shape = "alert"
        badge_color = C_RED_ALERT if frame_idx % 2 == 0 else C_ORANGE_BRIGHT
        for by in range(1, 4):
            pixels[16, by] = badge_color
        pixels[16, 5] = badge_color

    for px, py, pcol in particles:
        if 0 <= px < 32 and 0 <= py < 32:
            pixels[px, py] = pcol

    hy = 4 + bob_y

    # Side antenna horns
    pixels[5, hy + 1] = C_ORANGE_BRIGHT
    pixels[4, hy] = C_ORANGE_BRIGHT
    pixels[4, hy - 1] = C_ORANGE_DARK
    pixels[5, hy - 2] = C_ORANGE_LIGHT
    pixels[26, hy + 1] = C_ORANGE_BRIGHT
    pixels[27, hy] = C_ORANGE_BRIGHT
    pixels[27, hy - 1] = C_ORANGE_DARK
    pixels[26, hy - 2] = C_ORANGE_LIGHT

    # Helmet dome
    for x in range(8, 24):
        pixels[x, hy] = C_ORANGE_BRIGHT
        pixels[x, hy + 1] = C_ORANGE_BRIGHT
    for x in range(10, 22):
        pixels[x, hy - 1] = C_ORANGE_LIGHT

    # Helmet White Casing
    for y in range(hy + 2, hy + 12):
        pixels[6, y] = C_WHITE
        pixels[7, y] = C_WHITE
        pixels[24, y] = C_WHITE
        pixels[25, y] = C_WHITE
    for x in range(8, 24):
        pixels[x, hy + 2] = C_WHITE
        pixels[x, hy + 11] = C_WHITE_SHADOW

    # Top center orange stripe
    for y in range(hy, hy + 3):
        pixels[15, y] = C_ORANGE_BRIGHT
        pixels[16, y] = C_ORANGE_BRIGHT

    # Black Glossy Face Screen
    for y in range(hy + 3, hy + 11):
        for x in range(8, 24):
            if (x in (8, 23) and y in (hy + 3, hy + 10)):
                pixels[x, y] = C_WHITE_SHADOW
            else:
                pixels[x, y] = C_BLACK_SCREEN

    pixels[9, hy + 4] = (60, 75, 90, 255)
    pixels[10, hy + 4] = (50, 65, 80, 255)

    # Cyan glowing crescent happy eyes
    if eye_shape in ("happy", "gleam"):
        pixels[11, hy + 6] = C_CYAN_EYE
        pixels[12, hy + 5] = C_CYAN_GLOW
        pixels[13, hy + 5] = C_CYAN_GLOW
        pixels[14, hy + 6] = C_CYAN_EYE
        pixels[17, hy + 6] = C_CYAN_EYE
        pixels[18, hy + 5] = C_CYAN_GLOW
        pixels[19, hy + 5] = C_CYAN_GLOW
        pixels[20, hy + 6] = C_CYAN_EYE
    elif eye_shape == "curious":
        pixels[12, hy + 5] = C_CYAN_GLOW
        pixels[13, hy + 5] = C_CYAN_GLOW
        pixels[12, hy + 6] = C_CYAN_EYE
        pixels[13, hy + 6] = C_CYAN_EYE
        pixels[18, hy + 5] = C_CYAN_GLOW
        pixels[19, hy + 6] = C_CYAN_EYE
    elif eye_shape == "blink":
        for x in range(11, 15):
            pixels[x, hy + 6] = C_CYAN_EYE
        for x in range(17, 21):
            pixels[x, hy + 6] = C_CYAN_EYE
    elif eye_shape == "alert":
        for x in range(11, 14):
            pixels[x, hy + 5] = C_ORANGE_BRIGHT
            pixels[x, hy + 6] = C_CYAN_GLOW
        for x in range(18, 21):
            pixels[x, hy + 5] = C_ORANGE_BRIGHT
            pixels[x, hy + 6] = C_CYAN_GLOW

    if mouth_visible and eye_shape != "alert":
        pixels[15, hy + 8] = C_MOUTH
        pixels[16, hy + 8] = C_MOUTH

    by = hy + 12
    for x in range(9, 23):
        pixels[x, by] = C_WHITE

    # Orange Chest Armor Vest
    for y in range(by + 1, by + 7):
        for x in range(10, 22):
            if x in (10, 21):
                pixels[x, y] = C_WHITE
            else:
                pixels[x, y] = C_ORANGE_BRIGHT

    for x in range(11, 21):
        pixels[x, by + 6] = C_ORANGE_DARK

    # [Ui] Chest Emblem
    for y in range(by + 2, by + 5):
        for x in range(14, 18):
            pixels[x, y] = C_WHITE
    pixels[15, by + 3] = C_ORANGE_DARK
    pixels[16, by + 3] = C_ORANGE_BRIGHT

    for x in range(11, 21):
        pixels[x, by + 7] = C_WHITE_SHADOW

    # Arms
    if arm_l_state == "down":
        for y in range(by + 1, by + 5):
            pixels[8, y] = C_WHITE; pixels[9, y] = C_WHITE
        pixels[8, by + 5] = C_WHITE_DARK; pixels[9, by + 5] = C_WHITE_DARK
        pixels[8, by + 6] = C_WHITE; pixels[9, by + 6] = C_WHITE
    elif arm_l_state == "forward":
        pixels[8, by + 1] = C_WHITE; pixels[7, by + 2] = C_WHITE; pixels[7, by + 3] = C_WHITE; pixels[6, by + 4] = C_WHITE
    elif arm_l_state == "back":
        pixels[9, by + 1] = C_WHITE; pixels[9, by + 2] = C_WHITE; pixels[8, by + 3] = C_WHITE_SHADOW
    elif arm_l_state == "cheer":
        pixels[8, by] = C_WHITE; pixels[7, by - 1] = C_WHITE; pixels[6, by - 2] = C_WHITE; pixels[6, by - 3] = C_WHITE_SHADOW
    elif arm_l_state == "clasped":
        pixels[9, by + 2] = C_WHITE; pixels[11, by + 4] = C_WHITE; pixels[12, by + 5] = C_WHITE
    elif arm_l_state in ("type_up", "type_down"):
        offset = 0 if arm_l_state == "type_up" else 1
        pixels[8, by + 2] = C_WHITE; pixels[9, by + 3 + offset] = C_WHITE; pixels[11, by + 4 + offset] = C_WHITE_SHADOW

    if arm_r_state == "down":
        for y in range(by + 1, by + 5):
            pixels[22, y] = C_WHITE; pixels[23, y] = C_WHITE
        pixels[22, by + 5] = C_WHITE_DARK; pixels[23, by + 5] = C_WHITE_DARK
        pixels[22, by + 6] = C_WHITE; pixels[23, by + 6] = C_WHITE
    elif arm_r_state == "forward":
        pixels[23, by + 1] = C_WHITE; pixels[24, by + 2] = C_WHITE; pixels[25, by + 3] = C_WHITE; pixels[25, by + 4] = C_WHITE
    elif arm_r_state == "back":
        pixels[22, by + 1] = C_WHITE; pixels[22, by + 2] = C_WHITE; pixels[23, by + 3] = C_WHITE_SHADOW
    elif arm_r_state == "wave_high":
        pixels[23, by + 1] = C_WHITE; pixels[24, by] = C_WHITE; pixels[25, by - 1] = C_WHITE; pixels[26, by - 2] = C_WHITE_DARK; pixels[26, by - 3] = C_WHITE; pixels[27, by - 3] = C_WHITE
    elif arm_r_state == "wave_tilt":
        pixels[23, by + 1] = C_WHITE; pixels[25, by] = C_WHITE; pixels[26, by - 1] = C_WHITE; pixels[25, by - 2] = C_WHITE
    elif arm_r_state == "chin":
        pixels[22, by + 2] = C_WHITE; pixels[21, by + 1] = C_WHITE; pixels[19, by] = C_WHITE; pixels[18, hy + 9] = C_WHITE_SHADOW
    elif arm_r_state == "cheer":
        pixels[23, by] = C_WHITE; pixels[24, by - 1] = C_WHITE; pixels[25, by - 2] = C_WHITE; pixels[25, by - 3] = C_WHITE_SHADOW
    elif arm_r_state == "clasped":
        pixels[22, by + 2] = C_WHITE; pixels[20, by + 4] = C_WHITE; pixels[19, by + 5] = C_WHITE
    elif arm_r_state in ("type_up", "type_down"):
        offset = 0 if arm_r_state == "type_up" else 1
        pixels[23, by + 2] = C_WHITE; pixels[22, by + 3 + offset] = C_WHITE; pixels[20, by + 4 + offset] = C_WHITE_SHADOW

    if screen_glow:
        for kx in range(11, 21):
            pixels[kx, by + 6] = (0, 230, 255, 180)
            if kx % 2 == 0:
                pixels[kx, by + 7] = (0, 200, 240, 140)

    # Legs & Boots
    ly = by + 8
    for y in range(ly, ly + 4):
        pixels[12, y + leg_l_offset] = C_WHITE; pixels[13, y + leg_l_offset] = C_WHITE
    pixels[11, ly + 4 + leg_l_offset] = C_WHITE; pixels[12, ly + 4 + leg_l_offset] = C_WHITE; pixels[13, ly + 4 + leg_l_offset] = C_WHITE
    pixels[11, ly + 5 + leg_l_offset] = C_ORANGE_DARK; pixels[12, ly + 5 + leg_l_offset] = C_ORANGE_DARK; pixels[13, ly + 5 + leg_l_offset] = C_ORANGE_DARK

    for y in range(ly, ly + 4):
        pixels[18, y + leg_r_offset] = C_WHITE; pixels[19, y + leg_r_offset] = C_WHITE
    pixels[18, ly + 4 + leg_r_offset] = C_WHITE; pixels[19, ly + 4 + leg_r_offset] = C_WHITE; pixels[20, ly + 4 + leg_r_offset] = C_WHITE
    pixels[18, ly + 5 + leg_r_offset] = C_ORANGE_DARK; pixels[19, ly + 5 + leg_r_offset] = C_ORANGE_DARK; pixels[20, ly + 5 + leg_r_offset] = C_ORANGE_DARK

    scaled = img.resize((32 * scale, 32 * scale), Image.NEAREST)
    return scaled


def generate_all_orbi_animations():
    states = ["idle", "walking", "waving", "thinking", "working", "celebrating", "waiting", "error"]
    summary = {}

    for state in states:
        frames = []
        for i in range(4):
            frame_img = draw_orbi_base(frame_type=state, frame_idx=i, scale=8)
            frame_path = ORBI_DIR / f"orbi_{state}_f{i}.png"
            frame_img.save(frame_path)
            frame_img.save(ARTIFACT_DIR / f"orbi_{state}_f{i}.png")
            frames.append(frame_img)

        gif_path = ORBI_DIR / f"orbi_{state}.gif"
        frames[0].save(
            gif_path,
            save_all=True,
            append_images=frames[1:],
            duration=220,
            loop=0,
            disposal=2,
            transparency=0,
        )
        frames[0].save(
            ARTIFACT_DIR / f"orbi_{state}.gif",
            save_all=True,
            append_images=frames[1:],
            duration=220,
            loop=0,
            disposal=2,
            transparency=0,
        )
        summary[state] = str(gif_path)

    sheet = Image.new("RGBA", (32 * 8 * 4, 32 * 8 * len(states)), (0, 0, 0, 0))
    for s_idx, state in enumerate(states):
        for f_idx in range(4):
            img = draw_orbi_base(frame_type=state, frame_idx=f_idx, scale=8)
            sheet.paste(img, (f_idx * 256, s_idx * 256))
    sheet.save(ORBI_DIR / "orbi_master_spritesheet.png")
    sheet.save(ARTIFACT_DIR / "orbi_master_spritesheet.png")
    return summary


# --- TAILORED HUMAN PIXEL-ART EMPLOYEE REGISTRY ---
# Arjun: Overall Main & CEO
# Tech Dept: Pratham, Mallika, Vaibhav, Faazil
# Media Dept: Darshan, Shrinithi, Vaishnavi, Shreyank
# Documentation Dept: Iffah, Jiya, Srijana

EMPLOYEES_REGISTRY = [
    # --- EXECUTIVE (Floor 0) ---
    {
        "agent_id": "arjun_ceo",
        "name": "Arjun",
        "department": "Executive Management",
        "floor": 0,
        "role": "Founder, CEO & Overall Director",
        "manager": "Self (CEO)",
        "shirt_color": (234, 88, 12, 255),       # UiPath Orange executive polo
        "hair_color": (20, 20, 25, 255),         # Stylish dark hair
        "skin_tone": (235, 185, 140, 255),
        "hair_style": "short_parted",
        "accessory": "badge",
        "status": "active",
        "current_task": "Directing Autonomous Digital Media Organization"
    },
    {
        "agent_id": "coo_01",
        "name": "Marcus Vance",
        "department": "Executive Management",
        "floor": 0,
        "role": "Chief Operations Officer",
        "manager": "Arjun (CEO) & ORBI",
        "shirt_color": (30, 58, 138, 255),       # Navy blue shirt
        "hair_color": (20, 20, 20, 255),         # Black hair
        "skin_tone": (245, 200, 160, 255),
        "hair_style": "short_parted",
        "accessory": "glasses",
        "status": "active",
        "current_task": "Decomposing CEO directive into multi-department workflows"
    },

    # --- TECH DEPT (Floor 5) ---
    {
        "agent_id": "pratham_cto",
        "name": "Pratham",
        "department": "Technology & Infrastructure",
        "floor": 5,
        "role": "Chief Technology Officer & Technical Architecture Lead",
        "manager": "Arjun (CEO)",
        "shirt_color": (31, 41, 55, 255),        # Charcoal shirt
        "hair_color": (25, 25, 30, 255),         # Dark neat hair
        "skin_tone": (240, 195, 155, 255),
        "hair_style": "classic",
        "accessory": "badge",
        "status": "active",
        "current_task": "Supervising system architecture & multi-agent reliability"
    },
    {
        "agent_id": "mallika_tech",
        "name": "Mallika",
        "department": "Technology & Infrastructure",
        "floor": 5,
        "role": "Lead API & Database Systems Manager",
        "manager": "Pratham (CTO)",
        "shirt_color": (79, 70, 229, 255),       # Indigo shirt
        "hair_color": (20, 20, 20, 255),         # Long black hair
        "skin_tone": (245, 205, 170, 255),
        "hair_style": "long_straight",
        "accessory": "glasses",
        "status": "active",
        "current_task": "Managing SQLite/PostgreSQL schemas & API rate limits"
    },
    {
        "agent_id": "vaibhav_devops",
        "name": "Vaibhav",
        "department": "Technology & Infrastructure",
        "floor": 5,
        "role": "DevOps & Infrastructure Security Supervisor",
        "manager": "Pratham (CTO)",
        "shirt_color": (15, 118, 110, 255),      # Deep teal shirt
        "hair_color": (35, 30, 25, 255),         # Brown hair
        "skin_tone": (230, 185, 145, 255),
        "hair_style": "messy",
        "accessory": "laptop",
        "status": "active",
        "current_task": "Auditing API security credentials & worker thread safety"
    },
    {
        "agent_id": "faazil_sysadmin",
        "name": "Faazil",
        "department": "Technology & Infrastructure",
        "floor": 5,
        "role": "Lead System Administrator & Storage Infrastructure",
        "manager": "Pratham (CTO)",
        "shirt_color": (17, 24, 39, 255),        # Midnight black shirt
        "hair_color": (40, 40, 45, 255),         # Dark hair with beanie
        "skin_tone": (225, 175, 135, 255),
        "hair_style": "beanie",
        "accessory": "terminal",
        "status": "active",
        "current_task": "Monitoring disk health, background queues & local assets"
    },

    # --- MEDIA DEPT (Floor 1 Creative & Floor 2/3 Social Media) ---
    {
        "agent_id": "darshan_director",
        "name": "Darshan",
        "department": "Creative & Video Production",
        "floor": 1,
        "role": "Lead Video Director & Production Head",
        "manager": "Arjun (CEO)",
        "shirt_color": (220, 38, 38, 255),       # Director Crimson Red shirt
        "hair_color": (25, 25, 25, 255),         # Black hair
        "skin_tone": (235, 190, 150, 255),
        "hair_style": "wavy",
        "accessory": "headphones",
        "status": "active",
        "current_task": "Directing programmatic FFmpeg scene compositor"
    },
    {
        "agent_id": "shrinithi_script",
        "name": "Shrinithi",
        "department": "Creative & Video Production",
        "floor": 1,
        "role": "Lead Scriptwriter & Content Strategist",
        "manager": "Darshan (Director)",
        "shirt_color": (234, 179, 8, 255),       # Sunflower Yellow shirt
        "hair_color": (15, 15, 15, 255),         # Black hair in elegant bun
        "skin_tone": (245, 210, 175, 255),
        "hair_style": "bun",
        "accessory": "headphones",
        "status": "active",
        "current_task": "Composing structured 6-scene UiPath explainer narration"
    },
    {
        "agent_id": "vaishnavi_design",
        "name": "Vaishnavi",
        "department": "Creative & Video Production",
        "floor": 1,
        "role": "Thumbnail & Creative Visual Designer",
        "manager": "Darshan (Director)",
        "shirt_color": (219, 39, 119, 255),      # Pink artist shirt
        "hair_color": (124, 58, 237, 255),       # Stylish purple hair
        "skin_tone": (250, 215, 185, 255),
        "hair_style": "asymmetrical",
        "accessory": "tablet",
        "status": "active",
        "current_task": "Designing 1280x720 high-CTR YouTube thumbnails & branding"
    },
    {
        "agent_id": "shreyank_editor",
        "name": "Shreyank",
        "department": "Creative & Video Production",
        "floor": 1,
        "role": "Video Editor & Motion Graphics Specialist",
        "manager": "Darshan (Director)",
        "shirt_color": (217, 119, 6, 255),       # Amber shirt
        "hair_color": (30, 25, 20, 255),         # Dark brown spiky hair
        "skin_tone": (240, 200, 160, 255),
        "hair_style": "spiky",
        "accessory": "stylus",
        "status": "active",
        "current_task": "Editing kinetic typography & rendering 9:16 Instagram Reels"
    },

    # --- DOCUMENTATION & CAMPUS DEPT (Floor 4 Administration & Compliance) ---
    {
        "agent_id": "iffah_doc",
        "name": "Iffah",
        "department": "Administration",
        "floor": 4,
        "role": "Lead Documentation & Campus Outreach Lead",
        "manager": "Arjun (CEO)",
        "shirt_color": (13, 148, 136, 255),      # Teal shirt
        "hair_color": (20, 20, 20, 255),         # Black hair
        "skin_tone": (245, 210, 175, 255),
        "hair_style": "bob",
        "accessory": "headset",
        "status": "active",
        "current_task": "Managing Automate Campus Quest email reminders & attendee records"
    },
    {
        "agent_id": "jiya_research",
        "name": "Jiya",
        "department": "Administration",
        "floor": 4,
        "role": "Research & Technical Documentation Specialist",
        "manager": "Iffah (Doc Lead)",
        "shirt_color": (21, 128, 61, 255),       # Green shirt
        "hair_color": (92, 51, 23, 255),         # Chestnut brown hair
        "skin_tone": (250, 220, 190, 255),
        "hair_style": "long_straight",
        "accessory": "glasses",
        "status": "active",
        "current_task": "Indexing official UiPath Community knowledge base & docs"
    },
    {
        "agent_id": "srijana_quality",
        "name": "Srijana",
        "department": "Administration",
        "floor": 4,
        "role": "Quality & Compliance Inspector",
        "manager": "Iffah (Doc Lead)",
        "shirt_color": (55, 65, 81, 255),        # Dark grey shirt
        "hair_color": (30, 30, 35, 255),         # Dark hair in ponytail
        "skin_tone": (240, 205, 170, 255),
        "hair_style": "ponytail",
        "accessory": "clipboard",
        "status": "active",
        "current_task": "Inspecting video accuracy, audio sync & deadline compliance"
    }
]

def draw_human_employee(char_meta, scale=8):
    img = Image.new("RGBA", (32, 32), C_TRANSPARENT)
    pixels = img.load()

    skin = char_meta["skin_tone"]
    hair = char_meta["hair_color"]
    shirt = char_meta["shirt_color"]
    hair_style = char_meta["hair_style"]
    accessory = char_meta["accessory"]

    # Face
    for y in range(7, 15):
        for x in range(12, 20):
            pixels[x, y] = skin

    # Neck
    for y in range(15, 17):
        for x in range(14, 18):
            pixels[x, y] = (max(0, skin[0]-25), max(0, skin[1]-25), max(0, skin[2]-25), 255)

    # Eyes & Eyebrows
    pixels[14, 10] = (30, 30, 35, 255)
    pixels[17, 10] = (30, 30, 35, 255)
    pixels[14, 9] = (hair[0], hair[1], hair[2], 220)
    pixels[17, 9] = (hair[0], hair[1], hair[2], 220)

    # Smile
    pixels[15, 13] = (180, 100, 100, 255)
    pixels[16, 13] = (180, 100, 100, 255)

    # Hair Styling
    if hair_style == "short_parted":
        for y in range(4, 8):
            for x in range(11, 21):
                pixels[x, y] = hair
        pixels[15, 7] = skin
        pixels[11, 8] = hair
        pixels[20, 8] = hair
    elif hair_style == "bob":
        for y in range(4, 8):
            for x in range(11, 21):
                pixels[x, y] = hair
        for y in range(8, 14):
            pixels[11, y] = hair
            pixels[20, y] = hair
    elif hair_style == "bun":
        for y in range(2, 5):
            for x in range(14, 18):
                pixels[x, y] = hair
        for y in range(5, 8):
            for x in range(11, 21):
                pixels[x, y] = hair
    elif hair_style == "messy":
        for y in range(3, 8):
            for x in range(11, 21):
                pixels[x, y] = hair
        pixels[12, 2] = hair
        pixels[18, 2] = hair
        pixels[10, 7] = hair
        pixels[21, 7] = hair
    elif hair_style == "ponytail":
        for y in range(4, 8):
            for x in range(11, 21):
                pixels[x, y] = hair
        for y in range(6, 14):
            pixels[21, y] = hair
            pixels[22, y] = hair
    elif hair_style == "long_straight":
        for y in range(4, 8):
            for x in range(11, 21):
                pixels[x, y] = hair
        for y in range(8, 16):
            pixels[10, y] = hair
            pixels[21, y] = hair
    elif hair_style == "asymmetrical":
        for y in range(4, 8):
            for x in range(11, 21):
                pixels[x, y] = hair
        for y in range(8, 15):
            pixels[10, y] = hair
            pixels[11, y] = hair
    elif hair_style == "beanie":
        for y in range(3, 8):
            for x in range(10, 22):
                pixels[x, y] = (50, 60, 70, 255)
    elif hair_style == "spiky":
        for y in range(4, 8):
            for x in range(11, 21):
                pixels[x, y] = hair
        pixels[12, 2] = hair
        pixels[15, 2] = hair
        pixels[18, 2] = hair
    else:  # classic
        for y in range(4, 8):
            for x in range(11, 21):
                pixels[x, y] = hair
        pixels[11, 8] = hair
        pixels[20, 8] = hair

    # Accessories
    if accessory == "glasses":
        pixels[13, 10] = (220, 220, 240, 255)
        pixels[14, 10] = (220, 220, 240, 255)
        pixels[15, 10] = (100, 100, 120, 255)
        pixels[16, 10] = (100, 100, 120, 255)
        pixels[17, 10] = (220, 220, 240, 255)
        pixels[18, 10] = (220, 220, 240, 255)
    elif accessory == "headphones":
        for y in range(6, 13):
            pixels[10, y] = (40, 40, 45, 255)
            pixels[21, y] = (40, 40, 45, 255)
        for x in range(11, 21):
            pixels[x, 3] = (50, 50, 55, 255)
    elif accessory == "headset":
        pixels[10, 10] = (30, 30, 30, 255)
        pixels[11, 11] = (30, 30, 30, 255)
        pixels[12, 12] = (30, 30, 30, 255)
        pixels[13, 12] = (13, 148, 136, 255)
    elif accessory == "badge":
        pixels[13, 19] = (255, 215, 0, 255)
        pixels[13, 20] = (255, 255, 255, 255)

    # Torso & Shirt
    for y in range(17, 24):
        for x in range(11, 21):
            pixels[x, y] = shirt
    pixels[15, 17] = (255, 255, 255, 255)
    pixels[16, 17] = (255, 255, 255, 255)
    for x in range(11, 21):
        pixels[x, 24] = (35, 35, 40, 255)

    # Arms
    for y in range(17, 23):
        pixels[9, y] = shirt
        pixels[10, y] = shirt
        pixels[21, y] = shirt
        pixels[22, y] = shirt
    pixels[9, 23] = skin; pixels[10, 23] = skin
    pixels[21, 23] = skin; pixels[22, 23] = skin

    if accessory == "clipboard":
        for cy in range(21, 26):
            for cx in range(6, 10):
                pixels[cx, cy] = (180, 130, 80, 255)
        pixels[7, 21] = (230, 230, 230, 255)
    elif accessory == "laptop":
        for cy in range(21, 24):
            for cx in range(22, 27):
                pixels[cx, cy] = (160, 170, 185, 255)
        pixels[24, 22] = (0, 200, 255, 255)
    elif accessory == "stylus":
        pixels[8, 22] = (0, 230, 255, 255)
        pixels[7, 21] = (0, 230, 255, 255)
    elif accessory == "tablet":
        for cy in range(20, 25):
            for cx in range(6, 10):
                pixels[cx, cy] = (40, 40, 45, 255)
        pixels[7, 21] = (255, 100, 200, 255)
    elif accessory == "terminal":
        for cy in range(20, 24):
            for cx in range(22, 27):
                pixels[cx, cy] = (10, 20, 30, 255)
        pixels[24, 22] = (50, 255, 100, 255)

    # Pants & Shoes
    pants = (30, 41, 59, 255)
    for y in range(25, 29):
        for x in range(12, 15):
            pixels[x, y] = pants
        for x in range(17, 20):
            pixels[x, y] = pants
    shoes = (15, 23, 42, 255)
    for y in range(29, 31):
        for x in range(11, 15):
            pixels[x, y] = shoes
        for x in range(17, 21):
            pixels[x, y] = shoes

    scaled = img.resize((32 * scale, 32 * scale), Image.NEAREST)
    return scaled


def generate_all_employees():
    roster = []
    for emp in EMPLOYEES_REGISTRY:
        avatar = draw_human_employee(emp, scale=8)
        out_path = EMPLOYEES_DIR / f"{emp['agent_id']}.png"
        avatar.save(out_path)
        avatar.save(ARTIFACT_DIR / f"{emp['agent_id']}.png")
        roster.append({
            **emp,
            "avatar_file": str(out_path.name)
        })
        print(f"[OK] Generated team member: {emp['name']} ({emp['role']})")

    # Master Team Roster Sheet (4 cols x 3 rows)
    grid_w = 4 * 256
    grid_h = 3 * 256
    roster_sheet = Image.new("RGBA", (grid_w, grid_h), (24, 28, 36, 255))
    draw = ImageDraw.Draw(roster_sheet)

    for idx, emp in enumerate(EMPLOYEES_REGISTRY):
        col = idx % 4
        row = idx // 4
        avatar = draw_human_employee(emp, scale=8)
        x = col * 256
        y = row * 256
        roster_sheet.paste(avatar, (x, y), avatar)
        draw.rectangle([x + 4, y + 4, x + 252, y + 252], outline=(60, 70, 85, 255), width=2)

    roster_sheet.save(EMPLOYEES_DIR / "team_roster_sheet.png")
    roster_sheet.save(ARTIFACT_DIR / "team_roster_sheet.png")
    print(f"[OK] Master Team Roster Sheet updated at {EMPLOYEES_DIR / 'team_roster_sheet.png'}")
    return roster


if __name__ == "__main__":
    print("Regenerating tailored employee avatars...")
    generate_all_employees()
    print("Regenerating ORBI animations...")
    generate_all_orbi_animations()
    print("Done!")
