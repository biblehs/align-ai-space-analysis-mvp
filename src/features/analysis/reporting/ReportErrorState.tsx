import Link from "next/link";
import { Crosshair } from "lucide-react";
import { appUploadHref } from "@/lib/navigation";

type ReportErrorStateProps = {
    title: string;
    description: string;
    ctaHref?: string;
    ctaLabel?: string;
};

export function ReportErrorState({
    title,
    description,
    ctaHref = appUploadHref,
    ctaLabel = "Start a New Analysis",
}: ReportErrorStateProps) {
    return (
        <div className="container mx-auto max-w-4xl px-4 py-32 text-center text-foreground">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-insight-brick/20 text-insight-brick mb-6">
                <Crosshair className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-bold mb-4">{title}</h1>
            <p className="text-muted-foreground mb-8">{description}</p>
            <Link href={ctaHref} className="font-bold underline">
                {ctaLabel}
            </Link>
        </div>
    );
}
