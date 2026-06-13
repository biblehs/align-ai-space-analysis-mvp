import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import {
    ANALYSIS_PREANALYSIS_VERSION,
    ANALYSIS_PROMPT_VERSION,
    ANALYSIS_SCHEMA_VERSION,
    buildPipelineSnapshot,
    buildReportResult,
} from "@/lib/analysis-pipeline";
import type { SnapshotResultV2 } from "@/lib/align-v2/contracts";
import { buildPendingSnapshotPlaceholderV2 } from "@/lib/align-v2/snapshot-adapters";
import type {
    AnalysisArtifactType,
    AnalysisGenerationStatus,
    AnalysisPipelineStage,
    AnalysisAccessRecord,
    AnalysisHistoryItem,
    AnalysisReportItem,
    DatabaseRowAnalysis,
    GoalData,
    SpaceData,
} from "@/types";
import type { Json } from "@/types/database";

export type AnalysisRecordForPlan = Pick<
    DatabaseRowAnalysis,
    | "id"
    | "user_id"
    | "paid"
    | "plan_result"
    | "space_data"
    | "goal_data"
    | "snapshot_result"
    | "photo_url"
    | "billing_status"
    | "report_result"
    | "full_report_status"
>;

export type AnalysisStatusRecord = Pick<
    DatabaseRowAnalysis,
    | "id"
    | "analysis_status"
    | "failure_reason"
    | "registration_required"
    | "snapshot_result"
    | "pipeline_stage"
    | "pipeline_status"
    | "preanalysis_status"
    | "snapshot_status"
    | "full_report_status"
    | "last_error_code"
    | "last_error_message"
    | "space_data"
    | "goal_data"
    | "report_result"
>;

export type AnalysisExecutionRecord = Pick<
    DatabaseRowAnalysis,
    | "id"
    | "user_id"
    | "email"
    | "photo_url"
    | "paid"
    | "billing_status"
    | "billing_checkout_id"
    | "request_ip_hash"
    | "analysis_status"
    | "pipeline_stage"
    | "pipeline_status"
    | "preanalysis_status"
    | "snapshot_status"
    | "full_report_status"
    | "space_data"
    | "goal_data"
    | "report_result"
    | "updated_at"
    | "last_error_code"
>;

export type AnonymousAnalysisDiscardRecord = Pick<DatabaseRowAnalysis, "id" | "user_id" | "photo_url">;

function buildPendingReportResult(preanalysisStatus: AnalysisGenerationStatus) {
    return buildReportResult({
        snapshot: buildPendingSnapshotPlaceholderV2(),
        paid: false,
        pipeline: buildPipelineSnapshot({
            stage: "snapshot_queued",
            status: "pending",
            preanalysisStatus,
            snapshotStatus: "pending",
            fullReportStatus: "locked",
        }),
        meta: {
            promptVersion: ANALYSIS_PROMPT_VERSION,
            schemaVersion: ANALYSIS_SCHEMA_VERSION,
            preanalysisVersion: ANALYSIS_PREANALYSIS_VERSION,
            fallbackUsed: false,
            preanalysisUsed: preanalysisStatus === "completed",
        },
    });
}

function buildActionRequiredReportResult(
    snapshot: SnapshotResultV2,
    input: {
        preanalysisStatus: AnalysisGenerationStatus;
        code: string;
        message: string;
    },
) {
    return buildReportResult({
        snapshot,
        paid: false,
        pipeline: buildPipelineSnapshot({
            stage: "snapshot_action_required",
            status: "pending",
            preanalysisStatus: input.preanalysisStatus,
            snapshotStatus: "locked",
            fullReportStatus: "locked",
            lastErrorCode: input.code,
            lastErrorMessage: input.message,
        }),
    });
}

function normalizeEmail(email: string | null | undefined) {
    const normalized = email?.trim().toLowerCase() ?? "";
    return normalized || null;
}

