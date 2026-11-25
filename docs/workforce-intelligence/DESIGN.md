# AUTONOMIA — Workforce Intelligence & Talent Management Module
## Technical Design Document (`docs/workforce-intelligence/DESIGN.md`)
**Version**: 1.1.0  
**Status**: APPROVED & ACTIVE (Phases 1-2 Complete, Phase 3 Ready)  
**Author**: Lead AI Systems Architect & Full-Stack Engineer  
**Branch**: `workforce-intelligence`  

---

## 0. Vision

AUTONOMIA must be able to evaluate its own workforce, identify organizational weaknesses, recruit missing capabilities and continuously improve its operations, while the human CEO (the user of this application) retains final authority over every consequential decision.

The system observes, analyzes, recommends and drafts. The CEO decides.

Every feature in this module serves this closed-loop cycle:
$$\text{Measure} \longrightarrow \text{Diagnose} \longrightarrow \text{Recommend} \longrightarrow \text{CEO Decision} \longrightarrow \text{Execute} \longrightarrow \text{Verify Impact} \longrightarrow \text{Repeat}$$

---

## 1. System Stack, Structure, RBAC, Real-Time Mechanism, Database & Test Setup

### 1.1 Technology Stack & Structure
* **Backend Framework**: Python 3.10+, FastAPI, Starlette.
* **Database ORM**: SQLAlchemy 2.x async ORM with `aiosqlite` SQLite backend (configured for seamless PostgreSQL upgrade via `DATABASE_URL`).
* **AI Orchestration**: Heterogeneous multi-agent system powered by NVIDIA Nemotron 3 Ultra (`nvidia/nemotron-3-ultra-550b-a55b`) with automatic fallback to high-fidelity domain heuristics.
* **Media & Inspection Engine**: ImageIO-FFmpeg, Pillow, custom deterministic multi-agent video QA inspector.
* **Frontend Application**: React 18 with TypeScript, Vite 5, Tailwind CSS 3, Lucide-react, HTML5 Canvas 2D engine.
* **Project Structure**:
  ```
  UiPathAJIET/
  ├── backend/
  │   ├── app/
  │   │   ├── main.py                  # FastAPI gateway, routes, WebSocket manager
  │   │   ├── config.py                # Environment, paths, database URLs
  │   │   ├── database/
  │   │   │   ├── session.py           # Async engine, sessionmaker, Base
  │   │   │   ├── models.py            # Existing models (projects, tasks, approvals, messages)
  │   │   │   ├── migrations/          # Versioned, additive, reversible migrations
  │   │   │   └── workforce_models.py  # New workforce & talent management models
  │   │   ├── workforce/               # Dedicated Workforce Intelligence Package
  │   │   │   ├── rbac.py              # Server-side RBAC principal & permission enforcement
  │   │   │   ├── state_machine.py     # Deterministic lifecycle state machine & transition rules
  │   │   │   ├── metrics_engine.py    # Deterministic computation of the 8 metrics & trends
  │   │   │   ├── audit.py             # Append-only audit logger (no update/delete)
  │   │   │   ├── recruitment.py       # Recruitment definitions, sandbox runner, evaluation
  │   │   │   ├── advisor.py           # Workforce Advisor (deterministic findings + LLM explanation)
  │   │   │   └── router.py            # Dedicated FastAPI endpoints for workforce module
  │   │   ├── agents/                  # Department agent definitions and registry
  │   │   ├── engine/                  # Orchestrator, LLM factory, Nemotron telemetry
  │   │   └── media/                   # Video rendering, QA inspector, TTS
  │   └── tests/                       # Pytest test suite
  ├── frontend/
  │   ├── src/
  │   │   ├── components/
  │   │   │   ├── workforce/           # Workforce UI Package
  │   │   │   │   ├── TalentDashboard.tsx     # Leaderboard, sparklines, period filters
  │   │   │   │   ├── AgentProfileModal.tsx   # Config versions, performance trends, lifecycle actions
  │   │   │   │   ├── RecruitmentCentre.tsx   # Job specs, sandbox test runner, deploy gate
  │   │   │   │   ├── DepartmentAnalytics.tsx # Workload & productivity drill-downs
  │   │   │   │   ├── WorkforceAdvisorPanel.tsx # Verifiable recommendations & reasoning
  │   │   │   │   ├── LifecycleActionDialog.tsx # Typed confirmation, consequence warning
  │   │   │   │   └── AuditLogViewer.tsx      # Filterable append-only audit trail
  │   │   │   ├── VirtualHeadquarters.tsx # Real-time office visualization
  │   │   │   ├── CeoCommandCenter.tsx    # CEO master dispatch & alerts
  │   │   │   └── ApprovalsModal.tsx      # CEO Level 3 approval routing
  │   │   ├── types.ts                 # TypeScript interfaces
  │   │   └── App.tsx                  # Main application container & navigation
  └── docs/workforce-intelligence/     # Design, progress tracking, and verification specs
  ```

### 1.2 Authentication & RBAC System
* **Principle**: Consequential lifecycle actions can **only** be authorized and executed by the human CEO principal (`arjun_ceo`), verified server-side.
* **Core Principle 7 (No Autonomous Authority)**: There is strictly **no auto-approve mode**, **no delegated approval**, and **no scheduled job** that can execute a lifecycle action. Analysis, findings, recommendations and recruitment drafts may be automated. State-changing decisions never are.
* **Implementation Mechanism**:
  - FastAPI dependency injection with `Security(get_current_principal)`.
  - In development and local deployment, requests pass the authenticated principal via standard Authorization Header:
    - `Authorization: Bearer ceo-arjun-master-token` or session cookie `autonomia_principal=arjun_ceo`.
  - Roles defined:
    1. `CEO` (Human CEO Arjun): Full permissions. Only role allowed to execute or authorize consequential actions (`hire`, `promote`, `retrain`, `reassign`, `suspend`, `terminate`, `reactivate`, `rollback`).
    2. `DEPARTMENT_HEAD` (COO Marcus Vance, CTO Pratham, Director Darshan): Can view departmental performance, run sandbox test tasks, and submit recommendations. **Cannot** execute or approve lifecycle actions.
    3. `VIEWER` / `AUDITOR`: Read-only access to dashboards, reports, and audit logs.
    4. `AI_AGENT` (Workforce Advisor, AURI, any internal agent): Read-only access to metrics; can generate recommendation records. Explicitly blocked server-side from calling any administrative or lifecycle mutation endpoint.
