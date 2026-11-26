"""Automated tests for E-Certificate PDF Studio, ASS Subtitles, and Procedural Audio Bed."""

import wave
import zipfile
import pytest

from backend.app.certificates.service import (
    normalize_google_sheet_csv_url,
    parse_csv_roster,
    parse_excel_roster,
    parse_excel_with_columns,
    generate_certificates_batch,
)
from backend.app.media.subtitle_generator import SubtitleGenerator
from backend.app.media.audio_bed import generate_ambient_bed


def test_normalize_google_sheet_url():
    url = "https://docs.google.com/spreadsheets/d/1AbCDefGhIjKlMnOpQrStUvWxYz/edit#gid=42"
    csv_url = normalize_google_sheet_csv_url(url)
    assert csv_url == "https://docs.google.com/spreadsheets/d/1AbCDefGhIjKlMnOpQrStUvWxYz/export?format=csv&gid=42"

    with pytest.raises(ValueError):
        normalize_google_sheet_csv_url("https://example.com/not-a-sheet")


def test_parse_csv_roster_normalizes_columns():
    csv_text = (
        "Timestamp,Full Name,Email Address,Branch / Section\n"
        "2026-11-25,Aarav Sharma,aarav@ajiet.edu.in,CSE - A\n"
        "2026-11-25,Diya Nair,diya@ajiet.edu.in,ISE - B\n"
        "2026-11-25,,,\n"
    )
    students = parse_csv_roster(csv_text)
    assert len(students) == 2
    assert students[0]["name"] == "Aarav Sharma"
    assert students[0]["email"] == "aarav@ajiet.edu.in"
    assert students[0]["department"] == "CSE - A"
    assert students[1]["name"] == "Diya Nair"


def test_parse_excel_roster_normalizes_columns():
    import io
    import openpyxl

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.append(["Student Name", "Email", "Department"])
    ws.append(["Rohan Hegde", "rohan@ajiet.edu.in", "AIML"])
    ws.append([None, None, None])
    buf = io.BytesIO()
    wb.save(buf)

    students = parse_excel_roster(buf.getvalue())
    assert len(students) == 1
    assert students[0] == {"name": "Rohan Hegde", "email": "rohan@ajiet.edu.in", "department": "AIML"}


def test_parse_excel_with_columns_matches_registration_sheet():
    import io
    import openpyxl

    headers = [
        "Timestamp",
        "Full Name",
        "USN (University Seat Number)",
        "Email Address",
        "Phone Number (WhatsApp)",
        "Branch",
        "Year of Study",
        "Section",
        "Prior Experience with UiPath / RPA?",
        "Will you bring a Windows laptop for the session?",
    ]
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.append(headers)
    ws.append([
        "2026-11-26 10:00:00",
        "Ananya Rao",
        "4JK23CS012",
        "ananya@ajiet.edu.in",
        "9876543210",
        "Computer Science & Engineering",
        "3rd Year",
        "A",
        "No",
        "Yes",
    ])
    ws.append([None] * len(headers))
    buf = io.BytesIO()
    wb.save(buf)

    parsed = parse_excel_with_columns(buf.getvalue())
    assert parsed["columns"] == headers
    assert parsed["suggested_mapping"] == {
        "name_col": "Full Name",
        "email_col": "Email Address",
        "dept_col": "Branch",
    }
    assert parsed["students"] == [{
        "name": "Ananya Rao",
        "email": "ananya@ajiet.edu.in",
        "department": "Computer Science & Engineering",
    }]


def test_generate_certificates_batch_creates_pdfs_and_zip(tmp_path, monkeypatch):
    import backend.app.certificates.service as cert_svc
    monkeypatch.setattr(cert_svc, "CERTIFICATES_DIR", tmp_path)
    monkeypatch.setattr(cert_svc, "TEMPLATES_DIR", tmp_path / "templates")

    res = generate_certificates_batch(
        students=[
            {"name": "Aarav Sharma", "department": "CSE"},
            {"name": "Diya Nair", "department": "ISE"},
        ],
        event_title="Automate Campus Quest",
    )
    assert res["count"] == 2
    bdir = tmp_path / res["batch_id"]
    zip_path = bdir / f"certificates_{res['batch_id']}.zip"
    assert zip_path.exists()

    with zipfile.ZipFile(zip_path, "r") as zf:
        names = zf.namelist()
        assert len(names) == 2
        for fname in names:
            assert fname.endswith(".pdf")
            assert zf.read(fname)[:4] == b"%PDF"


def test_subtitle_generator_ass_karaoke_output(tmp_path):
    ass_path = tmp_path / "subtitles.ass"
    scenes = [
        {"duration": 6.0, "narration": "Welcome to UiPath Community AJIET automation lab."},
        {"duration": 5.0, "narration": "Building workflows in Studio."}
    ]
    out = SubtitleGenerator.generate_ass(scenes, ass_path, width=1920, height=1080, chunk_words=4)
    content = out.read_text(encoding="utf-8")
    assert "[Script Info]" in content
    assert "PlayResX: 1920" in content
    assert "Dialogue:" in content
    assert r"\kf" in content


def test_generate_ambient_bed_creates_valid_wav(tmp_path):
    wav_path = tmp_path / "ambient.wav"
    out = generate_ambient_bed(3.0, wav_path, sample_rate=24000)
    assert out.exists()
    with wave.open(str(out), "rb") as wf:
        assert wf.getnchannels() == 1
        assert wf.getframerate() == 24000
        assert abs((wf.getnframes() / 24000.0) - 3.0) < 0.05
