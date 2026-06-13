"use client";

import { motion } from "framer-motion";
import {
    ArrowRight,
    BedDouble,
    Download,
    Eye,
    LampFloor,
    Layers3,
    Lock,
    MoonStar,
    ScanSearch,
    Share2,
    Sparkles,
    Square,
    Target,
    Waves,
} from "lucide-react";
import type { SnapshotResultV2 } from "@/lib/align-v2/contracts";
import { buildSnapshotV2ViewModel } from "@/features/analysis/snapshot/snapshot-v2-view-model";

type SnapshotV2SectionProps = {
    snapshot: SnapshotResultV2;
    isExporting: boolean;
    isSharing: boolean;
    onDownload: () => void;
    onShare: () => void;
    onUnlock?: () => void;
    showActions?: boolean;
    showUnlockActions?: boolean;
    variant?: "default" | "history";
    isUpgrading?: boolean;
};

function impactTone(impact: "positive" | "negative" | "mixed") {
    if (impact === "positive") {
        return {
            badge: "bg-[#edf3ee] text-[#546a59]",
            accent: "bg-[#dbe8dc]",
        };
    }

    if (impact === "negative") {
        return {
            badge: "bg-[#f7eee7] text-[#8e654e]",
            accent: "bg-[#ead7c7]",
        };
    }

    return {
        badge: "bg-[#f0ede8] text-[#73675e]",
        accent: "bg-[#e3ddd4]",
    };
}

function dimensionTone(level: "strong" | "medium" | "weak") {
    if (level === "strong") {
        return "bg-[#8a9a86]";
    }

    if (level === "medium") {
        return "bg-[#c99d7f]";
    }

    return "bg-[#b57a66]";
}

function ProofIcon({ label, evidence }: { label: string; evidence: string }) {
    const signal = `${label} ${evidence}`.toLowerCase();

    if (signal.includes("light") || signal.includes("glare") || signal.includes("bright")) {
        return <LampFloor className="h-4.5 w-4.5" />;
    }

    if (signal.includes("bed") || signal.includes("rest") || signal.includes("seat")) {
        return <BedDouble className="h-4.5 w-4.5" />;
    }

    if (signal.includes("wall") || signal.includes("surface")) {
        return <Square className="h-4.5 w-4.5" />;
    }

    if (signal.includes("density") || signal.includes("object") || signal.includes("cluster")) {
        return <Layers3 className="h-4.5 w-4.5" />;
    }

    return <Eye className="h-4.5 w-4.5" />;
}

