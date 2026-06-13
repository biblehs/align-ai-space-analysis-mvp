"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { trackEvent } from "@/lib/analytics-client";
import { isValidWaitlistEmail, normalizeWaitlistEmail } from "@/lib/waitlist";
import { appAuthHref } from "@/lib/navigation";

type HeroWaitlistCTAProps = {
    onOpenWaitlist: (email: string, source: string) => void;
    variant?: "default" | "editorial";
};

export function HeroWaitlistCTA({ onOpenWaitlist, variant = "default" }: HeroWaitlistCTAProps) {
    const [email, setEmail] = useState("");
    const [error, setError] = useState<string | null>(null);
    const hasTrackedStart = useRef(false);
    const hasEmail = email.trim().length > 0;
    const isEditorial = variant === "editorial";

    const handleOpen = async (event: FormEvent) => {
        event.preventDefault();

        const normalized = normalizeWaitlistEmail(email);
        if (!isValidWaitlistEmail(normalized)) {
            setError("Please enter a valid email address.");
            return;
        }

        setError(null);
        onOpenWaitlist(normalized, "landing_hero");
    };

    return (
        <div className={isEditorial ? "w-full max-w-[38rem]" : "w-full max-w-[34.75rem]"}>
            <form
                onSubmit={handleOpen}
                className={
                    isEditorial
                        ? "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center"
                        : "flex flex-col gap-3 sm:flex-row sm:items-center"
                }
            >
                <div className="flex-1">
                    <label htmlFor="landing-waitlist-email" className="sr-only">
                        Email
                    </label>
                    <input
                        id="landing-waitlist-email"
                        type="email"
                        value={email}
                        aria-invalid={error ? "true" : "false"}
                        onChange={(event) => {
                            setEmail(event.target.value);
                            if (error) {
                                setError(null);
                            }
                        }}
                        onFocus={() => {
                            if (!hasTrackedStart.current) {
                                hasTrackedStart.current = true;
                                void trackEvent({
                                    eventName: "hero_email_started",
                                    eventSource: "waitlist",
                                    properties: {
                                        source: "landing_hero",
                                    },
                                });
                            }
                        }}
                        placeholder="Enter your email to get your invite"
                        autoComplete="email"
                        className={`h-[54px] w-full rounded-full border px-5.5 text-[0.9rem] text-[#38312c] outline-none transition ${
                            isEditorial
                                ? hasEmail
                                    ? "border-[#cfbcae] bg-[#f8f1e9]/95 shadow-[0_16px_36px_rgba(89,73,63,0.08)]"
                                    : "border-[#cec2b64d] bg-[#fffdf9]/78 shadow-[0_12px_30px_rgba(65,53,45,0.05)]"
                                : hasEmail
                                  ? "border-[#ccb8a9] bg-[#f5ede5] shadow-[0_14px_40px_rgba(106,91,86,0.10)]"
                                  : "border-[#b8a79a66] bg-[#fffdfa]/86 shadow-[0_14px_40px_rgba(56,49,44,0.08)]"
                        } placeholder:text-[#8b8075] focus:border-[#8d7060] focus:bg-[#f7efe8] focus-visible:ring-2 focus-visible:ring-[#8d7060] focus-visible:ring-offset-2`}
                    />
                </div>
                <button
                    type="submit"
                    className={
                        isEditorial
                            ? "inline-flex h-[54px] items-center justify-center rounded-full border border-[#cab6a8] bg-[linear-gradient(180deg,rgba(255,251,245,0.92)_0%,rgba(244,233,223,0.92)_100%)] px-7 text-[0.66rem] font-medium uppercase tracking-[0.21em] text-[#4a4039] shadow-[0_14px_28px_rgba(89,73,63,0.08)] transition-[transform,box-shadow,background-color,border-color] duration-200 hover:-translate-y-[1px] hover:border-[#b59d8b] hover:bg-[linear-gradient(180deg,rgba(255,252,247,0.98)_0%,rgba(245,236,227,0.96)_100%)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8d7060] focus-visible:ring-offset-2"
                            : "inline-flex h-[54px] items-center justify-center rounded-full bg-[#6a5b56] px-6.5 text-[0.68rem] font-semibold uppercase tracking-[0.19em] text-[#fff6f3] transition-transform hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8d7060] focus-visible:ring-offset-2"
                    }
                >
                    Join early access
                </button>
            </form>

            <div
                className={
                    isEditorial
                        ? "mt-4 flex flex-col gap-3 text-center sm:flex-row sm:items-center sm:justify-center sm:gap-6"
                        : "mt-4 flex flex-col gap-3 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left"
                }
            >
                <p className={`${isEditorial ? "text-[0.64rem] font-medium tracking-[0.2em]" : "text-[0.68rem] font-semibold tracking-[0.18em]"} uppercase text-[#9b8d81]`}>
                    We invite new users in small waves.
                </p>
                <Link
                    href={appAuthHref}
                    className={`${isEditorial ? "text-[0.76rem]" : "text-[0.78rem]"} text-[#574f48] underline underline-offset-4 transition-colors hover:text-[#38312c]`}
                >
                    Already invited? Sign in
                </Link>
            </div>

            {error ? (
                <p role="alert" className="mt-3 text-[0.82rem] text-[#8d5d52]">
                    {error}
                </p>
            ) : null}
        </div>
    );
}
