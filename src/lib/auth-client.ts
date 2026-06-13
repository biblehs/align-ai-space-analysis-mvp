import { getBrowserSupabase } from "@/lib/supabase-browser";
import { getBrowserTrackingContext } from "@/lib/analytics-client";
import { appAuthHref } from "@/lib/navigation";
import type { SnapshotResultV2 } from "@/lib/align-v2/contracts";
import type { AnalysisHistoryItem, GoalData, ReportResult } from "@/types";

export const PENDING_MARKETING_OPT_IN_KEY = "align_pending_marketing_opt_in";
export const LOCAL_AUTH_USER_KEY = "align_local_auth_user";
export const LOCAL_ANALYSES_KEY = "align_local_analyses";
const AUTH_SYNC_MARKER_KEY = "align_auth_sync_marker";

export type LocalAuthUser = {
    id: string;
    email: string;
    provider: "email" | "google";
    marketing_opt_in: boolean;
    created_at: string;
};

function getLocalStorageSafe() {
    if (typeof window === "undefined") {
        return null;
    }

    return window.localStorage;
}

export async function getAuthHeaders(): Promise<HeadersInit> {
    try {
        const supabase = getBrowserSupabase();
        const { data } = await supabase.auth.getSession();
        const accessToken = data.session?.access_token;

        if (!accessToken) {
            return {};
        }

        return {
            Authorization: `Bearer ${accessToken}`,
        };
    } catch {
        return {};
    }
}

export function readAuthHeader(headers: HeadersInit) {
    if (headers instanceof Headers) {
        return headers.get("Authorization") ?? undefined;
    }

    if (typeof headers === "object" && headers !== null && "Authorization" in headers) {
        return headers.Authorization;
    }

    return undefined;
}

export async function hasAuthenticatedSession() {
    const headers = await getAuthHeaders();
    return Boolean(readAuthHeader(headers));
}

export async function syncSignedInProfile(
    marketingOptIn?: boolean,
    options?: {
        source?: "auth-page" | "auth-callback" | "account-page";
    },
) {
    const headers = await getAuthHeaders();
    const authHeader = readAuthHeader(headers);

    if (!authHeader) {
        return false;
    }

    const trackingContext = getBrowserTrackingContext();
    if (
        options?.source !== "account-page" &&
        trackingContext.sessionId &&
        getLocalStorageSafe()?.getItem(AUTH_SYNC_MARKER_KEY) === trackingContext.sessionId
    ) {
        return true;
    }

    const res = await fetch("/api/account/sync", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...headers,
        },
        body: JSON.stringify({
            marketingOptIn: !!marketingOptIn,
            source: options?.source ?? "account-page",
            sessionId: trackingContext.sessionId,
            locale: trackingContext.locale,
            timezone: trackingContext.timezone,
            referrer: trackingContext.referrer,
            landingPath: trackingContext.landingPath,
            utmSource: trackingContext.utmSource,
            utmMedium: trackingContext.utmMedium,
            utmCampaign: trackingContext.utmCampaign,
        }),
    });

    if (res.ok && options?.source !== "account-page" && trackingContext.sessionId) {
        getLocalStorageSafe()?.setItem(AUTH_SYNC_MARKER_KEY, trackingContext.sessionId);
    }

    return res.ok;
}

export function signInLocally(email: string, provider: "email" | "google", marketingOptIn: boolean) {
    const normalizedEmail = email.trim().toLowerCase();
    const localUser: LocalAuthUser = {
        id: `local-${normalizedEmail.replace(/[^a-z0-9]/g, "-")}`,
        email: normalizedEmail,
        provider,
        marketing_opt_in: marketingOptIn,
        created_at: new Date().toISOString(),
    };

    getLocalStorageSafe()?.setItem(LOCAL_AUTH_USER_KEY, JSON.stringify(localUser));
    return localUser;
}

export function getLocalAuthUser(): LocalAuthUser | null {
    const raw = getLocalStorageSafe()?.getItem(LOCAL_AUTH_USER_KEY);
    if (!raw) return null;

    try {
        return JSON.parse(raw) as LocalAuthUser;
    } catch {
        return null;
    }
}

export function signOutLocally() {
    getLocalStorageSafe()?.removeItem(LOCAL_AUTH_USER_KEY);
    clearAuthSessionMarkers();
}

export async function signOutCurrentUser(redirectHref = appAuthHref) {
    clearAuthSessionMarkers();
    const localUser = getLocalAuthUser();

    if (localUser) {
        signOutLocally();
        if (typeof window !== "undefined") {
            window.location.href = redirectHref;
        }
        return;
    }

    const isConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    if (!isConfigured) {
        signOutLocally();
        if (typeof window !== "undefined") {
            window.location.href = redirectHref;
        }
        return;
    }

    const supabase = getBrowserSupabase();
    await supabase.auth.signOut();

    if (typeof window !== "undefined") {
        window.location.href = redirectHref;
    }
}

export function clearAuthSessionMarkers() {
    getLocalStorageSafe()?.removeItem(AUTH_SYNC_MARKER_KEY);
}

export function updateLocalMarketingPreference(marketingOptIn: boolean) {
    const localUser = getLocalAuthUser();
    if (!localUser) return null;

    const nextUser = { ...localUser, marketing_opt_in: marketingOptIn };
    getLocalStorageSafe()?.setItem(LOCAL_AUTH_USER_KEY, JSON.stringify(nextUser));
    return nextUser;
}

export function appendLocalAnalysis(item: {
    id: string;
    goal_data: GoalData;
    snapshot_result: SnapshotResultV2;
    report_result?: ReportResult | null;
}) {
    const existing = getLocalAnalyses();
    const next: AnalysisHistoryItem[] = [
        {
            id: item.id,
            created_at: new Date().toISOString(),
            paid: false,
            goal_data: item.goal_data,
            snapshot_result: item.snapshot_result,
            report_result: item.report_result ?? null,
        },
        ...existing.filter((entry) => entry.id !== item.id),
    ];

    getLocalStorageSafe()?.setItem(LOCAL_ANALYSES_KEY, JSON.stringify(next));
}

export function getLocalAnalyses(): AnalysisHistoryItem[] {
    const raw = getLocalStorageSafe()?.getItem(LOCAL_ANALYSES_KEY);
    if (!raw) return [];

    try {
        return JSON.parse(raw) as AnalysisHistoryItem[];
    } catch {
        return [];
    }
}
