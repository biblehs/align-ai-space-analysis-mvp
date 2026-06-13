import Link from "next/link";
import { aboutPageContent, marketingBrand } from "@/features/marketing/site-content";
import { appUploadEntryHref } from "@/lib/navigation";
import { PublicContentPageShell } from "@/features/marketing/v2/PublicContentPageShell";

const serifFont = { fontFamily: "var(--font-editorial-serif), serif" } as const;

export default function AboutPage() {
  const [brandStory, difference, outcomes, closing] = aboutPageContent.sections;

  return (
    <PublicContentPageShell
      eyebrow="About Align by Alignflow"
      title="A gentler way to understand what home is doing to your body and mind."
      summary={aboutPageContent.introParagraphs.join(" ")}
      currentPageLabel="About"
      pageDescription="About explains what Align by Alignflow is for, how the wellness plan works, and why the product is built for real homes rather than idealized spaces."
      titleClassName="max-w-[14ch] text-[2.2rem] leading-[1.08] tracking-[-0.03em] md:text-[3.15rem]"
      summaryClassName="max-w-[52ch] text-[0.94rem] leading-[1.95] md:text-[0.96rem]"
      contentClassName="space-y-12"
      showAsideRail={false}
      showExploreNav={false}
      showPrimaryAction={false}
      meta={
        <div className="grid gap-4 text-[0.88rem] leading-7 text-[#6a625c] md:grid-cols-2">
          <p><span className="font-semibold text-[#383831]">Contact:</span> {marketingBrand.contactEmail}</p>
          <p><span className="font-semibold text-[#383831]">Focus:</span> AI room analysis, wellness plans, and calmer everyday living.</p>
        </div>
      }
    >
      <section className="space-y-5 border-b border-[#e8e0d7] pb-10">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-[#979086]">{brandStory.label}</p>
        <h2 className="max-w-[22ch] text-[1.55rem] leading-[1.16] tracking-[-0.02em] text-[#38312c] md:text-[1.9rem]" style={serifFont}>
          {brandStory.lead}
        </h2>
        <p className="max-w-[58ch] text-[0.94rem] leading-[1.95] text-[#645c56]">{brandStory.body}</p>
      </section>

      <section className="space-y-6 border-b border-[#e8e0d7] pb-10">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-[#979086]">{difference.label}</p>
        <p className="max-w-[58ch] text-[0.94rem] leading-[1.95] text-[#645c56]">{difference.body}</p>
        <div className="space-y-5">
          {difference.lines?.map((item) => (
            <div key={item} className="grid gap-3 border-t border-[#efe7de] pt-5 md:grid-cols-[22px_minmax(0,1fr)]">
              <span className="text-[#979086]">→</span>
              <p className="max-w-[56ch] text-[0.94rem] leading-[1.9] text-[#4f4944]">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6 border-b border-[#e8e0d7] pb-10">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-[#979086]">{outcomes.label}</p>
        <p className="max-w-[58ch] text-[0.94rem] leading-[1.95] text-[#645c56]">{outcomes.body}</p>
        <div className="space-y-5">
          {outcomes.lines?.map((item) => (
            <div key={item} className="grid gap-3 border-t border-[#efe7de] pt-5 md:grid-cols-[22px_minmax(0,1fr)]">
              <span className="text-[#979086]">→</span>
              <p className="max-w-[56ch] text-[0.94rem] leading-[1.9] text-[#4f4944]">{item}</p>
            </div>
          ))}
        </div>
        <p className="max-w-[56ch] border-l border-[#ddd3c8] pl-6 text-[0.94rem] leading-[1.9] text-[#4f4944]">
          {outcomes.callout}
        </p>
      </section>

      <section className="space-y-6 pt-1">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-[#979086]">{closing.label}</p>
        <h2 className="max-w-[24ch] text-[1.55rem] leading-[1.16] tracking-[-0.02em] text-[#38312c] md:text-[1.9rem]" style={serifFont}>
          {closing.lead}
        </h2>
        <p className="max-w-[56ch] text-[0.94rem] leading-[1.95] text-[#645c56]">{closing.body}</p>
        <div className="flex flex-col items-start gap-5 border-t border-[#efe7de] pt-6 md:flex-row md:items-center md:justify-between">
          <a href={`mailto:${marketingBrand.contactEmail}`} className="text-[0.82rem] uppercase tracking-[0.16em] text-[#574f48] underline underline-offset-4">
            {marketingBrand.contactEmail}
          </a>
          <Link
            href={appUploadEntryHref}
            className="inline-flex items-center gap-2 text-[0.8rem] uppercase tracking-[0.16em] text-[#574f48] underline underline-offset-4 transition-colors hover:text-[#383831]"
          >
            <span>Start your wellness plan</span>
          </Link>
        </div>
      </section>
    </PublicContentPageShell>
  );
}
