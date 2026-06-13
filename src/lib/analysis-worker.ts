import {
    ANALYSIS_INPUT_VERSION,
    ANALYSIS_MODEL_NAME,
    ANALYSIS_PREANALYSIS_VERSION,
    ANALYSIS_PROMPT_VERSION,
    ANALYSIS_SCHEMA_VERSION,
    ANALYSIS_SCORING_VERSION,
} from "@/lib/analysis-pipeline";
import {
    ANALYSIS_ARTIFACT_VERSIONS,
    buildNoteInterpretation,
    buildPatternDiagnosis,
    buildNormalizedAnalysisInput,
    buildScoreResult,
    buildSnapshotFromArtifactsV2,
    buildVisionObservationFromPreAnalysis,
} from "@/lib/analysis-artifacts";
import { buildVisionValidationV2 } from "@/lib/align-v2/builders";
import { buildFallbackSnapshotV2 } from "@/lib/align-v2/snapshot-adapters";
import type { SnapshotResultV2 } from "@/lib/align-v2/contracts";
import { logger } from "@/lib/logger";
import { startRoomPreAnalysis, waitForRoomPreAnalysis } from "@/lib/preanalysis-worker";
import { createAnalyticsEvent } from "@/lib/repositories/analytics-repository";
import {
    getAnalysisStatusRecord,
    markAnalysisActionRequired,
    markAnalysisFailed,
    recordAnalysisArtifact,
    saveAnalysisSnapshotRecord,
    updateAnalysisProgress,
} from "@/lib/repositories/analysis-repository";
import { getActiveAnalysisJobCount, upsertAnalysisJob } from "@/lib/repositories/security-repository";
import { MAX_CONCURRENT_ANALYSIS_JOBS } from "@/lib/security";
import { applySnapshotDiagnosisLayer } from "@/lib/snapshot-diagnosis";
import { applySnapshotWriterLayer } from "@/lib/snapshot-writer";
import type { Json } from "@/types/database";
import type { GoalData, NormalizedAnalysisInput, RoomPreAnalysis, ScoreResult, SpaceData, VisionObservation } from "@/types";

function isAllowedUploadedPhotoPath(photoPath: string) {
    return photoPath.startsWith("uploads/") && !photoPath.includes("..");
}

const PHOTO_ANALYSIS_FAILED_MESSAGE =
    "We couldn't read this photo clearly enough to generate a trustworthy Snapshot. Please upload a brighter, wider room photo and try again.";

