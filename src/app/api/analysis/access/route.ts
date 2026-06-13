import { NextRequest, NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth-server";
import { coerceSnapshotV2 } from "@/lib/align-v2/snapshot-adapters";
import {
    claimAnalysisForUser,
    getAnalysisAccessRecord,
} from "@/lib/repositories/analysis-repository";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
    try {
        const user = await getRequestUser(req);
        if (!user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json().catch(() => ({})) as { analysisId?: string };
        const analysisId = body.analysisId?.trim();

        if (!analysisId) {
            return NextResponse.json({ success: false, error: "Missing analysisId" }, { status: 400 });
        }

        const analysis = await getAnalysisAccessRecord(analysisId);
        if (!analysis) {
            return NextResponse.json({ success: false, error: "Analysis not found" }, { status: 404 });
        }

        if (analysis.user_id && analysis.user_id !== user.id) {
            return NextResponse.json({ success: false, error: "This report belongs to another account." }, { status: 403 });
        }

        if (!analysis.user_id) {
            const claimed = await claimAnalysisForUser(analysisId, user);
            if (!claimed) {
                logger.warn("Analysis claim update failed", { analysisId, userId: user.id });
            }
        }

        const snapshot = coerceSnapshotV2(analysis.report_result?.free.snapshot ?? analysis.snapshot_result);
        if (!snapshot) {
            return NextResponse.json({ success: false, error: "Snapshot payload is invalid" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            data: {
                analysisId,
                snapshot,
                report: analysis.report_result ?? null,
                registrationRequired: false,
            },
        });
    } catch (error) {
        logger.error("Analysis access route error", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
