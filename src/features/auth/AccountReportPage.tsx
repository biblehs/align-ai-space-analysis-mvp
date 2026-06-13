"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
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
import AppBackLink from "@/components/app-shell/AppBackLink";
import AppPageShell from "@/components/app-shell/AppPageShell";
import AppStatusNotice from "@/components/app-shell/AppStatusNotice";
import { DEFAULT_BILLING_PRODUCT_KEY } from "@/lib/billing";
import { buildLegacySnapshotFromV2, coerceSnapshotV2 } from "@/lib/align-v2/snapshot-adapters";
import { buildComparisonSnapshotV2 } from "@/lib/align-v2/comparison-snapshot";
import type { ComparisonSnapshotResultV2, SnapshotResultV2 } from "@/lib/align-v2/contracts";
import { ReportErrorState } from "@/features/analysis/reporting/ReportErrorState";
import { ReportLoadingState } from "@/features/analysis/reporting/ReportLoadingState";
import { downloadNodeAsPng, shareNodeAsImage } from "@/lib/client-report-image";
import { SnapshotExportCardV2 } from "@/features/analysis/snapshot/components/SnapshotExportCardV2";
import { SnapshotV2Section } from "@/features/analysis/snapshot/components/SnapshotV2Section";
import { ComparisonSnapshotSection } from "@/features/analysis/snapshot/components/ComparisonSnapshotSection";
import { PlanHeroSection } from "@/features/analysis/plan/components/PlanHeroSection";
import { PlanSummarySection } from "@/features/analysis/plan/components/PlanSummarySection";
import { PlanDimensionSection } from "@/features/analysis/plan/components/PlanDimensionSection";
import { PlanHolisticSections } from "@/features/analysis/plan/components/PlanHolisticSections";
import { PlanBlueprintSections } from "@/features/analysis/plan/components/PlanBlueprintSections";
import {
    DimensionKey,
    DimensionValue,
    getStrongestDimension,
    getWeakestDimension,
    mapRatingColor,
    getDimensionMeta,
} from "@/features/analysis/reporting/report-helpers";
import { generatePlan } from "@/lib/engine";
import { useCheckout } from "@/hooks/useCheckout";
import { getAuthHeaders, getLocalAnalyses } from "@/lib/auth-client";
import type { AnalysisHistoryItem, AnalysisReportItem, PlanStep, Product, ReportResult } from "@/types";

const iconMap: Record<string, LucideIcon> = {
    Lightbulb,
    LampDesk,
    Leaf,
    Crosshair,
    ArrowLeftRight,
    DoorOpen,
    Lamp,
};

type AccountReportPageProps = {
    analysisId: string;
};

