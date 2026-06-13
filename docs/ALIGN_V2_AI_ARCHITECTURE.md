# ALIGN V2 AI Architecture

## Related Docs

- [ALIGN_V2_DOCS_INDEX.md](../docs/ALIGN_V2_DOCS_INDEX.md)
- [ALIGN_AI_CORE_MAP.md](../docs/ALIGN_AI_CORE_MAP.md)
- [ALIGN_V2_SCHEMAS.md](../docs/ALIGN_V2_SCHEMAS.md)
- [ALIGN_V2_MIGRATION_PLAN.md](../docs/ALIGN_V2_MIGRATION_PLAN.md)
- [ALIGN_V2_IMPLEMENTATION_ROADMAP.md](../docs/ALIGN_V2_IMPLEMENTATION_ROADMAP.md)

## Goal

This document defines a practical AI architecture for ALIGN v2.

It is intentionally opinionated:

- use AI for perception and interpretation
- use deterministic logic for scoring and prioritization
- treat `snapshot` as the first visible layer of a larger report
- keep the system observable and restartable

This is not a greenfield proposal. It is designed to evolve from the current codebase.

Relevant current files:

- `src/lib/analysis-pipeline.ts`
- `src/lib/analysis-job-service.ts`
- `src/lib/analysis-worker.ts`
- `src/lib/preanalysis-worker.ts`
- `src/lib/gemini.ts`
- `src/lib/engine.ts`
- `src/lib/repositories/analysis-repository.ts`
- `src/lib/repositories/security-repository.ts`
- `src/lib/repositories/billing-repository.ts`
- `supabase/migrations/202603310100_analysis_pipeline_and_reports.sql`

---

## 1. Product Model

ALIGN should not behave like "one AI call that looks at an image and writes a whole report".

ALIGN v2 should behave like:

1. collect user intent and room images
2. extract visual observations
3. compute deterministic scores and priorities
4. generate a short snapshot
5. generate a deeper full report
6. generate or retrieve recommendations separately

This means the system has four distinct outputs:

- `analysis_input`
- `vision_observation`
- `snapshot`
- `full_report`

Recommendations are a fifth, optional output and should stay independent from the core report.

---

## 2. Key Design Decisions

### A. Snapshot is part of the full report

`snapshot` should not be a different report.

It should be the first visible layer of the same report:

- headline
- short summary
- top findings
- quick actions

`full_report` should preserve all snapshot content and then expand it with:

- deeper explanation
- strengths already present
- top pressure points
- priority action plan
- optional recommendations

In other words:

- `snapshot = preview`
- `full_report = expanded report`

### B. AI does not own the whole chain

AI should not do everything.

Recommended split:

- AI: visual extraction
- deterministic code: scores, priorities, ranking
- AI: snapshot writing
- AI or deterministic expansion: full report writing
- deterministic/retrieval layer: recommendations

### C. Scoring must be versioned and reproducible

The scoring layer should be deterministic and versioned.

Suggested fields:

- `scoring_version`
- `score_inputs`
- `drivers`
- `top_issues`

This is important for:

- trust
- debugging
- report comparisons
- future recalculation

### D. Event logging is not optional

Every analysis step should emit events.

Without an event log, you will not know:

- which phase is slowest
- where jobs fail
- which inputs lead to retries
- which prompts regress quality

---

## 3. Target Flow

### Phase A. Input

The frontend collects:

- 1-3 room photos
- room type
- user goal
- current concern
- optional notes

The frontend should submit one normalized `analysis request`.

It should not directly shape backend domain logic beyond input validation and UI mapping.

### Phase B. Job creation

The API should:

- validate user/session
- validate uploaded images
- normalize input
- create a job
- persist input payload
- return `jobId`

No AI work should happen in this phase.

### Phase C. Vision extraction

The first AI stage looks at images only.

It should output structured observations, not a full report.

Example categories:

- room type
- visual clutter
- softness / harshness
- lighting quality
- visible support zones
- visible stress zones
- spatial friction signals

### Phase D. Scoring

Code consumes structured observations and generates:

- sleep score
- focus score
- calm score
- primary drivers
- top issues
- ranked priorities

This phase should be deterministic.

### Phase E. Snapshot generation

A writing model consumes:

- normalized input
- visual observations
- scores
- drivers
- top issues

It returns:

- headline
- summary
- top findings
- quick actions

At this point the product reaches `snapshot_ready`.

### Phase F. Full report generation

