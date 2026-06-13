"use client";

import { useState, useEffect } from "react";
import type { SnapshotResultV2 } from "@/lib/align-v2/contracts";
import { getAuthHeaders } from "@/lib/auth-client";
import { PlanStep, ReportResult } from "@/types";

interface UsePlanReturn {
    plan: PlanStep[] | null;
    snapshot: SnapshotResultV2 | null;
    report: ReportResult | null;
    loading: boolean;
    error: string | null;
}

/**
 * Encapsulates fetching the paid plan from /api/plan/[id].
 * Automatically fetches on mount when an analysisId is provided.
 */
export function usePlan(analysisId: string | null): UsePlanReturn {
    const [plan, setPlan] = useState<PlanStep[] | null>(null);
    const [snapshot, setSnapshot] = useState<SnapshotResultV2 | null>(null);
    const [report, setReport] = useState<ReportResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!analysisId) return;

        let cancelled = false;

        async function fetchPlan() {
            setLoading(true);
            setError(null);
            try {
                const authHeaders = await getAuthHeaders();
                const res = await fetch(`/api/plan/${analysisId}`, {
                    headers: authHeaders,
                });
                const json = await res.json();

                if (cancelled) return;

                if (json.success) {
                    setPlan(json.data.plan);
                    setSnapshot(json.data.snapshot ?? null);
                    setReport(json.data.report ?? null);
                } else {
                    setError(json.error || "Failed to load plan");
                }
            } catch {
                if (!cancelled) setError("Network error loading plan");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        fetchPlan();
        return () => { cancelled = true; };
    }, [analysisId]);

    return { plan, snapshot, report, loading, error };
}
