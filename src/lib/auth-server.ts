import { NextRequest } from "next/server";
import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase";

export type RequestUser = {
    id: string;
    email: string | null;
    provider: string | null;
    fullName?: string | null;
};

function extractUserFullName(user: {
    user_metadata?: {
        full_name?: unknown;
        name?: unknown;
    };
}) {
    const fullName =
        typeof user.user_metadata?.full_name === "string"
            ? user.user_metadata.full_name
            : typeof user.user_metadata?.name === "string"
                ? user.user_metadata.name
                : null;

    return fullName?.trim() || null;
}

export async function getRequestUser(req: NextRequest): Promise<RequestUser | null> {
    if (!isSupabaseAdminConfigured) {
        return null;
    }

    const authorization = req.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) {
        return null;
    }

    const accessToken = authorization.slice("Bearer ".length).trim();
    if (!accessToken) {
        return null;
    }

    const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
    if (error || !data.user) {
        return null;
    }

    const provider =
        typeof data.user.app_metadata?.provider === "string"
            ? data.user.app_metadata.provider
            : Array.isArray(data.user.app_metadata?.providers) && typeof data.user.app_metadata.providers[0] === "string"
                ? data.user.app_metadata.providers[0]
                : null;

    return {
        id: data.user.id,
        email: data.user.email?.trim().toLowerCase() ?? null,
        provider,
        fullName: extractUserFullName(data.user),
    };
}
