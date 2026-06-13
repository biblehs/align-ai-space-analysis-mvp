"use client";

import { Download, Share2 } from "lucide-react";
import AppAccountBackLink from "@/components/app-shell/AppAccountBackLink";

type PlanHeaderActionsProps = {
    isExportingImage: boolean;
    isSharingImage: boolean;
    onExportImage: () => void;
    onShareImage: () => void;
    onExportPdf: () => void;
};

export function PlanHeaderActions({
    isExportingImage,
    isSharingImage,
    onExportImage,
    onShareImage,
    onExportPdf,
}: PlanHeaderActionsProps) {
    return (
        <div className="mb-6 flex flex-col gap-3 print:hidden sm:flex-row sm:items-center sm:justify-between">
            <AppAccountBackLink />

            <div className="flex flex-col gap-3 sm:flex-row">
                <button
                    onClick={onExportImage}
                    disabled={isExportingImage}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-foreground px-4 py-3 text-xs font-bold text-foreground shadow-sm transition-transform hover:scale-105 disabled:opacity-50 sm:w-auto sm:justify-start sm:py-2"
                >
                    {isExportingImage ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                        <Download className="h-4 w-4" />
                    )}
                    {isExportingImage ? "Generating..." : "Save Full Report Image"}
                </button>

                <button
                    onClick={onShareImage}
                    disabled={isSharingImage}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-4 py-3 text-xs font-bold text-background shadow-md transition-transform hover:scale-105 disabled:opacity-50 sm:w-auto sm:justify-start sm:py-2"
                >
                    {isSharingImage ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                        <Share2 className="h-4 w-4" />
                    )}
                    {isSharingImage ? "Preparing..." : "Share Full Report"}
                </button>

                <button
                    onClick={onExportPdf}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-secondary px-4 py-3 text-xs font-bold text-foreground shadow-sm transition-transform hover:scale-105 sm:w-auto sm:justify-start sm:py-2"
                >
                    <Download className="h-4 w-4" /> Save PDF
                </button>
            </div>
        </div>
    );
}
