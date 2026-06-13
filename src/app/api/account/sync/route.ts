import { NextRequest, NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth-server";
import { upsertProfile } from "@/lib/repositories/profile-repository";
import { createAnalyticsEvent } from "@/lib/repositories/analytics-repository";
import { upsertUserSession } from "@/lib/repositories/session-repository";
import { getClientIp, hashIpAddress } from "@/lib/security";
import { getPrimaryLocale, getRequestReferrer, getRequestUserAgent, parseUserAgent } from "@/lib/request-context";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
    try {
        const user = await getRequestUser(req);

        if (!user?.id || !user.email) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json().catch(() => ({})) as {
            marketingOptIn?: boolean;
            source?: "auth-page" | "auth-callback" | "account-page";
            sessionId?: string | null;
            locale?: string | null;
            timezone?: string | null;
            referrer?: string | null;
            landingPath?: string | null;
            utmSource?: string | null;
            utmMedium?: string | null;
            utmCampaign?: string | null;
        };
        const marketingOptIn = Boolean(body.marketingOptIn);
        const locale = body.locale ?? getPrimaryLocale(req.headers.get("accept-language"));
        const timezone = body.timezone ?? null;
        const referrer = body.referrer ?? getRequestReferrer(req);
        const userAgent = getRequestUserAgent(req);
        const sessionId = body.sessionId ?? null;
        const ipHash = hashIpAddress(getClientIp(req));
        const device = parseUserAgent(userAgent);

        const profile = await upsertProfile(user, marketingOptIn, {
            preferredLanguage: locale,
            timezone,
            signupSource: body.utmSource ?? null,
            signupCampaign: body.utmCampaign ?? null,
            lastActiveAt: new Date().toISOString(),
        });
        if (!profile) {
            return NextResponse.json({ success: false, error: "Failed to sync profile" }, { status: 500 });
        }

        if (sessionId) {
            await upsertUserSession({
                userId: user.id,
                sessionId,
                ipHash,
                userAgent,
                browser: device.browser,
                os: device.os,
                deviceType: device.deviceType,
                locale,
                timezone,
                referrer,
                landingPath: body.landingPath ?? null,
                utmSource: body.utmSource ?? null,
                utmMedium: body.utmMedium ?? null,
                utmCampaign: body.utmCampaign ?? null,
            });
        }

        await createAnalyticsEvent({
            eventName: body.source === "account-page" ? "profile_synced" : "auth_completed",
            userId: user.id,
            sessionId,
            pagePath: req.nextUrl.pathname,
            eventSource: body.source ?? "account-sync-route",
            properties: {
                provider: user.provider,
                locale,
                timezone,
                utmSource: body.utmSource ?? null,
                utmMedium: body.utmMedium ?? null,
                utmCampaign: body.utmCampaign ?? null,
            },
        });

        return NextResponse.json({ success: true, data: { profile } });
    } catch (error) {
        logger.error("Account sync error", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
