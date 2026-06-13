import { after, NextRequest, NextResponse } from "next/server";
import { claimAnalysisForUser, getAnalysisForPlan } from "@/lib/repositories/analysis-repository";
import { ANALYSIS_PREANALYSIS_VERSION, ANALYSIS_PROMPT_VERSION, ANALYSIS_SCHEMA_VERSION, buildPipelineSnapshot, buildReportResult } from "@/lib/analysis-pipeline";
import { coerceSnapshotV2 } from "@/lib/align-v2/snapshot-adapters";
import { resumeFullReportIfNeeded } from "@/lib/analysis-job-service";
import { generatePlan } from "@/lib/engine";
import { logger } from "@/lib/logger";
import productsData from "@/data/products.json";
import type { Product } from "@/types";
import { getRequestUser } from "@/lib/auth-server";

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const requestUser = await getRequestUser(req);

        if (!id) {
            return NextResponse.json({ success: false, error: "Missing analysis ID" }, { status: 400 });
        }

        let analysis = await getAnalysisForPlan(id);
        if (!analysis) {
            logger.warn("Plan route analysis not found", { analysisId: id });
            return NextResponse.json({ success: false, error: "Analysis not found" }, { status: 404 });
        }

        if (analysis.user_id) {
            if (!requestUser?.id) {
                return NextResponse.json({ success: false, error: "Sign in required to access this saved report" }, { status: 401 });
            }

            if (analysis.user_id !== requestUser.id) {
                return NextResponse.json({ success: false, error: "This report belongs to another account." }, { status: 403 });
            }
        } else if (requestUser?.id) {
            const claimed = await claimAnalysisForUser(id, requestUser);
            if (claimed) {
                const refreshedAnalysis = await getAnalysisForPlan(id);
                if (refreshedAnalysis) {
                    analysis = refreshedAnalysis;
                }
            }
        }

        if (!analysis.paid) {
            after(async () => {
                await resumeFullReportIfNeeded(id);
            });
            return NextResponse.json({ success: false, error: "Plan is locked until payment is completed" }, { status: 402 });
        }

        const plan =
            analysis.plan_result && analysis.plan_result.length > 0
                ? analysis.plan_result
                : generatePlan(analysis.space_data, analysis.goal_data, productsData as Product[]);

        const snapshot = coerceSnapshotV2(analysis.report_result?.free.snapshot ?? analysis.snapshot_result);
        if (!snapshot) {
            return NextResponse.json({ success: false, error: "Snapshot payload is invalid" }, { status: 500 });
        }

        const report =
            analysis.report_result ??
            buildReportResult({
                snapshot,
                plan,
                paid: analysis.paid,
                pipeline: buildPipelineSnapshot({
                    stage: analysis.paid ? "full_report_completed" : "snapshot_completed",
                    status: "completed",
                    preanalysisStatus: "completed",
                    snapshotStatus: "completed",
                    fullReportStatus: analysis.paid ? "completed" : "locked",
                }),
                meta: {
                    promptVersion: ANALYSIS_PROMPT_VERSION,
                    schemaVersion: ANALYSIS_SCHEMA_VERSION,
                    preanalysisVersion: ANALYSIS_PREANALYSIS_VERSION,
                    analysisMode: snapshot.analysisMode ?? null,
                    fallbackUsed: snapshot.analysisMode === "fallback",
                    preanalysisUsed: true,
                },
            });

        return NextResponse.json({
            success: true,
            data: {
                snapshot,
                plan,
                report,
            }
        });

    } catch (error) {
        logger.error("Plan route error", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
