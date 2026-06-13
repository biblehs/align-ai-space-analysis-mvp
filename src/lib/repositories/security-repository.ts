import { isSupabaseAdminConfigured, supabaseAdmin } from "@/lib/supabase";
import type { Json } from "@/types/database";

export type SecurityEventSeverity = "info" | "warning" | "critical";
export type UploadRateLimitScope = "ip_short" | "session_short" | "user_daily";
export type AnalysisJobStatus = "queued" | "processing" | "retrying" | "completed" | "failed";

export async function getAnonymousUploadUsage(ipHash: string) {
    if (!isSupabaseAdminConfigured) {
        return null;
    }

    const { data, error } = await supabaseAdmin
        .from("anonymous_upload_limits")
        .select("ip_hash, upload_count, first_upload_at, last_upload_at, last_analysis_id")
        .eq("ip_hash", ipHash)
        .maybeSingle<{
            ip_hash: string;
            upload_count: number;
            first_upload_at: string;
            last_upload_at: string;
            last_analysis_id: string | null;
        }>();

    if (error) {
        return null;
    }

    return data;
}

export async function incrementAnonymousUploadUsage(input: {
    ipHash: string;
    analysisId?: string | null;
    userAgent?: string | null;
}) {
    if (!isSupabaseAdminConfigured) {
        return false;
    }

    const current = await getAnonymousUploadUsage(input.ipHash);
    const uploadCount = (current?.upload_count ?? 0) + 1;

    const { error } = await supabaseAdmin.from("anonymous_upload_limits").upsert({
        ip_hash: input.ipHash,
        upload_count: uploadCount,
        first_upload_at: current?.first_upload_at,
        last_upload_at: new Date().toISOString(),
        last_analysis_id: input.analysisId ?? current?.last_analysis_id ?? null,
        last_user_agent: input.userAgent ?? null,
    });

    return !error;
}

export async function recordSecurityEvent(input: {
    eventType: string;
    severity?: SecurityEventSeverity;
    ipHash?: string | null;
    analysisId?: string | null;
    requestPath?: string | null;
    userAgent?: string | null;
    detail?: Record<string, unknown>;
}) {
    if (!isSupabaseAdminConfigured) {
        return false;
    }

    const { error } = await supabaseAdmin.from("security_events").insert({
        event_type: input.eventType,
        severity: input.severity ?? "info",
        ip_hash: input.ipHash ?? null,
        analysis_id: input.analysisId ?? null,
        request_path: input.requestPath ?? null,
        user_agent: input.userAgent ?? null,
        detail: (input.detail ?? {}) as Json,
    });

    return !error;
}

export async function getUploadRateLimit(scope: UploadRateLimitScope, scopeKey: string) {
    if (!isSupabaseAdminConfigured) {
        return null;
    }

    const { data, error } = await supabaseAdmin
        .from("upload_rate_limits")
        .select("scope, scope_key, window_started_at, last_upload_at, upload_count")
        .eq("scope", scope)
        .eq("scope_key", scopeKey)
        .maybeSingle<{
            scope: UploadRateLimitScope;
            scope_key: string;
            window_started_at: string;
            last_upload_at: string;
            upload_count: number;
        }>();

    if (error) {
        return null;
    }

    return data;
}

export async function incrementUploadRateLimit(input: {
    scope: UploadRateLimitScope;
    scopeKey: string;
    now: Date;
    windowMs?: number;
}) {
    if (!isSupabaseAdminConfigured) {
        return false;
    }

    const current = await getUploadRateLimit(input.scope, input.scopeKey);
    const nowIso = input.now.toISOString();
    let windowStartedAt = nowIso;
    let uploadCount = 1;

    if (current) {
        const previousStartedAt = new Date(current.window_started_at);
        const shouldReset =
            input.scope === "user_daily"
                ? previousStartedAt.toISOString().slice(0, 10) !== input.now.toISOString().slice(0, 10)
                : input.windowMs
                    ? input.now.getTime() - previousStartedAt.getTime() >= input.windowMs
                    : false;

        windowStartedAt = shouldReset ? nowIso : current.window_started_at;
        uploadCount = shouldReset ? 1 : current.upload_count + 1;
    }

    const { error } = await supabaseAdmin.from("upload_rate_limits").upsert({
        scope: input.scope,
        scope_key: input.scopeKey,
        window_started_at: windowStartedAt,
        last_upload_at: nowIso,
        upload_count: uploadCount,
    });

    return !error;
}

export async function getActiveAnalysisJobCount(input: {
    userId?: string | null;
    ipHash?: string | null;
}) {
    if (!isSupabaseAdminConfigured) {
        return 0;
    }

    if (input.userId) {
        const { count, error } = await supabaseAdmin
            .from("analysis_jobs")
            .select("analysis_id", { head: true, count: "exact" })
            .eq("user_id", input.userId)
            .in("status", ["queued", "processing", "retrying"]);

        return error ? 0 : count ?? 0;
    }

    if (input.ipHash) {
        const { count, error } = await supabaseAdmin
            .from("analysis_jobs")
            .select("analysis_id", { head: true, count: "exact" })
            .eq("ip_hash", input.ipHash)
            .in("status", ["queued", "processing", "retrying"]);

        return error ? 0 : count ?? 0;
    }

    return 0;
}

export async function getAnalysisJob(analysisId: string) {
    if (!isSupabaseAdminConfigured) {
        return null;
    }

    const { data, error } = await supabaseAdmin
        .from("analysis_jobs")
        .select("analysis_id, user_id, ip_hash, status, job_type, stage, attempt_count, max_attempts, started_at, last_error, next_retry_at, created_at, updated_at, completed_at")
        .eq("analysis_id", analysisId)
        .maybeSingle<{
            analysis_id: string;
            user_id: string | null;
            ip_hash: string | null;
            status: AnalysisJobStatus;
            job_type: string;
            stage: string;
            attempt_count: number;
            max_attempts: number;
            started_at: string;
            last_error: string | null;
            next_retry_at: string | null;
            created_at: string;
            updated_at: string;
            completed_at: string | null;
        }>();

    if (error) {
        return null;
    }

    return data;
}

export async function upsertAnalysisJob(input: {
    analysisId: string;
    status: AnalysisJobStatus;
    stage?: string;
    jobType?: string;
    attemptCount?: number;
    maxAttempts?: number;
    lastError?: string | null;
    nextRetryAt?: string | null;
    userId?: string | null;
    ipHash?: string | null;
}) {
    if (!isSupabaseAdminConfigured) {
        return false;
    }

    const payload = {
        analysis_id: input.analysisId,
        user_id: input.userId ?? null,
        ip_hash: input.ipHash ?? null,
        status: input.status,
        job_type: input.jobType ?? "analysis",
        stage: input.stage ?? "snapshot",
        attempt_count: input.attemptCount ?? (input.status === "processing" ? 1 : 0),
        max_attempts: input.maxAttempts ?? 3,
        started_at: new Date().toISOString(),
        last_error: input.lastError ?? null,
        next_retry_at: input.nextRetryAt ?? null,
        completed_at: input.status === "completed" || input.status === "failed" ? new Date().toISOString() : null,
    };

    const { error } = await supabaseAdmin.from("analysis_jobs").upsert(payload);
    return !error;
}
