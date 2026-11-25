"""
E-Certificate PDF Generator & Google Sheet Roster Importer for Project Autonomia.
100% free-of-cost pipeline using public Google Sheet CSV export + Headless Chrome PDF rendering.
"""

import csv
import io
import json
import re
import subprocess
import urllib.request
import uuid
import zipfile
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from backend.app.config import DATA_DIR

CERTIFICATES_DIR = DATA_DIR / "certificates"
TEMPLATES_DIR = CERTIFICATES_DIR / "templates"
CHROME_CERT_SCRIPT = Path(__file__).resolve().parent.parent / "media" / "chrome_cert_renderer.mjs"


def normalize_google_sheet_csv_url(sheet_url: str) -> str:
    """Converts a standard Google Sheets URL into its direct CSV export URL."""
    url = (sheet_url or "").strip()
    m = re.search(r"/spreadsheets/d/([a-zA-Z0-9-_]+)", url)
    if not m:
        raise ValueError("Invalid Google Sheets URL. Expected a link containing /spreadsheets/d/<ID>.")
    sheet_id = m.group(1)
    gid_match = re.search(r"[?&#]gid=(\d+)", url)
    gid = gid_match.group(1) if gid_match else "0"
    return f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv&gid={gid}"


def parse_csv_roster(csv_text: str) -> List[Dict[str, str]]:
    """
    Parses a CSV string into normalized student records (`name`, `email`, `department`).
    Matches common header variations (e.g. 'Full Name', 'Student Name', 'Name', 'Email', 'USN').
    """
    reader = csv.DictReader(io.StringIO(csv_text.strip()))
    if not reader.fieldnames:
        return []

    headers = {h.strip().lower(): h for h in reader.fieldnames if h}

    def pick_key(candidates: List[str]) -> Optional[str]:
        for c in candidates:
            for low, orig in headers.items():
                if c in low:
                    return orig
        return None

    name_col = pick_key(["full name", "student name", "participant", "name"])
    email_col = pick_key(["email", "e-mail", "mail"])
    dept_col = pick_key(["department", "branch", "usn", "college", "section"])

    students: List[Dict[str, str]] = []
    for row in reader:
        raw_name = (row.get(name_col) if name_col else None) or ""
        if not raw_name.strip():
            # Fallback to first non-empty cell
            for v in row.values():
                if v and v.strip():
                    raw_name = v.strip()
                    break
        if not raw_name.strip():
            continue
        students.append({
            "name": raw_name.strip(),
            "email": ((row.get(email_col) or "").strip() if email_col else ""),
            "department": ((row.get(dept_col) or "").strip() if dept_col else "")
        })
    return students


def fetch_google_sheet_students(sheet_url: str) -> List[Dict[str, str]]:
    """Fetches a shared Google Sheet as CSV and parses registered student rows."""
    export_url = normalize_google_sheet_csv_url(sheet_url)
    req = urllib.request.Request(export_url, headers={"User-Agent": "AutonomiaCertImporter/1.0"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        raw = resp.read().decode("utf-8-sig", errors="replace")
    if "<html" in raw[:300].lower():
        raise ValueError(
            "Google Sheet is private or requires sign-in. Set sharing to 'Anyone with the link can view' or upload a CSV."
        )
    return parse_csv_roster(raw)


def generate_certificates_batch(
    students: List[Dict[str, str]],
    event_title: str,
    subtitle: str = "Certificate of Participation",
    issue_date: Optional[str] = None,
    issuer_name: str = "Arjun",
    issuer_role: str = "Founder & CEO, UiPath Community AJIET",
    template_id: Optional[str] = None,
    layout: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Renders one printable A4-Landscape PDF per student using Headless Chrome
    and bundles all PDFs into a downloadable ZIP archive.
    """
    if not students:
        raise ValueError("At least one student is required to generate certificates.")

    batch_id = f"cert_{uuid.uuid4().hex[:8]}"
    batch_dir = CERTIFICATES_DIR / batch_id
    pdfs_dir = batch_dir / "pdfs"
    pdfs_dir.mkdir(parents=True, exist_ok=True)

    date_str = issue_date or datetime.now().strftime("%B %d, %Y")
    template_path: Optional[Path] = None
    if template_id:
        candidate = TEMPLATES_DIR / template_id
        if candidate.exists():
            template_path = candidate

    items = []
    generated_files: List[Dict[str, str]] = []
    for idx, st in enumerate(students, start=1):
        name = (st.get("name") or "").strip()
        if not name:
            continue
        cert_id = f"AJIET-{datetime.now().strftime('%Y')}-{batch_id[-4:].upper()}-{idx:03d}"
        safe_name = re.sub(r"[^A-Za-z0-9_-]+", "_", name).strip("_") or f"student_{idx}"
        pdf_filename = f"{safe_name}_{cert_id}.pdf"
        pdf_path = pdfs_dir / pdf_filename
        items.append({
            "name": name,
            "email": st.get("email", ""),
            "department": st.get("department", ""),
            "certId": cert_id,
            "outputPath": str(pdf_path)
        })
        generated_files.append({
            "name": name,
            "cert_id": cert_id,
            "filename": pdf_filename,
            "preview_url": f"/api/certificates/file/{batch_id}/{pdf_filename}"
        })

    if not items:
        raise ValueError("No valid student names found.")

    layout = layout or {}
    cfg_path = batch_dir / "render_job.json"
    cfg_path.write_text(json.dumps({
        "items": items,
        "templatePath": str(template_path) if template_path else None,
        "meta": {
            "eventTitle": event_title,
            "subtitle": subtitle,
            "issueDate": date_str,
            "issuerName": issuer_name,
            "issuerRole": issuer_role,
            "nameY": layout.get("nameY", 48),
            "nameSize": layout.get("nameSize", 46),
            "textColor": layout.get("textColor", "#0f172a"),
            "showMeta": layout.get("showMeta", True)
        }
    }), encoding="utf-8")

    res = subprocess.run(
        ["node", str(CHROME_CERT_SCRIPT), str(cfg_path)],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        timeout=120
    )
    if res.returncode != 0:
        raise RuntimeError(f"PDF certificate rendering failed: {res.stderr}")

    zip_filename = f"certificates_{batch_id}.zip"
    zip_path = batch_dir / zip_filename
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for gf in generated_files:
            p = pdfs_dir / gf["filename"]
            if p.exists():
                zf.write(p, arcname=gf["filename"])

    return {
        "batch_id": batch_id,
        "count": len(generated_files),
        "preview_pdf_url": generated_files[0]["preview_url"],
        "zip_url": f"/api/certificates/file/{batch_id}/{zip_filename}",
        "files": generated_files
    }
