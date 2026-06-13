"use client";

import Link from "next/link";
import { marketingHomeHref, marketingPrivacyHref, marketingTermsHref } from "@/lib/navigation";

const serifFont = { fontFamily: "var(--font-editorial-serif), serif" } as const;
const bodyFont = { fontFamily: "var(--font-editorial-body), sans-serif" } as const;

type EditorialFlowHeaderProps = {
    brandHref?: string;
    brandName?: string;
    stepLabel?: string;
    secondaryLabel?: string;
    secondaryHref?: string;
    utilityLabel?: string;
    utilityHref?: string;
};

type EditorialFlowFooterProps = {
    brandName?: string;
    supportEmail?: string;
    eyebrow?: string;
    copy?: string;
};

export function LogoMark() {
    return (
        <svg width="24" height="24" viewBox="0 0 64 64" fill="none" aria-hidden="true">
            <rect width="64" height="64" rx="32" fill="#EFECE4" />
            <path
                d="M19.5 42.4375V40C20.1042 40 20.6198 39.9062 21.0469 39.7188C21.474 39.5312 21.9062 39.3281 22.3438 39.1094C22.7812 38.8906 23.2656 38.6927 23.7969 38.5156C24.3281 38.3385 24.9844 38.25 25.7656 38.25C26.5469 38.25 27.1927 38.3385 27.7031 38.5156C28.2135 38.6927 28.6875 38.8906 29.125 39.1094C29.5625 39.3281 30 39.5312 30.4375 39.7188C30.875 39.9062 31.3958 40 32 40C32.6042 40 33.125 39.9062 33.5625 39.7188C34 39.5312 34.4375 39.3281 34.875 39.1094C35.3125 38.8906 35.7917 38.6927 36.3125 38.5156C36.8333 38.3385 37.4844 38.25 38.2656 38.25C39.0469 38.25 39.6979 38.3385 40.2188 38.5156C40.7396 38.6927 41.2188 38.8906 41.6562 39.1094C42.0938 39.3281 42.5312 39.5312 42.9688 39.7188C43.4062 39.9062 43.9167 40 44.5 40V42.4375C43.7083 42.4375 43.0469 42.3438 42.5156 42.1562C41.9844 41.9688 41.5 41.7656 41.0625 41.5469C40.625 41.3281 40.1979 41.1302 39.7812 40.9531C39.3646 40.776 38.8542 40.6875 38.25 40.6875C37.6667 40.6875 37.1615 40.776 36.7344 40.9531C36.3073 41.1302 35.8802 41.3281 35.4531 41.5469C35.026 41.7656 34.5469 41.9688 34.0156 42.1562C33.4844 42.3438 32.8125 42.4375 32 42.4375C31.1875 42.4375 30.5156 42.3438 29.9844 42.1562C29.4531 41.9688 28.974 41.7656 28.5469 41.5469C28.1198 41.3281 27.6979 41.1302 27.2812 40.9531C26.8646 40.776 26.3594 40.6875 25.7656 40.6875C25.1719 40.6875 24.6615 40.776 24.2344 40.9531C23.8073 41.1302 23.375 41.3281 22.9375 41.5469C22.5 41.7656 22.0156 41.9688 21.4844 42.1562C20.9531 42.3438 20.2917 42.4375 19.5 42.4375V42.4375M19.5 36.875V34.4375C20.1042 34.4375 20.6198 34.3438 21.0469 34.1562C21.474 33.9688 21.9062 33.7656 22.3438 33.5469C22.7812 33.3281 23.2656 33.1302 23.7969 32.9531C24.3281 32.776 24.9844 32.6875 25.7656 32.6875C26.5469 32.6875 27.1927 32.776 27.7031 32.9531C28.2135 33.1302 28.6875 33.3281 29.125 33.5469C29.5625 33.7656 30 33.9688 30.4375 34.1562C30.875 34.3438 31.3958 34.4375 32 34.4375C32.6042 34.4375 33.125 34.3438 33.5625 34.1562C34 33.9688 34.4375 33.7656 34.875 33.5469C35.3125 33.3281 35.7917 33.1302 36.3125 32.9531C36.8333 32.776 37.4792 32.6875 38.25 32.6875C39.0417 32.6875 39.6979 32.776 40.2188 32.9531C40.7396 33.1302 41.2188 33.3281 41.6562 33.5469C42.0938 33.7656 42.5312 33.9688 42.9688 34.1562C43.4062 34.3438 43.9167 34.4375 44.5 34.4375V36.875C43.7083 36.875 43.0469 36.7812 42.5156 36.5938C41.9844 36.4062 41.5 36.2031 41.0625 35.9844C40.625 35.7656 40.1979 35.5677 39.7812 35.3906C39.3646 35.2135 38.8542 35.125 38.25 35.125C37.6458 35.125 37.1302 35.2135 36.7031 35.3906C36.276 35.5677 35.849 35.7656 35.4219 35.9844C34.9948 36.2031 34.5208 36.4062 34 36.5938C33.4792 36.7812 32.8125 36.875 32 36.875C31.1875 36.875 30.5156 36.7812 29.9844 36.5938C29.4531 36.4062 28.974 36.2031 28.5469 35.9844C28.1198 35.7656 27.6979 35.5677 27.2812 35.3906C26.8646 35.2135 26.3594 35.125 25.7656 35.125C25.1719 35.125 24.6615 35.2135 24.2344 35.3906C23.8073 35.5677 23.375 35.7656 22.9375 35.9844C22.5 36.2031 22.0156 36.4062 21.4844 36.5938C20.9531 36.7812 20.2917 36.875 19.5 36.875V36.875M19.5 31.3125V28.875C20.1042 28.875 20.6198 28.7812 21.0469 28.5938C21.474 28.4062 21.9062 28.2031 22.3438 27.9844C22.7812 27.7656 23.2656 27.5677 23.7969 27.3906C24.3281 27.2135 24.9844 27.125 25.7656 27.125C26.5469 27.125 27.1927 27.2135 27.7031 27.3906C28.2135 27.5677 28.6875 27.7656 29.125 27.9844C29.5625 28.2031 30 28.4062 30.4375 28.5938C30.875 28.7812 31.3958 28.875 32 28.875C32.6042 28.875 33.125 28.7812 33.5625 28.5938C34 28.4062 34.4375 28.2031 34.875 27.9844C35.3125 27.7656 35.7917 27.5677 36.3125 27.3906C36.8333 27.2135 37.4792 27.125 38.25 27.125C39.0417 27.125 39.6979 27.2135 40.2188 27.3906C40.7396 27.5677 41.2188 27.7656 41.6562 27.9844C42.0938 28.2031 42.5312 28.4062 42.9688 28.5938C43.4062 28.7812 43.9167 28.875 44.5 28.875V31.3125C43.7083 31.3125 43.0469 31.2188 42.5156 31.0312C41.9844 30.8438 41.5 30.6406 41.0625 30.4219C40.625 30.2031 40.1979 30.0052 39.7812 29.8281C39.3646 29.651 38.8542 29.5625 38.25 29.5625C37.6667 29.5625 37.1615 29.651 36.7344 29.8281C36.3073 30.0052 35.8802 30.2031 35.4531 30.4219C35.026 30.6406 34.5469 30.8438 34.0156 31.0312C33.4844 31.2188 32.8125 31.3125 32 31.3125C31.1875 31.3125 30.5156 31.2188 29.9844 31.0312C29.4531 30.8438 28.974 30.6406 28.5469 30.4219C28.1198 30.2031 27.6979 30.0052 27.2812 29.8281C26.8646 29.651 26.3594 29.5625 25.7656 29.5625C25.1719 29.5625 24.6615 29.651 24.2344 29.8281C23.8073 30.0052 23.375 30.2031 22.9375 30.4219C22.5 30.6406 22.0156 30.8438 21.4844 31.0312C20.9531 31.2188 20.2917 31.3125 19.5 31.3125V31.3125M19.5 25.75V23.3125C20.1042 23.3125 20.6198 23.2188 21.0469 23.0312C21.474 22.8438 21.9062 22.6406 22.3438 22.4219C22.7812 22.2031 23.2656 22.0052 23.7969 21.8281C24.3281 21.651 24.9844 21.5625 25.7656 21.5625C26.5469 21.5625 27.1927 21.651 27.7031 21.8281C28.2135 22.0052 28.6875 22.2031 29.125 22.4219C29.5625 22.6406 30 22.8438 30.4375 23.0312C30.875 23.2188 31.3958 23.3125 32 23.3125C32.6042 23.3125 33.125 23.2188 33.5625 23.0312C34 22.8438 34.4375 22.6406 34.875 22.4219C35.3125 22.2031 35.7917 22.0052 36.3125 21.8281C36.8333 21.651 37.4792 21.5625 38.25 21.5625C39.0417 21.5625 39.6979 21.651 40.2188 21.8281C40.7396 22.0052 41.2188 22.2031 41.6562 22.4219C42.0938 22.6406 42.5312 22.8438 42.9688 23.0312C43.4062 23.2188 43.9167 23.3125 44.5 23.3125V25.75C43.7083 25.75 43.0469 25.6562 42.5156 25.4688C41.9844 25.2812 41.5 25.0781 41.0625 24.8594C40.625 24.6406 40.1979 24.4427 39.7812 24.2656C39.3646 24.0885 38.8542 24 38.25 24C37.6667 24 37.1615 24.0885 36.7344 24.2656C36.3073 24.4427 35.8802 24.6406 35.4531 24.8594C35.026 25.0781 34.5469 25.2812 34.0156 25.4688C33.4844 25.6562 32.8125 25.75 32 25.75C31.1875 25.75 30.5156 25.6562 29.9844 25.4688C29.4531 25.2812 28.974 25.0781 28.5469 24.8594C28.1198 24.6406 27.6979 24.4427 27.2812 24.2656C26.8646 24.0885 26.3594 24 25.7656 24C25.1719 24 24.6615 24.0885 24.2344 24.2656C23.8073 24.4427 23.375 24.6406 22.9375 24.8594C22.5 25.0781 22.0156 25.2812 21.4844 25.4688C20.9531 25.6562 20.2917 25.75 19.5 25.75V25.75"
                fill="#6A5B56"
            />
        </svg>
    );
}

