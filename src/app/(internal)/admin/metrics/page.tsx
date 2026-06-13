"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { DashboardMetrics } from "@/lib/repositories/metrics-repository";
import { getAuthHeaders } from "@/lib/auth-client";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import { appAuthHref } from "@/lib/navigation";

const KPI_CARDS: Array<{ label: string; key: keyof DashboardMetrics["kpis"]; description: string }> = [
    { label: "Total users", key: "totalUsers", description: "Ever signed up for ALIGN" },
    { label: "Login success (7d)", key: "loginCompletedLast7Days", description: "auth_completed events (last week)" },
    { label: "Analyses succeeded (7d)", key: "analysisSucceededLast7Days", description: "analysis_succeeded events" },
    { label: "Checkout completed (7d)", key: "checkoutCompletedLast7Days", description: "checkout_completed events" },
];

const PERFORMANCE_CARDS: Array<{ label: string; key: keyof DashboardMetrics["performance"]; description: string }> = [
    { label: "Avg upload", key: "avgUploadClientMs", description: "Client-side upload to step 2" },
    { label: "Avg analysis", key: "avgAnalysisProcessingMs", description: "Worker processing duration" },
    { label: "P95 analysis", key: "p95AnalysisProcessingMs", description: "Worst 5% processing duration" },
    { label: "Avg wait", key: "avgProcessingWaitMs", description: "Processing page wait before snapshot" },
];

const FUNNEL_EVENTS = [
    "auth_started",
    "auth_completed",
    "upload_started",
    "upload_completed",
    "analysis_requested",
    "analysis_succeeded",
    "checkout_started",
    "checkout_completed",
] as const;

function formatNumber(value: number) {
    return new Intl.NumberFormat("en-US").format(value);
}

function formatMetricValue(value: number | null, unit: "count" | "ms" = "count") {
    if (value === null) {
        return "—";
    }

    if (unit === "ms") {
        if (value >= 1000) {
            return `${(value / 1000).toFixed(1)}s`;
        }
        return `${Math.round(value)}ms`;
    }

    return formatNumber(value);
}

function shortAnalysisId(value: string | null) {
    if (!value) {
        return "unknown";
    }

    return value.length > 8 ? value.slice(0, 8) : value;
}

function buildGoalList(goals: Record<string, number>) {
    const entries = Object.entries(goals).sort((a, b) => b[1] - a[1]);
    const total = entries.reduce((sum, [, value]) => sum + value, 0) || 1;
    return entries.map(([goal, count]) => ({
        goal,
        count,
        percent: Math.round((count / total) * 100),
    }));
}

function FunnelRow({ label, value, max }: { label: string; value: number; max: number }) {
    const width = max > 0 ? Math.max(6, Math.min(100, Math.round((value / max) * 100))) : 6;
    return (
        <div className="flex items-center gap-3 text-sm">
            <div className="w-24 text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
            <div className="flex-1 bg-white/5">
                <div
                    className="h-2 rounded-full bg-gradient-to-r from-lime-400 to-emerald-500 transition-all duration-300 ease-out"
                    style={{ width: `${width}%` }}
                />
            </div>
            <span className="min-w-[3rem] text-right text-xs font-semibold text-foreground">{formatNumber(value)}</span>
        </div>
    );
}

function TrendBar({ counts }: { counts: Record<string, number> }) {
    return (
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            {Object.entries(counts).map(([event, value], index) => {
                if (value === 0) {
                    return null;
                }
                const hue = 60 + index * 30;
                return (
                    <span
                        key={event}
                        className="rounded-full px-2 py-1"
                        style={{
                            background: `hsla(${hue}, 85%, 55%, 0.2)`,
                            color: `hsl(${hue}, 90%, 75%)`,
                        }}
                    >
                        {event}: {value}
                    </span>
                );
            })}
        </div>
    );
}

