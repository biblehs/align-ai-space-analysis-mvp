# OPERATIONS AND SECURITY PRD

## Purpose

This document defines ALIGN's runtime operations, deployment rules, access controls, secrets handling, and environment expectations.

## Runtime environments

- local development
- Vercel preview
- Vercel production
- Supabase project environment

## Core environment variables

### Supabase

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### AI

- `GEMINI_API_KEY`

### Billing

- `CREEM_API_KEY`
- `CREEM_WEBHOOK_SECRET`
- product IDs

### Security

- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`
- `SECURITY_IP_HASH_SALT`
- `SECURITY_ALERT_WEBHOOK_URL`

### Routing

- `NEXT_PUBLIC_BASE_URL`
- `NEXT_PUBLIC_APP_URL`

## Secrets rules

- `service_role` keys must remain server-only
- browser code may only use anon keys
- production secrets should live in Vercel and Supabase secure settings, not committed files

## Auth operations

- provider settings must be mirrored between local and production callback URLs
- internal admin access must be explicitly allowlisted
- password policies should be stronger in production than test setups

## Storage rules

- room-photo bucket should not be broadly writable from the public browser
- write paths should remain controlled through service logic or signed upload flows
- derived AI artifacts should be cleaned when anonymous disposable analyses are discarded

## Human verification rules

- Turnstile should be triggered by risk, not shown to every user by default
- suspicious upload bursts should be logged and optionally alerted
- rate limiting should exist at IP, session, and user scopes where appropriate

## Deployment rules

- build must pass before deploy
- app and root-domain routing must remain aligned with middleware rules
- production callback URLs must match actual deployed origin

## Monitoring rules

Monitor:

- auth failures
- upload failures
- analysis failures
- payment failures
- fallback rate spikes
- suspicious anonymous upload behavior

## Admin access rules

- admin dashboard access should be limited to internal accounts
- route UI access alone is not sufficient; API access must also be restricted

## Incident response checklist

1. identify whether issue is auth, upload, AI, billing, or storage
2. confirm environment variables
3. confirm Supabase health
4. inspect analytics and security events
5. inspect latest deploy and decision log

## Future operational improvements

- signed direct upload architecture
- queue-backed workers for analysis
- explicit alerts for fallback spikes
- structured runbooks per subsystem
