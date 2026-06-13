# ALIGN V2 Schemas

## Related Docs

- [ALIGN_V2_DOCS_INDEX.md](../docs/ALIGN_V2_DOCS_INDEX.md)
- [ALIGN_AI_CORE_MAP.md](../docs/ALIGN_AI_CORE_MAP.md)
- [ALIGN_V2_AI_ARCHITECTURE.md](../docs/ALIGN_V2_AI_ARCHITECTURE.md)
- [ALIGN_V2_MIGRATION_PLAN.md](../docs/ALIGN_V2_MIGRATION_PLAN.md)
- [ALIGN_V2_IMPLEMENTATION_ROADMAP.md](../docs/ALIGN_V2_IMPLEMENTATION_ROADMAP.md)

## Goal

This document defines the recommended enums and payload schemas for ALIGN v2.

It is designed to bridge:

- the current ALIGN codebase
- the `report_result` aggregate already in use
- a future artifact-based AI pipeline

This is the companion document to:

- `docs/ALIGN_V2_AI_ARCHITECTURE.md`

---

## 1. Design Rules

1. Every machine-generated stage must have a schema.
2. Every schema should be versioned.
3. All frontend surfaces should continue reading from one unified report contract.
4. Internally, artifacts can be more granular than frontend payloads.
5. A schema should describe facts first, then interpretation, then actions.

---

## 2. Recommended Artifact Types

The current codebase already uses `analysis_artifacts`.

Recommended v2 artifact types:

```txt
uploaded_photo
normalized_input
vision_observation
score_result
snapshot
full_report
recommendations
```

Suggested artifact versioning format:

```txt
2026-04-01.normalized-input.v1
2026-04-01.vision-observation.v1
2026-04-01.score-result.v1
2026-04-01.snapshot.v1
2026-04-01.full-report.v1
2026-04-01.recommendations.v1
```

---

## 3. Core Enums

### 3.1 Job status

Product-facing:

```txt
draft
queued
extracting
extracted
scoring
snapshot_generating
snapshot_ready
report_generating
report_ready
recommendations_generating
completed
failed
```

Internal pipeline stage:

```txt
initialized
photo_uploaded
preanalysis_queued
preanalysis_processing
preanalysis_completed
snapshot_queued
snapshot_processing
snapshot_completed
full_report_queued
full_report_processing
full_report_completed
failed
```

### 3.2 Generation status

```txt
pending
processing
completed
failed
locked
```

### 3.3 Observation keys

Start with a small canonical set.

```txt
visible_clutter
surface_overload
soft_lighting_absent
harsh_overhead_light
natural_light_present
visual_noise
layout_bottleneck
clear_support_zone
rest_anchor_present
focus_anchor_present
warm_materials_present
cold_material_pressure
storage_exposed
bed_zone_defined
work_zone_defined
ritual_zone_absent
```

These keys should be versioned over time, not invented ad hoc per prompt.

### 3.4 Driver direction

```txt
positive
negative
mixed
```

### 3.5 Recommendation types

```txt
product
setup
ritual
habit
lighting
declutter
layout
wellness
```

---

## 4. Normalized Input Schema

Artifact type:

- `normalized_input`

Purpose:

- preserve the stable backend interpretation of the user request

Suggested schema:

```json
{
  "roomType": "bedroom",
  "goals": ["sleep", "calm"],
  "primaryGoal": "sleep",
  "concerns": ["clutter", "restlessness"],
  "stylePreference": "warm",
  "budget": "mid",
  "renting": true,
  "acceptPlants": true,
  "acceptLighting": true,
  "notes": "I often feel like I can't fully unwind here.",
  "imageCount": 2,
  "source": "upload_v2"
}
```

Recommended TypeScript shape:

```ts
type NormalizedInput = {
  roomType: string | null;
  goals: string[];
  primaryGoal: "sleep" | "focus" | "calm" | "reset";
  concerns: string[];
  stylePreference: string | null;
  budget: "budget" | "mid" | "premium" | "minimal" | "low" | "medium" | null;
  renting: boolean;
  acceptPlants: boolean;
  acceptLighting: boolean;
  notes: string | null;
  imageCount: number;
  source: "upload_v2";
};
```

---

## 5. Vision Observation Schema

Artifact type:

- `vision_observation`

Purpose:

- turn images into evidence-backed structured observations

This replaces the current broad `RoomPreAnalysis` role with a more reusable format.

Suggested schema:

```json
{
  "roomTypeDetected": "bedroom",
  "observationSummary": "A compact bedroom with moderate visual clutter and limited softness.",
  "confidence": 0.87,
  "observations": [
    {
      "key": "visible_clutter",
      "value": true,
      "confidence": 0.91,
      "evidence": "multiple exposed items on desk and floor",
      "locationHint": "desk and lower floor area",
      "impactTags": ["sleep", "calm"]
    },
    {
      "key": "soft_lighting_absent",
      "value": true,
      "confidence": 0.76,
      "evidence": "room appears lit mainly by overhead light",
      "locationHint": "ceiling light as dominant source",
      "impactTags": ["sleep", "calm"]
    }
  ],
  "supportZones": [
    "bedside corner with lower visual density"
  ],
  "stressZones": [
    "desk and floor area with visible clutter"
  ],
  "validation": {
    "isRoomPhoto": true,
    "isUsablePhoto": true,
    "reason": "The room and major functional areas are clearly visible."
  }
}
```

Recommended TypeScript shape:

```ts
type VisionObservation = {
  roomTypeDetected: string | null;
  observationSummary: string;
  confidence: number;
  observations: Array<{
    key: string;
    value: boolean | number | string;
    confidence: number;
    evidence: string;
    locationHint?: string | null;
    impactTags?: string[];
  }>;
  supportZones: string[];
  stressZones: string[];
  validation: {
    isRoomPhoto: boolean;
    isUsablePhoto: boolean;
    reason: string;
  };
};
```

### Mapping from current code

Current `RoomPreAnalysis` fields in `src/types/index.ts` can map roughly like this:

- `visualSummary` -> `observationSummary`
- `frictionPoints` -> `observations` with negative keys
- `supportZones` -> `supportZones`
- `stressZones` -> `stressZones`
- validation fields -> `validation`

---

## 6. Score Result Schema

Artifact type:

- `score_result`

Purpose:

- deterministic scoring and issue prioritization

Suggested schema:

```json
{
  "scores": {
    "sleep": 64,
    "focus": 58,
    "calm": 60
  },
  "primaryGoalScore": 64,
  "drivers": [
    {
      "key": "visible_clutter",
      "direction": "negative",
      "impact": 14,
      "explanation": "Visible clutter is increasing cognitive load."
    },
    {
      "key": "bed_zone_defined",
      "direction": "positive",
      "impact": 9,
      "explanation": "A clear bed zone supports recovery cues."
    }
  ],
  "topIssues": [
    "visual clutter",
    "harsh evening lighting",
    "lack of visual separation"
  ],
  "priorityActions": [
    "reduce visible clutter on the main surface",
    "add one softer evening light source",
    "strengthen the rest zone around the bed"
  ],
  "scoringVersion": "2026-04-01.score.v1"
}
```

Recommended TypeScript shape:

```ts
type ScoreResult = {
  scores: {
    sleep: number;
    focus: number;
    calm: number;
  };
  primaryGoalScore: number;
  drivers: Array<{
    key: string;
    direction: "positive" | "negative" | "mixed";
    impact: number;
    explanation: string;
  }>;
  topIssues: string[];
  priorityActions: string[];
  scoringVersion: string;
};
```

---

## 7. Snapshot Schema

Artifact type:

- `snapshot`

Purpose:

- the first visible report layer

This should stay close to the current `SnapshotResult`, but its generation input should shift to:

- normalized input
- vision observation
- score result

Suggested schema:

```json
{
  "headline": "Your room has the foundation for rest, but visible clutter is reducing its calming effect.",
  "summary": "The space already supports rest in some ways, but visual noise and practical lighting may be making it harder to fully settle.",
  "topFindings": [
    "Visible clutter is increasing mental load.",
    "The lighting feels more practical than restorative.",
    "The room layout still has strong potential for a calmer sleep zone."
  ],
  "quickActions": [
    "Clear the most visible surface first.",
    "Introduce one softer evening light source.",
    "Create a more defined reset area around the bed."
  ],
  "scores": {
    "sleep": 64,
    "focus": 58,
    "calm": 60
  },
  "primaryTension": "The room has the bones for rest, but exposed clutter and functional lighting keep it mentally active.",
  "snapshotVersion": "2026-04-01.snapshot.v1"
}
```

### Recommendation for current code

Do not replace the current `SnapshotResult` contract immediately.

Instead:

- keep `SnapshotResult` as the frontend-facing shape
- use the v2 snapshot writer to populate that shape
- gradually converge on a cleaner representation later

This avoids a breaking frontend rewrite.

---

## 8. Full Report Schema

Artifact type:

- `full_report`

Purpose:

- expanded interpretation built from the same underlying diagnosis

Suggested schema:

```json
{
  "overview": "Your room already carries some calming signals, but clutter and lighting are reducing how restorative it feels at the end of the day.",
  "strengths": [
    "The room already has a defined bed zone.",
    "The palette is relatively calm and non-chaotic."
  ],
  "pressurePoints": [
    "Visible clutter is competing for attention.",
    "Lighting appears more task-oriented than restorative."
  ],
  "priorityShifts": [
    {
      "title": "Clear the most visible stress surface",
      "whyItMatters": "This lowers background cognitive load quickly.",
      "action": "Reduce exposed objects on the main desk and floor area."
    },
    {
      "title": "Add one softer evening light source",
      "whyItMatters": "This changes the room's nighttime state signal.",
      "action": "Layer one warm lamp near the rest zone."
    }
  ],
  "nextStepPlan": [
    "Make one visual clearing move today.",
    "Add or reposition one lower evening light this week.",
    "Protect the bed zone as the room's calm anchor."
  ],
  "reportVersion": "2026-04-01.full-report.v1"
}
```

