import { after, NextRequest, NextResponse } from "next/server";
import { buildVisionValidationV2 } from "@/lib/align-v2/builders";
import { coerceSnapshotV2 } from "@/lib/align-v2/snapshot-adapters";
import { resumeAnalysisPipelineIfNeeded } from "@/lib/analysis-job-service";
import { logger } from "@/lib/logger";
import { getAnalysisStatusRecord, getLatestAnalysisArtifact } from "@/lib/repositories/analysis-repository";
import { getAnalysisJob } from "@/lib/repositories/security-repository";
import type { VisionObservation } from "@/types";

const SNAPSHOT_RESUME_STALE_MS = 2 * 60 * 1000;

function isOlderThan(value: string | null | undefined, staleMs: number) {
    if (!value) {
        return true;
    }

    return Date.now() - new Date(value).getTime() > staleMs;
}

function shouldSchedulePipelineResume(input: {
    job: Awaited<ReturnType<typeof getAnalysisJob>>;
    analysis: Awaited<ReturnType<typeof getAnalysisStatusRecord>>;
}) {
    const { analysis, job } = input;

    if (analysis?.analysis_status === "completed" || analysis?.analysis_status === "failed") {
        return false;
    }

    if (analysis?.preanalysis_status === "pending") {
        return true;
    }

    if (!job) {
        return Boolean(analysis && analysis.snapshot_status !== "completed");
    }

    if (job?.status === "queued" || job?.status === "retrying") {
        return true;
    }

    return job?.status === "processing" && isOlderThan(job.started_at, SNAPSHOT_RESUME_STALE_MS);
}

export async function GET(
    _req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;

        if (!id) {
            return NextResponse.json({ success: false, error: "Missing analysis ID" }, { status: 400 });
        }

        const [job, analysis] = await Promise.all([
            getAnalysisJob(id),
            getAnalysisStatusRecord(id),
        ]);

        if (!job && !analysis) {
            return NextResponse.json({ success: false, error: "Analysis not found" }, { status: 404 });
        }

        if (analysis?.analysis_status === "completed" && analysis.snapshot_result) {
            const snapshot = coerceSnapshotV2(analysis.report_result?.free.snapshot ?? analysis.snapshot_result);
            if (!snapshot) {
                return NextResponse.json({ success: false, error: "Snapshot payload is invalid" }, { status: 500 });
            }

            return NextResponse.json({
                success: true,
                data: {
                    status: "completed",
                    analysisId: id,
                    registrationRequired: analysis.registration_required,
                    snapshot,
                    pipeline: {
                        stage: analysis.pipeline_stage ?? "snapshot_completed",
                        status: analysis.pipeline_status ?? "completed",
                        preanalysisStatus: analysis.preanalysis_status ?? "pending",
                        snapshotStatus: analysis.snapshot_status ?? "completed",
                        fullReportStatus: analysis.full_report_status ?? "locked",
                    },
                },
            });
        }

        if (analysis?.last_error_code === "room_type_confirmation_required" && analysis.snapshot_status === "locked") {
            const latestVision = await getLatestAnalysisArtifact<VisionObservation>(id, "vision_observation");
            const validation = latestVision?.payload
                ? buildVisionValidationV2(
                    latestVision.payload,
                    analysis.space_data.spaceType ?? analysis.goal_data.spaceType ?? null,
                )
                : null;

            return NextResponse.json({
                success: true,
                data: {
                    status: "action_required",
                    analysisId: id,
                    code: "ROOM_TYPE_CONFIRMATION_REQUIRED",
                    message:
                        analysis.last_error_message ||
                        validation?.message ||
                        "This photo looks like a different room type than the one you selected.",
                    claimedRoomType:
                        validation?.claimedRoomType ??
                        analysis.space_data.spaceType ??
                        analysis.goal_data.spaceType ??
                        null,
                    detectedRoomType: validation?.detectedRoomType ?? null,
                    pipeline: {
                        stage: analysis.pipeline_stage ?? "snapshot_action_required",
                        status: analysis.pipeline_status ?? "pending",
                        preanalysisStatus: analysis.preanalysis_status ?? "completed",
                        snapshotStatus: analysis.snapshot_status ?? "locked",
                        fullReportStatus: analysis.full_report_status ?? "locked",
                        lastErrorCode: analysis.last_error_code ?? "room_type_confirmation_required",
                        lastErrorMessage:
                            analysis.last_error_message ||
                            validation?.message ||
                            "This photo looks like a different room type than the one you selected.",
                    },
                },
            });
        }

        if (job?.status === "failed" || analysis?.analysis_status === "failed") {
            return NextResponse.json({
                success: true,
                data: {
                    status: "failed",
                    analysisId: id,
                    error: analysis?.failure_reason || "We could not generate your report this time.",
                    pipeline: {
                        stage: analysis?.pipeline_stage ?? "failed",
                        status: analysis?.pipeline_status ?? "failed",
                        preanalysisStatus: analysis?.preanalysis_status ?? "failed",
                        snapshotStatus: analysis?.snapshot_status ?? "failed",
                        fullReportStatus: analysis?.full_report_status ?? "locked",
                        lastErrorCode: analysis?.last_error_code ?? null,
                        lastErrorMessage: analysis?.last_error_message ?? analysis?.failure_reason ?? null,
                    },
                },
            });
        }

        if (shouldSchedulePipelineResume({ job, analysis })) {
            after(async () => {
                await resumeAnalysisPipelineIfNeeded(id);
            });
        }

        return NextResponse.json({
            success: true,
            data: {
                status: "processing",
                analysisId: id,
                pipeline: {
                    stage:
                        analysis?.pipeline_stage ??
                        (job?.status === "queued" || job?.status === "retrying" ? "snapshot_queued" : "snapshot_processing"),
                    status:
                        analysis?.pipeline_status ??
                        (job?.status === "queued" || job?.status === "retrying" ? "pending" : "processing"),
                    preanalysisStatus: analysis?.preanalysis_status ?? "pending",
                    snapshotStatus:
                        analysis?.snapshot_status ??
                        (job?.status === "queued" || job?.status === "retrying" ? "pending" : "processing"),
                    fullReportStatus: analysis?.full_report_status ?? "locked",
                    lastErrorCode: analysis?.last_error_code ?? null,
                    lastErrorMessage: analysis?.last_error_message ?? null,
                },
            },
        });
    } catch (error) {
        logger.error("Analyze status route error", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
