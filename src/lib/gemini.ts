import { GoogleGenAI } from "@google/genai";
import { ANALYSIS_MODEL_NAME, FULL_REPORT_WRITER_MODEL_NAME, SNAPSHOT_DIAGNOSIS_MODEL_NAME, SNAPSHOT_WRITER_MODEL_NAME } from "@/lib/analysis-pipeline";
import { fullReportWriterSchema, roomPreAnalysisSchema, snapshotDiagnosisSchema, snapshotSchema, snapshotWriterSchema, visionObservationSchema } from "./schema";
import {
    getFullReportWriterPrompt,
    getAnalyzeFromPreAnalysisPrompt,
    getAnalyzePrompt,
    getRoomPreAnalysisPrompt,
    getSnapshotDiagnosisPrompt,
    getSnapshotFromArtifactsPrompt,
    getSnapshotWriterPrompt,
    getVisionObservationPrompt,
} from "./prompt";
import type {
    FullReportArtifact,
    GoalData,
    NormalizedAnalysisInput,
    RoomPreAnalysis,
    ScoreResult,
    SnapshotResult,
    SpaceData,
    VisionObservation,
} from "@/types";
import type { SnapshotResultV2 } from "@/lib/align-v2/contracts";

export const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

type VisionSnapshotResponse = SnapshotResult & {
    isRoomPhoto: boolean;
    isUsablePhoto: boolean;
    validationReason: string;
};

export type GeminiUsageMetrics = {
    promptTokenCount: number | null;
    candidatesTokenCount: number | null;
    thoughtsTokenCount: number | null;
    totalTokenCount: number | null;
    promptTokensDetails: Array<{ modality: string | null; tokenCount: number | null }>;
    candidatesTokensDetails: Array<{ modality: string | null; tokenCount: number | null }>;
};

type GenerateJsonResponseResult<T> = {
    data: T;
    usage: GeminiUsageMetrics;
    model: string;
};

function readPositiveIntegerEnv(name: string, fallback: number) {
    const raw = process.env[name];
    if (!raw) {
        return fallback;
    }

    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error(`${label} timed out after ${timeoutMs}ms`));
        }, timeoutMs);

        promise.then(
            (value) => {
                clearTimeout(timeout);
                resolve(value);
            },
            (error) => {
                clearTimeout(timeout);
                reject(error);
            },
        );
    });
}

function normalizeTokenDetails(
    details:
        | Array<{
              modality?: unknown;
              tokenCount?: number;
          }>
        | undefined,
) {
    return (details ?? []).map((detail) => ({
        modality: typeof detail.modality === "string" ? detail.modality : detail.modality ? String(detail.modality) : null,
        tokenCount: typeof detail.tokenCount === "number" ? detail.tokenCount : null,
    }));
}

async function generateJsonResponse<T>(
    contents: Array<string | { inlineData: { data: string; mimeType: string } }>,
    responseSchema: object,
    config?: {
        temperature?: number;
        model?: string;
        timeoutMs?: number;
        maxOutputTokens?: number;
        thinkingBudget?: number;
    },
): Promise<GenerateJsonResponseResult<T> | null> {
    const model = config?.model ?? ANALYSIS_MODEL_NAME;
    const responsePromise = gemini.models.generateContent({
        model,
        contents,
        config: {
            responseMimeType: "application/json",
            responseSchema,
            temperature: config?.temperature ?? 0.2,
            ...(typeof config?.maxOutputTokens === "number" ? { maxOutputTokens: config.maxOutputTokens } : {}),
            ...(typeof config?.thinkingBudget === "number"
                ? { thinkingConfig: { thinkingBudget: config.thinkingBudget } }
                : {}),
        },
    });
    const response = config?.timeoutMs
        ? await withTimeout(responsePromise, config.timeoutMs, `${model} generation`)
        : await responsePromise;

    if (!response.text) {
        return null;
    }

    return {
        data: JSON.parse(response.text) as T,
        usage: {
            promptTokenCount: response.usageMetadata?.promptTokenCount ?? null,
            candidatesTokenCount: response.usageMetadata?.candidatesTokenCount ?? null,
            thoughtsTokenCount: response.usageMetadata?.thoughtsTokenCount ?? null,
            totalTokenCount: response.usageMetadata?.totalTokenCount ?? null,
            promptTokensDetails: normalizeTokenDetails(response.usageMetadata?.promptTokensDetails),
            candidatesTokensDetails: normalizeTokenDetails(response.usageMetadata?.candidatesTokensDetails),
        },
        model,
    };
}

