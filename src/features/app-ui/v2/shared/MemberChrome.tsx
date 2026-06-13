"use client";

import Link from "next/link";
import {
    appAccountHref,
    appUploadHref,
    marketingHomeHref,
    marketingPrivacyHref,
    marketingTermsHref,
} from "@/lib/navigation";
import { EditorialFlowFooter, EditorialFlowHeader, LogoMark } from "@/features/app-ui/v2/shared/EditorialFlowChrome";

const serifFont = { fontFamily: "var(--font-editorial-serif), serif" } as const;
const bodyFont = { fontFamily: "var(--font-editorial-body), sans-serif" } as const;

type MemberWorkspaceHeaderProps = {
    active?: "analysis" | "readings" | "account" | "billing";
    onSignOut?: () => void | Promise<void>;
    brandName?: string;
};

type MemberWorkspaceFooterProps = {
    brandName?: string;
    supportEmail?: string;
};

type MemberImmersiveHeaderProps = React.ComponentProps<typeof EditorialFlowHeader>;
type MemberImmersiveFooterProps = React.ComponentProps<typeof EditorialFlowFooter>;

const workspaceNav = [
    { key: "analysis", label: "Start Analysis", href: appUploadHref },
    { key: "readings", label: "My Readings", href: `${appAccountHref}#reading-history` },
    { key: "account", label: "Account", href: appAccountHref },
] as const;

export function MemberWorkspaceHeader({
    active = "account",
    onSignOut,
    brandName = "Align",
}: MemberWorkspaceHeaderProps) {
    return (
        <header className="sticky top-0 z-50 border-b border-[#babab0]/8 bg-[linear-gradient(180deg,rgba(248,244,236,0.98)_0%,rgba(252,249,243,0.92)_72%,rgba(255,252,247,0.82)_100%)]">
            <div className="mx-auto flex w-full max-w-[1240px] items-center justify-between gap-6 px-8 py-4 md:px-10">
                <Link
                    href={marketingHomeHref}
                    className="inline-flex items-center gap-[10px] text-[1.08rem] italic tracking-tight text-[#383831e6]"
                    style={serifFont}
                >
                    <LogoMark />
                    <span>{brandName}</span>
                </Link>

                <nav className="hidden items-center gap-8 md:flex">
                    {workspaceNav.map((item) => {
                        const isActive = item.key === active;
                        return (
                            <Link
                                key={item.key}
                                href={item.href}
                                className={
                                    isActive
                                        ? "border-b border-[#6a5b56]/40 pb-1 text-[0.92rem] text-[#6a5b56]"
                                        : "text-[0.92rem] text-[#6a5b56]/60 transition-colors hover:text-[#6a5b56]"
                                }
                                style={serifFont}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="flex items-center gap-4 md:gap-5">
                    {onSignOut ? (
                        <button
                            type="button"
                            onClick={() => void onSignOut()}
                            className="text-[0.92rem] text-[#65655c] transition-opacity hover:opacity-70"
                            style={serifFont}
                        >
                            Sign Out
                        </button>
                    ) : null}
                </div>
            </div>
        </header>
    );
}

export function MemberWorkspaceFooter({
    brandName = "Align",
    supportEmail = "support@alignflow.xyz",
}: MemberWorkspaceFooterProps) {
    return (
        <footer className="border-t border-[#e7e0d6] bg-[#fffcf7]">
            <div className="mx-auto flex max-w-[1240px] flex-col gap-5 px-8 py-8 text-[0.66rem] uppercase tracking-[0.18em] text-[#a1978d] md:flex-row md:items-center md:justify-between md:px-10">
                <div className="inline-flex items-center gap-[10px] text-[1rem] normal-case italic tracking-normal text-[#6a5b56]" style={serifFont}>
                    <LogoMark />
                    <span>{brandName}</span>
                </div>

                <div className="flex flex-wrap gap-6" style={bodyFont}>
                    <Link href={marketingPrivacyHref} className="transition-colors hover:text-[#7b7168]">
                        Privacy
                    </Link>
                    <Link href={marketingTermsHref} className="transition-colors hover:text-[#7b7168]">
                        Terms
                    </Link>
                    <a href={`mailto:${supportEmail}`} className="transition-colors hover:text-[#7b7168]">
                        Support
                    </a>
                </div>

                <div style={bodyFont}>© {new Date().getFullYear()} {brandName}. Restorative member space.</div>
            </div>
        </footer>
    );
}

export function MemberImmersiveHeader(props: MemberImmersiveHeaderProps) {
    return <EditorialFlowHeader {...props} />;
}

export function MemberImmersiveFooter(props: MemberImmersiveFooterProps) {
    return <EditorialFlowFooter {...props} />;
}
