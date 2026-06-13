import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { logger } from "@/lib/logger";
import { updateWaitlistEmailEventFromWebhook } from "@/lib/repositories/waitlist-repository";

type ResendWebhookEvent = {
    type: string;
    created_at?: string;
    data?: {
        email_id?: string;
        to?: string[];
        tags?: Record<string, string>;
        click?: {
            link?: string;
            timestamp?: string;
        };
        open?: {
            timestamp?: string;
        };
        bounce?: {
            message?: string;
            reason?: string;
        };
        error?: {
            message?: string;
        };
        last_error?: {
            message?: string;
        };
    };
};

const handledStatusByEventType: Record<string, string> = {
    "email.sent": "sent",
    "email.delivered": "delivered",
    "email.delivery_delayed": "delivery_delayed",
    "email.opened": "opened",
    "email.clicked": "clicked",
    "email.failed": "failed",
    "email.bounced": "bounced",
    "email.complained": "complained",
    "email.suppressed": "suppressed",
};

function getWebhookSecret() {
    return process.env.RESEND_WEBHOOK_SECRET || process.env.WAITLIST_RESEND_WEBHOOK_SECRET || null;
}

function getHeaders(req: NextRequest) {
    const id = req.headers.get("svix-id");
    const timestamp = req.headers.get("svix-timestamp");
    const signature = req.headers.get("svix-signature");

    if (!id || !timestamp || !signature) {
        return null;
    }

    return {
        "svix-id": id,
        "svix-timestamp": timestamp,
        "svix-signature": signature,
    };
}

function extractErrorMessage(event: ResendWebhookEvent) {
    return (
        event.data?.error?.message ||
        event.data?.last_error?.message ||
        event.data?.bounce?.message ||
        event.data?.bounce?.reason ||
        null
    );
}

export async function POST(req: NextRequest) {
    const webhookSecret = getWebhookSecret();
    if (!webhookSecret) {
        logger.warn("Resend webhook received without configured secret");
        return NextResponse.json({ success: false, error: "Missing Resend webhook secret." }, { status: 503 });
    }

    const headers = getHeaders(req);
    if (!headers) {
        return NextResponse.json({ success: false, error: "Missing webhook signature headers." }, { status: 400 });
    }

    const payload = await req.text();

    try {
        const webhook = new Webhook(webhookSecret);
        const event = webhook.verify(payload, headers) as ResendWebhookEvent;
        const nextStatus = handledStatusByEventType[event.type];

        if (!nextStatus) {
            return NextResponse.json({ success: true, data: { ignored: true } });
        }

        const providerMessageId = event.data?.email_id?.trim();
        if (!providerMessageId) {
            logger.warn("Resend webhook missing email_id", { eventType: event.type });
            return NextResponse.json({ success: true, data: { ignored: true } });
        }

        const email = Array.isArray(event.data?.to) ? event.data?.to[0] ?? null : null;
        const openedAt = event.type === "email.opened"
            ? event.data?.open?.timestamp ?? event.created_at ?? null
            : null;
        const clickedAt = event.type === "email.clicked"
            ? event.data?.click?.timestamp ?? event.created_at ?? null
            : null;
        const sentAt = event.type === "email.sent" ? event.created_at ?? null : null;

        await updateWaitlistEmailEventFromWebhook({
            providerMessageId,
            email,
            status: nextStatus,
            errorMessage: extractErrorMessage(event),
            sentAt,
            openedAt,
            clickedAt,
            metadata: {
                resend_event_type: event.type,
                resend_event_created_at: event.created_at ?? null,
                resend_tags: event.data?.tags ?? null,
                resend_click_link: event.data?.click?.link ?? null,
            },
        });

        return NextResponse.json({ success: true, data: { handled: true } });
    } catch (error) {
        logger.error("Resend webhook processing failed", error);
        return NextResponse.json({ success: false, error: "Invalid Resend webhook." }, { status: 400 });
    }
}
