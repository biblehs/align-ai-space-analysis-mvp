# ALIGN V2 Implementation Roadmap

## Goal

This document turns the v2 architecture into a concrete execution sequence.

It is written for implementation, not strategy only.

Use it with:

- `docs/ALIGN_V2_AI_ARCHITECTURE.md`
- `docs/ALIGN_V2_SCHEMAS.md`
- `docs/ALIGN_V2_MIGRATION_PLAN.md`

---

## 1. Delivery Principles

1. Keep the current product usable while upgrading internals.
2. Prefer additive migration over destructive rewrite.
3. Preserve `report_result` as the frontend source of truth.
4. Ship artifact stages one by one.
5. Add observability before increasing model complexity.

---

## 2. Phase Plan

## Phase 1. Observability and contracts

Goal:

- make the pipeline measurable and version-aware

Deliverables:

- add `job_events`
- define artifact version constants
- define event type enums
- document `report_result` as the only frontend contract

Main outputs:

- migration for `job_events`
- event logging helper
- docs aligned

Acceptance criteria:

- each major stage emits a job event
- each stage has a versioned artifact type
- frontend does not need to change

## Phase 2. Normalized input

Goal:

- stabilize input semantics before changing AI stages

Deliverables:

- normalized input mapper
- `normalized_input` artifact persistence
- versioned normalized schema

Acceptance criteria:

- all new analyses store normalized input
- prompts can consume normalized fields instead of UI-specific strings

## Phase 3. Vision observation

Goal:

- formalize perception output

Deliverables:

- `vision_observation` artifact
- mapping from current `RoomPreAnalysis`
- validation + evidence + support/stress zone structure

Acceptance criteria:

- a usable room image yields a structured observation artifact
- current snapshot flow can still continue

## Phase 4. Deterministic scoring

Goal:

- move scoring out of the LLM

Deliverables:

- score engine module
- `score_result` artifact
- scoring version field

Acceptance criteria:

- same observation payload always yields same score result
- top issues and priority actions are derived without LLM variability

## Phase 5. Snapshot refactor

Goal:

- make snapshot a writer step, not a perception step

Deliverables:

- snapshot writer input contract
- snapshot writer prompt/schema
- snapshot generated from:
  - normalized input
  - vision observation
  - score result

Acceptance criteria:

- frontend snapshot experience remains stable
- backend snapshot generation becomes easier to debug

## Phase 6. Full report expansion

Goal:

- make paid report an expansion of the same diagnosis

Deliverables:

- `fullReport` payload inside `report_result`
- keep `plan_result` as action-plan compatibility layer
- generate narrative sections for paid experience

Acceptance criteria:

- full report preserves snapshot logic
- paid experience no longer feels like a separate system

## Phase 7. Recommendations separation

Goal:

- prevent commerce logic from polluting diagnosis

Deliverables:

- `recommendations` artifact
- optional `report_result.paid.recommendations`
- recommendation type enum

Acceptance criteria:

- recommendations can evolve independently
- core report remains stable when recommendation logic changes

## Phase 8. Optional relational split

Goal:

- optimize for analytics or scale only if necessary

Possible future tables:

- `vision_observations`
- `score_results`
- `snapshots`
- `full_reports`
- `recommendations`

Acceptance criteria:

- only split if query patterns justify it

---

## 3. Engineering Workstreams

### Workstream A. Data model

Files likely involved:

- `src/types/index.ts`
- `src/types/database.ts`
- `src/lib/analysis-pipeline.ts`
- Supabase migrations

### Workstream B. Pipeline execution

Files likely involved:

- `src/lib/analysis-job-service.ts`
- `src/lib/analysis-worker.ts`
- `src/lib/preanalysis-worker.ts`
- `src/lib/billing/service.ts`

### Workstream C. Artifact persistence

Files likely involved:

- `src/lib/repositories/analysis-repository.ts`
- `src/lib/repositories/security-repository.ts`
- future `job-events` repository

### Workstream D. AI prompt/schema layer

Files likely involved:

- `src/lib/gemini.ts`
- `src/lib/prompt.ts`
- `src/lib/schema.ts`

### Workstream E. Frontend contract

Files likely involved:

- `src/hooks/usePlan.ts`
- `src/features/app-ui/v2/upload/UploadStep3Page.tsx`
- `src/app/(member)/(flow)/app/plan/page.tsx`
- `src/features/auth/AccountReportPage.tsx`
- `src/features/auth/AccountPage.tsx`

---

## 4. Recommended Ticket Breakdown

### Ticket 1

Add `job_events` table and event logger.

### Ticket 2

Persist `normalized_input` artifact on every new analysis.

### Ticket 3

Introduce `vision_observation` artifact and evolve current preanalysis output.

### Ticket 4

Implement deterministic score engine and persist `score_result`.

### Ticket 5

Refactor snapshot generation to consume artifacts.

### Ticket 6

Add paid `fullReport` payload to `report_result`.

### Ticket 7

Separate recommendations from the report core.

### Ticket 8

Add admin/debug visibility for job stages, artifacts, and events.

---

## 5. Rollout Strategy

### Safe rollout mode

Use a compatibility-first rollout:

- generate new artifacts in parallel
- keep current snapshot/page rendering stable
- compare new output quality before switching primary generation path

### Dual-path rollout

For a limited period:

- current path remains primary
- new artifact-based path runs in shadow mode

Compare:

- latency
- failure rate
- output quality
- consistency

### Cutover point

Switch to v2 snapshot generation only when:

- artifact generation is stable
- score output is trustworthy
- new snapshot quality is good enough

---

## 6. Risks

### Risk 1. Over-modeling too early

If too many tables and abstractions are introduced too soon, the migration will slow down.

Mitigation:

- store first as artifacts
- split tables later

### Risk 2. Contradictory snapshot and full report

If the full report keeps using a different logic tree, the product will still feel inconsistent.

Mitigation:

- full report must expand the snapshot diagnosis

### Risk 3. Prompt bloat

If vision extraction and writing are mixed again, prompts will become heavy and unstable.

Mitigation:

- keep observation extraction separate from report writing

### Risk 4. Frontend contract churn

If frontend starts consuming internal artifacts directly, migration complexity will rise sharply.

Mitigation:

- keep `report_result` as the only frontend report contract

---

## 7. Practical Definition of Done

ALIGN v2 is meaningfully implemented when:

1. the pipeline stores normalized input
2. the pipeline stores vision observations
3. the pipeline stores deterministic scores
4. snapshot generation consumes those artifacts
5. full report expands the same diagnosis
6. recommendations are separated
7. `report_result` remains the unified frontend contract
8. job events make the whole chain observable
