import type { RefObject } from "react";
import { BedDouble, LampFloor, Sparkles, Square } from "lucide-react";
import type { SnapshotResultV2 } from "@/lib/align-v2/contracts";
import { ReportMarketingPanel } from "@/components/report/ReportMarketingPanel";
import { buildSnapshotV2ViewModel } from "@/features/analysis/snapshot/snapshot-v2-view-model";

type SnapshotExportCardV2Props = {
    exportRef: RefObject<HTMLDivElement | null>;
    snapshot: SnapshotResultV2;
};

export function SnapshotExportCardV2({
    exportRef,
    snapshot,
}: SnapshotExportCardV2Props) {
    const viewModel = buildSnapshotV2ViewModel(snapshot);

    const icons = [LampFloor, Square, BedDouble];

    return (
        <div className="pointer-events-none absolute left-[-9999px] top-[-9999px]">
            <div
                ref={exportRef}
                className="relative flex w-[1080px] flex-col overflow-hidden rounded-[44px] border border-[#e8dfd5] bg-[#fcfbf8] p-20 font-sans text-[#2f2e2c]"
                style={{
                    backgroundImage:
                        "radial-gradient(circle at top right, rgba(216,164,127,0.12), transparent 28%), radial-gradient(circle at bottom left, rgba(138,154,134,0.14), transparent 24%)",
                }}
            >
                <div className="mb-12 flex items-center justify-between text-[#736861]">
                    <div className="flex items-center gap-3">
                        <Sparkles className="h-8 w-8" />
                        <span className="text-3xl font-bold tracking-[0.2em]">ALIGN</span>
                    </div>
                    <span className="text-xl font-bold uppercase tracking-[0.2em]">Space Snapshot</span>
                </div>

                <div className="rounded-[36px] border border-[#e9ddd1] bg-white/82 p-14">
                    <p className="text-[16px] font-bold uppercase tracking-[0.24em] text-[#8d8076]">
                        {viewModel.hero.eyebrow}
                    </p>
                    <div className="mt-5 grid grid-cols-[1.08fr_0.92fr] gap-10">
                        <div>
                            <h1 className="font-serif text-[82px] italic leading-[0.92] tracking-[-0.04em] text-[#2f2b28]">
                                {viewModel.hero.title}
                            </h1>
                            <p className="mt-6 max-w-[700px] text-[28px] leading-relaxed text-[#4f4741]">
                                {viewModel.hero.subtitle}
                            </p>
                            <div className="mt-8 flex flex-wrap gap-3">
                                {viewModel.hero.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="rounded-full border border-[#e6ddd3] bg-[#faf7f2] px-4 py-2 text-[15px] text-[#5e554e]"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-[28px] border border-[#ebe1d8] bg-[#faf7f3] p-8">
                            <p className="text-[14px] font-bold uppercase tracking-[0.18em] text-[#8d8076]">
                                Current space state
                            </p>
                            <h2 className="mt-4 text-[40px] font-semibold leading-tight text-[#332d29]">
                                {viewModel.spaceState.title}
                            </h2>
                            <div className="mt-8 grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[13px] font-bold uppercase tracking-[0.16em] text-[#97897e]">Strongest</p>
                                    <p className="mt-2 text-[24px] font-semibold text-[#372f2b]">{viewModel.spaceState.strongest}</p>
                                </div>
                                <div>
                                    <p className="text-[13px] font-bold uppercase tracking-[0.16em] text-[#97897e]">Current gap</p>
                                    <p className="mt-2 text-[24px] font-semibold text-[#372f2b]">{viewModel.spaceState.weakest}</p>
                                </div>
                            </div>
                            <p className="mt-8 text-[15px] uppercase tracking-[0.18em] text-[#9c8f83]">
                                {viewModel.spaceState.balanceNote}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-8 rounded-[34px] border border-[#e9ddd1] bg-white/82 p-12">
                    <p className="text-[16px] font-bold uppercase tracking-[0.2em] text-[#8d8076]">
                        {viewModel.summary.eyebrow}
                    </p>
                    <h2 className="mt-4 max-w-[820px] text-[42px] font-semibold leading-tight text-[#352f2b]">
                        {viewModel.summary.title}
                    </h2>
                    <div className="mt-6 max-w-[900px] space-y-4 text-[26px] leading-relaxed text-[#564d46]">
                        {viewModel.summary.paragraphs.map((paragraph) => (
                            <p key={paragraph}>{paragraph}</p>
                        ))}
                    </div>
                </div>

                <div className="mt-8 rounded-[34px] border border-[#e9ddd1] bg-white/82 p-12">
                    <div className="flex items-end justify-between gap-6">
                        <div>
                            <p className="text-[16px] font-bold uppercase tracking-[0.2em] text-[#8d8076]">
                                {viewModel.proof.eyebrow}
                            </p>
                            <h2 className="mt-4 text-[42px] font-semibold leading-tight text-[#352f2b]">
                                {viewModel.proof.title}
                            </h2>
                        </div>
                        <p className="max-w-[360px] text-right text-[21px] leading-relaxed text-[#72675e]">
                            {viewModel.proof.intro}
                        </p>
                    </div>

                    <div className="mt-8 grid grid-cols-3 gap-5">
                        {viewModel.proof.items.map((item, index) => {
                            const Icon = icons[index] ?? Sparkles;

                            return (
                                <div key={`${item.label}-${index}`} className="rounded-[24px] border border-[#ece2d8] bg-[#faf7f2] p-6">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#efe7de] text-[#736459]">
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <p className="mt-5 text-[14px] font-bold uppercase tracking-[0.18em] text-[#8d8076]">
                                        {item.label}
                                    </p>
                                    <p className="mt-4 text-[23px] leading-relaxed text-[#483f39]">
                                        {item.evidence}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="mt-8 grid grid-cols-[0.92fr_1.08fr] gap-8">
                    <div className="rounded-[34px] border border-[#e9ddd1] bg-white/82 p-12">
                        <p className="text-[16px] font-bold uppercase tracking-[0.2em] text-[#8d8076]">
                            {viewModel.firstShift.eyebrow}
                        </p>
                        <h2 className="mt-4 text-[42px] font-semibold leading-tight text-[#352f2b]">
                            {viewModel.firstShift.title}
                        </h2>
                        <p className="mt-5 text-[25px] leading-relaxed text-[#4d443e]">
                            {viewModel.firstShift.action}
                        </p>
                        <div className="mt-6 flex flex-wrap gap-3">
                            {viewModel.firstShift.examples.map((item) => (
                                <span
                                    key={item}
                                    className="rounded-full border border-[#e4d8ce] bg-[#f7f2eb] px-4 py-2 text-[15px] text-[#5d534c]"
                                >
                                    {item}
                                </span>
                            ))}
                        </div>
                        <p className="mt-6 text-[22px] leading-relaxed text-[#6e635b]">
                            {viewModel.firstShift.whyItHelps}
                        </p>
                        <p className="mt-4 text-[18px] uppercase tracking-[0.16em] text-[#8f8176]">
                            Target zone: {viewModel.firstShift.targetZone}
                        </p>
                    </div>

                    <div className="rounded-[34px] border border-[#e9ddd1] bg-white/82 p-12">
                        <p className="text-[16px] font-bold uppercase tracking-[0.2em] text-[#8d8076]">
                            {viewModel.cta.eyebrow}
                        </p>
                        <h2 className="mt-4 max-w-[620px] text-[40px] font-semibold leading-tight text-[#352f2b]">
                            {viewModel.cta.title}
                        </h2>
                        <p className="mt-4 max-w-[640px] text-[24px] leading-relaxed text-[#544a43]">
                            {viewModel.cta.body}
                        </p>
                        <div className="mt-6 flex flex-wrap gap-3">
                            {viewModel.cta.signals.map((signal) => (
                                <span
                                    key={signal}
                                    className="rounded-full border border-[#e4d8ce] bg-[#f7f2eb] px-4 py-2 text-[15px] text-[#5d534c]"
                                >
                                    {signal}
                                </span>
                            ))}
                        </div>
                        <p className="mt-7 text-[16px] font-bold uppercase tracking-[0.18em] text-[#8d8076]">
                            {viewModel.cta.teaserTitle}
                        </p>
                        <div className="mt-4 space-y-3">
                            {viewModel.cta.hiddenFindings.map((item) => (
                                <p key={item} className="text-[23px] leading-relaxed text-[#4f4640]">
                                    {item}
                                </p>
                            ))}
                        </div>
                        <p className="mt-6 text-[22px] leading-relaxed text-[#6e635b]">
                            {viewModel.cta.supportingLine}
                        </p>
                    </div>
                </div>

                <ReportMarketingPanel
                    cta="Scan to generate your own personalized space reading"
                    subtitle="One photo reveals your room pattern, what it is doing to you, and the first shift to make tonight."
                />
            </div>
        </div>
    );
}
