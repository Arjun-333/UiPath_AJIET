from __future__ import annotations

import logging
import smtplib
import ssl
from email.message import EmailMessage
from email.utils import formatdate
from typing import Any

from .config import SMTP_PORT, SMTP_SERVER, get_gmail_address, get_gmail_app_password
from .email_template import build_email_html, get_email_subject

LOGGER = logging.getLogger(__name__)


class SMTPConfigurationError(RuntimeError):
    """Raised when SMTP settings are missing or invalid."""


class SMTPConnectionError(RuntimeError):
    """Raised when the SMTP connection or send operation fails."""


def get_smtp_credentials() -> tuple[str, str]:
    """Load and validate SMTP credentials from environment variables."""
    email = get_gmail_address()
    password = get_gmail_app_password()
    if not email or not password:
        raise SMTPConfigurationError(
            "Gmail credentials are missing. Add GMAIL_ADDRESS and GMAIL_APP_PASSWORD to your .env file."
        )
    return email, password


def build_message(recipient_email: str, participant_name: str | None, from_address: str) -> EmailMessage:
    """Create a complete personalized HTML email message."""
    message = EmailMessage()
    message["Subject"] = get_email_subject()
    message["From"] = from_address
    message["To"] = recipient_email
    message["Date"] = formatdate(localtime=True)
    message.set_content("This email requires HTML support.")
    message.add_alternative(build_email_html(participant_name), subtype="html")
    return message


def send_test_email(test_recipient: str, participant_name: str | None = None) -> str:
    """Send a single test email to the supplied recipient and return a success message."""
    sender_address, app_password = get_smtp_credentials()
    message = build_message(test_recipient, participant_name, sender_address)

    try:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=30) as server:
            server.starttls(context=ssl.create_default_context())
            server.login(sender_address, app_password)
            server.send_message(message)
    except smtplib.SMTPException as exc:
        LOGGER.exception("Test email failed")
        raise SMTPConnectionError(f"Failed to send test email: {exc}") from exc
    except OSError as exc:
        LOGGER.exception("SMTP connection error while sending test email")
        raise SMTPConnectionError(f"Connection error while sending test email: {exc}") from exc

    return f"Test email successfully submitted to SMTP for {test_recipient}."


def send_campaign_email(recipient_email: str, participant_name: str | None, sender_email: str, password: str) -> None:
    """Send a single personalized email using the configured SMTP account."""
    message = build_message(recipient_email, participant_name, sender_email)

    try:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=30) as server:
            server.starttls(context=ssl.create_default_context())
            server.login(sender_email, password)
            server.send_message(message)
    except smtplib.SMTPException as exc:
        LOGGER.exception("Bulk email submission failed for %s", recipient_email)
        raise SMTPConnectionError(f"SMTP rejected message for {recipient_email}: {exc}") from exc
    except OSError as exc:
        LOGGER.exception("SMTP socket error for %s", recipient_email)
        raise SMTPConnectionError(f"Connection error for {recipient_email}: {exc}") from exc
