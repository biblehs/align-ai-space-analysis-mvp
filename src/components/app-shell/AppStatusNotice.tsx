import type { ReactNode } from "react";
import { cn } from "@/lib/ui";

type AppStatusNoticeProps = {
    children: ReactNode;
    className?: string;
    tone?: "error" | "success" | "warning";
};

const toneClasses = {
    error: "border-insight-brick/20 bg-surface-brick text-foreground",
    success: "border-insight-sage/20 bg-surface-sage text-foreground",
    warning: "border-insight-terracotta/20 bg-surface-sand text-foreground",
};

export default function AppStatusNotice({
    children,
    className,
    tone = "warning",
}: AppStatusNoticeProps) {
    return (
        <div className={cn("rounded-[1.5rem] border p-4 text-sm", toneClasses[tone], className)}>
            {children}
        </div>
    );
}
