import Image from "next/image";
import { Sparkles } from "lucide-react";

const MARKETING_QR_URL = "/media/report/align-qr.webp";

type ReportMarketingPanelProps = {
    cta: string;
    subtitle: string;
};

export function ReportMarketingPanel({ cta, subtitle }: ReportMarketingPanelProps) {
    return (
        <div className="mt-10 rounded-[2.5rem] border border-border bg-surface-warm p-8 text-foreground">
            <div className="flex items-start justify-between gap-8">
                <div className="max-w-xl">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-background">
                        <Sparkles className="h-4 w-4" />
                        Align Space Wellness
                    </div>
                    <h3 className="text-3xl font-bold tracking-tight">{cta}</h3>
                    <p className="mt-3 text-lg leading-relaxed text-foreground/70">{subtitle}</p>
                    <div className="mt-6 space-y-2 text-sm font-medium text-foreground/75">
                        <p>Website: alignflow.xyz</p>
                        <p>AI-powered room reading for calmer living, better rest, and more supportive spaces.</p>
                        <p>Upload one photo. Get practical design guidance with grounding details and gentle next steps.</p>
                    </div>
                </div>

                <div className="shrink-0 rounded-[2rem] bg-background p-5 text-center shadow-sm">
                    <Image
                        src={MARKETING_QR_URL}
                        alt="ALIGN QR code"
                        width={168}
                        height={168}
                        sizes="168px"
                        unoptimized
                        className="h-[168px] w-[168px] rounded-xl border border-border"
                    />
                    <p className="mt-3 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Scan To Try</p>
                    <p className="mt-1 text-sm font-medium text-foreground/75">alignflow.xyz</p>
                </div>
            </div>
        </div>
    );
}