export async function generateSpaceSnapshot(
    spaceData: SpaceData,
    goalData: GoalData,
    imgBuffer: ArrayBuffer,
    mimeType: string
): Promise<GenerateJsonResponseResult<VisionSnapshotResponse> | null> {
    try {
        const prompt = getAnalyzePrompt(spaceData, goalData);
        return await generateJsonResponse<VisionSnapshotResponse>(
            [
                { inlineData: { data: Buffer.from(imgBuffer).toString("base64"), mimeType } },
                prompt,
            ],
            snapshotSchema,
        );
    } catch (error) {
        console.error("Gemini AI API Error:", error);
        return null; // Return null so the route can fallback to deterministic logic
    }
}

export async function generateRoomPreAnalysis(
    spaceData: SpaceData,
    imgBuffer: ArrayBuffer,
    mimeType: string,
): Promise<GenerateJsonResponseResult<RoomPreAnalysis> | null> {
    try {
        const prompt = getRoomPreAnalysisPrompt(spaceData);
        return await generateJsonResponse<RoomPreAnalysis>(
            [
                { inlineData: { data: Buffer.from(imgBuffer).toString("base64"), mimeType } },
                prompt,
            ],
            roomPreAnalysisSchema,
        );
    } catch (error) {
        console.error("Gemini pre-analysis API Error:", error);
        return null;
    }
}

export async function generateVisionObservation(
    spaceData: SpaceData,
    imgBuffer: ArrayBuffer,
    mimeType: string,
): Promise<GenerateJsonResponseResult<VisionObservation> | null> {
    const prompt = getVisionObservationPrompt(spaceData);
    const parts = [
        { inlineData: { data: Buffer.from(imgBuffer).toString("base64"), mimeType } },
        prompt,
    ];
    const maxAttempts = Math.min(3, readPositiveIntegerEnv("GEMINI_VISION_MAX_ATTEMPTS", 2));
    const timeoutMs = readPositiveIntegerEnv("GEMINI_VISION_TIMEOUT_MS", 14000);

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
            return await generateJsonResponse<VisionObservation>(
                parts,
                visionObservationSchema,
                { temperature: 0.1, timeoutMs, maxOutputTokens: 1400, thinkingBudget: 0 },
            );
        } catch (error) {
            if (attempt >= maxAttempts) {
                console.error("Gemini vision observation API Error:", error);
                return null;
            }

            await new Promise((resolve) => setTimeout(resolve, attempt * 750));
        }
    }

    return null;
}

export async function generateSpaceSnapshotFromPreAnalysis(
    spaceData: SpaceData,
    goalData: GoalData,
    preAnalysis: RoomPreAnalysis,
): Promise<GenerateJsonResponseResult<VisionSnapshotResponse> | null> {
    try {
        const prompt = getAnalyzeFromPreAnalysisPrompt(spaceData, goalData, preAnalysis);
        return await generateJsonResponse<VisionSnapshotResponse>([prompt], snapshotSchema);
    } catch (error) {
        console.error("Gemini AI API Error:", error);
        return null; // Return null so the route can fallback to deterministic logic
    }
}

export async function generateSpaceSnapshotFromArtifacts(
    normalizedInput: NormalizedAnalysisInput,
    visionObservation: VisionObservation,
    scoreResult: ScoreResult,
): Promise<GenerateJsonResponseResult<VisionSnapshotResponse> | null> {
    try {
        const prompt = getSnapshotFromArtifactsPrompt(normalizedInput, visionObservation, scoreResult);
        return await generateJsonResponse<VisionSnapshotResponse>([prompt], snapshotSchema);
    } catch (error) {
        console.error("Gemini artifact snapshot API Error:", error);
        return null;
    }
}

export type SnapshotWriterResponse = {
    summary: {
        headline: string;
        body: string;
    };
    reading: {
        oneLiner: string;
        shortParagraph: string;
    };
    firstShift: {
        action: string;
        whyItHelps: string;
    };
    brandHook: {
        title: string;
        subtitle: string;
    };
};

