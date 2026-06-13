# ALIGN System Docs

This folder is the current reusable documentation set for ALIGN.

It is organized by decision layer instead of by page or feature so the same rules can support:

- product decisions
- AI prompt and model design
- backend and API implementation
- frontend structure and state flow
- design language and UI patterns
- analytics, attribution, and commercial reporting
- operations, security, and environment setup

Use these files as the current source of truth:

1. [01_PRODUCT_RULES_PRD.md](../../docs/system/01_PRODUCT_RULES_PRD.md)
2. [02_AI_SYSTEM_PRD.md](../../docs/system/02_AI_SYSTEM_PRD.md)
3. [03_SCENE_COMMERCE_ENGINE_PRD.md](../../docs/system/03_SCENE_COMMERCE_ENGINE_PRD.md)
4. [04_BACKEND_ARCHITECTURE_PRD.md](../../docs/system/04_BACKEND_ARCHITECTURE_PRD.md)
5. [05_FRONTEND_SYSTEM_PRD.md](../../docs/system/05_FRONTEND_SYSTEM_PRD.md)
6. [06_DESIGN_SYSTEM_PRD.md](../../docs/system/06_DESIGN_SYSTEM_PRD.md)
7. [07_DATA_ANALYTICS_PRD.md](../../docs/system/07_DATA_ANALYTICS_PRD.md)
8. [08_OPERATIONS_SECURITY_PRD.md](../../docs/system/08_OPERATIONS_SECURITY_PRD.md)
9. [09_DECISION_LOG.md](../../docs/system/09_DECISION_LOG.md)

Legacy or backup docs have been moved to `backup/archive-v2-cutover-20260330/` where possible; new decisions should be documented in `docs/system/`.

## Ownership model

- Product owner: `01_PRODUCT_RULES_PRD`
- AI / prompt owner: `02_AI_SYSTEM_PRD`
- Scene-commerce strategy owner: `03_SCENE_COMMERCE_ENGINE_PRD`
- Full-stack implementation owner: `04_BACKEND_ARCHITECTURE_PRD` and `05_FRONTEND_SYSTEM_PRD`
- Design owner: `06_DESIGN_SYSTEM_PRD`
- Growth / analytics owner: `07_DATA_ANALYTICS_PRD`
- Platform / release owner: `08_OPERATIONS_SECURITY_PRD`
- Architecture changes and rationale: `09_DECISION_LOG`

## Recommended update order

When a major feature changes, update docs in this order:

1. Product rules
2. AI system
3. Scene-commerce engine
4. Backend and frontend architecture
5. Design system
6. Data and analytics
7. Operations and security
8. Decision log

## Current product scope

These documents assume the current ALIGN scope:

- marketing site on the root domain
- auth and product flow on `app.`
- AI-assisted room analysis with upload -> personalize -> processing -> snapshot -> full report
- Supabase for auth, storage, database, and analytics persistence
- internal admin metrics dashboard backed by Supabase
