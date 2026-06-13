# Landing V2 Design Guide

This document defines the visual system and interaction logic for the production landing experience used by ALIGN v2.

It exists so future refinements stay coherent instead of drifting section by section.

## Scope

- Route: `/`
- Primary implementation:
  - `src/features/marketing/v2/landing-v2/LandingV2Page.tsx`
  - `src/features/marketing/v2/landing-v2/landing-v2.module.css`
- Backup snapshot:
  - `backup/archive-v2-cutover-20260330/src/features/marketing/new-ui/v2/backup-20260320/`

## Core Design Direction

Landing v2 should feel:

- soft, breathable, and editorial
- intelligent without looking technical or dashboard-heavy
- calming and optimistic rather than mystical or clinical
- premium through restraint, not through decoration overload

This is not a SaaS marketing page in disguise.
It should feel like a wellness editorial experience that happens to convert.

## Visual DNA

The page is built on five visual ideas:

1. Cream canvas
   A warm, low-contrast foundation that reduces visual stress and makes accent colors feel gentle.

2. Organic signal colors
   Peach, green, and yellow act like environmental markers rather than brand noise.

3. Large editorial typography
   Headlines carry emotion and hierarchy; body copy stays soft and readable.

4. Diagram-led storytelling
   The product is explained through spatial visuals, annotations, flows, and layered information, not generic feature cards.

5. Light surfaces, not stacked cards
   Use rows, sheets, dividers, halos, image stages, and open spacing before reaching for boxed cards.

## Color System

Base tokens currently used in landing v2:

- `--bg-cream: #fdf9ec`
- `--text-main: #2d2a26`
- `--text-muted: #8e8a84`
- `--accent-peach: #e88b7b`
- `--accent-green: #a3c671`
- `--accent-yellow: #f4cc53`
- `--btn-black: #111111`
- `--line-color: #d6d2c4`

### Color roles

- Cream:
  Primary page background and soft section field.

- Main text:
  Strong headings, key labels, primary CTA contrast.

- Muted text:
  Explanations, captions, section eyebrows, low-priority metadata.

- Peach:
  Warmth, sleep, softness, recovery, human touch.

- Green:
  focus, restoration, growth, airflow, practical wellness.

- Yellow:
  clarity, light, signal, premium emphasis, optimism.

### Color rules

- Never introduce cold blues, neon purples, or hard black-and-white contrast.
- Accents should feel diffused, atmospheric, or illustrative.
- Neutrals should dominate. Accents should guide.
- Use gradients and blurs as environmental glow, not as flashy decoration.

## Typography

### Font direction

- Primary display/body family: `Outfit`
- Tone: rounded, contemporary, warm, approachable

### Type behavior

- Headings should be large, compressed, and emotionally clear.
- Supporting copy should stay airy and low-pressure.
- Eyebrows should be uppercase but quiet, not loud.

### Hierarchy

- H1:
  emotional thesis, oversized, strong color moments allowed

- H2:
  editorial section anchors

- H3:
  subheads inside flows, pricing, testimonials, feature lines

- Body:
  calm, readable, never too dense, usually `0.95rem` to `1.125rem`

## Layout Principles

### Overall rhythm

- Alternate between full-height moments and lighter editorial sections.
- Use long horizontal lines, asymmetrical grids, and open negative space.
- Let sections breathe more than standard startup pages.

### Preferred structures

- split hero
- annotated diagram
- large score canvas
- staggered showcase cards
- editorial rows
- pricing sheet
- quote rows
- expanding FAQ lines

### Avoid

- repetitive 3-card feature grids
- nested cards inside cards
- too many bordered boxes
- over-centering every section
- identical section padding everywhere

## UI Surface Rules

### Surface types

- Canvas:
  full-page cream base

- Soft section:
  slightly tinted field, often no hard border

- Sheet:
  a single unified panel for dense content like pricing

- Media stage:
  clipped image container with large radius and subtle shadow

- Line group:
  rows separated by thin dividers instead of boxes

### Radius language

- Large radius is part of the visual voice.
- Use generous rounding for media, pricing sheets, CTA panels, and share cards.
- Avoid sharp corners unless used for a deliberate contrast detail.

## Motion Principles

Motion should feel like drift, reveal, and settling.

### Approved motion types

- floating decorative leaves
- gentle image scale on hover
- subtle row translation on hover
- FAQ open/close with smooth grid-row expansion
- stacked cards relaxing on hover

### Avoid

- bounce
- elastic effects
- fast repeated micro-animations
- aggressive parallax
- motion that makes the page feel like a product dashboard

## Section Logic

The page should tell a clear emotional and cognitive story:

1. Hero:
   emotional promise and first conversion

2. Environmental Impact:
   explain what ALIGN reads

3. Room Score:
   show synthesized intelligence in a soft visual form

4. Share Cards:
   make outcomes feel desirable and social

5. Workflow:
   ground the promise in a practical flow

6. Premium Analysis:
   explain depth and product differentiation

7. Pricing:
   reduce friction and make the decision feel simple

8. Testimonials:
   human validation and tonal warmth

9. FAQ:
   remove uncertainty without breaking mood

10. Bottom CTA:
   close with a focused, emotionally resonant invitation

11. Footer:
   brand support, navigation, trust, and closure

## Component-Level Abstractions

Use these abstract UI patterns when optimizing or extending:

### 1. Signal Accent

A color or halo used to communicate one environmental dimension.

Examples:

- score bubbles
- share card glows
- workflow icon backgrounds

### 2. Editorial Divider

A thin line used to create rhythm and clarity instead of a card shell.

Examples:

- workflow rows
- feature rows
- pricing item separators
- FAQ lines

### 3. Media Anchor

A cropped image or illustration that gives a section emotional weight.

Examples:

- hero illustration
- feature hero image
- workflow scene images

### 4. Calm CTA

A CTA that feels inevitable and easy, not shouted.

Rules:

- rounded pill
- clean contrast
- minimal surrounding noise
- one primary CTA per conversion moment

### 5. Atmospheric Depth

Depth should come from blur, tint, layering, and spacing more than strong shadows.

## Content Tone

Copy should be:

- restorative
- articulate
- practical
- lightly poetic
- never hype-heavy

The product promise is “clearer rooms, clearer states,” not “AI magic.”

## Design Do / Don’t

### Do

- favor open compositions over boxed compositions
- keep accent colors soft and intentional
- let headings carry section identity
- use imagery as mood plus explanation
- preserve the calm premium tone in every addition

### Don’t

- revert to generic SaaS cards
- add loud gradients or dark sections without reason
- overcrowd sections with extra labels and chips
- overuse borders
- make every section equally dense

## Optimization Priorities

When refining this page further, optimize in this order:

1. Section-to-section rhythm
2. Image crops and focal points
3. Typography consistency
4. Hover and reveal smoothness
5. CTA hierarchy
6. Footer polish and closure quality
7. Mobile layout adaptation

## Future Change Rules

Any future section or component added to the production landing experience should pass these checks:

- Does it feel like part of the same cream-and-editorial world?
- Is it lighter than a standard marketing card solution?
- Does it use color as guidance rather than decoration?
- Does it reduce friction or deepen the story?
- Would it still feel premium if all shadows were softened further?

If the answer is no, redesign before shipping.
