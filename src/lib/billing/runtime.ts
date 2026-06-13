export type BillingEnvironment = "test" | "live";

function readBillingEnvironmentOverride(): BillingEnvironment | null {
    const override = process.env.BILLING_ENV_OVERRIDE?.trim().toLowerCase();

    if (override === "test" || override === "live") {
        return override;
    }

    return null;
}

export function getBillingEnvironment(): BillingEnvironment {
    const override = readBillingEnvironmentOverride();
    if (override) {
        return override;
    }

    if (process.env.VERCEL_ENV) {
        return process.env.VERCEL_ENV === "production" ? "live" : "test";
    }

    return process.env.NODE_ENV === "production" ? "live" : "test";
}

export function isBillingLiveEnvironment() {
    return getBillingEnvironment() === "live";
}
