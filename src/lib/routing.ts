const APP_SUBDOMAIN_PREFIX = "app";

const APP_ROUTE_PREFIXES = ["/auth", "/account", "/app"];
const MARKETING_ROUTE_PREFIXES = ["/about"];

function parseUrlSafe(value?: string) {
    if (!value) {
        return null;
    }

    try {
        return new URL(value);
    } catch {
        return null;
    }
}

export function normalizeInternalPath(value: string | null | undefined, fallback = "/account") {
    const candidate = value?.trim();
    if (
        !candidate ||
        !candidate.startsWith("/") ||
        candidate.startsWith("//") ||
        candidate.includes("\\") ||
        /[\u0000-\u001f\u007f]/.test(candidate)
    ) {
        return fallback;
    }

    try {
        const base = new URL("https://align.internal");
        const resolved = new URL(candidate, base);
        if (resolved.origin !== base.origin) {
            return fallback;
        }

        return `${resolved.pathname}${resolved.search}${resolved.hash}`;
    } catch {
        return fallback;
    }
}

function getConfiguredHostname(value?: string) {
    const url = parseUrlSafe(value);
    return url?.hostname ?? null;
}

export function isLocalHostname(hostname: string) {
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1" || hostname.endsWith(".localhost");
}

function isPrivateIpv4(hostname: string) {
    if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
        return true;
    }

    if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
        return true;
    }

    const match = hostname.match(/^172\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/);
    if (!match) {
        return false;
    }

    const secondOctet = Number(match[1]);
    return secondOctet >= 16 && secondOctet <= 31;
}

export function isLocalPreviewHostname(hostname: string) {
    return isLocalHostname(hostname) || isPrivateIpv4(hostname);
}

export function isAppPath(pathname: string) {
    return APP_ROUTE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function isMarketingPath(pathname: string) {
    return pathname === "/" || MARKETING_ROUTE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function isAppHostname(hostname: string) {
    return hostname === `${APP_SUBDOMAIN_PREFIX}` || hostname.startsWith(`${APP_SUBDOMAIN_PREFIX}.`);
}

export function toAppHostname(hostname: string) {
    if (isAppHostname(hostname) || isLocalHostname(hostname)) {
        return hostname;
    }

    const configuredAppHostname = getConfiguredHostname(process.env.NEXT_PUBLIC_APP_URL);
    if (configuredAppHostname && !isLocalHostname(configuredAppHostname)) {
        return configuredAppHostname;
    }

    const normalizedHostname = hostname.replace(/^www\./, "");

    return `${APP_SUBDOMAIN_PREFIX}.${normalizedHostname}`;
}

export function toRootHostname(hostname: string) {
    const configuredBaseHostname = getConfiguredHostname(process.env.NEXT_PUBLIC_BASE_URL);
    if (configuredBaseHostname && !isLocalHostname(configuredBaseHostname)) {
        return configuredBaseHostname;
    }

    return isAppHostname(hostname) ? hostname.replace(/^app\./, "") : hostname;
}

export function hasDedicatedAppOrigin() {
    const appUrl = parseUrlSafe(process.env.NEXT_PUBLIC_APP_URL);
    if (!appUrl) {
        return false;
    }

    const baseUrl = parseUrlSafe(process.env.NEXT_PUBLIC_BASE_URL);
    if (baseUrl) {
        return appUrl.hostname !== baseUrl.hostname;
    }

    return isAppHostname(appUrl.hostname);
}

export function getAppOriginFromBase(baseUrl: string) {
    if (process.env.NEXT_PUBLIC_APP_URL) {
        return process.env.NEXT_PUBLIC_APP_URL;
    }

    try {
        const url = new URL(baseUrl);
        if (isLocalHostname(url.hostname)) {
            return baseUrl;
        }

        url.hostname = toAppHostname(url.hostname);
        return url.origin;
    } catch {
        return baseUrl;
    }
}
