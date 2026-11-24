from __future__ import annotations

from datetime import datetime
from pathlib import Path

import pandas as pd

from .config import get_reports_dir


def export_campaign_report(results: list[dict], campaign_name: str = "campaign_report") -> tuple[Path, Path]:
    """Export a campaign results DataFrame to Excel and CSV files."""
    reports_dir = get_reports_dir()
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    excel_path = reports_dir / f"{campaign_name}_{timestamp}.xlsx"
    csv_path = reports_dir / f"{campaign_name}_{timestamp}.csv"

    df = pd.DataFrame(results)
    if not df.empty:
        df = df[[
            "participant_name",
            "email_address",
            "excel_row",
            "status",
            "error_message",
            "timestamp",
        ]]

    df.to_excel(excel_path, index=False)
    df.to_csv(csv_path, index=False)
    return excel_path, csv_path


def generate_report_rows(valid_records: list[dict], status_updates: dict[str, str] | None = None) -> list[dict]:
    """Build the final report rows for all recipients."""
    status_updates = status_updates or {}
    rows: list[dict] = []
    for record in valid_records:
        email = record["email"]
        status = status_updates.get(email, "pending")
        rows.append({
            "participant_name": record.get("name") or "Participant",
            "email_address": email,
            "excel_row": record.get("excel_row"),
            "status": status,
            "error_message": "",
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        })
    return rows


def update_report_status(report_rows: list[dict], email: str, status: str, error_message: str = "", timestamp: str | None = None) -> None:
    """Update the status of a particular email in the report rows."""
    for row in report_rows:
        if row["email_address"] == email:
            row["status"] = status
            row["error_message"] = error_message
            row["timestamp"] = timestamp or datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            break


def build_initial_report(valid_records: list[dict]) -> list[dict]:
    """Create a pre-send report with all recipients marked as pending."""
    results = []
    for record in valid_records:
        results.append({
            "participant_name": record.get("name") or "Participant",
            "email_address": record["email"],
            "excel_row": record.get("excel_row"),
            "status": "pending",
            "error_message": "",
            "timestamp": "",
        })
    return results
