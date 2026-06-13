import { getBillingEnvironment, type BillingEnvironment } from "@/lib/billing/runtime";

export type BillingProductKey = "single-room-plan";
export const DEFAULT_BILLING_PRODUCT_KEY: BillingProductKey = "single-room-plan";

type BillingProductConfig = {
    key: BillingProductKey;
    name: string;
    description: string;
    amountLabel: string;
    mode: "payment";
    creemProductIds: Record<BillingEnvironment, string>;
};

const SINGLE_ROOM_CREEM_TEST_PRODUCT_ID =
    process.env.CREEM_PRODUCT_SINGLE_ROOM_TEST_ID ||
    "prod_REPLACE_WITH_REAL_CREEM_TEST_SINGLE_ROOM_PRODUCT_ID";

const SINGLE_ROOM_CREEM_LIVE_PRODUCT_ID =
    process.env.CREEM_PRODUCT_SINGLE_ROOM_LIVE_ID ||
    "prod_REPLACE_WITH_REAL_CREEM_LIVE_SINGLE_ROOM_PRODUCT_ID";

export const billingProducts: Record<BillingProductKey, BillingProductConfig> = {
    "single-room-plan": {
        key: "single-room-plan",
        name: "ALIGN Single Room Plan",
        description: "Personalized 5-Step Space Upgrade Plan",
        amountLabel: "$9.00",
        mode: "payment",
        creemProductIds: {
            // Replace these with the matching Creem test/live product IDs from Dashboard -> Products.
            test: SINGLE_ROOM_CREEM_TEST_PRODUCT_ID,
            live: SINGLE_ROOM_CREEM_LIVE_PRODUCT_ID,
        },
    },
};

export function getBillingProduct(productKey: BillingProductKey = DEFAULT_BILLING_PRODUCT_KEY) {
    return billingProducts[productKey];
}

export function isBillingProductKey(value: string): value is BillingProductKey {
    return value in billingProducts;
}

export function resolveBillingProductId(input?: {
    productId?: string;
    productKey?: BillingProductKey;
}) {
    if (typeof input?.productId === "string" && input.productId.trim()) {
        return input.productId.trim();
    }

    const billingProduct = getBillingProduct(input?.productKey);
    return billingProduct.creemProductIds[getBillingEnvironment()];
}

export function isPlaceholderBillingProductId(productId: string) {
    return productId.includes("REPLACE_WITH_REAL_CREEM");
}

export function getBillingProductEnvironmentLabel() {
    return getBillingEnvironment();
}
