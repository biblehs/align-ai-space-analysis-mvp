import { isSupabaseAdminConfigured, supabaseAdmin } from "@/lib/supabase";
import type { AnalyticsEventName, AnalyticsEventRecord } from "@/types";
import type { Json } from "@/types/database";

type CreateAnalyticsEventInput = {
    eventName: AnalyticsEventName | string;
    userId?: string | null;
    sessionId?: string | null;
    analysisId?: string | null;
    pagePath?: string | null;
    eventSource?: string | null;
    properties?: Json;
};

export async function createAnalyticsEvent(input: CreateAnalyticsEventInput): Promise<AnalyticsEventRecord | null> {
    if (!isSupabaseAdminConfigured) {
        return null;
    }

    const { data, error } = await supabaseAdmin
        .from("analytics_events")
        .insert({
            user_id: input.userId ?? null,
            session_id: input.sessionId ?? null,
            analysis_id: input.analysisId ?? null,
            event_name: input.eventName,
            page_path: input.pagePath ?? null,
            event_source: input.eventSource ?? null,
            properties: input.properties ?? {},
        })
        .select("*")
        .single<AnalyticsEventRecord>();

    if (error || !data) {
        return null;
    }

    return data;
}
