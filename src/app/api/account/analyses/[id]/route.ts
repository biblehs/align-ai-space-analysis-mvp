import { after, NextRequest, NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth-server";
import { resumeFullReportIfNeeded } from "@/lib/analysis-job-service";
import { getAnalysisReportForUser } from "@/lib/repositories/analysis-repository";
import { logger } from "@/lib/logger";

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> },
) {
    try {
        const user = await getRequestUser(req);
        if (!user?.id) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await context.params;
        if (!id) {
            return NextResponse.json({ success: false, error: "Missing analysis ID" }, { status: 400 });
        }

        const analysis = await getAnalysisReportForUser(user, id);
        if (!analysis) {
            return NextResponse.json({ success: false, error: "Report not found" }, { status: 404 });
        }

        if (!analysis.paid) {
            after(async () => {
                await resumeFullReportIfNeeded(id);
            });
        }

        return NextResponse.json({
            success: true,
            data: {
                analysis,
            },
        });
    } catch (error) {
        logger.error("Account analysis detail fetch error", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
