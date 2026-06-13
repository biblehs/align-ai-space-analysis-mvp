import type { Metadata } from "next";
import AboutPage from "@/features/marketing/about/AboutPage";
import { marketingAboutHref } from "@/lib/navigation";

export const metadata: Metadata = {
    title: "Align | About",
    description: "Learn how ALIGN approaches spatial wellness, calmer living, and emotionally supportive rooms.",
    alternates: {
        canonical: marketingAboutHref,
    },
};

export default function AboutRoute() {
    return <AboutPage />;
}