export type SnapshotDiagnosisResponse = {
    summary: {
        headline: string;
        body: string;
    };
    reading: {
        oneLiner: string;
        shortParagraph: string;
    };
    tension: {
        headline: string;
        explanation: string;
    };
    proof: Array<{
        label: string;
        evidence: string;
        impact: "positive" | "negative" | "mixed";
    }>;
    spaceState: {
        coreGap: string;
    };
    firstShift: {
        title: string;
        action: string;
        whyItHelps: string;
        examples: string[];
    };
    brandHook: {
        title: string;
        subtitle: string;
        signals: string[];
    };
    preview: {
        hiddenFindings: string[];
        fullReportPromise: string;
    };
};

export async function generateSnapshotDiagnosis(
    normalizedInput: NormalizedAnalysisInput,
    visionObservation: VisionObservation,
    scoreResult: ScoreResult,
    snapshot: SnapshotResultV2,
): Promise<GenerateJsonResponseResult<SnapshotDiagnosisResponse> | null> {
    const prompt = getSnapshotDiagnosisPrompt(normalizedInput, visionObservation, scoreResult, snapshot);
    const maxAttempts = Math.min(3, readPositiveIntegerEnv("GEMINI_SNAPSHOT_DIAGNOSIS_MAX_ATTEMPTS", 2));
    const timeoutMs = readPositiveIntegerEnv("GEMINI_SNAPSHOT_DIAGNOSIS_TIMEOUT_MS", 10000);

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
            return await generateJsonResponse<SnapshotDiagnosisResponse>(
                [prompt],
                snapshotDiagnosisSchema,
                {
                    temperature: 0.28,
                    model: SNAPSHOT_DIAGNOSIS_MODEL_NAME,
                    timeoutMs,
                    maxOutputTokens: 1100,
                    thinkingBudget: 0,
                },
            );
        } catch (error) {
            if (attempt >= maxAttempts) {
                console.error("Gemini snapshot diagnosis API Error:", error);
                return null;
            }

            await new Promise((resolve) => setTimeout(resolve, attempt * 800));
        }
    }

    return null;
}

export type FullReportWriterResponse = {
    summary: {
        overview: string;
        strategy: string;
    };
    sections: Array<{
        key: string;
        body: string;
    }>;
    stateRitual: {
        title: string;
        body: string;
        feltShiftTitle: string;
        feltShiftBody: string;
    };
};

export async function generateSnapshotWriterCopy(
    normalizedInput: NormalizedAnalysisInput,
    visionObservation: VisionObservation,
    scoreResult: ScoreResult,
    snapshot: SnapshotResultV2,
): Promise<GenerateJsonResponseResult<SnapshotWriterResponse> | null> {
    try {
        const prompt = getSnapshotWriterPrompt(normalizedInput, visionObservation, scoreResult, snapshot);
        return await generateJsonResponse<SnapshotWriterResponse>(
            [prompt],
            snapshotWriterSchema,
            {
                temperature: 0.35,
                model: SNAPSHOT_WRITER_MODEL_NAME,
                timeoutMs: readPositiveIntegerEnv("GEMINI_SNAPSHOT_WRITER_TIMEOUT_MS", 9000),
                maxOutputTokens: 550,
                thinkingBudget: 0,
            },
        );
    } catch (error) {
        console.error("Gemini snapshot writer API Error:", error);
        return null;
    }
}

export async function generateFullReportWriterCopy(input: {
    normalizedInput: NormalizedAnalysisInput | null;
    visionObservation: VisionObservation | null;
    scoreResult: ScoreResult | null;
    snapshot: SnapshotResultV2;
    fullReport: FullReportArtifact;
}): Promise<GenerateJsonResponseResult<FullReportWriterResponse> | null> {
    try {
        const prompt = getFullReportWriterPrompt(input);
        return await generateJsonResponse<FullReportWriterResponse>(
            [prompt],
            fullReportWriterSchema,
            {
                temperature: 0.3,
                model: FULL_REPORT_WRITER_MODEL_NAME,
            },
        );
    } catch (error) {
        console.error("Gemini full report writer API Error:", error);
        return null;
    }
}
