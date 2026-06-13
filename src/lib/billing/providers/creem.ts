import crypto from "node:crypto";
import { getBillingEnvironment } from "@/lib/billing/runtime";

const CREEM_LIVE_API_BASE_URL = "https://api.creem.io";
const CREEM_TEST_API_BASE_URL = "https://test-api.creem.io";

const creemApiKey = process.env.CREEM_API_KEY || "";
const creemWebhookSecret = process.env.CREEM_WEBHOOK_SECRET || "";

export const isCreemConfigured = Boolean(creemApiKey);

type CreemCheckoutRequest = {
    productId: string;
    requestId: string;
    successUrl: string;
    metadata?: Record<string, string>;
    customer?: {
        email?: string;
    };
};

export type CreemCheckoutResponse = {
    id: string;
    mode?: "test" | "prod" | "sandbox";
    object?: string;
    status?: "pending" | "processing" | "completed" | "expired";
    checkout_url: string;
    request_id?: string;
    metadata?: Record<string, unknown>;
    product?:
        | {
            id?: string;
        }
        | string;
    customer?: {
        id?: string;
        email?: string | null;
    } | string;
    order?: {
        id?: string;
        status?: string;
        type?: string;
    };
    subscription?: {
        id?: string;
        status?: string;
    } | null;
};

type CreemApiError = {
    message?: string;
    error?: string;
};

export type CreemWebhookEvent = {
    id?: string;
    eventType: string;
    created_at?: number;
    object: {
        id?: string;
        request_id?: string;
        metadata?: Record<string, unknown>;
        customer?: {
            id?: string;
            email?: string | null;
        };
        product?: {
            id?: string;
        };
        order?: {
            id?: string;
            status?: string;
            type?: string;
        };
        subscription?: {
            id?: string;
            status?: string;
        } | null;
    };
};

type CreemCustomerPortalResponse = {
    customer_portal_link: string;
};

function getCreemApiBaseUrl() {
    return getBillingEnvironment() === "test" ? CREEM_TEST_API_BASE_URL : CREEM_LIVE_API_BASE_URL;
}

async function creemRequest<T>(path: string, init: RequestInit): Promise<T> {
    if (!isCreemConfigured) {
        throw new Error("Creem is not configured");
    }

    const response = await fetch(`${getCreemApiBaseUrl()}${path}`, {
        ...init,
        headers: {
            "content-type": "application/json",
            "x-api-key": creemApiKey,
            ...(init.headers || {}),
        },
    });

    if (!response.ok) {
        const errorPayload = await response.json().catch<CreemApiError | null>(() => null);
        const errorMessage =
            errorPayload?.message || errorPayload?.error || `Creem request failed with status ${response.status}`;
        throw new Error(errorMessage);
    }

    return response.json() as Promise<T>;
}

export async function createCreemCheckout(input: CreemCheckoutRequest) {
    return creemRequest<CreemCheckoutResponse>("/v1/checkouts", {
        method: "POST",
        body: JSON.stringify({
            product_id: input.productId,
            request_id: input.requestId,
            success_url: input.successUrl,
            metadata: input.metadata,
            customer: input.customer,
        }),
    });
}

export async function retrieveCreemCheckout(checkoutId: string) {
    const query = new URLSearchParams({ checkout_id: checkoutId });
    return creemRequest<CreemCheckoutResponse>(`/v1/checkouts?${query.toString()}`, {
        method: "GET",
    });
}

export async function createCreemCustomerPortal(customerId: string) {
    return creemRequest<CreemCustomerPortalResponse>("/v1/customers/billing", {
        method: "POST",
        body: JSON.stringify({
            customer_id: customerId,
        }),
    });
}

function parseStructuredCreemSignature(signatureHeader: string) {
    const entries = signatureHeader
        .split(",")
        .map((part) => part.trim())
        .reduce<Record<string, string>>((acc, part) => {
            const [key, value] = part.split("=", 2);
            if (key && value) {
                acc[key] = value;
            }
            return acc;
        }, {});

    return {
        timestamp: entries.t,
        signature: entries.v1,
    };
}

function signaturesMatch(expected: string, received: string) {
    const expectedBuffer = Buffer.from(expected, "utf8");
    const receivedBuffer = Buffer.from(received, "utf8");

    return expectedBuffer.length === receivedBuffer.length && crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

export function verifyCreemWebhookSignature(rawBody: string, signatureHeader: string | null) {
    if (!creemWebhookSecret || !signatureHeader) {
        return false;
    }

    const normalizedHeader = signatureHeader.trim();
    const officialSignature = crypto
        .createHmac("sha256", creemWebhookSecret)
        .update(rawBody)
        .digest("hex");

    if (signaturesMatch(officialSignature, normalizedHeader)) {
        return true;
    }

    const { timestamp, signature } = parseStructuredCreemSignature(normalizedHeader);
    if (!timestamp || !signature) {
        return false;
    }

    const structuredSignature = crypto
        .createHmac("sha256", creemWebhookSecret)
        .update(`${timestamp}.${rawBody}`)
        .digest("hex");

    return signaturesMatch(structuredSignature, signature);
}
