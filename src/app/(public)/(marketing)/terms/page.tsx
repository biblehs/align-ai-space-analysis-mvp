import type { Metadata } from "next";
import TermsOfServicePage from "@/features/marketing/legal/TermsOfServicePage";
import { marketingTermsHref } from "@/lib/navigation";

export const metadata: Metadata = {
    title: "Align | Terms of Service",
    description: "Review the terms that govern use of ALIGN, our reports, and our spatial wellness services.",
    alternates: {
        canonical: marketingTermsHref,
    },
};

export default function TermsRoute() {
    return <TermsOfServicePage />;
}
