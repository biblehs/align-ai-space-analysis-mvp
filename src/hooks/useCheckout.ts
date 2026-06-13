"use client";

import type { BillingProductKey } from "@/lib/billing";
import { useState } from "react";
import { getOrCreateAnalyticsSessionId } from "@/lib/analytics-client";
import { getAuthHeaders } from "@/lib/auth-client";

interface UseCheckoutReturn {
    checkout: (
        analysisId: string,
        options?: {
            successPath?: string;
            cancelPath?: string;
            productKey?: BillingProductKey;
            productId?: string;
        },
    ) => Promise<string | null>;
    loading: boolean;
    error: string | null;
}

/**
 * Encapsulates the /api/checkout interaction.
 * Returns the hosted checkout URL on success.
 */
export function useCheckout(): UseCheckoutReturn {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function checkout(
        analysisId: string,
        options?: {
            successPath?: string;
            cancelPath?: string;
            productKey?: BillingProductKey;
            productId?: string;
        },
    ): Promise<string | null> {
        setLoading(true);
        setError(null);
        try {
            const authHeaders = await getAuthHeaders();
            const res = await fetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json", ...authHeaders },
                body: JSON.stringify({
                    analysisId,
                    sessionId: getOrCreateAnalyticsSessionId(),
                    successPath: options?.successPath,
                    cancelPath: options?.cancelPath,
                    productKey: options?.productKey,
                    productId: options?.productId,
                }),
            });
            const json = await res.json();

            if (json.success && json.data.sessionUrl) {
                return json.data.sessionUrl;
            } else {
                setError(json.error || "Checkout failed");
                return null;
            }
        } catch {
            setError("Network error during checkout");
            return null;
        } finally {
            setLoading(false);
        }
    }

    return { checkout, loading, error };
}
