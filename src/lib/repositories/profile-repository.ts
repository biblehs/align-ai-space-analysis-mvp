import { isSupabaseAdminConfigured, supabaseAdmin } from "@/lib/supabase";
import type { UserProfile } from "@/types";

export type RepositoryRequestUser = {
    id: string;
    email: string | null;
    provider?: string | null;
    fullName?: string | null;
};

type ProfileContextInput = {
    preferredLanguage?: string | null;
    timezone?: string | null;
    signupSource?: string | null;
    signupCampaign?: string | null;
    lastActiveAt?: string | null;
};

function normalizeEmail(email: string | null | undefined) {
    const normalized = email?.trim().toLowerCase() ?? "";
    return normalized || null;
}

async function getProfileByEmail(email: string): Promise<UserProfile | null> {
    const { data, error } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("email", email)
        .maybeSingle<UserProfile>();

    if (error || !data) {
        return null;
    }

    return data;
}

export async function getProfileById(userId: string): Promise<UserProfile | null> {
    if (!isSupabaseAdminConfigured) {
        return null;
    }

    const { data, error } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single<UserProfile>();

    if (error || !data) {
        return null;
    }

    return data;
}

export async function getProfileForUser(user: { id: string; email: string | null }): Promise<UserProfile | null> {
    if (!isSupabaseAdminConfigured) {
        return null;
    }

    const profileById = await getProfileById(user.id);
    if (profileById) {
        return profileById;
    }

    const normalizedEmail = normalizeEmail(user.email);
    if (!normalizedEmail) {
        return null;
    }

    return getProfileByEmail(normalizedEmail);
}

export async function upsertProfile(
    user: RepositoryRequestUser,
    marketingOptIn: boolean,
    profileContext?: ProfileContextInput,
): Promise<UserProfile | null> {
    const normalizedEmail = normalizeEmail(user.email);

    if (!isSupabaseAdminConfigured || !normalizedEmail) {
        return null;
    }

    const timestamp = marketingOptIn ? new Date().toISOString() : null;
    const payload: Partial<UserProfile> & { id: string; email: string } = {
        id: user.id,
        email: normalizedEmail,
        provider: user.provider ?? null,
        marketing_opt_in: marketingOptIn,
        marketing_opt_in_at: timestamp,
        last_active_at: profileContext?.lastActiveAt ?? new Date().toISOString(),
    };

    if (typeof user.fullName === "string" && user.fullName.trim()) {
        payload.full_name = user.fullName.trim();
    }

    if (typeof profileContext?.preferredLanguage !== "undefined") {
        payload.preferred_language = profileContext.preferredLanguage ?? null;
    }

    if (typeof profileContext?.timezone !== "undefined") {
        payload.timezone = profileContext.timezone ?? null;
    }

    if (typeof profileContext?.signupSource !== "undefined") {
        payload.signup_source = profileContext.signupSource ?? null;
    }

    if (typeof profileContext?.signupCampaign !== "undefined") {
        payload.signup_campaign = profileContext.signupCampaign ?? null;
    }

    const existingProfile = await getProfileForUser({
        id: user.id,
        email: normalizedEmail,
    });

    if (existingProfile) {
        const { data, error } = await supabaseAdmin
            .from("profiles")
            .update({
                email: normalizedEmail,
                full_name: payload.full_name,
                provider: payload.provider,
                marketing_opt_in: payload.marketing_opt_in,
                marketing_opt_in_at: payload.marketing_opt_in_at,
                preferred_language: payload.preferred_language,
                timezone: payload.timezone,
                signup_source: payload.signup_source,
                signup_campaign: payload.signup_campaign,
                last_active_at: payload.last_active_at,
            })
            .eq("id", existingProfile.id)
            .select("*")
            .single<UserProfile>();

        if (error || !data) {
            return null;
        }

        return data;
    }

    const { data, error } = await supabaseAdmin.from("profiles").insert(payload).select("*").single<UserProfile>();

    if (error || !data) {
        return null;
    }

    return data;
}

export async function updateProfile(
    user: {
        id: string;
        email: string | null;
    },
    updates: {
        fullName?: string;
        marketingOptIn?: boolean;
        preferredLanguage?: string | null;
        timezone?: string | null;
        countryCode?: string | null;
        city?: string | null;
        onboardingGoal?: string | null;
        budgetPreference?: string | null;
        stylePreferenceDefault?: string | null;
    },
): Promise<UserProfile | null> {
    if (!isSupabaseAdminConfigured) {
        return null;
    }

    const existingProfile = await getProfileForUser(user);
    if (!existingProfile) {
        return null;
    }

    const payload: Partial<UserProfile> = {};

    if (typeof updates.fullName === "string") {
        payload.full_name = updates.fullName.trim() || null;
    }

    if (typeof updates.marketingOptIn === "boolean") {
        payload.marketing_opt_in = updates.marketingOptIn;
        payload.marketing_opt_in_at = updates.marketingOptIn ? new Date().toISOString() : null;
    }

    if ("preferredLanguage" in updates) {
        payload.preferred_language = updates.preferredLanguage ?? null;
    }

    if ("timezone" in updates) {
        payload.timezone = updates.timezone ?? null;
    }

    if ("countryCode" in updates) {
        payload.country_code = updates.countryCode ?? null;
    }

    if ("city" in updates) {
        payload.city = updates.city ?? null;
    }

    if ("onboardingGoal" in updates) {
        payload.onboarding_goal = updates.onboardingGoal ?? null;
    }

    if ("budgetPreference" in updates) {
        payload.budget_preference = updates.budgetPreference ?? null;
    }

    if ("stylePreferenceDefault" in updates) {
        payload.style_preference_default = updates.stylePreferenceDefault ?? null;
    }

    payload.last_active_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
        .from("profiles")
        .update(payload)
        .eq("id", existingProfile.id)
        .select("*")
        .single<UserProfile>();

    if (error || !data) {
        return null;
    }

    return data;
}