* **Hard Server-Side Gate**:
  ```python
  def require_ceo(principal: Principal = Depends(get_current_principal)):
      if principal.role != Role.CEO or not principal.is_human:
          raise HTTPException(
              status_code=status.HTTP_403_FORBIDDEN,
              detail="FORBIDDEN: Consequential workforce actions require explicit human CEO authorization."
          )
      return principal
  ```

### 1.3 Real-Time Synchronization Mechanism
* **Existing Mechanism**: Central WebSocket gateway at `/ws` managed by `ConnectionManager` in `backend/app/main.py`.
* **Broadcast Format**: JSON payloads over WebSocket with `{ "event": string, "data": dict }`.
* **Workforce Integration**: New events (`employee_lifecycle_changed`, `workforce_alert`, `metrics_updated`, `audit_entry_created`) will broadcast over this identical channel, allowing both the 2D Pixel Campus and the legacy renderer to update their visual office state instantaneously without a page reload.

### 1.4 Database & Migration Tooling
* **Database**: SQLite with `WAL` mode enabled for high-concurrency async operations.
* **Migration Strategy**:
  - Reversible, additive, versioned migration runner (`backend/app/database/migrations/runner.py`).
  - Maintains an immutable `schema_migrations` table tracking executed migrations with checksums, execution duration, and rollback scripts.
  - Zero destructive modifications: all alterations are strictly `ALTER TABLE ADD COLUMN` or new additive tables.

### 1.5 Test Setup
* **Pytest Runner**: `.venv/bin/pytest -v` with `pytest-asyncio` and `httpx`.
* **E2E Visual Verification**: Headless Chromium testing via Playwright saving evidence screenshots to `/screenshots/workforce-intelligence/`.
* **Zero Mocking in Production**: Tests use isolated temporary test databases and fixtures; running application uses 100% real persistent records.

---

## 2. Existing Data Storage & Exposure Audit

| Entity | Current Storage | Current Schema / Representation | How It Is Exposed | Limitations / Gaps for Workforce Module |
| :--- | :--- | :--- | :--- | :--- |
| **Agents** | In-Memory `GLOBAL_REGISTRY` (`backend/app/agents/registry.py`) + unused `AgentStateModel` in DB | `BaseAgent` class: `agent_id, name, department, role, floor, permission_level, status, completed_tasks_count, error_count, last_active` | `GET /api/agents`, `GET /api/agents/floor/{floor}` | Roster is hardcoded in Python; changes don't persist across restarts; lacks config versioning, tools list, and lifecycle history. |
| **Tasks** | SQLite table `tasks` (`TaskModel`) | `id, project_id, title, department, assigned_agent_id, status, permission_level, dependencies, input_data, output_data, error_message, retry_count, created_at, updated_at` | `GET /api/projects` | Lacks `started_at`, `completed_at` (duration must currently be inferred from `created_at` to `updated_at`); lacks per-task token/cost fields. |
| **Approvals** | SQLite table `approvals` (`ApprovalModel`) | `id, task_id, action_type, description, preview_url, preview_data, status, ceo_feedback, created_at, resolved_at` | `GET /api/approvals`, `POST /api/approvals/{id}/resolve` | Currently only used for Level 3 publishing tasks. Does not link directly to agent lifecycle requests. |
| **Costs & Tokens** | In-Memory `NEMOTRON_USAGE_STATS` (`backend/app/engine/llm_provider.py`) | Global totals: `prompt_tokens, completion_tokens, total_tokens, estimated_cost_usd, requests_count` | `GET /api/llm/nemotron/status` | Global aggregate only; zero per-agent or per-task cost attribution in DB. |
| **Quality & Reviews** | `VideoQAService` (`video_qa.py`) + Task `output_data` | Structured defect report: `score (0-100), quality_status, critical_defects_count, defects[]` saved in task output JSON | Embedded in project tasks output | Video-specific; lacks generalized quality scoring for text, research, coding, and DevOps tasks. |
| **Employee Status** | In-Memory on `BaseAgent` (`idle, working, reviewing, waiting_approval, error`) | Transient property; updated during `agent.run()` | Embedded in `GET /api/agents` and WebSocket events | Resets to initial values upon server restart; no state change history. |

---

## 3. Data-Availability Audit for the 8 Measurable Indicators

Every metric must be computed from real backend records. No numbers may be fabricated. If data is missing or below the minimum sample threshold (default: 10 tasks in the evaluation period), the system must honestly output `"insufficient data"` and state what instrumentation is needed.

| Indicator | Status in Codebase | What Currently Exists | What Is Missing | Required Additive Instrumentation |
| :--- | :---: | :--- | :--- | :--- |
| **1. Task Completion Rate** | **Partially Available** | `tasks.status` records `completed` and `failed` per `assigned_agent_id`. | Explicit `cancelled` status to exclude abandoned tasks; historical task execution windows. | Add `cancelled` status; store `task_executions` log with execution timestamps. |
| **2. Output Quality** | **Partially Available** | `output_data["score"]` (0-100) and defect reports from `VideoQAService` for media tasks. | General scoring for non-video tasks (research memos, scripts, DevOps, compliance). | Create `task_evaluations` table recording score (0-100), scoring method (Automated QA, Rubric, CEO Review), and defect penalties. |
| **3. Accuracy** | **Partially Available** | `tasks.retry_count`, `tasks.error_message`, and `critical_defects_count`. | Tracking whether output required rework/revision before approval. | Record `revision_count` and `defects_detected` per task in `task_evaluations`. |
| **4. Execution Time** | **Missing Precision** | `tasks.created_at` and `tasks.updated_at`. | Pure execution time! Current difference includes queue time waiting for dependencies and human review time in Approvals. | Instrument `started_at`, `completed_at`, and `approval_wait_seconds` on task execution records. |
| **5. Cost Per Task** | **Missing Attribution** | Global `NEMOTRON_USAGE_STATS` with prompt/completion tokens and cost formula ($0.0015/1K tokens). | Per-task token consumption and per-agent cost attribution. | Instrument LLM call tracker to record `prompt_tokens`, `completion_tokens`, and `cost_usd` tagged with `task_id` and `agent_id`. |
| **6. Failure Rate** | **Available** | `tasks.status == 'failed'` and `BaseAgent.error_count`. | Categorization of failure causes (agent fault vs timeout vs rate limit). | Add `failure_reason_category` (`agent_error`, `tool_timeout`, `rate_limit`, `syntax_error`) on failed tasks. |
| **7. Collaboration Score** | **Available** | `agent_messages` table records all inter-agent messages (`handoff`, `cross_floor_visit`, `inquiry`, `review_status`) with `sender_id`, `recipient_id`, `created_at`. | Formalized metric formula linking handoffs to downstream task completion. | Deterministic scoring algorithm aggregating handoff frequency, response turnaround, and multi-agent pipeline participations. |
| **8. Human Approval Rate** | **Available** | `approvals` table records `status` (`approved`, `rejected`), `task_id`, `created_at`, `resolved_at`. | Direct foreign key/index on `assigned_agent_id`. | Add `agent_id` column to `approvals` table (backfilled from `tasks.assigned_agent_id`) with composite index `(agent_id, status)`. |

