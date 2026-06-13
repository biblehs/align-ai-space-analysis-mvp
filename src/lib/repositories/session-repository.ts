import { isSupabaseAdminConfigured, supabaseAdmin } from "@/lib/supabase";
import type { UserSessionRecord } from "@/types";

type UpsertUserSessionInput = {
    userId: string;
    sessionId: string;
    ipHash?: string | null;
    userAgent?: string | null;
    browser?: string | null;
    os?: string | null;
    deviceType?: string | null;
    locale?: string | null;
    timezone?: string | null;
    referrer?: string | null;
    landingPath?: string | null;
    utmSource?: string | null;
    utmMedium?: string | null;
    utmCampaign?: string | null;
};

export async function upsertUserSession(input: UpsertUserSessionInput): Promise<UserSessionRecord | null> {
    if (!isSupabaseAdminConfigured) {
        return null;
    }

    const timestamp = new Date().toISOString();
    const payload = {
        user_id: input.userId,
        session_id: input.sessionId,
        ip_hash: input.ipHash ?? null,
        user_agent: input.userAgent ?? null,
        browser: input.browser ?? null,
        os: input.os ?? null,
        device_type: input.deviceType ?? null,
        locale: input.locale ?? null,
        timezone: input.timezone ?? null,
        referrer: input.referrer ?? null,
        landing_path: input.landingPath ?? null,
        utm_source: input.utmSource ?? null,
        utm_medium: input.utmMedium ?? null,
        utm_campaign: input.utmCampaign ?? null,
        login_at: timestamp,
        last_seen_at: timestamp,
    };

    const { data, error } = await supabaseAdmin
        .from("user_sessions")
        .upsert(payload, { onConflict: "user_id,session_id" })
        .select("*")
        .single<UserSessionRecord>();

    if (error || !data) {
        return null;
    }

    return data;
}
