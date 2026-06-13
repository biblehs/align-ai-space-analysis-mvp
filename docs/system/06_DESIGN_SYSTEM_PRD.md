# DESIGN SYSTEM PRD

## Purpose

This document defines ALIGN's UI language, visual system, tone, and reusable design rules.

## Brand principles

ALIGN should feel:

- calm but not sleepy
- premium but still approachable
- ritual-aware without becoming mystical noise
- emotionally supportive without sounding clinical

## Interface tone

UI copy should be:

- warm
- specific
- clear
- non-judgmental

Preferred framing:

- "upgrade"
- "support"
- "restore"
- "align"
- "reduce friction"

Avoid:

- shame-driven copy
- harsh diagnostics
- generic productivity jargon

## Visual language

### Color direction

- soft neutrals for structural surfaces
- restrained greens, lime, and warm earth accents for positive motion
- limited red or brick only for warning or error emphasis

### Typography

- expressive display face for section titles
- readable sans-serif for body and UI
- avoid overly technical or cold interfaces

### Shape and spacing

- use rounded cards and soft containers
- preserve breathing room
- prioritize layered hierarchy over crowded dashboards

## Component rules

### Buttons

- primary actions must be visually obvious
- destructive or warning actions must be differentiated
- long waits should use progress-aware labels

### Forms

- field errors should appear near the field group
- helper text should explain consequences before submission
- legal or auth disclaimers should stay readable but secondary

### Modals and prompts

- anonymous registration prompts should be dismissible
- payment or registration overlays should never fully trap the user without a safe exit

### Reports

- snapshot and plan must feel like the same design family
- plan should feel like an expansion of depth, not a separate product

### Admin dashboard

- use compact infographic logic
- KPIs should be glanceable
- funnels and performance cards should be readable without SQL knowledge

## Theme rules

- keep root marketing and app shell visually related but not identical
- marketing may be more atmospheric
- app surfaces should remain more functional and legible

## Motion rules

- use motion to support transitions, not distract from them
- processing states should reassure
- hover and section reveals should be subtle

## Accessibility baseline

- maintain contrast on critical text and actions
- preserve readable font sizes in long-form legal and account content
- avoid motion dependence for meaning

## Pre-reserved API/UI seams

Frontend components should allow easy backend integration for:

- auth state
- analysis status
- report entitlement
- profile completeness
- admin metrics filters
