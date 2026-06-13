import { logger } from "@/lib/logger";
import { ANALYSIS_PREANALYSIS_VERSION } from "@/lib/analysis-pipeline";
import { buildPreAnalysisFromVisionObservation, buildVisionObservationFromPreAnalysis } from "@/lib/analysis-artifacts";
import { createAnalyticsEvent } from "@/lib/repositories/analytics-repository";
import { claimRoomPreAnalysisProcessing, recordAnalysisArtifact, updateAnalysisProgress } from "@/lib/repositories/analysis-repository";
import { generateRoomPreAnalysis, generateVisionObservation } from "@/lib/gemini";
import { preprocessImage } from "@/lib/image";
import {
    downloadRoomPhoto,
    loadRoomPreAnalysisArtifact,
    saveRoomPreAnalysisArtifact,
} from "@/lib/services/room-photo-service";
import type { Json } from "@/types/database";
import type { RoomPreAnalysis, SpaceData } from "@/types";

function isAllowedUploadedPhotoPath(photoPath: string) {
    return photoPath.startsWith("uploads/") && !photoPath.includes("..");
}

function normalizeUploadedPhotoUrl(photoUrl: string | null | undefined) {
    const trimmed = photoUrl?.trim();
    return trimmed || null;
}

function toExactArrayBuffer(buffer: Buffer) {
    return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
}

function isAllowedUploadedPhotoUrl(photoUrl: string) {
    const normalizedPhotoUrl = normalizeUploadedPhotoUrl(photoUrl);
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    if (!supabaseUrl) {
        return false;
    }

    return Boolean(
        normalizedPhotoUrl &&
        normalizedPhotoUrl.startsWith(`${supabaseUrl}/storage/v1/object/public/room-photos/`),
    );
}

type PreAnalysisInput = {
    analysisId: string;
    requestPath: string;
    sessionId: string | null;
    spaceData: SpaceData;
    userId?: string | null;
};

type PreAnalysisStartStatus = "not_needed" | "cached" | "started" | "already_processing" | "completed_elsewhere" | "failed";
export type PreAnalysisStartResult = { status: PreAnalysisStartStatus };

const activeRoomPreAnalysis = new Map<string, Promise<PreAnalysisStartResult>>();

async function measureStep<T>(
    timings: Record<string, number>,
    stepName: string,
    operation: () => Promise<T>,
) {
    const startedAt = Date.now();
    try {
        return await operation();
    } finally {
        timings[stepName] = Date.now() - startedAt;
    }
}

export async function startRoomPreAnalysis(input: PreAnalysisInput): Promise<PreAnalysisStartResult> {
    const active = activeRoomPreAnalysis.get(input.analysisId);
    if (active) {
        return { status: "already_processing" };
    }

    const task = runRoomPreAnalysis(input).finally(() => {
        activeRoomPreAnalysis.delete(input.analysisId);
    });
    activeRoomPreAnalysis.set(input.analysisId, task);
    return task;
}

