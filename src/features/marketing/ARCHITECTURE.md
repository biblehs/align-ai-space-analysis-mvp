# Marketing UI Architecture

This folder now describes the active public-facing v2 site. The old homepage section system and legacy marketing primitives were archived to `backup/archive-v2-cutover-20260330/`.

## Theme layer

- `src/app/globals.css`
- Global tokens, typography variables, shell spacing, and shared utilities.

## Shared public shell

- `src/features/marketing/v2/PublicSiteShell.tsx`
- Shared v2 header, footer, and cookie banner wrapper for public content pages.
- `src/features/marketing/v2/PublicContentPageShell.tsx`
- Shared editorial content frame used by about, privacy, terms, and blog.
- `src/features/marketing/v2/landing-v2/*`
- Production landing page composition and styles for `/`.

## Content layer

- `src/features/marketing/site-content.ts`
- Source of truth for brand copy, footer groups, and reusable public-page content.

## Page composition layer

- `src/features/marketing/about/*`
- About page composition inside the v2 public content shell.
- `src/features/marketing/legal/*`
- Terms and privacy composition inside the v2 public content shell.
- `src/app/(public)/(marketing)/*`
- Thin route wrappers for public editorial pages.

## Editing guide

- To change public navigation or footer content:
  - Start in `src/features/marketing/site-content.ts`
- To change the landing page:
  - Start in `src/features/marketing/v2/landing-v2/*`
- To change about, privacy, terms, or blog shell behavior:
  - Start in `src/features/marketing/v2/PublicSiteShell.tsx` and `src/features/marketing/v2/PublicContentPageShell.tsx`
