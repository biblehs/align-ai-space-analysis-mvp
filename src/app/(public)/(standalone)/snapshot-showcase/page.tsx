"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
    ArrowRight,
    BedDouble,
    Eye,
    LampCeiling,
    Lock,
    ScanSearch,
    Share2,
    Sparkles,
    SunMedium,
} from "lucide-react";

const evidenceItems = [
    {
        id: "light",
        number: "01",
        label: "Ceiling glare sets the first mood",
        evidence:
            "The strongest light source is high and exposed. It makes the room read clean, but also a little alert for a sleep space.",
        impact: "pressure",
        marker: "right-[18%] top-[15%]",
        icon: LampCeiling,
    },
    {
        id: "bed",
        number: "02",
        label: "The bed has weight, but not closure",
        evidence:
            "The dark frame gives the room grounding. The unfinished bedding keeps the rest cue from landing completely.",
        impact: "mixed",
        marker: "left-[56%] top-[58%]",
        icon: BedDouble,
    },
    {
        id: "wall",
        number: "03",
        label: "Blank wall space can become warmth",
        evidence:
            "The open wall is not a problem by itself. It is the easiest place to add softness without changing the layout.",
        impact: "opportunity",
        marker: "left-[31%] top-[42%]",
        icon: SunMedium,
    },
];

const storyLines = [
    {
        label: "What is working",
        title: "The room has a simple, readable base.",
        body: "Furniture placement is not fighting the room. The bed, dresser, and open floor leave a clear structure, which means the space does not need a dramatic rearrangement to improve.",
    },
    {
        label: "What is weakening the feeling",
        title: "The sensory layer is too sharp for rest.",
        body: "The ceiling light, bare wall planes, and unfinished bed surface all point in the same direction: the room functions, but it does not yet transition you into a softer evening state.",
    },
    {
        label: "Most useful opportunity",
        title: "Add softness where the eye lands first.",
        body: "The fastest improvement is not more furniture. It is a warmer low light, a more finished bed surface, and one quiet focal point near the bed wall.",
    },
];

const dimensions = [
    { label: "Calm", score: 62, note: "Interrupted by exposed overhead light." },
    { label: "Clarity", score: 74, note: "Layout is easy to read." },
    { label: "Grounding", score: 76, note: "Wood and dark furniture add weight." },
    { label: "Warmth", score: 52, note: "Soft texture is still missing." },
    { label: "Restoration", score: 58, note: "Rest cue needs a clearer ending." },
];

const nextSteps = [
    "Use one low, warm light near the bed instead of the ceiling fixture at night.",
    "Finish the bed surface before sleep so the room visibly closes the day.",
    "Add one soft focal point on the open wall: textile, warm art, or a narrow shelf with one object.",
];

const lockedFindings = [
    "Exact placement for a warm secondary light",
    "Which wall should carry the first softness layer",
    "A 7-day sequence that improves the room without buying too much",
];

function impactClasses(impact: string) {
    if (impact === "opportunity") return "border-[#d8e0cf] bg-[#f3f7ee] text-[#536744]";
    if (impact === "pressure") return "border-[#edd9c9] bg-[#fbefe7] text-[#885640]";
    return "border-[#e2d9cf] bg-[#f8f2eb] text-[#6d6258]";
}

