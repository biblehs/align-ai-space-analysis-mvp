import type { SnapshotDiagnosisResponse } from "@/lib/gemini";
import type { SnapshotResultV2 } from "@/lib/align-v2/contracts";
import type { NormalizedAnalysisInput, ScoreResult, VisionObservation } from "@/types";
import {
    SNAPSHOT_DIAGNOSIS_MODEL_NAME,
    SNAPSHOT_DIAGNOSIS_PROMPT_VERSION,
    SNAPSHOT_DIAGNOSIS_SCHEMA_VERSION,
} from "@/lib/analysis-pipeline";

type ApplySnapshotDiagnosisLayerInput = {
    normalizedInput: NormalizedAnalysisInput;
    visionObservation: VisionObservation;
    scoreResult: ScoreResult;
    snapshot: SnapshotResultV2;
    force?: boolean;
};

type ApplySnapshotDiagnosisLayerResult = {
    snapshot: SnapshotResultV2;
    diagnosisUsed: boolean;
    modelName: string | null;
    promptVersion: string | null;
    schemaVersion: string | null;
};

const FORBIDDEN_COPY = [
    "trauma",
    "diagnosis",
    "medical",
    "healing aura",
    "chakra",
    "frequency",
    "instant",
    "game-changing",
    "overhaul",
    "reset",
    "cure",
    "treat",
];

const PAID_SPOILER_COPY = [
    "$",
    "budget",
    "buy",
    "purchase",
    "shopping",
    "product list",
    "exact placement",
    "step 1",
    "step 2",
    "step one",
    "step two",
];

const INVENTED_EXAMPLE_COPY = [
    "rug",
    "decorative item",
    "decor object",
    "new lamp",
    "new light",
    "buy",
    "purchase",
];

const WINDOW_INFERENCE_TOKENS = ["natural light", "window", "windows"];

function isSnapshotDiagnosisEnabled(force = false) {
    if (force) {
        return true;
    }

    const flag = process.env.ENABLE_SNAPSHOT_DIAGNOSIS_LAYER;
    return flag !== "false";
}

function normalizeLine(value: string, maxLength: number) {
    const compact = value.replace(/\s+/g, " ").trim();
    if (!compact) {
        return "";
    }

    return compact.length > maxLength ? `${compact.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...` : compact;
}

function containsToken(value: string, tokens: string[]) {
    const lowered = value.toLowerCase();
    return tokens.some((token) => lowered.includes(token));
}

function reportHasVisibleWindowSupport(visionObservation: VisionObservation) {
    const haystacks = [
        visionObservation.observationSummary,
        visionObservation.layoutSummary,
        visionObservation.lightingSummary,
        visionObservation.colorSummary,
        ...visionObservation.standoutFeatures,
        ...visionObservation.supportZones,
        ...visionObservation.stressZones,
        ...visionObservation.observations.map((item) => item.evidence),
    ].map((value) => value.toLowerCase());

    return haystacks.some((value) => {
        if (!value.includes("window")) return false;
        return !(
            value.includes("no visible window") ||
            value.includes("no visible windows") ||
            value.includes("absence of visible windows") ||
            value.includes("lack of visible windows")
        );
    });
}

function containsUnsupportedWindowInference(value: string, visionObservation: VisionObservation) {
    if (reportHasVisibleWindowSupport(visionObservation)) {
        return false;
    }

    const lowered = value.toLowerCase();
    return WINDOW_INFERENCE_TOKENS.some((token) => lowered.includes(token));
}

function safeText(
    value: string,
    fallback: string,
    maxLength: number,
    visionObservation: VisionObservation,
    options?: { paidTeaser?: boolean },
) {
    const normalized = normalizeLine(value, maxLength);
    if (
        !normalized ||
        containsToken(normalized, FORBIDDEN_COPY) ||
        containsUnsupportedWindowInference(normalized, visionObservation) ||
        (!options?.paidTeaser && containsToken(normalized, PAID_SPOILER_COPY))
    ) {
        return fallback;
    }

    return normalized;
}

