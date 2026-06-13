"use client";

import { usePathname } from "next/navigation";
import { CookieBanner } from "@/components/layout/CookieBanner";
import { V2RouteShell } from "@/features/app-ui/v2/shared/V2RouteShell";
import { PublicSiteFooter } from "@/features/marketing/v2/PublicSiteFooter";
import { PublicSiteHeader } from "@/features/marketing/v2/PublicSiteHeader";
import {
    marketingAboutHref,
    marketingPrivacyHref,
    marketingTermsHref,
} from "@/lib/navigation";
import { publicSiteNavItems } from "@/features/marketing/v2/PublicSiteHeader";
const bodyFont = { fontFamily: "var(--font-editorial-body), sans-serif" } as const;

export function PublicSiteShell({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const pathname = usePathname();
    const activeHref =
        pathname === marketingAboutHref
            ? marketingAboutHref
            : pathname === marketingPrivacyHref || pathname === marketingTermsHref
                ? undefined
                : undefined;

    return (
        <V2RouteShell>
            <div
                className="min-h-screen bg-[linear-gradient(180deg,#fffdfa_0%,#fffcf7_28%,#fffcf7_100%)] text-[#383831]"
                style={bodyFont}
            >
                <PublicSiteHeader activeHref={activeHref} navItems={publicSiteNavItems} />

                <main className="flex-1 pt-[68px]">{children}</main>

                <PublicSiteFooter />

                <CookieBanner />
            </div>
        </V2RouteShell>
    );
}
