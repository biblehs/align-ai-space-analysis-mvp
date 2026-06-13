# ALIGN AI Core Map

## Related Docs

- [ALIGN_V2_DOCS_INDEX.md](../docs/ALIGN_V2_DOCS_INDEX.md)
- [ALIGN_V2_AI_ARCHITECTURE.md](../docs/ALIGN_V2_AI_ARCHITECTURE.md)
- [ALIGN_V2_SCHEMAS.md](../docs/ALIGN_V2_SCHEMAS.md)
- [ALIGN_V2_MIGRATION_PLAN.md](../docs/ALIGN_V2_MIGRATION_PLAN.md)
- [ALIGN_V2_IMPLEMENTATION_ROADMAP.md](../docs/ALIGN_V2_IMPLEMENTATION_ROADMAP.md)

## Scope

This document maps the current non-UI core flow for ALIGN's AI analysis and report generation pipeline.

Focus:

- AI invocation
- upload and image preprocessing
- report generation flow
- backend routes
- storage and persistence
- paid plan fulfillment

Excluded by design:

- visual styling
- component-level UI polish
- marketing pages

## 1. Core File Inventory

### A. AI generation and prompt layer

- `src/lib/gemini.ts`
- `src/lib/prompt.ts`
- `src/lib/schema.ts`
- `src/lib/analysis-worker.ts`
- `src/lib/preanalysis-worker.ts`
- `src/lib/engine.ts`
- `docs/system/02_AI_SYSTEM_PRD.md`

### B. Image processing and storage

- `src/lib/image.ts`
- `src/lib/image-optimization.ts`
- `src/lib/upload-image.ts`
- `src/lib/services/room-photo-service.ts`

### C. Data contracts and persistence

- `src/types/index.ts`
- `src/types/database.ts`
- `src/lib/supabase.ts`
- `src/lib/repositories/analysis-repository.ts`
- `src/lib/repositories/security-repository.ts`
- `src/lib/repositories/billing-repository.ts`
- `src/lib/repositories/analytics-repository.ts`

### D. Core backend API routes

- `src/app/api/upload/route.ts`
- `src/app/api/analyze/route.ts`
- `src/app/api/analyze/[id]/route.ts`
- `src/app/api/analysis/access/route.ts`
- `src/app/api/analysis/discard/route.ts`
- `src/app/api/plan/[id]/route.ts`
- `src/app/api/checkout/route.ts`
- `src/app/api/billing/confirm/route.ts`
- `src/app/api/webhook/creem/route.ts`
- `src/app/api/account/analyses/route.ts`
- `src/app/api/account/analyses/[id]/route.ts`

### E. Billing and paid report fulfillment

- `src/lib/billing/index.ts`
- `src/lib/billing/service.ts`
- `src/lib/billing/config.ts`
- `src/lib/billing/providers/creem.ts`
- `src/data/products.json`

### F. Frontend-facing flow adapters and local flow state

These are interface callers, not core generation logic, but they define how the backend is invoked:

- `src/hooks/useUpload.ts`
- `src/hooks/useAnalyze.ts`
- `src/hooks/usePlan.ts`
- `src/hooks/useCheckout.ts`
- `src/features/analysis/storage.ts`
- `src/features/app-ui/v2/upload/storage.ts`
- `src/features/app-ui/v2/upload/UploadStep2Page.tsx`
- `src/features/app-ui/v2/upload/UploadStep3Page.tsx`
- `src/app/(member)/(flow)/app/processing/page.tsx`
- `src/app/(member)/(flow)/app/snapshot/page.tsx`
- `src/app/(member)/(flow)/app/plan/page.tsx`
- `src/app/(member)/(flow)/app/checkout/success/page.tsx`
- `src/features/auth/AccountReportPage.tsx`

### G. Supporting infrastructure

- `src/lib/auth-server.ts`
- `src/lib/auth-client.ts`
- `src/lib/security.ts`
- `src/lib/background.ts`
- `src/lib/logger.ts`
- `src/lib/analytics-client.ts`

### H. Database migrations tied to this pipeline

