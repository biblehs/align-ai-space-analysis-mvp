import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase";

type FunnelEvent = "auth_started" | "auth_completed" | "upload_started" | "upload_completed" | "analysis_requested" | "analysis_succeeded" | "checkout_started" | "checkout_completed";

type FunnelCounts = Record<FunnelEvent, number>;

export type DashboardMetrics = {
    kpis: {
        totalUsers: number;
        loginCompletedLast7Days: number;
        analysisSucceededLast7Days: number;
        checkoutCompletedLast7Days: number;
    };
    performance: {
        avgUploadClientMs: number | null;
        avgAnalysisProcessingMs: number | null;
        p95AnalysisProcessingMs: number | null;
        avgProcessingWaitMs: number | null;
    };
    pipelineTiming: {
        steps: Array<{
            key: string;
            label: string;
            count: number;
            avgMs: number | null;
            p95Ms: number | null;
            maxMs: number | null;
        }>;
        recent: Array<{
            analysisId: string | null;
            eventName: string;
            status: string | null;
            totalMs: number | null;
            createdAt: string;
        }>;
    };
    funnel: FunnelCounts;
    loginBreakdown: {
        email: number;
        google: number;
        other: number;
    };
    goalBreakdown: Record<string, number>;
    eventsTrend: Array<{
        date: string;
        counts: Record<string, number>;
    }>;
};

const FUNNEL_EVENTS: FunnelEvent[] = [
    "auth_started",
    "auth_completed",
    "upload_started",
    "upload_completed",
    "analysis_requested",
    "analysis_succeeded",
    "checkout_started",
    "checkout_completed",
];

const TIMING_STEP_LABELS: Record<string, string> = {
    preanalysis_download_photo_ms: "Preanalysis: download photo",
    preanalysis_fetch_photo_url_ms: "Preanalysis: fetch photo URL",
    preanalysis_read_photo_buffer_ms: "Preanalysis: read image buffer",
    preanalysis_preprocess_image_ms: "Preanalysis: preprocess image",
    preanalysis_gemini_vision_ms: "Preanalysis: Gemini vision",
    preanalysis_gemini_room_preanalysis_rescue_ms: "Preanalysis: Gemini rescue scan",
    preanalysis_save_artifact_ms: "Preanalysis: save derived artifact",
    preanalysis_record_vision_artifact_ms: "Preanalysis: record vision artifact",
    preanalysis_total_ms: "Preanalysis: total",
    snapshot_record_normalized_input_ms: "Snapshot: record normalized input",
    snapshot_start_preanalysis_ms: "Snapshot: start/prewarm preanalysis",
    snapshot_wait_for_preanalysis_ms: "Snapshot: wait for preanalysis",
    snapshot_build_artifacts_ms: "Snapshot: build artifacts",
    snapshot_record_artifact_bundle_ms: "Snapshot: record artifact bundle",
    snapshot_writer_layer_ms: "Snapshot: writer layer",
    snapshot_save_record_ms: "Snapshot: save snapshot",
    snapshot_record_snapshot_artifact_ms: "Snapshot: record snapshot artifact",
    snapshot_total_ms: "Snapshot: total",
};

function isFunnelEvent(value: string): value is FunnelEvent {
    return (FUNNEL_EVENTS as string[]).includes(value);
}

function buildDefaultFunnel(): FunnelCounts {
    return FUNNEL_EVENTS.reduce(
        (acc, event) => ({
            ...acc,
            [event]: 0,
        }),
        {} as FunnelCounts,
    );
}

function formatTimingStepLabel(key: string) {
    return TIMING_STEP_LABELS[key] ?? key.replace(/_/g, " ").replace(/\b\w/g, (match) => match.toUpperCase());
}

function getNumericTimingMap(value: unknown) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return null;
    }

    const entries = Object.entries(value as Record<string, unknown>)
        .filter(([, duration]) => typeof duration === "number" && Number.isFinite(duration) && duration >= 0) as Array<[string, number]>;

    return entries.length > 0 ? Object.fromEntries(entries) as Record<string, number> : null;
}

