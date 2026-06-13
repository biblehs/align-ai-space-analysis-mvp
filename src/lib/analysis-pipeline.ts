import type {
    AnalysisGenerationStatus,
    AnalysisPipelineStage,
    AnalysisPipelineStatus,
    PlanStep,
    ReportResult,
} from "@/types";
import type { SnapshotResultV2 } from "@/lib/align-v2/contracts";

export const ANALYSIS_REPORT_VERSION = "2026-03-31.report.v1";
export const ANALYSIS_PROMPT_VERSION = "2026-03-31.prompt.v1";
export const ANALYSIS_SCHEMA_VERSION = "2026-03-31.schema.v1";
export const ANALYSIS_PREANALYSIS_VERSION = "2026-03-31.preanalysis.v1";
export const ANALYSIS_INPUT_VERSION = "2026-03-31.input.v1";
export const ANALYSIS_SCORING_VERSION = "2026-03-31.scoring.v1";
export const ANALYSIS_MODEL_NAME = "gemini-2.5-flash";
export const SNAPSHOT_WRITER_PROMPT_VERSION = "2026-04-18.snapshot-writer.prompt.v3";
export const SNAPSHOT_WRITER_SCHEMA_VERSION = "2026-04-18.snapshot-writer.schema.v2";
export const SNAPSHOT_WRITER_MODEL_NAME = process.env.SNAPSHOT_WRITER_MODEL_NAME ?? "gemini-2.5-flash-lite";
export const SNAPSHOT_DIAGNOSIS_PROMPT_VERSION = "2026-04-22.snapshot-diagnosis.prompt.v1";
export const SNAPSHOT_DIAGNOSIS_SCHEMA_VERSION = "2026-04-22.snapshot-diagnosis.schema.v1";
export const SNAPSHOT_DIAGNOSIS_MODEL_NAME = process.env.SNAPSHOT_DIAGNOSIS_MODEL_NAME ?? ANALYSIS_MODEL_NAME;
export const FULL_REPORT_WRITER_PROMPT_VERSION = "2026-04-07.full-report-writer.prompt.v1";
export const FULL_REPORT_WRITER_SCHEMA_VERSION = "2026-04-07.full-report-writer.schema.v1";
export const FULL_REPORT_WRITER_MODEL_NAME = process.env.FULL_REPORT_WRITER_MODEL_NAME ?? ANALYSIS_MODEL_NAME;

type BuildReportResultInput = {
    snapshot?: SnapshotResultV2 | null;
    plan?: PlanStep[] | null;
    paid?: boolean;
    pipeline?: Partial<ReportResult["pipeline"]>;
    meta?: Partial<ReportResult["meta"]>;
};

export function buildReportResult(input: BuildReportResultInput): ReportResult {
    const snapshot = input.snapshot ?? null;
    const paid = Boolean(input.paid);
    const plan = input.plan ?? null;

    return {
        version: ANALYSIS_REPORT_VERSION,
        pipeline: {
            stage: input.pipeline?.stage ?? "initialized",
            status: input.pipeline?.status ?? "pending",
            preanalysisStatus: input.pipeline?.preanalysisStatus ?? "pending",
            snapshotStatus: input.pipeline?.snapshotStatus ?? (snapshot ? "completed" : "pending"),
            fullReportStatus: input.pipeline?.fullReportStatus ?? (paid ? "completed" : "locked"),
            lastErrorCode: input.pipeline?.lastErrorCode ?? null,
            lastErrorMessage: input.pipeline?.lastErrorMessage ?? null,
        },
        free: {
            snapshot,
        },
        paid: {
            unlocked: paid,
            plan,
        },
        meta: {
            modelName: input.meta?.modelName ?? null,
            promptVersion: input.meta?.promptVersion ?? null,
            schemaVersion: input.meta?.schemaVersion ?? null,
            preanalysisVersion: input.meta?.preanalysisVersion ?? null,
            analysisMode: input.meta?.analysisMode ?? null,
            fallbackUsed: input.meta?.fallbackUsed ?? false,
            preanalysisUsed: input.meta?.preanalysisUsed ?? false,
            snapshotGeneratedAt: input.meta?.snapshotGeneratedAt ?? null,
            fullReportGeneratedAt: input.meta?.fullReportGeneratedAt ?? null,
        },
    };
}

export function buildPipelineSnapshot(input?: {
    stage?: AnalysisPipelineStage;
    status?: AnalysisPipelineStatus;
    preanalysisStatus?: AnalysisGenerationStatus;
    snapshotStatus?: AnalysisGenerationStatus;
    fullReportStatus?: AnalysisGenerationStatus;
    lastErrorCode?: string | null;
    lastErrorMessage?: string | null;
}) {
    return {
        stage: input?.stage ?? "initialized",
        status: input?.status ?? "pending",
        preanalysisStatus: input?.preanalysisStatus ?? "pending",
        snapshotStatus: input?.snapshotStatus ?? "pending",
        fullReportStatus: input?.fullReportStatus ?? "locked",
        lastErrorCode: input?.lastErrorCode ?? null,
        lastErrorMessage: input?.lastErrorMessage ?? null,
    } satisfies ReportResult["pipeline"];
}