function actionMentionsTargetZone(action: string, targetZone: string) {
    const actionLower = action.toLowerCase();
    const zoneLower = targetZone.toLowerCase();
    return actionLower.includes(zoneLower) || zoneLower.split(/\s+/).some((part) => part.length > 4 && actionLower.includes(part));
}

function safeList(
    values: string[],
    fallback: string[],
    limit: number,
    maxLength: number,
    visionObservation: VisionObservation,
    options?: { paidTeaser?: boolean },
) {
    const nextValues = values
        .map((value) => safeText(value, "", maxLength, visionObservation, options))
        .filter(Boolean);

    return (nextValues.length > 0 ? nextValues : fallback).slice(0, limit);
}

function safeProofItems(
    values: SnapshotDiagnosisResponse["proof"],
    fallback: SnapshotResultV2["proof"],
    visionObservation: VisionObservation,
) {
    const nextProof = values
        .map((item) => ({
            label: safeText(item.label, "", 80, visionObservation),
            evidence: safeText(item.evidence, "", 180, visionObservation),
            impact: item.impact,
        }))
        .filter((item): item is SnapshotResultV2["proof"][number] => Boolean(item.label && item.evidence));

    return (nextProof.length >= 2 ? nextProof : fallback).slice(0, 3);
}

function hasSuitcaseTension(visionObservation: VisionObservation, targetZone: string) {
    const haystack = [
        targetZone,
        visionObservation.observationSummary,
        visionObservation.layoutSummary,
        visionObservation.clutterSummary,
        ...visionObservation.frictionPoints,
        ...visionObservation.stressZones,
        ...visionObservation.observations.map((item) => `${item.label} ${item.evidence}`),
    ].join(" ").toLowerCase();

    return haystack.includes("suitcase");
}

function buildSuitcaseFirstShift(targetZone: string) {
    const zone = targetZone.replace(/\s+/g, " ").trim() || "the floor path near the bed";

    return {
        title: "Clear the path to rest.",
        action: `Tonight, move the suitcase out of ${zone.toLowerCase()} so the route to the bed feels clearer.`,
        examples: [
            "Move the suitcase out of the main walking path.",
            "Keep the floor beside the bed and desk open.",
            "Leave the bed-facing view free of temporary storage.",
        ],
    };
}

function safeFirstShiftExamples(
    values: string[],
    fallback: string[],
    visionObservation: VisionObservation,
) {
    return safeList(values, fallback, 3, 90, visionObservation)
        .filter((item) => !containsToken(item, INVENTED_EXAMPLE_COPY));
}

