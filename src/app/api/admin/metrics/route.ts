import { NextRequest, NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth-server";
import { isAllowedAdminEmail } from "@/lib/admin-access";
import { logger } from "@/lib/logger";
import { getDashboardMetrics } from "@/lib/repositories/metrics-repository";

export async function GET(req: NextRequest) {
    try {
        const user = await getRequestUser(req);

        if (!user?.email) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        if (!isAllowedAdminEmail(user.email)) {
            return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
        }

        const metrics = await getDashboardMetrics();
        return NextResponse.json({ success: true, data: { metrics } });
    } catch (error) {
        logger.error("Admin metrics route error", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
