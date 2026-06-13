import { PublicSiteShell } from "@/features/marketing/v2/PublicSiteShell";

export default function PublicMarketingLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return <PublicSiteShell>{children}</PublicSiteShell>;
}
