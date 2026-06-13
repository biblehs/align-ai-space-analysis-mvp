"use client";

import { X } from "lucide-react";

type SnapshotRegistrationPromptProps = {
    isOpen: boolean;
    isClosing: boolean;
    onClose: () => void;
    onContinue: () => void;
    eyebrow?: string;
    title?: string;
    description?: string;
    caution?: string;
    continueLabel?: string;
    closeLabel?: string;
};

export function SnapshotRegistrationPrompt({
    isOpen,
    isClosing,
    onClose,
    onContinue,
    eyebrow = "Save Your Reading",
    title = "Your free snapshot is ready.",
    description = "Create a free account to save this result, keep future perks tied to your space, and make later updates traceable to your account. You can still continue without registering.",
    caution = "If you close this card and continue without registering, this result can stay visible for the current session only. It will not be saved, tracked for future optimization, or preserved with later benefits.",
    continueLabel = "Create Free Account",
    closeLabel = "Continue Without Saving",
}: SnapshotRegistrationPromptProps) {
    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm">
            <div className="relative w-full max-w-md rounded-[2rem] border border-border bg-background p-6 shadow-[0_30px_120px_rgba(15,23,42,0.35)] sm:p-7">
                <button
                    type="button"
                    onClick={onClose}
                    disabled={isClosing}
                    className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:text-foreground disabled:opacity-60"
                    aria-label="Close sign-up prompt"
                >
                    <X className="h-4 w-4" />
                </button>

                <div className="space-y-4 pr-10">
                    <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary">{eyebrow}</p>
                    <h2 className="font-heading text-[1.9rem] font-semibold leading-tight text-foreground">
                        {title}
                    </h2>
                    <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                        {description}
                    </p>
                    <p className="rounded-[1.25rem] border border-border/80 bg-secondary/35 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
                        {caution}
                    </p>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <button
                        type="button"
                        onClick={onContinue}
                        className="inline-flex h-11 flex-1 items-center justify-center rounded-full bg-foreground px-5 text-sm font-bold text-background transition-opacity hover:opacity-90"
                    >
                        {continueLabel}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isClosing}
                        className="inline-flex h-11 flex-1 items-center justify-center rounded-full border border-border bg-background px-5 text-sm font-bold text-foreground transition-colors hover:bg-secondary/40 disabled:opacity-60"
                    >
                        {isClosing ? "Closing..." : closeLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
