import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/ui";

type AppBackLinkProps = {
    className?: string;
    href: string;
    label: string;
};

export default function AppBackLink({
    className,
    href,
    label,
}: AppBackLinkProps) {
    return (
        <Link
            href={href}
            className={cn(
                "inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                className,
            )}
        >
            <ArrowLeft className="h-4 w-4" />
            {label}
        </Link>
    );
}
