"""
Agent Identity Registry for Project Autonomia.
Maintains the official team roster for UiPath Community AJIET.
"""

from typing import Dict, List, Optional
from backend.app.agents.base import BaseAgent
from backend.app.agents.departments import (
    CEOInterfaceAgent, COOAgent,
    DarshanDirectorAgent, ShrinithiScriptAgent, VaishnaviDesignAgent, ShreyankEditorAgent,
    AnanyaMarketingAgent, RohitSocialAgent,
    TarunQAAgent, KavyaComplianceAgent,
    IffahDocAgent, JiyaResearchAgent, SrijanaQualityAgent,
    PrathamCTOAgent, MallikaTechAgent, VaibhavDevOpsAgent, FaazilSysAdminAgent
)

class AgentRegistry:
    def __init__(self):
        self._agents: Dict[str, BaseAgent] = {}
        self._register_all()

    def _register_all(self):
        agents_list = [
            # Floor 0: Executive Management
            CEOInterfaceAgent(),
            COOAgent(),

            # Floor 1: Media Department (Creative & Video Production)
            DarshanDirectorAgent(),
            ShrinithiScriptAgent(),
            VaishnaviDesignAgent(),
            ShreyankEditorAgent(),

            # Floor 2: Marketing & Growth Operations
            AnanyaMarketingAgent(),
            RohitSocialAgent(),

            # Floor 3: AI Video QA & Autonomous Testing Lab
            TarunQAAgent(),
            KavyaComplianceAgent(),

            # Floor 4: Documentation & Campus Department
            IffahDocAgent(),
            JiyaResearchAgent(),
            SrijanaQualityAgent(),

            # Floor 5: Technology & Infrastructure Department
            PrathamCTOAgent(),
            MallikaTechAgent(),
            VaibhavDevOpsAgent(),
            FaazilSysAdminAgent()
        ]

        for agent in agents_list:
            self._agents[agent.agent_id] = agent
        # Alias for backwards compatibility
        if "auri_ceo_interface" in self._agents:
            self._agents["orbi_ceo_interface"] = self._agents["auri_ceo_interface"]

    def get_agent(self, agent_id: str) -> Optional[BaseAgent]:
        return self._agents.get(agent_id)

    def list_all(self) -> List[Dict]:
        return [agent.to_dict() for agent in self._agents.values()]

    def list_by_floor(self, floor: int) -> List[Dict]:
        return [agent.to_dict() for agent in self._agents.values() if agent.floor == floor]

    def list_by_department(self, department: str) -> List[Dict]:
        return [agent.to_dict() for agent in self._agents.values() if agent.department.lower() == department.lower()]

    def get_roster_summary(self) -> Dict:
        total = len(self._agents)
        active = sum(1 for a in self._agents.values() if a.status == "working")
        idle = sum(1 for a in self._agents.values() if a.status == "idle")
        errors = sum(1 for a in self._agents.values() if a.status == "error")

        return {
            "total_agents": total,
            "active_agents": active,
            "idle_agents": idle,
            "error_agents": errors,
            "floors_count": 6
        }

# Global singleton registry instance
GLOBAL_REGISTRY = AgentRegistry()
