import { NextRequest, NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth-server";
import { logger } from "@/lib/logger";
import { createAnalyticsEvent } from "@/lib/repositories/analytics-repository";
import type { Json } from "@/types/database";

export async function POST(req: NextRequest) {
    try {
        const user = await getRequestUser(req);
        const body = await req.json().catch(() => ({})) as {
            sessionId?: string;
            eventName?: string;
            pagePath?: string;
            eventSource?: string;
            analysisId?: string | null;
            properties?: Record<string, unknown>;
        };

        if (!body.eventName) {
            return NextResponse.json({ success: false, error: "eventName is required" }, { status: 400 });
        }

        const event = await createAnalyticsEvent({
            eventName: body.eventName,
            userId: user?.id ?? null,
            sessionId: body.sessionId ?? null,
            analysisId: body.analysisId ?? null,
            pagePath: body.pagePath ?? req.nextUrl.pathname,
            eventSource: body.eventSource ?? "browser",
            properties: (body.properties ?? {}) as Json,
        });

        if (!event) {
            return NextResponse.json({ success: false, error: "Failed to write analytics event" }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: { eventId: event.id } });
    } catch (error) {
        logger.error("Analytics event write error", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
