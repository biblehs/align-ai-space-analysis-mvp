import { NextRequest, NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth-server";
import { getProfileForUser, updateProfile } from "@/lib/repositories/profile-repository";
import { createAnalyticsEvent } from "@/lib/repositories/analytics-repository";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
    try {
        const user = await getRequestUser(req);

        if (!user?.id || !user.email) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const profile = await getProfileForUser(user);
        if (!profile) {
            return NextResponse.json({ success: false, error: "Profile not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: { profile } });
    } catch (error) {
        logger.error("Profile fetch error", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const user = await getRequestUser(req);

        if (!user?.id) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json().catch(() => ({})) as {
            fullName?: string;
            marketingOptIn?: boolean;
            preferredLanguage?: string | null;
            timezone?: string | null;
            countryCode?: string | null;
            city?: string | null;
            onboardingGoal?: string | null;
            budgetPreference?: string | null;
            stylePreferenceDefault?: string | null;
            sessionId?: string;
        };

        const profile = await updateProfile(user, body);
        if (!profile) {
            return NextResponse.json({ success: false, error: "Failed to update profile" }, { status: 500 });
        }

        await createAnalyticsEvent({
            eventName: "account_updated",
            userId: user.id,
            sessionId: body.sessionId ?? null,
            pagePath: req.nextUrl.pathname,
            eventSource: "account-profile-route",
            properties: {
                updatedFields: Object.keys(body).filter((key) => key !== "sessionId"),
            },
        });

        return NextResponse.json({ success: true, data: { profile } });
    } catch (error) {
        logger.error("Profile update error", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
