import { NextResponse } from "next/server";
import { isSupabaseAdminConfigured, isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase";
import { logger } from "@/lib/logger";

const isProductionRuntime = process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";

function getProjectRef(url: string | undefined) {
    if (!url) return null;

    try {
        return new URL(url).hostname.split(".")[0] ?? null;
    } catch {
        return null;
    }
}

function formatIssue(scope: string, error: { message?: string | null; code?: string | null; status?: number | null } | null) {
    if (!error) return null;

    const details = [error.code, error.status ? String(error.status) : null, error.message?.trim() || null]
        .filter(Boolean)
        .join(" ");

    return `${scope}: ${details || "unknown error"}`;
}

function buildFailureResponse(error: string, diagnostics?: Record<string, unknown>) {
    return NextResponse.json(
        isProductionRuntime
            ? { success: false, error }
            : {
                success: false,
                error,
                ...(diagnostics ? { data: diagnostics } : {}),
            },
        { status: 500 }
    );
}

function buildSuccessResponse(diagnostics: Record<string, unknown>) {
    return NextResponse.json(
        isProductionRuntime
            ? { success: true }
            : {
                success: true,
                data: diagnostics,
            }
    );
}

export async function GET() {
    const projectRef = getProjectRef(process.env.NEXT_PUBLIC_SUPABASE_URL);

    if (!isSupabaseConfigured) {
        return buildFailureResponse("Supabase public env is missing", {
            configured: false,
            adminConfigured: isSupabaseAdminConfigured,
            projectRef,
        });
    }

    if (!isSupabaseAdminConfigured) {
        return buildFailureResponse("Supabase admin env is missing", {
            configured: true,
            adminConfigured: false,
            projectRef,
        });
    }

    try {
        const [
            profilesCheck,
            analysesCheck,
            checkinsCheck,
            anonymousUploadLimitsCheck,
            securityEventsCheck,
            uploadRateLimitsCheck,
            analysisJobsCheck,
            analysisArtifactsCheck,
            roomPhotosBucketCheck,
        ] = await Promise.all([
            supabaseAdmin.from("profiles").select("id", { head: true, count: "exact" }),
            supabaseAdmin.from("analyses").select("id", { head: true, count: "exact" }),
            supabaseAdmin.from("checkins").select("id", { head: true, count: "exact" }),
            supabaseAdmin.from("anonymous_upload_limits").select("ip_hash", { head: true, count: "exact" }),
            supabaseAdmin.from("security_events").select("id", { head: true, count: "exact" }),
            supabaseAdmin.from("upload_rate_limits").select("scope", { head: true, count: "exact" }),
            supabaseAdmin.from("analysis_jobs").select("analysis_id", { head: true, count: "exact" }),
            supabaseAdmin.from("analysis_artifacts").select("id", { head: true, count: "exact" }),
            supabaseAdmin.storage.from("room-photos").list("", { limit: 1 }),
        ]);

        const issues = [
            formatIssue("profiles", profilesCheck.error),
            formatIssue("analyses", analysesCheck.error),
            formatIssue("checkins", checkinsCheck.error),
            formatIssue("anonymous_upload_limits", anonymousUploadLimitsCheck.error),
            formatIssue("security_events", securityEventsCheck.error),
            formatIssue("upload_rate_limits", uploadRateLimitsCheck.error),
            formatIssue("analysis_jobs", analysisJobsCheck.error),
            formatIssue("analysis_artifacts", analysisArtifactsCheck.error),
            formatIssue("storage", roomPhotosBucketCheck.error),
        ].filter(Boolean);

        if (issues.length > 0) {
            logger.warn("Supabase health check found schema issues", { issues, projectRef });
            return buildFailureResponse("Supabase is reachable but schema setup is incomplete", {
                configured: true,
                adminConfigured: true,
                projectRef,
                issues,
            });
        }

        return buildSuccessResponse({
            configured: true,
            adminConfigured: true,
            projectRef,
            profilesTable: "ok",
            analysesTable: "ok",
            checkinsTable: "ok",
            anonymousUploadLimitsTable: "ok",
            securityEventsTable: "ok",
            uploadRateLimitsTable: "ok",
            analysisJobsTable: "ok",
            analysisArtifactsTable: "ok",
            roomPhotosBucket: "ok",
        });
    } catch (error) {
        logger.error("Supabase health check failed", error);
        return buildFailureResponse("Unable to reach Supabase from the server runtime", {
            configured: true,
            adminConfigured: true,
            projectRef,
        });
    }
}