export function EditorialFlowHeader({
    brandHref = marketingHomeHref,
    brandName = "Align",
    stepLabel,
    secondaryLabel,
    secondaryHref = "#",
    utilityLabel = "Exit",
    utilityHref = marketingHomeHref,
}: EditorialFlowHeaderProps) {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-[#babab0]/8 bg-[linear-gradient(180deg,rgba(248,244,236,0.98)_0%,rgba(252,249,243,0.92)_72%,rgba(255,252,247,0.82)_100%)]">
            <div className="mx-auto flex w-full max-w-screen-2xl items-center justify-between gap-5 px-7 py-4 md:px-8">
                <Link href={brandHref} className="inline-flex items-center gap-[10px] text-[1.08rem] italic tracking-tight text-[#383831e6]" style={serifFont}>
                    <LogoMark />
                    <span>{brandName}</span>
                </Link>

                <div className="flex items-center gap-[18px]">
                    {stepLabel ? (
                        <span className="text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-[#6a5b568a]" style={bodyFont}>
                            {stepLabel}
                        </span>
                    ) : null}
                    {secondaryLabel ? (
                        <Link href={secondaryHref} className="text-[0.92rem] text-[#3838319e] transition-colors hover:text-[#383831]" style={serifFont}>
                            {secondaryLabel}
                        </Link>
                    ) : null}
                    <Link
                        href={utilityHref}
                        className="text-[0.78rem] uppercase tracking-[0.14em] text-[#38383180] transition-colors hover:text-[#383831]"
                        style={bodyFont}
                    >
                        {utilityLabel}
                    </Link>
                </div>
            </div>
        </header>
    );
}