function UnauthorizedState({ authenticated }: { authenticated: boolean }) {
    if (!authenticated) {
        return (
            <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#0f172a,_#020617)] text-white">
                <div className="mx-auto flex min-h-screen max-w-3xl items-center px-4 py-16">
                    <div className="w-full rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.8)]">
                        <p className="text-sm uppercase tracking-[0.4em] text-slate-400">Restricted</p>
                        <h1 className="mt-4 font-heading text-4xl font-semibold">Sign in required</h1>
                        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-300">
                            This admin dashboard is only available to the internal ALIGN operator account.
                        </p>
                        <Link
                            href={`${appAuthHref}?redirect=${encodeURIComponent("/admin/metrics")}`}
                            className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-bold text-slate-900 transition-opacity hover:opacity-90"
                        >
                            Sign In
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#0f172a,_#020617)] text-white">
            <div className="mx-auto flex min-h-screen max-w-3xl items-center px-4 py-16">
                <div className="w-full rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.8)]">
                    <p className="text-sm uppercase tracking-[0.4em] text-slate-400">Restricted</p>
                    <h1 className="mt-4 font-heading text-4xl font-semibold">Internal access only</h1>
                    <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-300">
                        Your account is signed in, but it is not authorized for internal operations.
                    </p>
                </div>
            </div>
        </main>
    );
}

export default function MetricsPage() {
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [hasAccess, setHasAccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const loadMetrics = async () => {
            try {
                const supabase = getBrowserSupabase();
                const { data } = await supabase.auth.getUser();
                const email = data.user?.email ?? null;

                if (!isMounted) {
                    return;
                }

                if (!email) {
                    setIsAuthenticated(false);
                    setHasAccess(false);
                    setIsLoading(false);
                    return;
                }

                setIsAuthenticated(true);

                const authHeaders = await getAuthHeaders();
                const res = await fetch("/api/admin/metrics", {
                    headers: authHeaders,
                });
                const json = await res.json().catch(() => null);

                if (!isMounted) {
                    return;
                }

                if (!res.ok || !json?.success || !json?.data?.metrics) {
                    if (res.status === 401) {
                        setIsAuthenticated(false);
                        setHasAccess(false);
                        setIsLoading(false);
                        return;
                    }

                    if (res.status === 403) {
                        setHasAccess(false);
                        setIsLoading(false);
                        return;
                    }

                    throw new Error(json?.error || "Unable to load admin metrics.");
                }

                setHasAccess(true);
                setMetrics(json.data.metrics);
            } catch (caughtError) {
                if (!isMounted) {
                    return;
                }
                setError(caughtError instanceof Error ? caughtError.message : "Unable to load admin metrics.");
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        void loadMetrics();

        return () => {
            isMounted = false;
        };
    }, []);

    const goalList = useMemo(() => buildGoalList(metrics?.goalBreakdown ?? {}), [metrics]);
    const trendDays = metrics?.eventsTrend ?? [];
    const maxFunnelValue = Math.max(...Object.values(metrics?.funnel ?? {}).map((value) => value || 0), 1);

    if (isLoading) {
        return (
            <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#0f172a,_#020617)] text-white">
                <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-16">
                    <div className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-slate-300">
                        Loading admin metrics...
                    </div>
                </div>
            </main>
        );
    }

    if (!hasAccess) {
        return <UnauthorizedState authenticated={isAuthenticated} />;
    }

    if (!metrics || error) {
        return (
            <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#0f172a,_#020617)] text-white">
                <div className="mx-auto flex min-h-screen max-w-3xl items-center px-4 py-16">
                    <div className="w-full rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.8)]">
                        <p className="text-sm uppercase tracking-[0.4em] text-slate-400">Admin metrics</p>
                        <h1 className="mt-4 font-heading text-4xl font-semibold">Unable to load dashboard</h1>
                        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-300">
                            {error || "The dashboard data is not available right now."}
                        </p>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#0f172a,_#020617)] text-white">
            <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-12 lg:py-16">
                <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900 to-slate-800/70 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.8)]">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-5">
                            <p className="text-sm uppercase tracking-[0.4em] text-slate-400">Operator Console</p>
                            <h1 className="font-heading text-4xl font-semibold leading-tight text-white sm:text-5xl">
                                ALIGN Metrics Hub
                            </h1>
                            <p className="max-w-3xl text-sm leading-relaxed text-slate-300 sm:text-base">
                                A weekly pulse on user acquisition, authentication, uploads, analyses, and checkout conversions.
                                This internal view reads aggregated profile and analytics-event data from Supabase so the team can monitor product health without leaving ALIGN.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Link
                                href="/admin/waitlist"
                                className="inline-flex h-11 items-center justify-center rounded-full border border-white/10 px-5 text-sm font-semibold text-slate-200 transition hover:border-white/25 hover:text-white"
                            >
                                View waitlist
                            </Link>
                        </div>
                    </div>
                    <div className="absolute right-[-2rem] top-4 h-28 w-28 rounded-full bg-gradient-to-br from-emerald-400/60 via-lime-400/40 to-transparent blur-[80px]" />
                </section>

                <section className="grid gap-6 lg:grid-cols-4">
                    {KPI_CARDS.map((card) => (
                        <div
                            key={card.key}
                            className="group flex flex-col justify-between rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_15px_45px_rgba(2,6,23,0.6)] transition-colors hover:border-emerald-300/60 hover:bg-emerald-400/10"
                        >
                            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">{card.label}</p>
                            <p className="mt-4 text-4xl font-semibold text-white">{formatNumber(metrics.kpis[card.key])}</p>
                            <p className="mt-2 text-sm text-slate-300">{card.description}</p>
                        </div>
                    ))}
                </section>

                <section className="grid gap-6 lg:grid-cols-4">
                    {PERFORMANCE_CARDS.map((card) => (
                        <div
                            key={card.key}
                            className="group flex flex-col justify-between rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_15px_45px_rgba(2,6,23,0.6)] transition-colors hover:border-sky-300/60 hover:bg-sky-400/10"
                        >
                            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">{card.label}</p>
                            <p className="mt-4 text-4xl font-semibold text-white">
                                {formatMetricValue(metrics.performance[card.key], "ms")}
                            </p>
                            <p className="mt-2 text-sm text-slate-300">{card.description}</p>
                        </div>
                    ))}
                </section>

                <section className="grid gap-6 rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_20px_60px_rgba(2,6,23,0.7)] lg:grid-cols-[1.45fr_0.95fr]">
                    <div className="space-y-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Pipeline timing</p>
                                <h2 className="mt-2 text-xl font-semibold text-white">Snapshot step timings</h2>
                            </div>
                            <p className="text-xs text-slate-400">Last 7 days, from worker event timings</p>
                        </div>
                        {metrics.pipelineTiming.steps.length > 0 ? (
                            <div className="overflow-hidden rounded-2xl border border-white/10">
                                <div className="grid grid-cols-[1fr_4.5rem_5rem_5rem_5rem] gap-3 border-b border-white/10 bg-white/5 px-4 py-3 text-xs uppercase tracking-[0.24em] text-slate-400">
                                    <span>Step</span>
                                    <span className="text-right">Count</span>
                                    <span className="text-right">Avg</span>
                                    <span className="text-right">P95</span>
                                    <span className="text-right">Max</span>
                                </div>
                                <div className="divide-y divide-white/10">
                                    {metrics.pipelineTiming.steps.map((step) => (
                                        <div
                                            key={step.key}
                                            className="grid grid-cols-[1fr_4.5rem_5rem_5rem_5rem] gap-3 px-4 py-3 text-sm"
                                        >
                                            <span className="font-medium text-white">{step.label}</span>
                                            <span className="text-right text-slate-300">{formatNumber(step.count)}</span>
                                            <span className="text-right text-slate-300">{formatMetricValue(step.avgMs, "ms")}</span>
                                            <span className="text-right text-slate-300">{formatMetricValue(step.p95Ms, "ms")}</span>
                                            <span className="text-right text-slate-300">{formatMetricValue(step.maxMs, "ms")}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
                                No pipeline timing events yet. Generate a new snapshot to populate this table.
                            </div>
                        )}
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-white">Recent timing events</h2>
                        <div className="space-y-3">
                            {metrics.pipelineTiming.recent.length > 0 ? metrics.pipelineTiming.recent.map((event) => (
                                <div
                                    key={`${event.createdAt}-${event.analysisId ?? event.eventName}`}
                                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-sm font-semibold text-white">{event.eventName}</span>
                                        <span className="text-sm font-semibold text-emerald-300">{formatMetricValue(event.totalMs, "ms")}</span>
                                    </div>
                                    <div className="mt-2 flex items-center justify-between gap-3 text-xs text-slate-400">
                                        <span>{shortAnalysisId(event.analysisId)}</span>
                                        <span>{event.status ?? "completed"}</span>
                                    </div>
                                </div>
                            )) : (
                                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
                                    Timing events will appear here after the next snapshot run.
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                <section className="grid gap-6 rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_20px_60px_rgba(2,6,23,0.7)] lg:grid-cols-2">
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-white">Conversion funnel (last 7 days)</h2>
                        <div className="space-y-3">
                            {FUNNEL_EVENTS.map((event) => (
                                <FunnelRow key={event} label={event.replace("_", " ")} value={metrics.funnel[event]} max={maxFunnelValue} />
                            ))}
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-white">Login method distribution</h2>
                        <div className="space-y-3">
                            {Object.entries(metrics.loginBreakdown).map(([method, value]) => {
                                const total = Object.values(metrics.loginBreakdown).reduce((sum, current) => sum + current, 0) || 1;
                                const percent = Math.round((value / total) * 100);
                                return (
                                    <div key={method} className="space-y-1">
                                        <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-400">
                                            <span>{method}</span>
                                            <span>{percent}%</span>
                                        </div>
                                        <div className="h-2 w-full rounded-full bg-white/10">
                                            <div
                                                className="h-2 rounded-full bg-gradient-to-r from-emerald-400 to-lime-400"
                                                style={{ width: `${Math.max(4, percent)}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <h3 className="text-base font-semibold text-white">Primary onboarding goals</h3>
                        <div className="space-y-2 text-sm text-slate-300">
                            {goalList.map((goal) => (
                                <div key={goal.goal} className="flex items-center gap-3">
                                    <span className="inline-flex h-3 w-3 rounded-full bg-gradient-to-br from-lime-300 to-emerald-400" />
                                    <span className="font-medium text-white">{goal.goal}</span>
                                    <span className="ml-auto text-xs text-slate-400">{formatNumber(goal.count)} users</span>
                                    <span className="text-xs text-slate-500">{goal.percent}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="space-y-6 rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900/60 to-slate-800/40 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.8)]">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-white">Event trend (last 7 days)</h2>
                        <p className="text-xs uppercase tracking-[0.4em] text-slate-400">live feed</p>
                    </div>
                    <div className="space-y-4">
                        {trendDays.map((day) => (
                            <div
                                key={day.date}
                                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur"
                            >
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-semibold text-white">{day.date}</p>
                                    <span className="text-xs uppercase tracking-[0.4em] text-emerald-300">
                                        {Object.values(day.counts).reduce((sum, value) => sum + value, 0)} events
                                    </span>
                                </div>
                                <TrendBar counts={day.counts} />
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </main>
    );
}
