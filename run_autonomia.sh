#!/usr/bin/env bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "=========================================================="
echo "  PROJECT AUTONOMIA: UiPath Community AJIET Media Co.     "
echo "=========================================================="

source .venv/bin/activate

echo "[*] Checking database and assets..."
.venv/bin/python3 -c "
import asyncio
from backend.app.database.session import init_db
from backend.app.agents.registry import GLOBAL_REGISTRY
asyncio.run(init_db())
print('  Database tables initialized.')
print('  Agents registered:', GLOBAL_REGISTRY.get_roster_summary()['total_agents'])
"

echo "[*] Starting FastAPI Backend & WebSockets on http://0.0.0.0:8080 ..."
echo "[*] Direct Web App URL: http://localhost:8080/app/"
echo "=========================================================="

exec .venv/bin/uvicorn backend.app.main:app --host 0.0.0.0 --port 8080
