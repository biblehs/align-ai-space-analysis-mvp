# Tension Map Foundation

## Purpose

ALIGN should not jump straight from photo observations to generic advice.

It needs a deterministic middle layer that combines:

- space facts
- user intention
- user self-state
- practical constraints

into one specific contradiction the report can act on.

This middle layer is called the `TensionMap`.

## Input

`AlignInput` is the normalized product input for this layer.

It includes:

- room type
- current intention
- self-state tags
- notes
- budget and change constraints
- derived photo signals

## Output

`TensionMap` should answer:

- what states the room is amplifying
- what states it is blocking
- the core contradiction
- the best leverage point
- what not to do yet
- what relief the user may feel first

## Why this matters

Without this layer, reports drift toward generic actions such as:

- clear clutter
- soften lighting
- add a rug

With this layer, the report can instead say:

- rest is being blocked by ongoing signals
- focus is being blocked by functional blur
- calm is being blocked by visual density

That is the difference between a suggestion engine and a product that understands the user-space relationship.

## Current implementation

Repository modules:

- `src/lib/tension-map/types.ts`
- `src/lib/tension-map/builders.ts`
- `src/lib/align-knowledge/content/state_contradiction_types.json`

Current scope:

- build `AlignInput` from normalized inputs and vision observations
- build `TensionMap` deterministically from contradiction patterns

Not yet wired:

- snapshot generation
- full report generation
- progress report generation

This is intentional for the first pass. The structure should stabilize before it becomes a dependency of production output.
