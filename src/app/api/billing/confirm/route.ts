import { NextRequest, NextResponse } from "next/server";
import { confirmBillingCheckoutPayment } from "@/lib/billing/service";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
    try {
        const { analysisId, checkoutId } = await req.json();

        if (typeof analysisId !== "string" || !analysisId.trim()) {
            return NextResponse.json({ success: false, error: "Missing analysisId" }, { status: 400 });
        }

        if (typeof checkoutId !== "string" || !checkoutId.trim()) {
            return NextResponse.json({ success: false, error: "Missing checkoutId" }, { status: 400 });
        }

        const result = await confirmBillingCheckoutPayment({
            analysisId: analysisId.trim(),
            checkoutId: checkoutId.trim(),
            pagePath: req.nextUrl.pathname,
        });

        return NextResponse.json({
            success: true,
            data: result,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Internal server error";
        logger.error("Billing confirm route error", error);

        return NextResponse.json(
            { success: false, error: message },
            { status: message === "Analysis not found" ? 404 : message === "Checkout does not belong to this analysis" ? 400 : 500 },
        );
    }
}
