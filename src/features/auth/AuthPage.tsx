"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check } from "lucide-react";
import { authPageContent } from "@/features/auth/auth-content";
import { EditorialFlowHeader } from "@/features/app-ui/v2/shared/EditorialFlowChrome";
import { marketingBrand } from "@/features/marketing/site-content";
import { trackEvent } from "@/lib/analytics-client";
import { PENDING_MARKETING_OPT_IN_KEY, signInLocally, syncSignedInProfile } from "@/lib/auth-client";
import { isLocalPreviewHostname, normalizeInternalPath } from "@/lib/routing";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import { marketingHomeHref, marketingPrivacyHref, marketingTermsHref } from "@/lib/navigation";

type AuthMode = "magic-link" | "password";

function formatAuthError(message: string, authMode: AuthMode) {
    if (
        authMode === "password" &&
        (message === "Invalid login credentials" ||
            message.toLowerCase().includes("invalid login credentials") ||
            message.toLowerCase().includes("invalid credentials"))
    ) {
        return "Email and password do not match. Please try again.";
    }

    return message;
}

const benefitItems = [
    "Saved room readings and report history",
    "Personalized goals and style preferences",
    "A quieter way to improve how your space feels",
];

export default function AuthPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [authMode, setAuthMode] = useState<AuthMode>("magic-link");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [marketingOptIn, setMarketingOptIn] = useState(true);
    const [isEmailLoading, setIsEmailLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [isPasswordResetLoading, setIsPasswordResetLoading] = useState(false);
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const nextPath = useMemo(
        () => normalizeInternalPath(searchParams?.get("redirect"), "/account"),
        [searchParams],
    );
    const isConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const isLocalPreviewMode =
        typeof window !== "undefined" &&
        isLocalPreviewHostname(window.location.hostname);

    const buildRedirectUrl = (options?: { flow?: "signin" | "recovery" }) => {
        const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL?.trim();
        const base = configuredOrigin || window.location.origin;
        const params = new URLSearchParams({
            next: nextPath.startsWith("/") ? nextPath : "/account",
        });
        if (options?.flow === "recovery") {
            params.set("flow", "recovery");
        }
        return new URL(`/auth/callback?${params.toString()}`, base).toString();
    };

    const persistMarketingIntent = () => {
        localStorage.setItem(PENDING_MARKETING_OPT_IN_KEY, marketingOptIn ? "true" : "false");
    };

    const checkWaitlistAccess = async (candidateEmail: string) => {
        const response = await fetch("/api/waitlist/access", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email: candidateEmail }),
        });

        const payload = (await response.json().catch(() => ({}))) as {
            ok?: boolean;
            error?: string;
            data?: {
                allowed?: boolean;
                status?: string | null;
                message?: string;
            };
        };

        if (!response.ok || !payload.ok || !payload.data) {
            throw new Error(payload.error || "Unable to verify waitlist access right now.");
        }

        return payload.data;
    };

    useEffect(() => {
        if (!isConfigured) {
            return;
        }

        const supabase = getBrowserSupabase();
        let isActive = true;

        const handleSignedInUser = async () => {
            const pendingMarketingOptIn = localStorage.getItem(PENDING_MARKETING_OPT_IN_KEY) === "true";
            await syncSignedInProfile(pendingMarketingOptIn, { source: "auth-page" });
            localStorage.removeItem(PENDING_MARKETING_OPT_IN_KEY);
            if (!isActive) return;
            setIsRedirecting(true);
            router.replace(nextPath);
        };

        void supabase.auth.getUser().then(({ data, error: getUserError }) => {
            if (getUserError || !data.user) {
                return;
            }

            void handleSignedInUser();
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session?.user) {
                void handleSignedInUser();
            }
        });

        return () => {
            isActive = false;
            subscription.unsubscribe();
        };
    }, [isConfigured, nextPath, router]);

    const handleLocalSignIn = (provider: "email" | "google") => {
        if (!email.trim()) {
            setError("Please enter your email for local test mode.");
            return;
        }

        setError(null);
        setMessage(null);
        signInLocally(email, provider, marketingOptIn);
        window.location.href = nextPath;
    };

    const handleEmailSignIn = async (event: React.FormEvent) => {
        event.preventDefault();

        const normalizedEmail = email.trim().toLowerCase() || "hello@alignflow.xyz";

        if (!email.trim() && authMode === "password") {
            setError("Please enter your email.");
            return;
        }

        if (authMode === "password" && !password.trim()) {
            setError("Please enter your password.");
            return;
        }

        try {
            setIsEmailLoading(true);
            setError(null);
            setMessage(null);
            const access = await checkWaitlistAccess(normalizedEmail);
            if (!access.allowed) {
                void trackEvent({
                    eventName: "auth_failed",
                    eventSource: "auth-page",
                    properties: {
                        method: authMode === "password" ? "password" : "magic-link",
                        reason: access.message || "waitlist_access_denied",
                        waitlistStatus: access.status ?? null,
                    },
                });
                setError(access.message || "This email is not approved for sign-in yet.");
                return;
            }

            persistMarketingIntent();
            void trackEvent({
                eventName: "auth_started",
                eventSource: "auth-page",
                properties: {
                    method: authMode === "password" ? "password" : "magic-link",
                    waitlistStatus: access.status ?? null,
                },
            });

            const supabase = getBrowserSupabase();

            if (authMode === "password") {
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email: normalizedEmail,
                    password,
                });

                if (signInError) {
                    void trackEvent({
                        eventName: "auth_failed",
                        eventSource: "auth-page",
                        properties: {
                            method: "password",
                            reason: signInError.message,
                        },
                    });
                    setError(formatAuthError(signInError.message, authMode));
                    return;
                }

                setIsRedirecting(true);
                setMessage("Sign-in successful. Redirecting to your account...");
                return;
            }

            if (isLocalPreviewMode) {
                signInLocally(normalizedEmail, "email", marketingOptIn);
                setIsRedirecting(true);
                setMessage("Local preview sign-in complete. Redirecting to your account...");
                router.replace(nextPath);
                return;
            }

            const { error: signInError } = await supabase.auth.signInWithOtp({
                email: normalizedEmail,
                options: {
                    emailRedirectTo: buildRedirectUrl(),
                    shouldCreateUser: true,
                },
            });

            if (signInError) {
                void trackEvent({
                    eventName: "auth_failed",
                    eventSource: "auth-page",
                    properties: {
                        method: "magic-link",
                        reason: signInError.message,
                    },
                });
                setError(formatAuthError(signInError.message, authMode));
                return;
            }

            setMessage("Your sign-in link has been sent. Please check your email to finish signing in.");
        } catch (authError) {
            const nextError =
                authError instanceof Error
                    ? formatAuthError(authError.message, authMode)
                    : authMode === "password"
                        ? "Unable to sign in with password."
                        : "Unable to start email sign-in.";
            setError(nextError);
        } finally {
            setIsEmailLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        const normalizedEmail = email.trim().toLowerCase();

        if (!normalizedEmail) {
            setError("Enter the invited email address you used for the waitlist before continuing with Google.");
            return;
        }

        try {
            setIsGoogleLoading(true);
            setError(null);
            setMessage(null);
            const access = await checkWaitlistAccess(normalizedEmail);
            if (!access.allowed) {
                void trackEvent({
                    eventName: "auth_failed",
                    eventSource: "auth-page",
                    properties: {
                        method: "google",
                        reason: access.message || "waitlist_access_denied",
                        waitlistStatus: access.status ?? null,
                    },
                });
                setError(access.message || "This email is not approved for sign-in yet.");
                return;
            }

            persistMarketingIntent();
            void trackEvent({
                eventName: "auth_started",
                eventSource: "auth-page",
                properties: {
                    method: "google",
                    waitlistStatus: access.status ?? null,
                },
            });

            const supabase = getBrowserSupabase();
            const { error: oauthError } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: buildRedirectUrl(),
                    queryParams: {
                        prompt: "select_account",
                    },
                },
            });

            if (oauthError) {
                void trackEvent({
                    eventName: "auth_failed",
                    eventSource: "auth-page",
                    properties: {
                        method: "google",
                        reason: oauthError.message,
                    },
                });
                setError(oauthError.message);
            }
        } catch (authError) {
            const nextError = authError instanceof Error ? authError.message : "Unable to start Google sign-in.";
            void trackEvent({
                eventName: "auth_failed",
                eventSource: "auth-page",
                properties: {
                    method: "google",
                    reason: nextError,
                },
            });
            setError(nextError);
        } finally {
            setIsGoogleLoading(false);
        }
    };

    const handlePasswordReset = async () => {
        const normalizedEmail = email.trim().toLowerCase();

        if (!normalizedEmail) {
            setError("Enter your email first so we know where to send the reset link.");
            return;
        }

        try {
            setIsPasswordResetLoading(true);
            setError(null);
            setMessage(null);
            const access = await checkWaitlistAccess(normalizedEmail);
            if (!access.allowed) {
                setError(access.message || "This email is not approved for sign-in yet.");
                return;
            }

            const supabase = getBrowserSupabase();
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
                redirectTo: buildRedirectUrl({ flow: "recovery" }),
            });

            if (resetError) {
                setError(resetError.message);
                return;
            }

            setMessage("Password reset email sent. Open the link in your inbox to choose a new password.");
        } catch (resetError) {
            const nextError = resetError instanceof Error ? resetError.message : "Unable to send reset email.";
            setError(nextError);
        } finally {
            setIsPasswordResetLoading(false);
        }
    };

    const isSubmitting = isEmailLoading || isGoogleLoading || isPasswordResetLoading || isRedirecting;

    return (
        <div className="min-h-screen bg-[#fffcf7] text-[#383831]">
            <EditorialFlowHeader
                brandName={marketingBrand.name}
                secondaryLabel="Sign in"
                secondaryHref="/auth"
                utilityLabel="Exit"
                utilityHref={marketingHomeHref}
            />

            <main className="mx-auto grid w-full max-w-[1340px] grid-cols-1 gap-7 px-7 pb-10 pt-6 md:min-h-[calc(100vh-84px)] md:grid-cols-[minmax(0,1.76fr)_minmax(26rem,1fr)] md:items-center md:gap-8 md:px-8 md:pt-6 lg:gap-[4rem] lg:pb-12">
                <section className="relative flex w-full items-center py-2 pr-0 md:min-h-[calc(100vh-140px)] md:py-5 md:pr-4 lg:pr-6">
                    <div
                        className="pointer-events-none absolute inset-x-[-8%] top-[3%] -z-10 h-[72%] rounded-full opacity-75 blur-3xl"
                        style={{
                            background:
                                "radial-gradient(circle at 30% 30%, rgba(243, 222, 215, 0.48) 0%, rgba(255, 252, 247, 0) 72%)",
                        }}
                    />

                    <div className="w-full max-w-[53rem] space-y-5">
                        <div className="space-y-3">
                            <p className="text-[0.72rem] font-medium uppercase tracking-[0.26em] text-[#8d887f]">
                                Personal Space
                            </p>
                            <h1 className="max-w-[48rem] font-serif text-[2.56rem] font-light leading-[0.94] tracking-[-0.03em] text-[#4a443f] sm:text-[3.5rem] xl:text-[3.84rem]">
                                Welcome back to your space
                            </h1>
                            <p className="max-w-[40rem] text-[0.98rem] font-light leading-[1.72] text-[#6d6760]">
                                Revisit your saved readings, preferences, and room insights in one calm place.
                            </p>
                        </div>

                        <ul className="space-y-2.5 pt-0.5">
                            {benefitItems.map((item) => (
                                <li key={item} className="flex items-start gap-3.5 text-[0.94rem] font-light leading-[1.55] text-[#6d6760]">
                                    <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#eff4e3] text-[#647051]">
                                        <Check className="h-3 w-3" />
                                    </span>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>

                        <div className="overflow-hidden rounded-[1.1rem] pt-2">
                            <Image
                                src="/media/auth/auth-space.webp"
                                alt="Serene minimalist living room with soft linen sofa and olive tree"
                                width={900}
                                height={620}
                                sizes="(max-width: 768px) 92vw, 46vw"
                                className="h-64 w-full object-cover transition-transform duration-1000 hover:scale-[1.03] md:h-[18.5rem] lg:h-[20rem]"
                            />
                        </div>
                    </div>
                </section>

                <section className="flex w-full justify-center md:justify-end md:self-center">
                    <div className="w-full max-w-[28rem] rounded-[2rem] border border-[#babab0]/15 bg-[#fffdfa] px-7 py-7 shadow-[0_40px_80px_-20px_rgba(56,56,49,0.06)] sm:max-w-[29rem] sm:px-8 sm:py-8">
                        <div className="space-y-2">
                            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[#9a9389]">
                                Sign In
                            </p>
                            <h2 className="font-serif text-[1.96rem] leading-tight text-[#49433f]">
                                Enter your {marketingBrand.name} account
                            </h2>
                            <p className="max-w-[24rem] text-[0.92rem] font-light leading-6 text-[#7d766f]">
                                Access your saved reports, account preferences, and next steps.
                            </p>
                        </div>

                        <div className="mt-4.5 space-y-3.5">
                            {!isConfigured && (
                                <div className="rounded-[1rem] bg-[#f3ded7]/50 px-4 py-3 text-[0.76rem] leading-5 text-[#6c544e]">
                                    {authPageContent.localModeNotice}
                                </div>
                            )}

                            {isRedirecting && (
                                <div className="rounded-[1rem] bg-[#eff4e3] px-4 py-3 text-[0.76rem] leading-5 text-[#56604a]">
                                    {authPageContent.redirectNotice}
                                </div>
                            )}

                            {error && (
                                <div className="rounded-[1rem] bg-[#fbe5de] px-4 py-3 text-[0.76rem] leading-5 text-[#7b3b2d]">
                                    {error}
                                </div>
                            )}

                            {message && (
                                <div className="rounded-[1rem] bg-[#eff4e3] px-4 py-3 text-[0.76rem] leading-5 text-[#56604a]">
                                    {message}
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={isConfigured ? handleGoogleSignIn : () => handleLocalSignIn("google")}
                                disabled={isSubmitting}
                                className="inline-flex h-[3rem] w-full items-center justify-center gap-3 rounded-full border border-[#d9d0c6] bg-[#fffdfa] px-6 text-[0.96rem] font-medium text-[#4a443f] transition-colors hover:bg-[#fcf8f2] disabled:opacity-60"
                            >
                                <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                <span>{isGoogleLoading ? "Redirecting..." : "Continue with Google"}</span>
                            </button>

                            <div className="flex items-center gap-4 py-1.5">
                                <div className="h-px flex-1 bg-[#e7e0d6]" />
                                <span className="text-[0.64rem] font-semibold uppercase tracking-[0.22em] text-[#b1a9a0]">
                                    or
                                </span>
                                <div className="h-px flex-1 bg-[#e7e0d6]" />
                            </div>

                            <form onSubmit={handleEmailSignIn} className="space-y-4">
                                <label className="block space-y-2">
                                    <span className="ml-1 block text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[#8e877d]">
                                        Email
                                    </span>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(event) => setEmail(event.target.value)}
                                        placeholder="name@example.com"
                                        className="h-[3rem] w-full rounded-[0.95rem] border-0 bg-[#f7f2ea] px-4 text-[0.96rem] text-[#4a443f] outline-none ring-1 ring-[#ddd4ca]/70 transition-all placeholder:text-[#b9b0a7] focus:bg-white focus:ring-[#bca89f]/55"
                                    />
                                    <span className="ml-1 block text-[0.7rem] leading-5 text-[#978f86]">
                                        Use the same email address that received your waitlist invitation.
                                    </span>
                                </label>

                                {authMode === "password" && (
                                    <label className="block space-y-2">
                                        <span className="ml-1 block text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[#8e877d]">
                                            Password
                                        </span>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(event) => setPassword(event.target.value)}
                                            placeholder="Enter your password"
                                            className="h-[3rem] w-full rounded-[0.95rem] border-0 bg-[#f7f2ea] px-4 text-[0.96rem] text-[#4a443f] outline-none ring-1 ring-[#ddd4ca]/70 transition-all placeholder:text-[#b9b0a7] focus:bg-white focus:ring-[#bca89f]/55"
                                        />
                                    </label>
                                )}

                                <button
                                    type={isConfigured ? "submit" : "button"}
                                    onClick={isConfigured ? undefined : () => handleLocalSignIn("email")}
                                    disabled={isEmailLoading}
                                    className="inline-flex h-[3rem] w-full items-center justify-center rounded-full bg-[#75645d] px-6 text-[0.96rem] font-medium text-[#fff7f3] transition-colors hover:bg-[#695853] disabled:opacity-60"
                                >
                                    {isConfigured
                                        ? isEmailLoading
                                            ? authMode === "password"
                                                ? "Signing in..."
                                                : "Sending sign-in link..."
                                            : authMode === "password"
                                                ? "Sign In with Password"
                                                : "Send Sign-In Link"
                                        : "Sign In"}
                                </button>

                                <div className="space-y-3 pt-1 text-center">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setAuthMode((current) => (current === "magic-link" ? "password" : "magic-link"));
                                            setError(null);
                                            setMessage(null);
                                        }}
                                        className="text-[0.92rem] font-light text-[#7d766f] transition-colors hover:text-[#5d5650]"
                                    >
                                        {authMode === "magic-link" ? "Prefer password sign-in?" : "Prefer a sign-in link instead?"}
                                    </button>

                                    <label className="mx-auto flex max-w-[18rem] items-start gap-2.5 text-left text-[0.72rem] leading-5 text-[#9a9188]">
                                        <input
                                            type="checkbox"
                                            checked={marketingOptIn}
                                            onChange={(event) => setMarketingOptIn(event.target.checked)}
                                            className="mt-0.5 h-3.5 w-3.5 rounded border-[#d5cbc1] text-[#75645d]"
                                        />
                                        <span>{authPageContent.marketingOptIn}</span>
                                    </label>
                                </div>
                            </form>
                        </div>

                        <div className="mt-5 space-y-3.5 border-t border-[#ebe3d8] pt-4.5">
                            {authMode === "password" && (
                                <div className="space-y-2 text-center">
                                    <p className="text-[0.72rem] leading-5 text-[#958d84]">
                                        {authPageContent.passwordHint}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={handlePasswordReset}
                                        disabled={isSubmitting}
                                        className="text-[0.76rem] font-medium text-[#6a5b56] underline-offset-4 transition hover:underline disabled:cursor-not-allowed disabled:opacity-55"
                                    >
                                        Forgot your password?
                                    </button>
                                </div>
                            )}

                            <p className="px-4 text-center text-[0.7rem] italic leading-5 text-[#aaa097]">
                                We only use your account to save reports, purchases, and personal preferences.
                            </p>

                            <div className="flex justify-center gap-4 text-[0.66rem] font-semibold uppercase tracking-[0.2em] text-[#b0a69c]">
                                <Link href={marketingTermsHref} className="transition-colors hover:text-[#7b7168]">
                                    Terms
                                </Link>
                                <span>•</span>
                                <Link href={marketingPrivacyHref} className="transition-colors hover:text-[#7b7168]">
                                    Privacy Policy
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

        </div>
    );
}