function getLast7Days(): string[] {
    const days: string[] = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() - i);
        const dayKey = date.toISOString().slice(0, 10);
        days.push(dayKey);
    }
    return days;
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
    if (!isSupabaseAdminConfigured) {
        return {
            kpis: {
                totalUsers: 0,
                loginCompletedLast7Days: 0,
                analysisSucceededLast7Days: 0,
                checkoutCompletedLast7Days: 0,
            },
            performance: {
                avgUploadClientMs: null,
                avgAnalysisProcessingMs: null,
                p95AnalysisProcessingMs: null,
                avgProcessingWaitMs: null,
            },
            pipelineTiming: {
                steps: [],
                recent: [],
            },
            funnel: buildDefaultFunnel(),
            loginBreakdown: {
                email: 0,
                google: 0,
                other: 0,
            },
            goalBreakdown: {},
            eventsTrend: getLast7Days().map((date) => ({
                date,
                counts: FUNNEL_EVENTS.reduce((acc, name) => ({ ...acc, [name]: 0 }), {} as Record<string, number>),
            })),
        };
    }

    const weekAgo = new Date();
    weekAgo.setHours(0, 0, 0, 0);
    weekAgo.setDate(weekAgo.getDate() - 6);

    const [
        totalUsersRes,
        eventsRes,
        profilesRes,
    ] = await Promise.all([
        supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }),
        supabaseAdmin
            .from("analytics_events")
            .select("analysis_id, event_name, created_at, properties")
            .gte("created_at", weekAgo.toISOString())
            .order("created_at", { ascending: true }),
        supabaseAdmin.from("profiles").select("provider, onboarding_goal"),
    ]);

    const totalUsers = totalUsersRes.count ?? 0;
    const events = eventsRes.data ?? [];
    const profiles = profilesRes.data ?? [];

    const funnel = buildDefaultFunnel();
    let loginCompletedLast7Days = 0;
    let analysisSucceededLast7Days = 0;
    let checkoutCompletedLast7Days = 0;
    const uploadClientDurations: number[] = [];
    const analysisProcessingDurations: number[] = [];
    const processingWaitDurations: number[] = [];
    const pipelineTimingDurations: Record<string, number[]> = {};
    const recentTimingEvents: DashboardMetrics["pipelineTiming"]["recent"] = [];

    const eventTrendMap: Record<string, Record<string, number>> = {};
    getLast7Days().forEach((day) => {
        eventTrendMap[day] = FUNNEL_EVENTS.reduce(
            (acc, event) => ({
                ...acc,
                [event]: 0,
            }),
            {} as Record<string, number>,
        );
    });

    events.forEach((event) => {
        const name = event.event_name;
        const dayKey = event.created_at?.slice(0, 10);
        if (isFunnelEvent(name)) {
            funnel[name]++;
            if (dayKey && eventTrendMap[dayKey]) {
                eventTrendMap[dayKey][name] = (eventTrendMap[dayKey][name] ?? 0) + 1;
            }

            if (name === "auth_completed") {
                loginCompletedLast7Days++;
            }
            if (name === "analysis_succeeded") {
                analysisSucceededLast7Days++;
            }
            if (name === "checkout_completed") {
                checkoutCompletedLast7Days++;
            }
        }

        const properties = event.properties && typeof event.properties === "object" ? event.properties as Record<string, unknown> : null;
        const uploadMs = properties && typeof properties.clientElapsedMs === "number" ? properties.clientElapsedMs : null;
        const analysisMs = properties && typeof properties.processingDurationMs === "number" ? properties.processingDurationMs : null;
        const processingWaitMs = properties && typeof properties.processingWaitMs === "number" ? properties.processingWaitMs : null;
        const timings = getNumericTimingMap(properties?.timings);

        if (typeof uploadMs === "number" && Number.isFinite(uploadMs) && uploadMs > 0) {
            uploadClientDurations.push(uploadMs);
        }

        if (typeof analysisMs === "number" && Number.isFinite(analysisMs) && analysisMs > 0) {
            analysisProcessingDurations.push(analysisMs);
        }

        if (typeof processingWaitMs === "number" && Number.isFinite(processingWaitMs) && processingWaitMs > 0) {
            processingWaitDurations.push(processingWaitMs);
        }

        if (timings) {
            Object.entries(timings).forEach(([step, duration]) => {
                pipelineTimingDurations[step] = pipelineTimingDurations[step] ?? [];
                pipelineTimingDurations[step].push(duration);
            });

            const totalMs = timings.snapshot_total_ms ?? timings.preanalysis_total_ms ?? analysisMs ?? null;
            recentTimingEvents.push({
                analysisId: event.analysis_id ?? null,
                eventName: name,
                status: typeof properties?.status === "string" ? properties.status : null,
                totalMs,
                createdAt: event.created_at,
            });
        }
    });

    const average = (values: number[]) =>
        values.length > 0 ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : null;
    const percentile95 = (values: number[]) => {
        if (values.length === 0) {
            return null;
        }

        const sorted = [...values].sort((a, b) => a - b);
        const index = Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1);
        return Math.round(sorted[index]);
    };

    const max = (values: number[]) => values.length > 0 ? Math.round(Math.max(...values)) : null;

    const pipelineTimingSteps = Object.entries(pipelineTimingDurations)
        .map(([key, values]) => ({
            key,
            label: formatTimingStepLabel(key),
            count: values.length,
            avgMs: average(values),
            p95Ms: percentile95(values),
            maxMs: max(values),
        }))
        .sort((left, right) => {
            const leftTotal = left.key.endsWith("_total_ms") ? 0 : 1;
            const rightTotal = right.key.endsWith("_total_ms") ? 0 : 1;
            if (leftTotal !== rightTotal) {
                return leftTotal - rightTotal;
            }

            return (right.avgMs ?? 0) - (left.avgMs ?? 0);
        });

    const loginBreakdown = profiles.reduce(
        (acc, profile) => {
            const provider = (profile.provider ?? "email").toLowerCase();
            if (provider === "google") {
                acc.google += 1;
            } else if (provider === "email" || provider === "") {
                acc.email += 1;
            } else {
                acc.other += 1;
            }
            return acc;
        },
        {
            email: 0,
            google: 0,
            other: 0,
        },
    );

    const goalBreakdown = profiles.reduce((acc, profile) => {
        const goal = profile.onboarding_goal?.trim() || "unspecified";
        acc[goal] = (acc[goal] ?? 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const eventsTrend = getLast7Days().map((date) => ({
        date,
        counts: eventTrendMap[date],
    }));

    return {
        kpis: {
            totalUsers,
            loginCompletedLast7Days,
            analysisSucceededLast7Days,
            checkoutCompletedLast7Days,
        },
        performance: {
            avgUploadClientMs: average(uploadClientDurations),
            avgAnalysisProcessingMs: average(analysisProcessingDurations),
            p95AnalysisProcessingMs: percentile95(analysisProcessingDurations),
            avgProcessingWaitMs: average(processingWaitDurations),
        },
        pipelineTiming: {
            steps: pipelineTimingSteps,
            recent: recentTimingEvents
                .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
                .slice(0, 10),
        },
        funnel,
        loginBreakdown,
        goalBreakdown,
        eventsTrend,
    };
}
