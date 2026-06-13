"use client";

import { useState } from "react";
import { getOrCreateAnalyticsSessionId } from "@/lib/analytics-client";
import { GoalData, SpaceData } from "@/types";

type AnalyzeInput = {
    analysisId: string;
    spaceData: SpaceData;
    goalData: GoalData;
    headers?: HeadersInit;
};

type AnalyzeResult = {
    analysisId: string;
    redirectPath: string;
    status: "processing";
};

interface UseAnalyzeReturn {
    analyze: (input: AnalyzeInput) => Promise<AnalyzeResult>;
    loading: boolean;
    error: string | null;
}

export function useAnalyze(): UseAnalyzeReturn {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function analyze({
        analysisId,
        spaceData,
        goalData,
        headers,
    }: AnalyzeInput): Promise<AnalyzeResult> {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json", ...(headers ?? {}) },
                body: JSON.stringify({
                    analysisId,
                    spaceData,
                    goalData,
                    sessionId: getOrCreateAnalyticsSessionId(),
                }),
            });
            const json = await res.json().catch(() => null);

            if (res.ok && json?.success && json?.data?.status === "processing") {
                return {
                    analysisId: json.data.analysisId ?? analysisId,
                    redirectPath: json.data.redirectPath ?? `/app/processing?analysisId=${analysisId}`,
                    status: "processing",
                };
            }

            const message = json?.error || "Analysis failed";
            setError(message);
            throw new Error(message);
        } catch (caughtError) {
            const message =
                caughtError instanceof Error && caughtError.message
                    ? caughtError.message
                    : "Network error during analysis";
            setError(message);
            throw new Error(message);
        } finally {
            setLoading(false);
        }
    }

    return { analyze, loading, error };
}
