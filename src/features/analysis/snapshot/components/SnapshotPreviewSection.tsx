"use client";

import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Eye, Lock, TrendingUp } from "lucide-react";
import type { SnapshotResult } from "@/types";
import type { DimensionKey, DimensionValue, RankedDimension } from "@/features/analysis/reporting/report-helpers";
import { getDimensionMeta } from "@/features/analysis/reporting/report-helpers";

type SnapshotPreviewSectionProps = {
    snapshot: SnapshotResult;
    dimensionEntries: [DimensionKey, DimensionValue][];
    remedyPreview: NonNullable<SnapshotResult["spatialRemedies"]>;
    weakestDim: RankedDimension | null;
    onUnlock?: () => void;
    showUnlockActions?: boolean;
    variant?: "default" | "history";
    isUpgrading?: boolean;
};

const freeFeatures = [
    "Balance Score & Rating",
    "Space Personality Archetype",
    "Energy Impact Summary",
    "Expanded Free Insight + Room Reading",
    "AI-noticed visual details",
    "Energy & Spatial Remedy Preview",
    "Missing & Overloaded Elements",
    "4-Dimension Score Bars",
];

const paidFeatures = [
    "Everything in Free Preview",
    "Detailed AI Dimension Evaluations",
    "Full Energy / Element / Wellness Reading",
    "Crystal, incense, candle, and ritual guidance",
    "2 zone-by-zone activation remedies",
    "AI Strategic Roadmap",
    "5-Step Personalized Blueprint",
    "Product Recommendations + Links",
    "Placement Guide per Location",
    "3 Budget Tiers (Save/Mid/Premium)",
    "PDF Export & Share",
];

