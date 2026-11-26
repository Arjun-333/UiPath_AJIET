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


def _detect_roster_columns(fieldnames: List[str]) -> Dict[str, Optional[str]]:
    """Detects likely name, email, and department columns from header names."""
    headers = {str(h).strip().lower(): str(h).strip() for h in fieldnames if h is not None and str(h).strip()}

    def pick_key(candidates: List[str]) -> Optional[str]:
        for c in candidates:
            for low, orig in headers.items():
                if c in low:
                    return orig
        return None

    return {
        "name_col": pick_key(["full name", "student name", "participant", "name"]),
        "email_col": pick_key(["email", "e-mail", "mail"]),
        "dept_col": pick_key(["department", "branch", "usn", "college", "section"]),
    }


def _normalize_roster_rows(fieldnames: List[str], rows: List[Dict[str, Any]]) -> List[Dict[str, str]]:
    """Normalizes tabular rows into student records (`name`, `email`, `department`)."""
    clean_cols = [str(h).strip() for h in fieldnames if h is not None and str(h).strip()]
    if not clean_cols:
        return []

    detected = _detect_roster_columns(clean_cols)
    name_col = detected["name_col"]
    email_col = detected["email_col"]
    dept_col = detected["dept_col"]

    students: List[Dict[str, str]] = []
    for row in rows:
        if name_col:
            raw_name = str(row.get(name_col) or "").strip()
        else:
            raw_name = ""
            for v in row.values():
                if v is not None and str(v).strip():
                    raw_name = str(v).strip()
                    break
        if not raw_name:
            continue
        students.append({
            "name": raw_name,
            "email": (str(row.get(email_col) or "").strip() if email_col else ""),
            "department": (str(row.get(dept_col) or "").strip() if dept_col else "")
        })
    return students


def _build_roster_payload(fieldnames: List[str], rows: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Returns columns, raw stringified rows, suggested column mapping, and normalized students."""
    clean_cols = [str(h).strip() for h in fieldnames if h is not None and str(h).strip()]
    clean_rows = [
        {col: ("" if row.get(col) is None else str(row.get(col)).strip()) for col in clean_cols}
        for row in rows
        if any(row.get(col) is not None and str(row.get(col)).strip() for col in clean_cols)
    ]
    detected = _detect_roster_columns(clean_cols)
    if not detected["name_col"] and clean_cols:
        detected["name_col"] = clean_cols[0]
    students = _normalize_roster_rows(clean_cols, clean_rows)
    return {
        "columns": clean_cols,
        "rows": clean_rows,
        "suggested_mapping": detected,
        "students": students,
    }


def _read_csv_raw(csv_text: str) -> tuple[List[str], List[Dict[str, Any]]]:
    reader = csv.DictReader(io.StringIO(csv_text.strip()))
    if not reader.fieldnames:
        return [], []
    return [str(h).strip() for h in reader.fieldnames if h is not None and str(h).strip()], list(reader)


def _read_excel_raw(raw_bytes: bytes) -> tuple[List[str], List[Dict[str, Any]]]:
    import openpyxl

    wb = openpyxl.load_workbook(io.BytesIO(raw_bytes), read_only=True, data_only=True)
    try:
        ws = wb.active
        all_rows = list(ws.iter_rows(values_only=True))
    finally:
        wb.close()

    if not all_rows:
        return [], []
    fieldnames = [str(c).strip() if c is not None else f"col_{i}" for i, c in enumerate(all_rows[0])]
    dict_rows = [
        {fieldnames[i]: (row[i] if i < len(row) else None) for i in range(len(fieldnames))}
        for row in all_rows[1:]
    ]
    return fieldnames, dict_rows


def parse_csv_roster(csv_text: str) -> List[Dict[str, str]]:
    """
    Parses a CSV string into normalized student records (`name`, `email`, `department`).
    Matches common header variations (e.g. 'Full Name', 'Student Name', 'Name', 'Email', 'USN').
    """
    fieldnames, rows = _read_csv_raw(csv_text)
    return _normalize_roster_rows(fieldnames, rows)


def parse_csv_with_columns(csv_text: str) -> Dict[str, Any]:
    fieldnames, rows = _read_csv_raw(csv_text)
    return _build_roster_payload(fieldnames, rows)


def parse_excel_roster(raw_bytes: bytes) -> List[Dict[str, str]]:
    """Parses an Excel (.xlsx/.xlsm) workbook into normalized student records."""
    fieldnames, dict_rows = _read_excel_raw(raw_bytes)
    return _normalize_roster_rows(fieldnames, dict_rows)


def parse_excel_with_columns(raw_bytes: bytes) -> Dict[str, Any]:
    fieldnames, dict_rows = _read_excel_raw(raw_bytes)
    return _build_roster_payload(fieldnames, dict_rows)


def _fetch_google_sheet_csv_text(sheet_url: str) -> str:
    export_url = normalize_google_sheet_csv_url(sheet_url)
    req = urllib.request.Request(export_url, headers={"User-Agent": "AutonomiaCertImporter/1.0"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        raw = resp.read().decode("utf-8-sig", errors="replace")
    if "<html" in raw[:300].lower():
        raise ValueError(
            "Google Sheet is private or requires sign-in. Set sharing to 'Anyone with the link can view' or upload an Excel/CSV file."
        )
    return raw


def fetch_google_sheet_students(sheet_url: str) -> List[Dict[str, str]]:
    """Fetches a shared Google Sheet as CSV and parses registered student rows."""
    return parse_csv_roster(_fetch_google_sheet_csv_text(sheet_url))


def fetch_google_sheet_with_columns(sheet_url: str) -> Dict[str, Any]:
    """Fetches a shared Google Sheet and returns columns, raw rows, and suggested mapping."""
    return parse_csv_with_columns(_fetch_google_sheet_csv_text(sheet_url))


def generate_certificates_batch(
    students: List[Dict[str, str]],
    event_title: str = "Discovering UiPath & RPA",
    subtitle: str = "Certificate of Participation",
    issue_date: Optional[str] = None,
    issuer_name: str = "Arjun R",
    issuer_role: str = "UiPath Student Developer Champion (SDC) AJIET",
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

    date_str = issue_date or "November 28, 2026"
    template_path: Optional[Path] = None
    if template_id:
        candidate = TEMPLATES_DIR / template_id
        if candidate.exists():
            template_path = candidate

    items = []
    generated_files: List[Dict[str, str]] = []
    seen_names: Dict[str, int] = {}
    for idx, st in enumerate(students, start=1):
        name = (st.get("name") or "").strip()
        if not name:
            continue
        safe_name = re.sub(r"[^A-Za-z0-9_-]+", "_", name).strip("_") or f"student_{idx}"
        seen_names[safe_name] = seen_names.get(safe_name, 0) + 1
        suffix = f"_{seen_names[safe_name]}" if seen_names[safe_name] > 1 else ""
        pdf_filename = f"{safe_name}{suffix}.pdf"
        pdf_path = pdfs_dir / pdf_filename
        items.append({
            "name": name,
            "email": st.get("email", ""),
            "department": st.get("department", ""),
            "outputPath": str(pdf_path)
        })
        generated_files.append({
            "name": name,
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