The full report should expand the snapshot instead of inventing a new logic tree.

Suggested sections:

- overview
- how the space may be affecting the user
- what is already helping
- what is currently holding the space back
- 3 priority shifts
- next-step plan

### Phase G. Recommendations

Recommendations should stay separate from the core report.

They can eventually be powered by:

- rules
- retrieval
- product matching
- optional LLM phrasing

This separation keeps the core report stable even if recommendation logic changes frequently.

---

## 4. AI Responsibility Map

### 4.1 Input normalizer

Preferred implementation:

- deterministic code first
- minimal LLM use only if needed

Responsibilities:

- normalize room type
- normalize goals
- normalize concerns
- sanitize notes

Output:

```json
{
  "roomType": "bedroom",
  "goals": ["sleep", "calm"],
  "concerns": ["clutter", "restlessness"],
  "notes": "I often feel like I can't fully unwind here."
}
```

### 4.2 Vision extractor

Preferred implementation:

- image-capable model

Responsibilities:

- look at images only
- produce evidence-backed observations
- avoid narrative report writing

Suggested shape:

```json
{
  "roomTypeDetected": "bedroom",
  "observationSummary": "A compact bedroom with moderate visual clutter and limited softness.",
  "observations": [
    {
      "key": "visible_clutter",
      "value": true,
      "confidence": 0.91,
      "evidence": "multiple exposed items on desk and floor"
    },
    {
      "key": "soft_lighting_absent",
      "value": true,
      "confidence": 0.76,
      "evidence": "room appears lit mainly by overhead light"
    }
  ]
}
```

### 4.3 Scoring engine

Preferred implementation:

- deterministic code

Responsibilities:

- calculate scores
- calculate drivers
- rank issues
- rank priorities

Suggested shape:

```json
{
  "scores": {
    "sleep": 64,
    "focus": 58,
    "calm": 60
  },
  "drivers": [
    {
      "key": "visible_clutter",
      "direction": "negative",
      "impact": 14
    }
  ],
  "topIssues": [
    "visual clutter",
    "harsh evening lighting",
    "lack of visual separation"
  ]
}
```

### 4.4 Snapshot writer

Preferred implementation:

- text model

Responsibilities:

- consume normalized input, observations, and score output
- write a concise, consistent snapshot
- avoid long-form explanation

### 4.5 Full report writer

Preferred implementation:

- text model or hybrid deterministic + text expansion

Responsibilities:

- expand the same diagnosis
- keep continuity with snapshot
- avoid contradictory conclusions

### 4.6 Recommendation generator

Preferred implementation:

- deterministic or retrieval-driven
- optional LLM formatting

Responsibilities:

- products
- setup suggestions
- habit or ritual suggestions

This should not be the same step as full report generation.

---

## 5. Recommended Job State Machine

The current codebase already has a pipeline abstraction:

- `pipeline_stage`
- `pipeline_status`
- `preanalysis_status`
- `snapshot_status`
- `full_report_status`

For v2, the product-facing state model should become:

```txt
draft
queued
extracting
extracted
scoring
snapshot_generating
snapshot_ready
report_generating
report_ready
recommendations_generating
completed
failed
```

For implementation, ALIGN can map that product model onto a slightly more technical internal model:

```txt
initialized
photo_uploaded
preanalysis_queued
preanalysis_processing
preanalysis_completed
snapshot_queued
snapshot_processing
snapshot_completed
full_report_queued
full_report_processing
full_report_completed
failed
```

That lets the current code evolve without a disruptive rewrite.

### Why `snapshot_ready` matters

This is the most important transition in the whole system.

Once `snapshot_ready` is reached:

- the user has already experienced value
- the UI can stop being a blocking spinner
- the backend can continue deeper generation asynchronously
- paid unlock or notification flows become much easier

---

## 6. Storage Model

### Recommendation: start with a Lean v2 schema

Do not split into many tables immediately.

A practical first version is:

- `analysis_jobs`
- `analysis_inputs`
- `analysis_artifacts`
- `job_events`

Then treat these artifact types as first-class payloads inside `analysis_artifacts`:

- `uploaded_photo`
- `vision_observation`
- `score_result`
- `snapshot`
- `full_report`
- `recommendations`

This keeps the architecture layered without forcing too many joins too early.

### Suggested tables

#### `analysis_jobs`

Purpose:

- source of truth for lifecycle state

Suggested fields:

