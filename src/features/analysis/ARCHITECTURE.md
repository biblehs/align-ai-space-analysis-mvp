# Analysis UI Architecture

This folder now supports the active v2 analysis product only. Legacy step-page scaffolds and the old progress bar were archived to `backup/archive-v2-cutover-20260330/`.

## Active route ownership

- `src/app/(member)/(immersive)/app/upload/*`
- Owns the v2 upload flow entry and the immersive step chrome.
- `src/app/(member)/(flow)/app/*`
- Owns the post-upload member flow: personalize, processing, snapshot, plan, and checkout success.

## Shared UI

- `src/features/app-ui/v2/shared/*`
- Shared v2 shell, immersive headers, and member chrome.
- `src/components/app-shell/*`
- Shared report, account, and utility primitives still used by plan, billing, and saved-report surfaces.

## Feature composition

- `src/features/app-ui/v2/upload/*`
- Source of truth for step 1, step 2, and step 3 UI plus client-side flow storage.
- `src/features/analysis/snapshot/*`
- Shared snapshot report sections and registration prompt components.
- `src/features/analysis/plan/*`
- Shared plan report sections, export cards, and plan composition.

## Business logic

- `src/hooks/*`
- Frontend request wrappers for upload, analyze, checkout, billing portal, and plan fetches.
- `src/features/analysis/storage.ts`
- Browser persistence for the active analysis flow.
- `src/lib/*`
- Server helpers, repositories, billing, AI generation, storage, and security boundaries.

## Editing guide

- To change upload, processing, or snapshot flow UI:
  - Start in `src/features/app-ui/v2/upload/*`
- To change plan report composition:
  - Start in `src/features/analysis/plan/*`
- To change snapshot report composition:
  - Start in `src/features/analysis/snapshot/*`
- To change request behavior or server coordination:
  - Start in `src/hooks/*` and `src/lib/*`
