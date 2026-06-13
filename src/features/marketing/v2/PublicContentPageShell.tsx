import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import {
    appUploadEntryHref,
    marketingAboutHref,
    marketingBlogHref,
    marketingHomeHref,
    marketingPrivacyHref,
    marketingTermsHref,
} from "@/lib/navigation";

const serifFont = { fontFamily: "var(--font-editorial-serif), serif" } as const;
const bodyFont = { fontFamily: "var(--font-editorial-body), sans-serif" } as const;

const publicPageLinks = [
    { href: marketingAboutHref, label: "About" },
    { href: marketingBlogHref, label: "Blog" },
    { href: marketingPrivacyHref, label: "Privacy" },
    { href: marketingTermsHref, label: "Terms" },
] as const;

type PublicContentPageShellProps = {
    eyebrow: string;
    title: string;
    summary: string;
    currentPageLabel: string;
    meta?: React.ReactNode;
    aside?: React.ReactNode;
    pageDescription?: string;
    titleClassName?: string;
    summaryClassName?: string;
    contentClassName?: string;
    showAsideRail?: boolean;
    showExploreNav?: boolean;
    showPrimaryAction?: boolean;
    children: React.ReactNode;
};

export function PublicContentPageShell({
    eyebrow,
    title,
    summary,
    currentPageLabel,
    meta,
    aside,
    pageDescription,
    titleClassName,
    summaryClassName,
    contentClassName,
    showAsideRail = true,
    showExploreNav = true,
    showPrimaryAction = true,
    children,
}: PublicContentPageShellProps) {
    return (
        <div className="pb-16 pt-10 text-[#383831] md:pb-24 md:pt-14" style={bodyFont}>
            <div className="mx-auto w-full max-w-[1100px] px-6 md:px-8">
                <Link
                    href={marketingHomeHref}
                    className="inline-flex items-center gap-2 text-[0.75rem] uppercase tracking-[0.18em] text-[#8f7f74] transition-colors hover:text-[#383831]"
                >
                    <ArrowLeft size={14} />
                    <span>Back to home</span>
                </Link>

                <section className="mt-8 border-t border-[#e7dfd5] pt-10 md:pt-14">
                    <div className={showAsideRail ? "grid gap-10 lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-14" : "max-w-[760px]"}>
                        <div>
                            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-[#979086]">
                                {eyebrow}
                            </p>
                            <h1
                                className={`mt-4 max-w-[12ch] text-[2.55rem] leading-[1.02] tracking-[-0.04em] text-[#2f2b28] md:text-[4rem] ${titleClassName ?? ""}`}
                                style={serifFont}
                            >
                                {title}
                            </h1>
                            <p className={`mt-6 max-w-[60ch] text-[0.98rem] leading-8 text-[#645c56] md:text-[1rem] ${summaryClassName ?? ""}`}>
                                {summary}
                            </p>
                            {meta ? <div className="mt-8 max-w-[60ch] border-t border-[#ece4da] pt-6">{meta}</div> : null}
                        </div>

                        {showAsideRail ? (
                            <aside className="space-y-6 lg:pt-16">
                                <div className="border-t border-[#e7dfd5] pt-4">
                                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[#979086]">
                                        Page Focus
                                    </p>
                                    <p className="mt-3 text-[0.92rem] leading-7 text-[#6a625c]">
                                        {pageDescription ??
                                            "A consistent public shell keeps navigation, framing, and editorial pacing aligned across every informational page."}
                                    </p>
                                </div>

                                {aside ? (
                                    <div className="border-t border-[#ece4da] pt-4">
                                        {aside}
                                    </div>
                                ) : null}

                                {showPrimaryAction ? (
                                    <Link
                                        href={appUploadEntryHref}
                                        className="inline-flex items-center gap-2 text-[0.76rem] uppercase tracking-[0.18em] text-[#574f48] transition-colors hover:text-[#383831]"
                                    >
                                        <span>Start analysis</span>
                                        <ArrowRight size={14} />
                                    </Link>
                                ) : null}
                            </aside>
                        ) : null}
                    </div>
                </section>

                <section className={showExploreNav ? "mt-16 grid gap-10 lg:grid-cols-[180px_minmax(0,720px)] lg:gap-16" : "mt-16 max-w-[760px]"}>
                    {showExploreNav ? (
                        <div className="border-t border-[#e7dfd5] pt-4 lg:sticky lg:top-28 lg:self-start">
                            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[#979086]">
                                Explore
                            </p>
                            <div className="mt-4 space-y-3">
                                {publicPageLinks.map((link) => {
                                    const isCurrent = link.label === currentPageLabel;

                                    return (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            aria-current={isCurrent ? "page" : undefined}
                                            className={`flex items-center justify-between text-[0.8rem] uppercase tracking-[0.16em] transition-colors ${
                                                isCurrent
                                                    ? "text-[#2f2b28]"
                                                    : "text-[#979086] hover:text-[#383831]"
                                            }`}
                                        >
                                            <span>{link.label}</span>
                                            <ArrowRight className="h-4 w-4" />
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ) : null}

                    <div className={contentClassName ?? "space-y-7"}>
                        {children}
                    </div>
                </section>
            </div>
        </div>
    );
}
