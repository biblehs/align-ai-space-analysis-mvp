"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { CheckCircle2, ChevronRight, Crosshair, Lightbulb, Share2 } from "lucide-react";
import Image from "next/image";
import type { PlanStep } from "@/types";

type PlanBlueprintSectionsProps = {
    planSteps: PlanStep[];
    iconMap: Record<string, LucideIcon>;
    showProductLinks?: boolean;
    showFooterActions?: boolean;
};

function getEstimatedTotal(planSteps: PlanStep[]) {
    return planSteps.reduce((acc, step) => {
        const costMatch = step.costRange.match(/\$([0-9]+)/);
        return acc + (costMatch ? parseInt(costMatch[1], 10) : 0);
    }, 0);
}

export function PlanBlueprintSections({
    planSteps,
    iconMap,
    showProductLinks = true,
    showFooterActions = true,
}: PlanBlueprintSectionsProps) {
    return (
        <>
            <div className="rounded-[2rem] border border-border bg-card p-6 text-foreground shadow-sm sm:p-8">
                <h2 className="mb-3 flex items-center gap-2 text-xl font-bold">
                    <Lightbulb className="h-6 w-6 text-accent" /> Your Personalized Blueprint
                </h2>
                <p className="text-sm font-medium leading-relaxed text-muted-foreground">
                    Based on your ALIGN AI analysis, we&apos;ve designed a targeted improvement plan that blends
                    spatial design, energy support, ritual atmosphere, and wellness-oriented interventions. Each step
                    addresses a different layer of the room — from layout and light to emotional anchors, grounding
                    objects, and restorative cues. Follow the steps in order to gradually shift the room&apos;s
                    function, feeling, and energetic tone.
                </p>

                {planSteps.length > 0 && (
                    <div className="mt-5 inline-flex self-start rounded-full border border-border/50 bg-secondary/30 px-4 py-2 text-sm text-muted-foreground">
                        <span className="font-bold">{planSteps.length} Steps</span>
                        <span className="mx-4 opacity-30">•</span>
                        <span className="font-bold">
                            Est. Total:
                            <span className="ml-1 border-b border-dashed border-foreground/30 pb-0.5 text-foreground">
                                ~${getEstimatedTotal(planSteps)}
                            </span>
                        </span>
                    </div>
                )}
            </div>

            <div className="space-y-5 pt-2 sm:space-y-6">
                {planSteps.map((step, index) => (
                    <motion.div
                        key={step.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="relative overflow-hidden rounded-[2.5rem] border border-border bg-card p-5 shadow-sm transition-all hover:border-border/80 hover:shadow-lg sm:p-10"
                    >
                        <div className="flex flex-col gap-6 sm:flex-row sm:gap-10">
                            <div className="flex items-start gap-4 sm:w-1/3 sm:gap-5">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.2rem] bg-foreground text-background shadow-md sm:h-16 sm:w-16">
                                    {(() => {
                                        const StepIcon = iconMap[step.iconName] || Crosshair;
                                        return <StepIcon className="h-7 w-7" />;
                                    })()}
                                </div>

                                <div className="space-y-1.5 pt-1">
                                    <span className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                        Step {step.id}
                                    </span>
                                    <h3 className="pr-2 text-lg font-bold leading-tight text-foreground sm:pr-4 sm:text-xl">
                                        {step.title}
                                    </h3>
                                    <div className="mt-2 inline-flex items-center rounded-full border border-border/50 bg-secondary/70 px-3 py-1 text-[11px] font-bold text-foreground/80">
                                        {step.costRange}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-1 flex-col justify-center space-y-5 sm:space-y-6">
                                <div className="rounded-[1.2rem] border border-border/50 bg-secondary/40 p-4 sm:p-5">
                                    <h4 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">The Why</h4>
                                    <p className="text-sm font-medium leading-relaxed text-foreground/90">{step.reason}</p>
                                </div>

                                <div className="px-1">
                                    <h4 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">The Action</h4>
                                    <p className="text-base font-medium text-foreground text-balance">{step.action}</p>
                                </div>

                                {step.productRecommendation && (
                                    <div className="mt-2 flex flex-col gap-3 border-t border-border pt-5">
                                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Product Suggestion</h4>
                                        {showProductLinks ? (
                                            <a
                                                href={step.productRecommendation.affiliateUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-2 pr-3 shadow-sm transition-colors hover:bg-secondary/30 hover:shadow-md sm:gap-4 sm:pr-4"
                                            >
                                                <Image
                                                    src={step.productRecommendation.imageUrl}
                                                    alt={step.productRecommendation.name}
                                                    width={64}
                                                    height={64}
                                                    sizes="64px"
                                                    className="h-16 w-16 rounded-xl object-cover"
                                                />
                                                <div className="flex-1">
                                                    <p className="line-clamp-1 text-sm font-bold transition-colors group-hover:text-primary">
                                                        {step.productRecommendation.name}
                                                    </p>
                                                    <p className="mt-1 text-xs text-muted-foreground">${step.productRecommendation.price}</p>
                                                </div>
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary transition-all group-hover:bg-foreground group-hover:text-background">
                                                    <ChevronRight className="h-4 w-4" />
                                                </div>
                                            </a>
                                        ) : (
                                            <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-2 pr-3 shadow-sm sm:gap-4 sm:pr-4">
                                                <Image
                                                    src={step.productRecommendation.imageUrl}
                                                    alt={step.productRecommendation.name}
                                                    width={64}
                                                    height={64}
                                                    sizes="64px"
                                                    className="h-16 w-16 rounded-xl object-cover"
                                                />
                                                <div className="flex-1">
                                                    <p className="line-clamp-1 text-sm font-bold text-foreground">
                                                        {step.productRecommendation.name}
                                                    </p>
                                                    <p className="mt-1 text-xs text-muted-foreground">${step.productRecommendation.price}</p>
                                                </div>
                                                <div className="rounded-full bg-secondary px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                                    Suggested
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {showFooterActions && (
                <div className="relative mt-14 overflow-hidden rounded-[3rem] bg-foreground p-6 text-center text-background shadow-lg print:hidden sm:mt-24 sm:p-16">
                    <div className="relative z-10 mx-auto flex max-w-xl flex-col items-center">
                        <h2 className="mb-4 font-heading text-3xl font-bold tracking-tight text-balance sm:text-5xl">
                            Commit to the Process
                        </h2>
                        <p className="mb-8 text-base text-background/70 sm:mb-10 sm:text-lg">
                            Meaningful change starts with action. Your space is ready to evolve — start with Step 1 today
                            and feel the shift within 48 hours.
                        </p>

                        <div className="flex w-full flex-col justify-center gap-3 sm:flex-row sm:gap-4">
                            <button className="flex w-full items-center justify-center gap-2 rounded-full bg-background px-8 py-4 font-bold text-foreground shadow-xl transition-transform hover:scale-105 sm:w-auto">
                                <CheckCircle2 className="h-5 w-5" /> I will start today
                            </button>
                            <button className="mt-0 flex w-full items-center justify-center gap-2 rounded-full border border-background/20 bg-transparent px-8 py-4 font-bold text-background transition-colors hover:bg-background/10 sm:w-auto">
                                <Share2 className="h-5 w-5" /> Share Report
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
