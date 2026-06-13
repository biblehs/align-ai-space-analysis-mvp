import type { ReactNode } from "react";
import { cn } from "@/lib/ui";

type AppPanelProps = {
    children: ReactNode;
    className?: string;
};

export default function AppPanel({
    children,
    className,
}: AppPanelProps) {
    return (
        <div className={cn("rounded-[2rem] border border-border/80 bg-background/95", className)}>
            {children}
        </div>
    );
}
