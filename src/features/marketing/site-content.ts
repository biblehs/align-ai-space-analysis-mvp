import {
    appAuthHref,
    appUploadEntryHref,
    marketingAboutHref,
    marketingBlogHref,
    marketingHomeHref,
    marketingHowItWorksHref,
    marketingPricingHref,
    marketingPrivacyHref,
    marketingTermsHref,
} from "@/lib/navigation";

export const marketingBrand = {
    contactEmail: "hello@alignflow.xyz",
    supportEmail: "support@alignflow.xyz",
    copyrightName: "ALIGN",
    homeHref: marketingHomeHref,
    name: "ALIGN",
    privacyEmail: "support@alignflow.xyz",
    supportCopy:
        "Your space shapes how you feel. Discover personalized, low-cost shifts for calmer living, better rest, and a more supportive home.",
    wordmark: "ALIGN • Read Your Space",
};

export const marketingHeaderNav = {
    primary: [
        { href: marketingHowItWorksHref, label: "How it Works" },
        { href: marketingPricingHref, label: "Pricing" },
        { href: marketingAboutHref, label: "About" },
    ],
    authenticated: [
        { href: "/account", label: "Account", type: "link" as const },
        { label: "Sign Out", type: "action" as const },
    ],
    guest: [
        { href: appAuthHref, label: "Sign In" },
    ],
    primaryCta: {
        href: appUploadEntryHref,
        mobileLabel: "Start",
        label: "Start Analysis",
    },
};

export const marketingFooterGroups = [
    {
        title: "Product",
        links: [
            { href: appUploadEntryHref, label: "Start Analysis" },
            { href: marketingHowItWorksHref, label: "How it Works" },
            { href: marketingPricingHref, label: "Pricing" },
            { href: marketingBlogHref, label: "Blog" },
        ],
    },
    {
        title: "Legal",
        links: [
            { href: marketingPrivacyHref, label: "Privacy Policy" },
            { href: marketingTermsHref, label: "Terms of Service" },
        ],
    },
    {
        title: "Connect",
        links: [
            { href: "https://x.com", label: "X (Twitter)" },
            { href: "https://instagram.com", label: "Instagram" },
            { href: "https://pinterest.com", label: "Pinterest" },
            { href: marketingAboutHref, label: "About" },
        ],
    },
];

export const aboutPageContent = {
    contactCopy:
        "Questions about your reading, the wellness plan, or how ALIGN works? We read every note.",
    introTitle:
        "ALIGN began with a simple idea: home affects the nervous system long before we have words for it.",
    introParagraphs: [
        "We built ALIGN for people who want their space to feel calmer, lighter, and more supportive, but do not want a full redesign or generic decor advice.",
        "A room photo, your goal, and a few personal signals become a clearer reading of what feels off and a wellness plan for what to change first.",
    ],
    sections: [
        {
            key: "what-it-is",
            label: "01 What ALIGN Is",
            lead: "ALIGN is a consumer wellness product for people who want a home that feels better to live in.",
            body: "It sits somewhere between design guidance and emotional clarity. We look at what your room may be amplifying, where friction is building up, and which small changes could bring more ease to everyday life.",
        },
        {
            key: "how-it-works",
            label: "02 How It Helps",
            body: "The system reads the actual room you upload, then combines that with your intention, budget comfort, and style direction so the result feels specific rather than generic.",
            lines: [
                "It points to the visual, spatial, and emotional cues that may be affecting rest, focus, and comfort.",
                "It turns those cues into a wellness plan with practical shifts you can actually try.",
                "When useful, it can also suggest supportive objects or upgrades without making the whole experience feel sales-led.",
            ],
        },
        {
            key: "what-you-receive",
            label: "03 What You Receive",
            body: "We want the output to feel clear, calm, and usable. Not just a score, and not a flood of ideas.",
            lines: [
                "A quick read on what the room is doing well and where it may be creating subtle drag.",
                "A prioritized wellness plan so you know what to adjust first, even on a small budget.",
                "A softer path toward a more restorative room, rather than pressure to make it perfect.",
            ],
            callout:
                "The goal is simple: help people make the room they already live in feel more supportive, more restorative, and easier to come back to.",
        },
        {
            key: "closing",
            label: "04 Closing",
            lead: "We are building ALIGN for real homes, real constraints, and real routines.",
            body: "If something in your reading feels unclear, or if you want the product to be more useful for the way you actually live, we would genuinely like to hear from you.",
        },
    ],
};

export const blogPageContent = {
    backHref: marketingHomeHref,
    backLabel: "Back to Home",
    eyebrow: "Blog",
    title: "Journal, product notes, and stories about calmer living.",
    summary:
        "This section is being prepared as a dedicated editorial space for ALIGN. Soon it will hold room case studies, calming rituals, design insights, and product updates.",
    cards: {
        primary: {
            eyebrow: "Coming Soon",
            title: "First editorial drops are on the way.",
            copy:
                "We are structuring this area so it can later connect cleanly to a CMS, Supabase content tables, or an external publishing workflow without affecting the product app.",
        },
        secondary: {
            eyebrow: "Explore ALIGN",
            copy:
                "While the blog is being prepared, you can still start a full room analysis now.",
            ctaLabel: "Start Analysis",
            ctaHref: appUploadEntryHref,
        },
    },
};
