# ALIGN Codebase Boundaries

This document defines the active project surface so future changes stay narrow,
observable, and easy to deploy.

## Active Runtime Surface

### Routes

- `src/app/(public)` owns public marketing, legal, auth-facing standalone pages, and root-domain routing.
- `src/app/(member)` owns authenticated app surfaces: upload, processing, snapshot, plan, checkout success, and account.
- `src/app/(internal)` owns operator-only admin pages.
- `src/app/api` owns thin route handlers only. Route handlers should validate requests, call service/repository helpers, and return typed JSON.

### Frontend Modules

- `src/features/marketing/v2` is the active public landing system.
- `src/features/app-ui/v2` is the active member upload and processing UI.
- `src/features/analysis` owns snapshot, plan, export, and browser-side analysis storage helpers.
- `src/features/auth` owns auth, callback, and account presentation.
- `src/components` is reserved for shared primitives used by more than one feature area.

### Backend Modules

- `src/lib/repositories` is the Supabase persistence boundary.
- `src/lib/services` is for service-specific IO helpers such as room photo storage.
- `src/lib/billing` owns paid unlocks, checkout confirmation, and portal access.
- `src/lib/analysis-worker.ts` owns snapshot orchestration.
- `src/lib/preanalysis-worker.ts` owns photo preanalysis and vision extraction.
- `src/lib/gemini.ts` is the model API boundary.
- `src/lib/align-v2` owns deterministic v2 snapshot contracts, adapters, and builders.

## Analysis Pipeline Contract

The snapshot flow is staged:

1. `/api/upload` stores the image and may prewarm room preanalysis.
2. `/api/analyze` creates or updates the analysis record and queues snapshot processing.
3. `preanalysis-worker` performs one vision call per `analysisId` using single-flight/claim guards.
4. `analysis-worker` waits for preanalysis, builds deterministic artifacts, saves the snapshot, and emits timing events.
5. `/api/analyze/[id]` is primarily a read endpoint; it only schedules resume work for pending, retrying, missing, or stale jobs.
6. `/admin/metrics` aggregates analytics timing events for pipeline visibility.

The first visible snapshot must not depend on optional copy-polish model calls. The snapshot writer layer is opt-in via `ENABLE_SNAPSHOT_WRITER_LAYER=true`.

## Archive Policy

- Active runtime code stays in `src`, `public`, `supabase/migrations`, `scripts`, and top-level config files.
- Experimental handoffs, screenshots, older backups, and generated export bundles belong under `backup/`.
- Root-level scratch folders such as `.tmp-screens`, `exports`, and `backups` should not be recreated.
- `backup`, `backups`, `exports`, and `.tmp-screens` are excluded from Vercel preview deployment.
- Full rollback snapshots should be stored outside the repo, for example `../align-web-mvp-local-backups`.

## Deployment Gate

Before a preview deployment:

1. Create or confirm a local rollback backup.
2. Run `npm run typecheck`.
3. Run `npm run lint`.
4. Run `npm run build`.
5. Deploy preview with `vercel deploy . -y`.

