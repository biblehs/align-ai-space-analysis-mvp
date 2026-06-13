export type AlignIntention =
    | "sleep"
    | "deep_rest"
    | "relax"
    | "focus"
    | "reset"
    | "uplift"
    | "calm"
    | "vitality";

export type BudgetLevel = "none" | "low" | "medium" | "flexible";

export type PhotoSignalLevel = "low" | "medium" | "high";
export type PhotoSignalBinary = "weak" | "mixed" | "clear";
export type PhotoSignalStrength = "weak" | "medium" | "strong";

export type PhotoSignals = {
    clutterLevel: PhotoSignalLevel;
    functionMixing: PhotoSignalLevel;
    lightRhythm: PhotoSignalBinary;
    restBoundary: PhotoSignalStrength;
    softness: PhotoSignalStrength;
    closureSignal: PhotoSignalStrength;
    anchorStrength: PhotoSignalStrength;
};

export type AlignInput = {
    roomType: "bedroom" | "workspace" | "living_room" | "corner" | "creative_studio" | "unknown";
    intention: AlignIntention;
    selfStateTags: string[];
    notes?: string | null;
    budgetLevel: BudgetLevel;
    canMakeBigChanges: boolean;
    rentalFriendly: boolean;
    photoSignals: PhotoSignals;
};

export type RecommendationMode = "no_cost" | "small_shift" | "environmental_support";

export type TensionMap = {
    contradictionType: string;
    contradictionLabel: string;
    amplifiedStates: string[];
    blockedStates: string[];
    coreConflict: string;
    topLeveragePoint: string;
    whyThisMatters: string;
    recommendationMode: RecommendationMode;
    notYet: string[];
    likelyFirstRelief: string[];
    matchedSignals: string[];
};
