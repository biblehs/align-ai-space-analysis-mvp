# BACKEND ARCHITECTURE PRD

## Purpose

This document defines ALIGN's backend boundaries, API structure, storage strategy, async job model, and implementation principles.

## Platform stack

- Next.js route handlers for app APIs
- Supabase Auth for identity
- Supabase Postgres for application data
- Supabase Storage for room photos and derived artifacts
- Gemini for AI generation
- Creem for billing

## Backend principles

- Route handlers stay thin.
- Repositories own data persistence.
- Services own external integration or cross-repository orchestration.
- Long-running analysis work should be asynchronous.
- Non-critical logging and analytics should not block the main response path.

## Main domains

### Auth domain

Responsibilities:

- resolve request user from Supabase auth context
- support email link, email/password, and provider login
- sync auth user into `profiles`

### Upload domain

Responsibilities:

- validate upload metadata
- apply rate limits and anonymous usage rules
- verify risk-triggered human checks
- store optimized room photo
- trigger room pre-analysis

### Analysis domain

Responsibilities:

- initialize analysis state
- create processing jobs
- synthesize final snapshot from room pre-analysis and goal data
- save completed snapshot
- mark failures

### Billing domain

Responsibilities:

- create checkout sessions
- verify payment webhooks
- update paid entitlement state

### Admin metrics domain

Responsibilities:

- aggregate profile, session, event, and performance data
- restrict access to internal operators only

## Preferred route structure

### Public app APIs

- `POST /api/upload`
- `POST /api/analyze`
- `GET /api/analyze/[id]`
- `GET /api/plan/[id]`
- `POST /api/checkout`

### Account APIs

- `GET /api/account/analyses`
- `POST /api/account/profile`
- `POST /api/account/sync`

### Data and analytics APIs

- `POST /api/analytics/event`
- `GET /api/admin/metrics`

## Current async analysis model

### Step 1

Scene-and-intention step:

- captures the selected space scene
- captures the primary intention or support goal
- persists this light contextual state client-side or in a pending analysis draft

### Step 2

Upload and refinement route:

- validates input
- uploads room photo
- captures the selected primary issue
- captures optional note, budget, and change-tolerance inputs
- schedules room pre-analysis in the background

### Step 3

Analyze route plus report shell:

- saves a pending analysis record
- marks analysis job as processing
- responds with `202`
- schedules the worker in `after()`
- redirects the user into the report step

### Step 4

Worker:

- waits briefly for room pre-analysis
- prefers fast synthesis from pre-analysis
- falls back only when needed
- updates analysis state and job state

## Repositories

### Current repository responsibilities

- `analysis-repository`: analysis records, status, claiming, history
- `profile-repository`: user profile persistence
- `session-repository`: user session persistence
- `analytics-repository`: analytics events
- `security-repository`: rate limits, security events, analysis jobs, anonymous usage
- `metrics-repository`: admin dashboard aggregates

## Storage strategy

### Room photos

- bucket: `room-photos`
- primary path: `uploads/<uuid>.jpg`

### Derived AI artifacts

- keep room pre-analysis as sidecar artifact under `derived/<analysisId>/...`
- delete sidecar artifacts when anonymous disposable analyses are discarded

## Image handling rules

- compress client-side whenever possible
- skip repeated server optimization when a trusted optimized JPEG already exists
- maintain an AI-ready version instead of repeatedly transforming the same photo

## Recommended future upload architecture

To further reduce upload time, move toward:

1. `POST /api/upload/init`
2. browser direct upload to Supabase Storage
3. `POST /api/upload/complete`

This keeps:

- rate limiting
- turnstile
- anonymous usage rules
- analytics
- pre-analysis trigger

while removing the large binary hop through Next.js.

## API design rules

- Every API should return `success`, plus either `data` or `error`.
- Long-running operations should return `processing` state and a polling path.
- Access errors should use correct auth status codes.
- Route handlers should avoid deeply nested business logic.

## Failure handling

- Save failure reasons to `analyses.failure_reason`.
- Keep job state synchronized with analysis state.
- Use background logging for non-blocking diagnostics.
- Prefer graceful degraded output over hard blank failure.

## Performance rules

- avoid duplicate image downloads
- avoid duplicate image preprocessing
- avoid blocking the main path with analytics writes
- prefer staged AI over repeated full visual passes
- instrument latency in analytics events