export function SnapshotV2Section({
    snapshot,
    isExporting,
    isSharing,
    onDownload,
    onShare,
    onUnlock,
    showActions = true,
    showUnlockActions = true,
    variant = "default",
    isUpgrading = false,
}: SnapshotV2SectionProps) {
    const viewModel = buildSnapshotV2ViewModel(snapshot);
    const historyVariant = variant === "history";

    return (
        <div className="space-y-6 sm:space-y-7">
            <article className="overflow-hidden rounded-[2.7rem] border border-[#e8e0d7] bg-[linear-gradient(180deg,#fcfaf7_0%,#f7f2eb_100%)] shadow-[0_28px_80px_rgba(47,46,44,0.08)]">
                <section className="grid gap-6 px-6 py-6 sm:px-8 sm:py-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)] lg:gap-8">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#8f8278]">
                            {viewModel.hero.eyebrow}
                        </p>
                        <h2 className="mt-4 font-serif text-[2.8rem] italic leading-[0.94] tracking-[-0.04em] text-[#2f2b28] sm:text-[3.6rem]">
                            {viewModel.hero.title}
                        </h2>
                        <p className="mt-4 max-w-2xl text-[1.18rem] leading-8 text-[#4c443e] sm:text-[1.25rem]">
                            {viewModel.hero.subtitle}
                        </p>
                        <div className="mt-5 flex flex-wrap gap-2.5">
                            {viewModel.hero.tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="inline-flex items-center rounded-full border border-[#e3dbd1] bg-white/75 px-3 py-2 text-[11px] leading-5 text-[#5d534c]"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-[2rem] border border-[#e7ddd3] bg-white/72 p-5 sm:p-6">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#92867c]">
                                    Current space state
                                </p>
                                <h3 className="mt-3 max-w-[18rem] text-[1.65rem] font-semibold leading-[1.18] tracking-[-0.03em] text-[#312c28]">
                                    {viewModel.spaceState.title}
                                </h3>
                            </div>
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f2ece5] text-[#7e6b5d]">
                                <MoonStar className="h-5 w-5" />
                            </div>
                        </div>

                        <div className="mt-6 grid gap-4 border-t border-[#eee5db] pt-5 sm:grid-cols-2">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#96897f]">
                                    Strongest
                                </p>
                                <p className="mt-2 text-[1rem] font-semibold text-[#322d29]">
                                    {viewModel.spaceState.strongest}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#96897f]">
                                    Current gap
                                </p>
                                <p className="mt-2 text-[1rem] font-semibold text-[#322d29]">
                                    {viewModel.spaceState.weakest}
                                </p>
                            </div>
                        </div>

                        <p className="mt-5 text-[0.83rem] uppercase tracking-[0.16em] text-[#9f9084]">
                            {viewModel.hero.balanceNote}
                        </p>
                    </div>
                </section>

                <section className="border-t border-[#eadfd6] px-6 py-6 sm:px-8 sm:py-8">
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)] lg:gap-8">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8d8076]">
                                {viewModel.summary.eyebrow}
                            </p>
                            <h3 className="mt-3 max-w-3xl text-[1.95rem] font-semibold leading-[1.14] tracking-[-0.035em] text-[#302b28] sm:text-[2.15rem]">
                                {viewModel.summary.title}
                            </h3>
                            <div className="mt-5 max-w-3xl space-y-4 text-[1rem] leading-8 text-[#574e47]">
                                {viewModel.summary.paragraphs.map((paragraph) => (
                                    <p key={paragraph}>{paragraph}</p>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-[1.7rem] border border-[#e7ddd3] bg-[#fbf8f4]/90 p-5">
                            <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#8d8076]">
                                <Waves className="h-3.5 w-3.5" />
                                Reading note
                            </p>
                            <p className="mt-4 text-[0.98rem] leading-7 text-[#5b514a]">
                                {viewModel.spaceState.coreGap}
                            </p>
                        </div>
                    </div>
                </section>

                <section className="border-t border-[#eadfd6] px-6 py-6 sm:px-8 sm:py-8">
                    <div className="flex items-start justify-between gap-5">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8d8076]">
                                {viewModel.proof.eyebrow}
                            </p>
                            <h3 className="mt-3 text-[1.75rem] font-semibold tracking-[-0.03em] text-[#302b28] sm:text-[1.95rem]">
                                {viewModel.proof.title}
                            </h3>
                            <p className="mt-3 max-w-2xl text-[0.98rem] leading-7 text-[#655b54]">
                                {viewModel.proof.intro}
                            </p>
                        </div>
                        <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f2ece5] text-[#7e6b5d] lg:flex">
                            <ScanSearch className="h-5 w-5" />
                        </div>
                    </div>

                    <div className="mt-6 grid gap-4 lg:grid-cols-3">
                        {viewModel.proof.items.map((item, index) => {
                            const tone = impactTone(item.impact);

                            return (
                                <motion.div
                                    key={`${item.label}-${index}`}
                                    initial={{ opacity: 0, y: 14 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.06, duration: 0.4 }}
                                    className="rounded-[1.65rem] border border-[#e7ddd3] bg-white/78 p-5"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${tone.accent} text-[#6c5d52]`}>
                                            <ProofIcon label={item.label} evidence={item.evidence} />
                                        </div>
                                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${tone.badge}`}>
                                            {item.impact}
                                        </span>
                                    </div>
                                    <h4 className="mt-4 text-[1.05rem] font-semibold tracking-[-0.02em] text-[#302b28]">
                                        {item.label}
                                    </h4>
                                    <p className="mt-3 text-[0.95rem] leading-7 text-[#5f554f]">
                                        {item.evidence}
                                    </p>
                                </motion.div>
                            );
                        })}
                    </div>
                </section>

                <section className="border-t border-[#eadfd6] px-6 py-6 sm:px-8 sm:py-8">
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-8">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8d8076]">
                                {viewModel.spaceState.eyebrow}
                            </p>
                            <h3 className="mt-3 text-[1.75rem] font-semibold tracking-[-0.03em] text-[#302b28]">
                                {viewModel.spaceState.title}
                            </h3>
                            <p className="mt-3 max-w-xl text-[0.98rem] leading-7 text-[#625850]">
                                {viewModel.spaceState.subtitle}
                            </p>
                            <p className="mt-4 text-[0.8rem] uppercase tracking-[0.16em] text-[#9c8e83]">
                                {viewModel.spaceState.balanceNote}
                            </p>

                            <div className="mt-6 grid gap-4 sm:grid-cols-2">
                                <div className="rounded-[1.5rem] border border-[#e7ddd3] bg-white/72 p-4">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#94877d]">
                                        Strongest
                                    </p>
                                    <p className="mt-2 text-[1rem] font-semibold text-[#302b28]">
                                        {viewModel.spaceState.strongest}
                                    </p>
                                </div>
                                <div className="rounded-[1.5rem] border border-[#e7ddd3] bg-white/72 p-4">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#94877d]">
                                        Current gap
                                    </p>
                                    <p className="mt-2 text-[1rem] font-semibold text-[#302b28]">
                                        {viewModel.spaceState.weakest}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="space-y-4">
                                {viewModel.spaceState.dimensions.map((item) => (
                                    <div key={item.key} className="rounded-[1.45rem] border border-[#e7ddd3] bg-white/72 p-4">
                                        <div className="flex items-end justify-between gap-4">
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#94877d]">
                                                    {item.label}
                                                </p>
                                                <p className="mt-2 text-[0.92rem] leading-6 text-[#6a6058]">
                                                    {item.summary}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[1.45rem] font-semibold tracking-[-0.03em] text-[#302b28]">
                                                    {item.score}
                                                </span>
                                                <span className="ml-1 text-[0.72rem] uppercase tracking-[0.16em] text-[#9b8d82]">
                                                    /100
                                                </span>
                                            </div>
                                        </div>
                                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#ece3da]">
                                            <div
                                                className={`h-full rounded-full ${dimensionTone(item.level)}`}
                                                style={{ width: `${item.score}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="border-t border-[#eadfd6] px-6 py-6 sm:px-8 sm:py-8">
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.96fr)_minmax(0,1.04fr)] lg:gap-8">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8d8076]">
                                {viewModel.firstShift.eyebrow}
                            </p>
                            <h3 className="mt-3 text-[1.85rem] font-semibold tracking-[-0.03em] text-[#302b28]">
                                {viewModel.firstShift.title}
                            </h3>
                            <p className="mt-4 text-[1rem] leading-8 text-[#554c45]">
                                {viewModel.firstShift.action}
                            </p>
                        </div>

                        <div className="rounded-[1.8rem] border border-[#e5dbd1] bg-white/78 p-5 sm:p-6">
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f2e7db] text-[#7d6656]">
                                    <Target className="h-4.5 w-4.5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#95877c]">
                                        Target zone
                                    </p>
                                    <p className="mt-2 text-[0.96rem] leading-7 text-[#534a43]">
                                        {viewModel.firstShift.targetZone}
                                    </p>
                                </div>
                            </div>

                            {viewModel.firstShift.examples.length > 0 ? (
                                <div className="mt-5 flex flex-wrap gap-2.5">
                                    {viewModel.firstShift.examples.map((example) => (
                                        <span
                                            key={example}
                                            className="inline-flex items-center rounded-full border border-[#eadfd4] bg-[#f7f2eb] px-3 py-2 text-[11px] leading-5 text-[#675c53]"
                                        >
                                            {example}
                                        </span>
                                    ))}
                                </div>
                            ) : null}

                            <p className="mt-5 text-[0.95rem] leading-7 text-[#60564f]">
                                {viewModel.firstShift.whyItHelps}
                            </p>
                            <p className="mt-4 text-[0.95rem] leading-7 text-[#4f463f]">
                                {viewModel.firstShift.supportingLine}
                            </p>
                        </div>
                    </div>
                </section>

                <section className="border-t border-[#eadfd6] px-6 py-6 sm:px-8 sm:py-8">
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.04fr)_minmax(18rem,0.96fr)] lg:gap-8">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8d8076]">
                                {viewModel.cta.eyebrow}
                            </p>
                            <h3 className="mt-3 max-w-2xl text-[1.95rem] font-semibold tracking-[-0.035em] text-[#302b28] sm:text-[2.15rem]">
                                {viewModel.cta.title}
                            </h3>
                            <p className="mt-4 max-w-3xl text-[1rem] leading-8 text-[#564d46]">
                                {viewModel.cta.body}
                            </p>

                            <div className="mt-5 flex flex-wrap gap-2.5">
                                {viewModel.cta.signals.map((signal) => (
                                    <span
                                        key={signal}
                                        className="inline-flex items-center rounded-full border border-[#e3dbd1] bg-white/75 px-3 py-2 text-[11px] leading-5 text-[#60564f]"
                                    >
                                        {signal}
                                    </span>
                                ))}
                            </div>

                            <div className="mt-6 rounded-[1.65rem] border border-[#e7ddd3] bg-white/76 p-5">
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8f8278]">
                                    {viewModel.cta.teaserTitle}
                                </p>
                                <div className="mt-4 space-y-3">
                                    {viewModel.cta.hiddenFindings.map((item) => (
                                        <div key={item} className="flex gap-3">
                                            <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#b18a72]" />
                                            <p className="text-[0.95rem] leading-7 text-[#5a514a]">
                                                {item}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                                <p className="mt-5 text-[0.95rem] leading-7 text-[#665c55]">
                                    {viewModel.cta.supportingLine}
                                </p>
                            </div>

                            {viewModel.notes.length > 0 ? (
                                <div className="mt-5 space-y-2">
                                    {viewModel.notes.map((item) => (
                                        <p key={item} className="text-[0.88rem] leading-7 text-[#7a6f66]">
                                            {item}
                                        </p>
                                    ))}
                                </div>
                            ) : null}
                        </div>

                        <div className="rounded-[2rem] bg-[#342f2b] p-5 text-[#f7f1eb] shadow-[0_18px_50px_rgba(47,46,44,0.12)] sm:p-6">
                            <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#f7f1eb]/58">
                                <Lock className="h-3.5 w-3.5" />
                                Full report
                            </p>

                            <p className="mt-4 text-[1.02rem] leading-7 text-[#f7f1eb]/78">
                                See the deeper room reading, the key friction points, and the most effective next shifts for sleep, calm, and recovery.
                            </p>

                            {showUnlockActions && onUnlock ? (
                                <button
                                    onClick={onUnlock}
                                    disabled={isUpgrading}
                                    className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#f6eee5] px-5 text-sm font-bold text-[#342f2b] transition-transform hover:scale-[1.01] disabled:opacity-60"
                                >
                                    {historyVariant
                                        ? (isUpgrading ? "Connecting to secure payment..." : viewModel.cta.ctaText)
                                        : (isUpgrading ? "Unlocking..." : viewModel.cta.ctaText)}
                                    {!isUpgrading && <ArrowRight className="h-4 w-4" />}
                                </button>
                            ) : null}

                            {showActions ? (
                                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                    <button
                                        onClick={onDownload}
                                        disabled={isExporting}
                                        className="flex h-11 items-center justify-center gap-2 rounded-full border border-white/12 bg-white/5 px-4 text-sm font-semibold text-[#f7f1eb] transition-colors hover:bg-white/10 disabled:opacity-60"
                                    >
                                        {isExporting ? (
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                        ) : (
                                            <Download className="h-4 w-4" />
                                        )}
                                        {isExporting ? "Generating..." : "Save"}
                                    </button>

                                    <button
                                        onClick={onShare}
                                        disabled={isSharing}
                                        className="flex h-11 items-center justify-center gap-2 rounded-full border border-white/12 bg-white/5 px-4 text-sm font-semibold text-[#f7f1eb] transition-colors hover:bg-white/10 disabled:opacity-60"
                                    >
                                        {isSharing ? (
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                        ) : (
                                            <Share2 className="h-4 w-4" />
                                        )}
                                        {isSharing ? "Preparing..." : "Share"}
                                    </button>
                                </div>
                            ) : null}

                            <div className="mt-5 rounded-[1.45rem] border border-white/10 bg-white/[0.06] p-4">
                                <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#f7f1eb]/55">
                                    <Sparkles className="h-3.5 w-3.5" />
                                    Why it matters
                                </p>
                                <p className="mt-3 text-[0.93rem] leading-7 text-[#f7f1eb]/74">
                                    The full report turns this first read into a clearer zone map, a deeper diagnosis, and a calmer next-step path.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </article>
        </div>
    );
}