- `supabase/migrations/20260314_align_init.sql`
- `supabase/migrations/202603160100_security_and_access_controls.sql`
- `supabase/migrations/202603160200_upload_limits_and_job_controls.sql`
- `supabase/migrations/202603170100_profile_sessions_and_analytics.sql`
- `supabase/migrations/202603170200_creem_billing_refactor.sql`

## 2. Main Data Objects

### `SpaceData`

Source:

- built in `src/features/app-ui/v2/upload/storage.ts`
- persisted in `analyses.space_data`

Purpose:

- room context
- coarse environment metadata
- uploaded photo pointers

Key fields:

- `sunlight`
- `density`
- `spaceType`
- `perspectives`
- `photoPath`
- `photoUrl`

### `GoalData`

Source:

- built in `src/features/app-ui/v2/upload/storage.ts`
- persisted in `analyses.goal_data`

Purpose:

- user goal
- concern
- budget and change constraints
- personalization inputs

### `RoomPreAnalysis`

Produced by:

- `src/lib/preanalysis-worker.ts`
- `src/lib/gemini.ts`
- `src/lib/prompt.ts`
- `src/lib/schema.ts`

Stored as:

- storage artifact `derived/{analysisId}/room-preanalysis.json`

Purpose:

- fast room scan before final goal synthesis
- reduce final report latency

### `SnapshotResult`

Produced by:

- `src/lib/analysis-worker.ts`
- Gemini path or deterministic fallback path

Stored in:

- `analyses.snapshot_result`

Purpose:

- free report payload
- snapshot page payload
- plan generation input foundation

### `PlanStep[]`

Produced by:

- `src/lib/engine.ts`

Stored in:

- `analyses.plan_result`

Purpose:

- paid full report
- generated after payment confirmation or lazily on read if missing

## 3. Backend Interface Map

### `POST /api/upload`

File:

- `src/app/api/upload/route.ts`

Input:

- multipart form data
- `analysisId`
- `file`
- `spaceData`
- compression metadata
- human verification fields

Output:

- `photoPath`

Responsibilities:

- validate file
- rate limit and anti-abuse checks
- upload optimized image to Supabase storage
- trigger async room pre-analysis

### `POST /api/analyze`

File:

- `src/app/api/analyze/route.ts`

Input:

- `analysisId`
- `spaceData`
- `goalData`
- `sessionId`

Output:

- `status: processing`
- redirect path

Responsibilities:

- initialize `analyses` record as processing
- create `analysis_jobs` record
- trigger async analysis worker

### `GET /api/analyze/[id]`

File:

- `src/app/api/analyze/[id]/route.ts`

Purpose:

- polling endpoint for processing status

Returns:

- `processing`
- `completed` with `snapshot`
- `failed` with error

### `POST /api/analysis/access`

File:

- `src/app/api/analysis/access/route.ts`

Purpose:

- claim anonymous snapshot to authenticated user
- unlock saved ownership

### `POST /api/analysis/discard`

File:

- `src/app/api/analysis/discard/route.ts`

Purpose:

- discard anonymous analysis
- delete uploaded photo
- delete pre-analysis artifact

### `GET /api/plan/[id]`

File:

- `src/app/api/plan/[id]/route.ts`

Purpose:

- load paid report

Behavior:

- requires ownership when analysis already belongs to a user
- may auto-claim if signed-in user opens anonymous paid analysis
- returns `402` until payment is completed
- returns `plan_result` or generates plan on read if missing

### `POST /api/checkout`

File:

- `src/app/api/checkout/route.ts`

Purpose:

- create hosted checkout session for a report

### `POST /api/billing/confirm`

File:

- `src/app/api/billing/confirm/route.ts`

Purpose:

- poll payment provider after redirect success
- confirm paid state
- persist `plan_result`

### `POST /api/webhook/creem`

File:

- `src/app/api/webhook/creem/route.ts`

Purpose:

- webhook-based paid fulfillment
- mark analysis paid
- persist `plan_result`

### Authenticated report history endpoints

- `GET /api/account/analyses`
- `GET /api/account/analyses/[id]`

Purpose:

- list saved analyses
- fetch full saved report for account center

## 4. Actual Report Generation Flow

### Phase 1. Intake and local assembly

Main files:

- `src/features/app-ui/v2/upload/storage.ts`
- `src/features/app-ui/v2/upload/UploadStep2Page.tsx`

What happens:

