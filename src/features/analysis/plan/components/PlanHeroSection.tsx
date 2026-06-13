import { CheckCircle2 } from "lucide-react";
import AppPageIntro from "@/components/app-shell/AppPageIntro";

type PlanHeroSectionProps = {
    eyebrow?: string;
    badgeLabel?: string;
    title?: string;
    description?: string;
};

export function PlanHeroSection({
    eyebrow = "Step 3 of 3",
    badgeLabel = "Report Unlocked",
    title = "Your Space Report",
    description = "Complete AI analysis with detailed evaluations, charts, and a personalized 5-step improvement blueprint.",
}: PlanHeroSectionProps) {
    return (
        <AppPageIntro
            className="pt-6"
            eyebrow={eyebrow}
            eyebrowClassName="text-xs"
            badge={(
                <div className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 fill-foreground text-card" /> {badgeLabel}
                </div>
            )}
            title={title}
            titleClassName="text-4xl sm:text-6xl"
            description={description}
            descriptionClassName="max-w-2xl text-balance text-lg"
        />
    );
}
