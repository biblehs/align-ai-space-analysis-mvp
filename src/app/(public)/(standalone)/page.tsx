import type { Metadata } from "next";
import { V2RouteShell } from "@/features/app-ui/v2/shared/V2RouteShell";
import LandingV2Page from "@/features/marketing/v2/landing-v2/LandingV2Page";

export const metadata: Metadata = {
    title: "Align | AI Space Wellness for Sleep, Focus & Calm",
    description:
        "See how your room may be shaping sleep, focus, and calm with personalized AI room analysis and simple next steps from Align.",
    openGraph: {
        title: "Align | AI Space Wellness for Sleep, Focus & Calm",
        description:
            "See how your room may be shaping sleep, focus, and calm with personalized AI room analysis and simple next steps from Align.",
    },
    twitter: {
        title: "Align | AI Space Wellness for Sleep, Focus & Calm",
        description:
            "See how your room may be shaping sleep, focus, and calm with personalized AI room analysis and simple next steps from Align.",
    },
};

export default function PublicStandaloneHomeRoute() {
    return (
        <V2RouteShell>
            <LandingV2Page />
        </V2RouteShell>
    );
}
