import type { ReactNode } from "react";
import { cn } from "@/lib/ui";

type AppPageIntroProps = {
    badge?: ReactNode;
    className?: string;
    description?: ReactNode;
    descriptionClassName?: string;
    eyebrow?: ReactNode;
    eyebrowClassName?: string;
    notice?: ReactNode;
    title: ReactNode;
    titleClassName?: string;
};

export default function AppPageIntro({
    badge,
    className,
    description,
    descriptionClassName,
    eyebrow,
    eyebrowClassName,
    notice,
    title,
    titleClassName,
}: AppPageIntroProps) {
    return (
        <div className={cn("text-center space-y-3", className)}>
            {eyebrow ? (
                <p className={cn("text-sm font-bold uppercase tracking-widest text-muted-foreground", eyebrowClassName)}>
                    {eyebrow}
                </p>
            ) : null}
            {badge}
            {notice}
            <h1 className={cn("font-heading text-3xl font-bold tracking-tight text-foreground sm:text-5xl", titleClassName)}>
                {title}
            </h1>
            {description ? (
                <p className={cn("mx-auto max-w-lg text-base text-muted-foreground sm:text-lg", descriptionClassName)}>
                    {description}
                </p>
            ) : null}
        </div>
    );
}
