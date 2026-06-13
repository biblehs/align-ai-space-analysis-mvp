import { Camera, CircleDot, Sparkles, type LucideIcon } from "lucide-react";
import { marketingAboutHref } from "@/lib/navigation";

export const navItems = [
  { href: "#how", label: "How it works" },
  { href: "#snapshot", label: "The Snapshot" },
  { href: "#pricing", label: "Pricing" },
  { href: marketingAboutHref, label: "About" },
];

export const landingImages = {
  hero: "/landing/v2/hero-room.webp",
  resultRoom: "/landing/v2/result-room.webp",
  ritualUpload: "/landing/v2/ritual-upload.webp",
  finalLandscape: "/landing/v2/final-landscape.webp",
} as const;

export const heroPrismImage = "/media/landing/hero-prism.webp";

export const heroThirdLinePhrases = ["home feels.", "space feels.", "room settles.", "rest begins."] as const;

export const heroThirdLineStyles = [
  { toneClass: "heroPhraseDeep", italic: false },
  { toneClass: "heroPhraseSoft", italic: true },
  { toneClass: "heroPhraseMid", italic: false },
  { toneClass: "heroPhraseGlow", italic: true },
] as const;

export const snapshotLayers = [
  {
    label: "Space State",
    title: "Hyper-vigilant",
    body: "A first read on the room's emotional and functional state, grounded in visible cues from your photo.",
    panel: "The room is beautiful, but the body cannot quite stand down.",
  },
  {
    label: "The Reading",
    title: "Evidence, not vibes",
    body: "Light, reflection, visual weight, task residue, and rest cues are translated into a calm explanation you can actually use.",
    wide: true,
  },
  {
    label: "Try Tonight",
    title: "One small shift",
    body: "Start with a zero-cost adjustment before the room becomes a redesign project.",
    dark: true,
  },
];

export const stateCards = [
  { eyebrow: "Detected", title: "Visual Weight", tone: "warm" },
  { eyebrow: "Detected", title: "Restless Reflection", tone: "sage" },
  { eyebrow: "Support", title: "Soft Light", tone: "clay" },
  { eyebrow: "Support", title: "Clear Anchor", tone: "stone" },
];

export const signalCards = [
  {
    title: "Light pressure",
    body: "Where daylight lands, where shadows collect, and whether the room gives your body a place to soften.",
  },
  {
    title: "Visual density",
    body: "Busy surfaces, open loops, and object clusters that can keep attention slightly switched on.",
  },
  {
    title: "Recovery cues",
    body: "Small signals that make the room easier to enter, easier to rest in, and easier to reset.",
  },
];

type HowStep = {
  icon: LucideIcon;
  title: string;
  body: string;
  image?: string;
  tags?: string[];
  progress?: boolean;
  scoreLabel?: string;
  scoreValue?: string;
  scoreMeta?: string;
  note?: string;
  outputs?: string[];
  tone?: "sand" | "sage" | "clay";
};

export const howSteps: HowStep[] = [
  {
    icon: Camera,
    title: "Capture reality",
    body: "Take a wide photo of your room. Do not tidy up. Align needs to see how the space actually lives and breathes.",
    image: landingImages.ritualUpload,
    scoreLabel: "Photo quality",
    scoreValue: "Wide view",
    scoreMeta: "Best when the bed, light, and surrounding surfaces are visible together.",
    note: "The more honest the room looks, the more believable the reading becomes.",
    tone: "sand",
  },
  {
    icon: CircleDot,
    title: "Set your intention",
    body: "Tell Align what you need right now: deeper sleep, sharper focus, or a space to decompress.",
    tags: ["Sleep", "Focus", "Decompress", "Reset"],
    scoreLabel: "Goal match",
    scoreValue: "82",
    scoreMeta: "Align weighs the room against the state you want more of, not just what the room looks like.",
    note: "This step gives the room reading direction, so the result can feel personal instead of generic.",
    outputs: ["Goal signal", "Room mood", "Constraint aware"],
    tone: "sage",
  },
  {
    icon: Sparkles,
    title: "Shift the energy",
    body: "Receive your Snapshot with one to three zero-cost, immediate adjustments you can make in ten minutes.",
    tags: ["Reading", "Evidence", "Try Tonight"],
    progress: true,
    scoreLabel: "First-shift confidence",
    scoreValue: "91",
    scoreMeta: "The first recommendation is chosen for clarity, speed, and emotional effect.",
    note: "You leave with a room state, the visible cues behind it, and the most useful next move for tonight.",
    outputs: ["Space state", "Visible cues", "First move"],
    tone: "clay",
  },
];

export const pricingCards = [
  {
    eyebrow: "Starter",
    name: "The Reading",
    price: "Free",
    billing: "No payment required",
    meta: "A first glimpse into how your room may be shaping your state.",
    features: [
      "One quick room reading",
      "One primary insight",
      "A simple emotional summary",
    ],
    ctaLabel: "Reserve your spot",
    ctaType: "waitlist",
    source: "pricing_starter",
    featured: false,
  },
  {
    eyebrow: "Most Restorative",
    name: "The Room Plan",
    price: "$9",
    billing: "One-time payment, per room",
    meta: "A fuller interpretation for moving from curiosity into a real room shift.",
    features: [
      "A deeper room interpretation",
      "Tension and support notes",
      "Gentle shifts to try tonight",
      "Optional supportive objects, only when useful",
    ],
    ctaLabel: "Join early access",
    ctaType: "waitlist",
    source: "pricing_room_plan",
    featured: true,
  },
  {
    eyebrow: "Expanded",
    name: "The Home Edit",
    price: "$29",
    billing: "One-time payment, multi-room",
    meta: "A broader plan for multiple rooms and recurring home patterns.",
    features: [
      "Multi-room perspective",
      "Sequenced suggestions",
      "Best for larger home resets",
    ],
    ctaLabel: "Coming Soon",
    ctaType: "disabled",
    source: "pricing_home_edit",
    featured: false,
  },
];

export const faqs = [
  {
    q: "What does Align do with my room photo?",
    a: "Align reads visible room cues like light, density, layout, reflection, texture, and unfinished visual tasks, then turns them into a calm Snapshot with practical next steps.",
  },
  {
    q: "Is this interior design?",
    a: "Not in the traditional sense. Align is less about style rules and more about how a room may be affecting sleep, focus, recovery, and everyday emotional ease.",
  },
  {
    q: "Do I need to buy new furniture?",
    a: "No. The first recommendations are designed to be small and realistic: move, clear, soften, redirect, or reframe what is already in the room.",
  },
  {
    q: "How personal is the Snapshot?",
    a: "The Snapshot is shaped by your uploaded room and the intention you choose, such as sleep, focus, calm, or decompression. It is not a generic checklist.",
  },
  {
    q: "Can I use Align on mobile?",
    a: "Yes. Align is web-based, so you can upload a room photo and read your Snapshot from a phone, tablet, or desktop without installing an app.",
  },
];