export function SnapshotPreviewSection({
    snapshot,
    dimensionEntries,
    remedyPreview,
    weakestDim,
    onUnlock,
    showUnlockActions = true,
    variant = "default",
    isUpgrading = false,
}: SnapshotPreviewSectionProps) {
    const isHistoryVariant = variant === "history";

    return (
        <>
            {((snapshot.energyFlow && snapshot.wellnessSignals) || remedyPreview.length > 0) && (
                <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
                    {snapshot.energyFlow && snapshot.wellnessSignals && (
                        <div className="rounded-[2.5rem] border border-border bg-card p-6 shadow-sm sm:p-8">
                            <h3 className="mb-3 text-lg font-bold text-foreground">Energy & Healing Read</h3>
                            <div className="space-y-4 text-sm leading-relaxed text-foreground/80">
                                <p><span className="font-bold text-foreground">Flow:</span> {snapshot.energyFlow.evaluation}</p>
                                <p><span className="font-bold text-foreground">Blocked Zone:</span> {snapshot.energyFlow.blockageZone}</p>
                                <p><span className="font-bold text-foreground">Ritual Potential:</span> {snapshot.wellnessSignals.ritualPotential}</p>
                            </div>
                        </div>
                    )}

                    {remedyPreview.length > 0 && (
                        <div className="rounded-[2.5rem] border border-border bg-card p-6 shadow-sm sm:p-8">
                            <h3 className="mb-3 text-lg font-bold text-foreground">Spatial Remedy Preview</h3>
                            <div className="space-y-4">
                                {remedyPreview.map((remedy, index) => (
                                    <div key={`${remedy.zone}-${index}`} className="rounded-[1.25rem] bg-secondary/30 p-4">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{remedy.zone}</p>
                                        <p className="mt-1 text-sm font-bold text-foreground">{remedy.issue}</p>
                                        <p className="mt-2 text-sm leading-relaxed text-foreground/75">{remedy.remedy}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="relative overflow-hidden rounded-[2.5rem] border border-border bg-card p-8 shadow-sm sm:p-10">
                <h3 className="mb-2 flex items-center gap-2 text-xl font-bold text-foreground">
                    <Eye className="h-5 w-5 text-primary" /> 4-Dimension Analysis
                </h3>
                <p className="mb-6 text-sm text-muted-foreground">Your space was scored across 4 key dimensions by our AI expert.</p>

                <div className="grid gap-6 sm:grid-cols-2">
                    {dimensionEntries.map(([key, data]) => {
                        const meta = getDimensionMeta(key);
                        const Icon = meta.icon;

                        return (
                            <div key={key} className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${meta.bgColor}`}>
                                        <Icon className={`h-4 w-4 ${meta.iconColor}`} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between text-foreground">
                                            <span className="text-sm font-bold">{meta.label}</span>
                                            <span className="text-xs font-bold text-muted-foreground">{data.score}/100</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${data.score}%` }}
                                        transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
                                        className="h-full rounded-full"
                                        style={{ backgroundColor: meta.barColor }}
                                    />
                                </div>
                                {!isHistoryVariant && (
                                    <div className="relative">
                                        <p className="pointer-events-none select-none blur-[5px] text-sm leading-relaxed text-muted-foreground">
                                            {data.evaluation}
                                        </p>
                                        {showUnlockActions && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="flex items-center gap-1.5 rounded-full border border-border bg-background/80 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-foreground shadow-sm">
                                                    <Lock className="h-3 w-3" /> Unlock details
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}
                        </div>
                    );
                    })}
                </div>

                {!isHistoryVariant && snapshot.overallStrategy && (
                    <div className="relative mt-8 border-t border-border pt-6">
                        <h4 className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            <TrendingUp className="h-4 w-4 text-primary" /> AI Strategic Roadmap
                        </h4>
                        <div className="relative">
                            <p className="pointer-events-none select-none blur-[6px] text-base font-medium leading-relaxed text-foreground">
                                {snapshot.overallStrategy}
                            </p>
                            {showUnlockActions && onUnlock && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <button
                                        onClick={onUnlock}
                                        className="flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-bold text-background shadow-lg transition-transform hover:scale-105"
                                    >
                                        <Lock className="h-4 w-4" /> Unlock Full Strategy
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
                <div className="flex flex-col gap-4 rounded-[2.5rem] border border-border bg-card p-6 shadow-sm sm:p-8">
                    <div className="flex items-start gap-4">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-secondary text-3xl">
                            {snapshot.missingElement.icon}
                        </div>
                        <div>
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Missing Element</h3>
                            <p className="mt-1 text-base font-bold leading-snug text-foreground">{snapshot.missingElement.text}</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-4 rounded-[2.5rem] border border-border bg-card p-6 shadow-sm sm:p-8">
                    <div className="flex items-start gap-4">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-secondary text-3xl">
                            {snapshot.overloadedElement.icon}
                        </div>
                        <div>
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Overloaded</h3>
                            <p className="mt-1 text-base font-bold leading-snug text-foreground">{snapshot.overloadedElement.text}</p>
                        </div>
                    </div>
                </div>
            </div>

            {isHistoryVariant ? (
                <div className="rounded-[2.75rem] border border-foreground/10 bg-foreground p-6 text-background shadow-xl sm:p-10">
                    <div className="max-w-3xl">
                        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-background/65">You are viewing Free Report</p>
                        <h3 className="mt-3 text-2xl font-bold sm:text-3xl">Upgrade to unlock the part that tells you exactly what to change.</h3>
                        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-background/75 sm:text-base">
                            Your free report keeps the score and preview. The full version adds the missing why, where, and next-step plan.
                        </p>
                    </div>

                    <div className="mt-8 grid gap-4 sm:grid-cols-2">
                        <div className="rounded-[1.5rem] border border-background/10 bg-background/5 p-5">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-background/55">Included now</p>
                            <div className="mt-4 space-y-3">
                                {freeFeatures.slice(0, 4).map((item) => (
                                    <div key={item} className="flex items-start gap-3">
                                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-background/75" />
                                        <span className="text-sm text-background/82">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-[1.5rem] border border-background/20 bg-background px-5 py-6 text-foreground shadow-lg">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Upgrade for $9</p>
                            <div className="mt-4 space-y-3">
                                {[
                                    "Full dimension explanations",
                                    "Room-by-room remedy guidance",
                                    "AI strategy and 5-step plan",
                                    "Matched product suggestions",
                                ].map((item) => (
                                    <div key={item} className="flex items-start gap-3">
                                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 fill-foreground text-background" />
                                        <span className="text-sm font-semibold text-foreground">{item}</span>
                                    </div>
                                ))}
                            </div>

                            {onUnlock && (
                                <button
                                    onClick={onUnlock}
                                    disabled={isUpgrading}
                                    className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-sm font-bold text-background transition-transform hover:scale-[1.01] disabled:opacity-60"
                                >
                                    {isUpgrading ? "Connecting to secure payment..." : "Upgrade to Full Report"}
                                    {!isUpgrading && <ArrowRight className="h-4 w-4" />}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="rounded-[2.5rem] border border-border bg-secondary/50 p-6 sm:p-10">
                    <h3 className="mb-6 text-center text-lg font-bold text-foreground">What You Get</h3>
                    <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
                        <div className="rounded-[1.5rem] border border-border/50 bg-card p-6">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Free Preview</span>
                            <div className="mt-4 space-y-3">
                                {freeFeatures.map((item) => (
                                    <div key={item} className="flex items-start gap-3">
                                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 fill-muted text-card-foreground" />
                                        <span className="text-sm text-foreground/80">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="relative rounded-[1.5rem] border-2 border-foreground bg-card p-6 shadow-xl">
                            <div className="absolute -top-3 left-6 rounded-full bg-foreground px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-background">
                                Recommended
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-foreground">Full Report — $9</span>
                            <div className="mt-4 space-y-3">
                                {paidFeatures.map((item) => (
                                    <div key={item} className="flex items-start gap-3">
                                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 fill-foreground text-background" />
                                        <span className="text-sm font-bold text-foreground">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showUnlockActions && onUnlock && (
                <div className="relative flex flex-col items-center overflow-hidden rounded-[3rem] border border-border bg-foreground p-6 text-center text-background sm:p-12">
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full border border-background/10 bg-background/5 text-background">
                            <Lock className="h-6 w-6" />
                        </div>

                        <h2 className="mb-3 font-heading text-2xl font-bold sm:text-3xl">Unlock Your Full Space Report</h2>
                        <p className="mb-8 max-w-lg text-balance text-sm text-background/70 sm:text-base">
                            Get the complete AI analysis with detailed evaluations, strategic roadmap, 5-step blueprint,
                            specific product recommendations, and placement guides.
                        </p>

                        {weakestDim && (
                            <div className="mb-8 w-full max-w-sm rounded-2xl border border-background/10 bg-background/5 p-5 text-left">
                                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-background/70">Your Biggest Opportunity</p>
                                <p className="text-sm font-bold text-background">
                                    {getDimensionMeta(weakestDim.key).label} scored {weakestDim.score}/100
                                </p>
                                <p className="mt-1.5 text-xs leading-relaxed text-background/78">
                                    The Full Report contains a targeted action plan to improve this dimension by 20-40 points.
                                </p>
                            </div>
                        )}

                        <button
                            onClick={onUnlock}
                            className="group inline-flex h-14 w-full items-center justify-center gap-3 rounded-full bg-background px-6 text-base font-bold text-foreground shadow-2xl transition-transform hover:scale-[1.02] sm:h-16 sm:w-auto sm:px-10 sm:text-lg"
                        >
                            Unlock Full Report — $9
                            <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-1" />
                        </button>
                        <p className="mt-5 text-[10px] font-bold uppercase tracking-widest text-background/60">
                            One-time payment • vs. hiring a consultant ($200+/hr)
                        </p>
                    </div>
                </div>
            )}
        </>
    );
}
