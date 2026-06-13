import { isSupabaseAdminConfigured, supabaseAdmin } from "@/lib/supabase";
import { isAllowedAdminEmail } from "@/lib/admin-access";
import { computeWaitlistPriorityScore, normalizeWaitlistEmail } from "@/lib/waitlist";
import type { Database, Json } from "@/types/database";
import type {
    WaitlistAdminSummary,
    WaitlistEmailEventRecord,
    WaitlistStatus,
    WaitlistSubmissionPayload,
    WaitlistUserRecord,
} from "@/types";

export async function getWaitlistUserByEmail(email: string): Promise<WaitlistUserRecord | null> {
    if (!isSupabaseAdminConfigured) {
        return null;
    }

    const normalizedEmail = normalizeWaitlistEmail(email);
    if (!normalizedEmail) {
        return null;
    }

    const { data, error } = await supabaseAdmin
        .from("waitlist_users")
        .select("*")
        .eq("email", normalizedEmail)
        .maybeSingle<WaitlistUserRecord>();

    if (error || !data) {
        return null;
    }

    return data;
}

const approvedWaitlistStatuses: WaitlistStatus[] = ["invited", "claimed", "activated", "converted"];

export function isWaitlistAccessApproved(status: WaitlistStatus | string | null | undefined) {
    return approvedWaitlistStatuses.includes((status ?? "") as WaitlistStatus);
}

export async function getWaitlistAccessStateByEmail(email: string): Promise<{
    allowed: boolean;
    status: WaitlistStatus | null;
    message: string;
}> {
    const normalizedEmail = normalizeWaitlistEmail(email);
    if (!normalizedEmail) {
        return {
            allowed: false,
            status: null,
            message: "Enter the same email you used to join the waitlist.",
        };
    }

    if (isAllowedAdminEmail(normalizedEmail)) {
        return {
            allowed: true,
            status: "activated",
            message: "Internal operator access approved.",
        };
    }

    const user = await getWaitlistUserByEmail(normalizedEmail);
    if (!user) {
        return {
            allowed: false,
            status: null,
            message: "Sign-in is only available to approved waitlist members right now. Reserve your spot first.",
        };
    }

    if (isWaitlistAccessApproved(user.status)) {
        return {
            allowed: true,
            status: user.status,
            message: "Access approved.",
        };
    }

    if (user.status === "waitlisted") {
        return {
            allowed: false,
            status: user.status,
            message: "You’re on the waitlist. We’ll email you as soon as your invitation is ready.",
        };
    }

    if (user.status === "inactive") {
        return {
            allowed: false,
            status: user.status,
            message: "This invitation is no longer active. Please contact support if this looks wrong.",
        };
    }

    return {
        allowed: false,
        status: user.status,
        message: "This email is not approved for sign-in yet.",
    };
}

function buildPriorityPayload(input: {
    primary_goal?: string | null;
    first_room?: string | null;
    feedback_willingness?: string | null;
    open_text_note?: string | null;
    source?: string | null;
}) {
    return computeWaitlistPriorityScore({
        primaryGoal: input.primary_goal ?? null,
        firstRoom: input.first_room ?? null,
        feedbackWillingness: input.feedback_willingness ?? null,
        openTextNote: input.open_text_note ?? null,
        source: input.source ?? null,
    });
}

export async function upsertWaitlistUser(input: WaitlistSubmissionPayload): Promise<{ user: WaitlistUserRecord; created: boolean } | null> {
    if (!isSupabaseAdminConfigured) {
        return null;
    }

    const existing = await getWaitlistUserByEmail(input.email);
    if (existing) {
        const merged = {
            source: input.source ?? existing.source,
            referrer: input.referrer ?? existing.referrer,
            landing_path: input.landing_path ?? existing.landing_path,
            utm_source: input.utm_source ?? existing.utm_source,
            utm_medium: input.utm_medium ?? existing.utm_medium,
            utm_campaign: input.utm_campaign ?? existing.utm_campaign,
            primary_goal: input.primary_goal ?? existing.primary_goal,
            first_room: input.first_room ?? existing.first_room,
            feedback_willingness: input.feedback_willingness ?? existing.feedback_willingness,
            open_text_note: input.open_text_note ?? existing.open_text_note,
        };

        const { data, error } = await supabaseAdmin
            .from("waitlist_users")
            .update({
                ...merged,
                priority_score: buildPriorityPayload(merged),
            })
            .eq("id", existing.id)
            .select("*")
            .single<WaitlistUserRecord>();

        if (error || !data) {
            return null;
        }

        return { user: data, created: false };
    }

    const { data, error } = await supabaseAdmin
        .from("waitlist_users")
        .insert({
            email: input.email,
            status: "waitlisted",
            source: input.source ?? null,
            referrer: input.referrer ?? null,
            landing_path: input.landing_path ?? null,
            utm_source: input.utm_source ?? null,
            utm_medium: input.utm_medium ?? null,
            utm_campaign: input.utm_campaign ?? null,
            primary_goal: input.primary_goal,
            first_room: input.first_room,
            feedback_willingness: input.feedback_willingness,
            open_text_note: input.open_text_note ?? null,
            priority_score: buildPriorityPayload(input),
        })
        .select("*")
        .single<WaitlistUserRecord>();

    if (error || !data) {
        return null;
    }

    return { user: data, created: true };
}

