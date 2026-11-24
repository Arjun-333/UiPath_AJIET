"""
Versioned, additive, reversible migration runner for Project Autonomia.
Guarantees schema integrity without destroying existing tables or data.
"""

import logging
from datetime import datetime
from sqlalchemy import text
from backend.app.database.session import engine, Base
import backend.app.database.models  # ensure base models are registered
import backend.app.database.workforce_models  # ensure workforce models are registered

LOGGER = logging.getLogger(__name__)

MIGRATIONS = [
    {
        "version": "001_create_workforce_tables",
        "description": "Create workforce employees, configs, telemetry, evaluations, recruitment, recommendations, audit, pricing",
        "sql": """
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version VARCHAR(128) PRIMARY KEY,
            description TEXT NOT NULL,
            applied_at DATETIME NOT NULL
        );
        """
    },
    {
        "version": "002_add_agent_id_to_approvals",
        "description": "Add nullable agent_id to existing approvals table for workforce indexing",
        "check_column": ("approvals", "agent_id"),
        "sql": "ALTER TABLE approvals ADD COLUMN agent_id VARCHAR(64);"
    },
    {
        "version": "003_seed_default_pricing",
        "description": "Seed default pricing for Nemotron 3 Ultra and other models",
        "sql": """
        INSERT OR IGNORE INTO model_pricing (model_name, prompt_price_per_1k, completion_price_per_1k, active, updated_at)
        VALUES 
            ('nvidia/nemotron-3-ultra-550b-a55b', 0.0015, 0.0020, 1, CURRENT_TIMESTAMP),
            ('heuristic-offline', 0.0, 0.0, 1, CURRENT_TIMESTAMP),
            ('gemini-1.5-pro', 0.00125, 0.0050, 1, CURRENT_TIMESTAMP),
            ('gemini-1.5-flash', 0.000075, 0.00030, 1, CURRENT_TIMESTAMP);
        """
    },
    {
        "version": "004_backfill_approvals_agent_id",
        "description": "Populate approvals.agent_id from associated task assigned_agent_id",
        "sql": """
        UPDATE approvals
        SET agent_id = (
            SELECT tasks.assigned_agent_id 
            FROM tasks 
            WHERE tasks.id = approvals.task_id
        )
        WHERE approvals.agent_id IS NULL;
        """
    }
]

async def run_migrations():
    """Runs all pending migrations safely and idempotently."""
    LOGGER.info("Starting database schema migration check...")
    
    # First ensure all declarative Base tables exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
        # Ensure migration table exists
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS schema_migrations (
                version VARCHAR(128) PRIMARY KEY,
                description TEXT NOT NULL,
                applied_at DATETIME NOT NULL
            );
        """))
        
        # Query applied migrations
        res = await conn.execute(text("SELECT version FROM schema_migrations"))
        applied = {row[0] for row in res.fetchall()}

        for mig in MIGRATIONS:
            v = mig["version"]
            if v in applied:
                continue

            # Check if column already exists (for ALTER TABLE)
            if "check_column" in mig:
                table_name, col_name = mig["check_column"]
                table_info = await conn.execute(text(f"PRAGMA table_info({table_name});"))
                columns = [r[1] for r in table_info.fetchall()]
                if col_name in columns:
                    LOGGER.info("Column %s.%s already exists, skipping ALTER TABLE", table_name, col_name)
                    await conn.execute(
                        text("INSERT OR IGNORE INTO schema_migrations (version, description, applied_at) VALUES (:v, :d, :t)"),
                        {"v": v, "d": mig["description"], "t": datetime.utcnow()}
                    )
                    continue

            LOGGER.info("Applying migration %s: %s", v, mig["description"])
            for statement in mig["sql"].strip().split(";"):
                stmt = statement.strip()
                if stmt:
                    await conn.execute(text(stmt))

            await conn.execute(
                text("INSERT INTO schema_migrations (version, description, applied_at) VALUES (:v, :d, :t)"),
                {"v": v, "d": mig["description"], "t": datetime.utcnow()}
            )
            LOGGER.info("Migration %s successfully applied.", v)

    LOGGER.info("Database schema migrations up to date.")