async function runRoomPreAnalysis(input: PreAnalysisInput): Promise<PreAnalysisStartResult> {
    const { analysisId, requestPath, sessionId, spaceData, userId } = input;
    const normalizedPhotoUrl = normalizeUploadedPhotoUrl(spaceData.photoUrl);
    const effectiveSpaceData = normalizedPhotoUrl === spaceData.photoUrl
        ? spaceData
        : {
            ...spaceData,
            photoUrl: normalizedPhotoUrl ?? undefined,
        };
    const track = (eventName: "preanalysis_started" | "preanalysis_completed" | "preanalysis_failed", properties?: Record<string, unknown>) =>
        createAnalyticsEvent({
            eventName,
            userId: userId ?? null,
            sessionId,
            analysisId,
            pagePath: requestPath,
            eventSource: "preanalysis-worker",
            properties: (properties ?? {}) as Json,
        });

    const startedAt = Date.now();
    const timings: Record<string, number> = {};

    try {
        if (!effectiveSpaceData.photoPath && !effectiveSpaceData.photoUrl) {
            return { status: "not_needed" as const };
        }

        const cached = await loadRoomPreAnalysisArtifact(analysisId);
        if (cached) {
            await updateAnalysisProgress(analysisId, {
                pipelineStage: "preanalysis_completed",
                pipelineStatus: "processing",
                preanalysisStatus: "completed",
                preanalysisVersion: ANALYSIS_PREANALYSIS_VERSION,
            });
            return { status: "cached" as const };
        }

        const claimStatus = await claimRoomPreAnalysisProcessing(analysisId);
        if (claimStatus === "completed") {
            return { status: "completed_elsewhere" as const };
        }

        if (claimStatus === "already_processing") {
            return { status: "already_processing" as const };
        }

        if (claimStatus === "missing") {
            logger.warn("Room pre-analysis skipped because analysis record is not ready", {
                analysisId,
            });
            return { status: "not_needed" as const };
        }

        if (claimStatus !== "claimed") {
            return { status: "failed" as const };
        }

        await track("preanalysis_started", {
            hasPhotoPath: Boolean(effectiveSpaceData.photoPath),
            hasPhotoUrl: Boolean(effectiveSpaceData.photoUrl),
        });

        if (effectiveSpaceData.photoPath && !isAllowedUploadedPhotoPath(effectiveSpaceData.photoPath)) {
            throw new Error("Pre-analysis photo path must come from the verified upload pipeline.");
        }

        if (!effectiveSpaceData.photoPath && effectiveSpaceData.photoUrl && !isAllowedUploadedPhotoUrl(effectiveSpaceData.photoUrl)) {
            throw new Error("Pre-analysis photo URL must come from the verified upload pipeline.");
        }

        let imgBuffer: ArrayBuffer | null = null;
        let rawMimeType = "image/jpeg";

        if (effectiveSpaceData.photoPath) {
            const downloadedPhoto = await measureStep(timings, "preanalysis_download_photo_ms", () =>
                downloadRoomPhoto(effectiveSpaceData.photoPath!),
            );
            if (!downloadedPhoto) {
                throw new Error("Unable to read the uploaded image for pre-analysis.");
            }

            imgBuffer = downloadedPhoto.buffer;
            rawMimeType = downloadedPhoto.mimeType;
        } else if (effectiveSpaceData.photoUrl) {
            const img = await measureStep(timings, "preanalysis_fetch_photo_url_ms", () =>
                fetch(effectiveSpaceData.photoUrl!),
            );
            if (!img.ok) {
                throw new Error("Unable to read the uploaded image for pre-analysis.");
            }

            imgBuffer = await measureStep(timings, "preanalysis_read_photo_buffer_ms", () => img.arrayBuffer());
            rawMimeType = img.headers.get("content-type") || "image/jpeg";
        }

        if (!imgBuffer) {
            throw new Error("Unable to read the uploaded image for pre-analysis.");
        }

        const shouldSkipPreprocess = rawMimeType.toLowerCase().includes("jpeg");
        const { data: processedBuffer, mimeType } = shouldSkipPreprocess
            ? { data: Buffer.from(imgBuffer), mimeType: "image/jpeg" }
            : await measureStep(timings, "preanalysis_preprocess_image_ms", () =>
                preprocessImage(imgBuffer, rawMimeType),
            );
        const aiImageBuffer = toExactArrayBuffer(processedBuffer);

        const aiResult = await measureStep(timings, "preanalysis_gemini_vision_ms", () =>
            generateVisionObservation(effectiveSpaceData, aiImageBuffer, mimeType),
        );
        const preAnalysis = aiResult
            ? buildPreAnalysisFromVisionObservation(aiResult.data)
            : await measureStep(timings, "preanalysis_gemini_room_preanalysis_rescue_ms", async () => {
                const roomResult = await generateRoomPreAnalysis(effectiveSpaceData, aiImageBuffer, mimeType);
                return roomResult?.data ?? null;
            });

        if (!preAnalysis) {
            throw new Error("Vision extraction returned no structured result.");
        }

        const saved = await measureStep(timings, "preanalysis_save_artifact_ms", () =>
            saveRoomPreAnalysisArtifact(analysisId, preAnalysis as RoomPreAnalysis),
        );
        if (!saved) {
            throw new Error("Unable to save room pre-analysis.");
        }

        await measureStep(timings, "preanalysis_record_vision_artifact_ms", () =>
            recordAnalysisArtifact({
                analysisId,
                artifactType: "vision_observation",
                artifactVersion: ANALYSIS_PREANALYSIS_VERSION,
                payload: (aiResult?.data ?? buildVisionObservationFromPreAnalysis(preAnalysis)) as unknown as Json,
            }),
        );

        await updateAnalysisProgress(analysisId, {
            pipelineStage: "preanalysis_completed",
            pipelineStatus: "processing",
            preanalysisStatus: "completed",
            preanalysisVersion: ANALYSIS_PREANALYSIS_VERSION,
            preanalysisGeneratedAt: new Date().toISOString(),
        });

        timings.preanalysis_total_ms = Date.now() - startedAt;

        await track("preanalysis_completed", {
            usable: preAnalysis.isUsablePhoto,
            durationMs: timings.preanalysis_total_ms,
            preprocessingSkipped: shouldSkipPreprocess,
            rescueUsed: !aiResult,
            timings,
        });

        return { status: "started" as const };
    } catch (error) {
        await updateAnalysisProgress(analysisId, {
            pipelineStage: "preanalysis_processing",
            pipelineStatus: "processing",
            preanalysisStatus: "failed",
            lastErrorCode: "preanalysis_failed",
            lastErrorMessage: error instanceof Error ? error.message : "internal_server_error",
            preanalysisVersion: ANALYSIS_PREANALYSIS_VERSION,
        });
        timings.preanalysis_total_ms = Date.now() - startedAt;

        await track("preanalysis_failed", {
            durationMs: timings.preanalysis_total_ms,
            reason: error instanceof Error ? error.message : "internal_server_error",
            timings,
        });
        logger.warn("Room pre-analysis failed", {
            analysisId,
            error: error instanceof Error ? error.message : String(error),
        });
        return { status: "failed" as const };
    }
}

export async function waitForRoomPreAnalysis(
    analysisId: string,
    input?: { timeoutMs?: number; pollIntervalMs?: number },
) {
    const timeoutMs = input?.timeoutMs ?? 2500;
    const pollIntervalMs = input?.pollIntervalMs ?? 500;
    const deadline = Date.now() + timeoutMs;

    while (Date.now() <= deadline) {
        const artifact = await loadRoomPreAnalysisArtifact(analysisId);
        if (artifact) {
            return artifact;
        }

        await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    return null;
}