---

## 4. Precise Metric Definitions & Scoring Sources

### 4.1 Mathematical Formulas & Exclusions

#### Metric 1: Task Completion Rate ($R_{\text{comp}}$)
$$\text{Formula: } R_{\text{comp}} = \frac{N_{\text{completed}}}{N_{\text{completed}} + N_{\text{failed}}} \times 100$$
* **Inputs**: Count of tasks assigned to agent within evaluation period where `status = 'completed'` ($N_{\text{completed}}$) and `status = 'failed'` ($N_{\text{failed}}$).
* **Exclusions**: Tasks with `status IN ('pending', 'in_progress', 'cancelled')` are strictly excluded from the denominator.
* **Threshold**: Minimum $N_{\text{completed}} + N_{\text{failed}} \ge 10$. If below, display `"insufficient data"`.

#### Metric 2: Output Quality ($Q_{\text{out}}$)
$$\text{Formula: } Q_{\text{out}} = \frac{1}{M} \sum_{i=1}^{M} S_i$$
* **Inputs**: $S_i \in [0, 100]$, the quality score of task $i$ from `task_evaluations`.
* **Scoring Sources**:
  1. *Video & Media Production*: Deterministic score from `VideoQAService` combining visual, audio, subtitle, story, and technical defect deductions ($100 - \sum \text{penalties}$).
  2. *Research & Scriptwriting*: Automated Rubric Evaluation:
     - Completeness of research references (30 pts)
     - Formatting & structural adherence (30 pts)
     - Technical accuracy check against UiPath documentation taxonomy (40 pts)
  3. *CEO Review Feedback*: If a task required CEO approval, CEO feedback rating:
     - Approved with praise / 0 edits: 100 pts
     - Approved with minor note: 90 pts
     - Approved after revision: 75 pts
     - Rejected: 40 pts
* **Exclusions**: Tasks without formal deliverables (e.g., pure status ping tasks).

#### Metric 3: Accuracy ($A_{\text{task}}$)
$$\text{Formula: } A_{\text{task}} = \frac{N_{\text{first\_pass\_success}}}{N_{\text{completed}}} \times 100$$
* **Inputs**: $N_{\text{first\_pass\_success}}$ = tasks completed with `retry_count == 0`, `revision_count == 0`, and zero critical defects.
* **Exclusions**: Cancelled tasks and tasks failed due to infrastructure outages (HTTP 503 / network drops).

#### Metric 4: Execution Time ($T_{\text{exec}}$)
$$\text{Formula: } T_{\text{exec\_i}} = (t_{\text{completed}} - t_{\text{started}}) - t_{\text{approval\_wait}}$$
$$\text{Average: } \overline{T}_{\text{exec}} = \frac{1}{N_{\text{completed}}} \sum_{i=1}^{N_{\text{completed}}} T_{\text{exec\_i}} \quad (\text{in seconds})$$
* **Inputs**: Monotonic timestamps recorded at task worker pickup and completion.
* **Strict Exclusions**:
  - Queue waiting time ($t_{\text{started}} - t_{\text{created}}$) is discarded.
  - Time elapsed while waiting for human CEO resolution in Approvals ($t_{\text{approval\_wait}}$) is subtracted.

#### Metric 5: Cost Per Task ($C_{\text{task}}$)
$$\text{Formula: } C_{\text{task\_i}} = (P_{\text{tokens}} \times \text{Price}_{\text{prompt}}) + (C_{\text{tokens}} \times \text{Price}_{\text{comp}}) + \text{Cost}_{\text{tools}}$$
$$\text{Average: } \overline{C}_{\text{task}} = \frac{1}{N_{\text{executed}}} \sum_{i=1}^{N_{\text{executed}}} C_{\text{task\_i}} \quad (\text{in USD})$$
* **Price Table**: Stored in `model_pricing` table:
  - `nvidia/nemotron-3-ultra-550b-a55b`: \$0.0015 / 1K prompt tokens, \$0.0020 / 1K completion tokens.
  - `heuristic-offline`: \$0.0000 / 1K tokens.
  - `gemini-1.5-pro`: \$0.00125 / 1K prompt tokens, \$0.0050 / 1K completion tokens.

#### Metric 6: Failure Rate ($R_{\text{fail}}$)
$$\text{Formula: } R_{\text{fail}} = \frac{N_{\text{failed}}}{N_{\text{completed}} + N_{\text{failed}}} \times 100 = 100 - R_{\text{comp}}$$

#### Metric 7: Collaboration Score ($C_{\text{score}}$)
$$\text{Formula: } C_{\text{score}} = \min\left(100, \, 20 \cdot \ln(1 + N_{\text{handoffs}}) + 15 \cdot \ln(1 + N_{\text{cross\_floor}}) + 30 \cdot (1 - \overline{T}_{\text{turnaround\_norm}})\right)$$
* **Inputs**:
  - $N_{\text{handoffs}}$: Count of inter-agent messages where `message_type = 'handoff'`.
  - $N_{\text{cross\_floor}}$: Count of cross-floor consultations (`sender_floor != recipient_floor`).
  - $\overline{T}_{\text{turnaround\_norm}}$: Ratio of average dependency handoff pick-up time to departmental target.

