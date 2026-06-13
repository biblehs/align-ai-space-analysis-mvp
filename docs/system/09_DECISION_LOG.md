# DECISION LOG

## Purpose

This file captures major architectural and product decisions so future changes can understand why the system looks the way it does.

## 2026-03-16 to 2026-03-18

### Route-group split between marketing and app shell

Decision:

- keep marketing routes isolated from auth and product flows

Reason:

- marketing edits should not destabilize app logic
- subdomain deployment becomes cleaner

### Anonymous users can view snapshot before registering

Decision:

- snapshot is shown first
- registration prompt is non-blocking

Reason:

- value must be visible before gating
- supports better conversion and lower friction

### Anonymous users can pay for full report without registering

Decision:

- payment is allowed without forced signup
- retention and account-linked benefits still require registration

Reason:

- removes unnecessary revenue friction
- preserves a path to later account claiming

### Snapshot and plan are a single perceived report step

Decision:

- user-facing flow is 3 steps, not 4

Reason:

- snapshot and full report are entitlement layers of the same report
- reduces mental friction

### Turnstile changed from always-on to risk-triggered

Decision:

- only show human verification when upload behavior looks suspicious

Reason:

- default friction at step 1 was harming conversion

### Analysis changed from synchronous to asynchronous processing

Decision:

- `POST /api/analyze` returns processing state and redirects to a processing page

Reason:

- prevents users from waiting on a single blocking request
- improves perceived speed and resilience

### Performance instrumentation added to admin metrics

Decision:

- dashboard now tracks upload, processing, and wait timings

Reason:

- performance work should be data-led, not guesswork

### Room pre-analysis starts during upload

Decision:

- step 1 upload now triggers background room pre-analysis
- step 2 uses that pre-analysis to speed final snapshot generation

Reason:

- reduce the final wait after the user completes personalization
- avoid repeated heavy image reasoning when the room image has already been understood

## 2026-03-28

### Upload flow reordered for the new UI prototype

Decision:

- step 1 now captures scene selection and primary intention
- step 2 now captures room photos, primary issue, optional note, budget, and change controls
- step 3 now represents the report surface and preview of the fuller plan

Reason:

- users can establish intent before they are asked to upload
- the second step becomes the clear bridge between image input and contextual refinement
- the report step better reflects the product rule that snapshot and full plan belong to one perceived report flow

## Update rule

Whenever one of these changes:

- user access rules
- payment rules
- report lifecycle
- AI pipeline strategy
- major routing or storage strategy

add a new short decision entry here before or alongside the code rollout.
