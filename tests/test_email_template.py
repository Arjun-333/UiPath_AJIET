from __future__ import annotations

from uipath_email_sender.email_template import build_email_html, sanitize_name


def test_sanitize_name_defaults_to_participant_for_blank_values() -> None:
    assert sanitize_name("") == "Participant"
    assert sanitize_name(None) == "Participant"


def test_build_email_html_contains_required_content() -> None:
    html = build_email_html("Arjun")
    assert "Action Required" in html
    assert "Automate Campus Quest" in html
    assert "drive.google.com" in html
    assert "community.uipath.com" in html
    assert "Arjun" in html