#### Metric 8: Human Approval Rate ($R_{\text{appr}}$)
$$\text{Formula: } R_{\text{appr}} = \frac{N_{\text{approved}}}{N_{\text{approved}} + N_{\text{rejected}}} \times 100$$
* **Inputs**: Count of Level 3 actions submitted by agent to CEO Approvals with `status = 'approved'` vs `status = 'rejected'`.
* **Special Rule**: If an agent produces only Level 1/2 tasks that do not require CEO review ($N_{\text{submitted}} = 0$), this metric displays `"N/A (Autonomous Level 2)"` rather than a zero or false penalty.

#### Versioned Composite Score (Transparent & Configurable)
To avoid opaque single scores, the Composite Score ($C_{\text{comp}}$) is versioned and calculated strictly as:
$$C_{\text{comp}} = w_1 R_{\text{comp}} + w_2 Q_{\text{out}} + w_3 A_{\text{task}} + w_4 \left(100 - \min(100, \frac{\overline{T}_{\text{exec}}}{T_{\text{target}}} \times 100)\right) + w_5 R_{\text{appr}}$$
* **Default Version (`v1.0`) Weights**:
  - Task Completion ($w_1$): $0.25$
  - Output Quality ($w_2$): $0.30$
  - Accuracy ($w_3$): $0.20$
  - Execution Efficiency ($w_4$): $0.15$
  - Human Approval ($w_5$): $0.10$
* **Rule**: Every UI presentation of $C_{\text{comp}}$ **must** display the 5 constituent scores directly adjacent to the composite figure.

---

## 5. Database Schema & Lifecycle State Machine

### 5.1 Lifecycle State Machine
Every employee transitions strictly through this deterministic directed graph:

```mermaid
stateDiagram-v2
    [*] --> candidate: Created in Recruitment Centre
    candidate --> in_testing: Launch Sandbox Test Tasks
    in_testing --> candidate: Tests Failed (Needs Spec Revision)
    in_testing --> active: Passed Tests + CEO Authorization (Hire)
    
    active --> in_retraining: CEO Authorizes Retraining
    in_retraining --> active: Sandbox Re-evaluation Passed + CEO Approval
    
    active --> suspended: CEO Authorizes Suspension
    suspended --> active: CEO Authorizes Reactivation
    
    active --> terminated: CEO Authorizes Termination (Typed Name Confirmation)
    suspended --> terminated: CEO Authorizes Termination (Typed Name Confirmation)
    
    terminated --> active: CEO Reactivation + Re-validation Gate
```

#### Transition Invariants & Guard Rules:
1. **Illegal Transitions**: Any transition not explicitly in the state diagram above is rejected server-side with HTTP 422 (`"ILLEGAL_LIFECYCLE_TRANSITION"`).
2. **Authorization Boundary**: Transitions to `active` (from candidate/in_testing/terminated), `suspended`, `terminated`, `in_retraining`, or rollback require a verified `approval_id` signed by human CEO Arjun.
3. **In-Flight Task Handling**:
   - Suspending or terminating an employee triggers immediate graceful handoff: in-progress tasks are re-assigned to the department manager or marked `failed_due_to_lifecycle` (never silently dropped).
   - Tool credentials and API tokens are instantly revoked upon entering `suspended` or `terminated`.
4. **Soft Delete & Archive Guarantee**: No SQL `DELETE` statement exists for employees, configurations, evaluations, or audit records. Terminated agents have `lifecycle_state = 'terminated'` and `archived_at = datetime.utcnow()`.

### 5.2 Proposed Relational Schema (Additive Migrations)

#### Table 1: `workforce_employees` (Master Employee Record)
```sql
CREATE TABLE workforce_employees (
    agent_id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    current_title VARCHAR(128) NOT NULL,
    department VARCHAR(64) NOT NULL,
    floor INTEGER NOT NULL DEFAULT 0,
    current_config_version INTEGER NOT NULL DEFAULT 1,
    lifecycle_state VARCHAR(32) NOT NULL DEFAULT 'active', -- candidate, in_testing, active, in_retraining, suspended, terminated
    hire_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_state_change DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    avatar_file VARCHAR(128) NOT NULL,
    shirt_color VARCHAR(32),
    is_archived BOOLEAN NOT NULL DEFAULT 0,
    archived_at DATETIME
);
CREATE INDEX idx_emp_dept_state ON workforce_employees(department, lifecycle_state);
```

#### Table 2: `workforce_agent_configs` (Immutable Configuration Versions)
```sql
CREATE TABLE workforce_agent_configs (
    id VARCHAR(64) PRIMARY KEY,
    agent_id VARCHAR(64) NOT NULL,
    version_number INTEGER NOT NULL,
    title VARCHAR(128) NOT NULL,
    role VARCHAR(128) NOT NULL,
    department VARCHAR(64) NOT NULL,
    floor INTEGER NOT NULL,
    permission_level INTEGER NOT NULL DEFAULT 2,
    model_name VARCHAR(128) NOT NULL,
    system_instructions TEXT NOT NULL,
    tools_whitelist JSON NOT NULL,      -- Array of allowed tool IDs
    permission_scopes JSON NOT NULL,    -- Array of allowed action categories
    memory_configuration JSON NOT NULL, -- Memory window, retrieval tags
    evaluation_criteria JSON NOT NULL,  -- Required pass criteria
    change_reason TEXT NOT NULL,
    authorized_by_principal VARCHAR(64) NOT NULL,
    linked_approval_id VARCHAR(64),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(agent_id) REFERENCES workforce_employees(agent_id),
    UNIQUE(agent_id, version_number)
);
CREATE INDEX idx_config_agent_ver ON workforce_agent_configs(agent_id, version_number);
```

