import type { Metadata } from "next";
import AccountPage from "@/features/auth/AccountPage";
import { V2RouteShell } from "@/features/app-ui/v2/shared/V2RouteShell";

export const metadata: Metadata = {
    title: "ALIGN Account | Sanctuary Dashboard",
    description: "Review past readings, manage billing, and continue your ALIGN sanctuary plan.",
};

export default function AccountRoute() {
    return (
        <V2RouteShell>
            <AccountPage />
        </V2RouteShell>
    );
}
