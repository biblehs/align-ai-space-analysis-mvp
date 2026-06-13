import type { ReactNode } from "react";
import { cn } from "@/lib/ui";

type AppCenteredStateProps = {
    action?: ReactNode;
    children?: ReactNode;
    className?: string;
    description?: ReactNode;
    icon?: ReactNode;
    title: ReactNode;
};

export default function AppCenteredState({
    action,
    children,
    className,
    description,
    icon,
    title,
}: AppCenteredStateProps) {
    return (
        <div className={cn("mx-auto flex max-w-2xl flex-col items-center gap-4 text-center", className)}>
            {icon}
            <div className="space-y-3">
                <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
                    {title}
                </h1>
                {description ? (
                    <p className="mx-auto max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
                        {description}
                    </p>
                ) : null}
            </div>
            {action}
            {children}
        </div>
    );
}
