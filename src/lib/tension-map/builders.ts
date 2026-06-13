import { alignKnowledge } from "@/lib/align-knowledge";
import type { StateContradictionType } from "@/lib/align-knowledge/types";
import type { Goal, NormalizedAnalysisInput, VisionObservation } from "@/types";
import type { AlignInput, AlignIntention, BudgetLevel, PhotoSignals, RecommendationMode, TensionMap } from "@/lib/tension-map/types";

function mapRoomType(roomType: string | null | undefined): AlignInput["roomType"] {
    const normalized = (roomType ?? "").toLowerCase();
    if (normalized.includes("bed")) return "bedroom";
    if (normalized.includes("work") || normalized.includes("office") || normalized.includes("desk")) return "workspace";
    if (normalized.includes("living")) return "living_room";
    if (normalized.includes("corner")) return "corner";
    if (normalized.includes("studio")) return "creative_studio";
    return "unknown";
}

function mapIntention(goal: Goal): AlignIntention {
    switch (goal) {
        case "sleep":
            return "sleep";
        case "focus":
            return "focus";
        case "stress":
            return "calm";
        case "energy":
            return "vitality";
        default:
            return "calm";
    }
}

function mapBudgetLevel(input: NormalizedAnalysisInput): BudgetLevel {
    const budget = input.budget?.toLowerCase?.() ?? "";
    if (budget === "minimal" || budget === "none") return "none";
    if (budget === "low" || budget === "budget") return "low";
    if (budget === "medium" || budget === "mid") return "medium";
    return "flexible";
}

function collectText(input: NormalizedAnalysisInput, vision: VisionObservation) {
    return [
        input.concern,
        input.note,
        input.constraints.supportPriority,
        input.constraints.changeOpenness,
        vision.observationSummary,
        vision.layoutSummary,
        vision.lightingSummary,
        vision.clutterSummary,
        vision.colorSummary,
        vision.styleSummary,
        ...vision.observations.map((item) => `${item.label} ${item.evidence}`),
        ...vision.standoutFeatures,
        ...vision.frictionPoints,
        ...vision.supportZones,
        ...vision.stressZones,
    ]
        .filter(Boolean)
        .join(" | ")
        .toLowerCase();
}

function deriveSelfStateTags(input: NormalizedAnalysisInput, vision: VisionObservation) {
    const text = collectText(input, vision);
    const tags = new Set<string>();

    if (/(mess|clutter|overloaded|busy|too much|crowded)/.test(text)) tags.add("overloaded");
    if (/(unfinished|not done|open loop|ongoing|still happening|in progress)/.test(text)) tags.add("unfinished");
    if (/(hard to relax|restless|can't slow|can.t slow|alert|wired)/.test(text)) tags.add("can't slow down");
    if (/(empty|bare|sparse|cold|thin)/.test(text)) tags.add("unheld");
    if (/(mixed|work and rest|desk in bedroom|multi-use|split)/.test(text)) tags.add("mixed-purpose");

    return Array.from(tags);
}

function derivePhotoSignals(input: NormalizedAnalysisInput, vision: VisionObservation): PhotoSignals {
    const text = collectText(input, vision);
    const clutterLevel =
        /(messy|cluttered|overloaded|busy|crowded|surface load)/.test(text) ? "high" :
        /(some clutter|mixed|several items|active surface)/.test(text) ? "medium" :
        "low";

    const functionMixing =
        /(workspace in bedroom|work and rest|desk|keyboard|task zone near bed|multi-use)/.test(text) ? "high" :
        /(mixed use|storage plus rest|creative and rest)/.test(text) ? "medium" :
        "low";

    const lightRhythm =
        /(harsh|glare|overhead|cool light|functional light)/.test(text) ? "weak" :
        /(ambient|layered light|mixed light)/.test(text) ? "mixed" :
        "clear";

    const restBoundary =
        /(bed is cluttered|bed occupied|bed used as storage|rest zone weak)/.test(text) ? "weak" :
        /(bed area defined|clear bed zone|bed zone mostly clear)/.test(text) ? "medium" :
        input.roomType === "bedroom" ? "medium" : "weak";

    const softness =
        /(thin|cold|bare|hard|minimal bedding|low softness)/.test(text) ? "weak" :
        /(textile|soft layer|rug|throw|warm bedding)/.test(text) ? "strong" :
        "medium";

    const closureSignal =
        /(unfinished|in progress|open loop|still happening|not finished)/.test(text) ? "weak" :
        /(settled|finished|quiet|resolved)/.test(text) ? "strong" :
        "medium";

    const anchorStrength =
        /(no anchor|no focal point|no settling point|unclaimed wall|bare wall)/.test(text) ? "weak" :
        /(clear focal point|quiet anchor|settling point)/.test(text) ? "strong" :
        "medium";

    return {
        clutterLevel,
        functionMixing,
        lightRhythm,
        restBoundary,
        softness,
        closureSignal,
        anchorStrength,
    };
}

export function buildAlignInput(input: NormalizedAnalysisInput, vision: VisionObservation): AlignInput {
    return {
        roomType: mapRoomType(input.roomType),
        intention: mapIntention(input.primaryGoal),
        selfStateTags: deriveSelfStateTags(input, vision),
        notes: input.note,
        budgetLevel: mapBudgetLevel(input),
        canMakeBigChanges: input.constraints.changeOpenness === "significant",
        rentalFriendly: input.constraints.renting,
        photoSignals: derivePhotoSignals(input, vision),
    };
}

function signalMatches(alignInput: AlignInput, signal: string) {
    const [key, value] = signal.split(":");
    const photoSignals = alignInput.photoSignals as Record<string, string>;
    return photoSignals[key] === value;
}

function chooseRecommendationMode(input: AlignInput): RecommendationMode {
    if (input.budgetLevel === "none" || input.rentalFriendly) return "no_cost";
    if (!input.canMakeBigChanges) return "small_shift";
    return "environmental_support";
}

function scoreContradiction(type: StateContradictionType, input: AlignInput) {
    const roomMatches = type.roomTypes.includes(input.roomType);
    const goalMatches = type.goals.includes(input.intention);
    if (!roomMatches || !goalMatches) return -1;

    return type.triggerSignals.reduce((score, signal) => score + (signalMatches(input, signal) ? 1 : 0), 0);
}

function buildWhyThisMatters(type: StateContradictionType, input: AlignInput) {
    const goal = input.intention.replace("_", " ");
    return `${type.coreConflictTemplate} That matters because the user is actively trying to improve ${goal}, not just make the room look better.`;
}

export function buildTensionMap(input: AlignInput): TensionMap {
    const matches = alignKnowledge.stateContradictionTypes
        .map((type) => ({ type, score: scoreContradiction(type, input) }))
        .filter((item) => item.score >= 0)
        .sort((a, b) => b.score - a.score);

    const selected = matches[0]?.type ?? alignKnowledge.stateContradictionTypes[0];
    const matchedSignals = selected.triggerSignals.filter((signal) => signalMatches(input, signal));

    return {
        contradictionType: selected.id,
        contradictionLabel: selected.label,
        amplifiedStates: selected.amplifiedStates,
        blockedStates: selected.blockedStates,
        coreConflict: selected.coreConflictTemplate,
        topLeveragePoint: selected.topLeverageTemplate,
        whyThisMatters: buildWhyThisMatters(selected, input),
        recommendationMode: chooseRecommendationMode(input),
        notYet: selected.notYet,
        likelyFirstRelief: selected.likelyFirstRelief,
        matchedSignals,
    };
}