- `id`
- `user_id`
- `status`
- `current_step`
- `input_hash`
- `error_code`
- `error_message`
- `snapshot_ready_at`
- `report_ready_at`
- `created_at`
- `updated_at`

#### `analysis_inputs`

Purpose:

- preserve raw and normalized request data

Suggested fields:

- `id`
- `job_id`
- `image_urls`
- `selected_goals`
- `selected_concerns`
- `notes`
- `language`
- `normalized_payload`
- `created_at`

#### `analysis_artifacts`

Purpose:

- persist each machine-generated stage

Suggested fields:

- `id`
- `job_id`
- `artifact_type`
- `artifact_version`
- `payload`
- `model_name`
- `created_at`

#### `job_events`

Purpose:

- observability and debugging

Suggested fields:

- `id`
- `job_id`
- `event_type`
- `payload`
- `created_at`

### When to split into dedicated tables

If the product later needs:

- analytics by score dimension
- fast admin filtering
- recommendation inventory joins
- large-scale reprocessing

then split these artifacts into dedicated tables:

- `vision_observations`
- `score_results`
- `snapshots`
- `full_reports`
- `recommendations`

But do that after the artifact shapes stabilize.

---

## 7. Frontend State Model

The UI should never force the user to wait for the deepest stage before showing value.

### Processing screen

Recommended messages:

- `queued`: preparing your analysis
- `extracting`: reading your space
- `snapshot_generating`: building your first insights
- `report_generating`: preparing your deeper report

### Snapshot screen

Should display:

1. headline
2. scores
3. top findings
4. quick actions
5. status note about the full report

### Full report screen

Should display:

1. overview
2. strengths already present
3. pressure points
4. priority actions
5. recommendations

### Failure states

Support at least two levels:

- soft delay: "this analysis is taking longer than expected"
- hard failure: "we could not complete this analysis from the current images"

Offer next actions:

- retry
- upload clearer photos
- continue with fewer photos

---

## 8. Mapping From Current ALIGN To V2

### Current

The current system is roughly:

- upload photo
- optional room preanalysis
- snapshot generation
- paid full plan generation

Important current facts:

- snapshot is AI-driven
- paid plan is still largely rules-driven
- `report_result` now exists as a shared aggregate
- `analysis_artifacts` exists and can already hold stage outputs

### Recommended migration path

#### Step 1. Keep `report_result` as the frontend contract

Do not create a second frontend contract.

Use:

- `report_result.free.snapshot`
- `report_result.paid.plan`
- `report_result.pipeline`

as the only response shape the frontend relies on.

#### Step 2. Introduce `vision_observation` artifact

Add a new artifact type:

- `vision_observation`

This becomes the output of the vision stage.

#### Step 3. Introduce `score_result` artifact

Add a deterministic scoring stage that consumes `vision_observation`.

#### Step 4. Refactor snapshot generation

Make snapshot generation consume:

- normalized inputs
- `vision_observation`
- `score_result`

instead of depending directly on raw image analysis logic.

#### Step 5. Refactor full report generation

Make full report consume:

- `snapshot`
- `score_result`
- action planning logic

This prevents it from becoming a second unrelated report.

#### Step 6. Separate recommendations

Move product and setup recommendations into their own stage and artifact.

---

## 9. Recommended Version For ALIGN

The best next implementation for ALIGN is not the maximal architecture.

It is a Lean v2 architecture:

### Backend

- Next.js routes for request handling
- Supabase for DB and storage
- explicit job records
- artifact-based persistence

### AI

- one vision-capable model for extraction
- one text model for snapshot and report writing

### Deterministic logic

- scoring
- issue ranking
- recommendation ranking

### UX

- snapshot first
- report later
- recommendations separate

This gives ALIGN:

- better observability
- less prompt overload
- lower model coupling
- cleaner monetization layers
- easier future retraining and prompt iteration

---

## 10. Non-Negotiable Principles

1. Do not let one model own the entire analysis chain.
2. Extract observations before generating interpretation.
3. Keep scores deterministic and versioned.
4. Treat snapshot as the first layer of the full report.
5. Keep all AI outputs schema-bound.
6. Log all job transitions and failures.
7. Design UI around phased progress, not a single blocking spinner.

---

## 11. Recommended Next Build Step

The next most valuable implementation step is:

1. add `vision_observation` artifact
2. add deterministic `score_result`
3. make snapshot consume those two outputs
4. keep using `report_result` as the unified frontend contract

That is the cleanest way to evolve the current system into ALIGN v2 without throwing away the pipeline work already done.
