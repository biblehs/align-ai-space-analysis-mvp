"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import { PENDING_MARKETING_OPT_IN_KEY, syncSignedInProfile } from "@/lib/auth-client";
import { logger } from "@/lib/logger";
import { normalizeInternalPath } from "@/lib/routing";

function readHashParams() {
    if (typeof window === "undefined") {
        return new URLSearchParams();
    }

    const hash = window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : window.location.hash;

    return new URLSearchParams(hash);
}

export default function AuthCallbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [mode, setMode] = useState<"loading" | "signin" | "recovery">("loading");
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isSavingPassword, setIsSavingPassword] = useState(false);
    const nextPath = normalizeInternalPath(searchParams?.get("next"), "/account");

    const checkWaitlistAccess = async (email: string) => {
        const response = await fetch("/api/waitlist/access", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email }),
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
        let isActive = true;

        const finishAuth = async () => {
            try {
                const supabase = getBrowserSupabase();
                const code = searchParams?.get("code");
                const tokenHash = searchParams?.get("token_hash");
                const otpType = searchParams?.get("type");
                const explicitFlow = searchParams?.get("flow");
                const hashParams = readHashParams();
                const accessToken = hashParams.get("access_token");
                const refreshToken = hashParams.get("refresh_token");
                const hashNext = hashParams.get("next");
                const hashType = hashParams.get("type");
                const resolvedNextPath = normalizeInternalPath(hashNext, nextPath);
                const isRecoveryFlow = explicitFlow === "recovery" || otpType === "recovery" || hashType === "recovery";

                if (code) {
                    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
                    if (exchangeError) {
                        throw exchangeError;
                    }
                } else if (tokenHash && otpType) {
                    const { error: verifyError } = await supabase.auth.verifyOtp({
                        token_hash: tokenHash,
                        type: otpType as "email" | "signup" | "invite" | "recovery" | "email_change",
                    });

                    if (verifyError) {
                        throw verifyError;
                    }
                } else if (accessToken && refreshToken) {
                    const { error: sessionError } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken,
                    });

                    if (sessionError) {
                        throw sessionError;
                    }
                }

                if (isRecoveryFlow) {
                    if (isActive) {
                        setMode("recovery");
                        setMessage("Choose a new password for your ALIGN account.");
                    }
                    return;
                }

                const { data: userData, error: userError } = await supabase.auth.getUser();
                if (userError) {
                    throw userError;
                }

                if (!userData.user) {
                    throw new Error("Sign-in finished but no active Supabase session was found.");
                }

                const access = await checkWaitlistAccess(userData.user.email?.trim().toLowerCase() ?? "");
                if (!access.allowed) {
                    await supabase.auth.signOut();
                    localStorage.removeItem(PENDING_MARKETING_OPT_IN_KEY);
                    if (isActive) {
                        setMode("signin");
                        setError(access.message || "This email is not approved for sign-in yet.");
                    }
                    return;
                }

                const marketingOptIn = localStorage.getItem(PENDING_MARKETING_OPT_IN_KEY) === "true";
                const synced = await syncSignedInProfile(marketingOptIn, { source: "auth-callback" });
                localStorage.removeItem(PENDING_MARKETING_OPT_IN_KEY);

                logger.info("Auth callback completed", {
                    provider: userData.user.app_metadata?.provider,
                    syncedProfile: synced,
                    waitlistStatus: access.status ?? null,
                });

                if (isActive) {
                    setMode("signin");
                    router.replace(resolvedNextPath);
                }
            } catch (callbackError) {
                if (!isActive) return;
                const message = callbackError instanceof Error ? callbackError.message : "Unable to complete sign-in.";
                logger.error("Auth callback failed", callbackError);
                setError(message);
            }
        };

        void finishAuth();

        return () => {
            isActive = false;
        };
    }, [nextPath, router, searchParams]);

    const handlePasswordSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (password.length < 8) {
            setError("Use at least 8 characters for your new password.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Your password confirmation does not match.");
            return;
        }

        try {
            setIsSavingPassword(true);
            setError(null);
            setMessage(null);

            const supabase = getBrowserSupabase();
            const { error: updateError } = await supabase.auth.updateUser({ password });

            if (updateError) {
                throw updateError;
            }

            setMessage("Password updated. Redirecting you back to your account...");
            window.setTimeout(() => {
                router.replace(nextPath);
            }, 900);
        } catch (updateError) {
            const nextError = updateError instanceof Error ? updateError.message : "Unable to update password.";
            setError(nextError);
        } finally {
            setIsSavingPassword(false);
        }
    };

    return (
        <div className="container mx-auto max-w-2xl px-4 py-24 text-center">
            <div className="mx-auto max-w-lg rounded-[2.5rem] border border-border bg-card p-8 shadow-sm">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
                    <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
                    {mode === "recovery" ? "Set a new password" : "Finishing sign-in"}
                </h1>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {mode === "recovery"
                        ? "Your reset link is confirmed. Save a new password to finish restoring access."
                        : "We&rsquo;re securing your account and syncing your profile preferences."}
                </p>

                {mode === "recovery" && (
                    <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-4 text-left">
                        <label className="block">
                            <span className="mb-2 block text-sm font-medium text-foreground">New password</span>
                            <input
                                type="password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                autoComplete="new-password"
                                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
                                placeholder="At least 8 characters"
                            />
                        </label>
                        <label className="block">
                            <span className="mb-2 block text-sm font-medium text-foreground">Confirm password</span>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(event) => setConfirmPassword(event.target.value)}
                                autoComplete="new-password"
                                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
                                placeholder="Repeat your new password"
                            />
                        </label>
                        <button
                            type="submit"
                            disabled={isSavingPassword}
                            className="inline-flex w-full items-center justify-center rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSavingPassword ? "Saving password..." : "Save new password"}
                        </button>
                    </form>
                )}

                {message && (
                    <div className="mt-6 rounded-[1.5rem] border border-primary/20 bg-primary/5 p-4 text-left text-sm text-foreground">
                        {message}
                    </div>
                )}

                {error && (
                    <div className="mt-6 rounded-[1.5rem] border border-insight-brick/20 bg-surface-brick p-4 text-left text-sm text-foreground">
                        {error}
                    </div>
                )}

                <div className="mt-6">
                    <Link
                        href="/auth"
                        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to sign in
                    </Link>
                </div>
            </div>
        </div>
    );
}
