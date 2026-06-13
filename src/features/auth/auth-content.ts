import { marketingBrand } from "@/features/marketing/site-content";

export const authPageContent = {
    cardTitle: marketingBrand.name,
    cardSubtitle: "Sign in is currently reserved for approved waitlist members.",
    localModeNotice: "Testing in browser-only mode until Supabase Auth is configured.",
    redirectNotice: "Sign-in detected. Redirecting to your account...",
    marketingOptIn:
        "I want product updates, launch news, and occasional notes on sleep, focus, calm, and room insights by email.",
    newHere:
        "Your account is created automatically after your waitlist invitation is approved.",
    passwordHint:
        "Use the invited email for password sign-in. If you first joined by email link or Google, you can still save a password from the account center later.",
};

export const accountPageContent = {
    anonymousTitle: "Sign in to access your personal center",
    anonymousCopy:
        "Keep your analysis history, revisit reports, and manage preferences from one place.",
    loadingAccount: "Loading your account...",
    loadingSetup: "Finishing your account setup...",
    supportTitle: "Need anything?",
    supportCopy:
        "If something in your report feels unclear, or if you want to share feedback, reach out to the team directly.",
    supportEmail: marketingBrand.supportEmail,
    billingCopy:
        "Manage receipts and future subscription settings from one billing entry point once a payment has been made.",
};
