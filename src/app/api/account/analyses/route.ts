import { NextRequest, NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth-server";
import { listAnalysesForUser } from "@/lib/repositories/analysis-repository";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
    try {
        const user = await getRequestUser(req);

        if (!user?.id) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const analyses = await listAnalysesForUser(user);
        if (!analyses) {
            return NextResponse.json({ success: false, error: "Failed to load analyses" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            data: { analyses },
        });
    } catch (error) {
        logger.error("Account analyses fetch error", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