1. UI intake is converted into `SpaceData` and `GoalData`.
2. A stable `analysisId` is created in browser storage.
3. `spaceData` and `goalData` are cached locally for fallback use.

### Phase 2. Upload and pre-analysis

Main files:

- `src/hooks/useUpload.ts`
- `src/app/api/upload/route.ts`
- `src/lib/services/room-photo-service.ts`
- `src/lib/preanalysis-worker.ts`
- `src/lib/gemini.ts`
- `src/lib/prompt.ts`
- `src/lib/schema.ts`

What happens:

1. Frontend uploads file to `POST /api/upload`.
2. Backend validates file, rate limits, anti-bot checks, and upload metadata.
3. Backend stores optimized image in Supabase Storage under `uploads/{uuid}.jpg`.
4. Backend triggers `startRoomPreAnalysis(...)` asynchronously.
5. Pre-analysis downloads the stored image, preprocesses it if needed, and calls Gemini with `getRoomPreAnalysisPrompt(...)`.
6. Structured room facts are stored as `derived/{analysisId}/room-preanalysis.json`.

Result:

- no final report yet
- only a cached room scan artifact exists

### Phase 3. Final snapshot generation

Main files:

- `src/hooks/useAnalyze.ts`
- `src/app/api/analyze/route.ts`
- `src/lib/analysis-worker.ts`
- `src/lib/repositories/analysis-repository.ts`
- `src/lib/repositories/security-repository.ts`

What happens:

1. Frontend sends `analysisId + spaceData + goalData` to `POST /api/analyze`.
2. Backend creates or updates `analyses` row with:
   - `analysis_status = processing`
   - pending placeholder `snapshot_result`
   - `paid = false`
3. Backend creates or updates `analysis_jobs` with `status = processing`.
4. Async `processAnalysisRequest(...)` starts.

Inside `processAnalysisRequest(...)`, the decision order is:

1. Wait briefly for pre-analysis artifact using `waitForRoomPreAnalysis(...)`.
2. If Gemini key exists and pre-analysis exists:
   - use `generateSpaceSnapshotFromPreAnalysis(...)`
   - prompt is text-only synthesis using pre-analysis as visual truth
3. Else if pre-analysis exists and is valid:
   - build snapshot with deterministic `buildSnapshotFromPreAnalysis(...)`
4. Else if Gemini key exists and photo exists:
   - download photo
   - preprocess image
   - call `generateSpaceSnapshot(...)` with image + final prompt
5. Else:
   - use deterministic fallback branch based on `calculateBalanceScore(...)`

After generation:

1. Save final `snapshot_result` to `analyses`
2. Mark `analysis_status = completed`
3. Set `analysis_mode = vision` or `fallback`
4. Mark `analysis_jobs.status = completed`

On failure:

1. `analyses.analysis_status = failed`
2. `analyses.failure_reason = ...`
3. `analysis_jobs.status = failed`

### Phase 4. Snapshot polling and access

Main files:

- `src/features/app-ui/v2/upload/UploadStep3Page.tsx`
- `src/app/api/analyze/[id]/route.ts`
- `src/app/api/analysis/access/route.ts`
- `src/features/analysis/storage.ts`

What happens:

1. Frontend polls `GET /api/analyze/[id]`.
2. When completed, it receives free `snapshot_result`.
3. If `registrationRequired` is true, frontend may later call `POST /api/analysis/access` after sign-in.
4. Snapshot is stored locally for session continuity.

### Phase 5. Paid full report generation

Main files:

- `src/hooks/useCheckout.ts`
- `src/app/api/checkout/route.ts`
- `src/lib/billing/service.ts`
- `src/lib/billing/index.ts`
- `src/lib/billing/providers/creem.ts`
- `src/lib/repositories/billing-repository.ts`
- `src/app/api/billing/confirm/route.ts`
- `src/app/api/webhook/creem/route.ts`
- `src/app/api/plan/[id]/route.ts`

What happens:

1. Frontend calls `POST /api/checkout`.
2. Backend creates Creem checkout session and saves checkout metadata into `analyses`.
3. User pays.
4. Paid fulfillment happens through either:
   - webhook `POST /api/webhook/creem`
   - redirect confirmation `POST /api/billing/confirm`
