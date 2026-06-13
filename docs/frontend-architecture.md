# Frontend Architecture

## Route group responsibilities
- `(public)/(standalone)` hosts the production v2 landing page at `/` plus the auth flow at `/auth` and `/auth/callback`.
- `(public)/(marketing)` hosts the public editorial pages: `/about`, `/privacy`, `/terms`, and `/blog`, all wrapped by the shared v2 public shell.
- `(member)/(immersive)` owns the active upload flow UI for `/app/upload`, `/app/upload/step-2`, and `/app/upload/step-3`.
- `(member)/(flow)` owns the rest of the active member journey: `/app/personalize`, `/app/processing`, `/app/snapshot`, `/app/plan`, and `/app/checkout/success`.
- `(member)/(standalone)` owns `/account`, `/account/billing`, and `/account/reports/[id]`.
- `(internal)` owns the operator-facing admin area, currently `/admin` and `/admin/metrics`.

## Feature modules
- `src/features/marketing/v2/*` contains the shared public v2 shell and landing page composition.
- `src/features/marketing/about/*` and `src/features/marketing/legal/*` own public content composition on top of the v2 shell.
- `src/features/auth/*` owns sign-in, callback, account center, billing, and saved report containers.
- `src/features/app-ui/v2/*` owns the current upload-flow UI and member chrome.
- `src/features/analysis/*` owns shared snapshot, plan, reporting, and browser persistence logic.

## Libraries and helpers
- `src/hooks/*` is the preferred frontend request layer for upload, analyze, checkout, billing portal, and plan fetches.
- `src/lib/*` holds Supabase, billing, AI, security, analytics, storage, and routing helpers.
- `src/lib/routing.ts` plus `middleware.ts` steer traffic between the root and app domains.

## APIs
- `src/app/api/*` contains Next.js route handlers for account, upload, analysis, checkout, billing, analytics, health, admin metrics, and webhooks.
- Keep route handlers focused on request validation and orchestration; push persistence into `src/lib/repositories/*` and heavier logic into `src/lib/*`.

## Archive policy
- Old route groups, prototype routes, and pre-v2 marketing/source files were archived to `backup/archive-v2-cutover-20260330/`.
- New work should be added only to the active route groups and v2 feature folders listed above.
