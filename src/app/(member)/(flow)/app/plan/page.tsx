"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import AppPageShell from "@/components/app-shell/AppPageShell";
import AppStatusNotice from "@/components/app-shell/AppStatusNotice";
import type { LucideIcon } from "lucide-react";
import {
    ArrowLeftRight,
    Crosshair,
    DoorOpen,
    Lamp,
    LampDesk,
    Leaf,
    Lightbulb,
} from "lucide-react";
import productsData from "@/data/products.json";
import {
    clearStoredAnalysisFlow,
    getStoredGoalData,
    getStoredSnapshot,
    getStoredUpload,
} from "@/features/analysis/storage";
import { SnapshotRegistrationPrompt } from "@/features/analysis/snapshot/components/SnapshotRegistrationPrompt";
import { usePlan } from "@/hooks/usePlan";
import { buildLegacySnapshotFromV2, coerceSnapshotV2 } from "@/lib/align-v2/snapshot-adapters";
import { generatePlan } from "@/lib/engine";
import type { PlanStep, Product, ReportResult, SnapshotResult } from "@/types";
import { downloadNodeAsPdf, downloadNodeAsPng, shareNodeAsImage } from "@/lib/client-report-image";
import { ReportErrorState } from "@/features/analysis/reporting/ReportErrorState";
import { ReportLoadingState } from "@/features/analysis/reporting/ReportLoadingState";
import {
    DimensionKey,
    DimensionValue,
    getDimensionMeta,
    getStrongestDimension,
    getWeakestDimension,
    mapRatingColor,
} from "@/features/analysis/reporting/report-helpers";
import { PlanBlueprintSections } from "@/features/analysis/plan/components/PlanBlueprintSections";
import { PlanDimensionSection } from "@/features/analysis/plan/components/PlanDimensionSection";
import { PlanExportCard } from "@/features/analysis/plan/components/PlanExportCard";
import { PlanHeaderActions } from "@/features/analysis/plan/components/PlanHeaderActions";
import { PlanHeroSection } from "@/features/analysis/plan/components/PlanHeroSection";
import { PlanHolisticSections } from "@/features/analysis/plan/components/PlanHolisticSections";
import { PlanSummarySection } from "@/features/analysis/plan/components/PlanSummarySection";
import { trackEvent } from "@/lib/analytics-client";
import { getAuthHeaders, readAuthHeader } from "@/lib/auth-client";
import { getAppAuthHref } from "@/lib/navigation";

const iconMap: Record<string, LucideIcon> = {
    Lightbulb,
    LampDesk,
    Leaf,
    Crosshair,
    ArrowLeftRight,
    DoorOpen,
    Lamp,
};

