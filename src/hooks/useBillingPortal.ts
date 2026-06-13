"use client";

import { useState } from "react";
import { getAuthHeaders } from "@/lib/auth-client";

type UseBillingPortalReturn = {
    openPortal: () => Promise<string | null>;
    loading: boolean;
    error: string | null;
};

export function useBillingPortal(): UseBillingPortalReturn {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function openPortal() {
        setLoading(true);
        setError(null);

        try {
            const authHeaders = await getAuthHeaders();
            const res = await fetch("/api/billing/portal", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...authHeaders,
                },
            });
            const json = await res.json().catch(() => null);

            if (!res.ok || !json?.success) {
                setError(json?.error || "Billing portal is not available for this account yet.");
                return null;
            }

            if (!json.data?.portalUrl) {
                setError("Billing portal link could not be prepared right now.");
                return null;
            }

            return json.data.portalUrl;
        } catch {
            setError("Unable to open the billing portal right now.");
            return null;
        } finally {
            setLoading(false);
        }
    }

    return {
        openPortal,
        loading,
        error,
    };
}
