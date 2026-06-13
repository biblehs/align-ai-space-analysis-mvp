import { NextRequest } from "next/server";

export function getPrimaryLocale(headerValue: string | null) {
    if (!headerValue) {
        return null;
    }

    return headerValue
        .split(",")[0]
        ?.split(";")[0]
        ?.trim() || null;
}

export function getRequestUserAgent(req: Pick<NextRequest, "headers">) {
    return req.headers.get("user-agent") || null;
}

export function getRequestReferrer(req: Pick<NextRequest, "headers">) {
    return req.headers.get("referer") || null;
}

export function parseUserAgent(userAgent: string | null) {
    if (!userAgent) {
        return {
            browser: null,
            os: null,
            deviceType: null,
        };
    }

    const normalized = userAgent.toLowerCase();
    const browser = normalized.includes("edg/")
        ? "Edge"
        : normalized.includes("chrome/")
            ? "Chrome"
            : normalized.includes("safari/") && !normalized.includes("chrome/")
                ? "Safari"
                : normalized.includes("firefox/")
                    ? "Firefox"
                    : normalized.includes("opr/") || normalized.includes("opera/")
                        ? "Opera"
                        : "Other";

    const os = normalized.includes("iphone") || normalized.includes("ipad")
        ? "iOS"
        : normalized.includes("mac os x")
            ? "macOS"
            : normalized.includes("android")
                ? "Android"
                : normalized.includes("windows")
                    ? "Windows"
                    : normalized.includes("linux")
                        ? "Linux"
                        : "Other";

    const deviceType = normalized.includes("ipad") || normalized.includes("tablet")
        ? "tablet"
        : normalized.includes("mobi") || normalized.includes("iphone") || normalized.includes("android")
            ? "mobile"
            : "desktop";

    return {
        browser,
        os,
        deviceType,
    };
}
