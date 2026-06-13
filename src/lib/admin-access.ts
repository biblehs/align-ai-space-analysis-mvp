import "server-only";

function normalizeEmail(email: string | null | undefined) {
    return (email ?? "").trim().toLowerCase();
}

export function isAllowedAdminEmail(email: string | null | undefined) {
    const configuredAdminEmail = normalizeEmail(process.env.INTERNAL_ADMIN_EMAIL);
    return Boolean(configuredAdminEmail) && normalizeEmail(email) === configuredAdminEmail;
}
