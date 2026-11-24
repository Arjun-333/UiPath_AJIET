from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
ENV_PATH = BASE_DIR / ".env"

if ENV_PATH.exists():
    load_dotenv(dotenv_path=ENV_PATH)

SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
DEFAULT_DELAY_SECONDS = 2
MAX_RECIPIENT_LIMIT_DEFAULT = 500
SAFE_BATCH_MAX_RECIPIENTS = 5
SAFE_BATCH_DELAY_SECONDS = 5


def get_gmail_address() -> str:
    """Return the configured Gmail address from environment variables."""
    return os.getenv("GMAIL_ADDRESS", "").strip()


def get_gmail_app_password() -> str:
    """Return the configured Gmail app password from environment variables."""
    return os.getenv("GMAIL_APP_PASSWORD", "").strip()


def get_reports_dir() -> Path:
    """Get the reports directory path."""
    reports_dir = BASE_DIR / "reports"
    reports_dir.mkdir(exist_ok=True)
    return reports_dir
