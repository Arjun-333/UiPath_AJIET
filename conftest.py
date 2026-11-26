"""
Global pytest configuration.
Isolates all test runs to a temporary SQLite database so live data/autonomia.db is never polluted.
"""

import os
import shutil
import tempfile

_TEST_DB_DIR = tempfile.mkdtemp(prefix="autonomia_test_db_")
_TEST_DB_PATH = os.path.join(_TEST_DB_DIR, "test_autonomia.db")

os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{_TEST_DB_PATH}"
os.environ["SYNC_DATABASE_URL"] = f"sqlite:///{_TEST_DB_PATH}"


def pytest_sessionstart(session):
    """Initialize all SQLAlchemy tables and run migrations in the isolated test DB."""
    import asyncio
    from backend.app.database.session import init_db
    from backend.app.database.migrations.runner import run_migrations
    from backend.app.workforce.backfill import backfill_existing_agents

    async def _setup():
        await init_db()
        await run_migrations()
        await backfill_existing_agents()

    asyncio.run(_setup())


def pytest_sessionfinish(session, exitstatus):
    """Remove temporary test database directory."""
    shutil.rmtree(_TEST_DB_DIR, ignore_errors=True)
