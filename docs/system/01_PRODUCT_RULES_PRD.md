# PRODUCT RULES PRD

## Purpose

This document defines ALIGN's business rules and user-state behavior. It is the source of truth for product logic before implementation details.

## Core product promise

ALIGN helps users upload room photos, define a wellness or performance goal, and receive:

- a free snapshot report
- an optional paid full report
- optional ongoing account-linked history when the user registers

## Primary user states

### Anonymous user

- Can visit marketing pages.
- Can start analysis.
- Can upload a room photo.
- Can receive a free snapshot.
- Can complete checkout and unlock a full report.
- Can close registration prompts and continue without creating an account.
- If they do not register, their results are considered non-persistent session-level access only.

### Registered but unpaid user

- Can sign in with email magic link, email/password, or enabled OAuth providers.
- Can receive free snapshot reports.
- Can save analysis history to account when results are claimed or generated while signed in.
- Cannot access full paid report until payment is completed.

### Registered and paid user

- Can access full report content for paid analyses.
- Can return through account history.
- Can use account area for profile, billing, and saved reports.

### Internal admin user

- Has access to `/admin/metrics`.
- Access is restricted by explicit internal-email allowlisting.

## Flow rules

### Start analysis

User-facing flow is always:

1. Choose Your Space
2. Upload and Refine
3. Get Your Report

`Snapshot` and `Full Report` are both part of step 3, not separate user-perceived steps.

### Upload rules

- Upload requires a valid supported image type.
- Anonymous users are subject to rate limits and progressive human verification.
- Turnstile should be risk-triggered, not permanently shown by default.
- Step 1 should persist selected scene and intention before image upload begins.
- Step 2 upload success should persist `analysisId`, uploaded photo metadata, and step-level context for the report step.

### Registration prompt rules

When an anonymous user reaches snapshot or full report:

- Show the report content first.
- Show a centered registration prompt as a non-blocking layer.
- Allow closing the prompt.
- Warn that not registering means the result may not be retained and future benefits are unavailable.

### Anonymous result persistence

If an anonymous user closes the registration prompt:

- current page access may remain available in-session
- browser persistence should be cleared
- anonymous result is treated as disposable
- uploaded photo and related temporary artifacts may be cleaned up

### Claim rules

If an anonymous user signs in after generating a result:

- the current analysis should be claimable by the new account
- registration flags should be cleared
- account history should reflect the claimed result

### Payment rules

Anonymous users may:

- unlock the full report
- see the unlocked full report after successful checkout

But without registration:

- the result is not treated as long-term saved account content
- lifecycle messaging should continue encouraging registration

### Back navigation rules

Once snapshot or full report is shown:

- user should not navigate back to the previous step through the product header
- top-left action should be `Back to Account`
- anonymous users clicking it should be routed to sign-in
- signed-in users should be routed to `/account`

## Product safeguards

- Free report should never require registration before display.
- Registration prompt should never cover the entire app without a dismiss path.
- Payment completion should never require account creation to view the just-purchased report.
- Admin pages should never be publicly readable.

## Entitlement rules

### Snapshot

- Free
- available to all valid users after successful analysis
- limited depth
- should reflect the selected scene, selected intention, uploaded room photo, and the user's primary issue

### Full report

- paid entitlement
- accessible only after successful payment confirmation
- includes richer sections and recommendation depth

## Account rules

Account center should support:

- profile editing
- marketing opt-in
- password setup after email-link signup
- report history
- billing portal access when billing is enabled

## Error-state rules

- Upload errors should explain the real cause whenever possible.
- Invalid credentials should appear near the sign-in form fields, not at the page bottom.
- Processing errors should move users to a clear report-error state, not a blank screen.

## Decisions that must stay aligned with this document

- access gating logic
- checkout and claim behavior
- report retention behavior
- account navigation behavior
- prompt copy around registration and payment
