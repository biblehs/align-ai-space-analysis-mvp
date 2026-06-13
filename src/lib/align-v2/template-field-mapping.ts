export type GenerationMode = "deterministic" | "templated" | "micro_llm" | "paid_llm";

export interface TemplateFieldMapping {
    section: string;
    field: string;
    purpose: string;
    sourceArtifacts: string[];
    generationMode: GenerationMode;
    notes: string;
}

export const SNAPSHOT_TEMPLATE_FIELD_MAPPING: TemplateFieldMapping[] = [
    {
        section: "validation",
        field: "status/code/message/finalRoomType/roomMismatch",
        purpose: "Guardrail for invalid photos and room mismatch handling.",
        sourceArtifacts: ["vision_observation.validation"],
        generationMode: "deterministic",
        notes: "Never rewrite this with AI copy.",
    },
    {
        section: "type",
        field: "id/name/coreSentence/confidence",
        purpose: "Identity layer that anchors the snapshot and share card.",
        sourceArtifacts: ["pattern_diagnosis.energyType"],
        generationMode: "deterministic",
        notes: "Name and sentence come from the energy-type playbook, not from freeform generation.",
    },
    {
        section: "score",
        field: "goal/value/overall/label/narrative/meaning",
        purpose: "Quant anchor for the current room-to-goal fit.",
        sourceArtifacts: ["score_result"],
        generationMode: "templated",
        notes: "Narrative and meaning should come from a fixed score band map.",
    },
    {
        section: "reading",
        field: "oneLiner",
        purpose: "Most shareable and emotionally resonant line in the snapshot.",
        sourceArtifacts: ["pattern_diagnosis", "note_interpretation"],
        generationMode: "micro_llm",
        notes: "If cost is constrained, use a type-based template instead.",
    },
    {
        section: "reading",
        field: "shortParagraph",
        purpose: "Bridges the room evidence to the user's stated goal.",
        sourceArtifacts: ["pattern_diagnosis", "score_result", "note_interpretation"],
        generationMode: "micro_llm",
        notes: "Model can personalize tone, but cannot alter diagnosis.",
    },
    {
        section: "proof",
        field: "proof[]",
        purpose: "Trust layer proving the room was actually seen.",
        sourceArtifacts: ["pattern_diagnosis.proofSignals", "vision_observation.proofSignals"],
        generationMode: "deterministic",
        notes: "Limit snapshot to the top 3 highest-priority proof items.",
    },
    {
        section: "tension",
        field: "headline",
        purpose: "Sharp naming of the room's main contradiction.",
        sourceArtifacts: ["pattern_diagnosis.coreTension"],
        generationMode: "templated",
        notes: "Should stay short and declarative.",
    },
    {
        section: "tension",
        field: "explanation",
        purpose: "Connects the contradiction to the user's goal without overexplaining.",
        sourceArtifacts: ["pattern_diagnosis.feltImpact", "score_result"],
        generationMode: "templated",
        notes: "Can optionally be lightly polished by a small text model later.",
    },
    {
        section: "firstShift",
        field: "title/action/whyItHelps/targetZone/timing",
        purpose: "One concrete tonight move that feels safe and doable.",
        sourceArtifacts: ["pattern_diagnosis.firstShiftPattern", "optional_preferences"],
        generationMode: "templated",
        notes: "Use optional preferences only to soften or intensify the action, never to redefine the target zone.",
    },
    {
        section: "preview",
        field: "hiddenFindings/fullReportPromise",
        purpose: "Creates curiosity about the paid layer without overgiving.",
        sourceArtifacts: ["pattern_diagnosis.fullReportPromise"],
        generationMode: "templated",
        notes: "These lines should remain stable for A/B testing.",
    },
];

export const FULL_REPORT_TEMPLATE_FIELD_MAPPING: TemplateFieldMapping[] = [
    {
        section: "summary",
        field: "typeName",
        purpose: "Maintains continuity between free and paid layers.",
        sourceArtifacts: ["snapshot.type"],
        generationMode: "deterministic",
        notes: "Never rename the energy type in paid output.",
    },
    {
        section: "summary",
        field: "overview",
        purpose: "Expands the snapshot into a calm, grounded overview.",
        sourceArtifacts: ["pattern_diagnosis", "score_result", "snapshot.reading"],
        generationMode: "paid_llm",
        notes: "Can start templated and later upgrade to a paid-only writer model.",
    },
    {
        section: "summary",
        field: "transformationOutcome",
        purpose: "States the direction of change the user is paying for.",
        sourceArtifacts: ["pattern_diagnosis.fullReportPromise"],
        generationMode: "templated",
        notes: "Should sound concrete, not mystical.",
    },
    {
        section: "sections",
        field: "whatThisRoomIsDoing",
        purpose: "Explains the room's current impact on the user's goal.",
        sourceArtifacts: ["pattern_diagnosis.feltImpact", "score_result", "vision_observation"],
        generationMode: "paid_llm",
        notes: "Must stay anchored to visible evidence.",
    },
    {
        section: "sections",
        field: "whatIsWorking",
        purpose: "Preserves support already present in the room.",
        sourceArtifacts: ["pattern_diagnosis.supportZone", "vision_observation.supportZones"],
        generationMode: "templated",
        notes: "This section should come before critique.",
    },
    {
        section: "sections",
        field: "whatIsHoldingItBack",
        purpose: "Names the room's biggest pressure pattern.",
        sourceArtifacts: ["pattern_diagnosis.coreTension", "pattern_diagnosis.stressZone"],
        generationMode: "templated",
        notes: "Reuse snapshot language for continuity.",
    },
    {
        section: "zones",
        field: "zones[]",
        purpose: "Translate support/stress zones into location-based interventions.",
        sourceArtifacts: ["pattern_diagnosis.supportZone", "pattern_diagnosis.stressZone", "action_library"],
        generationMode: "templated",
        notes: "Default to 2 zones: one stress-led, one support-led.",
    },
    {
        section: "priorityShifts",
        field: "priorityShifts[]",
        purpose: "Ordered actions with rationale and expected benefit.",
        sourceArtifacts: ["pattern_diagnosis.firstShiftPattern", "action_library", "optional_preferences"],
        generationMode: "templated",
        notes: "Sort by lowest-friction action first.",
    },
    {
        section: "timeline",
        field: "tonight/thisWeek/thisMonth",
        purpose: "Turns the report into a path instead of a pile of tips.",
        sourceArtifacts: ["action_library", "optional_preferences", "pattern_diagnosis.energyType"],
        generationMode: "templated",
        notes: "Keep tonight short; expand more in week and month.",
    },
    {
        section: "optionalSupports",
        field: "optionalSupports[]",
        purpose: "Suggest supporting products or tools without making the report feel like an ad.",
        sourceArtifacts: ["action_library", "optional_preferences"],
        generationMode: "templated",
        notes: "Only render when the user is paid and the support is genuinely additive.",
    },
];
