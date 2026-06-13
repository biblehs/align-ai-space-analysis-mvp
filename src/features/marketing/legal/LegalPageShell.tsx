import { marketingBrand } from "@/features/marketing/site-content";
import { PublicContentPageShell } from "@/features/marketing/v2/PublicContentPageShell";

type LegalPageShellProps = {
    eyebrow: string;
    title: string;
    summary: string;
    effectiveDate: string;
    lastUpdated: string;
    currentPageLabel: string;
    pageDescription: string;
    children: React.ReactNode;
};

export function LegalPageShell({
    eyebrow,
    title,
    summary,
    effectiveDate,
    lastUpdated,
    currentPageLabel,
    pageDescription,
    children,
}: LegalPageShellProps) {
    return (
        <PublicContentPageShell
            eyebrow={eyebrow}
            title={title}
            summary={summary}
            currentPageLabel={currentPageLabel}
            showAsideRail={false}
            showExploreNav={false}
            showPrimaryAction={false}
            pageDescription={pageDescription}
            meta={
                <div className="grid gap-4 text-[0.88rem] leading-7 text-[#6a625c] md:grid-cols-2">
                    <p><span className="font-semibold text-[#383831]">Effective Date:</span> {effectiveDate}</p>
                    <p><span className="font-semibold text-[#383831]">Last Updated:</span> {lastUpdated}</p>
                </div>
            }
        >
            <div className="border-t border-[#ece4da] pt-6 text-[0.9rem] leading-7 text-[#6a625c]">
                For privacy-related requests, contact{" "}
                <a className="underline underline-offset-4" href={`mailto:${marketingBrand.privacyEmail}`}>
                    {marketingBrand.privacyEmail}
                </a>
                .
            </div>
            {children}
        </PublicContentPageShell>
    );
}
