"use client";

import { motion } from "framer-motion";
import { Download, Share2, Sparkles, User, Zap } from "lucide-react";
import type { SnapshotResult } from "@/types";

type SnapshotScoreSectionProps = {
    snapshot: SnapshotResult;
    themeRatingColor: string;
    isExporting: boolean;
    isSharing: boolean;
    onDownload: () => void;
    onShare: () => void;
    showActions?: boolean;
};

export function SnapshotScoreSection({
    snapshot,
    themeRatingColor,
    isExporting,
    isSharing,
    onDownload,
    onShare,
    showActions = true,
}: SnapshotScoreSectionProps) {
    return (
        <div className="relative flex flex-col overflow-hidden rounded-[2.5rem] bg-foreground p-6 text-background shadow-2xl sm:p-10">
            <div className="z-10 mb-6 flex w-full flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
                <div>
                    <h3 className="mb-1 text-xl font-bold">Balance Score</h3>
                    <p className="text-sm text-background/75">How well your space supports your goal.</p>
                </div>
                <div className="flex flex-col text-left sm:text-right">
                    <motion.span
                        className="font-heading text-5xl font-bold"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: "spring", duration: 0.8 }}
                    >
                        {snapshot.score}
                        <span className="text-2xl font-normal text-background/60">/100</span>
                    </motion.span>
                    <span className={`mt-1 inline-block self-end rounded-full bg-background/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm ${themeRatingColor}`}>
                        {snapshot.ratingLabel}
                    </span>
                </div>
            </div>

            <div className="mb-6 flex items-start gap-4 rounded-[1.5rem] bg-background/5 p-5">
                <div className="rounded-full bg-background/10 p-3">
                    <User className="h-6 w-6 text-background" />
                </div>
                <div>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-background/70">Your Space Archetype</p>
                    <p className="text-lg font-bold">{snapshot.archetype}</p>
                    <p className="mt-1 text-sm text-background/70">{snapshot.archetypeDesc}</p>
                </div>
            </div>

            <div className="mb-6 flex items-start gap-4 rounded-[1.5rem] bg-background/5 p-5">
                <div className="rounded-full bg-insight-brick/20 p-3">
                    <Zap className="h-6 w-6 text-insight-brick" />
                </div>
                <div>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-background/70">Energy Impact</p>
                    <p className="text-sm font-medium text-background/90">{snapshot.stressImpact}</p>
                </div>
            </div>

            <div className="space-y-5 rounded-[2rem] bg-background p-5 text-foreground sm:space-y-6 sm:p-8">
                <div className="flex items-start gap-4">
                    <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-insight-sage/20 text-insight-sage">
                        <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                        <h4 className="mb-2 text-lg font-bold">Your Free Insight</h4>
                        <p className="text-sm font-medium leading-relaxed text-muted-foreground">{snapshot.freeInsight}</p>
                    </div>
                </div>

                {snapshot.integratedReading && (
                    <div className="rounded-[1.5rem] border border-border bg-secondary/30 p-4">
                        <h4 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Extended Reading</h4>
                        <p className="text-sm leading-relaxed text-foreground/80">{snapshot.integratedReading}</p>
                    </div>
                )}

                {snapshot.sceneFingerprint && snapshot.sceneFingerprint.length > 0 && (
                    <div className="rounded-[1.5rem] border border-border bg-secondary/20 p-4">
                        <h4 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">What The AI Actually Noticed</h4>
                        <div className="space-y-2">
                            {snapshot.sceneFingerprint.slice(0, 3).map((item, index) => (
                                <p key={`${item}-${index}`} className="text-sm leading-relaxed text-foreground/80">
                                    • {item}
                                </p>
                            ))}
                        </div>
                    </div>
                )}

                {showActions && (
                    <div className="border-t border-border pt-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                            <button
                                onClick={onDownload}
                                disabled={isExporting}
                                className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-foreground bg-transparent px-6 py-3 text-sm font-bold text-foreground transition-all hover:bg-foreground hover:text-background active:scale-[0.98] disabled:opacity-50"
                            >
                                {isExporting ? (
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                ) : (
                                    <Download className="h-4 w-4" />
                                )}
                                {isExporting ? "Generating..." : "Save Free Report Image"}
                            </button>
                            <button
                                onClick={onShare}
                                disabled={isSharing}
                                className="flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-bold text-background transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50"
                            >
                                {isSharing ? (
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                ) : (
                                    <Share2 className="h-4 w-4" />
                                )}
                                {isSharing ? "Preparing..." : "Share Free Report"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
