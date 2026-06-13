import type { ReactNode } from "react";
import { cn } from "@/lib/ui";

type AppPageShellProps = {
    children: ReactNode;
    className?: string;
    maxWidth?: "sm" | "md" | "lg" | "xl";
    padding?: "default" | "flow";
};

const maxWidthClasses = {
    sm: "max-w-2xl",
    md: "max-w-3xl",
    lg: "max-w-4xl",
    xl: "max-w-5xl",
};

const paddingClasses = {
    default: "py-6 sm:py-16",
    flow: "py-8 sm:py-16",
};

export default function AppPageShell({
    children,
    className,
    maxWidth = "sm",
    padding = "default",
}: AppPageShellProps) {
    return (
        <div className={cn("container mx-auto px-4", maxWidthClasses[maxWidth], paddingClasses[padding], className)}>
            {children}
        </div>
    );
}
