import type { SnapshotResultV2 } from "@/lib/align-v2/contracts";
import type { NormalizedAnalysisInput, ScoreResult, VisionObservation } from "@/types";
import {
    SNAPSHOT_WRITER_MODEL_NAME,
    SNAPSHOT_WRITER_PROMPT_VERSION,
    SNAPSHOT_WRITER_SCHEMA_VERSION,
} from "@/lib/analysis-pipeline";

type ApplySnapshotWriterLayerInput = {
    normalizedInput: NormalizedAnalysisInput;
    visionObservation: VisionObservation;
    scoreResult: ScoreResult;
    snapshot: SnapshotResultV2;
    force?: boolean;
};

type ApplySnapshotWriterLayerResult = {
    snapshot: SnapshotResultV2;
    writerUsed: boolean;
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
    "game-changing",
    "instant",
    "overhaul",
    "reset",
    "cradle",
];

function isSnapshotWriterEnabled(force = false) {
    if (force) {
        return true;
    }

    const flag = process.env.ENABLE_SNAPSHOT_WRITER_LAYER;
    return flag !== "false";
}

function normalizeLine(value: string, maxLength: number) {
    const compact = value.replace(/\s+/g, " ").trim();
    if (!compact) {
        return "";
    }

    return compact.length > maxLength ? `${compact.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…` : compact;
}

function containsForbiddenCopy(value: string) {
    const lowered = value.toLowerCase();
    return FORBIDDEN_COPY.some((token) => lowered.includes(token));
}

function safeRewrite(value: string, fallback: string, maxLength: number) {
    const normalized = normalizeLine(value, maxLength);
    if (!normalized || containsForbiddenCopy(normalized)) {
        return fallback;
    }

    return normalized;
}

function safeParagraph(value: string, fallback: string, maxLength: number) {
    const normalized = normalizeLine(value, maxLength);
    if (!normalized || containsForbiddenCopy(normalized)) {
        return fallback;
    }

    return normalized;
}

function actionMentionsTargetZone(action: string, targetZone: string) {
    const actionLower = action.toLowerCase();
    const zoneLower = targetZone.toLowerCase();
    return actionLower.includes(zoneLower) || zoneLower.split(/\s+/).some((part) => part.length > 4 && actionLower.includes(part));
}

export async function applySnapshotWriterLayer(
    input: ApplySnapshotWriterLayerInput,
): Promise<ApplySnapshotWriterLayerResult> {
    if (!isSnapshotWriterEnabled(input.force)) {
        return {
            snapshot: input.snapshot,
            writerUsed: false,
            modelName: null,
            promptVersion: null,
            schemaVersion: null,
        };
    }

    // Delay import so local preview/eval scripts can load env first.
    const { generateSnapshotWriterCopy } = await import("@/lib/gemini");
    const writerResult = await generateSnapshotWriterCopy(
        input.normalizedInput,
        input.visionObservation,
        input.scoreResult,
        input.snapshot,
    );

    if (!writerResult) {
        return {
            snapshot: input.snapshot,
            writerUsed: false,
            modelName: null,
            promptVersion: null,
            schemaVersion: null,
        };
    }

    const rewrittenAction = safeRewrite(
        writerResult.data.firstShift.action,
        input.snapshot.firstShift.action,
        200,
    );

    const nextSnapshot: SnapshotResultV2 = {
        ...input.snapshot,
        summary: {
            ...input.snapshot.summary,
            headline: safeRewrite(
                writerResult.data.summary.headline,
                input.snapshot.summary.headline,
                140,
            ),
            body: safeParagraph(
                writerResult.data.summary.body,
                input.snapshot.summary.body,
                260,
            ),
        },
        reading: {
            oneLiner: safeRewrite(
                writerResult.data.reading.oneLiner,
                input.snapshot.reading.oneLiner,
                180,
            ),
            shortParagraph: safeParagraph(
                writerResult.data.reading.shortParagraph,
                input.snapshot.reading.shortParagraph,
                420,
            ),
        },
        firstShift: {
            ...input.snapshot.firstShift,
            action: actionMentionsTargetZone(rewrittenAction, input.snapshot.firstShift.targetZone)
                ? rewrittenAction
                : input.snapshot.firstShift.action,
            whyItHelps: safeRewrite(
                writerResult.data.firstShift.whyItHelps,
                input.snapshot.firstShift.whyItHelps,
                180,
            ),
        },
        brandHook: {
            ...input.snapshot.brandHook,
            title: safeRewrite(
                writerResult.data.brandHook.title,
                input.snapshot.brandHook.title,
                110,
            ),
            subtitle: safeRewrite(
                writerResult.data.brandHook.subtitle,
                input.snapshot.brandHook.subtitle,
                140,
            ),
        },
        meta: {
            ...input.snapshot.meta,
            generationMode: "templated_plus_llm",
        },
    };

    return {
        snapshot: nextSnapshot,
        writerUsed: true,
        modelName: SNAPSHOT_WRITER_MODEL_NAME,
        promptVersion: SNAPSHOT_WRITER_PROMPT_VERSION,
        schemaVersion: SNAPSHOT_WRITER_SCHEMA_VERSION,
    };
}
