from __future__ import annotations

import pandas as pd

from uipath_email_sender.email_validator import validate_participant_emails


def test_validate_participant_emails_honors_duplicates_and_invalid_values() -> None:
    data = pd.DataFrame(
        {
            "email": ["a@example.com", "A@example.com", "", "bad-email", "b@example.com"],
            "name": ["Alice", "Alice", "Sam", "Test", "Bob"],
        }
    )

    result = validate_participant_emails(data, email_column="email", name_column="name")

    assert result.total_records == 5
    assert result.valid_count == 2
    assert result.invalid_count == 1
    assert result.duplicate_count == 1
    assert result.empty_count == 1
    assert {entry["email"] for entry in result.valid_recipients} == {"a@example.com", "b@example.com"}