export async function savePendingAnalysisRecord(
    analysisId: string,
    spaceData: SpaceData,
    goalData: GoalData,
    input?: {
        user?: { id: string; email: string | null };
        requestIpHash?: string | null;
        registrationRequired?: boolean;
        preanalysisStatus?: AnalysisGenerationStatus;
    },
) {
    if (!isSupabaseAdminConfigured) {
        return false;
    }

    const preanalysisStatus = input?.preanalysisStatus ?? (spaceData.photoPath || spaceData.photoUrl ? "processing" : "pending");

    const { error } = await supabaseAdmin.from("analyses").upsert({
        id: analysisId,
        user_id: input?.user?.id || null,
        email: normalizeEmail(input?.user?.email) ?? null,
        photo_url: spaceData.photoPath || spaceData.photoUrl || "no_photo",
        request_ip_hash: input?.requestIpHash ?? null,
        registration_required: input?.registrationRequired ?? false,
        analysis_status: "processing",
        analysis_mode: null,
        fallback_used: false,
        failure_reason: null,
        pipeline_stage: "snapshot_queued",
        pipeline_status: "pending",
        preanalysis_status: preanalysisStatus,
        snapshot_status: "pending",
        full_report_status: "locked",
        attempt_count: 0,
        last_error_code: null,
        last_error_message: null,
        prompt_version: ANALYSIS_PROMPT_VERSION,
        schema_version: ANALYSIS_SCHEMA_VERSION,
        model_name: null,
        ai_model: null,
        preanalysis_version: ANALYSIS_PREANALYSIS_VERSION,
        preanalysis_generated_at: null,
        snapshot_generated_at: null,
        full_report_generated_at: null,
        space_data: spaceData,
        goal_data: goalData,
        snapshot_result: buildPendingSnapshotPlaceholderV2(),
        report_result: buildPendingReportResult(preanalysisStatus),
        paid: false,
        completed_at: null,
    });

    if (error) {
        logger.warn("Pending analysis save failed", {
            analysisId,
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
        });
    }

    return !error;
}

export async function saveAnalysisSnapshotRecord(
    analysisId: string,
    spaceData: SpaceData,
    goalData: GoalData,
    snapshotResult: SnapshotResultV2,
    input?: {
        user?: { id: string; email: string | null };
        requestIpHash?: string | null;
        registrationRequired?: boolean;
        preanalysisUsed?: boolean;
        preanalysisStatus?: AnalysisGenerationStatus;
        promptVersion?: string | null;
        schemaVersion?: string | null;
        modelName?: string | null;
        preanalysisVersion?: string | null;
    },
): Promise<boolean> {
    if (!isSupabaseAdminConfigured) {
        return false;
    }

    const snapshotGeneratedAt = new Date().toISOString();
    const preanalysisStatus = input?.preanalysisStatus ?? (input?.preanalysisUsed ? "completed" : "pending");
    const { error } = await supabaseAdmin.from("analyses").upsert({
        id: analysisId,
        user_id: input?.user?.id || null,
        email: normalizeEmail(input?.user?.email) ?? null,
        photo_url: spaceData.photoPath || spaceData.photoUrl || "no_photo",
        request_ip_hash: input?.requestIpHash ?? null,
        registration_required: input?.registrationRequired ?? false,
        analysis_status: "completed",
        analysis_mode: snapshotResult.analysisMode ?? null,
        fallback_used: snapshotResult.analysisMode === "fallback",
        pipeline_stage: "snapshot_completed",
        pipeline_status: "completed",
        preanalysis_status: preanalysisStatus,
        snapshot_status: "completed",
        full_report_status: "locked",
        last_error_code: null,
        last_error_message: null,
        prompt_version: input?.promptVersion ?? ANALYSIS_PROMPT_VERSION,
        schema_version: input?.schemaVersion ?? ANALYSIS_SCHEMA_VERSION,
        model_name: input?.modelName ?? null,
        ai_model: input?.modelName ?? null,
        preanalysis_version: input?.preanalysisVersion ?? ANALYSIS_PREANALYSIS_VERSION,
        snapshot_generated_at: snapshotGeneratedAt,
        space_data: spaceData,
        goal_data: goalData,
        snapshot_result: snapshotResult,
        report_result: buildReportResult({
            snapshot: snapshotResult,
            paid: false,
            pipeline: buildPipelineSnapshot({
                stage: "snapshot_completed",
                status: "completed",
                preanalysisStatus,
                snapshotStatus: "completed",
                fullReportStatus: "locked",
            }),
            meta: {
                modelName: input?.modelName ?? null,
                promptVersion: input?.promptVersion ?? ANALYSIS_PROMPT_VERSION,
                schemaVersion: input?.schemaVersion ?? ANALYSIS_SCHEMA_VERSION,
                preanalysisVersion: input?.preanalysisVersion ?? ANALYSIS_PREANALYSIS_VERSION,
                analysisMode: snapshotResult.analysisMode ?? null,
                fallbackUsed: snapshotResult.analysisMode === "fallback",
                preanalysisUsed: Boolean(input?.preanalysisUsed),
                snapshotGeneratedAt,
            },
        }),
        paid: false,
        completed_at: new Date().toISOString(),
    });

    if (error) {
        logger.warn("Analysis snapshot save failed", {
            analysisId,
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
        });
    }

    return !error;
}

