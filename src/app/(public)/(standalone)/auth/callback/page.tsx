import type { Metadata } from "next";
import { Suspense } from "react";
import AuthCallbackPage from "@/features/auth/AuthCallbackPage";

export const metadata: Metadata = {
    title: "Align | Auth Callback",
    robots: {
        index: false,
        follow: false,
    },
};

export default function AuthCallbackRoute() {
    return (
        <Suspense fallback={null}>
            <AuthCallbackPage />
        </Suspense>
    );
}
