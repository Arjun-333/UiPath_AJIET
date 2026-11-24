"""
Configuration and Environment Settings for Project Autonomia.
"""

from pathlib import Path
import os
try:
    from pydantic_settings import BaseSettings
except ImportError:
    BaseSettings = object

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
PROJECTS_DIR = DATA_DIR / "projects"
MEMORY_DIR = DATA_DIR / "company_memory"
REPORTS_DIR = BASE_DIR / "reports"
ASSETS_DIR = BASE_DIR / "frontend" / "public" / "assets"

DATA_DIR.mkdir(parents=True, exist_ok=True)
PROJECTS_DIR.mkdir(parents=True, exist_ok=True)
MEMORY_DIR.mkdir(parents=True, exist_ok=True)
REPORTS_DIR.mkdir(parents=True, exist_ok=True)

DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite+aiosqlite:///{DATA_DIR / 'autonomia.db'}")
SYNC_DATABASE_URL = os.getenv("SYNC_DATABASE_URL", f"sqlite:///{DATA_DIR / 'autonomia.db'}")

# LLM Configuration
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "heuristic")  # "heuristic", "gemini", "nemotron", "ollama"
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY", "")
OLLAMA_ENDPOINT = os.getenv("OLLAMA_ENDPOINT", "http://localhost:11434")

# Platform Settings
YOUTUBE_CLIENT_SECRETS_FILE = os.getenv("YOUTUBE_CLIENT_SECRETS_FILE", str(BASE_DIR / "client_secrets.json"))
GMAIL_ADDRESS = os.getenv("GMAIL_ADDRESS", "")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD", "")

# Server
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8080"))
FFMPEG_PATH = str(BASE_DIR / ".venv" / "bin" / "ffmpeg")
