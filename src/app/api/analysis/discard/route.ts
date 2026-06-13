import { NextRequest, NextResponse } from "next/server";
import {
    deleteAnonymousAnalysisRecord,
    getAnonymousAnalysisDiscardRecord,
} from "@/lib/repositories/analysis-repository";
import { deleteRoomPhoto, deleteRoomPreAnalysisArtifact } from "@/lib/services/room-photo-service";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({})) as { analysisId?: string };
        const analysisId = body.analysisId?.trim();

        if (!analysisId) {
            return NextResponse.json({ success: false, error: "Missing analysisId" }, { status: 400 });
        }

        const analysis = await getAnonymousAnalysisDiscardRecord(analysisId);
        if (!analysis) {
            return NextResponse.json({ success: true, data: { discarded: false } });
        }

        const deleted = await deleteAnonymousAnalysisRecord(analysisId);
        if (!deleted) {
            return NextResponse.json({ success: false, error: "Failed to discard anonymous analysis" }, { status: 500 });
        }

        if (analysis.photo_url?.startsWith("uploads/")) {
            const deletedPhoto = await deleteRoomPhoto(analysis.photo_url);
            if (!deletedPhoto) {
                logger.warn("Anonymous analysis photo cleanup failed", { analysisId, photoPath: analysis.photo_url });
            }
        }

        const deletedPreAnalysis = await deleteRoomPreAnalysisArtifact(analysisId);
        if (!deletedPreAnalysis) {
            logger.warn("Anonymous analysis pre-analysis cleanup failed", { analysisId });
        }

        return NextResponse.json({ success: true, data: { discarded: true } });
    } catch (error) {
        logger.error("Anonymous analysis discard route error", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