export async function markWaitlistConfirmationSent(waitlistUserId: string, sentAt: string) {
    if (!isSupabaseAdminConfigured) {
        return false;
    }

    const { error } = await supabaseAdmin
        .from("waitlist_users")
        .update({ confirmation_email_sent_at: sentAt })
        .eq("id", waitlistUserId);

    return !error;
}

export async function createWaitlistEmailEvent(input: {
    waitlistUserId: string;
    email: string;
    emailType: string;
    provider?: string | null;
    providerMessageId?: string | null;
    status: string;
    errorMessage?: string | null;
    sentAt?: string | null;
    metadata?: Json;
}): Promise<WaitlistEmailEventRecord | null> {
    if (!isSupabaseAdminConfigured) {
        return null;
    }

    const { data, error } = await supabaseAdmin
        .from("email_events")
        .insert({
            waitlist_user_id: input.waitlistUserId,
            email: input.email,
            email_type: input.emailType,
            provider: input.provider ?? null,
            provider_message_id: input.providerMessageId ?? null,
            status: input.status,
            error_message: input.errorMessage ?? null,
            sent_at: input.sentAt ?? null,
            metadata: input.metadata ?? {},
        })
        .select("*")
        .single<WaitlistEmailEventRecord>();

    if (error || !data) {
        return null;
    }

    return data;
}

export async function updateWaitlistEmailEventFromWebhook(input: {
    providerMessageId: string;
    email?: string | null;
    status: string;
    errorMessage?: string | null;
    sentAt?: string | null;
    openedAt?: string | null;
    clickedAt?: string | null;
    metadata?: Json;
}): Promise<WaitlistEmailEventRecord | null> {
    if (!isSupabaseAdminConfigured) {
        return null;
    }

    const { data: existingRows, error: existingError } = await supabaseAdmin
        .from("email_events")
        .select("*")
        .eq("provider_message_id", input.providerMessageId)
        .order("created_at", { ascending: false })
        .limit(1);

    if (existingError) {
        return null;
    }

    const existing = existingRows?.[0] as WaitlistEmailEventRecord | undefined;
    const mergedMetadata = {
        ...(typeof existing?.metadata === "object" && existing?.metadata ? existing.metadata : {}),
        ...(typeof input.metadata === "object" && input.metadata ? input.metadata : {}),
    } as Json;

    if (existing) {
        const { data, error } = await supabaseAdmin
            .from("email_events")
            .update({
                status: input.status,
                error_message: input.errorMessage ?? existing.error_message ?? null,
                sent_at: input.sentAt ?? existing.sent_at ?? null,
                opened_at: input.openedAt ?? existing.opened_at ?? null,
                clicked_at: input.clickedAt ?? existing.clicked_at ?? null,
                metadata: mergedMetadata,
            })
            .eq("id", existing.id)
            .select("*")
            .single<WaitlistEmailEventRecord>();

        if (error || !data) {
            return null;
        }

        return data;
    }

    const normalizedEmail = input.email ? normalizeWaitlistEmail(input.email) : null;
    const waitlistUser = normalizedEmail ? await getWaitlistUserByEmail(normalizedEmail) : null;

    const { data, error } = await supabaseAdmin
        .from("email_events")
        .insert({
            waitlist_user_id: waitlistUser?.id ?? null,
            email: normalizedEmail ?? input.email ?? "unknown@resend-webhook.local",
            email_type: "resend_webhook",
            provider: "resend",
            provider_message_id: input.providerMessageId,
            status: input.status,
            error_message: input.errorMessage ?? null,
            sent_at: input.sentAt ?? null,
            opened_at: input.openedAt ?? null,
            clicked_at: input.clickedAt ?? null,
            metadata: mergedMetadata,
        })
        .select("*")
        .single<WaitlistEmailEventRecord>();

    if (error || !data) {
        return null;
    }

    return data;
}

