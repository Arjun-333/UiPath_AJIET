"""
Deterministic Employee Lifecycle State Machine for Workforce Intelligence.
Strictly defines and validates all permissible employee state transitions.
"""

from typing import Set, Dict, List

class IllegalLifecycleTransitionError(ValueError):
    """Raised when an agent lifecycle transition violates the state machine directed graph."""
    pass

# Permissible state transitions directed graph
ALLOWED_TRANSITIONS: Dict[str, Set[str]] = {
    "candidate": {"in_testing"},
    "in_testing": {"candidate", "active"},
    "active": {"in_retraining", "suspended", "terminated"},
    "in_retraining": {"active"},
    "suspended": {"active", "terminated"},
    "terminated": {"active"}  # Reactivation requires re-validation and CEO authorization
}

ALL_STATES: Set[str] = {"candidate", "in_testing", "active", "in_retraining", "suspended", "terminated"}

def validate_lifecycle_transition(current_state: str, new_state: str) -> bool:
    """
    Validates whether a transition from current_state to new_state is permissible.
    Raises IllegalLifecycleTransitionError if transition is disallowed.
    """
    if current_state not in ALL_STATES:
        raise IllegalLifecycleTransitionError(f"Unknown current lifecycle state: '{current_state}'")

    if new_state not in ALL_STATES:
        raise IllegalLifecycleTransitionError(f"Unknown target lifecycle state: '{new_state}'")

    if current_state == new_state:
        return True  # Idempotent no-op

    allowed = ALLOWED_TRANSITIONS.get(current_state, set())
    if new_state not in allowed:
        raise IllegalLifecycleTransitionError(
            f"ILLEGAL_LIFECYCLE_TRANSITION: Cannot transition employee from '{current_state}' to '{new_state}'. "
            f"Allowed next states from '{current_state}': {sorted(list(allowed))}"
        )
    return True

def get_allowed_next_states(current_state: str) -> List[str]:
    """Returns the list of allowable next lifecycle states from current_state."""
    return sorted(list(ALLOWED_TRANSITIONS.get(current_state, set())))