Recommended TypeScript shape:

```ts
type FullReport = {
  overview: string;
  strengths: string[];
  pressurePoints: string[];
  priorityShifts: Array<{
    title: string;
    whyItMatters: string;
    action: string;
  }>;
  nextStepPlan: string[];
  reportVersion: string;
};
```

### Relationship to current code

Current paid output is largely `PlanStep[]`.

Recommended transition:

- keep `PlanStep[]` as the executable action-plan layer
- introduce `FullReport` as the narrative/diagnostic expansion layer
- store both inside `report_result`

That means full report is not equal to `plan_result`.

Instead:

- `plan_result` = executable plan
- `full_report` = explanation and prioritization around that plan

---

## 9. Recommendations Schema

Artifact type:

- `recommendations`

Purpose:

- keep products and rituals separate from the diagnosis

Suggested schema:

```json
{
  "items": [
    {
      "type": "lighting",
      "title": "Warm bedside lamp",
      "reason": "A softer low light can reduce the room's functional feel in the evening.",
      "priority": "high"
    },
    {
      "type": "ritual",
      "title": "2-minute evening reset",
      "reason": "A repeatable reset cue can help the room feel more supportive over time.",
      "priority": "medium"
    }
  ],
  "recommendationVersion": "2026-04-01.recommendations.v1"
}
```

Recommended TypeScript shape:

```ts
type RecommendationResult = {
  items: Array<{
    type: "product" | "setup" | "ritual" | "habit" | "lighting" | "declutter" | "layout" | "wellness";
    title: string;
    reason: string;
    priority: "low" | "medium" | "high";
  }>;
  recommendationVersion: string;
};
```

---

## 10. Unified Frontend Report Contract

ALIGN should continue to use one frontend aggregate.

The current `ReportResult` direction is correct.

Recommended future shape:

```json
{
  "version": "2026-04-01.report.v2",
  "pipeline": {
    "stage": "snapshot_completed",
    "status": "completed",
    "preanalysisStatus": "completed",
    "snapshotStatus": "completed",
    "fullReportStatus": "locked"
  },
  "free": {
    "snapshot": {}
  },
  "paid": {
    "unlocked": false,
    "plan": null,
    "fullReport": null,
    "recommendations": null
  },
  "meta": {
    "modelName": "gemini-2.5-flash",
    "visionSchemaVersion": "2026-04-01.vision-observation.v1",
    "scoreVersion": "2026-04-01.score.v1",
    "snapshotVersion": "2026-04-01.snapshot.v1",
    "fullReportVersion": null,
    "recommendationVersion": null
  }
}
```

### Important recommendation

Do not let the frontend read:

- raw `vision_observation`
- raw `score_result`
- raw model output

Those should remain backend and admin-facing artifacts.

Frontend should still read only `report_result`.

---

## 11. Event Types

Recommended `job_events.event_type` values:

```txt
job_created
input_normalized
vision_started
vision_completed
vision_failed
scoring_started
scoring_completed
snapshot_started
snapshot_completed
snapshot_failed
full_report_started
full_report_completed
full_report_failed
recommendations_started
recommendations_completed
recommendations_failed
job_completed
job_failed
job_retried
```

Useful payload fields:

```json
{
  "artifactType": "vision_observation",
  "artifactVersion": "2026-04-01.vision-observation.v1",
  "modelName": "gemini-2.5-flash",
  "durationMs": 1842,
  "attempt": 1,
  "errorCode": null
}
```

---

## 12. Suggested Migration Sequence

### Step 1

Add artifact support for:

- `normalized_input`
- `vision_observation`
- `score_result`

### Step 2

Keep current `SnapshotResult` shape, but generate it from:

- normalized input
- vision observation
- score result

### Step 3

Add `fullReport` and `recommendations` inside `report_result.paid`

### Step 4

Gradually reduce direct frontend reliance on:

- `snapshot_result`
- `plan_result`

### Step 5

Only after artifact shapes stabilize, consider splitting into dedicated tables.

---

## 13. Minimal Build Recommendation

If the team wants the shortest path to v2:

1. keep the current `report_result` aggregate
2. add `vision_observation` artifact
3. add deterministic `score_result`
4. keep `snapshot` as the first visible product output
5. keep `plan_result` for execution steps
6. add `fullReport` narrative and `recommendations` as separate paid expansions

That path gives the architecture benefits of v2 without forcing a full frontend or database rewrite first.
