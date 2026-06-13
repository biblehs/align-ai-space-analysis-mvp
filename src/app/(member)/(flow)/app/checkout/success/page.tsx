"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppPageShell from "@/components/app-shell/AppPageShell";
import AppStatusNotice from "@/components/app-shell/AppStatusNotice";
import { ReportErrorState } from "@/features/analysis/reporting/ReportErrorState";
import { ReportLoadingState } from "@/features/analysis/reporting/ReportLoadingState";
import type { ReportResult } from "@/types";

type BillingConfirmResponse = {
    paid: boolean;
    source: "database" | "provider";
    status?: string;
    pipeline?: ReportResult["pipeline"];
};

function getSafeRedirectPath(value: string | null, analysisId: string) {
    if (!value || !value.startsWith("/")) {
        return `/app/plan?id=${analysisId}&checkout=success`;
    }

    return value;
}

function getUnlockingMessage(pipeline: ReportResult["pipeline"] | null, providerStatus?: string) {
    if (!pipeline) {
        return "Payment received. Unlocking your full report...";
    }

    if (pipeline.fullReportStatus === "completed" || pipeline.stage === "full_report_completed") {
        return "Payment confirmed. Your full report is ready.";
    }

    if (pipeline.fullReportStatus === "processing" || pipeline.stage === "full_report_processing") {
        return "Payment received. Building your full report now...";
    }

    if (pipeline.status === "pending" || pipeline.stage === "full_report_queued") {
        return "Payment received. Your full report is queued up next...";
    }

    if (providerStatus === "pending") {
        return "Payment received. We're still waiting for the provider confirmation...";
    }

    return "Payment received. Unlocking your full report...";
}

function CheckoutSuccessPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const analysisId = searchParams?.get("analysisId") ?? null;
    const checkoutId = searchParams?.get("checkout_id") ?? null;
    const redirectTo = searchParams?.get("redirectTo") ?? null;
    const [error, setError] = useState<string | null>(null);
    const [isStillProcessing, setIsStillProcessing] = useState(false);
    const [pipeline, setPipeline] = useState<ReportResult["pipeline"] | null>(null);
    const [loadingMessage, setLoadingMessage] = useState("Payment received. Unlocking your full report...");

    useEffect(() => {
        if (!analysisId) {
            return;
        }

        let isActive = true;

        const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

        const pollForUnlock = async () => {
            for (let attempt = 0; attempt < 20; attempt += 1) {
                const res = checkoutId
                    ? await fetch("/api/billing/confirm", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        cache: "no-store",
                        body: JSON.stringify({
                            analysisId,
                            checkoutId,
                        }),
                    })
                    : await fetch(`/api/plan/${analysisId}`, { cache: "no-store" });
                const json = await res.json().catch(() => null);
                const responseData = (json?.data ?? null) as BillingConfirmResponse | null;

                if (!isActive) {
                    return;
                }

                if (res.ok && checkoutId) {
                    setPipeline(responseData?.pipeline ?? null);
                    setLoadingMessage(getUnlockingMessage(responseData?.pipeline ?? null, responseData?.status));

                    if (json?.success && responseData?.paid) {
                        router.replace(getSafeRedirectPath(redirectTo, analysisId));
                        return;
                    }
                }

                if (res.ok && !checkoutId) {
                    router.replace(getSafeRedirectPath(redirectTo, analysisId));
                    return;
                }

                const isExpectedPending =
                    (!checkoutId && res.status === 402) ||
                    (checkoutId && res.ok && json?.success && responseData?.paid === false);

                if (!isExpectedPending) {
                    setError(json?.error || "We could not confirm this payment yet.");
                    return;
                }

                if (attempt >= 2) {
                    setIsStillProcessing(true);
                }

                await wait(1500);
            }

            if (isActive) {
                setIsStillProcessing(true);
            }
        };

        void pollForUnlock();

        return () => {
            isActive = false;
        };
    }, [analysisId, checkoutId, redirectTo, router]);

    if (error) {
        return <ReportErrorState title="Payment Confirmation Pending" description={error} />;
    }

    if (!analysisId) {
        return <ReportErrorState title="Payment Confirmation Pending" description="Missing analysis ID for this checkout." />;
    }

    if (!isStillProcessing) {
        return <ReportLoadingState message={loadingMessage} maxWidth="max-w-3xl" />;
    }

    return (
        <AppPageShell maxWidth="md">
            <div className="space-y-5 pt-8">
                <AppStatusNotice tone="warning">
                    {getUnlockingMessage(pipeline, undefined)}
                </AppStatusNotice>
                <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-5 text-sm font-bold text-background transition-opacity hover:opacity-90"
                >
                    Check Again
                </button>
            </div>
        </AppPageShell>
    );
}

export default function CheckoutSuccessPage() {
    return (
        <Suspense fallback={<ReportLoadingState message="Confirming your payment..." maxWidth="max-w-3xl" />}>
            <CheckoutSuccessPageContent />
        </Suspense>
    );
}
