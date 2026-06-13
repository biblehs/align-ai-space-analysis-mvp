import { Sparkles } from "lucide-react";
import AppPageIntro from "@/components/app-shell/AppPageIntro";
import type { SnapshotResult } from "@/types";

type SnapshotHeroSectionProps = {
    snapshot: SnapshotResult;
    eyebrow?: string;
    badgeLabel?: string;
    title?: string;
    description?: string;
};

export function SnapshotHeroSection({
    snapshot,
    eyebrow = "Step 3 of 3",
    badgeLabel = "Analysis Complete",
    title = "Space Snapshot",
    description = "Your report is ready. Start with the free snapshot below, then unlock the Full Report for detailed analysis and your personalized action plan.",
}: SnapshotHeroSectionProps) {
    return (
        <AppPageIntro
            eyebrow={eyebrow}
            badge={(
                <div className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-foreground">
                    <Sparkles className="h-4 w-4 text-primary" /> {badgeLabel}
                </div>
            )}
            notice={snapshot.analysisMode === "fallback" ? (
                <div className="mx-auto max-w-2xl rounded-[1.5rem] border border-insight-terracotta/30 bg-surface-sand px-4 py-3 text-left text-sm text-foreground shadow-sm">
                    <p className="font-bold">Image analysis did not complete for this run.</p>
                    <p className="mt-1 text-foreground/75">
                        {snapshot.analysisNotice || "This result is a questionnaire-based estimate, not a full vision analysis."}
                    </p>
                </div>
            ) : null}
            title={title}
            description={description}
            descriptionClassName="max-w-lg text-sm"
        />
    );
}
