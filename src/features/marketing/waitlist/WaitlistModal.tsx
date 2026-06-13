"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Bed, Check, Circle, Focus, Leaf, Sparkles, X } from "lucide-react";
import { getBrowserTrackingContext, trackEvent } from "@/lib/analytics-client";
import {
    waitlistFeedbackOptions,
    waitlistFirstRoomOptions,
    waitlistPrimaryGoalOptions,
} from "@/lib/waitlist";

type WaitlistModalProps = {
    isOpen: boolean;
    initialEmail?: string;
    source?: string;
    onClose: () => void;
};

type StepKey = "details" | "success";

type WaitlistFormState = {
    email: string;
    primaryGoal: string;
    firstRoom: string;
    feedbackWillingness: string;
    openTextNote: string;
};

const serifFont = { fontFamily: "var(--font-editorial-serif), serif" };
const bodyFont = { fontFamily: "var(--font-editorial-body), sans-serif" };

const baseFormState: WaitlistFormState = {
    email: "",
    primaryGoal: "",
    firstRoom: "",
    feedbackWillingness: "",
    openTextNote: "",
};

function SuccessSanctuaryRipple({ reducedMotion }: { reducedMotion: boolean }) {
    const breatheTransition = reducedMotion
        ? { duration: 0 }
        : {
            duration: 10,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "mirror" as const,
            ease: [0.25, 1, 0.5, 1] as const,
        };

    const driftTransition = reducedMotion
        ? { duration: 0 }
        : {
            duration: 14,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "mirror" as const,
            ease: [0.22, 1, 0.36, 1] as const,
        };

    return (
        <div className="relative h-[11rem] w-[11rem] sm:h-[12.5rem] sm:w-[12.5rem]">
            <motion.svg viewBox="0 0 220 220" className="absolute inset-0 h-full w-full" aria-hidden="true">
                <defs>
                    <radialGradient id="align-waitlist-core" cx="50%" cy="50%" r="56%">
                        <stop offset="0%" stopColor="#f1d8c6" stopOpacity="0.95" />
                        <stop offset="42%" stopColor="#dfb99d" stopOpacity="0.72" />
                        <stop offset="78%" stopColor="#d7dbc2" stopOpacity="0.32" />
                        <stop offset="100%" stopColor="#fffdfa" stopOpacity="0" />
                    </radialGradient>
                    <linearGradient id="align-waitlist-stroke" x1="40" y1="54" x2="180" y2="170" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#d6b399" stopOpacity="0.95" />
                        <stop offset="52%" stopColor="#b99583" stopOpacity="0.78" />
                        <stop offset="100%" stopColor="#b9c5a4" stopOpacity="0.85" />
                    </linearGradient>
                    <filter id="align-waitlist-soft-glow" x="-30%" y="-30%" width="160%" height="160%">
                        <feGaussianBlur stdDeviation="10" />
                    </filter>
                </defs>

                <motion.g
                    initial={{ opacity: 0.88, scale: 1 }}
                    animate={reducedMotion ? { opacity: 0.88, scale: 1 } : { opacity: 1, scale: 1.05 }}
                    transition={breatheTransition}
                    style={{ transformOrigin: "110px 110px" }}
                >
                    <ellipse cx="110" cy="108" rx="78" ry="60" fill="url(#align-waitlist-core)" filter="url(#align-waitlist-soft-glow)" />
                </motion.g>

                <motion.ellipse
                    cx="108"
                    cy="108"
                    rx="82"
                    ry="58"
                    fill="none"
                    stroke="url(#align-waitlist-stroke)"
                    strokeWidth="1.2"
                    initial={{ opacity: 0.72, scale: 1 }}
                    animate={reducedMotion ? { opacity: 0.72, scale: 1 } : { opacity: 0.94, scale: 1.06 }}
                    transition={breatheTransition}
                    style={{ transformOrigin: "108px 108px" }}
                />

                <motion.path
                    d="M62 132c15-22 30-33 48-33 20 0 38 11 52 33"
                    fill="none"
                    stroke="#8b6f62"
                    strokeLinecap="round"
                    strokeWidth="1.45"
                    initial={{ opacity: 0.8, y: 0 }}
                    animate={reducedMotion ? { opacity: 0.8, y: 0 } : { opacity: 1, y: -2.5 }}
                    transition={driftTransition}
                />

                <motion.path
                    d="M82 90c8-10 17-15 28-15 13 0 23 6 31 18"
                    fill="none"
                    stroke="#d4b59c"
                    strokeLinecap="round"
                    strokeWidth="1.2"
                    initial={{ opacity: 0.7, y: 0 }}
                    animate={reducedMotion ? { opacity: 0.7, y: 0 } : { opacity: 0.95, y: 1.8 }}
                    transition={{
                        ...driftTransition,
                        delay: reducedMotion ? 0 : 0.9,
                    }}
                />

                <motion.circle
                    cx="154"
                    cy="86"
                    r="8"
                    fill="#d7ddbf"
                    initial={{ opacity: 0.68, x: 0, y: 0 }}
                    animate={reducedMotion ? { opacity: 0.68, x: 0, y: 0 } : { opacity: 0.9, x: 4, y: -3 }}
                    transition={{
                        ...driftTransition,
                        delay: reducedMotion ? 0 : 0.5,
                    }}
                />

                <motion.circle
                    cx="74"
                    cy="122"
                    r="6"
                    fill="#e7cbb5"
                    initial={{ opacity: 0.65, x: 0, y: 0 }}
                    animate={reducedMotion ? { opacity: 0.65, x: 0, y: 0 } : { opacity: 0.88, x: -3, y: 3 }}
                    transition={{
                        ...driftTransition,
                        delay: reducedMotion ? 0 : 1.1,
                    }}
                />
            </motion.svg>
        </div>
    );
}

