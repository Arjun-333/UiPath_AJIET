"""
Masterclass Video Renderer for Project Autonomia.
Composes hands-on UiPath Studio IDE simulations, RPA workflow diagrams,
data tables, live execution consoles, neural speech narration, and generates:
1. 16:9 Landscape Full Master MP4 (1280x720) - 5+ Minutes Masterclass
2. 9:16 Vertical Instagram Reel MP4 (720x1280)
"""

import subprocess
import shutil
import json
import asyncio
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any
from PIL import Image, ImageDraw, ImageFont
import imageio_ffmpeg

from backend.app.config import FFMPEG_PATH
from backend.app.media.tts_engine import TTSEngine
from backend.app.media.subtitle_generator import SubtitleGenerator

class VideoRenderer:
    def __init__(self):
        self.ffmpeg_exe = FFMPEG_PATH if Path(FFMPEG_PATH).exists() else imageio_ffmpeg.get_ffmpeg_exe()
        self.tts = TTSEngine(voice="en-US-ChristopherNeural")
        self._load_fonts()

    def _load_fonts(self):
        bold_path = "/usr/share/fonts/truetype/ubuntu/Ubuntu-B.ttf"
        med_path = "/usr/share/fonts/truetype/ubuntu/Ubuntu-M.ttf"
        reg_path = "/usr/share/fonts/truetype/ubuntu/Ubuntu-R.ttf"
        mono_path = "/usr/share/fonts/truetype/ubuntu/UbuntuMono-B.ttf"
        mono_reg = "/usr/share/fonts/truetype/ubuntu/UbuntuMono-R.ttf"

        try:
            self.font_header = ImageFont.truetype(bold_path, 20)
            self.font_title = ImageFont.truetype(bold_path, 26)
            self.font_subtitle = ImageFont.truetype(bold_path, 20)
            self.font_body = ImageFont.truetype(reg_path, 18)
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

    def render_scene_frame(self, scene: Dict[str, Any], scene_idx: int = 0, total_scenes: int = 6, width: int = 1280, height: int = 720) -> Image.Image:
        """
        Renders rich, hands-on visual frames simulating the UiPath Studio IDE,
        connected automation sequence workflows, selector inspectors, variables tables,
        and real-time execution terminals.
        """
        img = Image.new("RGB", (width, height), (13, 17, 23))  # Deep Slate Dark
        draw = ImageDraw.Draw(img)

        # 1. Top Ribbon Navigation Bar
        draw.rectangle([0, 0, width, 52], fill=(255, 102, 0))  # UiPath Brand Orange
        draw.text((36, 15), "UiPath Community AJIET | Autonomia Production Studio", font=self.font_header, fill=(255, 255, 255))
        
        chapter_str = scene.get("chapter", f"Chapter {scene_idx + 1}")
        draw.rectangle([width - 340, 10, width - 36, 42], fill=(234, 88, 12), outline=(255, 255, 255), width=1)
        draw.text((width - 325, 16), chapter_str, font=self.font_footer, fill=(255, 255, 255))

        # 2. Main Title Banner
        title = scene.get("title", "UiPath Studio Automation")
        draw.rectangle([36, 64, width - 36, 108], fill=(22, 27, 34), outline=(48, 54, 61), width=1)
        draw.text((50, 72), f"TOPIC: {title.upper()}", font=self.font_title, fill=(0, 229, 255))

        visual_type = scene.get("visual_type", "studio_ide_walkthrough")

        # 3. Hands-On Visual Content Area (116px to 540px)
        if visual_type == "challenge_comparison":
            # Dual-column comparison
            # Left Column: Legacy Manual (Red)
            draw.rounded_rectangle([40, 120, 610, 520], radius=12, fill=(28, 15, 19), outline=(225, 29, 72), width=2)
            draw.rectangle([40, 120, 610, 160], fill=(225, 29, 72))
            draw.text((60, 130), "❌ MANUAL ENTERPRISE PROCESS (LEGACY)", font=self.font_subtitle, fill=(255, 255, 255))

            draw.text((60, 185), "• 15 to 20 minutes required per invoice document", font=self.font_body, fill=(254, 205, 211))
            draw.text((60, 235), "• 12% human error rate in manual typing and SAP entry", font=self.font_body, fill=(254, 205, 211))
            draw.text((60, 285), "• Severe employee fatigue and backlog accumulation", font=self.font_body, fill=(254, 205, 211))
            draw.text((60, 335), "• Zero auditability & vulnerability to compliance breach", font=self.font_body, fill=(254, 205, 211))
            draw.text((60, 385), "• Annual cost per 10,000 documents: $45,000+", font=self.font_body, fill=(254, 205, 211))

            # Right Column: UiPath Modern Automation (Emerald)
            draw.rounded_rectangle([670, 120, width - 40, 520], radius=12, fill=(10, 30, 22), outline=(16, 185, 129), width=2)
            draw.rectangle([670, 120, width - 40, 160], fill=(16, 185, 129))
            draw.text((690, 130), "⚡ UIPATH COMMUNITY AJIET AUTOMATION", font=self.font_subtitle, fill=(255, 255, 255))

            draw.text((690, 185), "• 2.4 seconds end-to-end execution per document", font=self.font_body, fill=(167, 243, 208))
            draw.text((690, 235), "• 99.8% extraction accuracy with ML taxonomy", font=self.font_body, fill=(167, 243, 208))
            draw.text((690, 285), "• 24/7 unattended software robot execution", font=self.font_body, fill=(167, 243, 208))
            draw.text((690, 335), "• Automated validation via Action Center & Queues", font=self.font_body, fill=(167, 243, 208))
            draw.text((690, 385), "• 85% operational cost reduction in month one", font=self.font_body, fill=(167, 243, 208))

            # Bottom architecture pipeline bar
            draw.rounded_rectangle([60, 450, width - 60, 505], radius=8, fill=(15, 23, 42), outline=(56, 189, 248), width=1)
            draw.text((80, 468), "PIPELINE: [Input PDF] ➔ [OCR Digitizer] ➔ [Document Taxonomy] ➔ [ML Extractor] ➔ [Excel / SAP ERP]", font=self.font_code, fill=(56, 189, 248))

        elif visual_type == "studio_ide_walkthrough":
            # Realistic UiPath Studio Desktop Interface
            # Top Ribbon Menu
            draw.rectangle([40, 120, width - 40, 160], fill=(30, 41, 59))
            draw.text((60, 132), "UiPath Studio v2024.10  |  File    Design    Debug    Manage Packages    Data Manager    UI Explorer", font=self.font_code, fill=(241, 245, 249))

            # Left Sidebar: Activities Pane
            draw.rectangle([40, 160, 330, 520], fill=(15, 23, 42), outline=(51, 65, 85))
            draw.rectangle([40, 160, 330, 195], fill=(2, 132, 199))
            draw.text((55, 170), "ACTIVITIES PALETTE", font=self.font_subtitle, fill=(255, 255, 255))
            draw.text((55, 215), "▼ Modern UI Automation", font=self.font_code, fill=(56, 189, 248))
            draw.text((70, 245), "  [+] Use App/Browser", font=self.font_code_sm, fill=(226, 232, 240))
            draw.text((70, 275), "  [+] Click Activity", font=self.font_code_sm, fill=(226, 232, 240))
            draw.text((70, 305), "  [+] Type Into Activity", font=self.font_code_sm, fill=(226, 232, 240))
            draw.text((70, 335), "  [+] Table Extraction", font=self.font_code_sm, fill=(226, 232, 240))
            draw.text((55, 375), "▼ System & Data", font=self.font_code, fill=(56, 189, 248))
            draw.text((70, 405), "  [+] Excel Process Scope", font=self.font_code_sm, fill=(226, 232, 240))
            draw.text((70, 435), "  [+] For Each Row in Table", font=self.font_code_sm, fill=(226, 232, 240))
            draw.text((70, 465), "  [+] Add Queue Item", font=self.font_code_sm, fill=(226, 232, 240))

            # Center: Designer Canvas
            draw.rectangle([340, 160, 930, 520], fill=(22, 27, 34), outline=(51, 65, 85))
            draw.rectangle([340, 160, 930, 195], fill=(30, 41, 59))
            draw.text((360, 170), "DESIGNER CANVAS: Main.xaml*", font=self.font_subtitle, fill=(241, 245, 249))

            # Sequence Container
            draw.rounded_rectangle([365, 215, 905, 500], radius=10, fill=(15, 23, 42), outline=(255, 102, 0), width=2)
            draw.rectangle([365, 215, 905, 245], fill=(255, 102, 0))
            draw.text((385, 222), "Sequence - Automated Invoice Intake Pipeline", font=self.font_body, fill=(255, 255, 255))

            # Nested Activity inside designer
            draw.rounded_rectangle([390, 260, 880, 330], radius=8, fill=(30, 41, 59), outline=(56, 189, 248), width=1)
            draw.text((410, 275), "🌐 Use Application/Browser: 'SAP NetWeaver / Invoices'", font=self.font_body, fill=(56, 189, 248))
            draw.text((410, 302), "Target Selector: <html app='chrome.exe' title='Enterprise Portal' />", font=self.font_code_sm, fill=(148, 163, 184))

            draw.rounded_rectangle([390, 345, 880, 415], radius=8, fill=(30, 41, 59), outline=(16, 185, 129), width=1)
            draw.text((410, 360), "⌨️ Type Into: 'txt_InvoiceNumber'", font=self.font_body, fill=(16, 185, 129))
            draw.text((410, 387), "Value: in_TransactionItem.SpecificContent(\"InvoiceID\").ToString", font=self.font_code_sm, fill=(148, 163, 184))

            draw.rounded_rectangle([390, 430, 880, 485], radius=8, fill=(30, 41, 59), outline=(234, 88, 12), width=1)
            draw.text((410, 445), "🖱️ Click: 'btn_ProcessAndValidate'", font=self.font_body, fill=(234, 88, 12))

            # Right Sidebar: Properties Panel
            draw.rectangle([940, 160, width - 40, 520], fill=(15, 23, 42), outline=(51, 65, 85))
            draw.rectangle([940, 160, width - 40, 195], fill=(71, 85, 105))
            draw.text((955, 170), "PROPERTIES", font=self.font_subtitle, fill=(255, 255, 255))
            draw.text((955, 220), "• InputMode: Modern", font=self.font_code_sm, fill=(226, 232, 240))
            draw.text((955, 255), "• SimulateType: True", font=self.font_code_sm, fill=(226, 232, 240))
            draw.text((955, 290), "• Timeout: 30,000ms", font=self.font_code_sm, fill=(226, 232, 240))
            draw.text((955, 325), "• VerifyExecution: True", font=self.font_code_sm, fill=(226, 232, 240))
            draw.text((955, 360), "• Target: Unified Selector", font=self.font_code_sm, fill=(226, 232, 240))
            draw.text((955, 395), "• FuzzyAccuracy: 0.75", font=self.font_code_sm, fill=(226, 232, 240))
            draw.text((955, 430), "• StrictSelector: Active", font=self.font_code_sm, fill=(16, 185, 129))

        elif visual_type == "workflow_sequence_builder":
            # Connected Activity Sequence with Glowing Arrows
            draw.rounded_rectangle([40, 120, 680, 520], radius=12, fill=(15, 23, 42), outline=(255, 102, 0), width=2)
            draw.text((60, 135), "WORKFLOW SEQUENCE DESIGNER (CONNECTED NODES)", font=self.font_subtitle, fill=(255, 102, 0))

            steps = [
                ("1. Excel Process Scope", "Load /data/invoices_batch.xlsx into memory", (56, 189, 248)),
                ("2. Use Application / Browser", "Attach to Chrome target window (PID 14208)", (16, 185, 129)),
                ("3. Type Into: InvoiceID", "Modern targeting: Fuzzy selector + Computer Vision", (245, 158, 11)),
                ("4. Click: Submit Transaction", "Verify execution and check completion status", (168, 85, 247))
            ]

            y_pos = 175
            for title_text, desc_text, color in steps:
                draw.rounded_rectangle([70, y_pos, 650, y_pos + 65], radius=8, fill=(30, 41, 59), outline=color, width=2)
                draw.text((90, y_pos + 12), title_text, font=self.font_body, fill=color)
                draw.text((90, y_pos + 38), desc_text, font=self.font_caption, fill=(203, 213, 225))
                # Connector arrow
                if y_pos < 380:
                    draw.polygon([(360, y_pos + 67), (355, y_pos + 78), (365, y_pos + 78)], fill=(255, 255, 255))
                    draw.rectangle([359, y_pos + 65, 361, y_pos + 78], fill=(255, 255, 255))
                y_pos += 85

            # Right Panel: UI Explorer Selector Tuning
            draw.rounded_rectangle([700, 120, width - 40, 520], radius=12, fill=(22, 27, 34), outline=(56, 189, 248), width=2)
            draw.rectangle([700, 120, width - 40, 160], fill=(2, 132, 199))
            draw.text((720, 132), "UI EXPLORER: SELECTOR TUNING & VALIDATION", font=self.font_subtitle, fill=(255, 255, 255))

            draw.text((720, 185), "XML Selector Definition:", font=self.font_body, fill=(226, 232, 240))
            draw.rectangle([720, 215, width - 60, 310], fill=(13, 17, 23), outline=(48, 54, 61))
            draw.text((735, 228), "<html app='chrome.exe' title='Invoice Portal' />", font=self.font_code, fill=(244, 63, 94))
            draw.text((735, 255), "<webctrl tag='INPUT' id='txt_invoice_id' />", font=self.font_code, fill=(56, 189, 248))
            draw.text((735, 282), "<fuzzySelector confidence='0.85' />", font=self.font_code, fill=(16, 185, 129))

            draw.text((720, 335), "Targeting Methods Enabled:", font=self.font_body, fill=(226, 232, 240))
            draw.text((740, 365), "✓ Strict Native Windows Selector", font=self.font_caption, fill=(16, 185, 129))
            draw.text((740, 395), "✓ Fuzzy Element Match (Levenshtein Distance)", font=self.font_caption, fill=(16, 185, 129))
            draw.text((740, 425), "✓ Computer Vision (Deep Learning Anchor)", font=self.font_caption, fill=(16, 185, 129))
            draw.text((740, 455), "✓ Image Recognition Fallback", font=self.font_caption, fill=(16, 185, 129))

        elif visual_type == "variables_data_manager":
            # Variables & Data Table Inspection
            draw.rounded_rectangle([40, 120, width - 40, 300], radius=12, fill=(15, 23, 42), outline=(56, 189, 248), width=2)
            draw.rectangle([40, 120, width - 40, 160], fill=(30, 41, 59))
            draw.text((60, 132), "STUDIO DATA MANAGER & VARIABLES INSPECTION", font=self.font_subtitle, fill=(56, 189, 248))

            # Table Header
            draw.rectangle([50, 170, width - 50, 205], fill=(51, 65, 85))
            draw.text((65, 180), "VARIABLE NAME", font=self.font_code, fill=(255, 255, 255))
            draw.text((360, 180), "VARIABLE TYPE", font=self.font_code, fill=(255, 255, 255))
            draw.text((680, 180), "SCOPE", font=self.font_code, fill=(255, 255, 255))
            draw.text((950, 180), "DEFAULT VALUE", font=self.font_code, fill=(255, 255, 255))

            var_rows = [
                ("dt_Transactions", "System.Data.DataTable", "Main Sequence", "New DataTable()"),
                ("in_InvoiceNumber", "System.String", "Process Transaction", "\"INV-2026-901\""),
                ("out_IsSuccess", "System.Boolean", "Process Transaction", "False"),
                ("queue_Item", "UiPath.Core.QueueItem", "Global Scope", "Nothing")
            ]
            y_v = 215
            for vname, vtype, vscope, vdef in var_rows:
                draw.text((65, y_v), vname, font=self.font_code_sm, fill=(56, 189, 248))
                draw.text((360, y_v), vtype, font=self.font_code_sm, fill=(245, 158, 11))
                draw.text((680, y_v), vscope, font=self.font_code_sm, fill=(203, 213, 225))
                draw.text((950, y_v), vdef, font=self.font_code_sm, fill=(148, 163, 184))
                y_v += 22

            # Data Table Preview Grid
            draw.rounded_rectangle([40, 315, width - 40, 520], radius=12, fill=(22, 27, 34), outline=(16, 185, 129), width=2)
            draw.text((60, 328), "EXTRACTED DATASET: dt_Transactions (In-Memory DataTable)", font=self.font_subtitle, fill=(16, 185, 129))

            draw.rectangle([50, 360, width - 50, 395], fill=(30, 41, 59))
            draw.text((65, 370), "INVOICE #", font=self.font_code, fill=(255, 255, 255))
            draw.text((300, 370), "VENDOR NAME", font=self.font_code, fill=(255, 255, 255))
            draw.text((620, 370), "AMOUNT ($)", font=self.font_code, fill=(255, 255, 255))
            draw.text((880, 370), "CONFIDENCE", font=self.font_code, fill=(255, 255, 255))
            draw.text((1070, 370), "STATUS", font=self.font_code, fill=(255, 255, 255))

            data_rows = [
                ("INV-9021", "Siemens Industry AG", "$14,250.00", "99.8%", "VALIDATED"),
                ("INV-9022", "Microsoft Cloud Services", "$8,420.50", "99.9%", "VALIDATED"),
                ("INV-9023", "UiPath Enterprise Platform", "$12,900.00", "100.0%", "PROCESSED"),
                ("INV-9024", "Amazon Web Services Inc", "$5,110.20", "99.4%", "QUEUED")
            ]
            y_d = 405
            for r_inv, r_vend, r_amt, r_conf, r_st in data_rows:
                draw.text((65, y_d), r_inv, font=self.font_code_sm, fill=(226, 232, 240))
                draw.text((300, y_d), r_vend, font=self.font_code_sm, fill=(226, 232, 240))
                draw.text((620, y_d), r_amt, font=self.font_code_sm, fill=(245, 158, 11))
                draw.text((880, y_d), r_conf, font=self.font_code_sm, fill=(16, 185, 129))
                draw.text((1070, y_d), r_st, font=self.font_code_sm, fill=(56, 189, 248))
                y_d += 26

        elif visual_type == "live_execution_console":
            # Live Terminal Output Console
            draw.rounded_rectangle([40, 120, width - 40, 520], radius=12, fill=(10, 15, 23), outline=(16, 185, 129), width=2)
            draw.rectangle([40, 120, width - 40, 160], fill=(22, 27, 34))
            draw.text((60, 132), "UIPATH ROBOT EXECUTION CONSOLE // LIVE OUTPUT MONITOR", font=self.font_subtitle, fill=(16, 185, 129))

            # Status pill
            draw.rounded_rectangle([width - 240, 128, width - 60, 152], radius=6, fill=(6, 78, 59), outline=(16, 185, 129))
            draw.text((width - 225, 134), "● ROBOT ACTIVE (0 ERRORS)", font=self.font_code_sm, fill=(167, 243, 208))

            logs = [
                ("[14:02:01.120 INF]", "Robot runtime initialized: UiPath Assistant v2024.10 (Modern Design)", (56, 189, 248)),
                ("[14:02:02.430 INF]", "Connecting to target process: chrome.exe (PID 14208) via Unified API", (16, 185, 129)),
                ("[14:02:03.110 INF]", "Reading Excel dataset: /data/enterprise_invoices_q4.xlsx (64 records loaded)", (245, 158, 11)),
                ("[14:02:04.550 INF]", "Executing UI Selector: <webctrl id='invoiceId' /> (Confidence: 100%)", (56, 189, 248)),
                ("[14:02:05.890 INF]", "Document Understanding ML Extractor: 64 of 64 invoices processed", (16, 185, 129)),
                ("[14:02:06.210 INF]", "Dispatched transactional items to Orchestrator Queue 'AJIET_ProductionQueue'", (168, 85, 247)),
                ("[14:02:07.450 INF]", "Workflow completed successfully in 4.38s. Memory: 142MB | CPU: 1.8%", (16, 185, 129)),
                ("[14:02:07.490 INF]", "Quality verification sign-off issued. Zero unhandled exceptions.", (56, 189, 248))
            ]

            y_log = 180
            for tag, log_msg, col in logs:
                draw.text((65, y_log), tag, font=self.font_code, fill=col)
                draw.text((260, y_log), log_msg, font=self.font_code, fill=(241, 245, 249))
                y_log += 38

        else:
            # Deployment & Community Best Practices Outro
            draw.rounded_rectangle([40, 120, width - 40, 520], radius=12, fill=(15, 23, 42), outline=(255, 102, 0), width=2)
            draw.rectangle([40, 120, width - 40, 160], fill=(255, 102, 0))
            draw.text((60, 132), "DEPLOYMENT & UIPATH COMMUNITY AJIET BEST PRACTICES", font=self.font_subtitle, fill=(255, 255, 255))

            draw.rounded_rectangle([70, 180, 580, 330], radius=10, fill=(30, 41, 59), outline=(56, 189, 248), width=1)
            draw.text((90, 195), "☁️ ORCHESTRATOR PACKAGE PUBLISHED", font=self.font_subtitle, fill=(56, 189, 248))
            draw.text((90, 235), "Package: UiPathCommunityAJIET.InvoiceMasterclass.1.0.0", font=self.font_code_sm, fill=(226, 232, 240))
            draw.text((90, 265), "Runtime: Unattended Robot Fleet (Cloud-Hosted)", font=self.font_code_sm, fill=(226, 232, 240))
            draw.text((90, 295), "Trigger: Automated Daily Schedule @ 09:00 AM IST", font=self.font_code_sm, fill=(16, 185, 129))

            draw.rounded_rectangle([620, 180, width - 70, 330], radius=10, fill=(30, 41, 59), outline=(245, 158, 11), width=1)
            draw.text((640, 195), "🌟 3 GOLDEN RULES OF AUTOMATION", font=self.font_subtitle, fill=(245, 158, 11))
            draw.text((640, 235), "1. Always adopt the Modern Experience targeting framework", font=self.font_caption, fill=(226, 232, 240))
            draw.text((640, 265), "2. Implement Global Exception Handlers & Retry Mechanisms", font=self.font_caption, fill=(226, 232, 240))
            draw.text((640, 295), "3. Parameterize all environmental variables & queue names", font=self.font_caption, fill=(226, 232, 240))

            draw.rounded_rectangle([70, 350, width - 70, 490], radius=10, fill=(24, 24, 27), outline=(225, 29, 72), width=2)
            draw.text((90, 370), "🔔 JOIN UIPATH COMMUNITY AJIET // SUBSCRIBE FOR WEEKLY MASTERCLASSES", font=self.font_subtitle, fill=(244, 63, 94))
            draw.text((90, 410), "• Download the complete project .xaml files from the description link below", font=self.font_body, fill=(226, 232, 240))
            draw.text((90, 445), "• Share your questions in the comments – our engineering mentors reply to every query!", font=self.font_body, fill=(226, 232, 240))

        # 4. Spoken Subtitle Caption Overlay Bar (540px to 670px)
        draw.rounded_rectangle([36, 535, width - 36, 675], radius=12, fill=(10, 15, 25), outline=(51, 65, 85), width=2)
        narration = scene.get("narration", "")
        words = narration.split()
        wrapped_lines = []
        cur_line = []
        for word in words:
            if len(" ".join(cur_line + [word])) > 58:
                wrapped_lines.append(" ".join(cur_line))
                cur_line = [word]
            else:
                cur_line.append(word)
        if cur_line:
            wrapped_lines.append(" ".join(cur_line))

        y_sub = 548
        for line in wrapped_lines[:3]:
            draw.text((55, y_sub), line, font=self.font_body, fill=(255, 255, 255))
            y_sub += 36

        # 5. Bottom Timeline Scrubber & Chapter Notches
        draw.rectangle([0, height - 38, width, height], fill=(11, 15, 23))
        # Progress track
        draw.rectangle([36, height - 20, width - 36, height - 12], fill=(30, 41, 59))
        progress_ratio = (scene_idx + 1) / total_scenes
        draw.rectangle([36, height - 20, int(36 + (width - 72) * progress_ratio), height - 12], fill=(255, 102, 0))

        # Chapter notches
        for ch in range(1, total_scenes):
            notch_x = int(36 + (width - 72) * (ch / total_scenes))
            draw.rectangle([notch_x - 1, height - 24, notch_x + 1, height - 8], fill=(255, 255, 255))

        draw.text((36, height - 34), f"Masterclass Progress: Scene {scene_idx + 1}/{total_scenes}  |  5+ Min Full Technical Tutorial", font=self.font_footer, fill=(148, 163, 184))

        # 6. Add Official Mascot AURI in bottom-right corner with Audio Waveform Pulse
        auri_sprite = Path("/home/arjun/Desktop/PROJECTS/UiPathAJIET/frontend/public/assets/sprites/orbi/orbi_waving_f0.png")
        if auri_sprite.exists():
            auri_img = Image.open(auri_sprite).convert("RGBA")
            auri_small = auri_img.resize((120, 120), Image.Resampling.NEAREST)
            img.paste(auri_small, (width - 150, height - 190), auri_small)

        return img

    def get_audio_duration(self, audio_path: Path) -> float:
        """Returns exact duration in seconds of an audio file using ffprobe."""
        cmd = [self.ffmpeg_exe, "-i", str(audio_path)]
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        import re
        m = re.search(r"Duration:\s*(\d+):(\d+):(\d+\.\d+)", res.stderr)
        if m:
            h, m_m, s = float(m.group(1)), float(m.group(2)), float(m.group(3))
            return h * 3600 + m_m * 60 + s
        return 10.0

    async def render_single_scene(self, project_dir: str | Path, scene: Dict[str, Any], total_scenes: int = 6) -> Path:
        """
        Renders an individual scene segment into an isolated MP4 file.
        Used for autonomous repair to regenerate defective scenes without
        rebuilding approved unaffected scenes.
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
        scene["duration"] = max(duration, 4.0)

        # 2. Render Visual Frame
        frame_img = self.render_scene_frame(scene, scene_idx=idx, total_scenes=total_scenes, width=1280, height=720)
        frame_path = temp_dir / f"{scene_id}_frame.png"
        frame_img.save(frame_path)

        # 3. Render Scene Video Segment
        scene_mp4 = scenes_dir / f"{scene_id}.mp4"
        cmd = [
            self.ffmpeg_exe, "-y",
            "-loop", "1",
            "-i", str(frame_path),
            "-i", str(audio_path),
            "-c:v", "libx264",
            "-t", f"{scene['duration']:.2f}",
            "-pix_fmt", "yuv420p",
            "-r", "30",
            "-c:a", "aac",
            "-b:a", "192k",
            "-shortest",
            str(scene_mp4)
        ]
        subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        # Cleanup temp frame
        try:
            frame_path.unlink(missing_ok=True)
        except Exception:
            pass

        return scene_mp4

    async def assemble_video_from_scenes(self, project_dir: str | Path, scenes: List[Dict[str, Any]]) -> Path:
        """
        Assembles all individual scene MP4 segments into a cohesive 16:9 Master Video
        and 9:16 Vertical Reel with audio and subtitles.
        Preserves approved unaffected scenes during autonomous repair!
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

        # 2. Create Master Concat Script
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
            "-c", "copy",
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

        # 4. Generate Subtitles
        sub_gen = SubtitleGenerator()
        sub_srt = p_dir / "subtitles.srt"
        sub_gen.generate_srt(scenes, sub_srt)

        # 5. Render 9:16 Vertical Instagram Reel
        total_scenes = len(scenes)
        reel_concat_txt = temp_dir / "reel_concat.txt"
        for idx, scene in enumerate(scenes):
            frame_vertical = Image.new("RGB", (720, 1280), (13, 17, 23))
            d_v = ImageDraw.Draw(frame_vertical)

            # Top branding
            d_v.rectangle([0, 0, 720, 90], fill=(255, 102, 0))
            d_v.text((40, 32), "UiPath Community AJIET | Reels", font=self.font_header, fill=(255, 255, 255))

            # Scaled 16:9 frame preview
            horiz = self.render_scene_frame(scene, scene_idx=idx, total_scenes=total_scenes, width=1280, height=720)
            horiz_resized = horiz.resize((680, 382), Image.Resampling.BILINEAR)
            frame_vertical.paste(horiz_resized, (20, 120))

            # Middle Callout Card
            d_v.rounded_rectangle([30, 520, 690, 860], radius=16, fill=(22, 27, 34), outline=(56, 189, 248), width=2)
            d_v.text((50, 540), scene.get("title", "").upper(), font=self.font_subtitle, fill=(0, 229, 255))

            # Subtitle lines
            words = scene.get("narration", "").split()
            lines, cur = [], []
            for w in words:
                if len(" ".join(cur + [w])) > 34:
                    lines.append(" ".join(cur))
                    cur = [w]
                else:
                    cur.append(w)
            if cur:
                lines.append(" ".join(cur))

            y_rl = 590
            for l in lines[:6]:
                d_v.text((50, y_rl), l, font=self.font_body, fill=(241, 245, 249))
                y_rl += 42

            # Bottom CTA
            d_v.rounded_rectangle([30, 890, 690, 1150], radius=16, fill=(15, 23, 42), outline=(255, 102, 0), width=2)
            d_v.text((50, 915), "🚀 AUTOMATION QUICK TIP", font=self.font_subtitle, fill=(255, 102, 0))
            d_v.text((50, 960), "Follow @uipath_ajiet on Instagram", font=self.font_body, fill=(255, 255, 255))
            d_v.text((50, 1000), "Save this Reel for your next RPA lab!", font=self.font_body, fill=(148, 163, 184))

            frame_vertical.save(temp_dir / f"reel_frame_{idx:02d}.png")

        with open(reel_concat_txt, "w") as f:
            for idx, scene in enumerate(scenes):
                f.write(f"file 'reel_frame_{idx:02d}.png'\n")
                f.write(f"duration {scene['duration']:.2f}\n")
            f.write(f"file 'reel_frame_{len(scenes)-1:02d}.png'\n")

        reel_mp4 = p_dir / "reel_9x16.mp4"
        cmd_reel = [
            self.ffmpeg_exe, "-y",
            "-f", "concat",
            "-safe", "0",
            "-i", str(reel_concat_txt),
            "-i", str(full_audio_wav),
            "-c:v", "libx264",
            "-pix_fmt", "yuv420p",
            "-r", "30",
            "-c:a", "aac",
            "-b:a", "192k",
            "-shortest",
            str(reel_mp4)
        ]
        subprocess.run(cmd_reel, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        shutil.rmtree(temp_dir, ignore_errors=True)
        return master_mp4

    async def render_project_video(self, project_id: str, script_data: Dict[str, Any], output_dir: str | Path) -> Dict[str, str]:
        """
        Master Pipeline Method:
        1. Synthesizes neural audio per scene.
        2. Renders isolated scene segments.
        3. Creates structured Production Manifest (manifest.json).
        4. Assembles 16:9 Master Video and 9:16 Vertical Reel.
        """
        out_dir = Path(output_dir)
        out_dir.mkdir(parents=True, exist_ok=True)
        audio_dir = out_dir / "audio"
        scenes_dir = out_dir / "scenes"
        audio_dir.mkdir(parents=True, exist_ok=True)
        scenes_dir.mkdir(parents=True, exist_ok=True)

        scenes = script_data.get("scenes", [])
        if not scenes:
            from backend.app.engine.llm_provider import HeuristicLLMProvider
            provider = HeuristicLLMProvider()
            raw = await provider.generate("UiPath Studio Automation", role="scriptwriter")
            parsed = json.loads(raw)
            scenes = parsed.get("scenes", [])

        # 1. Synthesize Audio and Setup Timestamps
        total_time = 0.0
        structured_scenes = []
        for idx, scene in enumerate(scenes):
            scene_id = f"scene_{idx+1:02d}"
            scene["scene_id"] = scene_id
            scene["scene_number"] = idx + 1

            audio_file = audio_dir / f"{scene_id}.wav"
            narration_text = scene.get("narration", scene.get("title", ""))
            self.tts.synthesize_speech(narration_text, audio_file)
            dur = max(self.get_audio_duration(audio_file), 4.0)

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
            "title": script_data.get("title", "UiPath Studio Masterclass"),
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
            "narration_audio": f"/media/{project_id}/full_narration.wav",
            "manifest": f"/media/{project_id}/production_manifest.json"
        }
