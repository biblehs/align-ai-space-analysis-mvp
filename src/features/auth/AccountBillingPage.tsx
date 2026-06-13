"use client";

import Link from "next/link";
import AppBackLink from "@/components/app-shell/AppBackLink";
import AppPageShell from "@/components/app-shell/AppPageShell";
import AppStatusNotice from "@/components/app-shell/AppStatusNotice";
import { useBillingPortal } from "@/hooks/useBillingPortal";
import { appAccountHref } from "@/lib/navigation";

export default function AccountBillingPage() {
    const { openPortal, loading: isOpeningPortal, error } = useBillingPortal();

    const handleOpenPortal = async () => {
        const portalUrl = await openPortal();
        if (portalUrl) {
            window.location.href = portalUrl;
        }
    };

    return (
        <AppPageShell maxWidth="md">
            <div className="space-y-6 sm:space-y-8">
                <AppBackLink href={appAccountHref} label="Back to Account Center" className="pt-2" />

                <section className="space-y-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
                        Billing
                    </p>
                    <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">
                        Receipts now, subscriptions later
                    </h1>
                    <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                        ALIGN now routes checkout through Creem. This billing page is ready for payment history today
                        and gives us a clean place to plug in subscription management later.
                    </p>
                </section>

                {error && <AppStatusNotice tone="warning">{error}</AppStatusNotice>}

                <section className="rounded-[1.75rem] border border-border bg-card p-6 shadow-sm sm:p-8">
                    <div className="space-y-3">
                        <h2 className="text-xl font-semibold text-foreground">Customer Portal</h2>
                        <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                            Open the Creem customer portal to view payment details. Subscription controls can plug into
                            this same entry point once recurring plans are enabled.
                        </p>
                    </div>

                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                        <button
                            type="button"
                            onClick={handleOpenPortal}
                            disabled={isOpeningPortal}
                            className="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-5 text-sm font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-60"
                        >
                            {isOpeningPortal ? "Opening billing..." : "Open Billing Portal"}
                        </button>
                        <Link
                            href={appAccountHref}
                            className="inline-flex h-11 items-center justify-center rounded-full border border-border bg-background px-5 text-sm font-bold text-foreground transition-colors hover:bg-secondary/40"
                        >
                            Return to Account
                        </Link>
                    </div>
                </section>
            </div>
        </AppPageShell>
    );
}
