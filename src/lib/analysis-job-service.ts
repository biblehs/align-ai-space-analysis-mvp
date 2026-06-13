import { confirmBillingCheckoutPayment } from "@/lib/billing/service";
import { processAnalysisRequest } from "@/lib/analysis-worker";
import { logger } from "@/lib/logger";
import { startRoomPreAnalysis } from "@/lib/preanalysis-worker";
import {
    getAnalysisExecutionRecord,
    markAnalysisFailed,
    type AnalysisExecutionRecord,
} from "@/lib/repositories/analysis-repository";
import { getAnalysisJob, upsertAnalysisJob } from "@/lib/repositories/security-repository";

const PREANALYSIS_STALE_MS = 90 * 1000;
const SNAPSHOT_JOB_STALE_MS = 2 * 60 * 1000;
const DEFAULT_MAX_ATTEMPTS = 3;

function isStale(updatedAt: string | null | undefined, staleMs: number) {
    if (!updatedAt) {
        return true;
    }

    return Date.now() - new Date(updatedAt).getTime() > staleMs;
}

function hasUploadedPhoto(analysis: AnalysisExecutionRecord) {
    return Boolean(
        (analysis.photo_url && analysis.photo_url !== "no_photo") ||
        analysis.space_data.photoPath ||
        analysis.space_data.photoUrl,
    );
}

function shouldResumePreanalysis(analysis: AnalysisExecutionRecord) {
    if (!hasUploadedPhoto(analysis)) {
        return false;
    }

    if (analysis.analysis_status === "completed" || analysis.analysis_status === "failed") {
        return false;
    }

    if (analysis.preanalysis_status === "completed") {
        return false;
    }

    if (analysis.preanalysis_status === "pending") {
        return true;
    }

    return isStale(analysis.updated_at, PREANALYSIS_STALE_MS);
}

function shouldResumeSnapshot(analysis: AnalysisExecutionRecord) {
    if (analysis.analysis_status === "completed" || analysis.analysis_status === "failed") {
        return false;
    }

    if (
        hasUploadedPhoto(analysis) &&
        analysis.preanalysis_status !== "completed" &&
        analysis.preanalysis_status !== "failed"
    ) {
        return false;
    }

    if (analysis.last_error_code === "room_type_confirmation_required" || analysis.snapshot_status === "locked") {
        return false;
    }

    return analysis.snapshot_status !== "completed";
}

function shouldResumeFullReport(analysis: AnalysisExecutionRecord) {
    if (analysis.paid || analysis.full_report_status === "completed") {
        return false;
    }

    return analysis.billing_status === "checkout_pending" && Boolean(analysis.billing_checkout_id);
}

async function resumePreanalysisIfNeeded(analysis: AnalysisExecutionRecord) {
    if (!shouldResumePreanalysis(analysis)) {
        return { resumed: false as const, reason: "preanalysis_not_needed" as const };
    }

    try {
        await startRoomPreAnalysis({
            analysisId: analysis.id,
            requestPath: "/api/analyze/[id]/resume-preanalysis",
            sessionId: null,
            spaceData: analysis.space_data,
            userId: analysis.user_id ?? null,
        });

        return { resumed: true as const, reason: "preanalysis_resumed" as const };
    } catch (error) {
        logger.warn("Preanalysis resume failed", {
            analysisId: analysis.id,
            error: error instanceof Error ? error.message : String(error),
        });

        return { resumed: false as const, reason: "preanalysis_resume_failed" as const };
    }
}

