from __future__ import annotations

from uipath_email_sender.report_generator import build_initial_report, export_campaign_report, update_report_status


def test_build_initial_report_marks_all_recipient_rows_pending() -> None:
    data = [{"email": "a@example.com", "name": "Alice", "excel_row": 3}, {"email": "b@example.com", "name": "Bob", "excel_row": 4}]

    report = build_initial_report(data)

    assert len(report) == 2
    assert all(row["status"] == "pending" for row in report)


def test_update_report_status_changes_status_and_error_message() -> None:
    data = [{"participant_name": "Alice", "email_address": "a@example.com", "excel_row": 3, "status": "pending", "error_message": "", "timestamp": ""}]

    update_report_status(data, "a@example.com", "success", "")

    assert data[0]["status"] == "success"
    assert data[0]["error_message"] == ""


def test_export_campaign_report_creates_files(tmp_path) -> None:
    results = [{
        "participant_name": "Alice",
        "email_address": "a@example.com",
        "excel_row": 2,
        "status": "success",
        "error_message": "",
        "timestamp": "2026-11-08 10:00:00",
    }]

    import tempfile
    from pathlib import Path

    original_reports_dir = Path(tempfile.gettempdir())
    # This test validates the export path logic by verifying files can be written in the project reports directory.
    excel_path, csv_path = export_campaign_report(results, campaign_name="unit_test_campaign")

    assert excel_path.exists()
    assert csv_path.exists()
