"use client";

import { motion } from "framer-motion";
import { ResponsiveContainer, Radar, RadarChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis } from "recharts";
import { Target } from "lucide-react";
import type { SnapshotResult } from "@/types";
import type { RankedDimension } from "@/features/analysis/reporting/report-helpers";
import { getDimensionMeta } from "@/features/analysis/reporting/report-helpers";

type PlanSummarySectionProps = {
    snapshot: SnapshotResult;
    themeRatingColor: string;
    weakestDim: RankedDimension | null;
    strongestDim: RankedDimension | null;
    radarData: Array<{ dimension: string; score: number; fullMark: number }>;
};

export function PlanSummarySection({
    snapshot,
    themeRatingColor,
    weakestDim,
    strongestDim,
    radarData,
}: PlanSummarySectionProps) {
    return (
        <div className="rounded-[2.5rem] bg-foreground p-6 text-background shadow-2xl sm:p-12">
            <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
                <div className="flex-1 space-y-6">
                    <h2 className="flex items-center gap-2 text-xl font-bold">
                        <Target className="h-5 w-5 text-primary" /> Space Analysis Summary
                    </h2>

                    <div className="flex items-center gap-4 border-b border-background/10 pb-6 sm:gap-6">
                        <motion.div
                            className={`text-5xl font-black ${themeRatingColor}`}
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: "spring", duration: 0.8 }}
                        >
                            {snapshot.score}
                            <span className="text-2xl font-normal text-background/60">/100</span>
                        </motion.div>
                        <div className="min-w-0">
                            <div className={`text-[10px] font-bold uppercase tracking-widest ${themeRatingColor}`}>
                                {snapshot.ratingLabel}
                            </div>
                            <p className="text-sm text-background/75">Overall Balance Score</p>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-background/5 bg-background/5 p-5">
                        <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-background/70">Space Archetype</h3>
                        <p className="text-lg font-bold">{snapshot.archetype}</p>
                        <p className="mt-1 text-sm italic leading-relaxed text-background/75">{snapshot.archetypeDesc}</p>
                    </div>

                    {weakestDim && strongestDim && (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="rounded-2xl border border-insight-brick/20 bg-insight-brick/10 p-4">
                                <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-insight-brick">Needs Most Work</p>
                                <p className="text-sm font-bold text-background/90">{getDimensionMeta(weakestDim.key).label}</p>
                                <p className="text-2xl font-black text-insight-brick">{weakestDim.score}</p>
                            </div>
                            <div className="rounded-2xl border border-insight-sage/20 bg-insight-sage/10 p-4">
                                <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-insight-sage">Your Strength</p>
                                <p className="text-sm font-bold text-background/90">{getDimensionMeta(strongestDim.key).label}</p>
                                <p className="text-2xl font-black text-insight-sage">{strongestDim.score}</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex min-h-[280px] flex-1 flex-col items-center justify-center">
                    <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-background/70">Dimension Radar</h3>
                    <ResponsiveContainer width="100%" height={260}>
                        <RadarChart data={radarData} cx="50%" cy="50%">
                            <PolarGrid stroke="rgba(252, 252, 251, 0.15)" />
                            <PolarAngleAxis
                                dataKey="dimension"
                                tick={{ fill: "rgba(252, 252, 251, 0.7)", fontSize: 11, fontWeight: 600 }}
                            />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                            <Radar
                                name="Score"
                                dataKey="score"
                                stroke="var(--insight-sage)"
                                fill="var(--insight-sage)"
                                fillOpacity={0.4}
                                strokeWidth={2}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
