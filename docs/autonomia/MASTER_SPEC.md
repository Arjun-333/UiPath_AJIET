# AUTONOMIA – MASTER BUILD SPECIFICATION (single source of truth)

## 0. Authority and Ground Rules

- This document is the single source of truth for building AUTONOMIA. It supersedes ALL earlier prompts, including any earlier instruction to use a top-down perspective for the Virtual Headquarters. If anything earlier conflicts with this document, this document wins.
- Extend the EXISTING application. Do NOT create a new project, do NOT replace the architecture unnecessarily, and do NOT remove or break existing functionality. Reuse the existing authentication, API conventions, database, migrations, real-time mechanism, job queue, LLM integrations and UI components.
- NEVER invent facts about the codebase. Inspect first. If this spec conflicts with what the code actually does, report the conflict, propose a resolution and wait. Do not silently deviate.
- Save this document verbatim as docs/autonomia/MASTER_SPEC.md. Because this is a large multi-phase program, re-read it and docs/autonomia/PROGRESS.md at the start of every phase so nothing is lost between sessions.
- Do NOT start building until Phase 1 is approved (see Section 14).
- Write complete implementations only: no stubs, no TODOs, no placeholder functions, no mock data in the running application, no omitted sections.
- Honest reporting: if something is partly working, simulated, blocked by missing data or a missing provider, or you are unsure, say so plainly. Never claim completion that you have not verified by running the feature yourself.

## 1. Vision

AUTONOMIA is an autonomous AI-powered organization. Specialized AI employees run departments, collaborate on organizational objectives, execute real workflows, have their performance measured, and help the organization improve itself, while the human CEO keeps strategic control and final authority.
- The Virtual Headquarters is the visual digital twin of the organization.
- The AI workforce is its operational engine.
- The CEO Command Centre is its management layer.
- Workforce Intelligence is its HR and performance management system.
- The Operations Engine, Media Factory and Business Intelligence turn objectives into delivered, measured results.
The human CEO manages an organization, not individual prompts.

## 2. Non-Negotiable Principles