5. In both cases, backend:
   - loads analysis
   - generates `plan_result` with `generatePlan(...)` if not already present
   - marks `paid = true`
   - writes billing metadata
6. Frontend then loads `GET /api/plan/[id]`.

Important:

- the free snapshot is AI-driven
- the paid `plan_result` is currently deterministic, generated by `generatePlan(...)`
- there is no second AI call for paid plan generation today

## 5. True Source of the "Report"

Today the report is split into two layers:

### Free report

Source of truth:

- `analyses.snapshot_result`

Generation mode:

- Gemini synthesis from pre-analysis
- Gemini full image analysis
- deterministic fallback

### Paid report

Source of truth:

- `analyses.plan_result`

Generation mode:

- deterministic `generatePlan(...)`
- only generated after payment confirmation or on-demand when reading a paid report

This means the "real AI-generated report" is the snapshot layer, not the paid plan layer.

## 6. Storage and Persistence Map

### Supabase table: `analyses`

Main fields used in the pipeline:

- `id`
- `user_id`
- `photo_url`
- `space_data`
- `goal_data`
- `snapshot_result`
- `plan_result`
- `analysis_status`
- `analysis_mode`
- `failure_reason`
- `paid`
- billing columns

### Supabase table: `analysis_jobs`

Purpose:

- async processing state
- per-user and per-IP concurrency control

### Supabase Storage bucket: `room-photos`

Stores:

- uploaded room images in `uploads/`
- pre-analysis JSON artifacts in `derived/{analysisId}/`

### Local browser storage

Main files:

- `src/features/analysis/storage.ts`
- `src/features/app-ui/v2/upload/storage.ts`

Purpose:

- preserve browser-side flow state
- snapshot fallback rendering
- pending access state

## 7. Where the AI Is Actually Called

There are only three actual Gemini invocation paths:

1. `generateRoomPreAnalysis(...)` in `src/lib/gemini.ts`
2. `generateSpaceSnapshotFromPreAnalysis(...)` in `src/lib/gemini.ts`
3. `generateSpaceSnapshot(...)` in `src/lib/gemini.ts`

Call sites:

1. `src/lib/preanalysis-worker.ts`
2. `src/lib/analysis-worker.ts`

Prompt sources:

1. `getRoomPreAnalysisPrompt(...)`
2. `getAnalyzeFromPreAnalysisPrompt(...)`
3. `getAnalyzePrompt(...)`

Schemas:

1. `roomPreAnalysisSchema`
2. `snapshotSchema`

## 8. Current Architectural Constraints

### Constraint 1. Free report and paid report are produced by different engines

- free snapshot: AI or fallback
- paid plan: deterministic rules only

This creates a split personality in report quality and personalization depth.

### Constraint 2. `SpaceData` is overloaded

`SpaceData` mixes:

- true room metadata
- UI-derived heuristics
- photo path transport
- pseudo-fields such as `doorPosition`, `windowPosition`, `colorTone` carrying intake semantics

This makes later optimization harder.

### Constraint 3. Pre-analysis is stored in object storage, not relational data

That keeps analysis decoupled, but makes querying, replaying, and versioning harder.

### Constraint 4. Snapshot and plan are tightly coupled to current frontend contracts

The schema is stable enough for rendering, but not yet cleanly separated into:

- AI output contract
- domain model
- presentation model

## 9. Best Refactor Starting Points

If the goal is to optimize the core engine first, the highest-leverage sequence is:

1. Separate report domain models from UI render models.
2. Normalize `SpaceData`, `GoalData`, and photo metadata into cleaner backend DTOs.
3. Extract a single orchestration layer around:
   - upload
   - pre-analysis
   - final snapshot generation
   - paid plan fulfillment
4. Decide whether paid report should remain deterministic or become AI-assisted.
5. Version prompts and schemas explicitly.
6. Move pre-analysis artifact metadata into a queryable persistence layer if replay and audit matter.

## 10. Short Operational Summary

Current truth:

- Upload triggers room pre-analysis.
- Analyze triggers final snapshot generation.
- Snapshot generation is the real AI core.
- Paid plan generation is still deterministic.
- Final user-visible report is assembled from:
  - `snapshot_result`
  - `plan_result`
  - account ownership and billing state
