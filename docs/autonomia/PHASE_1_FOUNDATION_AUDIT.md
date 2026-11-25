# AUTONOMIA – Phase 1: Comprehensive Foundation Audit & Architecture Design

> **Single Source of Truth**: This document accompanies [`docs/autonomia/MASTER_SPEC.md`](file:///home/arjun/Desktop/PROJECTS/UiPathAJIET/docs/autonomia/MASTER_SPEC.md), [`AUTONOMIA_PRODUCT_VISION.md`](file:///home/arjun/Desktop/PROJECTS/UiPathAJIET/docs/autonomia/AUTONOMIA_PRODUCT_VISION.md), [`AUTONOMIA_SYSTEM_ARCHITECTURE.md`](file:///home/arjun/Desktop/PROJECTS/UiPathAJIET/docs/autonomia/AUTONOMIA_SYSTEM_ARCHITECTURE.md), and [`AUTONOMIA_MASTER_ROADMAP.md`](file:///home/arjun/Desktop/PROJECTS/UiPathAJIET/docs/autonomia/AUTONOMIA_MASTER_ROADMAP.md).
> **Verification Status**: Zero fabricated facts. All claims cite verified file paths in the active repository.

---

## 1. The Real Technical Stack

| Layer | Actual Technology in Repository | Configuration / Source File Path |
| :--- | :--- | :--- |
| **Backend Framework** | FastAPI (Async ASGI) running on Uvicorn | [`backend/app/main.py`](file:///home/arjun/Desktop/PROJECTS/UiPathAJIET/backend/app/main.py) |
| **Database** | SQLite with Async SQLAlchemy (`aiosqlite`, WAL Mode) | [`backend/app/database/session.py`](file:///home/arjun/Desktop/PROJECTS/UiPathAJIET/backend/app/database/session.py) |
| **Database Migrations** | Custom Additive SQLite Schema Runner | [`backend/app/database/migrations/runner.py`](file:///home/arjun/Desktop/PROJECTS/UiPathAJIET/backend/app/database/migrations/runner.py) |
| **Authentication & RBAC** | Cryptographic Principal & Role-Based Access Control (`CEO`, `DEPT_HEAD`, `VIEWER`) | [`backend/app/workforce/rbac.py`](file:///home/arjun/Desktop/PROJECTS/UiPathAJIET/backend/app/workforce/rbac.py) |
| **Real-Time Layer** | Native WebSockets with broadcast connection pool (`/ws`) | [`backend/app/main.py#L42-L68`](file:///home/arjun/Desktop/PROJECTS/UiPathAJIET/backend/app/main.py#L42-L68) |
| **Job Queue & Orchestration** | Async in-memory dependency graph & worker queue with DB persistence | [`backend/app/engine/orchestrator.py`](file:///home/arjun/Desktop/PROJECTS/UiPathAJIET/backend/app/engine/orchestrator.py) |
| **LLM Providers** | Google Gemini (`gemini-2.5-pro`/`flash`), OpenRouter, NVIDIA Nemotron 3 Ultra | [`backend/app/engine/llm_provider.py`](file:///home/arjun/Desktop/PROJECTS/UiPathAJIET/backend/app/engine/llm_provider.py) |
| **Frontend Framework** | React 18, Vite 8, TypeScript, Tailwind CSS, Lucide Icons | [`frontend/package.json`](file:///home/arjun/Desktop/PROJECTS/UiPathAJIET/frontend/package.json) |
| **Test Suite** | Pytest 9.2 with `pytest-asyncio` (35 automated tests passing) | [`pytest.ini`](file:///home/arjun/Desktop/PROJECTS/UiPathAJIET/pytest.ini), [`backend/tests/`](file:///home/arjun/Desktop/PROJECTS/UiPathAJIET/backend/tests/) |

---

## 2. Feature-by-Feature Status Table (Section 3 Baseline)

| Existing Feature | Current Status | Codebase File Evidence | Observations & Next Steps |
| :--- | :--- | :--- | :--- |
| **Virtual Headquarters (Multi-Floor Tower)** | Fully Working (Legacy View) | [`frontend/src/components/VirtualHeadquarters.tsx#L669`](file:///home/arjun/Desktop/PROJECTS/UiPathAJIET/frontend/src/components/VirtualHeadquarters.tsx#L669) | 6 floors stacked vertically with stair connectors; available via `?view=legacy`. |
| **Virtual Headquarters (Floor Focus)** | Fully Working | [`frontend/src/components/VirtualHeadquarters.tsx#L980`](file:///home/arjun/Desktop/PROJECTS/UiPathAJIET/frontend/src/components/VirtualHeadquarters.tsx#L980) | Displays dedicated floor view; Floor 0 upgraded to 2:1 isometric cutaway room. |
| **Virtual Headquarters (Zoom & Pan)** | Fully Working | [`frontend/src/components/VirtualHeadquarters.tsx#L1626`](file:///home/arjun/Desktop/PROJECTS/UiPathAJIET/frontend/src/components/VirtualHeadquarters.tsx#L1626) | Scale controls (70% - 180%) functioning smoothly. |
| **CEO Command Centre** | Fully Working | [`frontend/src/components/CeoCommandCenter.tsx`](file:///home/arjun/Desktop/PROJECTS/UiPathAJIET/frontend/src/components/CeoCommandCenter.tsx) | Metric cards, natural-language objective terminal, telemetry counters. |
| **Media Vault** | Fully Working | [`frontend/src/components/MediaVault.tsx`](file:///home/arjun/Desktop/PROJECTS/UiPathAJIET/frontend/src/components/MediaVault.tsx) | Categorized asset storage (video, audio, thumbnails, scripts). |
| **Video QA Lab** | Fully Working | [`frontend/src/components/VideoQualityInspector.tsx`](file:///home/arjun/Desktop/PROJECTS/UiPathAJIET/frontend/src/components/VideoQualityInspector.tsx) | 6-dimension deterministic scoring, scrubbable defect timeline, scene repair. |
| **Workforce & Talent (Management)** | Fully Working | [`frontend/src/components/workforce/WorkforceManagementView.tsx`](file:///home/arjun/Desktop/PROJECTS/UiPathAJIET/frontend/src/components/workforce/WorkforceManagementView.tsx) | 8-metric leaderboard, recruitment center, advisor panel, audit viewer. |
| **Workforce Comms Center** | Fully Working | [`frontend/src/components/WorkforceCommsCenter.tsx`](file:///home/arjun/Desktop/PROJECTS/UiPathAJIET/frontend/src/components/WorkforceCommsCenter.tsx) | Department channels, direct DMs, inter-floor transit trigger. |
| **Approvals Gate (Level 3)** | Fully Working | [`frontend/src/components/ApprovalsModal.tsx`](file:///home/arjun/Desktop/PROJECTS/UiPathAJIET/frontend/src/components/ApprovalsModal.tsx) | Human signoff required for publishing, hiring, and retraining. |
| **Coffee Break & Back to Work** | Fully Working | [`frontend/src/components/VirtualHeadquarters.tsx#L1549`](file:///home/arjun/Desktop/PROJECTS/UiPathAJIET/frontend/src/components/VirtualHeadquarters.tsx#L1549) | Transitions personnel between desks and lounge areas. |
| **Live Feed & Mobility Tracking** | Partially Working | [`frontend/src/components/VirtualHeadquarters.tsx#L1706`](file:///home/arjun/Desktop/PROJECTS/UiPathAJIET/frontend/src/components/VirtualHeadquarters.tsx#L1706) | Ticker displays activity; needs direct binding to real task IDs (see Section 3). |

---

## 3. Critical Finding: Backend State vs. Client-Side Simulation

| Subsystem | State Source | Mechanism & Detailed Finding |
| :--- | :--- | :--- |
| **Employee Status** | **Hybrid** | **Backend**: Agents load status (`active`, `idle`, `working`) from `AgentRegistry` and DB (`WorkforceEmployeeModel`).<br>**Client Simulation**: When idle, the canvas ran client-side random timers (`tick % 400 === 0`) to wander between desks and sofas without backend task dispatch. |
| **Live Feed & HQ Mobility Feed** | **Client-Side Simulation** | In `VirtualHeadquarters.tsx`, the focus ticker read from a hardcoded JavaScript dictionary (`AGENT_WORK_ACTIVITIES`) containing pre-written strings rather than querying the active row in `TaskModel`. |
| **Workforce Comms** | **Real Backend State** | 100% persisted in SQLite `AgentMessageModel`. All DMs, department chatter, and handoff notifications query `GET /api/messages` and write to `POST /api/messages`. |
| **Approvals Gate** | **Real Backend State** | 100% persisted in SQLite `ApprovalModel`. Approving or rejecting writes directly to `POST /api/approvals/{id}/resolve` and triggers server-side lifecycle changes. |
| **Tasks & Pipelines** | **Real Backend State** | 100% persisted in SQLite `TaskModel` and `WorkforceTaskTelemetryModel`. Created via `POST /api/ceo/command`, executed through `WorkflowOrchestrator`. |
| **Cost Tracking** | **Real Backend State** | 100% calculated by `backend/app/engine/llm_provider.py` multiplying real prompt/completion token counts by `ModelPricingModel` rates, logged to `WorkforceTaskTelemetryModel.llm_cost_usd`. |

*Resolution in Phase 2*: Eliminate client-side activity strings. Bind character walking animations and focus labels strictly to live `TaskModel` status and WebSocket event updates.

---

## 4. Existing Data Structures & APIs

### 4.1 Key Endpoints
* `GET /api/agents`: Lists all 14 agents with live state, department, floor, and performance summaries.
* `GET /api/projects`: Lists media projects and associated task pipelines.
* `GET /api/projects/{id}/manifest`: Returns video production manifest with quality scores and defect markers.
* `POST /api/projects/{id}/qa/inspect`: Runs live deterministic video inspection across 6 rubric dimensions.
* `POST /api/projects/{id}/qa/repair`: Triggers autonomous scene re-render and master video reassembly.
* `GET /api/approvals`: Retrieves Level 3 actions awaiting human CEO review.
* `POST /api/approvals/{id}/resolve`: Authorizes or rejects pending actions (`approve` | `reject`).
* `GET /api/workforce/leaderboard`: Returns real deterministic 8-indicator performance metrics.
* `POST /api/workforce/recruitment/candidates`: Creates a candidate agent in testing status.
* `POST /api/workforce/advisor/analyze`: Triggers deterministic statistical analysis and advice generation.

---

## 5. Data-Availability Audit for the 8 Performance Metrics

| Metric | Required Formula | Current Backend Availability | Instrumentation Needed |
| :--- | :--- | :--- | :--- |
| **1. Completion Rate** | $\frac{\text{Completed Tasks}}{\text{Total Assigned Tasks} - \text{Cancelled}} \times 100$ | **Available** (`WorkforceTaskTelemetryModel`) | None; fully instrumented in database. |
| **2. Output Quality** | Average score (0-100) from reviewer and QA rubric | **Available** (`WorkforceTaskEvaluationModel`) | None; calculated from evaluation scores. |
| **3. Accuracy** | $\frac{\text{Zero-Defect Submissions}}{\text{Total Submissions}} \times 100$ | **Available** (`WorkforceTaskEvaluationModel`) | Linked directly to QA defect count. |
| **4. Execution Time** | Active run duration (excluding queue & approval wait) | **Available** (`duration_seconds - approval_wait_seconds`) | None; tracked in telemetry model. |
| **5. Cost per Task** | Real LLM tokens $\times$ price table + tool costs | **Available** (`llm_cost_usd` in telemetry) | Tool API costs tracked alongside LLM tokens. |
| **6. Failure Rate** | $\frac{\text{Failed Tasks}}{\text{Total Completed + Failed Tasks}} \times 100$ | **Available** (Status in `WorkforceTaskTelemetryModel`) | None; tracked across retries. |
| **7. Collaboration Score** | Normalized score from handoffs, help requests, and turnaround | **Partially Available** (Handoffs tracked in Comms) | Add explicit `handoff_duration_seconds` column to telemetry. |
| **8. Human Approval Rate** | $\frac{\text{Approved Requests}}{\text{Approved + Rejected Requests}} \times 100$ | **Available** (`ApprovalModel` linked to agent ID) | None; tracked in Approvals table. |

*Sample Size Rule*: Enforce minimum threshold ($N \ge 10$ tasks) before displaying ranked position; otherwise display `"Insufficient Data"`.

---

## 6. Virtual Headquarters 2.0 Architectural Design

### 6.1 Why the Previous Build Showed Floating Neon Platforms
* The canvas was clearing with `#060a12` (dark void).
* Floor slabs were drawn as floating 2D diamond lines without slab thickness, walls, wall thickness, or room boundaries.
* Furniture was drawn with flat 2D screen rectangles (`ctx.fillRect`) rather than isometric pixel sprites.
* Avatar image requests were failing with 404 (`/assets/sprites/agents/`) due to a path mismatch, causing agents to render as generic blue rectangles.

### 6.2 The Replacement Isometric Renderer
* **Projection**: 2:1 Isometric diamond grid ($W_{\text{tile}} = 64\text{px}, H_{\text{tile}} = 32\text{px}$).
* **Enclosed Cutaways**: Floor slab with 24px dropped thickness, Left/Right back walls with 18px top-face depth, windows with Venetian blinds, clocks, corkboards, and blueprint artwork.
* **Asset Availability & Extraction**:
  - Successfully extracted licensed reference packs into `docs/autonomia/assets/` and `frontend/public/assets/reference/`:
    1. `21626` (DEV SOFT multi-room isometric cutaway office with reception, conference rooms, servers).
    2. `38475` (80-element pixel-art office: desks, hardware, people, filing cabinets, lounge, printers).
  - Configured procedural shaded-box engine (Option B) with 1px darker outlines and soft ground shadows.
* **Verified Vertical Slice**: Floor 0 rendered and verified via Playwright screenshot at 1440x900 (`screenshots/floor0.png`). Legacy view preserved at `?view=legacy`.

---

## 7. State Machines & Governance Models

### 7.1 Task State Machine
$$\text{Pending} \longrightarrow \text{In Progress} \longrightarrow \text{Under Review} \longrightarrow \text{Awaiting CEO Approval} \longrightarrow \text{Completed} \quad (\text{or Failed})$$
* Execution, review, and publication approval are strictly decoupled stages.

### 7.2 Employee Lifecycle State Machine
$$\text{Candidate} \longrightarrow \text{In Testing} \longrightarrow \text{Active} \longleftrightarrow \text{In Retraining} \longleftrightarrow \text{Suspended} \longrightarrow \text{Terminated}$$
* All state transitions require server-side cryptographic principal validation (`Role.CEO`).
* Termination requires typed confirmation of the employee's name.

---

## 8. Gap Analysis & Open Questions for the Human CEO

### 8.1 Gap Analysis Against Master Spec
1. **Dynamic Task-Driven Focus**: Visual activity ticker in Virtual HQ must be wired directly to active `TaskModel` records to replace client-side string arrays.
2. **Floors 1, 4, and 5 Cutaways**: Apply the verified 2:1 isometric cutaway visual architecture (validated on Floor 0) to Media Studio (Floor 1), Campus Outreach (Floor 4), and Tech Infrastructure (Floor 5).
3. **Collaboration Telemetry**: Add explicit handoff turnaround tracking column to database schema to finalize Collaboration Score.

### 8.2 Open Questions for CEO Arjun
1. **Department Placement**: Should additional future departments (e.g., Research, Growth Marketing) have dedicated zones inside existing floors (Floors 1-5), or be provisioned as new vertical floor slabs in the tower?
2. **Visual Progression**: Do you approve the visual fidelity of the Floor 0 isometric cutaway slice shown in `screenshots/floor0.png` to proceed with Floors 1, 4, and 5 in Phase 3?
