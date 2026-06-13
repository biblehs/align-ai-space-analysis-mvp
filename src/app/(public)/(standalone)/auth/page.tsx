import type { Metadata } from "next";
import { Suspense } from "react";
import AuthPage from "@/features/auth/AuthPage";
import { V2RouteShell } from "@/features/app-ui/v2/shared/V2RouteShell";

export const metadata: Metadata = {
    title: "ALIGN Sign In | Save Your Sanctuary Plan",
    description: "Sign in to save your readings, unlock your space plan, and continue your ALIGN sanctuary flow.",
    robots: {
        index: false,
        follow: false,
    },
};

export default function AuthRoute() {
    return (
        <V2RouteShell>
            <Suspense fallback={null}>
                <AuthPage />
            </Suspense>
        </V2RouteShell>
    );
}
