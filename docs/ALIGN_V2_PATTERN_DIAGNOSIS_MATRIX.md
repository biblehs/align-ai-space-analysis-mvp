# ALIGN V2 Pattern Diagnosis Matrix

## Purpose

This file defines the rule-based diagnosis layer that should sit between:

- `vision_observation`
- `note_interpretation`
- `score_result`
- `snapshot`

The goal is to stop letting one large prompt decide everything at once.

Instead:

1. multimodal AI sees the room
2. the rule layer assigns one energy type
3. snapshot and full report are composed from stable fields

## Why This Matters

The current system is weakest where subjective intake gets treated like objective room truth.

The matrix below makes diagnosis:

- cheaper
- easier to debug
- easier to A/B test
- safer to evolve without breaking the product tone

## Core Inputs

The scoring matrix should consume:

- `claimedRoomType`
- `primaryGoal`
- `primaryIssue`
- `vision_observation.validation`
- `vision_observation.proofSignals`
- `vision_observation.supportZones`
- `vision_observation.stressZones`
- `note_interpretation`
- `optional_preferences`

It should not directly consume long freeform prompt prose.

## Decision Order

1. Validate the image.
2. Resolve room type using detected room type first, then claimed room type when confidence is low.
3. Extract normalized room signals.
4. Score each energy type against:
   - room signals
   - goal bias
   - issue bias
   - contradiction penalties
5. Select exactly one winning energy type.
6. Build:
   - `coreTension`
   - `feltImpact`
   - `proofSignals`
   - `firstShiftPattern`
   - `fullReportPromise`

## Normalized Signal Set

These are the recommended signal keys for rule scoring.

- `activation_blocked`
- `unfinished_surfaces`
- `work_rest_overlap`
- `overstimulating_focal_points`
- `visual_noise`
- `lack_of_anchor`
- `heavy_storage`
- `emotional_accumulation`
- `cold_functional_light`
- `soft_restorative_light`
- `sparse_unclaimed_space`
- `lack_of_personal_claim`
- `transition_state`
- `mixed_old_new_identity`
- `coherent_anchor_zone`
- `clear_support_zone`

## Energy Type Matrix

### Dormant Fire

- Core sentence: `Energy that wants to move but has nowhere to go.`
- Core tension: active intent is present, but unfinished signals keep momentum from landing cleanly.
- Strongest signals:
  - `activation_blocked`
  - `unfinished_surfaces`
  - `work_rest_overlap`
- Goal bias:
  - `vitality +4`
  - `focus +3`
- Issue bias:
  - `stuck +5`
  - `cluttered +4`
  - `unfocused +3`
- First-shift pattern:
  - clear the strongest unfinished surface
- Full report should answer:
  - which zone keeps reopening mental loops
  - why the room feels active but not directional
  - what to reduce before adding support

### Scattered Moon

- Core sentence: `Everything is present. Nothing is centered.`
- Core tension: the room offers many inputs at once but lacks a calm center to land in.
- Strongest signals:
  - `overstimulating_focal_points`
  - `visual_noise`
  - `lack_of_anchor`
- Goal bias:
  - `calm +4`
  - `focus +3`
- Issue bias:
  - `visually-noisy +6`
  - `unfocused +5`
- First-shift pattern:
  - remove one competing focal point
- Full report should answer:
  - what is fragmenting the room's attention field
  - where the real anchor point should be
  - how to reduce noise without flattening the room

### Heavy Earth

- Core sentence: `Safe, but too heavy to move forward.`
- Core tension: the room protects and stores, but that protection has hardened into drag.
- Strongest signals:
  - `heavy_storage`
  - `emotional_accumulation`
  - `activation_blocked`
- Goal bias:
  - `vitality +4`
  - `focus +2`
- Issue bias:
  - `heavy +6`
  - `stuck +5`
- First-shift pattern:
  - release one object the room is carrying out of habit
- Full report should answer:
  - which objects stabilize vs freeze the room
  - where stagnation is accumulating
  - how to lighten the room without losing comfort

### Still Water

- Core sentence: `Calm on the surface. Tension held underneath.`
- Core tension: the room looks composed, but does not yet carry enough warmth or restoration to truly settle the body.
- Strongest signals:
  - `cold_functional_light`
  - `lack_of_anchor`
  - `sparse_unclaimed_space`
- Goal bias:
  - `sleep +5`
  - `calm +3`
- Issue bias:
  - `hard-to-relax +5`
  - `lacking-warmth +5`
- First-shift pattern:
  - add one low, warm restorative cue
- Full report should answer:
  - why the room still feels under-supportive even when tidy
  - which restorative cue is missing
  - how to build warmth without clutter

### Empty Sky

- Core sentence: `Too open. The room does not know what it is for.`
- Core tension: the room is open and light, but lacks enough claim, identity, and grounding to feel lived in.
- Strongest signals:
  - `sparse_unclaimed_space`
  - `lack_of_personal_claim`
  - `lack_of_anchor`
- Goal bias:
  - weak and fairly even across all goals
- Issue bias:
  - `lacking-warmth +4`
- First-shift pattern:
  - claim one corner with a single grounded purpose
- Full report should answer:
  - which area should become the first true anchor
  - why the room feels unclaimed instead of clear
  - how to add identity without overfilling

### Rising Wood

- Core sentence: `Growth is trying to happen here. Clear the path.`
- Core tension: the room is in transition, but old and new signals are still competing for authority.
- Strongest signals:
  - `transition_state`
  - `mixed_old_new_identity`
  - `activation_blocked`
- Goal bias:
  - `vitality +5`
  - `focus +2`
- Issue bias:
  - `stuck +6`
- First-shift pattern:
  - resolve one visible old-vs-new conflict
- Full report should answer:
  - which zone still carries the old version of the room
  - where the new identity is already emerging
  - what should change first to make the transition real

## Proof Selection Rules

- Snapshot should show at most 3 proof signals.
- Paid report should retain at least 5 proof signals.
- Proof should be selected by:
  1. energy type priority
  2. observation confidence
  3. relevance to the selected goal

## Notes Handling

The note should never override visible evidence.

It should only influence:

- tone of `reading.oneLiner`
- tone of `reading.shortParagraph`
- how strongly the first shift is framed
- whether constraints are applied to the action path

## MVP Recommendation

For the cheapest stable MVP:

- `Gemini` only handles `vision_observation`
- rules handle `pattern_diagnosis`
- templates handle `snapshot` and `full_report`
- later, a very small text model can rewrite only the `reading` block