1. Human authority: the human CEO (the application's user) is the only principal that can authorize consequential decisions. No AI agent, including the Executive AI coordinator and the Workforce Advisor, may authorize or execute them. Enforce this SERVER-SIDE.
2. One source of truth: there is ONE employee record, ONE department record, ONE task record and ONE approval record, shared by HR, task management, communications and the Virtual HQ. Do not create parallel representations.
3. Backend state drives visuals: the virtual office reflects real backend state. A character shown as "working" must correspond to an actual active task. Visual activity is never evidence of work.
4. Deterministic metrics, LLM reasoning: code computes metrics, state transitions, schedules and permissions. LLMs explain, plan, summarize and recommend. An LLM must never compute organizational statistics or decide a state transition.
5. No fabricated data: every number shown comes from real records. If data does not exist, show "insufficient data" and say what instrumentation is missing.
6. Recommendation is not action: AI recommendations are stored separately from executed actions. Accepting one only creates a pending request that goes through Approvals.
7. No hard deletion of employees, tasks, performance records, lifecycle records or audit entries. Archive and soft-delete only.
8. Least privilege: every agent gets only the tools and permissions its role needs, plus execution limits (max steps, tokens, time and cost per task).
9. Untrusted input: agent outputs, messages, documents and task content are data, never instructions to the system or to the advisor.
10. Event-driven integration: modules communicate through events and shared services, not tight coupling. The renderer stays independent of business logic.
11. Preserve and extend: keep everything in Section 3 working at all times.
12. Do not over-build: do not add technologies, departments or agents unless a documented requirement justifies them.

## 3. Existing Baseline To Preserve

The application already contains (verify each in Phase 1): Virtual Headquarters (multi-floor tower, Floor Focus view, zoom), CEO Command Centre, Media Vault, Video QA Lab, Workforce & Talent, Workforce Comms, Live Feed, Approvals, Coffee Break and Back to Work controls, HQ mobility feed, employee mobility and activity tracking, escalator/stair inter-floor movement, and existing agent orchestration, task management, backend integrations and APIs.
- Existing Workforce & Talent and Video QA Lab sections: inspect them and EXTEND them. Do not duplicate or replace them.
- Existing connections to backend data must stay connected. Never replace backend data with hardcoded mock data.

## 4. Organizational Model

Hierarchy:
- Level 1, CEO: the human user. Strategic direction and authorization.
- Level 2, Executive AI coordinator: analyzes objectives, prepares plans, monitors operations, coordinates departments. It can never overrule or impersonate the CEO.
- Level 3, Department heads: manager agents responsible for workload, task decomposition, assignment, progress and quality review.
- Level 4, specialized AI employees: agents that do the work (writing, research, coding, editing, analytics, communication and so on).

Departments are data, not code. Start with the four existing floors as departments (Executive Suite, Media Studio, Campus Outreach, Tech Infrastructure), each with a manager and a small number of specialists. Additional departments (for example Research, Finance, HR) must be addable through configuration. In Phase 1, propose whether they get zones within existing floors or new floors. Do not create dozens of agents.

An AI employee is a configurable, persistent software agent with: identity (name, role, department, level), model, instructions, tools, memory, permissions, evaluation criteria and work history. Every configuration is stored as an immutable, numbered version.

Event catalog (map to existing events in Phase 1, add only what is missing): agent.hired, agent.promoted, agent.reassigned, agent.retraining.started, agent.suspended, agent.terminated, agent.reactivated, agent.task.started, task.completed, task.failed, task.handoff, approval.requested, approval.granted, approval.rejected, asset.created, message.sent.

## 5. Operations Engine

Objective flow: the CEO submits a natural-language objective. The Executive coordinator drafts a plan showing departments, tasks, agent responsibilities, dependencies, estimated cost and approval requirements. The CEO reviews and approves the plan. Tasks are then created and executed.

Capabilities (reuse what exists, build only what is missing):
- Task creation and decomposition, assignment, dependency management, parallel execution where safe, scheduling.
- A task has an ID, parent objective, owner, department, inputs, outputs, dependencies, state, priority, deadline, cost, timestamps and completion criteria. Propose the final state machine in Phase 1. Execution, review and approval are separate stages: finished work is not automatically ready for external use.
- Retries with backoff and a maximum, timeouts, error records, and recovery after restart (all state persisted).
- Agent-to-agent hand-offs recorded as data (they feed the collaboration metric).
- Deadline monitoring and automatic escalation.
- Per-call cost tracking for LLM and tool usage, and execution logs.
- Risk-based approval policy, configurable and audited: routine internal work within an agent's permissions runs automatically. Sensitive actions (external publishing, financial actions, changes to permissions, models or budgets) require CEO authorization. All workforce lifecycle actions always require CEO authorization regardless of policy.
- Model provider abstraction: different employees and tasks can use different models. Reuse the existing provider integration. No lock-in to one model.
- Memory layers: agent-specific, department, organizational, task context. Structured records stay in the main database. Add vector retrieval only if Phase 1 shows a requirement for it.
- Orchestration: reuse the existing agent runtime. Introduce a framework (for example LangGraph) only if Phase 1 justifies it.

## 6. CEO Command Centre

- Organizational overview: registered, active, working, in-meeting and on-break employees; pending, completed and failed tasks; pending approvals; daily and monthly cost.
- Organizational Q&A ("What happened today?", "Why is Creative falling behind?", "Which agents perform best?"): answered ONLY from real records through a fixed set of parameterized, read-only analytics queries. The LLM selects and explains results, cites the underlying records, and never generates ad-hoc SQL against production data or invents statistics.
- Natural-language objectives with plan review (Section 5).
- Alerts: new high-severity workforce findings, delayed tasks, failures, escalations, approval requests.
- Entry points to Workforce Intelligence, Recruitment Centre and the Advisor.

## 7. Workforce Intelligence and Talent Management

The CEO can evaluate, recruit, promote, retrain, reassign, suspend, terminate and reactivate AI employees, and roll back configurations. The system observes, analyzes, recommends and drafts. The CEO decides.

### 7A. Performance Analytics
Leaderboard with: task completion rate, output quality, accuracy, execution time, cost per task, failure rate, collaboration score, human approval rate.
- Historical trends per employee, department and organization. Configurable evaluation periods (presets 7, 30, 90 days, plus custom). Department comparisons normalized for differing task types.
- Minimum sample size (configurable, default 10 tasks). Below it, show "insufficient data" instead of ranking.
- A composite score only if its weights are configurable, versioned and always shown next to its components.
- Write metric definitions precisely in Phase 1 (formula, source, exclusions). Examples: execution time excludes queue time and human-approval waiting; completion rate excludes cancelled tasks; cost per task is real token usage times a stored per-model price table plus tool costs; approval rate comes from the Approvals module; collaboration score derives from recorded hand-offs, help requests and review turnaround.
- Output quality and accuracy need a defined scoring source (reviewer score from the existing review/approval flow, an optional AI reviewer with a stored rubric, per-task-type validation checks). Propose it in Phase 1. Do not invent a scorer silently.
- Store immutable performance events plus periodic aggregates for cheap trend queries. Instrument any missing fields going forward (additive, nullable migrations). Do not backfill with guesses.

### 7B. Lifecycle Management
Baseline states (finalize in Phase 1): candidate → in_testing → active; active ↔ in_retraining; active ↔ suspended; active or suspended → terminated (archived); terminated → active (reactivation with re-validation). The backend rejects any transition not in the machine.
- Retraining means updated instructions, examples, memory or tools followed by sandboxed re-evaluation. It does NOT mean model fine-tuning.
- Promotion stores explicit changes (title, level, permissions, model, budget). Rollback reactivates a previous configuration version.
- Suspend and terminate: handle in-flight tasks through the existing orchestration (reassign or fail gracefully, never silently drop), revoke tool access and credentials immediately, archive memory.
- Hire, promote, terminate, reactivate, rollback and any permission-expanding change require explicit CEO authorization recorded against an Approvals entry. Termination also requires typing the employee's name.
- Append-only audit log for every operation: actor, action, target, timestamp, before and after state, reason, approval ID, recommendation ID (if any), correlation ID. No update or delete path exists for audit entries.
- Operations are idempotent and safe under concurrency (transactions or optimistic concurrency).

### 7C. AI Recruitment Centre
The CEO defines: job title, department, responsibilities, required skills, model, system instructions, tools and permissions, memory configuration, evaluation criteria.
- New agents enter in_testing and must pass test tasks in a sandbox with no production side effects and no access to production data or external publishing tools. Store inputs, outputs, scores, cost, duration and pass/fail against stored thresholds. Only passing agents can be proposed for deployment, and deployment still needs CEO authorization.
- Validate every field server-side (allowed models, tools, permission scopes). Reject permissions beyond department policy.

### 7D. Workforce Advisor
Analyzes ACTUAL performance data and recommends on: underperformers, high performers, promotion candidates, skill gaps, hiring needs, workload imbalances, redundant capabilities, cost optimization.
- Step 1: deterministic code computes statistics and candidate findings. Step 2: an LLM may turn them into readable reasoning but must not invent numbers.
- Every recommendation stores: type, target, evidence (real record IDs and computed figures), reasoning, confidence, data window, model and prompt version, status (pending, accepted, dismissed, expired) and timestamps.
- Confidence comes from a documented formula using sample size and effect size, not LLM self-report.
- Validate LLM output against a strict schema and verify every cited record exists and supports the claim. Discard recommendations that fail verification. Never recommend termination or promotion from thin data.
- The advisor must not low-score an agent and conclude "fire it". It investigates likely causes (configuration, model, workflow, workload) and proposes alternatives.
- Accepting a recommendation creates a pending request through Approvals. Nothing executes.

### 7E. Department Analytics
Dashboards for productivity, workload, quality, resource utilization and staffing needs, with drill-down from organization to department to agent to the individual tasks behind a metric.

### 7F. Continuous Improvement Loop
Measure → Diagnose → Recommend → CEO decision → Execute → Verify impact → repeat.
- Organizational findings (beyond individual agents): workflow bottlenecks, approval backlogs, hand-off delays, overloaded or idle departments, single points of failure, recurring failure patterns, cost anomalies, capability gaps. Each stored with evidence IDs, severity, confidence, data window and status, under the same verification rules as recommendations.
- Scheduled advisor runs (default daily) plus on-demand runs: rate-limited, logged, cost-tracked, idempotent for the same data window. New high-severity findings appear as Command Centre alerts.
- Gap-to-recruitment drafts: for a missing capability the advisor may produce a DRAFT job spec (all Recruitment Centre fields plus proposed test tasks, minimal permissions) linked to its finding. A draft has no effect until the CEO reviews, edits and submits it, after which the normal test-and-authorize gate applies. The advisor never creates agents, grants permissions or deploys.
- Closed-loop impact tracking: when the CEO executes an action that originated from a recommendation, record baseline metrics, then after a configurable window (default 30 days) compute before/after and attach an outcome (improved, no change, worsened, insufficient data). Describe outcomes as observed change, never proven causation, and respect minimum sample sizes. Outcomes are informational and never auto-change system behavior.
- Retraining loop: proposal with evidence → CEO authorization → new configuration version tested in the sandbox → re-evaluation against the criteria that flagged the weakness → results shown → CEO authorizes reactivation or rollback.
- Benchmarking (Phase 6): when employees have overlapping responsibilities, run equivalent benchmark tasks and compare quality, accuracy, speed, cost and reliability, to separate configuration problems from model problems from workflow problems.
- No auto-approve mode, delegated approval or scheduled job may execute a lifecycle action.

### 7G. Access Control and Integration
- RBAC using the existing auth system: at minimum CEO, department head (view own department, no consequential actions) and read-only viewer.
- Integrate with the Virtual HQ (live status and department sync), CEO Command Centre, Workforce Comms (lifecycle events and alerts), Approvals, and existing orchestration. Apply lifecycle changes through existing orchestration interfaces rather than parallel logic.

## 8. Virtual Headquarters 2.0 (Isometric Pixel Art)

Redesign the Virtual HQ as a living isometric pixel-art office. The current look (dark void background, floating neon diamond platforms, flat rectangles for monitors, no walls or furniture detail) is the explicit anti-pattern. Do NOT restyle the current platforms; replace the renderer.

Visual target: isometric pixel-art room dioramas (floor slab with visible thickness, two back walls with thickness, windows with blinds, wall decor such as clocks, pinboards and posters, detailed furniture).
- 2:1 isometric projection (32x16 px diamond tile), fixed camera. No CSS 3D transforms.
- Each floor is an enclosed cutaway with rooms joined by doorways and corridors with proper walls.
- Furniture drawn as isometric pixel sprites: desks, monitors, keyboards, chairs, filing cabinets, sofas, plants, bookshelves, server racks, bins and small props. A flat colored rectangle is never acceptable furniture.
- Light from the top-left: top faces lightest, left medium, right darkest. 1 px outline in a darker shade of each object's own color (not pure black). Soft ground shadows.
- One shared warm palette of at most 32 colors, in a single file.
- Light, muted backdrop. No black or empty dark background.
- Pixel rules: integer scaling only, imageSmoothingEnabled = false, image-rendering: pixelated. Never blurry.
- Depth sorting (painter's algorithm using grid position plus object height) so characters pass correctly in front of and behind furniture and walls.
- No emoji as sprites.

Floors (preserve existing floor numbers):
- Floor 0, Executive Suite: executive office, CEO workstation, meeting table, reception, lounge with sofas, plants and decor.
- Floor 1, Media Studio: editing desks and workstations, camera equipment, recording and content-creation areas, bookshelves and storage.
- Floor 4, Campus Outreach: collaborative workstations, student interaction area, meeting tables, communication desks, brainstorming space.
- Floor 5, Tech Infrastructure: server racks, developer workstations, networking equipment, monitoring screens, technical operations area.
Each floor must feel lived-in, not like a flat decorative map. Include a coffee area and meeting room where activities need them.

Asset strategy: if a licensed isometric tileset exists at /public/assets/iso/, use it and nothing else. Otherwise draw everything procedurally in code with a shaded-box helper (three lit faces, outline, detail passes), cached on offscreen canvases, and tell me honestly how the result differs from hand-drawn art. Never use assets with unclear licenses.

Characters:
- Isometric pixel sprites with 4 facing directions, walk cycle, idle and sitting poses. Generate each employee's appearance deterministically from a seed stored on their employee record, so every employee (including new hires) looks distinct without manual art.
- Name label, department, and an activity/status indicator overlay. Statuses: working, in meeting, coffee break, away, moving between floors, retraining, suspended, idle. Map every existing backend status value to one of these in Phase 1.

Movement:
- Walkability grid per floor and A* pathfinding at about 2 tiles per second. Characters never teleport.
- Backend state is the source of truth. On a status or assignment change the client routes from the character's CURRENT tile to the matching target (desk, meeting room, coffee area, escalator or exit) and walks it. Mid-walk changes re-route.
- Inter-floor travel: walk to the existing escalator/stairs, transition, appear at the destination floor's escalator, continue. Preserve and adapt the existing escalator logic.
- Lifecycle visuals: a hire spawns at reception and walks to their desk; a reassignment walks to the new department; suspension shows a suspended indicator; retraining shows a retraining status; termination walks the employee out and removes them while history is kept.
- Ambient idle behavior (coffee, chatting) is allowed ONLY for employees whose backend status is idle or on break. Never display "working" without an active task. Preserve Coffee Break and Back to Work as controls, record them as events, and keep their existing behavior.

Interaction:
- Click an employee: name, role, department, current activity, availability and status, performance summary link, and the relevant actions that already exist (list them from the codebase in Phase 1).
- Click a workstation or room: purpose, assigned employees, relevant information.
- Floor navigation: keep Multi-Floor Tower and Floor Focus modes, with a visually appealing transition between floors. Floors must feel like one connected building.
- Zoom and pan in integer scale steps (2x to 6x), touch support, usable on smaller screens.

Performance and architecture:
- Canvas 2D by default. Use PixiJS or Phaser only if Phase 1 justifies it against the "no unnecessary dependencies" rule. Do not build the world from hundreds of DOM elements.
- Cache each floor's static tilemap on an offscreen canvas and redraw only moving elements. Keep React overlays (panels, controls, labels) separate from the canvas.
- Target 60 fps with 30 employees on screen.
- The renderer consumes a renderer-independent employee-state interface (status, department, floor, assigned station, appearance seed, current task reference). It contains no business logic.
- Keep the old renderer reachable at ?view=legacy until I approve its removal.

## 9. Workforce Communications

- Department channels, agent-to-agent direct messages, CEO announcements, meeting scheduling with agendas and AI-generated summaries, operational alerts (delays, failures, escalations, approval requests), automatic escalation of unresolved issues.
- Every agent-to-agent message must be linked to a task or organizational event. Never generate meaningless AI-to-AI chatter to make the organization look busy.
- Keep the existing Workforce Comms working and extend it.

## 10. Media Vault and Autonomous Media Factory

- Media Vault stores images, videos, scripts, research reports, campaign assets, brand assets and guidelines, templates and final approved deliverables. Large files go in object storage (reuse existing storage), not database rows.
- Versioning and provenance for every asset: creating agent, producing task, approval status, previous versions, checksum.
- Production pipeline mapped to departments: trend research → content planning → scriptwriting → graphics → video editing → quality validation (QA checks outputs against task requirements and brand guidelines; integrate the existing Video QA Lab if suitable) → publishing preparation → performance analysis.
- Publishing: prepare only. No real external publishing unless an integration is configured and the CEO authorizes it, per policy.
- Generation: use the providers that actually exist. If a capability (image or video generation) has no configured provider, that stage reports "capability unavailable". Never fake generated assets.

## 11. Business Intelligence and Financial Management

- Track real LLM token consumption, per-model spend, tool/API cost, department budgets, cost per completed task, cost per campaign and monthly operational expenditure. Infrastructure cost only where measurable.
- Track department productivity, workload, completion time, quality trends, failure and retry rates, recruitment needs, bottlenecks and utilization.
- Budget alerts at configurable thresholds. Hard caps only if the CEO configures them.
- Optimization questions ("reduce cost 20% without hurting quality") produce a PROPOSED plan with evidence. Never autonomously change production models, budgets or permissions.

## 12. Architecture and Technology Guidance

- Phase 1 establishes the actual stack. Everything below is guidance, not a mandate.
- Backend as logical modules (not separate microservices unless justified): authentication and RBAC, organization manager, agent registry, agent runtime, orchestrator, workflow engine, recruitment, lifecycle engine, performance engine, workforce advisor, approvals, audit, cost, notifications.
- Retain the existing database and migration tooling. Required entities include: organizations, departments, agents, agent config versions, tasks, task events, evaluations, recommendations, findings, approvals, lifecycle history, audit logs, costs, media assets, impact outcomes.
- Do not adopt Redis, a vector database, LangGraph, a separate workflow engine, Phaser/PixiJS or other new technology unless the Phase 1 document shows the requirement and why existing tools are insufficient.
- Add no dependency without justification and a license check.

## 13. Security and Reliability

RBAC enforced server-side; least privilege; approval gates; full auditability; persistent state surviving restarts; failure recovery without corrupting state; prompt-injection resistance; input validation; rate limiting on expensive endpoints (advisor runs, test tasks, LLM-backed endpoints); secrets never logged; external side effects disabled by default; sandboxed test execution; reversible, additive migrations; existing agents backfilled as active with an initial configuration version without changing their behavior.

## 14. Roadmap and Gated Workflow

Create a new git branch. Work in gated phases. After EACH phase (or sub-phase): run its tests, git commit, update docs/autonomia/PROGRESS.md (done, tested, known issues, next), then STOP and wait for my go-ahead. Never start the next phase on your own.

PHASE 1 – Foundation audit and documentation (NO production code)
Deliver:
1. docs/autonomia/MASTER_SPEC.md (this document, verbatim), plus AUTONOMIA_PRODUCT_VISION.md, AUTONOMIA_SYSTEM_ARCHITECTURE.md and AUTONOMIA_MASTER_ROADMAP.md (phases, dependencies, milestones, acceptance criteria, status).
2. The real stack: frameworks, database and migrations, auth/RBAC, real-time mechanism, job queue, LLM providers, test setup.
3. A feature-by-feature status table for everything in Section 3: fully working, partially working, simulated or mocked, or missing, with file-path evidence.
4. CRITICAL FINDING: is employee movement/status, the Live Feed, the HQ mobility feed, Workforce Comms, Approvals, tasks and costs driven by real backend state, or by a client-side simulation? State it explicitly for each.
5. Existing agent, task, approval, cost and review data structures and APIs.
6. Data-availability audit for the 8 performance metrics (what exists, what is missing, what instrumentation is needed).
7. How the Virtual HQ is currently rendered (technology and files), why it looks the way it does, the recommended isometric renderer with justification, and asset availability.
8. Design items: metric definitions and quality/accuracy scoring source, schema and migrations, task and lifecycle state machines, RBAC matrix, authorization flow, event mapping to Virtual HQ behavior, status mapping, improvement-loop design (findings model, schedule, drafts, baseline capture, outcome calculation and its limitations).
9. Gap analysis against this spec, risks, a recommended phase order and open questions for me.
STOP and wait for approval.

PHASE 2 – Core Organizational Engine: strengthen only what the audit shows missing: single employee record and registry, department configuration, task engine, event layer, cost and performance instrumentation, persistent state, backend-driven status. Deliverable: persistent tasks executed by agents, with events and costs.

PHASE 3 – Virtual HQ 2.0
3.1 Visual system: palette, isometric renderer, sprite pipeline, depth sorting.
3.2 Floor 0 vertical slice. Playwright screenshot at 1440x900 saved to /screenshots/floor0.png, compared against the target style with a list of differences. The slice FAILS if it shows floating diamonds, a dark void, flat-rectangle furniture, emoji sprites, blur or wrong depth order. STOP for my visual approval before any other floor.
3.3 Floors 1, 4 and 5.
3.4 Sprites, animation and movement driven by real events.
3.5 Interaction panels, navigation and floor transitions.
3.6 Integration with existing features, performance and responsiveness.

PHASE 4 – Autonomous Departments and Delegation: department managers, objective decomposition, plan approval, hand-offs, task-linked communications.

PHASE 5 – Workforce Intelligence
5.1 data layer and metrics service; 5.2 lifecycle engine, authorization, approvals and audit log; 5.3 Recruitment Centre; 5.4 analytics, leaderboard and department dashboards; 5.5 Workforce Advisor; 5.6 continuous improvement loop; 5.7 integration with Virtual HQ, Command Centre and Comms; 5.8 hardening.

PHASE 6 – Agent Benchmarking and model comparison.
PHASE 7 – Autonomous Media Factory.
PHASE 8 – Executive Intelligence and Business Intelligence.
PHASE 9 – Production hardening: security review, performance and reliability testing, error recovery, monitoring, backups, documentation.

Default order is as listed. Phase 3 visual slices 3.1 to 3.3 do not depend on the backend and may run earlier on a separate branch; wiring to live events waits for Phase 2. I will confirm the final order when I approve Phase 1.

## 15. Testing and Verification

- State machines: every allowed transition succeeds, every illegal one is rejected.
- Authorization: non-CEO users and any AI/agent principal are rejected server-side for every consequential action. There is no code path that approves or executes a lifecycle action without explicit CEO authorization (test for auto-approve or delegated-approval routes).
- Audit: every lifecycle operation creates exactly one entry. Entries cannot be updated or deleted.
- No hard delete: no code path removes employee, performance, lifecycle or audit rows.
- Metrics verified against hand-computed fixtures, including zero tasks, below-minimum samples, cancelled tasks and retries.
- Advisor: recommendations with missing or unsupporting evidence are discarded. Recommendations and recruitment drafts never mutate state. Scheduled runs are idempotent.
- Recruitment: an agent that fails test tasks cannot be deployed.
- Outcome tracking: baseline capture and before/after calculation verified, including the insufficient-data case.
- Concurrency and idempotency of lifecycle actions.
- Real-time sync: a backend change appears in the Virtual HQ without reload, characters never teleport, and "working" status always has an active task behind it.
- Regression: for every feature in Section 3, state exactly how you verified it still works.
- Visual: Playwright (or equivalent) screenshots of every floor and every new screen at desktop and 390px width, saved under /screenshots/, with differences from the target listed honestly.
- Fixtures and synthetic data are allowed ONLY inside the test suite, never in the running application.

## 16. Code Quality and Deliverables

- Modular: environment and rooms, furniture and objects, sprites, movement, floor navigation, interaction panels, status indicators, task engine, lifecycle engine, authorization, audit, recruitment, advisor, analytics, API, real-time integration.
- Follow existing code style. Document every new API endpoint and environment variable. Maintain docs/autonomia/PROGRESS.md.
- Handle loading, empty, error and permission-denied states in every new UI.

## 17. Definition of Done

AUTONOMIA is done only when this end-to-end scenario works against REAL records and every step is verified by you:
1. Open the Virtual HQ and see employees whose positions and statuses reflect real backend state.
2. In the CEO Command Centre, submit an objective such as "Create a promotional campaign for our upcoming product launch".
3. Review and approve the generated plan (departments, tasks, dependencies, estimated cost).
4. Watch employees move and work in the HQ as their tasks start, hand off and complete.
5. See outputs arrive in the Media Vault with versioning and provenance (or an honest "capability unavailable" where no provider exists).
6. Review QA and approve final outputs through Approvals.
7. See Workforce Intelligence compute real metrics and the Advisor produce evidence-backed recommendations.
8. Authorize a lifecycle change (for example a retraining or hire) and watch the HQ reflect it.
9. Later, see the measured impact outcome for that change.
At the end, deliver a checklist mapping every requirement in Sections 2 to 13 to the code, test and screenshot that prove it, and list honestly anything not met.
