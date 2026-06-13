"use client";

import type { ComparisonSnapshotResultV2 } from "@/lib/align-v2/contracts";

type ComparisonSnapshotSectionProps = {
    comparison: ComparisonSnapshotResultV2;
};

function deltaLabel(change: number) {
    if (change > 0) return `+${change}`;
    if (change < 0) return `${change}`;
    return "0";
}

function deltaTone(change: number) {
    if (change > 0) return "text-insight-sage bg-surface-sage";
    if (change < 0) return "text-insight-brick bg-surface-brick";
    return "text-insight-slate bg-surface-sand";
}

export function ComparisonSnapshotSection({ comparison }: ComparisonSnapshotSectionProps) {
    return (
        <section className="rounded-[2.3rem] border border-border bg-card px-6 py-6 shadow-sm sm:px-8 sm:py-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Progress Since Your Last Reading</p>
            <h3 className="mt-3 max-w-3xl text-2xl font-semibold tracking-tight text-foreground sm:text-[2rem]">
                {comparison.comparison.headline}
            </h3>

            <div className="mt-5 flex flex-wrap gap-2.5">
                {comparison.comparison.summaryTags.map((tag) => (
                    <span
                        key={tag}
                        className="inline-flex items-center rounded-full border border-border bg-secondary/45 px-3 py-2 text-[11px] leading-5 text-foreground/76"
                    >
                        {tag}
                    </span>
                ))}
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                <div className="rounded-[1.7rem] bg-secondary/25 p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Overall change</p>
                    <div className="mt-4 flex items-end gap-3">
                        <span className="text-5xl font-black leading-none tracking-[-0.04em] text-foreground">
                            {comparison.delta.overallScore.current}
                        </span>
                        <span className={`mb-1 inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ${deltaTone(comparison.delta.overallScore.change)}`}>
                            {deltaLabel(comparison.delta.overallScore.change)}
                        </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{comparison.delta.biggestWin}</p>
                    <p className="mt-4 text-sm leading-6 text-foreground/82">{comparison.delta.remainingGap}</p>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {comparison.delta.dimensions.map((item) => (
                        <div key={item.key} className="rounded-[1.5rem] border border-border/70 bg-background/90 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{item.key}</p>
                                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${deltaTone(item.change)}`}>
                                    {deltaLabel(item.change)}
                                </span>
                            </div>
                            <p className="mt-4 text-sm text-foreground/80">
                                {item.previous} → {item.current}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {comparison.whatChanged.length > 0 ? (
                <div className="mt-6 grid gap-3 lg:grid-cols-3">
                    {comparison.whatChanged.map((item) => (
                        <div key={item.label} className="rounded-[1.55rem] border border-border/70 bg-background/90 p-5">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{item.label}</p>
                            <p className="mt-3 text-sm leading-6 text-foreground/82"><strong>Before:</strong> {item.before}</p>
                            <p className="mt-2 text-sm leading-6 text-foreground/82"><strong>Now:</strong> {item.now}</p>
                            <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.impact}</p>
                        </div>
                    ))}
                </div>
            ) : null}

            <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]">
                <div className="rounded-[1.7rem] border border-border/70 bg-secondary/18 p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Still missing</p>
                    <h4 className="mt-3 text-xl font-semibold tracking-tight text-foreground">{comparison.stillMissing.headline}</h4>
                    <div className="mt-4 space-y-3">
                        {comparison.stillMissing.items.map((item) => (
                            <p key={item} className="text-sm leading-6 text-foreground/82">{item}</p>
                        ))}
                    </div>
                </div>

                <div className="rounded-[1.7rem] border border-border/70 bg-secondary/18 p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Next shift</p>
                    <h4 className="mt-3 text-xl font-semibold tracking-tight text-foreground">{comparison.nextShift.title}</h4>
                    <p className="mt-4 text-sm leading-7 text-foreground/84">{comparison.nextShift.action}</p>
                    <p className="mt-4 text-sm leading-6 text-muted-foreground">{comparison.nextShift.whyItHelps}</p>
                    <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{comparison.preview.fullReportPromise}</p>
                </div>
            </div>
        </section>
    );
}
