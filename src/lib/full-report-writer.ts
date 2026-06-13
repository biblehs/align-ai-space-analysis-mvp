import type { FullReportArtifact, NormalizedAnalysisInput, ScoreResult, VisionObservation } from "@/types";
import type { SnapshotResultV2 } from "@/lib/align-v2/contracts";
import {
    FULL_REPORT_WRITER_MODEL_NAME,
    FULL_REPORT_WRITER_PROMPT_VERSION,
    FULL_REPORT_WRITER_SCHEMA_VERSION,
} from "@/lib/analysis-pipeline";

type ApplyFullReportWriterLayerInput = {
    normalizedInput: NormalizedAnalysisInput | null;
    visionObservation: VisionObservation | null;
    scoreResult: ScoreResult | null;
    snapshot: SnapshotResultV2;
    fullReport: FullReportArtifact;
    force?: boolean;
};

type ApplyFullReportWriterLayerResult = {
    fullReport: FullReportArtifact;
    writerUsed: boolean;
    modelName: string | null;
    promptVersion: string | null;
    schemaVersion: string | null;
};

const FORBIDDEN_COPY = [
    "trauma",
    "diagnosis",
    "medical",
    "chakra",
    "frequency",
    "healing aura",
    "game-changing",
    "instant",
    "overhaul",
    "reset",
];

const WINDOW_INFERENCE_TOKENS = [
    "natural light",
    "window",
    "windows",
];

function isFullReportWriterEnabled(force = false) {
    if (force) return true;
    const flag = process.env.ENABLE_FULL_REPORT_WRITER_LAYER;
    return flag !== "false";
}

function normalizeLine(value: string, maxLength: number) {
    const compact = value.replace(/\s+/g, " ").trim();
    if (!compact) return "";
    return compact.length > maxLength ? `${compact.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…` : compact;
}

function containsForbiddenCopy(value: string) {
    const lowered = value.toLowerCase();
    return FORBIDDEN_COPY.some((token) => lowered.includes(token));
}

function reportHasVisibleWindowSupport(input: ApplyFullReportWriterLayerInput) {
    const haystacks = [
        input.visionObservation?.observationSummary,
        input.visionObservation?.layoutSummary,
        input.visionObservation?.lightingSummary,
        input.visionObservation?.colorSummary,
        ...(input.visionObservation?.standoutFeatures ?? []),
        ...(input.visionObservation?.supportZones ?? []),
        ...(input.visionObservation?.stressZones ?? []),
        ...(input.visionObservation?.observations ?? []).map((item) => item.evidence),
    ]
        .filter(Boolean)
        .map((value) => value!.toLowerCase());

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

function containsUnsupportedWindowInference(value: string, input: ApplyFullReportWriterLayerInput) {
    if (reportHasVisibleWindowSupport(input)) {
        return false;
    }

    const lowered = value.toLowerCase();
    return WINDOW_INFERENCE_TOKENS.some((token) => lowered.includes(token));
}

function safeRewrite(value: string, fallback: string, maxLength: number, input?: ApplyFullReportWriterLayerInput) {
    const normalized = normalizeLine(value, maxLength);
    if (!normalized || containsForbiddenCopy(normalized) || (input && containsUnsupportedWindowInference(normalized, input))) {
        return fallback;
    }
    return normalized;
}

export async function applyFullReportWriterLayer(
    input: ApplyFullReportWriterLayerInput,
): Promise<ApplyFullReportWriterLayerResult> {
    if (!isFullReportWriterEnabled(input.force)) {
        return {
            fullReport: input.fullReport,
            writerUsed: false,
            modelName: null,
            promptVersion: null,
            schemaVersion: null,
        };
    }

    const { generateFullReportWriterCopy } = await import("@/lib/gemini");
    const writerResult = await generateFullReportWriterCopy({
        normalizedInput: input.normalizedInput,
        visionObservation: input.visionObservation,
        scoreResult: input.scoreResult,
        snapshot: input.snapshot,
        fullReport: input.fullReport,
    });

    if (!writerResult) {
        return {
            fullReport: input.fullReport,
            writerUsed: false,
            modelName: null,
            promptVersion: null,
            schemaVersion: null,
        };
    }

    const sectionBodyByKey = new Map(
        writerResult.data.sections.map((section) => [section.key, section.body] as const),
    );

    const nextFullReport: FullReportArtifact = {
        ...input.fullReport,
        summary: {
            ...input.fullReport.summary,
            overview: safeRewrite(
                writerResult.data.summary.overview,
                input.fullReport.summary.overview,
                900,
                input,
            ),
            strategy: safeRewrite(
                writerResult.data.summary.strategy,
                input.fullReport.summary.strategy,
                260,
                input,
            ),
        },
        sections: input.fullReport.sections.map((section) => ({
            ...section,
            body: safeRewrite(
                sectionBodyByKey.get(section.key) ?? "",
                section.body,
                900,
                input,
            ),
        })),
        stateRitual: input.fullReport.stateRitual
            ? {
                ...input.fullReport.stateRitual,
                title: safeRewrite(
                    writerResult.data.stateRitual.title,
                    input.fullReport.stateRitual.title,
                    90,
                    input,
                ),
                body: safeRewrite(
                    writerResult.data.stateRitual.body,
                    input.fullReport.stateRitual.body,
                    360,
                    input,
                ),
                feltShiftTitle: safeRewrite(
                    writerResult.data.stateRitual.feltShiftTitle,
                    input.fullReport.stateRitual.feltShiftTitle,
                    90,
                    input,
                ),
                feltShiftBody: safeRewrite(
                    writerResult.data.stateRitual.feltShiftBody,
                    input.fullReport.stateRitual.feltShiftBody,
                    320,
                    input,
                ),
            }
            : undefined,
    };

    return {
        fullReport: nextFullReport,
        writerUsed: true,
        modelName: FULL_REPORT_WRITER_MODEL_NAME,
        promptVersion: FULL_REPORT_WRITER_PROMPT_VERSION,
        schemaVersion: FULL_REPORT_WRITER_SCHEMA_VERSION,
    };
}