export async function markAnalysisFailed(
    analysisId: string,
    failureReason: string,
    input?: {
        stage?: AnalysisPipelineStage;
        code?: string | null;
        preanalysisStatus?: AnalysisGenerationStatus;
        snapshotStatus?: AnalysisGenerationStatus;
        fullReportStatus?: AnalysisGenerationStatus;
    },
) {
    if (!isSupabaseAdminConfigured) {
        return false;
    }

    const { error } = await supabaseAdmin
        .from("analyses")
        .update({
            analysis_status: "failed",
            failure_reason: failureReason,
            pipeline_stage: input?.stage ?? "failed",
            pipeline_status: "failed",
            preanalysis_status: input?.preanalysisStatus ?? "failed",
            snapshot_status: input?.snapshotStatus ?? "failed",
            full_report_status: input?.fullReportStatus ?? "locked",
            last_error_code: input?.code ?? "analysis_failed",
            last_error_message: failureReason,
            completed_at: new Date().toISOString(),
        })
        .eq("id", analysisId);

    return !error;
}

export async function markAnalysisActionRequired(
    analysisId: string,
    input: {
        message: string;
        code?: string | null;
        preanalysisStatus?: AnalysisGenerationStatus;
        snapshotResult?: SnapshotResultV2 | null;
    },
) {
    if (!isSupabaseAdminConfigured) {
        return false;
    }

    const snapshot = input.snapshotResult ?? buildPendingSnapshotPlaceholderV2();
    const code = input.code ?? "room_type_confirmation_required";

    const { error } = await supabaseAdmin
        .from("analyses")
        .update({
            analysis_status: "processing",
            failure_reason: null,
            pipeline_stage: "snapshot_action_required",
            pipeline_status: "pending",
            preanalysis_status: input.preanalysisStatus ?? "completed",
            snapshot_status: "locked",
            full_report_status: "locked",
            last_error_code: code,
            last_error_message: input.message,
            snapshot_result: snapshot,
            report_result: buildActionRequiredReportResult(snapshot, {
                preanalysisStatus: input.preanalysisStatus ?? "completed",
                code,
                message: input.message,
            }),
            completed_at: null,
        })
        .eq("id", analysisId);

    return !error;
}

export async function resetAnalysisForRoomTypeConfirmation(input: {
    analysisId: string;
    spaceData: SpaceData;
    goalData: GoalData;
    preanalysisStatus?: AnalysisGenerationStatus;
}) {
    if (!isSupabaseAdminConfigured) {
        return false;
    }

    const preanalysisStatus = input.preanalysisStatus ?? "completed";
    const { error } = await supabaseAdmin
        .from("analyses")
        .update({
            analysis_status: "processing",
            failure_reason: null,
            pipeline_stage: "snapshot_queued",
            pipeline_status: "pending",
            preanalysis_status: preanalysisStatus,
            snapshot_status: "pending",
            full_report_status: "locked",
            last_error_code: null,
            last_error_message: null,
            space_data: input.spaceData,
            goal_data: input.goalData,
            snapshot_result: buildPendingSnapshotPlaceholderV2(),
            report_result: buildPendingReportResult(preanalysisStatus),
            completed_at: null,
        })
        .eq("id", input.analysisId);

    return !error;
}

export async function getAnalysisAccessRecord(analysisId: string): Promise<AnalysisAccessRecord | null> {
    if (!isSupabaseAdminConfigured) {
        return null;
    }

    const { data, error } = await supabaseAdmin
        .from("analyses")
        .select("id, user_id, email, paid, snapshot_result, registration_required, report_result")
        .eq("id", analysisId)
        .single<AnalysisAccessRecord>();

    if (error || !data) {
        return null;
    }

    return data;
}

export async function getAnalysisStatusRecord(analysisId: string): Promise<AnalysisStatusRecord | null> {
    if (!isSupabaseAdminConfigured) {
        return null;
    }

    const { data, error } = await supabaseAdmin
        .from("analyses")
        .select(`id, analysis_status, failure_reason, registration_required, snapshot_result,
            pipeline_stage, pipeline_status, preanalysis_status, snapshot_status, full_report_status,
            last_error_code, last_error_message, space_data, goal_data, report_result`)
        .eq("id", analysisId)
        .maybeSingle<AnalysisStatusRecord>();

    if (error || !data) {
        return null;
    }

    return data;
}

