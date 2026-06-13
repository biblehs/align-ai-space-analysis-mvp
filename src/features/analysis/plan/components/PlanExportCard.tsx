import type { RefObject } from "react";
import { Sparkles } from "lucide-react";
import type { PlanStep, SnapshotResult } from "@/types";
import { ReportMarketingPanel } from "@/components/report/ReportMarketingPanel";

type PlanExportCardProps = {
    exportRef: RefObject<HTMLDivElement | null>;
    snapshot: SnapshotResult | null;
    planSteps: PlanStep[];
    spatialRemedies: NonNullable<SnapshotResult["spatialRemedies"]>;
    personalizedRecommendations: NonNullable<SnapshotResult["personalizedRecommendations"]>;
};

export function PlanExportCard({
    exportRef,
    snapshot,
    planSteps,
    spatialRemedies,
    personalizedRecommendations,
}: PlanExportCardProps) {
    return (
        <div className="pointer-events-none absolute left-[-9999px] top-[-9999px]">
            <div
                ref={exportRef}
                className="w-[1080px] bg-background p-24 text-foreground"
                style={{ backgroundImage: "radial-gradient(circle at top right, #efe8dd, #fcfcfb 52%)" }}
            >
                <div className="mb-14 flex items-center justify-between opacity-60">
                    <div className="flex items-center gap-3">
                        <Sparkles className="h-8 w-8" />
                        <span className="text-3xl font-bold tracking-[0.2em]">ALIGN</span>
                    </div>
                    <span className="text-2xl font-bold uppercase tracking-[0.2em]">Full Space Report</span>
                </div>

                {snapshot && (
                    <div className="rounded-[3rem] bg-foreground p-14 text-background shadow-2xl">
                        <div className="flex items-center justify-between gap-8">
                            <div>
                                <p className="text-[16px] font-bold uppercase tracking-[0.2em] text-background/70">Archetype</p>
                                <h1 className="mt-4 text-6xl font-bold leading-tight">{snapshot.archetype}</h1>
                                <p className="mt-4 max-w-2xl text-2xl leading-relaxed text-background/70">{snapshot.archetypeDesc}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-8xl font-black">{snapshot.score}</p>
                                <p className="mt-2 text-xl text-background/75">{snapshot.ratingLabel}</p>
                            </div>
                        </div>
                    </div>
                )}

                {snapshot?.integratedReading && (
                    <div className="mt-10 rounded-[2.5rem] border border-border bg-card p-12 shadow-sm">
                        <p className="text-[16px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Holistic Reading</p>
                        <p className="mt-6 text-[28px] leading-relaxed text-foreground/80">{snapshot.integratedReading}</p>
                    </div>
                )}

                {spatialRemedies.length > 0 && (
                    <div className="mt-10 grid grid-cols-2 gap-8">
                        {spatialRemedies.map((remedy, index) => (
                            <div key={`${remedy.zone}-${index}`} className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
                                <p className="text-[16px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{remedy.zone}</p>
                                <p className="mt-4 text-[28px] font-bold leading-tight">{remedy.issue}</p>
                                <p className="mt-4 text-[22px] leading-relaxed text-foreground/75">{remedy.remedy}</p>
                                <p className="mt-4 text-[20px] leading-relaxed text-foreground/65">{remedy.expectedShift}</p>
                            </div>
                        ))}
                    </div>
                )}

                {personalizedRecommendations.length > 0 && (
                    <div className="mt-10 rounded-[2.5rem] border border-border bg-card p-12 shadow-sm">
                        <p className="text-[16px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Deeper Recommendations</p>
                        <div className="mt-8 grid grid-cols-3 gap-6">
                            {personalizedRecommendations.map((item, index) => (
                                <div key={`${item.title}-${index}`} className="rounded-[1.75rem] bg-secondary/20 p-6">
                                    <p className="text-[14px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{item.category}</p>
                                    <h3 className="mt-3 text-[26px] font-bold leading-tight">{item.title}</h3>
                                    <p className="mt-4 text-[19px] leading-relaxed text-foreground/75">{item.reason}</p>
                                    <p className="mt-4 text-[19px] font-medium leading-relaxed">{item.action}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mt-10 rounded-[2.5rem] border border-border bg-card p-12 shadow-sm">
                    <p className="text-[16px] font-bold uppercase tracking-[0.2em] text-muted-foreground">5-Step Blueprint</p>
                    <div className="mt-8 space-y-5">
                        {planSteps.map((step) => (
                            <div key={step.id} className="rounded-[1.75rem] border border-border/70 p-6">
                                <div className="flex items-start justify-between gap-6">
                                    <div>
                                        <p className="text-[14px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Step {step.id}</p>
                                        <h3 className="mt-2 text-[28px] font-bold">{step.title}</h3>
                                    </div>
                                    <div className="rounded-full bg-secondary px-4 py-2 text-[14px] font-bold">{step.costRange}</div>
                                </div>
                                <p className="mt-4 text-[20px] leading-relaxed text-foreground/75">{step.reason}</p>
                                <p className="mt-4 text-[20px] font-medium leading-relaxed">{step.action}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <ReportMarketingPanel
                    cta="Share your report or start a new room reset"
                    subtitle="ALIGN combines design guidance, energy reading, ritual support, and practical next steps in one AI report."
                />
            </div>
        </div>
    );
}