export function WaitlistModal({ isOpen, initialEmail = "", source = "landing_unknown", onClose }: WaitlistModalProps) {
    const [step, setStep] = useState<StepKey>("details");
    const [form, setForm] = useState<WaitlistFormState>(baseFormState);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const hasTrackedOpen = useRef(false);
    const dialogRef = useRef<HTMLDivElement | null>(null);
    const closeButtonRef = useRef<HTMLButtonElement | null>(null);
    const reducedMotion = useReducedMotion();
    const titleId = useId();
    const descriptionId = useId();

    useEffect(() => {
        if (!isOpen) {
            setStep("details");
            setForm({ ...baseFormState, email: initialEmail });
            setError(null);
            setIsSubmitting(false);
            hasTrackedOpen.current = false;
            return;
        }

        setForm({
            ...baseFormState,
            email: initialEmail,
        });
    }, [initialEmail, isOpen]);

    useEffect(() => {
        if (!isOpen || hasTrackedOpen.current) {
            return;
        }

        hasTrackedOpen.current = true;
        void trackEvent({
            eventName: "waitlist_modal_opened",
            eventSource: "waitlist",
            properties: {
                source,
            },
        });
    }, [isOpen, source]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const previousOverflow = document.body.style.overflow;
        const previousActiveElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        document.body.style.overflow = "hidden";
        closeButtonRef.current?.focus();

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
                return;
            }

            if (event.key !== "Tab" || !dialogRef.current) {
                return;
            }

            const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
                'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
            );

            if (focusable.length === 0) {
                event.preventDefault();
                return;
            }

            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", handleKeyDown);
            previousActiveElement?.focus();
        };
    }, [isOpen, onClose]);

    const goalIconMap = useMemo(
        () => ({
            sleep: Bed,
            focus: Focus,
            calm: Leaf,
            emotional_reset: Sparkles,
        }),
        [],
    );

    const handleSubmit = async () => {
        setError(null);

        if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim().toLowerCase())) {
            setError("Please enter a valid email address.");
            return;
        }

        if (!form.firstRoom) {
            setError("Choose the space you are most curious about.");
            return;
        }

        if (!form.primaryGoal) {
            setError("Choose your primary wellness goal.");
            return;
        }

        if (!form.feedbackWillingness) {
            setError("Choose whether you would be open to sharing feedback.");
            return;
        }

        void trackEvent({
            eventName: "waitlist_step_completed",
            eventSource: "waitlist",
            properties: {
                source,
                stepName: "details",
                primaryGoal: form.primaryGoal || null,
                firstRoom: form.firstRoom || null,
                feedbackWillingness: form.feedbackWillingness || null,
            },
        });

        setIsSubmitting(true);

        const trackingContext = getBrowserTrackingContext();

        try {
            const response = await fetch("/api/waitlist", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: form.email,
                    primary_goal: form.primaryGoal,
                    first_room: form.firstRoom,
                    feedback_willingness: form.feedbackWillingness,
                    open_text_note: form.openTextNote,
                    source,
                    session_id: trackingContext.sessionId,
                    page_path: trackingContext.landingPath,
                    referrer: trackingContext.referrer,
                    landing_path: trackingContext.landingPath,
                    utm_source: trackingContext.utmSource,
                    utm_medium: trackingContext.utmMedium,
                    utm_campaign: trackingContext.utmCampaign,
                }),
            });

            const payload = await response.json().catch(() => ({})) as { ok?: boolean; error?: string };

            if (!response.ok || !payload.ok) {
                throw new Error(payload.error || "Unable to join the waitlist right now.");
            }

            void trackEvent({
                eventName: "waitlist_submit_success",
                eventSource: "waitlist",
                properties: {
                    source,
                    primaryGoal: form.primaryGoal,
                    firstRoom: form.firstRoom,
                    feedbackWillingness: form.feedbackWillingness,
                },
            });

            setStep("success");
        } catch (submitError) {
            const message = submitError instanceof Error ? submitError.message : "Unable to join the waitlist right now.";
            setError(message);

            void trackEvent({
                eventName: "waitlist_submit_error",
                eventSource: "waitlist",
                properties: {
                    source,
                    message,
                },
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[80] flex items-end justify-center bg-[#22180f]/38 px-0 backdrop-blur-md sm:items-center sm:px-4"
                >
                    <button type="button" aria-label="Close waitlist modal" className="absolute inset-0" onClick={onClose} />

                    <motion.div
                        initial={{ opacity: 0, y: "8%", scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: "8%", scale: 0.98 }}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        ref={dialogRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={titleId}
                        aria-describedby={descriptionId}
                        className="relative z-10 flex w-full max-w-[33rem] flex-col overflow-hidden rounded-[1rem] border border-[#e9e1d7] bg-[#fffdfa] shadow-[0_24px_72px_rgba(47,34,25,0.14)]"
                    >
                        <div className="flex items-start justify-end px-6 pb-0 pt-4 sm:px-6 sm:pt-4">
                            <button
                                ref={closeButtonRef}
                                type="button"
                                onClick={onClose}
                                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#e5ddd3] bg-[#fffaf4] text-[#756960] transition-colors hover:border-[#d4c8bb] hover:bg-[#f6ede3] hover:text-[#38312c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8d7060] focus-visible:ring-offset-2"
                                aria-label="Close waitlist dialog"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="px-6 pb-4 pt-1 sm:px-6 sm:pb-4">
                            {step === "details" ? (
                                <div>
                                    <header>
                                        <h2 id={titleId} className="max-w-[21rem] text-[1.35rem] leading-[1.16] tracking-[-0.01em] text-[#6a5b56] sm:text-[1.45rem]" style={serifFont}>
                                            Tell us about the room you want help with.
                                        </h2>
                                        <p id={descriptionId} className="mt-3 text-[0.78rem] leading-[1.55] text-[#9a8f86]" style={bodyFont}>
                                            This takes less than a minute and helps us send more relevant early invites.
                                        </p>
                                    </header>

                                    <section className="mt-6">
                                        <label className="block text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-[#7f756e]" style={bodyFont}>
                                            What space are you most curious about?
                                        </label>
                                        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                                            {waitlistFirstRoomOptions.map((option) => {
                                                const isSelected = form.firstRoom === option.value;
                                                return (
                                                    <button
                                                        key={option.value}
                                                        type="button"
                                                        onClick={() => setForm((current) => ({ ...current, firstRoom: option.value }))}
                                                        className={`flex min-h-[2.75rem] items-center justify-center rounded-[0.8rem] border px-3 py-2 text-[0.78rem] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8d7060] focus-visible:ring-offset-2 ${
                                                            isSelected
                                                                ? "border-[#dbe3c7] bg-[#edf2dd] text-[#5f6853]"
                                                                : "border-[#ebe3d9] bg-[#fffdfa] text-[#5c534d] hover:bg-[#f8f3eb]"
                                                        }`}
                                                        style={bodyFont}
                                                    >
                                                        <span className="whitespace-nowrap text-center">
                                                            {option.label === "Living room" ? "Living Area" : option.label}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </section>

                                    <section className="mt-6">
                                        <label className="block text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-[#7f756e]" style={bodyFont}>
                                            What is your primary wellness goal?
                                        </label>
                                        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                                            {waitlistPrimaryGoalOptions.map((option) => {
                                                const isSelected = form.primaryGoal === option.value;
                                                const Icon = goalIconMap[option.value];
                                                return (
                                                    <button
                                                        key={option.value}
                                                        type="button"
                                                        onClick={() => setForm((current) => ({ ...current, primaryGoal: option.value }))}
                                                        className={`flex min-h-[2.75rem] items-center justify-center gap-1.5 rounded-[0.8rem] border px-3 py-2.5 text-[0.78rem] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8d7060] focus-visible:ring-offset-2 ${
                                                            isSelected
                                                                ? "border-[#6a5b56] bg-[#7c6a62] text-[#fff6f3] shadow-[0_10px_24px_rgba(106,91,86,0.14)]"
                                                                : "border-[#ece3d8] bg-[#fffdfa] text-[#4d453f] hover:bg-[#f8f3eb]"
                                                        }`}
                                                        style={bodyFont}
                                                    >
                                                        <Icon className="h-[0.82rem] w-[0.82rem]" />
                                                        <span>{option.label === "Better sleep" ? "Rest" : option.label === "More focus" ? "Focus" : option.label === "Emotional reset" ? "Reset" : option.label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </section>

                                    <section className="mt-6">
                                        <label className="block text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-[#7f756e]" style={bodyFont}>
                                            Would you be open to sharing a short reflection after your first Align reading?
                                        </label>
                                        <p className="mt-2 text-[0.76rem] leading-[1.5] text-[#9a8f86]" style={bodyFont}>
                                            This helps us decide who to invite first and what kind of feedback to ask for.
                                        </p>
                                        <div className="mt-3 space-y-2">
                                            {waitlistFeedbackOptions.map((option) => {
                                                const isSelected = form.feedbackWillingness === option.value;
                                                return (
                                                    <button
                                                        key={option.value}
                                                        type="button"
                                                        onClick={() => setForm((current) => ({ ...current, feedbackWillingness: option.value }))}
                                                        className={`flex min-h-[2.9rem] w-full items-center gap-3 rounded-[0.8rem] border px-3.5 py-2.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8d7060] focus-visible:ring-offset-2 ${
                                                            isSelected
                                                                ? "border-[#e3dacd] bg-[#f7f2e8] text-[#4a423d]"
                                                                : "border-[#ece3d8] bg-[#fffdfa] text-[#5d544e] hover:bg-[#faf6ef]"
                                                        }`}
                                                    >
                                                        <span className="flex h-5 w-5 items-center justify-center">
                                                            {isSelected ? (
                                                                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-[#938278]">
                                                                    <span className="h-2.5 w-2.5 rounded-full bg-[#7c6a62]" />
                                                                </span>
                                                            ) : (
                                                                <Circle className="h-4.5 w-4.5 text-[#b1a399]" />
                                                            )}
                                                        </span>
                                                        <span className="text-[0.78rem]" style={bodyFont}>
                                                            {option.value === "yes"
                                                                ? "Yes, I’d love to"
                                                                : option.value === "maybe"
                                                                    ? "Maybe"
                                                                    : "Just exploring for now"}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </section>
                                </div>
                            ) : null}

                            {step === "success" ? (
                                <div className="grid gap-6 px-1 py-3 sm:grid-cols-[minmax(0,1fr)_10rem] sm:items-center sm:gap-3">
                                    <div>
                                        <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#e9d8ca] text-[#6a5b56]">
                                            <Check className="h-4 w-4" />
                                        </div>
                                        <p className="mt-5 text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-[#9b8d81]" style={bodyFont}>
                                            You’re on the list
                                        </p>
                                        <h2 className="mt-3 max-w-[19rem] text-[1.4rem] leading-[1.16] text-[#6a5b56]" style={serifFont}>
                                            You’re on the early access list.
                                        </h2>
                                        <p className="mt-3 max-w-[21rem] text-[0.8rem] leading-[1.6] text-[#625850]" style={bodyFont}>
                                            Check your inbox for confirmation. When your invite is ready, we’ll send you a direct link to try the reading flow.
                                        </p>
                                    </div>

                                    <div className="pointer-events-none mx-auto hidden sm:flex sm:justify-end">
                                        <SuccessSanctuaryRipple reducedMotion={Boolean(reducedMotion)} />
                                    </div>
                                </div>
                            ) : null}

                            {error ? (
                                <p role="alert" className="mt-6 text-[0.9rem] text-[#8d5d52]" style={bodyFont}>
                                    {error}
                                </p>
                            ) : null}
                        </div>

                        <div className="bg-[#fffdfa] px-6 pb-4 pt-1 sm:px-6 sm:pb-4">
                            {step === "success" ? (
                                <div className="flex flex-col items-center">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="inline-flex h-[48px] w-full items-center justify-center rounded-full bg-[#75635d] px-6 text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-[#fff6f3] transition-transform hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8d7060] focus-visible:ring-offset-2"
                                    >
                                        Back to site
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center">
                                    <button
                                        type="button"
                                        onClick={handleSubmit}
                                        disabled={isSubmitting}
                                        className="inline-flex h-[48px] w-full items-center justify-center rounded-full bg-[#75635d] px-6 text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-[#fff6f3] transition-transform hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8d7060] focus-visible:ring-offset-2 disabled:opacity-60"
                                    >
                                        {isSubmitting ? "Saving your spot..." : "Join early access"}
                                    </button>
                                    <p className="mt-4 text-center text-[0.58rem] font-medium uppercase tracking-[0.16em] text-[#b4a89c]" style={bodyFont}>
                                        By joining, you agree to our mindful data policy.
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            ) : null}
        </AnimatePresence>
    );
}
