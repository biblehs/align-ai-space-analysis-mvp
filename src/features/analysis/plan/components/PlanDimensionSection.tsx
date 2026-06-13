"use client";

import { motion } from "framer-motion";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Eye, Sparkles, TrendingUp } from "lucide-react";
import type { SnapshotResult } from "@/types";
import type { DimensionKey, DimensionValue } from "@/features/analysis/reporting/report-helpers";
import { getDimensionMeta } from "@/features/analysis/reporting/report-helpers";

type PlanDimensionSectionProps = {
    snapshot: SnapshotResult;
    chartData: Array<{ name: string; value: number; color: string; fullMark: number }>;
    dimensionEntries: [DimensionKey, DimensionValue][];
};

export function PlanDimensionSection({
    snapshot,
    chartData,
    dimensionEntries,
}: PlanDimensionSectionProps) {
    return (
        <div className="rounded-[2.5rem] border border-border bg-card p-6 text-foreground shadow-sm sm:p-10">
            <h2 className="mb-2 flex items-center gap-2 text-xl font-bold">
                <Eye className="h-5 w-5 text-primary" /> Detailed Dimension Analysis
            </h2>
            <p className="mb-10 text-sm text-muted-foreground">
                Complete AI-powered analysis with specific observations and recommendations for each dimension.
            </p>

            <div className="mb-8 h-52 w-full sm:mb-10 sm:h-40">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                        <XAxis type="number" hide domain={[0, 100]} />
                        <YAxis
                            dataKey="name"
                            type="category"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "var(--muted-foreground)", fontSize: 12, fontWeight: 700 }}
                            width={110}
                        />
                        <Tooltip
                            cursor={{ fill: "transparent" }}
                            contentStyle={{ borderRadius: "1rem", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                        />
                        <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={20}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
                {dimensionEntries.map(([key, data]) => {
                    const meta = getDimensionMeta(key);
                    const Icon = meta.icon;

                    return (
                        <motion.div
                            key={key}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-[1.5rem] border border-border/70 bg-card p-6 shadow-sm"
                        >
                            <div className="mb-4 flex items-center gap-4">
                                <div className={`flex h-12 w-12 items-center justify-center rounded-[1rem] ${meta.bgColor}`}>
                                    <Icon className={`h-5 w-5 ${meta.iconColor}`} />
                                </div>
                                <div>
                                    <span className="mb-0.5 block text-sm font-bold">{meta.label}</span>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-2xl font-black leading-none" style={{ color: meta.barColor }}>
                                            {data.score}
                                        </span>
                                        <span className="mt-1 text-[10px] font-bold text-foreground/40">/100</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${data.score}%` }}
                                    transition={{ duration: 1.2, ease: "easeOut" }}
                                    className="h-full rounded-full"
                                    style={{ backgroundColor: meta.barColor }}
                                />
                            </div>
                            <p className="text-sm font-medium leading-relaxed text-foreground">{data.evaluation}</p>
                        </motion.div>
                    );
                })}
            </div>

            {snapshot.overallStrategy && (
                <div className="mt-10 border-t border-border pt-8">
                    <h4 className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        <TrendingUp className="h-4 w-4 text-primary" /> AI Strategic Roadmap
                    </h4>
                    <p className="border-l-2 border-primary/30 py-1 pl-6 text-base font-medium leading-relaxed">
                        {snapshot.overallStrategy}
                    </p>
                </div>
            )}

            {snapshot.stressImpact && (
                <div className="mt-8 rounded-[1.5rem] border border-insight-brick/20 bg-insight-brick/5 p-6">
                    <h4 className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-insight-brick">
                        <Sparkles className="h-4 w-4" /> Energy Impact Analysis
                    </h4>
                    <p className="text-sm font-medium leading-relaxed text-foreground/80">{snapshot.stressImpact}</p>
                </div>
            )}
        </div>
    );
}
