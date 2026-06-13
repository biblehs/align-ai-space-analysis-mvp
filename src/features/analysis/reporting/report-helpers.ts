import type { LucideIcon } from "lucide-react";
import { Boxes, Gem, Palette, Sun, Target } from "lucide-react";
import type { SnapshotResult } from "@/types";

export type DimensionKey = keyof SnapshotResult["dimensions"];
export type DimensionValue = SnapshotResult["dimensions"][DimensionKey];
export type DimensionMeta = {
    icon: LucideIcon;
    label: string;
    bgColor: string;
    iconColor: string;
    barColor: string;
};
export type RankedDimension = DimensionValue & { key: DimensionKey };

export const dimensionMeta: Record<DimensionKey, DimensionMeta> = {
    sunlight: {
        icon: Sun,
        label: "Natural Light",
        bgColor: "bg-surface-sand",
        iconColor: "text-insight-terracotta",
        barColor: "var(--insight-terracotta)",
    },
    clutter: {
        icon: Boxes,
        label: "Space Order",
        bgColor: "bg-surface-sage",
        iconColor: "text-insight-sage",
        barColor: "var(--insight-sage)",
    },
    color: {
        icon: Palette,
        label: "Color Harmony",
        bgColor: "bg-surface-brick",
        iconColor: "text-insight-brick",
        barColor: "var(--insight-brick)",
    },
    style: {
        icon: Gem,
        label: "Style Cohesion",
        bgColor: "bg-surface-slate",
        iconColor: "text-insight-slate",
        barColor: "var(--insight-slate)",
    },
};

const fallbackDimensionMeta: DimensionMeta = {
    icon: Target,
    label: "Dimension",
    bgColor: "bg-secondary",
    iconColor: "text-foreground",
    barColor: "var(--muted-foreground)",
};

export function getDimensionMeta(key: DimensionKey): DimensionMeta {
    return dimensionMeta[key] ?? { ...fallbackDimensionMeta, label: key };
}

export function mapRatingColor(twColor: string | undefined, fallback = "text-foreground") {
    if (!twColor) return fallback;
    if (twColor.includes("red")) return "text-insight-brick";
    if (twColor.includes("yellow")) return "text-insight-terracotta";
    if (twColor.includes("green")) return "text-insight-sage";
    if (twColor.includes("purple")) return "text-insight-slate";
    return twColor;
}

export function getWeakestDimension(entries: [DimensionKey, DimensionValue][]) {
    return entries.reduce<RankedDimension | null>(
        (min, [key, value]) => (!min || value.score < min.score ? { key, ...value } : min),
        null
    );
}

export function getStrongestDimension(entries: [DimensionKey, DimensionValue][]) {
    return entries.reduce<RankedDimension | null>(
        (max, [key, value]) => (!max || value.score > max.score ? { key, ...value } : max),
        null
    );
}
