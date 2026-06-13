import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { getWaitlistAccessStateByEmail } from "@/lib/repositories/waitlist-repository";

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json().catch(() => ({}))) as { email?: string };
        const access = await getWaitlistAccessStateByEmail(body.email ?? "");

        return NextResponse.json({
            ok: true,
            data: access,
        });
    } catch (error) {
        logger.error("Waitlist access route error", error);
        return NextResponse.json(
            { ok: false, error: "Unable to verify waitlist access right now." },
            { status: 500 },
        );
    }
}