async function resumeSnapshotIfNeeded(analysis: AnalysisExecutionRecord) {
    const job = await getAnalysisJob(analysis.id);

    if (!shouldResumeSnapshot(analysis)) {
        return { resumed: false as const, reason: "snapshot_not_needed" as const };
    }

    const shouldResume =
        !job ||
        job.status === "queued" ||
        job.status === "retrying" ||
        (job.status === "processing" && isStale(job.started_at, SNAPSHOT_JOB_STALE_MS));

    if (!shouldResume) {
        return { resumed: false as const, reason: "snapshot_job_active" as const };
    }

    const nextAttempt = Math.max(1, (job?.attempt_count ?? 0) + 1);
    const maxAttempts = job?.max_attempts ?? DEFAULT_MAX_ATTEMPTS;

    if (nextAttempt > maxAttempts) {
        await markAnalysisFailed(analysis.id, "We could not complete this report after several retries.", {
            stage: "failed",
            code: "snapshot_retry_exhausted",
            preanalysisStatus: analysis.preanalysis_status ?? "failed",
            snapshotStatus: "failed",
            fullReportStatus: analysis.full_report_status ?? "locked",
        });
        await upsertAnalysisJob({
            analysisId: analysis.id,
            status: "failed",
            stage: "snapshot",
            attemptCount: nextAttempt,
            maxAttempts,
            lastError: "snapshot_retry_exhausted",
            userId: analysis.user_id ?? null,
            ipHash: analysis.user_id ? null : analysis.request_ip_hash ?? null,
        });

        return { resumed: false as const, reason: "snapshot_retry_exhausted" as const };
    }

    await upsertAnalysisJob({
        analysisId: analysis.id,
        status: "processing",
        stage: "snapshot",
        attemptCount: nextAttempt,
        maxAttempts,
        lastError: job?.last_error ?? null,
        userId: analysis.user_id ?? null,
        ipHash: analysis.user_id ? null : analysis.request_ip_hash ?? null,
    });

    try {
        await processAnalysisRequest({
            analysisId: analysis.id,
            goalData: analysis.goal_data,
            jobAttemptCount: nextAttempt,
            requestIpHash: analysis.request_ip_hash ?? null,
            requestPath: "/api/analyze/[id]/resume",
            sessionId: null,
            spaceData: analysis.space_data,
            user: analysis.user_id
                ? {
                    id: analysis.user_id,
                    email: analysis.email ?? null,
                }
                : null,
        });

        return { resumed: true as const, reason: "snapshot_resumed" as const };
    } catch (error) {
        logger.error("Resume snapshot analysis job failed", error, {
            analysisId: analysis.id,
            nextAttempt,
        });

        await upsertAnalysisJob({
            analysisId: analysis.id,
            status: nextAttempt < maxAttempts ? "retrying" : "failed",
            stage: "snapshot",
            attemptCount: nextAttempt,
            maxAttempts,
            lastError: error instanceof Error ? error.message : "resume_failed",
            userId: analysis.user_id ?? null,
            ipHash: analysis.user_id ? null : analysis.request_ip_hash ?? null,
        });

        if (nextAttempt >= maxAttempts) {
            await markAnalysisFailed(analysis.id, "We could not complete this report after several retries.", {
                stage: "failed",
                code: "snapshot_retry_exhausted",
                preanalysisStatus: analysis.preanalysis_status ?? "failed",
                snapshotStatus: "failed",
                fullReportStatus: analysis.full_report_status ?? "locked",
            });
        }

        return { resumed: false as const, reason: "snapshot_resume_failed" as const };
    }
}

export async function resumeFullReportIfNeeded(analysisId: string) {
    const analysis = await getAnalysisExecutionRecord(analysisId);

    if (!analysis) {
        return { resumed: false as const, reason: "analysis_not_found" as const };
    }

    if (!shouldResumeFullReport(analysis) || !analysis.billing_checkout_id) {
        return { resumed: false as const, reason: "full_report_not_needed" as const };
    }

    try {
        const result = await confirmBillingCheckoutPayment({
            analysisId,
            checkoutId: analysis.billing_checkout_id,
            pagePath: "/api/plan/[id]/resume",
        });

        return {
            resumed: result.paid,
            reason: result.paid ? "full_report_resumed" as const : "full_report_pending" as const,
        };
    } catch (error) {
        logger.warn("Full report resume failed", {
            analysisId,
            error: error instanceof Error ? error.message : String(error),
        });

        return { resumed: false as const, reason: "full_report_resume_failed" as const };
    }
}

export async function resumeAnalysisPipelineIfNeeded(analysisId: string) {
    const analysis = await getAnalysisExecutionRecord(analysisId);

    if (!analysis) {
        return {
            resumed: false as const,
            reasons: ["analysis_not_found"] as const,
        };
    }

    const reasons: string[] = [];
    const resumedStages: Array<"preanalysis" | "snapshot" | "full_report"> = [];

    const preanalysisResult = await resumePreanalysisIfNeeded(analysis);
    reasons.push(preanalysisResult.reason);
    if (preanalysisResult.resumed) {
        resumedStages.push("preanalysis");
    }

    const refreshedAnalysis = resumedStages.includes("preanalysis")
        ? await getAnalysisExecutionRecord(analysisId)
        : analysis;

    if (refreshedAnalysis) {
        const snapshotResult = await resumeSnapshotIfNeeded(refreshedAnalysis);
        reasons.push(snapshotResult.reason);
        if (snapshotResult.resumed) {
            resumedStages.push("snapshot");
        }

        const fullReportResult = await resumeFullReportIfNeeded(analysisId);
        reasons.push(fullReportResult.reason);
        if (fullReportResult.resumed) {
            resumedStages.push("full_report");
        }
    }

    return {
        resumed: resumedStages.length > 0,
        resumedStages,
        reasons,
    };
}

export async function resumeSnapshotAnalysisJobIfNeeded(analysisId: string) {
    const analysis = await getAnalysisExecutionRecord(analysisId);

    if (!analysis) {
        return { resumed: false as const, reason: "analysis_not_found" as const };
    }

    return resumeSnapshotIfNeeded(analysis);
}
