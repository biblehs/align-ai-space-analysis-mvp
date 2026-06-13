# FRONTEND SYSTEM PRD

## Purpose

This document defines ALIGN's active frontend architecture after the v2 cutover. Old route groups, prototype routes, and pre-v2 marketing primitives were archived to `backup/archive-v2-cutover-20260330/`.

## Route groups

### `(public)/(standalone)`

Owns:

- `/`
- `/auth`
- `/auth/callback`

Rules:

- landing and auth should share the v2 visual language
- standalone public routes should not depend on member-only flow state

### `(public)/(marketing)`

Owns:

- `/about`
- `/privacy`
- `/terms`
- `/blog`

Rules:

- these routes must render inside the shared v2 public shell
- page-specific content should stay separate from shell chrome

### `(member)/(immersive)`

Owns:

- `/app/upload`
- `/app/upload/step-2`
- `/app/upload/step-3`

Rules:

- this is the source of truth for the active upload journey
- immersive upload chrome belongs to `src/features/app-ui/v2/shared/*`

### `(member)/(flow)`

Owns:

- `/app/personalize`
- `/app/processing`
- `/app/snapshot`
- `/app/plan`
- `/app/checkout/success`

Rules:

- post-upload member flow continues here
- routes may consume stored analysis state and report data

### `(member)/(standalone)`

Owns:

- `/account`
- `/account/billing`
- `/account/reports/[id]`

Rules:

- account and saved-report surfaces should stay separate from upload-route composition
- billing and saved report actions may reuse shared account/report primitives

### `(internal)`

Owns:

- `/admin`
- `/admin/metrics`

Rules:

- internal routes stay isolated from public and member route groups
- operator tooling should not leak product-only chrome assumptions

## Feature ownership

### `src/features/marketing/v2`

- production landing page
- public v2 shell
- public content-page shell

### `src/features/marketing/about`

- about-page composition and copy mapping

### `src/features/marketing/legal`

- privacy and terms composition
- legal helper sections and draft notices

### `src/features/auth`

- auth page
- callback page
- account center
- billing page
- saved report surfaces

### `src/features/app-ui/v2`

- upload step 1
- upload step 2
- upload step 3
- v2 shared member chrome

### `src/features/analysis/snapshot`

- free snapshot sections
- registration prompts

### `src/features/analysis/plan`

- full report sections
- export and upgrade surfaces

### `src/features/analysis/reporting`

- shared report loading and error helpers

## Frontend state rules

### Browser persistence

`src/features/analysis/storage.ts` is the only place that should know browser storage keys for:

- upload data
- goal data
- snapshot access state
- pending registration access

### API hooks

Hooks in `src/hooks` are the preferred request layer.

Examples:

- `useUpload`
- `useAnalyze`
- `usePlan`
- `useCheckout`
- `useBillingPortal`

Page components should not introduce new raw fetch flows unless there is a clear reason and the logic cannot be shared.

## Screen-state rules

Every major route should define:

- loading state
- validation error state
- server error state
- unauthorized state where relevant
- success state

Processing-heavy flows should prefer:

- a dedicated processing page
- clear status language
- explicit redirect behavior to final content

## Navigation rules

- public links should resolve to root-domain routes
- member links should resolve to app-domain routes
- cross-domain URLs should stay centralized in shared navigation helpers

## UI integration rules

- large pages should remain section-composed instead of becoming giant route components
- route files should stay thin wrappers around feature containers whenever practical
- shared shells should live in feature-specific v2 folders or shared component folders, not in ad hoc route files

## Frontend/API contract rules

- frontend should not depend on direct database shape when a route contract exists
- route responses should stay normalized
- persistence belongs in `src/lib/repositories/*`
- route handlers should orchestrate instead of absorbing entire business domains

## Future work guidelines

- if a route grows beyond comfortable comprehension, split state transitions into a hook or local controller helper
- if a member/report primitive is reused across multiple surfaces, promote it into the active shared shell layer
- all new public design work should extend `src/features/marketing/v2/*`
- all new upload-flow work should extend `src/features/app-ui/v2/*`
