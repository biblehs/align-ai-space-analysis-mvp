# DATA ANALYTICS PRD

## Purpose

This document defines ALIGN's data model for user analytics, product metrics, attribution, retention, and operational reporting.

## Data system goals

- understand user acquisition and conversion
- understand where time is lost in the product flow
- measure AI performance and fallback rate
- support commercialization decisions
- support admin dashboards without raw SQL for every question

## Core data entities

### Profiles

Long-lived user attributes:

- email
- provider
- full name
- marketing opt-in
- preferred language
- timezone
- city
- onboarding goal
- budget preference
- style preference default
- signup source and campaign
- last active timestamp
- first paid timestamp

### User sessions

Per-session context:

- session id
- ip hash
- user agent
- browser
- OS
- device type
- locale
- timezone
- referrer
- landing path
- UTM fields

### Analytics events

Event-level product telemetry:

- event name
- user id
- session id
- analysis id
- page path
- event source
- properties
- created at

### Analyses

Analysis lifecycle and entitlement data:

- status
- mode
- fallback used
- failure reason
- paid state
- paid timestamp
- goal and room payloads
- snapshot and plan outputs

## Event taxonomy

### Auth

- `auth_started`
- `auth_completed`
- `auth_failed`

### Profile

- `profile_synced`
- `account_updated`

### Upload

- `upload_started`
- `upload_completed`
- `upload_failed`

### Pre-analysis

- `preanalysis_started`
- `preanalysis_completed`
- `preanalysis_failed`

### Analysis

- `analysis_requested`
- `analysis_succeeded`
- `analysis_failed`
- `analysis_processing_completed`

### Billing and report access

- `checkout_started`
- `checkout_completed`
- `plan_viewed`

## Performance metrics

Track and visualize:

- average upload latency
- average pre-analysis duration
- average analysis worker duration
- p95 analysis duration
- average processing-page wait
- fallback rate
- pre-analysis hit rate

## Funnel definitions

### Acquisition to report funnel

1. marketing visit
2. auth started or start analysis
3. upload started
4. upload completed
5. analysis requested
6. analysis succeeded
7. checkout started
8. checkout completed
9. plan viewed

### Account-linked value funnel

1. anonymous snapshot
2. registration prompt shown
3. registration completed
4. profile synced
5. report claimed or saved
6. paid report access

## Query rules

- dashboards should read from repository-level aggregates when possible
- operational SQL should use explicit time windows
- business metrics should define last-7-day and all-time variants separately

## Attribution rules

Store and preserve:

- `utm_source`
- `utm_medium`
- `utm_campaign`
- landing path
- referrer

These should flow into profile/session history where possible.

## Privacy rules

- do not store raw IP when hash is sufficient
- keep sensitive personal context isolated from normal profile fields
- avoid collecting high-sensitivity attributes without clear product need and clear notice

## Dashboard ownership

The admin dashboard should show at least:

- user count
- auth success
- analysis success
- checkout completion
- funnel counts
- login-provider mix
- onboarding goal distribution
- performance latency cards

## Future expansion

Later layers may include:

- cohort retention
- experiment assignment tables
- subscription lifecycle reporting
- LTV and CAC views
- content / prompt version comparisons
