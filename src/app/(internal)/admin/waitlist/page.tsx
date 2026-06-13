"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Mail, RefreshCw, Send, Users } from "lucide-react";
import { getAuthHeaders } from "@/lib/auth-client";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import { appAuthHref } from "@/lib/navigation";
import type { WaitlistAdminResponse, WaitlistStatus, WaitlistUserRecord } from "@/types";

const statusOptions: Array<{ value: WaitlistStatus | "all"; label: string }> = [
    { value: "all", label: "All statuses" },
    { value: "waitlisted", label: "Waitlisted" },
    { value: "invited", label: "Invited" },
    { value: "claimed", label: "Claimed" },
    { value: "activated", label: "Activated" },
    { value: "converted", label: "Converted" },
    { value: "inactive", label: "Inactive" },
];

const goalOptions = [
    { value: "all", label: "All goals" },
    { value: "sleep", label: "Better sleep" },
    { value: "focus", label: "More focus" },
    { value: "calm", label: "Calm" },
    { value: "emotional_reset", label: "Emotional reset" },
];

const roomOptions = [
    { value: "all", label: "All rooms" },
    { value: "bedroom", label: "Bedroom" },
    { value: "workspace", label: "Workspace" },
    { value: "living_room", label: "Living room" },
    { value: "not_sure", label: "Not sure yet" },
];

const feedbackOptions = [
    { value: "all", label: "Any feedback state" },
    { value: "yes", label: "Yes" },
    { value: "maybe", label: "Maybe" },
    { value: "not_right_now", label: "Not right now" },
];

const sortOptions = [
    { value: "priority_desc", label: "Priority first" },
    { value: "newest", label: "Newest first" },
    { value: "oldest", label: "Oldest first" },
];

function formatDate(value: string | null | undefined) {
    if (!value) {
        return "—";
    }

    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(new Date(value));
}

