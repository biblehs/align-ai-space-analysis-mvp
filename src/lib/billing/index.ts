import {
    createCreemCheckout,
    createCreemCustomerPortal,
    isCreemConfigured,
    retrieveCreemCheckout,
    type CreemCheckoutResponse,
    type CreemWebhookEvent,
    verifyCreemWebhookSignature,
} from "@/lib/billing/providers/creem";
import {
    DEFAULT_BILLING_PRODUCT_KEY,
    getBillingProduct,
    getBillingProductEnvironmentLabel,
    isBillingProductKey,
    isPlaceholderBillingProductId,
    resolveBillingProductId,
    type BillingProductKey,
} from "@/lib/billing/config";
import { getAppOriginFromBase, normalizeInternalPath } from "@/lib/routing";
import type { BillingProvider, BillingStatus } from "@/types";

type CreateBillingCheckoutInput = {
    analysisId: string;
    productKey?: BillingProductKey;
    productId?: string;
    customerEmail?: string | null;
    successPath?: string;
    cancelPath?: string;
};

export type BillingCheckoutSession = {
    provider: BillingProvider;
    checkoutId: string;
    checkoutUrl: string;
    productId: string;
};

export type BillingWebhookPayment = {
    provider: BillingProvider;
    eventId: string | null;
    analysisId: string | null;
    checkoutId: string | null;
    orderId: string | null;
    customerId: string | null;
    customerEmail: string | null;
    subscriptionId: string | null;
    productId: string | null;
    status: BillingStatus;
};

export const billingProvider: BillingProvider = "creem";
export const isBillingConfigured = isCreemConfigured;
export { DEFAULT_BILLING_PRODUCT_KEY, getBillingProduct, isBillingProductKey };
export type { BillingProductKey };

function getAppOrigin() {
    return getAppOriginFromBase(
        process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    );
}

function createAppUrl(pathname: string, params?: Record<string, string>) {
    const url = new URL(normalizeInternalPath(pathname, "/app/checkout/success"), getAppOrigin());

    if (params) {
        for (const [key, value] of Object.entries(params)) {
            url.searchParams.set(key, value);
        }
    }

    return url.toString();
}

export async function createBillingCheckoutSession(input: CreateBillingCheckoutInput): Promise<BillingCheckoutSession> {
    const resolvedProductId = resolveBillingProductId({
        productId: input.productId,
        productKey: input.productKey,
    });

    if (isPlaceholderBillingProductId(resolvedProductId)) {
        throw new Error(
            `Creem ${getBillingProductEnvironmentLabel()} product ID placeholder has not been replaced yet`,
        );
    }

    const successUrl = createAppUrl(input.successPath || "/app/checkout/success", {
        analysisId: input.analysisId,
    });

    const checkout = await createCreemCheckout({
        productId: resolvedProductId,
        requestId: input.analysisId,
        successUrl,
        metadata: {
            analysisId: input.analysisId,
            productKey: input.productKey || "single-room-plan",
            cancelPath: input.cancelPath || "",
        },
        customer: input.customerEmail ? { email: input.customerEmail } : undefined,
    });

    if (!checkout.id || !checkout.checkout_url) {
        throw new Error("Creem checkout response did not include a checkout URL");
    }

    return {
        provider: billingProvider,
        checkoutId: checkout.id,
        checkoutUrl: checkout.checkout_url,
        productId: resolvedProductId,
    };
}

export function verifyBillingWebhook(rawBody: string, signatureHeader: string | null) {
    if (!verifyCreemWebhookSignature(rawBody, signatureHeader)) {
        throw new Error("Invalid Creem webhook signature");
    }

    return JSON.parse(rawBody) as CreemWebhookEvent;
}

export function getPaidBillingWebhookPayment(event: CreemWebhookEvent): BillingWebhookPayment | null {
    const isPaidCheckout =
        event.eventType === "checkout.completed" &&
        event.object?.order?.status === "paid";

    if (!isPaidCheckout) {
        return null;
    }

    const metadata = event.object.metadata || {};
    const metadataAnalysisId =
        typeof metadata.analysisId === "string" && metadata.analysisId.trim()
            ? metadata.analysisId.trim()
            : null;

    return {
        provider: billingProvider,
        eventId: event.id || null,
        analysisId: metadataAnalysisId || event.object.request_id || null,
        checkoutId: event.object.id || null,
        orderId: event.object.order?.id || null,
        customerId: event.object.customer?.id || null,
        customerEmail: event.object.customer?.email || null,
        subscriptionId: event.object.subscription?.id || null,
        productId: event.object.product?.id || null,
        status: "paid",
    };
}

export async function createBillingPortalLink(customerId: string) {
    const portal = await createCreemCustomerPortal(customerId);
    return portal.customer_portal_link;
}

export async function retrieveBillingCheckout(checkoutId: string): Promise<CreemCheckoutResponse> {
    return retrieveCreemCheckout(checkoutId);
}
