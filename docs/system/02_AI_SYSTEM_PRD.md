# AI SYSTEM PRD

## Purpose

This document defines ALIGN's AI pipeline, prompt architecture, output contracts, fallback behavior, and performance strategy.

## AI system goals

- produce a room reading that feels specific to the image
- keep output actionable and emotionally supportive
- optimize for goal-sensitive personalization
- remain resilient when model latency or failures occur

## Current analysis architecture

ALIGN now uses a staged AI pipeline:

1. image upload
2. room pre-analysis during or immediately after upload
3. goal-aware fast synthesis after user completes step 2
4. fallback deterministic engine if model output is unavailable

## Core AI objects

### Room pre-analysis

Purpose:

- inspect the image before the user finishes personalization
- extract room facts, tensions, support zones, clutter/light/style reads
- shorten the final analysis wait after step 2

Output shape should include:

- `isRoomPhoto`
- `isUsablePhoto`
- `validationReason`
- `roomType`
- `visualSummary`
- `layoutSummary`
- `lightingSummary`
- `clutterSummary`
- `colorSummary`
- `styleSummary`
- `standoutFeatures`
- `frictionPoints`
- `supportZones`
- `stressZones`

### Final snapshot

Purpose:

- combine visual room understanding with user goal, concern, budget, and style preference
- return the free snapshot contract used by snapshot and later plan generation

Core fields:

- overall score and rating
- archetype and archetype description
- scene fingerprint
- primary tension
- stress impact
- free insight
- dimensions
- overall strategy

Extended fields when vision synthesis succeeds:

- integrated reading
- energy flow
- element balance
- wellness signals
- holistic supports
- spatial remedies
- preserve what works
- personalized recommendations

## Prompt layers

### Layer 1: visual inspection prompt

Use when:

- uploaded image is available
- no goal data yet or goal data is incomplete

Responsibilities:

- validate the image
- summarize the room
- identify support zones and friction zones
- avoid recommendations

### Layer 2: fast synthesis prompt

Use when:

- room pre-analysis already exists
- goal data is now complete

Responsibilities:

- transform pre-analysis into a goal-sensitive final report
- avoid another heavy image pass whenever possible

### Layer 3: full image synthesis fallback

Use when:

- pre-analysis is missing
- pre-analysis is unusable
- fast synthesis did not return a usable final report

Responsibilities:

- run a complete image+goal analysis
- serve as backup, not default path

## Performance rules

- Prefer pre-analysis + synthesis over full image re-analysis.
- Avoid repeating image preprocessing when an optimized JPEG is already available.
- Avoid re-downloading and re-encoding the same asset unless necessary.
- Preserve async processing so users do not wait on a blocking request screen.
- If a model response fails or becomes too slow, prefer degraded but useful output over blank failure.

## Fallback policy

If AI cannot produce a valid structured result:

- use deterministic fallback logic
- keep output emotionally safe and operationally useful
- clearly note that the result is an estimate when needed
- keep schema valid so frontend rendering does not break

## Model behavior requirements

- observations must be tied to visible room evidence
- suggestions must be supportive, specific, and non-judgmental
- output must avoid professional claims outside product scope
- spiritual or ritual layers must remain complementary, not absolute

## Prompt versioning rules

When prompt logic changes:

1. record the reason in `DECISION_LOG`
2. document the high-level change here
3. update any schema or analytics event dependencies

## Latency instrumentation

Track separately:

- upload latency
- room pre-analysis duration
- analysis processing duration
- processing-page wait duration
- fallback rate
- pre-analysis hit rate

## AI quality review checklist

- Does the result mention specific visible zones?
- Does the result adapt to the user's goal?
- Does it avoid obvious generic advice?
- Does it still render safely if model fields are partial?
- Does fallback remain coherent and reassuring?
