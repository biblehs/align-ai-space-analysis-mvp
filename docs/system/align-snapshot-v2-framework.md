# ALIGN Snapshot V2 Framework

This document defines the canonical free snapshot contract, its module mapping, and the comparison snapshot framework for repeat scans.

## Free Snapshot V2 Modules

1. Hero
2. Overall reading
3. Proof
4. Space state
5. Tonight's shift
6. Hook + unlock

## Canonical Field Mapping

| Module | Fields |
| --- | --- |
| Hero | `type.name`, `type.coreSentence`, `summary.statusTags` |
| Overall reading | `summary.headline`, `summary.body` |
| Proof | `proof[]` |
| Space state | `spaceState.overallScore`, `spaceState.strongest`, `spaceState.weakest`, `spaceState.coreGap`, `spaceState.dimensions[]` |
| Tonight's shift | `firstShift.title`, `firstShift.action`, `firstShift.examples[]`, `firstShift.whyItHelps`, `firstShift.targetZone` |
| Hook + unlock | `brandHook.*`, `preview.teaserTitle`, `preview.hiddenFindings[]`, `preview.fullReportPromise`, `preview.ctaText` |

## Writer Layer Scope

The second text-only AI call may refine:

- `type.coreSentence`
- `summary.headline`
- `summary.body`
- `reading.oneLiner`
- `reading.shortParagraph`
- `firstShift.title`
- `firstShift.action`
- `firstShift.whyItHelps`
- `brandHook.title`
- `brandHook.subtitle`
- `preview.fullReportPromise`

The writer layer must not change:

- room type
- score values
- proof facts
- target zone
- analysis validity

## Writer Layer Runtime

The writer layer is now enabled by default for normal vision-based snapshot runs.

- Default behavior: on
- Opt-out behavior: set `ENABLE_SNAPSHOT_WRITER_LAYER=false`
- Intended use: keep the truth layer deterministic, then use a second text-only AI call to improve tone, clarity, and product-quality language

## Comparison Snapshot V2

Use the comparison snapshot only when the user has a previous scan available. If the selected goal is different, show history context but do not present direct score deltas as if they were like-for-like.

Core sections:

1. What changed since last time
2. Biggest gains
3. What is still lagging
4. The next reinforcement move
5. Progress report CTA