export async function applySnapshotDiagnosisLayer(
    input: ApplySnapshotDiagnosisLayerInput,
): Promise<ApplySnapshotDiagnosisLayerResult> {
    if (!isSnapshotDiagnosisEnabled(input.force)) {
        return {
            snapshot: input.snapshot,
            diagnosisUsed: false,
            modelName: null,
            promptVersion: null,
            schemaVersion: null,
        };
    }

    const { generateSnapshotDiagnosis } = await import("@/lib/gemini");
    const diagnosisResult = await generateSnapshotDiagnosis(
        input.normalizedInput,
        input.visionObservation,
        input.scoreResult,
        input.snapshot,
    );

    if (!diagnosisResult) {
        return {
            snapshot: input.snapshot,
            diagnosisUsed: false,
            modelName: null,
            promptVersion: null,
            schemaVersion: null,
        };
    }

    const draft = diagnosisResult.data;
    const rewrittenAction = safeText(
        draft.firstShift.action,
        input.snapshot.firstShift.action,
        220,
        input.visionObservation,
    );
    const suitcaseFirstShift = hasSuitcaseTension(input.visionObservation, input.snapshot.firstShift.targetZone)
        ? buildSuitcaseFirstShift(input.snapshot.firstShift.targetZone)
        : null;
    const action = suitcaseFirstShift
        ? suitcaseFirstShift.action
        : actionMentionsTargetZone(rewrittenAction, input.snapshot.firstShift.targetZone)
        ? rewrittenAction
        : input.snapshot.firstShift.action;
    const examples = suitcaseFirstShift
        ? suitcaseFirstShift.examples
        : safeFirstShiftExamples(draft.firstShift.examples, input.snapshot.firstShift.examples, input.visionObservation);

    return {
        snapshot: {
            ...input.snapshot,
            summary: {
                ...input.snapshot.summary,
                headline: safeText(
                    draft.summary.headline,
                    input.snapshot.summary.headline,
                    140,
                    input.visionObservation,
                ),
                body: safeText(
                    draft.summary.body,
                    input.snapshot.summary.body,
                    320,
                    input.visionObservation,
                ),
            },
            reading: {
                oneLiner: safeText(
                    draft.reading.oneLiner,
                    input.snapshot.reading.oneLiner,
                    180,
                    input.visionObservation,
                ),
                shortParagraph: safeText(
                    draft.reading.shortParagraph,
                    input.snapshot.reading.shortParagraph,
                    520,
                    input.visionObservation,
                ),
            },
            proof: safeProofItems(draft.proof, input.snapshot.proof, input.visionObservation),
            spaceState: {
                ...input.snapshot.spaceState,
                coreGap: safeText(
                    draft.spaceState.coreGap,
                    input.snapshot.spaceState.coreGap,
                    220,
                    input.visionObservation,
                ),
            },
            tension: {
                headline: safeText(
                    draft.tension.headline,
                    input.snapshot.tension.headline,
                    140,
                    input.visionObservation,
                ),
                explanation: safeText(
                    draft.tension.explanation,
                    input.snapshot.tension.explanation,
                    240,
                    input.visionObservation,
                ),
            },
            firstShift: {
                ...input.snapshot.firstShift,
                title: safeText(
                    suitcaseFirstShift?.title ?? draft.firstShift.title,
                    input.snapshot.firstShift.title,
                    100,
                    input.visionObservation,
                ),
                action,
                whyItHelps: safeText(
                    draft.firstShift.whyItHelps,
                    input.snapshot.firstShift.whyItHelps,
                    180,
                    input.visionObservation,
                ),
                examples: examples.length > 0 ? examples : input.snapshot.firstShift.examples.slice(0, 3),
            },
            brandHook: {
                title: safeText(
                    draft.brandHook.title,
                    input.snapshot.brandHook.title,
                    110,
                    input.visionObservation,
                ),
                subtitle: safeText(
                    draft.brandHook.subtitle,
                    input.snapshot.brandHook.subtitle,
                    150,
                    input.visionObservation,
                ),
                signals: safeList(
                    draft.brandHook.signals,
                    input.snapshot.brandHook.signals,
                    3,
                    90,
                    input.visionObservation,
                ),
            },
            preview: {
                ...input.snapshot.preview,
                hiddenFindings: safeList(
                    draft.preview.hiddenFindings,
                    input.snapshot.preview.hiddenFindings,
                    3,
                    150,
                    input.visionObservation,
                    { paidTeaser: true },
                ),
                fullReportPromise: safeText(
                    draft.preview.fullReportPromise,
                    input.snapshot.preview.fullReportPromise,
                    220,
                    input.visionObservation,
                    { paidTeaser: true },
                ),
            },
            meta: {
                ...input.snapshot.meta,
                generationMode: "templated_plus_llm",
            },
        },
        diagnosisUsed: true,
        modelName: diagnosisResult.model || SNAPSHOT_DIAGNOSIS_MODEL_NAME,
        promptVersion: SNAPSHOT_DIAGNOSIS_PROMPT_VERSION,
        schemaVersion: SNAPSHOT_DIAGNOSIS_SCHEMA_VERSION,
    };
}