export default function AccountReportPage({ analysisId }: AccountReportPageProps) {
    const searchParams = useSearchParams();
    const [analysis, setAnalysis] = useState<AnalysisReportItem | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAwaitingPaidReport, setIsAwaitingPaidReport] = useState(false);
    const [isExportingFree, setIsExportingFree] = useState(false);
    const [isSharingFree, setIsSharingFree] = useState(false);
    const [comparisonSnapshot, setComparisonSnapshot] = useState<ComparisonSnapshotResultV2 | null>(null);
    const { checkout, loading: isCheckingOut, error: checkoutError } = useCheckout();
    const isConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const freeExportRef = useRef<HTMLDivElement>(null);
    const checkoutStatus = searchParams?.get("checkout");
    const reportData: ReportResult | null = analysis?.report_result ?? null;

    useEffect(() => {
        let isActive = true;

        const fetchReport = async () => {
            if (!isConfigured) {
                const localAnalysis = getLocalAnalyses().find((item) => item.id === analysisId);
                if (!localAnalysis?.snapshot_result || !localAnalysis.goal_data) {
                    throw new Error("Report not found in local mode.");
                }

                return {
                    id: localAnalysis.id,
                    created_at: localAnalysis.created_at,
                    paid: localAnalysis.paid,
                    photo_url: localAnalysis.photo_url ?? null,
                    goal_data: localAnalysis.goal_data,
                    plan_result: null,
                    snapshot_result: localAnalysis.snapshot_result,
                    space_data: {
                        sunlight: "medium" as const,
                        density: "balanced" as const,
                    },
                    report_result: localAnalysis.report_result ?? null,
                } satisfies AnalysisReportItem;
            }

            const authHeaders = await getAuthHeaders();
            const res = await fetch(`/api/account/analyses/${analysisId}`, {
                headers: authHeaders,
                cache: "no-store",
            });
            const json = await res.json().catch(() => null);

            if (!res.ok || !json?.success?.valueOf()) {
                throw new Error(json?.error || "Unable to load this saved report.");
            }

            return json.data.analysis as AnalysisReportItem;
        };

        const loadReport = async () => {
            try {
                const nextAnalysis = await fetchReport();
                if (!isActive) return;

                setAnalysis(nextAnalysis);
                setError(null);

                if (checkoutStatus === "success" && !nextAnalysis.paid && isConfigured) {
                    setIsAwaitingPaidReport(true);

                    for (let attempt = 0; attempt < 20; attempt += 1) {
                        await new Promise((resolve) => window.setTimeout(resolve, 1500));
                        const refreshedAnalysis = await fetchReport();

                        if (!isActive) return;

                        setAnalysis(refreshedAnalysis);
                        if (refreshedAnalysis.paid) {
                            setIsAwaitingPaidReport(false);
                            return;
                        }
                    }

                    setIsAwaitingPaidReport(false);
                    return;
                }

                setIsAwaitingPaidReport(false);
            } catch (loadError) {
                if (!isActive) return;
                setError(loadError instanceof Error ? loadError.message : "Unable to load this saved report.");
            } finally {
                if (isActive) {
                    setIsLoading(false);
                }
            }
        };

        void loadReport();

        return () => {
            isActive = false;
        };
    }, [analysisId, checkoutStatus, isConfigured]);

    useEffect(() => {
        let isActive = true;

        const loadComparison = async () => {
            if (!analysis) {
                if (isActive) setComparisonSnapshot(null);
                return;
            }

            const currentSnapshot = coerceSnapshotV2(reportData?.free.snapshot ?? analysis.snapshot_result);
            if (!currentSnapshot) {
                if (isActive) setComparisonSnapshot(null);
                return;
            }

            let analyses: AnalysisHistoryItem[] = [];

            if (!isConfigured) {
                analyses = getLocalAnalyses();
            } else {
                const authHeaders = await getAuthHeaders();
                const res = await fetch("/api/account/analyses", {
                    headers: authHeaders,
                    cache: "no-store",
                });
                const json = await res.json().catch(() => null);
                if (res.ok && json?.success?.valueOf()) {
                    analyses = (json.data?.analyses ?? []) as AnalysisHistoryItem[];
                }
            }

            const previousMatch = analyses
                .filter((item) => item.id !== analysis.id && item.goal_data?.goal === analysis.goal_data.goal)
                .map((item) => ({
                    id: item.id,
                    created_at: item.created_at,
                    snapshot: coerceSnapshotV2(item.report_result?.free.snapshot ?? item.snapshot_result ?? null),
                }))
                .filter((item): item is { id: string; created_at: string; snapshot: SnapshotResultV2 } => Boolean(item.snapshot))
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

            if (!previousMatch) {
                if (isActive) setComparisonSnapshot(null);
                return;
            }

            const nextComparison = buildComparisonSnapshotV2({
                previousAnalysisId: previousMatch.id,
                currentAnalysisId: analysis.id,
                previous: previousMatch.snapshot,
                current: currentSnapshot,
            });

            if (isActive) {
                setComparisonSnapshot(nextComparison);
            }
        };

        void loadComparison();

        return () => {
            isActive = false;
        };
    }, [analysis, reportData, isConfigured]);

    const planSteps = useMemo<PlanStep[]>(() => {
        if (!analysis?.paid) {
            return [];
        }

        if (reportData?.paid.plan && reportData.paid.plan.length > 0) {
            return reportData.paid.plan;
        }

        if (analysis.plan_result && analysis.plan_result.length > 0) {
            return analysis.plan_result;
        }

        return generatePlan(analysis.space_data, analysis.goal_data, productsData as Product[]);
    }, [analysis, reportData]);

    const handleDownloadFreeReport = async () => {
        if (!freeExportRef.current || isExportingFree) return;

        setIsExportingFree(true);
        try {
            await downloadNodeAsPng(freeExportRef.current, `align-free-report-${analysisId || "snapshot"}.png`);
        } catch (loadError) {
            console.error("Free report image export failed", loadError);
            alert("Failed to generate the free report image. Please try again.");
        } finally {
            setIsExportingFree(false);
        }
    };

    const handleShareFreeReport = async () => {
        if (!freeExportRef.current || isSharingFree) return;

        setIsSharingFree(true);
        try {
            await shareNodeAsImage(
                freeExportRef.current,
                `align-free-report-${analysisId || "snapshot"}.png`,
                "ALIGN Free Room Reading",
                "Generated with Align | Read Your Space",
            );
        } catch (loadError) {
            console.error("Free report image share failed", loadError);
            alert("Failed to share the free report image. Please try again.");
        } finally {
            setIsSharingFree(false);
        }
    };

    const handleUpgrade = async () => {
        const sessionUrl = await checkout(analysisId, {
            productKey: DEFAULT_BILLING_PRODUCT_KEY,
            successPath: `/app/checkout/success?redirectTo=${encodeURIComponent(`/account/reports/${analysisId}?checkout=success`)}`,
            cancelPath: `/account/reports/${analysisId}?checkout=cancelled`,
        });

        if (sessionUrl) {
            window.location.href = sessionUrl;
        }
    };

    if (isLoading) {
        return <ReportLoadingState message="Loading your saved report..." maxWidth="max-w-4xl" />;
    }

    if (!analysis) {
        return <ReportErrorState title="Report Unavailable" description={error || "Saved report not found."} />;
    }

    if (checkoutStatus === "success" && !analysis.paid && isAwaitingPaidReport) {
        return <ReportLoadingState message="Payment received. Unlocking your full saved report..." maxWidth="max-w-4xl" />;
    }

    const snapshotV2 = coerceSnapshotV2(reportData?.free.snapshot ?? analysis.snapshot_result);
    if (!snapshotV2) {
        return <ReportErrorState title="Report Unavailable" description="This saved snapshot could not be read." />;
    }
    const snapshot = buildLegacySnapshotFromV2(snapshotV2);
    const themeRatingColor = mapRatingColor(snapshot.ratingColor, analysis.paid ? "text-background" : undefined);
    const dimensionEntries = Object.entries(snapshot.dimensions) as [DimensionKey, DimensionValue][];
    const weakestDim = getWeakestDimension(dimensionEntries);

    if (!analysis.paid) {
        return (
            <>
                <AppPageShell maxWidth="md">
                    <div className="space-y-6 sm:space-y-8">
                        <AppBackLink href="/account" label="Back to Account Center" className="pt-2" />
                        {checkoutStatus === "cancelled" && (
                            <AppStatusNotice tone="warning">
                                Upgrade canceled. Your free report is still saved here whenever you want to come back.
                            </AppStatusNotice>
                        )}
                        {checkoutStatus === "success" && !analysis.paid && (
                            <AppStatusNotice tone="warning">
                                Payment received. We&apos;re confirming it and unlocking your full report now.
                            </AppStatusNotice>
                        )}
                        <SnapshotV2Section
                            snapshot={snapshotV2}
                            isExporting={isExportingFree}
                            isSharing={isSharingFree}
                            onDownload={handleDownloadFreeReport}
                            onShare={handleShareFreeReport}
                            onUnlock={handleUpgrade}
                            showUnlockActions={false}
                            variant="history"
                            isUpgrading={isCheckingOut}
                        />
                        {comparisonSnapshot ? <ComparisonSnapshotSection comparison={comparisonSnapshot} /> : null}
                        {checkoutError && <AppStatusNotice tone="error">{checkoutError}</AppStatusNotice>}
                    </div>
                </AppPageShell>
                <SnapshotExportCardV2
                    exportRef={freeExportRef}
                    snapshot={snapshotV2}
                />
            </>
        );
    }

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
    const strongestDim = getStrongestDimension(dimensionEntries);
    const personalizedRecommendations = snapshot.personalizedRecommendations || [];
    const spatialRemedies = snapshot.spatialRemedies || [];

    return (
        <AppPageShell maxWidth="lg">
            <div className="space-y-8 sm:space-y-10">
                <AppBackLink href="/account" label="Back to Account Center" className="pt-2" />
                {checkoutStatus === "success" && (
                    <AppStatusNotice tone="success">
                        Upgrade complete. Your full report is now available in account history.
                    </AppStatusNotice>
                )}
                <PlanHeroSection
                    eyebrow="Saved Report"
                    badgeLabel="Available In Your Account"
                    title="Your saved full report"
                    description="This saved report stays in your account history, while the page keeps the same header language and navigation style as the main site."
                />
                <PlanSummarySection
                    snapshot={snapshot}
                    themeRatingColor={themeRatingColor}
                    weakestDim={weakestDim}
                    strongestDim={strongestDim}
                    radarData={radarData}
                />
                <PlanDimensionSection
                    snapshot={snapshot}
                    chartData={chartData}
                    dimensionEntries={dimensionEntries}
                />
                <PlanHolisticSections
                    snapshot={snapshot}
                    spatialRemedies={spatialRemedies}
                    personalizedRecommendations={personalizedRecommendations}
                />
                <PlanBlueprintSections
                    planSteps={planSteps}
                    iconMap={iconMap}
                />
            </div>
        </AppPageShell>
    );
}
