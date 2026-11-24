from __future__ import annotations

import smtplib
from unittest.mock import MagicMock, patch

import pytest

from uipath_email_sender.smtp_sender import SMTPConnectionError, build_message, send_campaign_email


def test_build_message_contains_required_fields() -> None:
    message = build_message("test@example.com", "Alice", "sender@example.com")
    assert message["To"] == "test@example.com"
    assert message["From"] == "sender@example.com"
    assert "Action Required" in message["Subject"]


def test_send_campaign_email_success_via_mocked_smtp() -> None:
    mock_server = MagicMock()
    with patch("uipath_email_sender.smtp_sender.smtplib.SMTP") as mock_smtp:
        mock_smtp.return_value.__enter__.return_value = mock_server
        mock_smtp.return_value.__exit__.return_value = None

        send_campaign_email("recipient@example.com", "Alice", "sender@example.com", "password123")

        mock_server.starttls.assert_called_once()
        mock_server.login.assert_called_once_with("sender@example.com", "password123")
        mock_server.send_message.assert_called_once()


def test_send_campaign_email_raises_on_smtp_failure() -> None:
    mock_server = MagicMock()
    mock_server.send_message.side_effect = smtplib.SMTPException("rejected")

    with patch("uipath_email_sender.smtp_sender.smtplib.SMTP") as mock_smtp:
        mock_smtp.return_value.__enter__.return_value = mock_server
        mock_smtp.return_value.__exit__.return_value = None

        with pytest.raises(SMTPConnectionError):
            send_campaign_email("recipient@example.com", "Alice", "sender@example.com", "password123")