export function EditorialFlowFooter({
    brandName = "Align",
    supportEmail = "support@alignflow.xyz",
    eyebrow = "ALIGN • Spatial Reading",
    copy = "A calmer way to understand what your space may be asking for next.",
}: EditorialFlowFooterProps) {
    return (
        <footer className="bg-[#fcf9f3]">
            <div className="mx-auto grid w-full max-w-[1120px] grid-cols-1 gap-9 px-7 py-[62px] md:grid-cols-[minmax(280px,1fr)_auto] md:px-8 md:pb-10">
                <div className="max-w-[320px]">
                    <p className="mb-[14px] text-[0.64rem] font-semibold uppercase tracking-[0.28em] text-[#6a5b568a]" style={bodyFont}>
                        {eyebrow}
                    </p>
                    <Link href={marketingHomeHref} className="inline-flex items-center gap-[10px] text-[1.08rem] italic text-[#383831e6]" style={serifFont}>
                        <LogoMark />
                        <span>{brandName}</span>
                    </Link>
                    <p className="mt-4 text-[0.88rem] leading-[1.72] text-[#65655cd1]" style={bodyFont}>{copy}</p>
                </div>

                <div className="flex flex-wrap items-start justify-end gap-5 pt-2">
                    <a href={`mailto:${supportEmail}`} className="text-[0.74rem] uppercase tracking-[0.16em] text-[#383831ad] transition-colors hover:text-[#383831]" style={bodyFont}>
                        Support
                    </a>
                    <Link href={marketingPrivacyHref} className="text-[0.74rem] uppercase tracking-[0.16em] text-[#383831ad] transition-colors hover:text-[#383831]" style={bodyFont}>
                        Privacy
                    </Link>
                    <Link href={marketingTermsHref} className="text-[0.74rem] uppercase tracking-[0.16em] text-[#383831ad] transition-colors hover:text-[#383831]" style={bodyFont}>
                        Terms
                    </Link>
                </div>
            </div>

            <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-[18px] border-t border-[#babab01a] px-7 py-[18px] text-[0.68rem] uppercase tracking-[0.16em] text-[#65655cd1] md:flex-row md:items-center md:justify-between md:px-8 md:pb-7" style={bodyFont}>
                <span>© {new Date().getFullYear()} {brandName}. All rights reserved.</span>
                <span>Read your space. Improve your state.</span>
            </div>
        </footer>
    );
}