export async function listWaitlistUsers(filters?: {
    status?: string | null;
    goal?: string | null;
    room?: string | null;
    feedback?: string | null;
    search?: string | null;
    sort?: string | null;
    limit?: number;
}): Promise<WaitlistUserRecord[]> {
    if (!isSupabaseAdminConfigured) {
        return [];
    }

    let query = supabaseAdmin
        .from("waitlist_users")
        .select("*")
        .limit(filters?.limit ?? 200);

    const sort = filters?.sort ?? "priority_desc";
    if (sort === "newest") {
        query = query.order("created_at", { ascending: false });
    } else if (sort === "oldest") {
        query = query.order("created_at", { ascending: true });
    } else {
        query = query.order("priority_score", { ascending: false }).order("created_at", { ascending: true });
    }

    if (filters?.status) {
        query = query.eq("status", filters.status);
    }

    if (filters?.goal) {
        query = query.eq("primary_goal", filters.goal);
    }

    if (filters?.room) {
        query = query.eq("first_room", filters.room);
    }

    if (filters?.feedback) {
        query = query.eq("feedback_willingness", filters.feedback);
    }

    if (filters?.search?.trim()) {
        const escaped = filters.search.trim().replaceAll(",", "\\,");
        query = query.or(`email.ilike.%${escaped}%,open_text_note.ilike.%${escaped}%,source.ilike.%${escaped}%`);
    }

    const { data, error } = await query;

    if (error || !data) {
        return [];
    }

    return data as WaitlistUserRecord[];
}

export async function getWaitlistUsersByIds(ids: string[]): Promise<WaitlistUserRecord[]> {
    if (!isSupabaseAdminConfigured || ids.length === 0) {
        return [];
    }

    const { data, error } = await supabaseAdmin
        .from("waitlist_users")
        .select("*")
        .in("id", ids);

    if (error || !data) {
        return [];
    }

    return data as WaitlistUserRecord[];
}

export async function getWaitlistAdminSummary(): Promise<WaitlistAdminSummary> {
    const empty: WaitlistAdminSummary = {
        total: 0,
        confirmationSent: 0,
        feedbackFriendly: 0,
        highPriority: 0,
        byStatus: {},
        byGoal: {},
        byRoom: {},
        emailByStatus: {},
    };

    if (!isSupabaseAdminConfigured) {
        return empty;
    }

    const [{ data: waitlistRows, error: waitlistError }, { data: emailRows, error: emailError }] = await Promise.all([
        supabaseAdmin
            .from("waitlist_users")
            .select("status, primary_goal, first_room, feedback_willingness, priority_score, confirmation_email_sent_at"),
        supabaseAdmin
            .from("email_events")
            .select("status"),
    ]);

    if (waitlistError || !waitlistRows || emailError || !emailRows) {
        return empty;
    }

    const summary = waitlistRows.reduce<WaitlistAdminSummary>((nextSummary, row) => {
        nextSummary.total += 1;

        if (row.confirmation_email_sent_at) {
            nextSummary.confirmationSent += 1;
        }

        if (row.feedback_willingness === "yes" || row.feedback_willingness === "maybe") {
            nextSummary.feedbackFriendly += 1;
        }

        if ((row.priority_score ?? 0) >= 5) {
            nextSummary.highPriority += 1;
        }

        const statusKey = row.status ?? "unknown";
        nextSummary.byStatus[statusKey] = (nextSummary.byStatus[statusKey] ?? 0) + 1;

        const goalKey = row.primary_goal ?? "unknown";
        nextSummary.byGoal[goalKey] = (nextSummary.byGoal[goalKey] ?? 0) + 1;

        const roomKey = row.first_room ?? "unknown";
        nextSummary.byRoom[roomKey] = (nextSummary.byRoom[roomKey] ?? 0) + 1;

        return nextSummary;
    }, empty);

    for (const row of emailRows) {
        const statusKey = row.status ?? "unknown";
        summary.emailByStatus[statusKey] = (summary.emailByStatus[statusKey] ?? 0) + 1;
    }

    return summary;
}

export async function updateWaitlistUserStatus(input: {
    id: string;
    status: WaitlistStatus;
}): Promise<WaitlistUserRecord | null> {
    const updatedUsers = await updateWaitlistUsersStatusBulk({
        ids: [input.id],
        status: input.status,
    });

    return updatedUsers[0] ?? null;
}

export async function updateWaitlistUsersStatusBulk(input: {
    ids: string[];
    status: WaitlistStatus;
}): Promise<WaitlistUserRecord[]> {
    if (!isSupabaseAdminConfigured) {
        return [];
    }

    const uniqueIds = Array.from(new Set(input.ids.filter(Boolean)));
    if (uniqueIds.length === 0) {
        return [];
    }

    const timestamp = new Date().toISOString();
    const payload: Database["public"]["Tables"]["waitlist_users"]["Update"] = {
        status: input.status,
    };

    if (input.status === "invited") {
        payload.invited_at = timestamp;
    }

    if (input.status === "claimed") {
        payload.claimed_at = timestamp;
    }

    if (input.status === "activated" || input.status === "converted") {
        payload.activated_at = timestamp;
    }

    const { data, error } = await supabaseAdmin
        .from("waitlist_users")
        .update(payload)
        .in("id", uniqueIds)
        .select("*");

    if (error || !data) {
        return [];
    }

    return data as WaitlistUserRecord[];
}
