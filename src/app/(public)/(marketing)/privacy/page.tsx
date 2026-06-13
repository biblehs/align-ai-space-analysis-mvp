import type { Metadata } from "next";
import PrivacyPolicyPage from "@/features/marketing/legal/PrivacyPolicyPage";
import { marketingPrivacyHref } from "@/lib/navigation";

export const metadata: Metadata = {
    title: "Align | Privacy Policy",
    description: "Read how ALIGN collects, uses, and protects information across our spatial wellness platform.",
    alternates: {
        canonical: marketingPrivacyHref,
    },
};

export default function PrivacyRoute() {
    return <PrivacyPolicyPage />;
}
