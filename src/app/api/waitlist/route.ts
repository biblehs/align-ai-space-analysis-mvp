import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { createAnalyticsEvent } from "@/lib/repositories/analytics-repository";
import {
    createWaitlistEmailEvent,
    markWaitlistConfirmationSent,
    upsertWaitlistUser,
} from "@/lib/repositories/waitlist-repository";
import { sendWaitlistConfirmationEmail } from "@/lib/services/waitlist-email-service";
import { parseWaitlistSubmission } from "@/lib/waitlist";

const EMAIL_RESEND_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export async function POST(req: NextRequest) {
    const startedAt = Date.now();

    try {
        const body = await req.json().catch(() => null);
        const parsed = parseWaitlistSubmission(body);

        if (!parsed.success) {
            return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
        }

        const submission = parsed.data;
        const waitlistResult = await upsertWaitlistUser(submission);

        if (!waitlistResult) {
            return NextResponse.json({ ok: false, error: "Unable to join the waitlist right now." }, { status: 500 });
        }

        const { user, created } = waitlistResult;
        const lastSentAt = user.confirmation_email_sent_at ? new Date(user.confirmation_email_sent_at).getTime() : 0;
        const shouldSendConfirmation = !lastSentAt || Date.now() - lastSentAt > EMAIL_RESEND_COOLDOWN_MS;

        if (shouldSendConfirmation) {
            const emailResult = await sendWaitlistConfirmationEmail({
                email: user.email,
                waitlistUserId: user.id,
            });

            if (emailResult.sent) {
                await markWaitlistConfirmationSent(user.id, emailResult.sentAt);
                await createWaitlistEmailEvent({
                    waitlistUserId: user.id,
                    email: user.email,
                    emailType: "waitlist_confirmation",
                    provider: emailResult.provider,
                    providerMessageId: emailResult.providerMessageId,
                    status: "sent",
                    sentAt: emailResult.sentAt,
                    metadata: {
                        source: submission.source,
                        primaryGoal: submission.primary_goal,
                    },
                });
            } else {
                await createWaitlistEmailEvent({
                    waitlistUserId: user.id,
                    email: user.email,
                    emailType: "waitlist_confirmation",
                    provider: emailResult.provider,
                    status: "failed",
                    errorMessage: emailResult.reason,
                    metadata: {
                        source: submission.source,
                        primaryGoal: submission.primary_goal,
                    },
                });
            }
        }

        await createAnalyticsEvent({
            eventName: "waitlist_submitted",
            sessionId: submission.session_id ?? null,
            pagePath: submission.page_path ?? submission.landing_path ?? req.nextUrl.pathname,
            eventSource: "waitlist-api",
            properties: {
                source: submission.source,
                referrer: submission.referrer,
                landingPath: submission.landing_path,
                utmSource: submission.utm_source,
                utmMedium: submission.utm_medium,
                utmCampaign: submission.utm_campaign,
                primaryGoal: submission.primary_goal,
                firstRoom: submission.first_room,
                feedbackWillingness: submission.feedback_willingness,
                created,
            },
        });

        logger.api("POST", "/api/waitlist", Date.now() - startedAt, {
            created,
            source: submission.source,
            email: submission.email,
        });

        return NextResponse.json({
            ok: true,
            status: created ? "waitlisted" : "already_waitlisted",
        });
    } catch (error) {
        logger.error("Waitlist submission error", error);
        return NextResponse.json({ ok: false, error: "Unable to join the waitlist right now." }, { status: 500 });
    }
}
