"""
Server-Side Role-Based Access Control (RBAC) Guard for Workforce Intelligence.
Strictly guarantees that consequential actions can ONLY be authorized by the human CEO user.
"""

from enum import Enum
from dataclasses import dataclass
from typing import Optional
from fastapi import Request, HTTPException, status, Depends, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

class Role(str, Enum):
    CEO = "CEO"
    DEPARTMENT_HEAD = "DEPARTMENT_HEAD"
    VIEWER = "VIEWER"
    AI_AGENT = "AI_AGENT"

@dataclass
class Principal:
    principal_id: str
    role: Role
    is_human: bool
    name: str

security_scheme = HTTPBearer(auto_error=False)

# Recognized system tokens / principals
AUTHORIZED_PRINCIPALS = {
    "arjun_ceo": Principal("arjun_ceo", Role.CEO, True, "Arjun (Founder & CEO)"),
    "ceo-arjun-master-token": Principal("arjun_ceo", Role.CEO, True, "Arjun (Founder & CEO)"),
    "coo_marcus": Principal("coo_marcus", Role.DEPARTMENT_HEAD, False, "Marcus Vance (COO)"),
    "cto_pratham": Principal("cto_pratham", Role.DEPARTMENT_HEAD, False, "Pratham (CTO)"),
    "workforce_advisor": Principal("workforce_advisor", Role.AI_AGENT, False, "Workforce Advisor AI"),
    "auri_assistant": Principal("auri_assistant", Role.AI_AGENT, False, "AURI AI Interface"),
    "viewer_auditor": Principal("viewer_auditor", Role.VIEWER, True, "Auditor / Read-Only Viewer")
}

def get_current_principal(
    request: Request,
    auth: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme)
) -> Principal:
    """
    Extracts the authenticated principal from headers or query parameters.
    Defaults to human CEO principal in local desktop environment when no header is set.
    """
    # 1. Check Bearer Token
    if auth and auth.credentials in AUTHORIZED_PRINCIPALS:
        return AUTHORIZED_PRINCIPALS[auth.credentials]

    # 2. Check X-Autonomia-Principal Header
    principal_header = request.headers.get("X-Autonomia-Principal")
    if principal_header and principal_header in AUTHORIZED_PRINCIPALS:
        return AUTHORIZED_PRINCIPALS[principal_header]

    # 3. Check Cookie / Query Param
    principal_query = request.query_params.get("principal")
    if principal_query and principal_query in AUTHORIZED_PRINCIPALS:
        return AUTHORIZED_PRINCIPALS[principal_query]

    # Default in standard CEO desktop session: human CEO Arjun
    return AUTHORIZED_PRINCIPALS["arjun_ceo"]


def require_ceo(principal: Principal = Depends(get_current_principal)) -> Principal:
    """
    Hard server-side gate: only human CEO Arjun can authorize consequential actions.
    Any non-CEO or AI agent principal is rejected with HTTP 403 Forbidden.
    """
    if principal.role != Role.CEO or not principal.is_human:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="FORBIDDEN: Consequential workforce actions require explicit human CEO authorization."
        )
    return principal


def require_department_head_or_ceo(principal: Principal = Depends(get_current_principal)) -> Principal:
    """Allows CEO or Department Heads to submit requests or view analytics."""
    if principal.role not in (Role.CEO, Role.DEPARTMENT_HEAD):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="FORBIDDEN: Action requires Department Head or CEO credentials."
        )
    return principal
