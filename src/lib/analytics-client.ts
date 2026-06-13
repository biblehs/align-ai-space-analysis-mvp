"use client";

const ANALYTICS_SESSION_KEY = "align_analytics_session_id";

function getStorageSafe() {
    if (typeof window === "undefined") {
        return null;
    }

    return window.localStorage;
}

export function getOrCreateAnalyticsSessionId() {
    const storage = getStorageSafe();
    const existingId = storage?.getItem(ANALYTICS_SESSION_KEY);
    if (existingId) {
        return existingId;
    }

    const nextId = typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `align-${Date.now()}`;

    storage?.setItem(ANALYTICS_SESSION_KEY, nextId);
    return nextId;
}

export function getBrowserTrackingContext() {
    if (typeof window === "undefined") {
        return {
            sessionId: null,
            locale: null,
            timezone: null,
            referrer: null,
            landingPath: null,
            utmSource: null,
            utmMedium: null,
            utmCampaign: null,
        };
    }

    const searchParams = new URLSearchParams(window.location.search);
    return {
        sessionId: getOrCreateAnalyticsSessionId(),
        locale: navigator.language || null,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
        referrer: document.referrer || null,
        landingPath: `${window.location.pathname}${window.location.search}`,
        utmSource: searchParams.get("utm_source"),
        utmMedium: searchParams.get("utm_medium"),
        utmCampaign: searchParams.get("utm_campaign"),
    };
}

type TrackEventInput = {
    eventName: string;
    pagePath?: string | null;
    eventSource?: string | null;
    analysisId?: string | null;
    properties?: Record<string, unknown>;
    headers?: HeadersInit;
};

export async function trackEvent(input: TrackEventInput) {
    if (typeof window === "undefined") {
        return false;
    }

    try {
        const context = getBrowserTrackingContext();
        const pagePath = input.pagePath ?? `${window.location.pathname}${window.location.search}`;
        const res = await fetch("/api/analytics/event", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(input.headers ?? {}),
            },
            body: JSON.stringify({
                sessionId: context.sessionId,
                eventName: input.eventName,
                pagePath,
                eventSource: input.eventSource ?? "browser",
                analysisId: input.analysisId ?? null,
                properties: {
                    locale: context.locale,
                    timezone: context.timezone,
                    referrer: context.referrer,
                    landingPath: context.landingPath,
                    utmSource: context.utmSource,
                    utmMedium: context.utmMedium,
                    utmCampaign: context.utmCampaign,
                    ...(input.properties ?? {}),
                },
            }),
            keepalive: true,
        });

        return res.ok;
    } catch {
        return false;
    }
}
