# V2 Codebase Rules

This file defines how to keep the active ALIGN repository easy to maintain after the v2 cutover.

## Active code only

All new product work should stay inside the active code tree:

- `src/app/(public)/*`
- `src/app/(member)/*`
- `src/app/(internal)/*`
- `src/features/marketing/v2/*`
- `src/features/app-ui/v2/*`
- the current shared `src/features/auth/*`, `src/features/analysis/*`, `src/hooks/*`, and `src/lib/*` layers used by those routes

## Archived code stays archived

Historical code, prototypes, and pre-v2 route shells live in:

- `backup/archive-v2-cutover-20260330/`

Do not move archived files back into `src/` unless you are intentionally restoring historical behavior and have decided to make it active again.

## Route-group policy

The only active route groups are:

- `(public)`
- `(member)`
- `(internal)`

Do not reintroduce:

- `src/app/new-ui`
- `src/app/(member)/(legacy-flow)`
- old empty shell groups such as `(app-shell)`, `(auth-shell)`, `(report-shell)`, `(marketing)`, `(account-shell)`

## UI ownership

- Public shell and landing work belongs in `src/features/marketing/v2/*`
- Upload flow and member chrome belong in `src/features/app-ui/v2/*`
- Account, auth, billing, and saved report pages belong in `src/features/auth/*`
- Shared snapshot and plan report composition belongs in `src/features/analysis/*`

## Before shipping structural changes

Run:

```bash
npm run check:structure
npm run lint
npm run typecheck
npm run build
```

Or run the full guard:

```bash
npm run verify
```

## Documentation source of truth

The current architecture docs are:

- `README.md`
- `docs/frontend-architecture.md`
- `docs/system/README.md`
- `docs/system/05_FRONTEND_SYSTEM_PRD.md`

If the active route structure changes, update those files in the same change.