function PlanPageContent() {
    const searchParams = useSearchParams();
    const analysisId = searchParams?.get("id") ?? null;
    const checkoutStatus = searchParams?.get("checkout");
    const { plan: remotePlan, snapshot: remoteSnapshot, report: remoteReport, loading: isPlanLoading, error: remotePlanError } = usePlan(analysisId);
    const [planSteps, setPlanSteps] = useState<PlanStep[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [snapshotData, setSnapshotData] = useState<SnapshotResult | null>(null);
    const [reportData, setReportData] = useState<ReportResult | null>(null);
    const [hasLocalFallback, setHasLocalFallback] = useState(false);
    const [isExportingImage, setIsExportingImage] = useState(false);
    const [isSharingImage, setIsSharingImage] = useState(false);
    const [showRegistrationPrompt, setShowRegistrationPrompt] = useState(false);
    const [isDiscardingUnregisteredPlan, setIsDiscardingUnregisteredPlan] = useState(false);
    const fullReportRef = useRef<HTMLDivElement>(null);
    const hasTrackedViewRef = useRef(false);

    const tryLocalMvpFallback = (id: string) => {
        const snapshotPayload = getStoredSnapshot();
        const uploadPayload = getStoredUpload();
        const goalPayload = getStoredGoalData();

        if (!snapshotPayload || !uploadPayload || !goalPayload) {
            return false;
        }

        if (
            snapshotPayload.analysisId !== id ||
            uploadPayload.analysisId !== id ||
            goalPayload.analysisId !== id
        ) {
            return false;
        }

        const normalizedSnapshot = coerceSnapshotV2(snapshotPayload.snapshot);
        if (!normalizedSnapshot) {
            return false;
        }

        setSnapshotData(buildLegacySnapshotFromV2(normalizedSnapshot));
        setPlanSteps(generatePlan(uploadPayload.spaceData, goalPayload.goalData, productsData as Product[]));
        setReportData(null);
        setError(null);
        return true;
    };

    useEffect(() => {
        const storedSnapshot = getStoredSnapshot();
        const normalizedSnapshot = coerceSnapshotV2(storedSnapshot?.snapshot);
        if (normalizedSnapshot) {
            setSnapshotData(buildLegacySnapshotFromV2(normalizedSnapshot));
        }
    }, []);

    useEffect(() => {
        if (!analysisId) {
            setError("Analysis ID missing from link.");
            return;
        }

        if (remotePlan) {
            const normalizedSnapshot = coerceSnapshotV2(remoteReport?.free.snapshot ?? remoteSnapshot);
            setPlanSteps(remoteReport?.paid.plan ?? remotePlan);
            setSnapshotData(normalizedSnapshot ? buildLegacySnapshotFromV2(normalizedSnapshot) : null);
            setReportData(remoteReport ?? null);
            setHasLocalFallback(false);
            setError(null);
            return;
        }

        if (remotePlanError) {
            if (tryLocalMvpFallback(analysisId)) {
                setHasLocalFallback(true);
                return;
            }

            setError(remotePlanError);
        }
    }, [analysisId, remotePlan, remotePlanError, remoteReport, remoteSnapshot]);

    useEffect(() => {
        if (!analysisId || !snapshotData || planSteps.length === 0 || hasTrackedViewRef.current) {
            return;
        }

        hasTrackedViewRef.current = true;
        void trackEvent({
            eventName: "plan_viewed",
            analysisId,
            eventSource: "plan-page",
            properties: {
                hasLocalFallback,
                reportVersion: reportData?.version ?? null,
                planStepCount: planSteps.length,
                score: snapshotData.score,
            },
        });
    }, [analysisId, hasLocalFallback, planSteps.length, reportData, snapshotData]);

    useEffect(() => {
        if (!analysisId || planSteps.length === 0) {
            return;
        }

        let cancelled = false;

        const evaluateRegistrationPrompt = async () => {
            const authHeaders = await getAuthHeaders();
            const authValue = readAuthHeader(authHeaders);

            if (cancelled) {
                return;
            }

            if (!authValue) {
                setShowRegistrationPrompt(true);
                return;
            }

            setShowRegistrationPrompt(false);
        };

        void evaluateRegistrationPrompt();

        return () => {
            cancelled = true;
        };
    }, [analysisId, planSteps.length]);

    const isLoading = Boolean(analysisId) && isPlanLoading && planSteps.length === 0 && !hasLocalFallback && !error;

    const handleContinueToSignUp = () => {
        if (!analysisId) {
            return;
        }

        const redirect = checkoutStatus === "success"
            ? `/app/plan?id=${analysisId}&checkout=success`
            : `/app/plan?id=${analysisId}`;
        window.location.href = getAppAuthHref(redirect);
    };

    const handleDismissRegistrationPrompt = async () => {
        if (!analysisId) {
            setShowRegistrationPrompt(false);
            return;
        }

        try {
            setIsDiscardingUnregisteredPlan(true);
            await fetch("/api/analysis/discard", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ analysisId }),
            });
        } finally {
            clearStoredAnalysisFlow();
            setShowRegistrationPrompt(false);
            setIsDiscardingUnregisteredPlan(false);
        }
    };

    const handleExportPDF = async () => {
        if (!fullReportRef.current) {
            return;
        }

        try {
            await downloadNodeAsPdf(
                fullReportRef.current,
                `align-full-report-${analysisId || "report"}.pdf`,
                "ALIGN Full Space Report"
            );
        } catch (error) {
            console.error("Full report PDF export failed", error);
            alert("Failed to prepare the PDF view. Please try again.");
        }
    };

    const handleExportImage = async () => {
        if (!fullReportRef.current || isExportingImage) return;

        setIsExportingImage(true);
        try {
            await downloadNodeAsPng(fullReportRef.current, `align-full-report-${analysisId || "report"}.png`);
        } catch (err) {
            console.error("Full report image export failed", err);
            alert("Failed to generate the full report image. Please try again.");
        } finally {
            setIsExportingImage(false);
        }
    };

    const handleShareImage = async () => {
        if (!fullReportRef.current || isSharingImage) return;

        setIsSharingImage(true);
        try {
            await shareNodeAsImage(
                fullReportRef.current,
                `align-full-report-${analysisId || "report"}.png`,
                "ALIGN Full Space Report",
                "Shared from Align | Read Your Space"
            );
        } catch (err) {
            console.error("Full report image share failed", err);
            alert("Failed to share the full report image. Please try again.");
        } finally {
            setIsSharingImage(false);
        }
    };

    if (isLoading) {
        return <ReportLoadingState message="Securing your personalized report..." />;
    }

    if (error) {
        return <ReportErrorState title="Report Access Required" description={error} />;
    }

    if (!snapshotData) {
        return <ReportLoadingState message="Preparing your report visuals..." />;
    }

    const themeRatingColor = mapRatingColor(snapshotData.ratingColor, "text-background");
    const dimensionEntries = Object.entries(snapshotData.dimensions) as [DimensionKey, DimensionValue][];
    const chartData = dimensionEntries.map(([key, data]) => ({
        name: getDimensionMeta(key).label,
        value: data.score,
        color: getDimensionMeta(key).barColor,
        fullMark: 100,
    }));
    const radarData = dimensionEntries.map(([key, data]) => ({
        dimension: getDimensionMeta(key).label,
        score: data.score,
        fullMark: 100,
    }));
    const weakestDim = getWeakestDimension(dimensionEntries);
    const strongestDim = getStrongestDimension(dimensionEntries);
    const personalizedRecommendations = snapshotData.personalizedRecommendations || [];
    const spatialRemedies = snapshotData.spatialRemedies || [];

    return (
        <>
            <AppPageShell maxWidth="lg">
                <SnapshotRegistrationPrompt
                    isOpen={showRegistrationPrompt}
                    isClosing={isDiscardingUnregisteredPlan}
                    onClose={handleDismissRegistrationPrompt}
                    onContinue={handleContinueToSignUp}
                    eyebrow="Save Your Full Report"
                    title="Your full report is unlocked."
                    description="Create a free account to keep this paid report, receive future optimizations, and preserve your access to later updates and benefits."
                    caution="If you close this card and continue without registering, this paid result will only stay visible during the current session and will not be saved or tied to future perks."
                    continueLabel="Register to Keep Report"
                    closeLabel="Continue Without Saving"
                />

                {checkoutStatus === "success" && (
                    <AppStatusNotice tone="success">
                        Payment confirmed. Your full report is now unlocked.
                    </AppStatusNotice>
                )}
                <PlanHeaderActions
                    isExportingImage={isExportingImage}
                    isSharingImage={isSharingImage}
                    onExportImage={handleExportImage}
                    onShareImage={handleShareImage}
                    onExportPdf={handleExportPDF}
                />

                <motion.div
                    id="report-container"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8 sm:space-y-10"
                >
                    <PlanHeroSection />
                    <PlanSummarySection
                        snapshot={snapshotData}
                        themeRatingColor={themeRatingColor}
                        weakestDim={weakestDim}
                        strongestDim={strongestDim}
                        radarData={radarData}
                    />
                    <PlanDimensionSection
                        snapshot={snapshotData}
                        chartData={chartData}
                        dimensionEntries={dimensionEntries}
                    />
                    <PlanHolisticSections
                        snapshot={snapshotData}
                        spatialRemedies={spatialRemedies}
                        personalizedRecommendations={personalizedRecommendations}
                    />
                    <PlanBlueprintSections
                        planSteps={planSteps}
                        iconMap={iconMap}
                    />
                </motion.div>
            </AppPageShell>

            <PlanExportCard
                exportRef={fullReportRef}
                snapshot={snapshotData}
                planSteps={planSteps}
                spatialRemedies={spatialRemedies}
                personalizedRecommendations={personalizedRecommendations}
            />
        </>
    );
}

export default function PlanPage() {
    return (
        <Suspense fallback={<ReportLoadingState message="Preparing your report visuals..." />}>
            <PlanPageContent />
        </Suspense>
    );
}
