# ALIGN Knowledge System

## Purpose

ALIGN uses two distinct AI steps:

1. image analysis
2. snapshot writer layer

Only the second step should receive lightweight retrieved knowledge.

The goal is not to make the model "know everything." The goal is to help it:

- stay aligned to the product framework
- use more professional interpretation language
- choose more stable explanation patterns
- recommend better first moves
- preserve brand voice boundaries

## Architecture

Repository module:

```bash
src/lib/align-knowledge/
```

Key files:

- `content/dimensions.json`
- `content/archetypes.json`
- `content/tension_patterns.json`
- `content/visual_observation_rules.json`
- `content/observation_to_interpretation.json`
- `content/interpretation_to_actions.json`
- `content/room_goals.json`
- `content/brand_voice_rules.ts`
- `content/healing_expression_whitelist.json`
- `content/confidence_rules.json`
- `knowledge-schema.ts`
- `version.ts`
- `retrieval.ts`

## Runtime guarantees

The knowledge system now includes:

- runtime validation for all knowledge files
- an explicit knowledge version stamp
- machine-readable retrieval hits for preview/debug
- a healing-expression whitelist that governs tone without changing logic

This keeps the system lightweight while still making it governable.

## Why this is not heavy RAG

This system does not use a vector database or free-form retrieval.

Instead it uses:

- structured files
- deterministic selection
- a small injected context block

This is intentional. ALIGN needs stable product reasoning, not open-ended document search.

## Retrieval policy

The writer layer should receive only knowledge relevant to:

- current room type
- current goal
- current archetype
- strongest / weakest dimensions
- visible tension patterns
- approved healing-expression roles and phrase boundaries

The first image-analysis call should not receive this broader knowledge context.

Current runtime status:

- `snapshot` healing-expression rules are actively injected into the writer layer
- `fullReport` and `progressReport` healing-expression rules are now defined and retrievable through the same stage-based knowledge system, ready for future writer prompts

## Debug surface

Local preview output includes:

- `knowledgeVersion`
- `knowledgeHits.roomGoalProfile`
- `knowledgeHits.dimensionKeys`
- `knowledgeHits.archetypeId`
- `knowledgeHits.tensionPatternIds`
- `knowledgeHits.interpretationRuleIds`
- `knowledgeHits.actionRuleIds`
- `knowledgeHits.confidenceRuleIds`
- `knowledgeHits.healingStage`

This makes it possible to tune the knowledge system by inspecting what was actually selected for a given snapshot run.

## Guardrail

The retrieved knowledge is allowed to shape:

- wording
- explanation emphasis
- action framing
- professional consistency

It is not allowed to override:

- room type
- proof facts
- score values
- target zone
- observed objects or surfaces

Healing language belongs only to the writer layer and only as emotional translation.
It must never function as evidence, scoring logic, or root-cause reasoning.

See also:

- `docs/system/13_HEALING_EXPRESSION_USAGE_MATRIX.md`
