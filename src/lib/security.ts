import { createHash } from "node:crypto";
import { NextRequest } from "next/server";
import { logger } from "@/lib/logger";
import { recordSecurityEvent } from "@/lib/repositories/security-repository";

const MAX_FREE_ANONYMOUS_UPLOADS_PER_IP = 5;
const MAX_AUTHENTICATED_UPLOADS_PER_DAY = 3;
const MAX_UPLOAD_ATTEMPTS_PER_IP_WINDOW = 5;
const MAX_UPLOAD_ATTEMPTS_PER_SESSION_WINDOW = 3;
const MAX_CONCURRENT_ANALYSIS_JOBS = 1;
const TURNSTILE_IP_THRESHOLD = 2;
const TURNSTILE_SESSION_THRESHOLD = 2;
const SHORT_IP_UPLOAD_WINDOW_MS = 10 * 60_000;
const SHORT_SESSION_UPLOAD_WINDOW_MS = 5 * 60_000;
const MIN_HUMAN_UPLOAD_ELAPSED_MS = 1500;
const turnstileSecretKey = process.env.TURNSTILE_SECRET_KEY || "";

type HumanVerificationInput = {
    analysisId?: string | null;
    honeypot?: string | null;
    requireTurnstile?: boolean;
    startedAt?: string | null;
    turnstileToken?: string | null;
};

function getForwardedForIp(value: string | null) {
    if (!value) {
        return null;
    }

    const [firstIp] = value.split(",").map((item) => item.trim()).filter(Boolean);
    return firstIp || null;
}

export function getClientIp(req: NextRequest) {
    return (
        getForwardedForIp(req.headers.get("x-forwarded-for")) ||
        req.headers.get("x-real-ip") ||
        req.headers.get("cf-connecting-ip") ||
        null
    );
}

export function hashIpAddress(ip: string | null) {
    if (!ip) {
        return null;
    }

    const configuredSalt = process.env.SECURITY_IP_HASH_SALT?.trim();
    if (!configuredSalt && process.env.NODE_ENV === "production") {
        throw new Error("SECURITY_IP_HASH_SALT must be configured in production.");
    }

    const salt = configuredSalt || "align-local-development-only";
    return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

export function getRequestUserAgent(req: NextRequest) {
    return req.headers.get("user-agent");
}

export function getHumanVerificationConfig() {
    return {
        enabled: Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && turnstileSecretKey),
        siteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "",
        maxAnonymousUploadsPerIp: MAX_FREE_ANONYMOUS_UPLOADS_PER_IP,
        triggerAfterIpUploads: TURNSTILE_IP_THRESHOLD,
        triggerAfterSessionUploads: TURNSTILE_SESSION_THRESHOLD,
    };
}

export function shouldRequireAnonymousTurnstile(input: {
    enabled: boolean;
    recentIpUploads: number;
    recentSessionUploads: number;
}) {
    if (!input.enabled) {
        return false;
    }

    return (
        input.recentIpUploads >= TURNSTILE_IP_THRESHOLD ||
        input.recentSessionUploads >= TURNSTILE_SESSION_THRESHOLD
    );
}

export async function verifyTurnstileToken(token: string, ip: string | null) {
    const secret = turnstileSecretKey;
    if (!secret) {
        return { success: false, skipped: true, errorCodes: [] as string[] };
    }

    const body = new URLSearchParams({
        secret,
        response: token,
    });

    if (ip) {
        body.set("remoteip", ip);
    }

    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
    });

    if (!response.ok) {
        throw new Error(`Turnstile verification failed with status ${response.status}`);
    }

    const result = await response.json() as {
        success: boolean;
        "error-codes"?: string[];
    };

    return {
        success: result.success,
        skipped: false,
        errorCodes: result["error-codes"] ?? [],
    };
}

export async function assertAnonymousHumanVerification(
    req: NextRequest,
    input: HumanVerificationInput,
) {
    const ip = getClientIp(req);
    const ipHash = hashIpAddress(ip);
    const userAgent = getRequestUserAgent(req);

    if (input.honeypot?.trim()) {
        await recordSecurityEvent({
            eventType: "upload_honeypot_triggered",
            severity: "critical",
            ipHash,
            analysisId: input.analysisId,
            requestPath: req.nextUrl.pathname,
            userAgent,
            detail: { honeypotFilled: true },
        });
        throw new Error("Human verification failed. Please try again.");
    }

    const startedAtMs = Number(input.startedAt);
    if (Number.isFinite(startedAtMs)) {
        const elapsedMs = Date.now() - startedAtMs;
        if (elapsedMs < MIN_HUMAN_UPLOAD_ELAPSED_MS) {
            await recordSecurityEvent({
                eventType: "upload_too_fast",
                severity: "warning",
                ipHash,
                analysisId: input.analysisId,
                requestPath: req.nextUrl.pathname,
                userAgent,
                detail: { elapsedMs },
            });
            throw new Error("Please slow down and try your upload again.");
        }
    }

    if (turnstileSecretKey && input.requireTurnstile) {
        if (!input.turnstileToken) {
            await recordSecurityEvent({
                eventType: "turnstile_token_missing",
                severity: "warning",
                ipHash,
                analysisId: input.analysisId,
                requestPath: req.nextUrl.pathname,
                userAgent,
            });
            throw new Error("Please complete the human verification check.");
        }

        const result = await verifyTurnstileToken(input.turnstileToken, ip);
        if (!result.success) {
            await recordSecurityEvent({
                eventType: "turnstile_verification_failed",
                severity: "critical",
                ipHash,
                analysisId: input.analysisId,
                requestPath: req.nextUrl.pathname,
                userAgent,
                detail: { errorCodes: result.errorCodes },
            });
            throw new Error("We could not verify that this upload is from a real person.");
        }
    }

    return { ip, ipHash, userAgent };
}

export async function sendSecurityAlert(input: {
    title: string;
    severity: "warning" | "critical";
    eventType: string;
    ipHash?: string | null;
    analysisId?: string | null;
    detail?: Record<string, unknown>;
}) {
    logger.warn(`Security alert: ${input.title}`, {
        eventType: input.eventType,
        ipHash: input.ipHash,
        analysisId: input.analysisId,
        ...input.detail,
    });

    const webhookUrl = process.env.SECURITY_ALERT_WEBHOOK_URL;
    if (!webhookUrl) {
        return false;
    }

    try {
        const response = await fetch(webhookUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                title: input.title,
                severity: input.severity,
                eventType: input.eventType,
                ipHash: input.ipHash ?? null,
                analysisId: input.analysisId ?? null,
                detail: input.detail ?? {},
            }),
        });

        return response.ok;
    } catch (error) {
        logger.error("Security alert webhook failed", error);
        return false;
    }
}

export { MAX_FREE_ANONYMOUS_UPLOADS_PER_IP };
export {
    MAX_AUTHENTICATED_UPLOADS_PER_DAY,
    MAX_UPLOAD_ATTEMPTS_PER_IP_WINDOW,
    MAX_UPLOAD_ATTEMPTS_PER_SESSION_WINDOW,
    MAX_CONCURRENT_ANALYSIS_JOBS,
    SHORT_IP_UPLOAD_WINDOW_MS,
    SHORT_SESSION_UPLOAD_WINDOW_MS,
    TURNSTILE_IP_THRESHOLD,
    TURNSTILE_SESSION_THRESHOLD,
};
