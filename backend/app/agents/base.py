"""
Base Agent Abstract Class for Project Autonomia.
All AI employees in the virtual company inherit from BaseAgent.
"""

from typing import Dict, Any, Optional
from datetime import datetime
import logging

LOGGER = logging.getLogger(__name__)

class BaseAgent:
    def __init__(
        self,
        agent_id: str,
        name: str,
        department: str,
        role: str,
        floor: int,
        permission_level: int = 2,  # 1=Read, 2=Create, 3=Execute (CEO approval gate)
        manager_id: Optional[str] = None,
        avatar_file: Optional[str] = None,
        shirt_color: Optional[str] = None
    ):
        self.agent_id = agent_id
        self.name = name
        self.department = department
        self.role = role
        self.floor = floor
        self.permission_level = permission_level
        self.manager_id = manager_id
        self.avatar_file = avatar_file or f"{agent_id}.png"
        self.shirt_color = shirt_color

        # Runtime State
        self.status = "idle"  # idle, working, reviewing, waiting_approval, error
        self.current_task_id: Optional[str] = None
        self.current_task_title: Optional[str] = None
        self.completed_tasks_count = 0
        self.error_count = 0
        self.last_active = datetime.utcnow()

    async def run(self, task_context: Dict[str, Any]) -> Dict[str, Any]:
        """Lifecycle wrapper around execute() to maintain state and logging."""
        self.status = "working"
        self.current_task_id = task_context.get("task_id")
        self.current_task_title = task_context.get("title")
        self.last_active = datetime.utcnow()

        try:
            result = await self.execute(task_context)
            self.completed_tasks_count += 1
            self.status = "idle"
            self.current_task_id = None
            self.current_task_title = None
            return {"status": "success", "agent_id": self.agent_id, "data": result}
        except Exception as exc:
            self.error_count += 1
            self.status = "error"
            LOGGER.exception("Agent %s failed on task %s", self.agent_id, self.current_task_id)
            return {"status": "error", "agent_id": self.agent_id, "error": str(exc)}

    async def execute(self, task_context: Dict[str, Any]) -> Dict[str, Any]:
        """Subclasses override this with their departmental logic."""
        raise NotImplementedError

    def to_dict(self) -> Dict[str, Any]:
        return {
            "agent_id": self.agent_id,
            "name": self.name,
            "department": self.department,
            "role": self.role,
            "floor": self.floor,
            "permission_level": self.permission_level,
            "manager_id": self.manager_id,
            "status": self.status,
            "current_task_id": self.current_task_id,
            "current_task_title": self.current_task_title,
            "completed_tasks_count": self.completed_tasks_count,
            "error_count": self.error_count,
            "avatar_file": self.avatar_file
        }
