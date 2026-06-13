import { after, NextRequest, NextResponse } from "next/server";
import { buildVisionValidationV2 } from "@/lib/align-v2/builders";
import { startSnapshotPipeline } from "@/lib/analysis-pipeline-service";
import { logger } from "@/lib/logger";
import {
    getAnalysisExecutionRecord,
    getLatestAnalysisArtifact,
    resetAnalysisForRoomTypeConfirmation,
} from "@/lib/repositories/analysis-repository";
import { upsertAnalysisJob } from "@/lib/repositories/security-repository";
import type { GoalData, SpaceData, VisionObservation } from "@/types";

function canonicalToStoredRoomType(roomType: string) {
    return roomType.replace(/_/g, "-");
}

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await context.params;

        if (!id) {
            return NextResponse.json({ success: false, error: "Missing analysis ID" }, { status: 400 });
        }

        const analysis = await getAnalysisExecutionRecord(id);
        if (!analysis) {
            return NextResponse.json({ success: false, error: "Analysis not found" }, { status: 404 });
        }

        const latestVision = await getLatestAnalysisArtifact<VisionObservation>(id, "vision_observation");
        const visionPayload = latestVision?.payload;
        if (!visionPayload) {
            return NextResponse.json(
                { success: false, error: "We could not recover the room detection state for this analysis." },
                { status: 409 },
            );
        }

        const validation = buildVisionValidationV2(
            visionPayload,
            analysis.space_data.spaceType ?? analysis.goal_data.spaceType ?? null,
        );

        if (validation.status !== "action_required" || !validation.detectedRoomType || validation.detectedRoomType === "unknown") {
            return NextResponse.json(
                { success: false, error: "This analysis does not currently need room type confirmation." },
                { status: 409 },
            );
        }

        const resolvedRoomType = canonicalToStoredRoomType(validation.detectedRoomType);
        const nextSpaceData: SpaceData = {
            ...analysis.space_data,
            spaceType: resolvedRoomType,
        };
        const nextGoalData: GoalData = {
            ...analysis.goal_data,
            spaceType: resolvedRoomType,
        };

        const resetSuccess = await resetAnalysisForRoomTypeConfirmation({
            analysisId: id,
            spaceData: nextSpaceData,
            goalData: nextGoalData,
            preanalysisStatus: analysis.preanalysis_status ?? "completed",
        });

        if (!resetSuccess) {
            return NextResponse.json({ success: false, error: "We could not resume this analysis right now." }, { status: 500 });
        }

        await upsertAnalysisJob({
            analysisId: id,
            status: "queued",
            stage: "snapshot",
            attemptCount: 0,
            userId: analysis.user_id ?? null,
            ipHash: analysis.user_id ? null : analysis.request_ip_hash ?? null,
        });

        after(async () => {
            await startSnapshotPipeline({
                analysisId: id,
                goalData: nextGoalData,
                requestIpHash: analysis.request_ip_hash ?? null,
                requestPath: req.nextUrl.pathname,
                sessionId: null,
                spaceData: nextSpaceData,
                user: analysis.user_id
                    ? {
                        id: analysis.user_id,
                        email: analysis.email ?? null,
                    }
                    : null,
                jobAttemptCount: 1,
            });
        });

        return NextResponse.json(
            {
                success: true,
                data: {
                    status: "processing",
                    analysisId: id,
                    roomType: resolvedRoomType,
                    pipeline: {
                        stage: "snapshot_queued",
                        status: "pending",
                        preanalysisStatus: analysis.preanalysis_status ?? "completed",
                        snapshotStatus: "pending",
                        fullReportStatus: "locked",
                        lastErrorCode: null,
                        lastErrorMessage: null,
                    },
                },
            },
            { status: 202 },
        );
    } catch (error) {
        logger.error("Confirm room type route error", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