#### Table 3: `workforce_task_telemetry` (Execution Timestamps & Costs)
```sql
CREATE TABLE workforce_task_telemetry (
    id VARCHAR(64) PRIMARY KEY,
    task_id VARCHAR(64) NOT NULL UNIQUE,
    project_id VARCHAR(64),
    agent_id VARCHAR(64) NOT NULL,
    department VARCHAR(64) NOT NULL,
    started_at DATETIME NOT NULL,
    completed_at DATETIME,
    approval_wait_seconds REAL NOT NULL DEFAULT 0.0,
    execution_duration_seconds REAL,
    model_name VARCHAR(128),
    prompt_tokens INTEGER NOT NULL DEFAULT 0,
    completion_tokens INTEGER NOT NULL DEFAULT 0,
    cost_usd REAL NOT NULL DEFAULT 0.0,
    status VARCHAR(32) NOT NULL,        -- completed, failed, cancelled
    retry_count INTEGER NOT NULL DEFAULT 0,
    failure_category VARCHAR(64),       -- agent_error, tool_timeout, rate_limit, quality_reject
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(task_id) REFERENCES tasks(id)
);
CREATE INDEX idx_telemetry_agent_date ON workforce_task_telemetry(agent_id, created_at);
```

#### Table 4: `workforce_task_evaluations` (Quality & Accuracy Scores)
```sql
CREATE TABLE workforce_task_evaluations (
    id VARCHAR(64) PRIMARY KEY,
    task_id VARCHAR(64) NOT NULL,
    agent_id VARCHAR(64) NOT NULL,
    evaluator_type VARCHAR(32) NOT NULL, -- automated_qa, rubric_inspector, ceo_review
    quality_score REAL NOT NULL,         -- 0.0 to 100.0
    accuracy_score REAL NOT NULL,        -- 0.0 to 100.0
    defects_count INTEGER NOT NULL DEFAULT 0,
    rubric_breakdown JSON NOT NULL,
    evaluation_notes TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(task_id) REFERENCES tasks(id)
);
CREATE INDEX idx_eval_agent_date ON workforce_task_evaluations(agent_id, created_at);
```

#### Table 5: `workforce_recruitment_tests` (Sandbox Candidate Runs)
```sql
CREATE TABLE workforce_recruitment_tests (
    id VARCHAR(64) PRIMARY KEY,
    candidate_id VARCHAR(64) NOT NULL,
    test_suite_id VARCHAR(64) NOT NULL,
    test_task_title VARCHAR(255) NOT NULL,
    input_payload JSON NOT NULL,
    output_payload JSON,
    quality_score REAL,
    pass_threshold REAL NOT NULL DEFAULT 80.0,
    passed BOOLEAN NOT NULL DEFAULT 0,
    duration_seconds REAL NOT NULL,
    cost_usd REAL NOT NULL DEFAULT 0.0,
    error_log TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(candidate_id) REFERENCES workforce_employees(agent_id)
);
CREATE INDEX idx_recruitment_candidate ON workforce_recruitment_tests(candidate_id);
```

#### Table 6: `workforce_recommendations` (Advisor Verifiable Output)
```sql
CREATE TABLE workforce_recommendations (
    id VARCHAR(64) PRIMARY KEY,
    rec_type VARCHAR(64) NOT NULL, -- underperformance, promotion, skill_gap, workload_imbalance, cost_optimization
    target_agent_id VARCHAR(64) NOT NULL,
    department VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    reasoning TEXT NOT NULL,
    evidence JSON NOT NULL,          -- Array of real record IDs, computed figures, benchmark diffs
    confidence_score REAL NOT NULL,  -- 0.0 to 1.0 (derived deterministically from sample size & effect size)
    sample_size INTEGER NOT NULL,
    data_window_days INTEGER NOT NULL,
    model_used VARCHAR(128) NOT NULL,
    prompt_version VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'pending', -- pending, accepted, dismissed, expired
    linked_approval_id VARCHAR(64),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME
);
CREATE INDEX idx_rec_status_dept ON workforce_recommendations(status, department);
```

#### Table 7: `workforce_audit_log` (Strictly Append-Only Ledger)
```sql
CREATE TABLE workforce_audit_log (
    id VARCHAR(64) PRIMARY KEY,
    actor_principal VARCHAR(64) NOT NULL,
    actor_role VARCHAR(32) NOT NULL,
    action VARCHAR(64) NOT NULL, -- hire, promote, retrain, reassign, suspend, terminate, reactivate, rollback
    target_agent_id VARCHAR(64) NOT NULL,
    target_agent_name VARCHAR(128) NOT NULL,
    before_state JSON NOT NULL,
    after_state JSON NOT NULL,
    reason TEXT NOT NULL,
    linked_approval_id VARCHAR(64) NOT NULL,
    linked_recommendation_id VARCHAR(64),
    correlation_id VARCHAR(64) NOT NULL,
    ip_address VARCHAR(45),
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_audit_target_time ON workforce_audit_log(target_agent_id, timestamp);
```

---

## 6. RBAC Matrix & Consequential Authorization Flow

### 6.1 Role-Based Access Matrix

| Operation / Endpoint | CEO (Arjun) | Dept Head (COO, CTO, Director) | Viewer / Auditor | AI Agent (Advisor, AURI) |
| :--- | :---: | :---: | :---: | :---: |
| View Leaderboard & Metrics | Allowed | Allowed | Allowed | Allowed (Read-only) |
| View Agent Dossier & History | Allowed | Allowed | Allowed | Allowed (Read-only) |
| Run Sandbox Recruitment Test | Allowed | Allowed | Forbidden | Forbidden |
| Submit Lifecycle Request (Draft) | Allowed | Allowed | Forbidden | Forbidden (Only recs) |
| **Authorize / Execute Hire** | **EXCLUSIVE** | Forbidden (HTTP 403) | Forbidden (HTTP 403) | Forbidden (HTTP 403) |
| **Authorize / Execute Promotion** | **EXCLUSIVE** | Forbidden (HTTP 403) | Forbidden (HTTP 403) | Forbidden (HTTP 403) |
| **Authorize / Execute Retraining** | **EXCLUSIVE** | Forbidden (HTTP 403) | Forbidden (HTTP 403) | Forbidden (HTTP 403) |
| **Authorize / Execute Reassign** | **EXCLUSIVE** | Forbidden (HTTP 403) | Forbidden (HTTP 403) | Forbidden (HTTP 403) |
| **Authorize / Execute Suspend** | **EXCLUSIVE** | Forbidden (HTTP 403) | Forbidden (HTTP 403) | Forbidden (HTTP 403) |
| **Authorize / Execute Terminate** | **EXCLUSIVE** | Forbidden (HTTP 403) | Forbidden (HTTP 403) | Forbidden (HTTP 403) |
| **Authorize / Execute Rollback** | **EXCLUSIVE** | Forbidden (HTTP 403) | Forbidden (HTTP 403) | Forbidden (HTTP 403) |
| View Append-Only Audit Log | Allowed | Allowed (Read-only) | Allowed (Read-only) | Forbidden |
| Update / Delete Audit Records | **BLOCKED FOR ALL** | **BLOCKED FOR ALL** | **BLOCKED FOR ALL** | **BLOCKED FOR ALL** |

