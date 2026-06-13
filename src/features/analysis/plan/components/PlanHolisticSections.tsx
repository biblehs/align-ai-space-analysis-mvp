import type { SnapshotResult } from "@/types";

type PlanHolisticSectionsProps = {
    snapshot: SnapshotResult;
    spatialRemedies: NonNullable<SnapshotResult["spatialRemedies"]>;
    personalizedRecommendations: NonNullable<SnapshotResult["personalizedRecommendations"]>;
};

export function PlanHolisticSections({
    snapshot,
    spatialRemedies,
    personalizedRecommendations,
}: PlanHolisticSectionsProps) {
    return (
        <>
            <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
                <div className="rounded-[2.5rem] border border-border bg-card p-6 shadow-sm sm:p-10">
                    <h2 className="mb-3 text-xl font-bold text-foreground">Holistic Room Reading</h2>
                    <p className="mb-6 text-sm text-muted-foreground">
                        A broader interpretation of energy, ritual support, and restorative atmosphere beyond standard decor analysis.
                    </p>

                    {snapshot.integratedReading && (
                        <div className="rounded-[1.5rem] border border-border/60 bg-secondary/20 p-5">
                            <p className="text-sm font-medium leading-relaxed text-foreground/85">{snapshot.integratedReading}</p>
                        </div>
                    )}

                    <div className="mt-6 grid gap-4 sm:grid-cols-3">
                        {snapshot.energyFlow && (
                            <div className="rounded-[1.5rem] border border-border/60 p-4">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Energy Flow</p>
                                <p className="mt-2 text-2xl font-black text-foreground">{snapshot.energyFlow.score}</p>
                                <p className="mt-2 text-sm leading-relaxed text-foreground/75">{snapshot.energyFlow.evaluation}</p>
                            </div>
                        )}
                        {snapshot.elementBalance && (
                            <div className="rounded-[1.5rem] border border-border/60 p-4">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Element Balance</p>
                                <p className="mt-2 text-2xl font-black text-foreground">{snapshot.elementBalance.score}</p>
                                <p className="mt-2 text-sm leading-relaxed text-foreground/75">{snapshot.elementBalance.recommendation}</p>
                            </div>
                        )}
                        {snapshot.wellnessSignals && (
                            <div className="rounded-[1.5rem] border border-border/60 p-4">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Healing Support</p>
                                <p className="mt-2 text-2xl font-black text-foreground">{snapshot.wellnessSignals.score}</p>
                                <p className="mt-2 text-sm leading-relaxed text-foreground/75">{snapshot.wellnessSignals.restorativeSupport}</p>
                            </div>
                        )}
                    </div>
                </div>

                {snapshot.holisticSupports && (
                    <div className="rounded-[2.5rem] border border-border bg-card p-6 shadow-sm sm:p-10">
                        <h2 className="mb-3 text-xl font-bold text-foreground">Ritual & Atmosphere Supports</h2>
                        <div className="space-y-4 text-sm leading-relaxed text-foreground/80">
                            <div className="rounded-[1.25rem] bg-secondary/25 p-4">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Crystal</p>
                                <p className="mt-2">{snapshot.holisticSupports.crystalSupport}</p>
                            </div>
                            <div className="rounded-[1.25rem] bg-secondary/25 p-4">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Incense</p>
                                <p className="mt-2">{snapshot.holisticSupports.incenseSupport}</p>
                            </div>
                            <div className="rounded-[1.25rem] bg-secondary/25 p-4">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Candle</p>
                                <p className="mt-2">{snapshot.holisticSupports.candleSupport}</p>
                            </div>
                            <div className="rounded-[1.25rem] bg-secondary/25 p-4">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Daily Ritual</p>
                                <p className="mt-2">{snapshot.holisticSupports.ritualSupport}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {spatialRemedies.length > 0 && (
                <div className="rounded-[2.5rem] border border-border bg-card p-6 shadow-sm sm:p-10">
                    <h2 className="mb-3 text-xl font-bold text-foreground">Spatial Activation Map</h2>
                    <p className="mb-8 text-sm text-muted-foreground">
                        Zone-specific readings that explain where the room needs stronger support and what to place there.
                    </p>
                    <div className="grid gap-5 lg:grid-cols-2">
                        {spatialRemedies.map((remedy, index) => (
                            <div key={`${remedy.zone}-${index}`} className="rounded-[1.75rem] border border-border/60 bg-secondary/20 p-5">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{remedy.zone}</p>
                                <p className="mt-2 text-lg font-bold text-foreground">{remedy.issue}</p>
                                <p className="mt-3 text-sm leading-relaxed text-foreground/80">{remedy.remedy}</p>
                                <p className="mt-4 rounded-xl bg-card px-4 py-3 text-sm font-medium text-foreground/75">{remedy.expectedShift}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {personalizedRecommendations.length > 0 && (
                <div className="rounded-[2.5rem] border border-border bg-card p-6 shadow-sm sm:p-10">
                    <h2 className="mb-3 text-xl font-bold text-foreground">Deeper AI Recommendations</h2>
                    <p className="mb-8 text-sm text-muted-foreground">
                        Long-form guidance across different intervention categories, not just decor adjustments.
                    </p>
                    <div className="grid gap-5 lg:grid-cols-3">
                        {personalizedRecommendations.map((item, index) => (
                            <div key={`${item.title}-${index}`} className="rounded-[1.75rem] border border-border/60 p-5">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{item.category}</p>
                                <h3 className="mt-2 text-lg font-bold text-foreground">{item.title}</h3>
                                <p className="mt-3 text-sm leading-relaxed text-foreground/75">{item.reason}</p>
                                <p className="mt-4 text-sm font-medium leading-relaxed text-foreground">{item.action}</p>
                                <p className="mt-4 rounded-xl bg-secondary/20 px-4 py-3 text-sm text-foreground/75">{item.expectedBenefit}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}
