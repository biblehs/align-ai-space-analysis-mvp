# Vision Eval Harness

This harness evaluates ALIGN's single image-analysis call end to end through the real repository path:

`case image -> getVisionObservationPrompt() -> generateVisionObservation() -> current schema parse -> scored report`

Its purpose is to make prompt, schema, and model changes measurable instead of subjective.

## Directory Layout

```text
evals/vision/
  README.md
  images/
  cases/
  runs/
```

- `images/`: local fixture images used for evaluation
- `cases/`: one JSON file per labeled evaluation case
- `runs/`: generated output for each run, ignored by git

## Run It

```bash
npm run eval:vision
```

Optional flags:

```bash
npm run eval:vision -- --tag prompt-tightened
npm run eval:vision -- --case bedroom-desk-overlap-01
npm run eval:vision -- --limit 10
npm run eval:vision -- --min-score 78
```

## What Gets Saved

Each run creates a folder in `evals/vision/runs/`:

```text
evals/vision/runs/20260405-153000--prompt-tightened/
  summary.json
  summary.md
  cases/
    bedroom-desk-overlap-01.json
```

The per-case artifact includes:

- case input
- prompt text used for that case
- raw model output
- token usage
- score breakdown
- mismatch notes

## Case File Format

Each case lives in `evals/vision/cases/*.json`.

Example:

```json
{
  "id": "bedroom-desk-overlap-01",
  "imagePath": "evals/vision/images/bedroom-desk-overlap-01.jpg",
  "spaceData": {
    "spaceType": "bedroom",
    "sunlight": "medium",
    "density": "balanced",
    "perspectives": ["wide"]
  },
  "expectations": {
    "isRoomPhoto": true,
    "isUsablePhoto": true,
    "roomTypeDetectedAnyOf": ["bedroom", "workspace"],
    "minimumObservationCount": 5,
    "requiredObservationKeys": ["work_rest_overlap"],
    "requiredEvidenceKeywords": ["desk", "bed"],
    "supportZoneKeywords": ["window"],
    "stressZoneKeywords": ["desk"],
    "frictionKeywords": ["overlap"],
    "standoutKeywords": ["bed", "desk", "window"],
    "forbiddenKeywords": ["trauma", "chakra", "healing aura"]
  },
  "notes": "Mixed-use bedroom with desk visible in frame."
}
```

## Scoring Philosophy

The harness does not try to fully replace human review. It scores the parts we care about most for prompt tuning:

- room validity
- usability
- room type recognition
- observation coverage
- evidence groundedness
- support/stress zone relevance
- visible tension capture
- forbidden hallucinated language

This means it is best used for:

1. prompt iteration
2. model comparison
3. schema changes
4. regression detection before shipping

## Recommended Workflow

1. Add or update fixture images in `evals/vision/images/`
2. Add or refine case labels in `evals/vision/cases/`
3. Run `npm run eval:vision -- --tag your-change`
4. Inspect `summary.md` and low-scoring case JSONs
5. Adjust prompt/schema/model
6. Re-run and compare score deltas

## Commit Guidance

Recommended to commit:

- case JSON files
- small representative fixture images
- harness code

Recommended to keep uncommitted:

- `evals/vision/runs/*`

That keeps the benchmark set versioned while allowing local iteration noise to stay out of git history.
