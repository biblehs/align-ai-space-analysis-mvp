# State Ritual

This module owns the "state landing" layer that comes after a room action.

Purpose:
- keep ritual copy and generation logic out of the main snapshot/full-report builders
- make ritual rules reusable across room types and goals
- allow future ritual tuning without touching scoring or diagnosis logic

Current responsibilities:
- build snapshot ritual copy from room type, goal, and first-shift context
- provide full-report ritual content derived from the snapshot ritual

Content source:
- `@/lib/align-knowledge/content/state_ritual_module_rules.json`

Boundary:
- ritual copy is an emotional landing step, not analytical evidence
- this module must never change scores, proof, or diagnosis outcomes
