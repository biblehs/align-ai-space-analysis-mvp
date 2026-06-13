import { logger } from "@/lib/logger";

type WaitlistEmailSendResult =
    | { sent: true; provider: "resend"; providerMessageId: string | null; sentAt: string }
    | { sent: false; provider: "resend" | null; reason: string };

function escapeHtml(value: string) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("\"", "&quot;")
        .replaceAll("'", "&#39;");
}

function getBaseUrl() {
    const configured =
        process.env.NEXT_PUBLIC_SITE_URL ||
        (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null);

    return configured || "http://localhost:3000";
}

function getInviteAuthUrl() {
    const baseUrl = getBaseUrl().replace(/\/$/, "");
    return `${baseUrl}/auth?redirect=${encodeURIComponent("/app/upload")}`;
}

function buildWaitlistEmailHtml(email: string) {
    const baseUrl = getBaseUrl().replace(/\/$/, "");
    const safeEmail = escapeHtml(email);

    return `
      <div style="margin:0;background:#f8f3eb;padding:32px 16px;font-family:Georgia, 'Times New Roman', serif;color:#38312c;">
        <div style="margin:0 auto;max-width:560px;border:1px solid rgba(106,91,86,0.12);border-radius:28px;background:#fffdfa;overflow:hidden;box-shadow:0 18px 60px rgba(56,49,44,0.08);">
          <div style="padding:36px 36px 24px;border-bottom:1px solid rgba(106,91,86,0.08);background:linear-gradient(180deg, rgba(240,222,205,0.38) 0%, rgba(255,253,250,0.92) 100%);">
            <p style="margin:0 0 12px;font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:#8c7a6d;font-family:Arial, sans-serif;">Align Early Access</p>
            <h1 style="margin:0;font-size:34px;line-height:1.04;font-weight:400;color:#38312c;">You’re on the list.</h1>
          </div>
          <div style="padding:32px 36px 36px;">
            <p style="margin:0 0 16px;font-size:17px;line-height:1.7;color:#4d443d;">
              Thanks for joining the early access list for Align with <strong>${safeEmail}</strong>.
            </p>
            <p style="margin:0 0 16px;font-size:17px;line-height:1.7;color:#4d443d;">
              We’re inviting people in small waves as we refine the first reading experience around rest,
              emotional clarity, and supportive home rituals.
            </p>
            <p style="margin:0 0 24px;font-size:17px;line-height:1.7;color:#4d443d;">
              When your spot opens, you’ll be among the first to upload a room, receive a personalized
              spatial reading, and explore a gentler wellness plan for home.
            </p>
            <a href="${baseUrl}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#6a5b56;color:#fff7f3;text-decoration:none;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;font-family:Arial, sans-serif;">Visit Align</a>
            <p style="margin:24px 0 0;font-size:14px;line-height:1.7;color:#7d7066;">
              Keep an eye on your inbox. We’ll be in touch soon.
            </p>
          </div>
        </div>
      </div>
    `;
}

function buildWaitlistInviteEmailHtml() {
    const authUrl = getInviteAuthUrl();

    return `
      <div style="margin:0;background:#f8f3eb;padding:32px 16px;font-family:Georgia, 'Times New Roman', serif;color:#38312c;">
        <div style="margin:0 auto;max-width:560px;border:1px solid rgba(106,91,86,0.12);border-radius:28px;background:#fffdfa;overflow:hidden;box-shadow:0 18px 60px rgba(56,49,44,0.08);">
          <div style="padding:36px 36px 24px;border-bottom:1px solid rgba(106,91,86,0.08);background:linear-gradient(180deg, rgba(225,205,188,0.52) 0%, rgba(255,253,250,0.92) 100%);">
            <p style="margin:0 0 12px;font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:#8c7a6d;font-family:Arial, sans-serif;">Align Early Access</p>
            <h1 style="margin:0;font-size:34px;line-height:1.04;font-weight:400;color:#38312c;">Your spot is open.</h1>
          </div>
          <div style="padding:32px 36px 36px;">
            <p style="margin:0 0 16px;font-size:17px;line-height:1.7;color:#4d443d;">
              We’re ready to invite you into the next early-access wave for Align.
            </p>
            <p style="margin:0 0 16px;font-size:17px;line-height:1.7;color:#4d443d;">
              Sign in to begin with the room you want to understand first, then move into your initial reading and a gentler wellness plan for home.
            </p>
            <p style="margin:0 0 24px;font-size:17px;line-height:1.7;color:#4d443d;">
              If you usually prefer Google or an email link, that still works. You can always add a password later from your account settings.
            </p>
            <a href="${authUrl}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#6a5b56;color:#fff7f3;text-decoration:none;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;font-family:Arial, sans-serif;">Claim your spot</a>
            <p style="margin:24px 0 0;font-size:14px;line-height:1.7;color:#7d7066;">
              We’ll continue opening access in thoughtful waves, so you may hear from us again as the experience expands.
            </p>
          </div>
        </div>
      </div>
    `;
}

async function sendResendEmail(input: {
    email: string;
    subject: string;
    html: string;
    logLabel: string;
    tags?: Record<string, string>;
}): Promise<WaitlistEmailSendResult> {
    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL;
    const replyTo = process.env.WAITLIST_REPLY_TO_EMAIL || process.env.RESEND_REPLY_TO_EMAIL || undefined;

    if (!apiKey || !fromEmail) {
        logger.warn(`${input.logLabel} skipped due to missing Resend config`, {
            hasApiKey: Boolean(apiKey),
            hasFromEmail: Boolean(fromEmail),
        });
        return { sent: false, provider: null, reason: "missing_email_provider_config" };
    }

    const sentAt = new Date().toISOString();

    try {
        const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: fromEmail,
                to: [input.email],
                subject: input.subject,
                html: input.html,
                reply_to: replyTo,
                tags: input.tags,
            }),
        });

        const payload = await response.json().catch(() => ({})) as { id?: string; message?: string };

        if (!response.ok) {
            const reason = payload.message || `resend_${response.status}`;
            logger.warn(`${input.logLabel} failed`, { email: input.email, reason });
            return { sent: false, provider: "resend", reason };
        }

        return {
            sent: true,
            provider: "resend",
            providerMessageId: payload.id ?? null,
            sentAt,
        };
    } catch (error) {
        logger.error(`${input.logLabel} error`, error, { email: input.email });
        return { sent: false, provider: "resend", reason: "email_request_failed" };
    }
}

export async function sendWaitlistConfirmationEmail(input: {
    email: string;
    waitlistUserId?: string | null;
}): Promise<WaitlistEmailSendResult> {
    return sendResendEmail({
        email: input.email,
        subject: "You’re on the Align early access list",
        html: buildWaitlistEmailHtml(input.email),
        logLabel: "Waitlist confirmation email",
        tags: {
            category: "waitlist_confirmation",
            ...(input.waitlistUserId ? { waitlist_user_id: input.waitlistUserId } : {}),
        },
    });
}

export async function sendWaitlistInviteEmail(input: {
    email: string;
    waitlistUserId?: string | null;
}): Promise<WaitlistEmailSendResult> {
    return sendResendEmail({
        email: input.email,
        subject: "Your Align early access spot is open",
        html: buildWaitlistInviteEmailHtml(),
        logLabel: "Waitlist invite email",
        tags: {
            category: "waitlist_invite",
            ...(input.waitlistUserId ? { waitlist_user_id: input.waitlistUserId } : {}),
        },
    });
}
