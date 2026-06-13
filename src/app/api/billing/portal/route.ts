import { NextRequest, NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth-server";
import { createUserBillingPortalLink } from "@/lib/billing/service";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
    try {
        const user = await getRequestUser(req);

        if (!user?.id) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const portalUrl = await createUserBillingPortalLink(user.id);

        return NextResponse.json({
            success: true,
            data: { portalUrl },
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Internal server error";
        logger.error("Billing portal route error", error);
        return NextResponse.json(
            { success: false, error: message },
            { status: message.includes("first successful Creem payment") ? 404 : 500 },
        );
    }
}