### 6.2 Consequential Action Execution Flow

```mermaid
sequenceDiagram
    autonumber
    actor CEO as Human CEO (Arjun)
    participant UI as Workforce UI / Approvals Modal
    participant API as FastAPI Workforce Router
    participant RBAC as Server-Side RBAC Guard
    participant SM as Lifecycle State Machine
    participant DB as SQLite Transaction
    participant AUDIT as Append-Only Audit Logger
    participant WS as WebSocket Gateway

    CEO->>UI: Selects "Promote to Senior Editor"
    UI->>API: POST /api/workforce/requests/create (Draft Action)
    API->>DB: Insert ApprovalModel (action_type="lifecycle_promote", status="pending")
    API-->>UI: Return approval_id

    Note over CEO,UI: Review Stage in CEO Approval Gate
    CEO->>UI: Types approval reason & confirms
    CEO->>UI: Clicks "Authorize & Execute Promotion"
    UI->>API: POST /api/workforce/lifecycle/execute (approval_id, agent_id, action="promote", target_config)
    
    API->>RBAC: require_ceo(principal)
    alt Principal is NOT human CEO
        RBAC-->>API: Raise HTTP 403 Forbidden
        API-->>UI: "FORBIDDEN: Only human CEO may execute lifecycle actions."
    else Principal IS human CEO
        API->>SM: validate_transition(current_state, "active", action="promote")
        SM-->>API: Validated
        API->>DB: Begin Atomic Async Transaction
        DB->>DB: Update ApprovalModel (status="approved", resolved_at=now)
        DB->>DB: Insert workforce_agent_configs (new version_number=N+1)
        DB->>DB: Update workforce_employees (current_config_version=N+1)
        DB->>AUDIT: Insert workforce_audit_log (immutable entry)
        DB->>DB: Commit Transaction
        API->>WS: Broadcast "employee_lifecycle_changed" {agent_id, action, new_version}
        API-->>UI: Return 200 OK {success: true, new_version: N+1}
    end
```

---

## 7. Real-Time Office Synchronization & Visual Mapping

Lifecycle operations trigger immediate visual reactions in the Virtual Campus without requiring page refresh, mapped to the renderer-agnostic employee state interface:

| Lifecycle Action | Server WebSocket Event | Virtual Campus Visual Behavior | Character Pose / Overhead Indicator |
| :--- | :--- | :--- | :--- |
| **Hire Deployed** | `employee_hired` | Character spawns at Floor 0 Reception / Campus entrance, walks down aisle to designated desk. | Confetti / sparkles, name badge revealed, sits at desk. |
| **Promoted** | `employee_promoted` | Character stands up from desk, plays brief celebration animation, updates shirt/collar trim. | Golden star overhead icon, updated title badge. |
| **Reassigned** | `employee_reassigned` | Stands up, walks to escalator/stairwell, changes floor, enters new department room, sits at new desk. | Brief luggage / transit thought bubble. |
| **Suspended** | `employee_suspended` | Desk monitor turns off, character turns grey/faded (50% opacity), workstation marked "SUSPENDED". | Yellow pause badge overhead. |
| **Retraining** | `employee_retraining` | Character seated at testing booth or study desk with holographic terminal open. | Animated rotating gear / training icon. |
| **Terminated** | `employee_terminated` | Stands up, walks along corridor out the exit door, disappears from active floor map; archived in roster. | Brief wave farewell, desk cleared of personal items. |
| **Reactivated** | `employee_reactivated` | Re-enters floor from elevator, walks back to assigned desk, opacity restored to 100%. | Green active checkmark overhead. |

---

## 8. API Endpoints, UI Plan, Test Plan & Open Questions

### 8.1 Complete API Endpoint List

#### A. Performance Analytics & Leaderboard
- `GET /api/workforce/analytics/leaderboard`: Query leaderboard with filters (`period_days=7|30|90|custom`, `department`, `sort_by`, `page`). Returns real computed metrics + `is_insufficient_data` flags.
- `GET /api/workforce/analytics/department-breakdown`: Department productivity, accuracy, cost, and workload distribution.
- `GET /api/workforce/analytics/trends/{agent_id}`: Time-series historical data points for the 8 indicators.

#### B. Employee Dossier & Lifecycle Management
- `GET /api/workforce/employees`: List all employees across all lifecycle states.
- `GET /api/workforce/employees/{agent_id}`: Full employee dossier (current state, config history, metrics summary, recent tasks, active warnings).
- `POST /api/workforce/lifecycle/request`: Propose a lifecycle change (creates a pending Approval entry).
- `POST /api/workforce/lifecycle/execute`: **[CEO ONLY]** Authorize and execute an approved lifecycle action (`promote`, `reassign`, `suspend`, `terminate`, `reactivate`, `rollback`).
- `GET /api/workforce/employees/{agent_id}/configs`: Version history of employee configurations.
- `POST /api/workforce/employees/{agent_id}/rollback`: **[CEO ONLY]** Rollback employee configuration to a prior immutable version number.

#### C. AI Recruitment Centre
- `POST /api/workforce/recruitment/candidates`: Create a new candidate agent specification (starts in `candidate` state).
- `POST /api/workforce/recruitment/candidates/{candidate_id}/test`: Run sandboxed test tasks against evaluation criteria.
- `GET /api/workforce/recruitment/candidates/{candidate_id}/results`: View test suite results (scores, inputs, outputs, costs, durations).
- `POST /api/workforce/recruitment/candidates/{candidate_id}/deploy-request`: Submit deployment request to CEO Approvals (gated on passing test score $\ge 80\%$).

