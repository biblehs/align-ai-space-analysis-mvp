import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import {
    hasDedicatedAppOrigin,
    isAppHostname,
    isAppPath,
    isMarketingPath,
    toAppHostname,
    toRootHostname,
} from "@/lib/routing";

/**
 * Edge Middleware for ALIGN.
 * - Rate limiting: 30 requests per IP per minute on /api/* routes
 * - Request tracing: adds x-request-id header
 */

const ipRequestCounts = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT = 30;       // max requests
const RATE_WINDOW = 60_000;  // per 60 seconds
const MAX_RATE_LIMIT_KEYS = 10_000;

function getRequestIp(request: NextRequest) {
    return (
        request.headers.get("cf-connecting-ip")?.trim() ||
        request.headers.get("x-real-ip")?.trim() ||
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        null
    );
}

function pruneExpiredRateLimitEntries(now: number) {
    if (ipRequestCounts.size < MAX_RATE_LIMIT_KEYS) {
        return;
    }

    for (const [key, value] of ipRequestCounts) {
        if (value.resetAt <= now) {
            ipRequestCounts.delete(key);
        }
    }

    while (ipRequestCounts.size >= MAX_RATE_LIMIT_KEYS) {
        const oldestKey = ipRequestCounts.keys().next().value;
        if (typeof oldestKey !== "string") break;
        ipRequestCounts.delete(oldestKey);
    }
}

export function middleware(request: NextRequest) {
    const startedAt = Date.now();
    const pathname = request.nextUrl.pathname;
    const hostname = request.nextUrl.hostname;

    if (!pathname.startsWith("/api")) {
        const appDomainEnabled = hasDedicatedAppOrigin() || isAppHostname(hostname);

        if (appDomainEnabled) {
            if (isAppHostname(hostname) && pathname === "/") {
                const redirectUrl = request.nextUrl.clone();
                redirectUrl.pathname = "/auth";
                return NextResponse.redirect(redirectUrl);
            }

            if (isAppHostname(hostname) && isMarketingPath(pathname)) {
                const redirectUrl = request.nextUrl.clone();
                redirectUrl.hostname = toRootHostname(hostname);
                return NextResponse.redirect(redirectUrl);
            }

            if (!isAppHostname(hostname) && isAppPath(pathname)) {
                const redirectUrl = request.nextUrl.clone();
                redirectUrl.hostname = toAppHostname(hostname);
                return NextResponse.redirect(redirectUrl);
            }
        }
    }

    const ip = getRequestIp(request);
    const now = Date.now();
    const requestId = crypto.randomUUID();
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-request-id", requestId);

    if (pathname.startsWith("/api") && ip) {
        pruneExpiredRateLimitEntries(now);
        const entry = ipRequestCounts.get(ip);
        if (entry && now < entry.resetAt) {
            entry.count++;
            if (entry.count > RATE_LIMIT) {
                logger.warn("Rate limit exceeded", {
                    path: request.nextUrl.pathname,
                    method: request.method,
                    requestId,
                });
                return NextResponse.json(
                    { success: false, error: "Too many requests. Please try again later." },
                    {
                        status: 429,
                        headers: {
                            "x-request-id": requestId,
                            "retry-after": String(Math.max(1, Math.ceil((entry.resetAt - now) / 1000))),
                        },
                    }
                );
            }
        } else {
            ipRequestCounts.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
        }
    }

    const response = NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });
    response.headers.set("x-request-id", requestId);
    response.headers.set("x-rate-limit-limit", String(RATE_LIMIT));

    logger.api(request.method, request.nextUrl.pathname, Date.now() - startedAt, {
        requestId,
    });

    return response;
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
    ],
};
