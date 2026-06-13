import { after, NextRequest, NextResponse } from "next/server";
import type { GoalData, SpaceData } from "@/types";
import { startSnapshotPipeline } from "@/lib/analysis-pipeline-service";
import { logger } from "@/lib/logger";
import { getRequestUser } from "@/lib/auth-server";
import { getClientIp, hashIpAddress } from "@/lib/security";
import { ensureAnalysisJobCanStart } from "@/lib/analysis-worker";
import { getAnalysisStatusRecord, savePendingAnalysisRecord } from "@/lib/repositories/analysis-repository";
import { upsertAnalysisJob } from "@/lib/repositories/security-repository";
import { loadRoomPreAnalysisArtifact } from "@/lib/services/room-photo-service";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
    try {
        const requestUser = await getRequestUser(req);
        const requestIpHash = hashIpAddress(getClientIp(req));
        const body = await req.json();
        const { analysisId, spaceData, goalData } = body as {
            analysisId: string;
            goalData: GoalData;
            spaceData: SpaceData;
        };
        const sessionId = typeof body.sessionId === "string" ? body.sessionId : null;
        const registrationRequired = Boolean(
            process.env.NEXT_PUBLIC_SUPABASE_URL &&
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
            process.env.SUPABASE_SERVICE_ROLE_KEY &&
            !requestUser
        );
        const preanalysisArtifact =
            spaceData.photoPath || spaceData.photoUrl ? await loadRoomPreAnalysisArtifact(analysisId) : null;
        const existingAnalysisStatus = analysisId ? await getAnalysisStatusRecord(analysisId) : null;
        const preanalysisStatus =
            preanalysisArtifact
                ? "completed"
                : existingAnalysisStatus?.preanalysis_status === "processing" ||
                    existingAnalysisStatus?.preanalysis_status === "completed" ||
                    existingAnalysisStatus?.preanalysis_status === "failed"
                    ? existingAnalysisStatus.preanalysis_status
                    : "pending";

        if (!analysisId || !spaceData || !goalData) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        const canStart = await ensureAnalysisJobCanStart({
            userId: requestUser?.id ?? null,
            ipHash: requestUser ? null : requestIpHash,
        });

        if (!canStart) {
            return NextResponse.json(
                { success: false, error: "Another analysis is already processing. Please wait for it to finish before starting a new one." },
                { status: 429 }
            );
        }

        const pendingSaved = await savePendingAnalysisRecord(
            analysisId,
            spaceData,
            goalData,
            {
                user: requestUser ?? undefined,
                requestIpHash,
                registrationRequired,
                preanalysisStatus,
            },
        );

        if (!pendingSaved) {
            return NextResponse.json({ success: false, error: "We could not initialize this analysis." }, { status: 500 });
        }

        await upsertAnalysisJob({
            analysisId,
            status: "queued",
            stage: "snapshot",
            attemptCount: 0,
            userId: requestUser?.id ?? null,
            ipHash: requestUser ? null : requestIpHash,
        });

        after(async () => {
            await startSnapshotPipeline({
                analysisId,
                goalData,
                requestIpHash,
                requestPath: req.nextUrl.pathname,
                sessionId,
                spaceData,
                user: requestUser,
                jobAttemptCount: 1,
            });
        });

        return NextResponse.json(
            {
                success: true,
                data: {
                    analysisId,
                    status: "processing",
                    redirectPath: `/app/processing?analysisId=${analysisId}`,
                    pipeline: {
                        stage: "snapshot_queued",
                        status: "pending",
                        preanalysisStatus,
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
        logger.error("Analyze route error", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
