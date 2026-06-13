# ALIGN Upload V2 PRD

## Purpose

This document is the source of truth for the new UI upload flow prototype under:

- `src/features/app-ui/v2/upload/UploadStep1Page.tsx`
- `src/features/app-ui/v2/upload/UploadStep2Page.tsx`
- `src/features/app-ui/v2/upload/UploadStep3Page.tsx`

It replaces the older mental model of:

- upload
- personalize
- snapshot
- plan

for the current v2 app-side journey.

## User-facing flow

The new flow is always:

1. Choose your space and intention
2. Upload your space and refine the context
3. Review your spatial snapshot and preview the full plan

`Snapshot` and `Full Plan` still belong to the same perceived report step, but the inputs that create the report have been reorganized.

## Step 1

### Route

- `/app/upload`

### Purpose

Let the user quickly define:

- what kind of space they want help with
- what the space should support more

This step should feel lightweight, visual, and emotionally legible.

### Inputs

#### Space selection

User chooses one primary scene:

- Bedroom
- Workspace
- Living Room
- Creative Studio

The selected space becomes the working context for the rest of the flow.

#### Intention selection

User chooses one primary desired support state:

- Better Sleep
- More Focus
- More Calm
- Vitality

### UX rules

- Space selection is shown first and should be highly visual.
- Selecting a space auto-scrolls the user toward intention selection.
- Intention does not need a default selection.
- This step should not ask for upload yet.

### Data output

Step 1 should produce a structured object like:

```ts
{
  spaceType: "bedroom" | "workspace" | "living-room" | "creative-studio",
  intention: "sleep" | "focus" | "calm" | "vitality"
}
```

## Step 2

### Route

- `/app/upload/step-2`

### Purpose

Collect the actual room image and the main contextual inputs needed to personalize the first report.

This is where ALIGN turns from abstract intention into image-based analysis.

### Inputs

#### Photo upload

User uploads one or more room photos.

Minimum supported path:

- one photo is enough to begin

Preferred path:

- 3 to 5 photos for stronger reading quality

#### Main issue selection

User selects what feels most off right now.

Current options:

- Cluttered
- Heavy
- Visually noisy
- Unfocused
- Draining
- Hard to relax in
- Lacking warmth
- Stuck or stagnant

This is the strongest self-reported tension input and should strongly influence the snapshot summary.

#### Optional note

User may add free-text context:

- what the room feels like
- what happens when they walk in
- anything subtle the image alone may not show

#### Optional detail controls

Expandable section:

- `Add optional details`

Current v2 structure:

1. What kind of change feels realistic right now?
2. What budget feels comfortable for this space?
3. What would help most right now?

### UX rules

- Clicking a main issue card auto-scrolls the note field into view.
- The optional details section is collapsed by default.
- The first two optional questions use sliders, not discrete click-only inputs.
- The final optional question uses selectable chips.
- This step should feel richer than step 1, but not like a long form.

### Data output

Step 2 should produce a structured object like:

```ts
{
  photos: string[],
  issue: "cluttered" | "heavy" | "visually-noisy" | "unfocused" | "draining" | "hard-to-relax" | "lacking-warmth" | "stuck",
  note: string | null,
  changeTolerance: 0 | 1 | 2 | 3,
  budgetComfort: 0 | 1 | 2 | 3 | 4,
  supportPriority: "better-rest" | "less-visual-noise" | "more-focus" | "more-warmth" | "more-emotional-ease" | "more-grounded-feeling" | null
}
```

## Step 3

### Route

- `/app/upload/step-3`

### Purpose

Show the first report surface.

This step should not be treated as a separate paid-plan route first. It is the unified report step where users:

- see the free spatial snapshot
- understand the room's first reading
- preview deeper plan value
- optionally unlock the fuller plan

### Snapshot responsibilities

The free snapshot should:

- confirm the room was understood
- reflect the selected issue and intention
- surface a summary headline
- show a few key dimensions
- provide at least one meaningful free action or insight

### Full-plan preview responsibilities

The step 3 surface should also hint at:

- what a fuller plan would include
- what can be prioritized next
- how budget and change tolerance affect later recommendations

### UX rules

- Step 3 must feel like the natural continuation of steps 1 and 2.
- It should be readable as a report, not a dashboard.
- Snapshot and full plan should feel like two entitlement layers of the same report family.

## Product logic implications

The new v2 flow changes the meaning of the early steps:

- Step 1 is no longer image upload
- Step 2 is no longer generic personalization only
- Step 3 is not a separate "paid plan" concept; it is the report surface

This means:

1. scene and intention should be persisted before any upload starts
2. room pre-analysis should begin as soon as photo upload succeeds in step 2
3. final snapshot synthesis should combine:
   - step 1 scene
   - step 1 intention
   - step 2 uploaded photo(s)
   - step 2 selected issue
   - step 2 optional note
   - step 2 optional budget / change controls

## Current implementation note

This document reflects the new UI prototype flow, not the historical production route naming.

Legacy docs that still mention:

- `/app/upload`
- `/app/personalize`
- `/app/snapshot`
- `/app/plan`

should be read as historical or transitional unless updated to match this document.