export async function getAnalysisExecutionRecord(analysisId: string): Promise<AnalysisExecutionRecord | null> {
    if (!isSupabaseAdminConfigured) {
        return null;
    }

    const { data, error } = await supabaseAdmin
        .from("analyses")
        .select(`id, user_id, email, photo_url, paid, billing_status, billing_checkout_id, request_ip_hash,
            analysis_status, pipeline_stage, pipeline_status, preanalysis_status, snapshot_status, full_report_status,
            space_data, goal_data, report_result, updated_at, last_error_code`)
        .eq("id", analysisId)
        .maybeSingle<AnalysisExecutionRecord>();

    if (error || !data) {
        return null;
    }

    return data;
}

export type RoomPreAnalysisClaimStatus = "claimed" | "already_processing" | "completed" | "failed" | "missing";

export async function claimRoomPreAnalysisProcessing(analysisId: string): Promise<RoomPreAnalysisClaimStatus> {
    if (!isSupabaseAdminConfigured) {
        return "claimed";
    }

    const { data: claimed, error: claimError } = await supabaseAdmin
        .from("analyses")
        .update({
            analysis_status: "processing",
            failure_reason: null,
            pipeline_stage: "preanalysis_processing",
            pipeline_status: "processing",
            preanalysis_status: "processing",
            preanalysis_version: ANALYSIS_PREANALYSIS_VERSION,
            last_error_code: null,
            last_error_message: null,
        })
        .eq("id", analysisId)
        .eq("preanalysis_status", "pending")
        .select("id")
        .maybeSingle<{ id: string }>();

    if (!claimError && claimed) {
        return "claimed";
    }

    const { data: current, error: currentError } = await supabaseAdmin
        .from("analyses")
        .select("preanalysis_status")
        .eq("id", analysisId)
        .maybeSingle<{ preanalysis_status: AnalysisGenerationStatus }>();

    if (currentError || !current) {
        return "missing";
    }

    if (current.preanalysis_status === "completed") {
        return "completed";
    }

    if (current.preanalysis_status === "processing") {
        return "already_processing";
    }

    if (current.preanalysis_status === "failed") {
        return "failed";
    }

    return "missing";
}

export async function claimAnalysisForUser(
    analysisId: string,
    user: { id: string; email: string | null },
) {
    if (!isSupabaseAdminConfigured) {
        return false;
    }

    const { error } = await supabaseAdmin
        .from("analyses")
        .update({
            user_id: user.id,
            email: user.email ?? null,
            registration_required: false,
            registration_completed_at: new Date().toISOString(),
        })
        .eq("id", analysisId)
        .is("user_id", null);

    return !error;
}

export async function getAnonymousAnalysisDiscardRecord(
    analysisId: string,
): Promise<AnonymousAnalysisDiscardRecord | null> {
    if (!isSupabaseAdminConfigured) {
        return null;
    }

    const { data, error } = await supabaseAdmin
        .from("analyses")
        .select("id, user_id, photo_url")
        .eq("id", analysisId)
        .single<AnonymousAnalysisDiscardRecord>();

    if (error || !data || data.user_id) {
        return null;
    }

    return data;
}

export async function deleteAnonymousAnalysisRecord(analysisId: string) {
    if (!isSupabaseAdminConfigured) {
        return false;
    }

    const { error } = await supabaseAdmin
        .from("analyses")
        .delete()
        .eq("id", analysisId)
        .is("user_id", null);

    return !error;
}

export async function getAnalysisForPlan(analysisId: string): Promise<AnalysisRecordForPlan | null> {
    if (!isSupabaseAdminConfigured) {
        return null;
    }

    const { data, error } = await supabaseAdmin
        .from("analyses")
        .select("id, user_id, paid, plan_result, space_data, goal_data, snapshot_result, photo_url, billing_status, report_result, full_report_status")
        .eq("id", analysisId)
        .single<AnalysisRecordForPlan>();

    if (error || !data) {
        return null;
    }

    return data;
}

export async function listAnalysesForUser(user: { id: string; email: string | null }): Promise<AnalysisHistoryItem[] | null> {
    if (!isSupabaseAdminConfigured) {
        return null;
    }

    const analysesByUserId = await supabaseAdmin
        .from("analyses")
        .select("id, created_at, paid, photo_url, goal_data, snapshot_result, report_result")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

    const normalizedEmail = normalizeEmail(user.email);
    const analysesByEmail = normalizedEmail
        ? await supabaseAdmin
            .from("analyses")
            .select("id, created_at, paid, photo_url, goal_data, snapshot_result, report_result")
            .eq("email", normalizedEmail)
            .order("created_at", { ascending: false })
            .limit(20)
        : null;

    if (analysesByUserId.error || analysesByEmail?.error) {
        return null;
    }

    const merged = [...(analysesByUserId.data ?? []), ...(analysesByEmail?.data ?? [])] as AnalysisHistoryItem[];
    const deduped = Array.from(new Map(merged.map((analysis) => [analysis.id, analysis])).values())
        .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())
        .slice(0, 20);

    return deduped;
}