export default function SnapshotShowcasePage() {
    const [activeEvidenceId, setActiveEvidenceId] = useState(evidenceItems[0].id);
    const activeEvidence = useMemo(
        () => evidenceItems.find((item) => item.id === activeEvidenceId) ?? evidenceItems[0],
        [activeEvidenceId],
    );

    return (
        <main className="min-h-screen bg-[#faf7f1] text-[#302b27]">
            <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
                <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[#e7dbcf] pb-5">
                    <div className="max-w-3xl">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8b7b6f]">
                            Your Space Snapshot
                        </p>
                        <h1 className="mt-2 text-3xl font-semibold leading-[1.02] tracking-[-0.045em] text-[#2f2a25] sm:text-4xl">
                            Soft Ground, Bright Edges
                        </h1>
                        <p className="mt-3 max-w-2xl text-[0.98rem] leading-7 text-[#5c5149]">
                            The room already has structure. What it needs is a softer evening signal, not a full redesign.
                        </p>
                    </div>
                    <button className="flex h-10 items-center gap-2 rounded-full border border-[#e1d4c7] bg-[#fffaf4] px-4 text-sm font-semibold text-[#6d5f54] transition hover:bg-[#f2e8de]">
                        <Share2 className="h-4 w-4" />
                        Share
                    </button>
                </header>

                <section className="mt-5 grid gap-7 lg:grid-cols-[minmax(19rem,0.72fr)_minmax(0,1.28fr)] lg:items-start">
                    <div className="overflow-hidden rounded-[28px] border border-[#e5d8cb] bg-[#2e2925] shadow-[0_18px_50px_rgba(54,45,38,0.12)]">
                        <div className="relative aspect-[4/3] min-h-[280px] sm:min-h-[330px] lg:min-h-[360px]">
                            <Image
                                src="/media/prototypes/snapshot-bedroom-generated.jpg"
                                alt="Generated bedroom example used for the public snapshot demonstration"
                                fill
                                priority
                                sizes="(min-width: 1024px) 37vw, 100vw"
                                className="object-cover"
                            />
                            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(38,32,27,0.02)_0%,rgba(38,32,27,0.08)_44%,rgba(38,32,27,0.56)_100%)]" />

                            {evidenceItems.map((item) => {
                                const active = item.id === activeEvidenceId;
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => setActiveEvidenceId(item.id)}
                                        aria-label={`Show evidence: ${item.label}`}
                                        className={`absolute ${item.marker} flex h-9 w-9 items-center justify-center rounded-full border text-[11px] font-bold transition duration-200 ${
                                            active
                                                ? "border-white bg-[#fff6eb] text-[#302b27] shadow-[0_10px_28px_rgba(38,32,27,0.32)]"
                                                : "border-white/75 bg-[#302b27]/45 text-white backdrop-blur-sm hover:bg-[#302b27]/65"
                                        }`}
                                    >
                                        {item.number}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="border-t border-white/10 bg-[#302b27] p-4 text-[#fff7ec]">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#fff7ec]/52">
                                        Active evidence
                                    </p>
                                    <h2 className="mt-1 text-[0.98rem] font-semibold leading-snug text-white">
                                        {activeEvidence.label}
                                    </h2>
                                </div>
                                <span className={`rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] ${impactClasses(activeEvidence.impact)}`}>
                                    {activeEvidence.impact}
                                </span>
                            </div>
                            <p className="mt-2 text-xs leading-5 text-[#fff7ec]/76">{activeEvidence.evidence}</p>
                        </div>
                    </div>

                    <div className="border-y border-[#e2d6ca] py-5 sm:py-6">
                        <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_8.5rem]">
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8b7b6f]">
                                    Snapshot Reading
                                </p>
                                <h2 className="mt-2 text-2xl font-semibold leading-tight tracking-[-0.035em] text-[#2f2a25] sm:text-[1.7rem]">
                                    Clear structure, but the room has not learned how to soften at night.
                                </h2>
                            </div>
                            <div className="border-l border-[#e4d8cb] pl-4">
                                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#8b7b6f]">
                                    Balance
                                </p>
                                <div className="mt-1 flex items-end gap-1">
                                    <span className="text-4xl font-semibold tracking-[-0.06em]">64</span>
                                    <span className="pb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#9a8c80]">/100</span>
                                </div>
                                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#e8ddd1]">
                                    <div className="h-full w-[64%] rounded-full bg-[#8f9b80]" />
                                </div>
                            </div>
                        </div>

                        <div className="my-5 h-px bg-[#e9ded3]" />

                        <p className="text-[0.96rem] leading-7 text-[#5d5148]">
                            This is not a chaotic room. The furniture is legible, the floor still breathes, and the darker bed frame gives the room a grounded center. The issue is more subtle: the room feels finished as a functional bedroom, but not fully finished as a restorative one.
                        </p>

                        <div className="mt-5 grid gap-5 sm:grid-cols-3">
                            {storyLines.map((line) => (
                                <div key={line.label} className="border-t border-[#d8cabe] pt-4">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#928274]">
                                        {line.label}
                                    </p>
                                    <h3 className="mt-2 text-[1rem] font-semibold leading-snug tracking-[-0.02em] text-[#302b27]">
                                        {line.title}
                                    </h3>
                                    <p className="mt-2 text-sm leading-6 text-[#675c52]">{line.body}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="mt-8 grid gap-7 border-t border-[#e4d7ca] pt-7 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                    <div className="lg:border-r lg:border-[#e4d7ca] lg:pr-7">
                        <div className="flex items-center gap-3">
                            <ScanSearch className="h-4 w-4 text-[#8b7b6f]" />
                            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8b7b6f]">
                                What the AI saw
                            </p>
                        </div>
                        <div className="mt-3 divide-y divide-[#eadfd4]">
                            {evidenceItems.map((item) => {
                                const Icon = item.icon;
                                const active = item.id === activeEvidenceId;
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => setActiveEvidenceId(item.id)}
                                        className={`flex w-full gap-3 py-4 text-left transition ${
                                            active ? "opacity-100" : "opacity-75 hover:opacity-100"
                                        }`}
                                    >
                                        <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border ${impactClasses(item.impact)}`}>
                                            <Icon className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-[10px] font-bold tracking-[0.14em] text-[#9a8b7d]">
                                                    {item.number}
                                                </span>
                                                <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] ${impactClasses(item.impact)}`}>
                                                    {item.impact}
                                                </span>
                                            </div>
                                            <h3 className="mt-1 text-[1rem] font-semibold leading-snug tracking-[-0.02em] text-[#302b27]">
                                                {item.label}
                                            </h3>
                                            <p className="mt-1 text-sm leading-6 text-[#655a51]">{item.evidence}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8b7b6f]">
                            Spatial Dimensions
                        </p>
                        <div className="mt-3 grid gap-x-5 sm:grid-cols-2">
                            {dimensions.map((dimension) => (
                                <div key={dimension.label} className="border-t border-[#eadfd4] py-4">
                                    <div className="flex items-baseline justify-between gap-3">
                                        <h3 className="text-sm font-semibold tracking-[-0.01em] text-[#302b27]">
                                            {dimension.label}
                                        </h3>
                                        <p className="text-xl font-semibold tracking-[-0.05em] text-[#302b27]">
                                            {dimension.score}
                                        </p>
                                    </div>
                                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#eee5dc]">
                                        <div className="h-full rounded-full bg-[#8f9b80]" style={{ width: `${dimension.score}%` }} />
                                    </div>
                                    <p className="mt-2 text-xs leading-5 text-[#675c52]">{dimension.note}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="mt-8 grid gap-6 border-t border-[#e4d7ca] pt-7 lg:grid-cols-[minmax(0,1.05fr)_minmax(19rem,0.95fr)]">
                    <article className="border-l-4 border-[#c99678] bg-[#fbefe6]/70 py-5 pl-5 pr-4 sm:py-6 sm:pl-6">
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-[#94624b]">
                                <Sparkles className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#94624b]">
                                    First 24 Hours
                                </p>
                                <h2 className="mt-2 text-2xl font-semibold leading-tight tracking-[-0.035em] text-[#302b27]">
                                    Change the evening signal before you change the furniture.
                                </h2>
                            </div>
                        </div>
                        <div className="mt-5 divide-y divide-[#ead7c7]">
                            {nextSteps.map((step, index) => (
                                <div key={step} className="grid gap-3 py-3 sm:grid-cols-[3rem_minmax(0,1fr)]">
                                    <p className="text-xs font-bold tracking-[0.14em] text-[#a07159]">
                                        0{index + 1}
                                    </p>
                                    <p className="text-sm leading-6 text-[#5f5148]">{step}</p>
                                </div>
                            ))}
                        </div>
                    </article>

                    <article className="rounded-[28px] bg-[#302b27] p-5 text-[#fff7ec] shadow-[0_18px_54px_rgba(48,43,39,0.16)] sm:p-6">
                        <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#fff7ec]/58">
                            <Lock className="h-4 w-4" />
                            Full Report Preview
                        </p>
                        <h2 className="mt-2 text-2xl font-semibold leading-tight tracking-[-0.035em]">
                            The full report turns this first read into a priority path.
                        </h2>
                        <div className="mt-5 divide-y divide-white/10 rounded-[22px] border border-white/10 bg-white/[0.045]">
                            {lockedFindings.map((item) => (
                                <div key={item} className="flex gap-3 px-4 py-3 text-sm leading-6 text-[#fff7ec]/78">
                                    <Eye className="mt-1 h-4 w-4 shrink-0 text-[#d7b088]" />
                                    {item}
                                </div>
                            ))}
                        </div>
                        <button className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#fff7ec] px-5 text-sm font-bold text-[#302b27] transition hover:bg-white">
                            Unlock Full Report
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    </article>
                </section>
            </div>
        </main>
    );
}