function normalizeUploadedPhotoUrl(photoUrl: string | null | undefined) {
    const trimmed = photoUrl?.trim();
    return trimmed || null;
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

type ProcessAnalysisRequestInput = {
    analysisId: string;
    goalData: GoalData;
    jobAttemptCount?: number | null;
    requestIpHash: string | null;
    requestPath: string;
    sessionId: string | null;
    spaceData: SpaceData;
    user: { id: string; email: string | null } | null;
};

async function recordArtifactBundle(input: {
    analysisId: string;
    normalizedInput: NormalizedAnalysisInput;
    visionObservation: VisionObservation;
    scoreResult: ScoreResult;
    noteInterpretation?: unknown;
    patternDiagnosis?: unknown;
}) {
    await recordAnalysisArtifact({
        analysisId: input.analysisId,
        artifactType: "normalized_input",
        artifactVersion: ANALYSIS_INPUT_VERSION,
        payload: input.normalizedInput as unknown as Json,
    });
    await recordAnalysisArtifact({
        analysisId: input.analysisId,
        artifactType: "vision_observation",
        artifactVersion: ANALYSIS_PREANALYSIS_VERSION,
        payload: input.visionObservation as unknown as Json,
    });
    if (input.noteInterpretation) {
        await recordAnalysisArtifact({
            analysisId: input.analysisId,
            artifactType: "note_interpretation",
            artifactVersion: ANALYSIS_ARTIFACT_VERSIONS.noteInterpretation,
            payload: input.noteInterpretation as Json,
        });
    }
    if (input.patternDiagnosis) {
        await recordAnalysisArtifact({
            analysisId: input.analysisId,
            artifactType: "pattern_diagnosis",
            artifactVersion: ANALYSIS_ARTIFACT_VERSIONS.patternDiagnosis,
            payload: input.patternDiagnosis as Json,
        });
    }
    await recordAnalysisArtifact({
        analysisId: input.analysisId,
        artifactType: "score_result",
        artifactVersion: ANALYSIS_SCORING_VERSION,
        payload: input.scoreResult as unknown as Json,
    });
}

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

export async function ensureAnalysisJobCanStart(input: {
    userId?: string | null;
    ipHash?: string | null;
}) {
    const activeJobCount = await getActiveAnalysisJobCount({
        userId: input.userId ?? null,
        ipHash: input.userId ? null : input.ipHash ?? null,
    });

    return activeJobCount < MAX_CONCURRENT_ANALYSIS_JOBS;
}

export async function processAnalysisRequest(input: ProcessAnalysisRequestInput) {
    const { analysisId, goalData, jobAttemptCount, requestIpHash, requestPath, sessionId, spaceData, user } = input;
    const processingStartedAt = Date.now();
    const normalizedPhotoUrl = normalizeUploadedPhotoUrl(spaceData.photoUrl);
    const effectiveSpaceData = normalizedPhotoUrl === spaceData.photoUrl
        ? spaceData
        : {
            ...spaceData,
            photoUrl: normalizedPhotoUrl ?? undefined,
        };
    const registrationRequired = Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
        process.env.SUPABASE_SERVICE_ROLE_KEY &&
        !user
    );
    let preAnalysis: RoomPreAnalysis | null = null;
    const timings: Record<string, number> = {};
    const hasUploadedPhoto = Boolean(effectiveSpaceData.photoPath || effectiveSpaceData.photoUrl);

    const trackAnalysisEvent = (eventName: string, properties?: Record<string, unknown>) => {
        void createAnalyticsEvent({
            eventName,
            userId: user?.id ?? null,
            sessionId,
            analysisId,
            pagePath: requestPath,
            eventSource: "analyze-worker",
            properties: (properties ?? {}) as Json,
        });
    };

    try {
        if (typeof jobAttemptCount === "number") {
            await upsertAnalysisJob({
                analysisId,
                status: "processing",
                stage: "snapshot",
                attemptCount: jobAttemptCount,
                userId: user?.id ?? null,
                ipHash: user ? null : requestIpHash,
            });
        }

        await updateAnalysisProgress(analysisId, {
            analysisStatus: "processing",
            failureReason: null,
            pipelineStage: "snapshot_processing",
            pipelineStatus: "processing",
            snapshotStatus: "processing",
            fullReportStatus: "locked",
            attemptCount: 1,
            lastErrorCode: null,
            lastErrorMessage: null,
            promptVersion: ANALYSIS_PROMPT_VERSION,
            schemaVersion: ANALYSIS_SCHEMA_VERSION,
            preanalysisVersion: ANALYSIS_PREANALYSIS_VERSION,
        });

        trackAnalysisEvent("analysis_requested", {
            goal: goalData.goal,
            budget: goalData.budget,
            hasPhotoPath: Boolean(effectiveSpaceData.photoPath),
            hasPhotoUrl: Boolean(effectiveSpaceData.photoUrl),
        });

        if (effectiveSpaceData.photoPath && !isAllowedUploadedPhotoPath(effectiveSpaceData.photoPath)) {
            throw new Error("Photo path must come from the verified upload pipeline.");
        }

        if (!effectiveSpaceData.photoPath && effectiveSpaceData.photoUrl && !isAllowedUploadedPhotoUrl(effectiveSpaceData.photoUrl)) {
            throw new Error("Photo URL must come from the verified upload pipeline.");
        }

        let snapshotResult: SnapshotResultV2 | null = null;
        let aiSuccess = false;
        let preAnalysisUsed = false;
        let snapshotModelName: string | null = null;
        let snapshotPromptVersion = ANALYSIS_PROMPT_VERSION;
        let snapshotSchemaVersion = ANALYSIS_SCHEMA_VERSION;
        const normalizedInput = buildNormalizedAnalysisInput(effectiveSpaceData, goalData);

        const persistRoomTypeConfirmationRequired = async (
            observedVision: VisionObservation,
            message: string,
            preanalysisStatus: "completed" | "pending",
        ) => {
            await recordAnalysisArtifact({
                analysisId,
                artifactType: "vision_observation",
                artifactVersion: ANALYSIS_PREANALYSIS_VERSION,
                payload: observedVision as unknown as Json,
            });

            await markAnalysisActionRequired(analysisId, {
                message,
                code: "room_type_confirmation_required",
                preanalysisStatus,
            });

            await upsertAnalysisJob({
                analysisId,
                status: "completed",
                stage: "snapshot",
                attemptCount: 1,
                lastError: message,
                userId: user?.id ?? null,
                ipHash: user ? null : requestIpHash,
            });

            timings.snapshot_total_ms = Date.now() - processingStartedAt;

            trackAnalysisEvent("analysis_action_required", {
                code: "room_type_confirmation_required",
                message,
                preAnalysisUsed: preanalysisStatus === "completed",
                processingDurationMs: timings.snapshot_total_ms,
                timings,
            });
        };

        const persistPhotoAnalysisFailed = async (message = PHOTO_ANALYSIS_FAILED_MESSAGE) => {
            await markAnalysisFailed(analysisId, message, {
                stage: "failed",
                code: "preanalysis_failed",
                preanalysisStatus: "failed",
                snapshotStatus: "failed",
                fullReportStatus: "locked",
            });

            await upsertAnalysisJob({
                analysisId,
                status: "failed",
                stage: "snapshot",
                attemptCount: jobAttemptCount ?? 1,
                lastError: message,
                userId: user?.id ?? null,
                ipHash: user ? null : requestIpHash,
            });

            timings.snapshot_total_ms = Date.now() - processingStartedAt;
            trackAnalysisEvent("analysis_failed", {
                code: "preanalysis_failed",
                reason: message,
                processingDurationMs: timings.snapshot_total_ms,
                timings,
            });

            logger.warn("Photo analysis failed before snapshot generation", { analysisId });
        };

        await measureStep(timings, "snapshot_record_normalized_input_ms", () =>
            recordAnalysisArtifact({
                analysisId,
                artifactType: "normalized_input",
                artifactVersion: ANALYSIS_ARTIFACT_VERSIONS.normalizedInput,
                payload: normalizedInput as unknown as Json,
            }),
        );

        const preAnalysisStart = hasUploadedPhoto
            ? await measureStep(timings, "snapshot_start_preanalysis_ms", () => startRoomPreAnalysis({
                analysisId,
                requestPath,
                sessionId,
                spaceData: effectiveSpaceData,
                userId: user?.id ?? null,
            }))
            : null;

        if (preAnalysisStart?.status === "failed") {
            await persistPhotoAnalysisFailed();
            return;
        }

        preAnalysis = await measureStep(timings, "snapshot_wait_for_preanalysis_ms", () =>
            waitForRoomPreAnalysis(analysisId, {
                timeoutMs: preAnalysisStart?.status === "already_processing" ? 12000 : 6000,
                pollIntervalMs: 500,
            }),
        );

        let visionObservation: VisionObservation | null = null;
        let scoreResult: ScoreResult | null = null;

        if (preAnalysis) {
            const observedVision = buildVisionObservationFromPreAnalysis(preAnalysis);
            visionObservation = observedVision;
            const validation = buildVisionValidationV2(observedVision, normalizedInput.roomType);
            if (validation.status === "action_required") {
                await persistRoomTypeConfirmationRequired(
                    observedVision,
                    validation.message || "This photo looks like a different room type than the one you selected.",
                    "completed",
                );
                return;
            }
            if (validation.status !== "valid") {
                throw new Error(validation.message || "Please upload a clearer photo of a single indoor room.");
            }

            const artifactResult = await measureStep(timings, "snapshot_build_artifacts_ms", async () => {
                const noteInterpretation = buildNoteInterpretation(normalizedInput);
                const patternDiagnosis = buildPatternDiagnosis(normalizedInput, observedVision, goalData);
                const nextScoreResult = buildScoreResult(normalizedInput, observedVision, effectiveSpaceData, goalData);
                const nextSnapshotResult = buildSnapshotFromArtifactsV2(normalizedInput, observedVision, nextScoreResult, goalData);

                return {
                    noteInterpretation,
                    patternDiagnosis,
                    scoreResult: nextScoreResult,
                    snapshotResult: nextSnapshotResult,
                };
            });
            scoreResult = artifactResult.scoreResult;
            snapshotResult = artifactResult.snapshotResult;

            await measureStep(timings, "snapshot_record_artifact_bundle_ms", () =>
                recordArtifactBundle({
                    analysisId,
                    normalizedInput,
                    visionObservation: observedVision,
                    scoreResult: artifactResult.scoreResult,
                    noteInterpretation: artifactResult.noteInterpretation,
                    patternDiagnosis: artifactResult.patternDiagnosis,
                }),
            );

            aiSuccess = true;
            preAnalysisUsed = true;
            snapshotModelName = ANALYSIS_MODEL_NAME;
        }

        if ((!aiSuccess || !snapshotResult) && visionObservation?.isRoomPhoto && visionObservation.isUsablePhoto && scoreResult) {
            snapshotResult = buildSnapshotFromArtifactsV2(normalizedInput, visionObservation, scoreResult, goalData);
            aiSuccess = true;
        }

        if (!aiSuccess && hasUploadedPhoto) {
            const analysisStatus = await getAnalysisStatusRecord(analysisId);
            const preanalysisStatus = analysisStatus?.preanalysis_status ?? "pending";

            if (preanalysisStatus === "failed") {
                await persistPhotoAnalysisFailed(analysisStatus?.last_error_message || PHOTO_ANALYSIS_FAILED_MESSAGE);
                return;
            } else {
                const waitingMessage = "Waiting for the room scan to complete before building your snapshot.";

                await updateAnalysisProgress(analysisId, {
                    pipelineStage:
                        preanalysisStatus === "completed"
                            ? "snapshot_queued"
                            : "preanalysis_processing",
                    pipelineStatus: "pending",
                    preanalysisStatus,
                    snapshotStatus: "pending",
                    fullReportStatus: "locked",
                    attemptCount: jobAttemptCount ?? 1,
                    lastErrorCode: "preanalysis_pending",
                    lastErrorMessage: waitingMessage,
                    promptVersion: ANALYSIS_PROMPT_VERSION,
                    schemaVersion: ANALYSIS_SCHEMA_VERSION,
                    preanalysisVersion: ANALYSIS_PREANALYSIS_VERSION,
                });

                await upsertAnalysisJob({
                    analysisId,
                    status: "retrying",
                    stage: "snapshot",
                    attemptCount: jobAttemptCount ?? 1,
                    lastError: waitingMessage,
                    userId: user?.id ?? null,
                    ipHash: user ? null : requestIpHash,
                });

                timings.snapshot_total_ms = Date.now() - processingStartedAt;
                trackAnalysisEvent("analysis_timing", {
                    status: "preanalysis_pending",
                    processingDurationMs: timings.snapshot_total_ms,
                    timings,
                });

                return;
            }
        }

        if (!aiSuccess || !snapshotResult) {
            if (hasUploadedPhoto) {
                await persistPhotoAnalysisFailed();
                return;
            }

            snapshotResult = buildFallbackSnapshotV2({
                goal: goalData.goal,
                goalData,
                spaceData: effectiveSpaceData,
            });
        } else if (visionObservation && scoreResult && snapshotResult.analysisMode === "vision") {
            const snapshotForDiagnosis = snapshotResult;
            const diagnosisLayer = await measureStep(timings, "snapshot_diagnosis_layer_ms", () => applySnapshotDiagnosisLayer({
                normalizedInput,
                visionObservation,
                scoreResult,
                snapshot: snapshotForDiagnosis,
            }));
            snapshotResult = diagnosisLayer.snapshot;

            if (diagnosisLayer.diagnosisUsed) {
                snapshotModelName = [snapshotModelName, diagnosisLayer.modelName].filter(Boolean).join(" + ");
                snapshotPromptVersion = [ANALYSIS_PROMPT_VERSION, diagnosisLayer.promptVersion].filter(Boolean).join(" + ");
                snapshotSchemaVersion = [ANALYSIS_SCHEMA_VERSION, diagnosisLayer.schemaVersion].filter(Boolean).join(" + ");
            } else {
                const snapshotForWriter = snapshotResult;
                const writerLayer = await measureStep(timings, "snapshot_writer_layer_ms", () => applySnapshotWriterLayer({
                    normalizedInput,
                    visionObservation,
                    scoreResult,
                    snapshot: snapshotForWriter,
                }));
                snapshotResult = writerLayer.snapshot;

                if (writerLayer.writerUsed) {
                    snapshotModelName = [snapshotModelName, writerLayer.modelName].filter(Boolean).join(" + ");
                    snapshotPromptVersion = [ANALYSIS_PROMPT_VERSION, writerLayer.promptVersion].filter(Boolean).join(" + ");
                    snapshotSchemaVersion = [ANALYSIS_SCHEMA_VERSION, writerLayer.schemaVersion].filter(Boolean).join(" + ");
                }
            }
        }

        const saveSuccess = await measureStep(
            timings,
            "snapshot_save_record_ms",
            () => saveAnalysisSnapshotRecord(
                analysisId,
                effectiveSpaceData,
                goalData,
                snapshotResult,
                {
                    user: user ?? undefined,
                    requestIpHash,
                    registrationRequired,
                    preanalysisUsed: preAnalysisUsed,
                    promptVersion: snapshotPromptVersion,
                    schemaVersion: snapshotSchemaVersion,
                    modelName: aiSuccess && snapshotResult.analysisMode === "vision" ? snapshotModelName : null,
                    preanalysisVersion: ANALYSIS_PREANALYSIS_VERSION,
                    preanalysisStatus: preAnalysisUsed ? "completed" : "pending",
                },
            ),
        );

        if (!saveSuccess) {
            logger.warn("DB save failed, continuing in demo mode", { analysisId });
        }

        await measureStep(timings, "snapshot_record_snapshot_artifact_ms", () =>
            recordAnalysisArtifact({
                analysisId,
                artifactType: "snapshot",
                artifactVersion: ANALYSIS_ARTIFACT_VERSIONS.snapshotV2,
                payload: snapshotResult as unknown as Json,
            }),
        );

        await upsertAnalysisJob({
            analysisId,
            status: "completed",
            stage: "snapshot",
            attemptCount: 1,
            userId: user?.id ?? null,
            ipHash: user ? null : requestIpHash,
        });

        timings.snapshot_total_ms = Date.now() - processingStartedAt;

        trackAnalysisEvent("analysis_succeeded", {
            registrationRequired,
            analysisMode: snapshotResult.analysisMode ?? "fallback",
            fallbackUsed: snapshotResult.analysisMode === "fallback",
            preAnalysisUsed,
            processingDurationMs: timings.snapshot_total_ms,
            timings,
        });
    } catch (error) {
        await markAnalysisFailed(
            analysisId,
            error instanceof Error ? error.message : "internal_server_error",
            {
                stage: "failed",
                code: "snapshot_failed",
                preanalysisStatus: preAnalysis ? "completed" : "pending",
                snapshotStatus: "failed",
                fullReportStatus: "locked",
            },
        );
        await upsertAnalysisJob({
            analysisId,
            status: "failed",
            stage: "snapshot",
            attemptCount: 1,
            lastError: error instanceof Error ? error.message : "internal_server_error",
            userId: user?.id ?? null,
            ipHash: user ? null : requestIpHash,
        });
        timings.snapshot_total_ms = Date.now() - processingStartedAt;

        trackAnalysisEvent("analysis_failed", {
            reason: error instanceof Error ? error.message : "internal_server_error",
            processingDurationMs: timings.snapshot_total_ms,
            timings,
        });
        logger.error("Analyze worker failed", error, { analysisId });
    }
}