export async function getAnalysisReportForUser(
    user: { id: string; email: string | null },
    analysisId: string,
): Promise<AnalysisReportItem | null> {
    if (!isSupabaseAdminConfigured) {
        return null;
    }

    const analysisByUserId = await supabaseAdmin
        .from("analyses")
        .select("id, created_at, paid, photo_url, goal_data, plan_result, snapshot_result, space_data, report_result")
        .eq("user_id", user.id)
        .eq("id", analysisId)
        .maybeSingle<AnalysisReportItem>();

    if (analysisByUserId.error) {
        return null;
    }

    if (analysisByUserId.data) {
        return analysisByUserId.data;
    }

    const normalizedEmail = normalizeEmail(user.email);
    if (!normalizedEmail) {
        return null;
    }

    const { data, error } = await supabaseAdmin
        .from("analyses")
        .select("id, created_at, paid, photo_url, goal_data, plan_result, snapshot_result, space_data, report_result")
        .eq("email", normalizedEmail)
        .eq("id", analysisId)
        .maybeSingle<AnalysisReportItem>();

    if (error || !data) {
        return null;
    }

    return data;
}

export async function recordAnalysisArtifact(input: {
    analysisId: string;
    artifactType: AnalysisArtifactType;
    artifactVersion?: string | null;
    storagePath?: string | null;
    payload?: Json;
}) {
    if (!isSupabaseAdminConfigured) {
        return false;
    }

    const { error } = await supabaseAdmin.from("analysis_artifacts").insert({
        analysis_id: input.analysisId,
        artifact_type: input.artifactType,
        artifact_version: input.artifactVersion ?? null,
        storage_path: input.storagePath ?? null,
        payload: input.payload ?? null,
    });

    return !error;
}

export async function getLatestAnalysisArtifact<T = Json>(
    analysisId: string,
    artifactType: AnalysisArtifactType,
): Promise<{ payload: T | null; artifactVersion: string | null; storagePath: string | null } | null> {
    if (!isSupabaseAdminConfigured) {
        return null;
    }

    const { data, error } = await supabaseAdmin
        .from("analysis_artifacts")
        .select("payload, artifact_version, storage_path")
        .eq("analysis_id", analysisId)
        .eq("artifact_type", artifactType)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle<{ payload: T | null; artifact_version: string | null; storage_path: string | null }>();

    if (error || !data) {
        return null;
    }

    return {
        payload: data.payload,
        artifactVersion: data.artifact_version,
        storagePath: data.storage_path,
    };
}

export async function updateAnalysisProgress(
    analysisId: string,
    input: {
        analysisStatus?: "processing" | "completed" | "failed";
        failureReason?: string | null;
        pipelineStage?: AnalysisPipelineStage;
        pipelineStatus?: "pending" | "processing" | "completed" | "failed";
        preanalysisStatus?: AnalysisGenerationStatus;
        snapshotStatus?: AnalysisGenerationStatus;
        fullReportStatus?: AnalysisGenerationStatus;
        attemptCount?: number;
        lastErrorCode?: string | null;
        lastErrorMessage?: string | null;
        preanalysisGeneratedAt?: string | null;
        snapshotGeneratedAt?: string | null;
        fullReportGeneratedAt?: string | null;
        promptVersion?: string | null;
        schemaVersion?: string | null;
        modelName?: string | null;
        preanalysisVersion?: string | null;
    },
) {
    if (!isSupabaseAdminConfigured) {
        return false;
    }

    const { error } = await supabaseAdmin
        .from("analyses")
        .update({
            analysis_status: input.analysisStatus,
            failure_reason: input.failureReason,
            pipeline_stage: input.pipelineStage,
            pipeline_status: input.pipelineStatus,
            preanalysis_status: input.preanalysisStatus,
            snapshot_status: input.snapshotStatus,
            full_report_status: input.fullReportStatus,
            attempt_count: input.attemptCount,
            last_error_code: input.lastErrorCode,
            last_error_message: input.lastErrorMessage,
            preanalysis_generated_at: input.preanalysisGeneratedAt,
            snapshot_generated_at: input.snapshotGeneratedAt,
            full_report_generated_at: input.fullReportGeneratedAt,
            prompt_version: input.promptVersion,
            schema_version: input.schemaVersion,
            model_name: input.modelName,
            preanalysis_version: input.preanalysisVersion,
        })
        .eq("id", analysisId);

    return !error;
}
