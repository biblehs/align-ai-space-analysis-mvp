import type { GoalData, SpaceData } from "@/types";
import { processAnalysisRequest } from "@/lib/analysis-worker";
import { startRoomPreAnalysis } from "@/lib/preanalysis-worker";

type BasePipelineInput = {
    analysisId: string;
    requestPath: string;
    sessionId: string | null;
    spaceData: SpaceData;
    userId?: string | null;
};

export async function startPreanalysisPipeline(input: BasePipelineInput) {
    await startRoomPreAnalysis({
        analysisId: input.analysisId,
        requestPath: input.requestPath,
        sessionId: input.sessionId,
        spaceData: input.spaceData,
        userId: input.userId ?? null,
    });
}

export async function startSnapshotPipeline(input: BasePipelineInput & {
    goalData: GoalData;
    jobAttemptCount?: number | null;
    requestIpHash: string | null;
    user: { id: string; email: string | null } | null;
}) {
    await processAnalysisRequest({
        analysisId: input.analysisId,
        goalData: input.goalData,
        jobAttemptCount: input.jobAttemptCount ?? null,
        requestIpHash: input.requestIpHash,
        requestPath: input.requestPath,
        sessionId: input.sessionId,
        spaceData: input.spaceData,
        user: input.user,
    });
}
