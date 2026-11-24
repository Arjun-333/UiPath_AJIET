# AUTONOMIA — Workforce Intelligence & Talent Management Progress

Branch: `workforce-intelligence`

## Phase Roadmap & Status

- [x] **PHASE 1: Inspection & Design Specification (Gate)**
  - **Done**:
    - Full project inspection completed across backend, database, agents, orchestrator, approvals, telemetry, and frontend.
    - Comprehensive Technical Design Document authored at `docs/workforce-intelligence/DESIGN.md`.
    - Data-availability audit conducted for all 8 indicators.
    - Exact mathematical formulas, data sources, and exclusions specified for metrics.
    - Proposed relational schema (7 additive tables) and deterministic 7-state lifecycle machine designed.
    - Server-side RBAC matrix and human CEO authorization flow defined.
    - Real-time office event design and visual mapping specified for both 2D Pixel Campus and legacy view.
    - Complete API endpoint specification, UI layout plan, automated test suite architecture, and open questions articulated.
  - **Tested**:
    - Baseline test suite verified (`.venv/bin/pytest -v` passing 20/20 tests).
    - Database inspection executed against `data/autonomia.db`.
  - **Known Issues / Blockers**: None. Awaiting CEO approval of Phase 1 specification.
  - **Next**: Upon CEO approval, proceed to **Phase 2: Data Layer** (reversible migrations, additive tables, backfill of existing team, telemetry instrumentation, metrics engine).

- [x] **PHASE 2: Data Layer & Metrics Engine**
  - **Done**:
    - Created relational models in `backend/app/database/workforce_models.py` (`WorkforceEmployeeModel`, `WorkforceAgentConfigModel`, `WorkforceTaskTelemetryModel`, `WorkforceTaskEvaluationModel`, `WorkforceRecruitmentTestModel`, `WorkforceRecommendationModel`, `WorkforceAuditLogModel`, `ModelPricingModel`).
    - Implemented versioned, additive migration runner in `backend/app/database/migrations/runner.py` with `schema_migrations` tracking table and added indexed `agent_id` column to `approvals`.
    - Created idempotent backfill engine `backend/app/workforce/backfill.py` registering all 12 canonical team members as `active` with Config Version 1 and backfilling historical task telemetry.
    - Added execution duration and cost telemetry instrumentation in `backend/app/engine/orchestrator.py`, calculating pure execution time (subtracting approval wait time).
    - Built deterministic `backend/app/workforce/metrics_engine.py` calculating all 8 indicators, sample size rule (minimum 10 tasks), configurable transparent composite score (v1.0), department breakdown, and historical trend intervals.
    - Wired migration and backfill execution into `lifespan` in `backend/app/main.py`.
  - **Tested**:
    - Authored unit & integration suite `backend/tests/test_workforce_data.py`.
    - 5/5 Phase 2 tests passed; 25/25 total project tests passing.
  - **Known Issues / Blockers**: None.
  - **Next**: **Phase 3: Lifecycle Engine & State Machine** (state machine validation, immutable configuration versioning, server-side RBAC guard, append-only audit logger, in-flight task handling).

- [ ] **PHASE 3: Lifecycle Engine & State Machine**
  - [ ] Deterministic `state_machine.py` enforcing allowed transitions
  - [ ] Immutable configuration versioning (`workforce_agent_configs`)
  - [ ] Server-side RBAC guard enforcing exclusive human CEO authorization
  - [ ] Append-only audit logger (`workforce_audit_log`) with zero delete/update paths
  - [ ] In-flight task graceful reassignment/failure logic
  - [ ] Automated state machine and authorization unit tests

- [ ] **PHASE 4: AI Recruitment Centre**
  - [ ] Candidate agent definition endpoint and schema validation
  - [ ] Sandboxed test-task runner (zero production side effects)
  - [ ] Scoring and pass/fail gate ($\ge 80\%$)
  - [ ] CEO deployment request integration with Approvals module
  - [ ] Automated recruitment sandbox tests

- [ ] **PHASE 5: Analytics & Leaderboard APIs & Frontend**
  - [ ] Leaderboard API with period filters (7, 30, 90 days, custom), department filters, sparklines
  - [ ] Department analytics with drill-down to individual tasks
  - [ ] Frontend React components: `TalentDashboard.tsx`, `AgentProfileModal.tsx`, `DepartmentAnalytics.tsx`
  - [ ] Honest `"insufficient data"` UI badge handling

- [ ] **PHASE 6: Workforce Advisor**
  - [ ] Deterministic candidate findings generator (underperformance, promotion, skill gap, cost optimization)
  - [ ] LLM explanation layer with strict prompt injection protection and schema validation
  - [ ] Citations and evidence verification (discarding unverified claims)
  - [ ] Recommendation lifecycle (pending, accepted $\rightarrow$ creates Approval, dismissed)
  - [ ] `WorkforceAdvisorPanel.tsx` UI

- [ ] **PHASE 7: Real-Time Office & App Integration**
  - [ ] Real-time WebSocket synchronization (`employee_hired`, `employee_reassigned`, `employee_suspended`, `employee_terminated`, `employee_promoted`)
  - [ ] Virtual Campus visual state mapping (renderer-agnostic)
  - [ ] CEO Command Centre and Workforce Comms integration
  - [ ] Approvals modal integration for lifecycle requests

- [ ] **PHASE 8: Hardening, Automated Testing & Verification**
  - [ ] End-to-end integration and concurrency test suite
  - [ ] Security audit: verify non-CEO rejection, no-hard-delete invariant, immutable audit logs
  - [ ] Playwright browser screenshots saved to `/screenshots/workforce-intelligence/`
  - [ ] CEO verification checklist
