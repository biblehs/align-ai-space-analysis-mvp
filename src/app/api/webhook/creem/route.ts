import { NextRequest, NextResponse } from "next/server";
import { processBillingWebhookEvent } from "@/lib/billing/service";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
    const signature = req.headers.get("creem-signature");
    const body = await req.text();

    try {
        const result = await processBillingWebhookEvent({
            rawBody: body,
            signatureHeader: signature,
            pagePath: req.nextUrl.pathname,
        });

        if (!result.handled) {
            if (result.reason === "missing-analysis-id") {
                logger.warn("Missing analysis ID in Creem webhook");
            }

            if (result.reason === "analysis-not-found") {
                logger.warn("Webhook analysis not found", { analysisId: result.analysisId });
            }
        }

        return NextResponse.json({ success: true, data: { received: true } });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown webhook error";
        const isSignatureError = message === "Invalid Creem webhook signature";
        logger.error(isSignatureError ? "Creem webhook signature verification failed" : "Creem webhook processing failed", error);
        return NextResponse.json({ success: false, error: `Webhook Error: ${message}` }, { status: isSignatureError ? 400 : 500 });
    }
}
