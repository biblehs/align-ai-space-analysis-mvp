import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { blogPageContent } from "@/features/marketing/site-content";
import { PublicContentPageShell } from "@/features/marketing/v2/PublicContentPageShell";
import { marketingBlogHref } from "@/lib/navigation";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Align | Journal",
    description: "Explore ALIGN journal notes, product updates, and future editorial stories around calmer living.",
    alternates: {
        canonical: marketingBlogHref,
    },
};

export default function BlogPage() {
    return (
        <PublicContentPageShell
            eyebrow={blogPageContent.eyebrow}
            title="Editorial notes, room stories, and slower living updates."
            summary={blogPageContent.summary}
            currentPageLabel="Blog"
            pageDescription="Blog is the editorial surface for product notes, room stories, and slower-living ideas that extend the ALIGN brand world."
            aside={
                <div className="space-y-3 text-[0.95rem] leading-7 text-[#655c56]">
                    <p>{blogPageContent.cards.secondary.copy}</p>
                    <Link
                        href={blogPageContent.cards.secondary.ctaHref}
                        className="inline-flex items-center gap-2 text-[0.76rem] uppercase tracking-[0.18em] text-[#574f48] transition-colors hover:text-[#383831]"
                    >
                        <span>{blogPageContent.cards.secondary.ctaLabel}</span>
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            }
        >
            <section className="space-y-4 border-b border-[#ddd1c2] pb-8">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[#8e7d73]">
                    {blogPageContent.cards.primary.eyebrow}
                </p>
                <h2
                    className="text-[1.85rem] leading-[1.08] text-[#38312c] md:text-[2.25rem]"
                    style={{ fontFamily: "var(--font-editorial-serif), serif" }}
                >
                    {blogPageContent.cards.primary.title}
                </h2>
                <p className="text-[0.98rem] leading-8 text-[#655c56]">
                    {blogPageContent.cards.primary.copy}
                </p>
            </section>

            <section className="space-y-4 border-b border-[#ddd1c2] pb-8">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[#8e7d73]">
                    Publishing Direction
                </p>
                <div className="space-y-4 text-[0.98rem] leading-8 text-[#655c56]">
                    <p>
                        The journal is being shaped as a slower editorial companion to the product: less feed,
                        more considered notes on homes, atmosphere, and practical room shifts.
                    </p>
                    <p>
                        When publishing is ready, this space can expand into articles, case studies, and guided
                        room stories without breaking the visual language used across the rest of the public site.
                    </p>
                </div>
            </section>

            <section className="space-y-4">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[#8e7d73]">
                    Explore ALIGN
                </p>
                <p className="text-[0.98rem] leading-8 text-[#655c56]">
                    While the journal is taking shape, you can still begin a full room analysis and see how
                    ALIGN reads the atmosphere, function, and emotional tone of your space.
                </p>
                <Link
                    href={blogPageContent.cards.secondary.ctaHref}
                    className="inline-flex items-center gap-2 text-[0.76rem] uppercase tracking-[0.18em] text-[#574f48] transition-colors hover:text-[#383831]"
                >
                    <span>{blogPageContent.cards.secondary.ctaLabel}</span>
                    <ArrowRight className="h-4 w-4" />
                </Link>
            </section>
        </PublicContentPageShell>
    );
}