function formatLabel(value: string | null | undefined) {
    if (!value) {
        return "—";
    }

    return value.replaceAll("_", " ");
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
                            This waitlist dashboard is only available to the internal ALIGN operator account.
                        </p>
                        <Link
                            href={`${appAuthHref}?redirect=${encodeURIComponent("/admin/waitlist")}`}
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

export default function AdminWaitlistPage() {
    const [data, setData] = useState<WaitlistAdminResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [hasAccess, setHasAccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState("all");
    const [goal, setGoal] = useState("all");
    const [room, setRoom] = useState("all");
    const [feedback, setFeedback] = useState("all");
    const [sort, setSort] = useState("priority_desc");
    const [search, setSearch] = useState("");
    const [searchDraft, setSearchDraft] = useState("");
    const [busyIds, setBusyIds] = useState<string[]>([]);
    const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [notice, setNotice] = useState<string | null>(null);

    const fetchWaitlist = async () => {
        setIsLoading(true);

        try {
            const supabase = getBrowserSupabase();
            const { data: authData } = await supabase.auth.getUser();
            const email = authData.user?.email ?? null;

            if (!email) {
                setIsAuthenticated(false);
                setHasAccess(false);
                setIsLoading(false);
                return;
            }

            setIsAuthenticated(true);

            const query = new URLSearchParams();
            if (status !== "all") query.set("status", status);
            if (goal !== "all") query.set("goal", goal);
            if (room !== "all") query.set("room", room);
            if (feedback !== "all") query.set("feedback", feedback);
            if (sort !== "priority_desc") query.set("sort", sort);
            if (search.trim()) query.set("search", search.trim());

            const res = await fetch(`/api/admin/waitlist${query.toString() ? `?${query.toString()}` : ""}`, {
                headers: await getAuthHeaders(),
            });
            const json = await res.json().catch(() => null);

            if (!res.ok || !json?.success || !json?.data) {
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

                throw new Error(json?.error || "Unable to load waitlist data.");
            }

            setHasAccess(true);
            setData(json.data);
            setSelectedIds((current) => current.filter((id) => json.data.users.some((user: WaitlistUserRecord) => user.id === id)));
        } catch (caughtError) {
            setError(caughtError instanceof Error ? caughtError.message : "Unable to load waitlist data.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void fetchWaitlist();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status, goal, room, feedback, sort, search]);

    const summaryCards = useMemo(() => {
        if (!data) {
            return [];
        }

        const emailStatuses = data.summary.emailByStatus ?? {};
        const failedEmails =
            (emailStatuses.failed ?? 0) +
            (emailStatuses.bounced ?? 0) +
            (emailStatuses.complained ?? 0) +
            (emailStatuses.suppressed ?? 0);

        return [
            { label: "Total waitlist", value: data.summary.total, note: "All submitted emails" },
            { label: "Confirmation sent", value: data.summary.confirmationSent, note: "Emails successfully queued or sent" },
            { label: "Feedback-friendly", value: data.summary.feedbackFriendly, note: "Yes or maybe to giving feedback" },
            { label: "High priority", value: data.summary.highPriority, note: "Priority score 5 or above" },
            { label: "Delivered", value: emailStatuses.delivered ?? 0, note: "Webhook-confirmed deliveries" },
            { label: "Opened", value: emailStatuses.opened ?? 0, note: "Recipients who opened an email" },
            { label: "Clicked", value: emailStatuses.clicked ?? 0, note: "Invite link engagement" },
            { label: "Failures", value: failedEmails, note: "Failed, bounced, complained, or suppressed" },
        ];
    }, [data]);

    const visibleIds = useMemo(() => data?.users.map((user) => user.id) ?? [], [data]);
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

    const mergeUsersIntoState = (nextUsers: WaitlistUserRecord[]) => {
        setData((current) => {
            if (!current) {
                return current;
            }

            const byId = new Map(nextUsers.map((user) => [user.id, user]));
            return {
                ...current,
                users: current.users.map((entry) => byId.get(entry.id) ?? entry),
            };
        });
    };

    const handleStatusUpdate = async (user: WaitlistUserRecord, nextStatus: WaitlistStatus) => {
        setBusyIds([user.id]);
        setError(null);
        setNotice(null);

        try {
            const res = await fetch("/api/admin/waitlist", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    ...(await getAuthHeaders()),
                },
                body: JSON.stringify({
                    id: user.id,
                    status: nextStatus,
                }),
            });

            const json = await res.json().catch(() => null);
            if (!res.ok || !json?.success || !json?.data?.user) {
                throw new Error(json?.error || "Unable to update waitlist user.");
            }

            mergeUsersIntoState([json.data.user]);
            setNotice(`${user.email} is now marked as ${formatLabel(nextStatus)}.`);

            void fetchWaitlist();
        } catch (caughtError) {
            setError(caughtError instanceof Error ? caughtError.message : "Unable to update waitlist user.");
        } finally {
            setBusyIds([]);
        }
    };

    const handleBulkStatus = async (nextStatus: WaitlistStatus) => {
        if (selectedIds.length === 0) {
            return;
        }

        setIsBulkSubmitting(true);
        setError(null);
        setNotice(null);

        try {
            const res = await fetch("/api/admin/waitlist", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(await getAuthHeaders()),
                },
                body: JSON.stringify({
                    action: "bulk_status",
                    ids: selectedIds,
                    status: nextStatus,
                }),
            });

            const json = await res.json().catch(() => null);
            if (!res.ok || !json?.success) {
                throw new Error(json?.error || "Unable to update selected waitlist users.");
            }

            mergeUsersIntoState(json.data?.users ?? []);
            setNotice(`Updated ${json.data?.summary?.updated ?? 0} selected people to ${formatLabel(nextStatus)}.`);
            void fetchWaitlist();
        } catch (caughtError) {
            setError(caughtError instanceof Error ? caughtError.message : "Unable to update selected waitlist users.");
        } finally {
            setIsBulkSubmitting(false);
        }
    };

    const handleSendInvites = async (ids: string[], mode: "single" | "bulk") => {
        if (ids.length === 0) {
            return;
        }

        if (mode === "bulk") {
            setIsBulkSubmitting(true);
        } else {
            setBusyIds(ids);
        }

        setError(null);
        setNotice(null);

        try {
            const res = await fetch("/api/admin/waitlist", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(await getAuthHeaders()),
                },
                body: JSON.stringify({
                    action: "send_invite",
                    ids,
                }),
            });

            const json = await res.json().catch(() => null);
            if (!res.ok || !json?.success) {
                throw new Error(json?.error || "Unable to send invite email.");
            }

            mergeUsersIntoState(json.data?.users ?? []);
            const sentCount = json.data?.summary?.sent ?? 0;
            const failedCount = json.data?.summary?.failed ?? 0;
            if (sentCount > 0 && failedCount === 0) {
                setNotice(`Invite email sent to ${sentCount} ${sentCount === 1 ? "person" : "people"}.`);
            } else if (sentCount > 0 && failedCount > 0) {
                setNotice(`Sent ${sentCount} invite ${sentCount === 1 ? "email" : "emails"} with ${failedCount} failure${failedCount === 1 ? "" : "s"}.`);
            } else {
                const firstFailure = json.data?.failures?.[0]?.reason;
                throw new Error(firstFailure || "No invite emails were sent.");
            }

            void fetchWaitlist();
        } catch (caughtError) {
            setError(caughtError instanceof Error ? caughtError.message : "Unable to send invite email.");
        } finally {
            setBusyIds([]);
            setIsBulkSubmitting(false);
        }
    };

    const toggleSelection = (id: string) => {
        setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
    };

    const toggleSelectAllVisible = () => {
        if (allVisibleSelected) {
            setSelectedIds((current) => current.filter((id) => !visibleIds.includes(id)));
            return;
        }

        setSelectedIds((current) => Array.from(new Set([...current, ...visibleIds])));
    };

    if (isLoading) {
        return (
            <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#0f172a,_#020617)] text-white">
                <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-16">
                    <div className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-slate-300">
                        Loading waitlist dashboard...
                    </div>
                </div>
            </main>
        );
    }

    if (!hasAccess) {
        return <UnauthorizedState authenticated={isAuthenticated} />;
    }

    if (!data || error) {
        return (
            <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#0f172a,_#020617)] text-white">
                <div className="mx-auto flex min-h-screen max-w-3xl items-center px-4 py-16">
                    <div className="w-full rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.8)]">
                        <p className="text-sm uppercase tracking-[0.4em] text-slate-400">Waitlist admin</p>
                        <h1 className="mt-4 font-heading text-4xl font-semibold">Unable to load dashboard</h1>
                        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-300">
                            {error || "The waitlist data is not available right now."}
                        </p>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#0f172a,_#020617)] text-white">
            <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
                <div className="mb-8 flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_20px_80px_rgba(15,23,42,0.45)] md:flex-row md:items-end md:justify-between">
                    <div>
                        <p className="text-sm uppercase tracking-[0.4em] text-slate-400">Operator Console</p>
                        <h1 className="mt-3 font-heading text-4xl font-semibold">Waitlist</h1>
                        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-300">
                            Review early access signups, sort by intent and priority, and move people from waitlisted to invited as you open new waves.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <Link href="/admin/metrics" className="inline-flex h-11 items-center justify-center rounded-full border border-white/15 px-5 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:text-white">
                            View metrics
                        </Link>
                        <button
                            type="button"
                            onClick={() => void fetchWaitlist()}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-slate-950 transition hover:opacity-90"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Refresh
                        </button>
                    </div>
                </div>

                <section className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {summaryCards.map((card) => (
                        <article key={card.label} className="rounded-[1.6rem] border border-white/10 bg-white/5 p-5">
                            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{card.label}</p>
                            <div className="mt-4 text-3xl font-semibold text-white">{card.value}</div>
                            <p className="mt-2 text-sm text-slate-400">{card.note}</p>
                        </article>
                    ))}
                </section>

                <section className="mb-8 rounded-[2rem] border border-white/10 bg-white/5 p-5">
                    <div className="grid gap-4 xl:grid-cols-[1.3fr_repeat(5,minmax(0,0.8fr))]">
                        <div>
                            <label className="mb-2 block text-xs uppercase tracking-[0.28em] text-slate-400">Search</label>
                            <div className="flex gap-2">
                                <input
                                    value={searchDraft}
                                    onChange={(event) => setSearchDraft(event.target.value)}
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter") {
                                            setSearch(searchDraft);
                                        }
                                    }}
                                    placeholder="email, source, or note"
                                    className="h-11 w-full rounded-full border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none placeholder:text-slate-500"
                                />
                                <button
                                    type="button"
                                    onClick={() => setSearch(searchDraft)}
                                    className="inline-flex h-11 items-center justify-center rounded-full border border-white/10 px-4 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:text-white"
                                >
                                    Apply
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-xs uppercase tracking-[0.28em] text-slate-400">Status</label>
                            <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 w-full rounded-full border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none">
                                {statusOptions.map((option) => (
                                    <option key={option.value} value={option.value} className="text-slate-950">
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-2 block text-xs uppercase tracking-[0.28em] text-slate-400">Goal</label>
                            <select value={goal} onChange={(event) => setGoal(event.target.value)} className="h-11 w-full rounded-full border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none">
                                {goalOptions.map((option) => (
                                    <option key={option.value} value={option.value} className="text-slate-950">
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-2 block text-xs uppercase tracking-[0.28em] text-slate-400">Room</label>
                            <select value={room} onChange={(event) => setRoom(event.target.value)} className="h-11 w-full rounded-full border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none">
                                {roomOptions.map((option) => (
                                    <option key={option.value} value={option.value} className="text-slate-950">
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-2 block text-xs uppercase tracking-[0.28em] text-slate-400">Feedback</label>
                            <select value={feedback} onChange={(event) => setFeedback(event.target.value)} className="h-11 w-full rounded-full border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none">
                                {feedbackOptions.map((option) => (
                                    <option key={option.value} value={option.value} className="text-slate-950">
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-2 block text-xs uppercase tracking-[0.28em] text-slate-400">Sort</label>
                            <select value={sort} onChange={(event) => setSort(event.target.value)} className="h-11 w-full rounded-full border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none">
                                {sortOptions.map((option) => (
                                    <option key={option.value} value={option.value} className="text-slate-950">
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </section>

                {selectedIds.length > 0 ? (
                    <section className="mb-6 flex flex-col gap-3 rounded-[1.6rem] border border-amber-300/15 bg-amber-300/10 px-5 py-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-3 text-sm text-amber-100">
                            <Users className="h-4 w-4" />
                            {selectedIds.length} selected
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={() => void handleBulkStatus("invited")}
                                disabled={isBulkSubmitting}
                                className="inline-flex h-10 items-center justify-center rounded-full border border-white/15 px-4 text-sm font-semibold text-white transition hover:border-white/30 disabled:opacity-60"
                            >
                                Mark invited
                            </button>
                            <button
                                type="button"
                                onClick={() => void handleSendInvites(selectedIds, "bulk")}
                                disabled={isBulkSubmitting}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-slate-950 transition hover:opacity-90 disabled:opacity-60"
                            >
                                <Send className="h-4 w-4" />
                                Send invite emails
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedIds([])}
                                disabled={isBulkSubmitting}
                                className="inline-flex h-10 items-center justify-center rounded-full border border-white/15 px-4 text-sm font-semibold text-white/80 transition hover:border-white/30 hover:text-white disabled:opacity-60"
                            >
                                Clear
                            </button>
                        </div>
                    </section>
                ) : null}

                {notice ? (
                    <div className="mb-6 rounded-[1.4rem] border border-emerald-400/20 bg-emerald-400/10 px-5 py-4 text-sm text-emerald-100">
                        {notice}
                    </div>
                ) : null}

                {error ? (
                    <div className="mb-6 rounded-[1.4rem] border border-rose-400/20 bg-rose-400/10 px-5 py-4 text-sm text-rose-100">
                        {error}
                    </div>
                ) : null}

                <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5">
                    <div className="grid grid-cols-[minmax(260px,1.35fr)_0.8fr_0.9fr_0.75fr_0.9fr_1.2fr] gap-4 border-b border-white/10 px-5 py-4 text-xs uppercase tracking-[0.28em] text-slate-400">
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                checked={allVisibleSelected}
                                onChange={toggleSelectAllVisible}
                                className="h-4 w-4 rounded border-white/20 bg-slate-950/60"
                            />
                            <span>Person</span>
                        </div>
                        <div>Priority</div>
                        <div>Intent</div>
                        <div>Room</div>
                        <div>Email</div>
                        <div>Actions</div>
                    </div>

                    {data.users.length === 0 ? (
                        <div className="px-5 py-10 text-sm text-slate-400">No waitlist users match the current filters.</div>
                    ) : (
                        data.users.map((user) => (
                            <article key={user.id} className="grid grid-cols-[minmax(260px,1.35fr)_0.8fr_0.9fr_0.75fr_0.9fr_1.2fr] gap-4 border-b border-white/6 px-5 py-5 text-sm last:border-b-0">
                                <div>
                                    <div className="flex items-start gap-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(user.id)}
                                            onChange={() => toggleSelection(user.id)}
                                            className="mt-1 h-4 w-4 rounded border-white/20 bg-slate-950/60"
                                        />
                                        <div className="min-w-0">
                                            <p className="font-semibold text-white">{user.email}</p>
                                            <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-400">
                                                <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1">
                                                    <Mail className="h-3.5 w-3.5" />
                                                    {formatDate(user.created_at)}
                                                </span>
                                                {user.confirmation_email_sent_at ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-emerald-200">
                                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                                        confirmation sent
                                                    </span>
                                                ) : null}
                                            </div>
                                            {user.open_text_note ? (
                                                <p className="mt-3 line-clamp-3 max-w-[36rem] text-sm leading-relaxed text-slate-300">
                                                    {user.open_text_note}
                                                </p>
                                            ) : null}
                                            <p className="mt-3 text-xs uppercase tracking-[0.22em] text-slate-500">
                                                source: {user.source || "—"}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-white">
                                    <div className="text-2xl font-semibold">{user.priority_score}</div>
                                    <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-500">score</p>
                                </div>

                                <div className="text-slate-200">
                                    <div className="capitalize">{formatLabel(user.primary_goal)}</div>
                                    <p className="mt-2 text-xs uppercase tracking-[0.22em] text-slate-500">
                                        feedback: {formatLabel(user.feedback_willingness)}
                                    </p>
                                </div>

                                <div className="capitalize text-slate-200">{formatLabel(user.first_room)}</div>

                                <div className="text-slate-300">
                                    <div>created {formatDate(user.created_at)}</div>
                                    <div className="mt-2">invited {formatDate(user.invited_at)}</div>
                                </div>

                                <div>
                                    <select
                                        value={user.status}
                                        onChange={(event) => void handleStatusUpdate(user, event.target.value as WaitlistStatus)}
                                        disabled={busyIds.includes(user.id) || isBulkSubmitting}
                                        className="h-10 w-full rounded-full border border-white/10 bg-slate-950/60 px-4 text-sm text-white outline-none disabled:opacity-60"
                                    >
                                        {statusOptions.filter((option) => option.value !== "all").map((option) => (
                                            <option key={option.value} value={option.value} className="text-slate-950">
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={() => void handleSendInvites([user.id], "single")}
                                            disabled={busyIds.includes(user.id) || isBulkSubmitting}
                                            className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-white/10 px-3 text-xs font-semibold uppercase tracking-[0.16em] text-white/85 transition hover:border-white/25 hover:text-white disabled:opacity-60"
                                        >
                                            <Send className="h-3.5 w-3.5" />
                                            Send invite
                                        </button>
                                    </div>
                                    {busyIds.includes(user.id) ? (
                                        <p className="mt-2 text-xs uppercase tracking-[0.22em] text-slate-500">Working…</p>
                                    ) : null}
                                </div>
                            </article>
                        ))
                    )}
                </section>
            </div>
        </main>
    );
}