#### D. Workforce Advisor
- `GET /api/workforce/advisor/recommendations`: List active recommendations with citations, evidence JSON, confidence, and status.
- `POST /api/workforce/advisor/run`: Trigger deterministic analysis + LLM explanation generation.
- `POST /api/workforce/advisor/recommendations/{rec_id}/accept`: Convert recommendation into a pending CEO Approval request.
- `POST /api/workforce/advisor/recommendations/{rec_id}/dismiss`: Dismiss recommendation with feedback.

#### E. Audit Log
- `GET /api/workforce/audit/logs`: Filterable, read-only audit log query (`agent_id`, `action`, `actor`, `date_range`, `page`).

---

### 8.2 UI Plan & Screen Layouts

1. **Top Navigation Tab**: Added to main header next to `Headquarters`, `Command Center`, `Media Vault`, `Comms`:
   - `Workforce & Talent` (with badge showing pending lifecycle approvals or advisor alerts).
2. **Talent Dashboard (`TalentDashboard.tsx`)**:
   - Header bar with period selector (`7 Days`, `30 Days`, `90 Days`, `Custom Range`), Department filter pills, and "Recruit AI Employee" button.
   - Org-wide summary metrics cards (Total Output, Avg Quality, Total AI Cost, Fleet Reliability).
   - Employee Leaderboard Table:
     - Columns: Employee, Department, Lifecycle Status, Tasks Done, Completion Rate, Quality Score, Accuracy, Avg Exec Time, Cost/Task, Approval Rate, Composite Score, Actions.
     - Sparkline charts for 30-day trends.
     - Honest `"Insufficient Data"` indicator badge on metrics below 10 tasks.
3. **Agent Profile Modal (`AgentProfileModal.tsx`)**:
   - Tabbed view: `Overview & Metrics`, `Config Versions History`, `Recent Tasks & Output`, `Lifecycle Actions`.
   - Action controls: Promote, Retrain, Reassign Department, Suspend, Terminate (opens guarded dialog), Rollback version.
4. **Recruitment Centre (`RecruitmentCentre.tsx`)**:
   - Step 1: Role Definition (Title, Department, Skills, Assigned Floor).
   - Step 2: Model & Instructions (Model selector, system prompt, temperature).
   - Step 3: Tool Whitelist & Permission Scopes (Least-privilege checkboxes).
   - Step 4: Sandbox Test Suite Runner (Executes test tasks; live progress bar; outputs pass/fail metrics).
   - Step 5: Proposal for CEO Deployment (Disabled if tests fail).
5. **Workforce Advisor Panel (`WorkforceAdvisorPanel.tsx`)**:
   - Cards grouped by recommendation category (Underperformance, Promotion, Skill Gap, Cost Optimization).
   - Transparent Evidence Box: Cites specific task IDs, failure percentages, and cost savings.
   - Buttons: `Accept & Request Approval` | `Dismiss`.
6. **Lifecycle Action Dialog (`LifecycleActionDialog.tsx`)**:
   - Consequence warning banner.
   - Justification / Reason text field (required, saved to audit log).
   - For termination: **Mandatory typed confirmation** of the exact employee name before button activates.
7. **Audit Log Viewer (`AuditLogViewer.tsx`)**:
   - Read-only forensic table with actor, action badge, target employee, timestamp, before/after diff viewer, and linked approval ID.

---

### 8.3 Automated Test Plan

1. **Unit Tests (`test_workforce_state_machine.py`)**:
   - Test all 10 allowed transitions in the lifecycle graph $\rightarrow$ Assert success.
   - Test all illegal transitions (e.g., `candidate` directly to `terminated`, `suspended` directly to `in_retraining`) $\rightarrow$ Assert `IllegalLifecycleTransitionError`.
2. **RBAC & Authorization Tests (`test_workforce_rbac.py`)**:
   - Non-CEO user attempting `POST /api/workforce/lifecycle/execute` $\rightarrow$ Assert HTTP 403 Forbidden.
   - AI agent principal attempting lifecycle execution $\rightarrow$ Assert HTTP 403 Forbidden.
   - CEO executing without linked approval $\rightarrow$ Assert HTTP 400 Bad Request.
   - CEO executing with valid approval $\rightarrow$ Assert HTTP 200 OK and database mutation.
3. **Audit Log Immutability Tests (`test_workforce_audit.py`)**:
   - Lifecycle action creates exactly 1 audit entry.
   - Attempting SQL `UPDATE` or `DELETE` on `workforce_audit_log` raises error or is blocked.
4. **Soft-Delete Invariant Tests (`test_no_hard_delete.py`)**:
   - Terminate employee $\rightarrow$ Verify employee row still exists in DB with `lifecycle_state = 'terminated'`.
   - Verify task telemetry, configs, and audit records remain 100% intact.
5. **Metrics Computation Tests (`test_workforce_metrics.py`)**:
   - Verify all 8 metric formulas against hand-computed fixtures.
   - Test edge cases: 0 tasks, 5 tasks (below minimum sample threshold of 10 $\rightarrow$ `"insufficient data"`), cancelled tasks excluded, approval wait time subtracted from execution time.
6. **Advisor Verification Tests (`test_workforce_advisor.py`)**:
   - Advisor recommendation citing non-existent task IDs is discarded before saving.
   - Advisor recommendations never mutate employee lifecycle state directly.
7. **Recruitment Sandbox Gate Tests (`test_workforce_recruitment.py`)**:
   - Candidate with test score $< 80\%$ cannot be proposed for deployment.
   - Test tasks executed in sandbox do not write to production project tables or external tools.
8. **Real-Time WebSocket Sync Tests (`test_workforce_realtime.py`)**:
   - Triggering lifecycle action broadcasts `employee_lifecycle_changed` event with correct payload.
9. **E2E Playwright Browser Tests**:
   - Navigate to Workforce dashboard, inspect leaderboard, open employee dossier, trigger recruitment test, and save screenshots to `/screenshots/workforce-intelligence/`.
