# ALIGN V2 Docs Index

## Purpose

This folder now contains a focused set of docs for ALIGN's AI architecture transition.

Use this file as the reading order and implementation entry point.

---

## Recommended Reading Order

### 1. Current-state map

Read first if you need to understand the existing code before changing anything.

- [ALIGN_AI_CORE_MAP.md](../docs/ALIGN_AI_CORE_MAP.md)

Focus:

- where AI is currently called
- where upload/analyze/plan routes live
- how snapshot and paid plan are produced today

### 2. V2 target architecture

Read second to understand the desired product and backend model.

- [ALIGN_V2_AI_ARCHITECTURE.md](../docs/ALIGN_V2_AI_ARCHITECTURE.md)

Focus:

- target flow
- why snapshot and full report should become one layered report
- AI vs deterministic responsibility split

### 3. V2 schemas

Read third if you need concrete payloads and enum definitions.

- [ALIGN_V2_SCHEMAS.md](../docs/ALIGN_V2_SCHEMAS.md)

Focus:

- artifact types
- event types
- input/output schemas
- recommended frontend report contract

### 4. Migration plan

Read fourth before implementation begins.

- [ALIGN_V2_MIGRATION_PLAN.md](../docs/ALIGN_V2_MIGRATION_PLAN.md)

Focus:

- how to move from current ALIGN to Lean v2 without breaking the product
- which fields/tables to keep
- which artifacts to add first

### 5. Implementation roadmap

Read fifth for execution sequencing.

- [ALIGN_V2_IMPLEMENTATION_ROADMAP.md](../docs/ALIGN_V2_IMPLEMENTATION_ROADMAP.md)

Focus:

- phase ordering
- acceptance criteria
- rollout strategy

### 6. Rule and template implementation assets

Read these when turning the architecture into deterministic diagnosis and modular report generation.

- [ALIGN_V2_PATTERN_DIAGNOSIS_MATRIX.md](../docs/ALIGN_V2_PATTERN_DIAGNOSIS_MATRIX.md)
- [ALIGN_V2_MODULAR_REPORT_TEMPLATES.md](../docs/ALIGN_V2_MODULAR_REPORT_TEMPLATES.md)

Focus:

- how one energy type should be selected
- what signals should matter most
- which snapshot and full report fields should be deterministic, templated, or model-written

---

## Fast Answers

### If you want to know "how ALIGN works today"

Start with:

- [ALIGN_AI_CORE_MAP.md](../docs/ALIGN_AI_CORE_MAP.md)

### If you want to know "what ALIGN v2 should look like"

Start with:

- [ALIGN_V2_AI_ARCHITECTURE.md](../docs/ALIGN_V2_AI_ARCHITECTURE.md)

### If you want to know "what schemas and enums should exist"

Start with:

- [ALIGN_V2_SCHEMAS.md](../docs/ALIGN_V2_SCHEMAS.md)

### If you want to know "what to build next"

Start with:

- [ALIGN_V2_MIGRATION_PLAN.md](../docs/ALIGN_V2_MIGRATION_PLAN.md)
- [ALIGN_V2_IMPLEMENTATION_ROADMAP.md](../docs/ALIGN_V2_IMPLEMENTATION_ROADMAP.md)

---

## One-Line Summary

ALIGN should evolve from:

- one mixed AI/report flow with partial rules-based fulfillment

into:

- a staged, observable, schema-bound spatial analysis pipeline where `snapshot` is the first layer of a larger report.
