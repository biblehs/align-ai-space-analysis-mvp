# App V2 Design Guide

This folder is reserved for application-side UI v2 work that should stay separate from marketing and landing page experiments.

## Scope

- Upload and intake flows
- Auth and account surfaces
- Report and post-analysis application views
- Shared app-shell visual primitives for v2

## Intended structure

- `src/features/app-ui/v2/upload/`
- `src/features/app-ui/v2/auth/`
- `src/features/app-ui/v2/account/`
- `src/features/app-ui/v2/shared/`

## Notes

- Keep application v2 work aligned with the public v2 shell in `src/features/marketing/v2/`
- Prefer copying existing production app surfaces into this folder before redesigning them
- Route wiring and subdomain rollout can happen later; this folder is for local management first