10. **Continuous Improvement Verification Tests**:
   - Scheduled advisor runs are idempotent for the same data window and never execute any lifecycle action.
   - The advisor and recruitment drafts cannot create agents, grant permissions or deploy; only a CEO-authorized request can.
   - Outcome tracking: baseline capture and before/after calculation verified against hand-computed fixtures, including the insufficient-data case.
   - No code path exists that approves or executes a lifecycle action without explicit CEO authorization (test for any auto-approve or delegated-approval route).

---

## 9. Design of the Continuous Improvement Loop

### 9.1 Organizational Weakness Detection (Beyond Individual Agents)
The system analyzes multi-agent workflow data to detect systemic organizational friction:
1. **Workflow Bottlenecks**: Stages where tasks experience the highest queue latency or dependency blocking duration.
2. **Approval Backlogs**: Departments or action types accumulating excessive pending Level 3 reviews.
3. **Handoff Delays**: Significant latency between a task completion and downstream agent pickup.
4. **Overloaded vs. Idle Departments**: Disproportionate task distribution across departments.
5. **Single Points of Failure**: Capabilities or critical task types possessed by only a single agent with no departmental backup.
6. **Recurring Failure Patterns**: Specific task types or error codes failing repeatedly despite retries.
7. **Cost Anomalies**: Sudden spikes in token consumption or cost-per-deliverable.
8. **Capability Gaps**: Task types that are frequently reassigned, retried, escalated or left unassigned due to missing domain skills.

Each finding is recorded in `workforce_organizational_findings`:
- `id`, `finding_type`, `severity` (Critical, High, Medium, Low), `confidence_score`, `evidence` (record IDs & metrics), `title`, `description`, `suggested_action`, `data_window_days`, `status` (`active`, `addressed`, `dismissed`), `created_at`.
- Stored under the identical evidence-verification rules as advisor recommendations.

### 9.2 Scheduled Analysis & Rate Limiting
- **Schedule**: The Workforce Advisor runs on a configurable schedule (default: daily at 00:00 UTC) and on-demand by the CEO.
- **Guardrails**:
  - Rate-limited (minimum 1 hour between automatic runs unless forced by CEO).
  - Telemetry logged and cost-tracked.
  - **Strict Idempotency**: For the same data window, duplicate findings are suppressed; only new or escalating issues are surfaced.
  - High-severity findings trigger persistent notification alerts in the CEO Command Centre.

### 9.3 Gap-to-Recruitment Drafting
- When a capability gap is diagnosed, the Advisor generates a **DRAFT Job Specification**:
  - Suggested Title, Department, Floor, Responsibilities, Required Skills.
  - Recommended Model, System Instructions, Tool Whitelist (least-privilege).
  - Proposed Sandbox Test Tasks and Pass Thresholds.
- **Strict Boundary**: The draft is pre-filled into the Recruitment Centre and linked to the finding ID. **A draft has zero operational effect** until the CEO reviews, modifies, and submits it.
- Deployment follows the strict gate: test tasks pass $\rightarrow$ CEO Level 3 approval $\rightarrow$ CEO authorization execution. The Advisor **cannot** create agents, grant permissions, or deploy.

### 9.4 Closed-Loop Impact Tracking (Observed Change vs. Causation)
When the CEO authorizes an action originating from a finding or recommendation (e.g. hiring a specialist, retraining an agent, reassigning departments):
1. **Baseline Capture**: Snapshot baseline metrics ($R_{\text{comp}}, Q_{\text{out}}, A_{\text{task}}, T_{\text{exec}}, C_{\text{task}}$) for the affected agent, department, and workflow at execution timestamp ($t_0$).
2. **Follow-Up Window**: Track metrics across a follow-up evaluation period (default: 30 days).
3. **Outcome Evaluation**: Compare before/after metrics:
   - `improved`: Quantifiable positive change exceeding threshold ($> 5\%$) with sufficient sample size ($\ge 10$ tasks).
   - `no_change`: Metric delta within $\pm 5\%$.
   - `worsened`: Performance degradation ($> 5\%$).
   - `insufficient_data`: Sample size below 10 tasks in the follow-up period.
4. **Causation Limitation Rule**: Outcomes are documented strictly as **observed change**, never as proven causation (acknowledging task complexity shifts, seasonal volume, and external factors).
5. **Advisor Track Record**: The Advisor panel surfaces its historical track record (accepted recommendations vs observed outcomes). This feedback is **informational only** and **never** automatically alters system prompts, weights, or behavior.

### 9.5 Retraining Loop
1. **Proposal**: Diagnostic finding cites specific defect patterns and proposes updated instructions or tool access with evidence.
2. **CEO Authorization**: Human CEO reviews and signs off in Approvals.
3. **Sandbox Testing**: New configuration version is placed in a sandbox and re-evaluated against the exact test criteria that flagged the weakness.
4. **CEO Review & Final Deployment**: Re-evaluation results are presented to the CEO. The CEO authorizes reactivation or rolls back to the prior configuration version. No retrained agent goes live without passing re-evaluation and human CEO approval.

### 9.6 Hard Authority Boundary
Every improvement step that changes system state requires explicit human CEO authorization. No auto-approve mode, delegated approval, or self-modifying code paths exist anywhere in the application.

---

### 8.4 Risks & Open Questions for CEO Arjun

1. **Pre-Existing Data Backfill**:
   - Currently, `tasks` has 125 historical rows, but `created_at` and `updated_at` are identical for several test runs, and `started_at` was not captured.
   - *Proposal*: Backfill existing registered agents (`Darshan, Shrinithi, Vaishnavi, Shreyank, Iffah, Jiya, Srijana, Pratham, Mallika, Vaibhav, Faazil, Marcus Vance`) into `workforce_employees` as `active` with Config Version 1. For historical tasks lacking `started_at`, report `insufficient data` for historical duration rather than fabricating timestamps.
2. **Minimum Sample Size Threshold**:
   - We propose a default minimum sample size of **10 completed tasks** in the selected window (7, 30, or 90 days) before calculating quality, accuracy, and execution speed rankings. Is 10 tasks acceptable, or would you prefer 5 for faster initial onboarding?
3. **CEO Termination Safety**:
   - We have implemented mandatory typed confirmation of the employee's name (`"Type 'Darshan' to confirm termination"`) in addition to explicit CEO authorization. Are any additional safeguards required?
