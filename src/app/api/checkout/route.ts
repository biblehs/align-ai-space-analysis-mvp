import { NextRequest, NextResponse } from "next/server";
import { isBillingConfigured, isBillingProductKey } from "@/lib/billing";
import { createAnalysisBillingCheckout } from "@/lib/billing/service";
import { logger } from "@/lib/logger";
import { getRequestUser } from "@/lib/auth-server";

export async function POST(req: NextRequest) {
    try {
        const user = await getRequestUser(req);
        const { analysisId, sessionId, successPath, cancelPath, productKey, productId } = await req.json();

        if (!analysisId) {
            return NextResponse.json({ success: false, error: "Missing analysisId" }, { status: 400 });
        }

        if (typeof productKey === "string" && !isBillingProductKey(productKey) && typeof productId !== "string") {
            return NextResponse.json({ success: false, error: "Unknown billing product" }, { status: 400 });
        }

        if (!isBillingConfigured) {
            return NextResponse.json({ success: false, error: "Billing is not configured" }, { status: 503 });
        }

        const session = await createAnalysisBillingCheckout({
            analysisId,
            userId: user?.id ?? null,
            sessionId: typeof sessionId === "string" ? sessionId : null,
            pagePath: req.nextUrl.pathname,
            userEmail: user?.email ?? null,
            productKey: typeof productKey === "string" && isBillingProductKey(productKey) ? productKey : undefined,
            productId: typeof productId === "string" ? productId : undefined,
            successPath: typeof successPath === "string" ? successPath : undefined,
            cancelPath: typeof cancelPath === "string" ? cancelPath : undefined,
        });

        return NextResponse.json({
            success: true,
            data: { sessionUrl: session.checkoutUrl },
        });

    } catch (error) {
        const message = error instanceof Error ? error.message : "Internal server error";
        const isConfigError =
            message.includes("Creem product ID placeholder") ||
            message.includes("Creem is not configured") ||
            message.includes("Billing is not configured");
        const isDomainError =
            message === "Analysis not found" ||
            message === "Already paid" ||
            message === "Failed to persist billing checkout state";

        logger.error("Checkout route error", error);
        return NextResponse.json(
            { success: false, error: isConfigError || isDomainError ? message : "Internal server error" },
            { status: isConfigError ? 503 : message === "Analysis not found" ? 404 : message === "Already paid" ? 400 : 500 },
        );
    }
}
