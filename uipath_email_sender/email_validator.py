from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any


EMAIL_RE = re.compile(
    r"^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@(?:[A-Za-z0-9-]+\.)+[A-Za-z]{2,}$"
)


@dataclass
class ValidationResult:
    """Result of validating a participant email list."""
    total_records: int
    valid_recipients: list[dict[str, Any]] = field(default_factory=list)
    invalid_emails: list[dict[str, Any]] = field(default_factory=list)
    duplicate_emails: list[dict[str, Any]] = field(default_factory=list)
    empty_emails: list[dict[str, Any]] = field(default_factory=list)

    @property
    def valid_count(self) -> int:
        return len(self.valid_recipients)

    @property
    def invalid_count(self) -> int:
        return len(self.invalid_emails)

    @property
    def duplicate_count(self) -> int:
        return len(self.duplicate_emails)

    @property
    def empty_count(self) -> int:
        return len(self.empty_emails)


def normalize_email(value: Any) -> str:
    """Normalize and trim the incoming email value."""
    if value is None:
        return ""
    return str(value).strip()


def is_valid_email(email: str) -> bool:
    """Check if the provided email matches the accepted syntax rule."""
    cleaned = normalize_email(email)
    if not cleaned:
        return False
    return bool(EMAIL_RE.fullmatch(cleaned))


def validate_participant_emails(df, email_column: str, name_column: str | None = None) -> ValidationResult:
    """Validate participant rows, remove duplicates, and preserve original Excel row numbers."""
    total_records = len(df.index)
    seen_emails: set[str] = set()
    valid: list[dict[str, Any]] = []
    invalid: list[dict[str, Any]] = []
    duplicate_entries: list[dict[str, Any]] = []
    empty_entries: list[dict[str, Any]] = []

    for row_index, row in df.iterrows():
        excel_row_number = int(row_index) + 2
        email_value = row.get(email_column, "")
        normalized_email = normalize_email(email_value)
        participant_name = row.get(name_column) if name_column and name_column in df.columns else None

        if not normalized_email:
            empty_entries.append({
                "excel_row": excel_row_number,
                "email": "",
                "name": participant_name,
                "reason": "Empty email value",
            })
            continue

        if normalized_email.lower() in seen_emails:
            duplicate_entries.append({
                "excel_row": excel_row_number,
                "email": normalized_email,
                "name": participant_name,
                "reason": "Duplicate email address",
            })
            continue

        seen_emails.add(normalized_email.lower())

        if not is_valid_email(normalized_email):
            invalid.append({
                "excel_row": excel_row_number,
                "email": normalized_email,
                "name": participant_name,
                "reason": "Invalid email format",
            })
            continue

        valid.append({
            "excel_row": excel_row_number,
            "email": normalized_email,
            "name": participant_name,
        })

    return ValidationResult(
        total_records=total_records,
        valid_recipients=valid,
        invalid_emails=invalid,
        duplicate_emails=duplicate_entries,
        empty_emails=empty_entries,
    )
