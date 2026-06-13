import type { RefObject } from "react";
import { Sparkles } from "lucide-react";
import type { SnapshotResult } from "@/types";
import { ReportMarketingPanel } from "@/components/report/ReportMarketingPanel";

type SnapshotExportCardProps = {
    exportRef: RefObject<HTMLDivElement | null>;
    snapshot: SnapshotResult;
    themeRatingColor: string;
    remedyPreview: NonNullable<SnapshotResult["spatialRemedies"]>;
};

export function SnapshotExportCard({
    exportRef,
    snapshot,
    themeRatingColor,
    remedyPreview,
}: SnapshotExportCardProps) {
    return (
        <div className="pointer-events-none absolute left-[-9999px] top-[-9999px]">
            <div
                ref={exportRef}
                className="relative flex w-[1080px] flex-col overflow-hidden bg-background p-24 font-sans text-foreground"
                style={{ backgroundImage: "radial-gradient(circle at top right, #eeeae4, #fcfcfb 50%)" }}
            >
                <div className="mb-16 flex w-full items-center justify-between opacity-50">
                    <div className="flex items-center gap-3">
                        <Sparkles className="h-8 w-8" />
                        <span className="text-3xl font-bold tracking-widest">ALIGN</span>
                    </div>
                    <span className="text-2xl font-bold uppercase tracking-widest">Read Your Space</span>
                </div>

                <h1 className="mb-6 font-heading text-7xl font-bold tracking-tight">My Space Reading</h1>

                <div className="mb-12 flex flex-col items-center justify-center rounded-[4rem] bg-foreground p-16 text-center text-background shadow-2xl">
                    <p className="mb-4 text-2xl font-bold uppercase tracking-widest text-background/70">Archetype</p>
                    <p className="mb-12 text-6xl font-bold">{snapshot.archetype}</p>

                    <div className="flex w-full items-center justify-center gap-12">
                        <div className="text-center">
                            <p className="text-9xl font-black">{snapshot.score}</p>
                            <p className="mt-4 text-2xl text-background/75">Balance Score</p>
                        </div>
                        <div className={`h-40 w-1 ${themeRatingColor.replace("text-", "bg-")}`} />
                        <div className="max-w-sm text-left">
                            <span className={`mb-4 inline-block rounded-full border-2 bg-transparent px-6 py-3 text-2xl font-bold uppercase tracking-widest ${themeRatingColor} ${themeRatingColor.replace("text-", "border-")}`}>
                                {snapshot.ratingLabel}
                            </span>
                            <p className="text-xl leading-relaxed text-background/70">{snapshot.stressImpact}</p>
                        </div>
                    </div>
                </div>

                <div className="rounded-[3rem] border-4 border-border bg-card p-12 shadow-xl">
                    <div className="flex items-start gap-8">
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-insight-sage/20 text-insight-sage">
                            <Sparkles className="h-10 w-10" />
                        </div>
                        <div>
                            <h4 className="mb-4 text-3xl font-bold">AI Insight</h4>
                            <p className="text-3xl leading-relaxed text-foreground/80">{snapshot.freeInsight}</p>
                        </div>
                    </div>
                </div>

                {snapshot.integratedReading && (
                    <div className="mt-10 rounded-[3rem] border border-border bg-card p-12 shadow-sm">
                        <p className="text-[18px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Extended Reading</p>
                        <p className="mt-6 text-[32px] leading-relaxed text-foreground/80">{snapshot.integratedReading}</p>
                    </div>
                )}

                {snapshot.sceneFingerprint && snapshot.sceneFingerprint.length > 0 && (
                    <div className="mt-10 rounded-[3rem] border border-border bg-card p-12 shadow-sm">
                        <p className="text-[18px] font-bold uppercase tracking-[0.2em] text-muted-foreground">AI Noticed</p>
                        <div className="mt-6 space-y-4">
                            {snapshot.sceneFingerprint.slice(0, 3).map((item, index) => (
                                <p key={`${item}-${index}`} className="text-[28px] leading-relaxed text-foreground/80">
                                    • {item}
                                </p>
                            ))}
                        </div>
                    </div>
                )}

                {remedyPreview.length > 0 && (
                    <div className="mt-10 grid grid-cols-2 gap-8">
                        {remedyPreview.map((remedy, index) => (
                            <div key={`${remedy.zone}-${index}`} className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
                                <p className="text-[16px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{remedy.zone}</p>
                                <p className="mt-4 text-[30px] font-bold leading-tight text-foreground">{remedy.issue}</p>
                                <p className="mt-4 text-[24px] leading-relaxed text-foreground/75">{remedy.remedy}</p>
                            </div>
                        ))}
                    </div>
                )}

                <ReportMarketingPanel
                    cta="Scan to generate your own personalized space reading"
                    subtitle="One photo unlocks a free room reading with calming guidance, grounding details, and gentle next steps."
                />
            </div>
        </div>
    );
}
