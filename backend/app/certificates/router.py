"""FastAPI router for E-Certificate PDF Studio."""

import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel

from backend.app.certificates.service import (
    CERTIFICATES_DIR,
    TEMPLATES_DIR,
    fetch_google_sheet_with_columns,
    generate_certificates_batch,
    parse_csv_with_columns,
    parse_excel_with_columns,
)

router = APIRouter(prefix="/api/certificates", tags=["certificates"])


class ImportSheetRequest(BaseModel):
    sheet_url: str


class GenerateCertificatesRequest(BaseModel):
    event_title: str = "Discovering UiPath & RPA"
    subtitle: str = "Certificate of Participation"
    issue_date: Optional[str] = None
    issuer_name: str = "Arjun R"
    issuer_role: str = "UiPath Student Developer Champion (SDC) AJIET"
    students: List[Dict[str, str]]
    template_id: Optional[str] = None
    layout: Optional[Dict[str, Any]] = None


@router.post("/import-sheet")
async def import_google_sheet(payload: ImportSheetRequest):
    try:
        parsed = fetch_google_sheet_with_columns(payload.sheet_url)
        return {**parsed, "count": len(parsed["students"])}
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post("/import-csv")
async def import_csv_file(file: UploadFile = File(...)):
    try:
        raw = await file.read()
        ext = Path(file.filename or "").suffix.lower()
        if ext in (".xlsx", ".xlsm"):
            parsed = parse_excel_with_columns(raw)
        else:
            text = raw.decode("utf-8-sig", errors="replace")
            parsed = parse_csv_with_columns(text)
        return {**parsed, "count": len(parsed["students"])}
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Spreadsheet parse error: {exc}")


@router.post("/upload-template")
async def upload_certificate_template(file: UploadFile = File(...)):
    ext = Path(file.filename or "template.png").suffix.lower()
    if ext not in (".png", ".jpg", ".jpeg"):
        raise HTTPException(status_code=400, detail="Template must be a PNG or JPG image.")
    TEMPLATES_DIR.mkdir(parents=True, exist_ok=True)
    template_id = f"tpl_{uuid.uuid4().hex[:8]}{ext}"
    dest = TEMPLATES_DIR / template_id
    dest.write_bytes(await file.read())
    return {"template_id": template_id, "filename": file.filename}


@router.post("/generate")
async def generate_certificates(payload: GenerateCertificatesRequest):
    try:
        result = generate_certificates_batch(
            students=payload.students,
            event_title=payload.event_title,
            subtitle=payload.subtitle,
            issue_date=payload.issue_date,
            issuer_name=payload.issuer_name,
            issuer_role=payload.issuer_role,
            template_id=payload.template_id,
            layout=payload.layout,
        )
        return result
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/file/{batch_id}/{filename}")
async def get_certificate_file(batch_id: str, filename: str):
    if ".." in batch_id or ".." in filename or "/" in filename:
        raise HTTPException(status_code=400, detail="Invalid path.")
    batch_dir = CERTIFICATES_DIR / batch_id
    candidate = batch_dir / filename
    if not candidate.exists():
        candidate = batch_dir / "pdfs" / filename
    if not candidate.exists():
        raise HTTPException(status_code=404, detail="Certificate file not found.")
    media_type = "application/zip" if filename.endswith(".zip") else "application/pdf"
    return FileResponse(path=str(candidate), media_type=media_type, filename=filename)
