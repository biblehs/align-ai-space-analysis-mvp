# ALIGN V2 Migration Plan

## Goal

This document explains how to move from the current ALIGN pipeline to the recommended Lean v2 architecture without a destructive rewrite.

The migration strategy is:

- keep the current product working
- preserve the new `report_result` contract
- introduce new artifacts and scoring in layers
- avoid a large frontend rewrite until the backend stabilizes

---

## 1. Current Reality

Today ALIGN behaves roughly like this:

1. upload image
2. optional room preanalysis
3. generate free snapshot
4. after payment, generate `plan_result`

Important current facts:

- `snapshot` is AI-driven
- `plan_result` is mostly rules-driven
- `report_result` now exists and should become the single frontend contract
- `analysis_artifacts` already exists and should be used as the migration backbone

This means the migration should not start by deleting current fields.

It should start by introducing better internal artifacts while preserving output compatibility.

---

## 2. Migration Strategy

### Keep

Keep these as stable compatibility surfaces for now:

- `analyses`
- `analysis_jobs`
- `analysis_artifacts`
- `report_result`
- `snapshot_result`
- `plan_result`

### Add

Add new artifact payloads and event tracking before changing the frontend contract:

- `normalized_input`
- `vision_observation`
- `score_result`
- `job_events`

### Defer

Do not immediately split into many dedicated relational tables for every stage.

Defer dedicated tables for:

- `vision_observations`
- `score_results`
- `snapshots`
- `full_reports`
- `recommendations`

until artifact shapes become stable and querying needs justify the complexity.

---

## 3. Recommended Migration Phases

## Phase 0. Preserve the current pipeline

Objective:

- do not break current upload → snapshot → paid report flow

Required baseline:

- `report_result` remains the only frontend contract to grow
- current routes continue functioning

Relevant current files:

- `src/lib/analysis-worker.ts`
- `src/lib/preanalysis-worker.ts`
- `src/lib/billing/service.ts`
- `src/lib/analysis-pipeline.ts`

Success criteria:

- all current flows remain available
- snapshot and paid report pages still render

## Phase 1. Introduce normalized input artifact

Objective:

- make user input reproducible and versioned

What to add:

- artifact type: `normalized_input`

What to store:

- normalized room type
- goals
- concerns
- budget
- notes
- image count

Where to implement:

- input mapping layer near upload/analyze request handling
- `analysis_artifacts`

Success criteria:

- every new analysis can store a stable normalized payload
- prompt logic no longer depends directly on loose UI strings only

## Phase 2. Introduce vision observation artifact

Objective:

- separate visual perception from report generation

What to add:

- artifact type: `vision_observation`

What to store:

- validation result
- room type detected
- observation summary
- structured observations
- support zones
- stress zones

Where to implement:

- evolve `preanalysis-worker`
- keep compatibility with current `RoomPreAnalysis`

Success criteria:

- every successful image analysis produces one structured observation artifact
- current snapshot generation can still fall back to existing logic

## Phase 3. Add deterministic scoring

Objective:

- move scoring and prioritization out of the writing model

What to add:

- artifact type: `score_result`
- scoring version

What to store:

- sleep/focus/calm scores
- drivers
- top issues
- priority actions

Where to implement:

- new deterministic scoring module
- likely `src/lib/engine.ts` successor or adjacent service

Success criteria:

- the same observation payload always yields the same score payload
- versioned scoring can be recalculated later

## Phase 4. Rebuild snapshot generation on top of artifacts

Objective:

- snapshot should consume:
  - normalized input
  - vision observation
  - score result

What changes:

- snapshot generation stops being tightly coupled to raw image handling
- the writing model focuses on interpretation and phrasing

What stays:

- current frontend `SnapshotResult` shape can remain for compatibility

Success criteria:

- free snapshot page still renders with no breaking frontend change
- snapshot becomes more stable and debuggable

## Phase 5. Expand paid report beyond `plan_result`

Objective:

- distinguish executable action plan from the richer full report narrative

What to add:

- paid `fullReport` inside `report_result`
- optional `recommendations`

What stays:

- `plan_result` can remain as the action-plan layer

What changes:

- full report becomes:
  - explanation
  - strengths
  - pressure points
  - priority shifts
  - next-step plan

Success criteria:

- paid report no longer feels like only a rule-generated checklist
- snapshot and full report feel like the same product

## Phase 6. Split dedicated tables only if needed

Objective:

- improve queryability and analytics when scale requires it

Only split if you need:

- heavy filtering by score
- recommendation inventory joins
- large-scale reprocessing
- admin dashboards by artifact family

Until then, artifact storage is enough.

---

## 4. Table Evolution Plan

### Keep using `analyses`

Keep `analyses` as the root aggregate during migration.

Recommended role:

- lifecycle summary
- latest pipeline state
- latest frontend-facing report payload

Recommended fields to preserve:

- `pipeline_stage`
- `pipeline_status`
- `preanalysis_status`
- `snapshot_status`
- `full_report_status`
- `report_result`
- `snapshot_result`
- `plan_result`

### Expand `analysis_artifacts`

This should become the migration workhorse.

Recommended artifact payloads:

- `uploaded_photo`
- `normalized_input`
- `vision_observation`
- `score_result`
- `snapshot`
- `full_report`
- `recommendations`

### Add `job_events`

Recommended new table:

- `job_events`

Suggested columns:

- `id`
- `job_id`
- `event_type`
- `payload`
- `created_at`

Why now:

- low migration cost
- high debugging value
- high observability value

---

## 5. Frontend Compatibility Plan

### Rule 1

Frontend should continue consuming one aggregate:

- `report_result`

### Rule 2

Frontend should not read internal artifacts directly:

- not `vision_observation`
- not `score_result`
- not raw model output

### Rule 3

Current fallback compatibility should remain during migration:

- if `report_result` exists, use it first
- else fall back to `snapshot_result` and `plan_result`

This is already the correct direction in the current codebase and should continue.

---

## 6. Current-to-V2 Mapping

### Current `RoomPreAnalysis`

Map into:

- `vision_observation`

### Current `SnapshotResult`

Map into:

- `report_result.free.snapshot`

### Current `PlanStep[]`

Map into:

- `report_result.paid.plan`

### Future `FullReport`

Add as:

- `report_result.paid.fullReport`

### Future `RecommendationResult`

Add as:

- `report_result.paid.recommendations`

---

## 7. Rollout Order

If the team wants the safest order, build in this exact sequence:

1. add `job_events`
2. add `normalized_input`
3. add `vision_observation`
4. add `score_result`
5. refactor snapshot generation
6. add paid `fullReport`
7. add recommendations
8. evaluate whether dedicated tables are actually needed

---

## 8. What Not To Do

Do not:

- make one model own the entire chain
- replace the frontend contract before artifacts are stable
- split into many tables before you know how they will be queried
- let recommendations mutate the core diagnosis
- let paid report become a separate unrelated logic system

---

## 9. Minimal Success Definition

The migration is successful when:

1. every analysis stores normalized input
2. every usable photo stores a structured observation artifact
3. deterministic scoring exists and is versioned
4. snapshot generation consumes artifacts instead of raw image logic
5. frontend still reads one unified `report_result`
6. paid report is an expansion of the snapshot, not a different product
