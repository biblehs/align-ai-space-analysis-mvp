import type {
    ClaimedGoalTypeV2,
    ClaimedIssueTypeV2,
    EnergyTypeIdV2,
} from "./contracts";

export type DiagnosisSignalKey =
    | "activation_blocked"
    | "unfinished_surfaces"
    | "work_rest_overlap"
    | "overstimulating_focal_points"
    | "visual_noise"
    | "lack_of_anchor"
    | "heavy_storage"
    | "emotional_accumulation"
    | "cold_functional_light"
    | "soft_restorative_light"
    | "sparse_unclaimed_space"
    | "lack_of_personal_claim"
    | "transition_state"
    | "mixed_old_new_identity"
    | "coherent_anchor_zone"
    | "clear_support_zone";

export interface EnergyTypeRuleProfile {
    id: EnergyTypeIdV2;
    name: string;
    coreSentence: string;
    coreTension: string;
    baseScore: number;
    goalBias: Partial<Record<ClaimedGoalTypeV2, number>>;
    issueBias: Partial<Record<ClaimedIssueTypeV2, number>>;
    signalWeights: Partial<Record<DiagnosisSignalKey, number>>;
    contradictionPenalties: Partial<Record<DiagnosisSignalKey, number>>;
    proofPriority: DiagnosisSignalKey[];
    firstShiftPattern: {
        title: string;
        actionPrinciple: string;
        targetZoneHint: string;
    };
    fullReportHiddenFindings: string[];
}

export const PATTERN_DIAGNOSIS_SCORING_MATRIX: Record<EnergyTypeIdV2, EnergyTypeRuleProfile> = {
    dormant_fire: {
        id: "dormant_fire",
        name: "Dormant Fire",
        coreSentence: "Energy that wants to move but has nowhere to go.",
        coreTension: "The room carries active intent, but unfinished signals keep momentum from landing cleanly.",
        baseScore: 10,
        goalBias: { focus: 3, vitality: 4 },
        issueBias: { cluttered: 4, stuck: 5, unfocused: 3, "visually-noisy": 2 },
        signalWeights: {
            activation_blocked: 7,
            unfinished_surfaces: 7,
            work_rest_overlap: 6,
            visual_noise: 3,
            lack_of_anchor: 2,
        },
        contradictionPenalties: {
            sparse_unclaimed_space: 2,
            heavy_storage: 2,
        },
        proofPriority: [
            "unfinished_surfaces",
            "work_rest_overlap",
            "activation_blocked",
            "visual_noise",
        ],
        firstShiftPattern: {
            title: "Clear the strongest unfinished surface",
            actionPrinciple: "Reduce the room's loudest in-progress cue before adding anything new.",
            targetZoneHint: "the most active surface or overlap zone",
        },
        fullReportHiddenFindings: [
            "Which zone keeps pulling your attention back into unfinished loops",
            "Why the room feels active without becoming directional",
            "What to reduce first before adding support",
        ],
    },
    scattered_moon: {
        id: "scattered_moon",
        name: "Scattered Moon",
        coreSentence: "Everything is present. Nothing is centered.",
        coreTension: "The room offers many inputs at once but lacks a single calm center to land in.",
        baseScore: 10,
        goalBias: { calm: 4, focus: 3, sleep: 2 },
        issueBias: { "visually-noisy": 6, unfocused: 5, cluttered: 3, "hard-to-relax": 3 },
        signalWeights: {
            overstimulating_focal_points: 7,
            visual_noise: 7,
            lack_of_anchor: 6,
            activation_blocked: 3,
        },
        contradictionPenalties: {
            soft_restorative_light: 2,
            clear_support_zone: 2,
        },
        proofPriority: [
            "overstimulating_focal_points",
            "visual_noise",
            "lack_of_anchor",
        ],
        firstShiftPattern: {
            title: "Remove one competing focal point",
            actionPrinciple: "Lower the room's attention load before trying to improve mood or style.",
            targetZoneHint: "the loudest sightline or entry-facing surface",
        },
        fullReportHiddenFindings: [
            "What is fragmenting the room's attention field",
            "Where the real anchor point should be",
            "How to reduce noise without over-minimalizing the room",
        ],
    },
    heavy_earth: {
        id: "heavy_earth",
        name: "Heavy Earth",
        coreSentence: "Safe, but too heavy to move forward.",
        coreTension: "The room protects and stores, but that protection has hardened into drag.",
        baseScore: 10,
        goalBias: { vitality: 4, focus: 2, calm: 1 },
        issueBias: { heavy: 6, stuck: 5, cluttered: 3, draining: 3 },
        signalWeights: {
            heavy_storage: 7,
            emotional_accumulation: 7,
            activation_blocked: 4,
            lack_of_anchor: 2,
        },
        contradictionPenalties: {
            sparse_unclaimed_space: 3,
            soft_restorative_light: 1,
        },
        proofPriority: [
            "heavy_storage",
            "emotional_accumulation",
            "activation_blocked",
        ],
        firstShiftPattern: {
            title: "Release one object the room is carrying out of habit",
            actionPrinciple: "Create motion by removing stored emotional weight, not by chasing a full reset.",
            targetZoneHint: "the heaviest storage edge or stagnation pocket",
        },
        fullReportHiddenFindings: [
            "Which objects are stabilizing you and which are freezing the room in place",
            "Where stagnation is accumulating most visibly",
            "How to lighten the room without losing comfort",
        ],
    },
    still_water: {
        id: "still_water",
        name: "Still Water",
        coreSentence: "Calm on the surface. Tension held underneath.",
        coreTension: "The room looks composed, but it is not yet carrying enough warmth or restoration to truly settle the body.",
        baseScore: 10,
        goalBias: { sleep: 5, calm: 3 },
        issueBias: { "hard-to-relax": 5, "lacking-warmth": 5, draining: 2 },
        signalWeights: {
            cold_functional_light: 6,
            lack_of_anchor: 5,
            sparse_unclaimed_space: 3,
            soft_restorative_light: 2,
        },
        contradictionPenalties: {
            overstimulating_focal_points: 3,
            visual_noise: 2,
        },
        proofPriority: [
            "cold_functional_light",
            "lack_of_anchor",
            "sparse_unclaimed_space",
        ],
        firstShiftPattern: {
            title: "Add one low, warm restorative cue",
            actionPrinciple: "Start by adding one clearer restorative cue, rather than changing the whole room at once.",
            targetZoneHint: "the bedside or rest-adjacent support zone",
        },
        fullReportHiddenFindings: [
            "Why the room still feels under-supportive even when it looks orderly",
            "Which restorative cue is missing",
            "How to build emotional warmth without clutter",
        ],
    },
    empty_sky: {
        id: "empty_sky",
        name: "Empty Sky",
        coreSentence: "Too open. The room does not know what it is for.",
        coreTension: "The room is light and open, but lacks enough claim, identity, and grounding to feel lived in.",
        baseScore: 10,
        goalBias: { calm: 2, focus: 2, sleep: 2, vitality: 1 },
        issueBias: { "lacking-warmth": 4, stuck: 2, draining: 2 },
        signalWeights: {
            sparse_unclaimed_space: 7,
            lack_of_personal_claim: 7,
            lack_of_anchor: 5,
        },
        contradictionPenalties: {
            heavy_storage: 3,
            visual_noise: 3,
            emotional_accumulation: 2,
        },
        proofPriority: [
            "sparse_unclaimed_space",
            "lack_of_personal_claim",
            "lack_of_anchor",
        ],
        firstShiftPattern: {
            title: "Claim one corner with a single grounded purpose",
            actionPrinciple: "Give the room one clearly owned zone before trying to elevate the whole space.",
            targetZoneHint: "an underused corner or emotionally neutral edge",
        },
        fullReportHiddenFindings: [
            "Which part of the room should become the first true anchor",
            "Why the space feels unclaimed instead of clear",
            "How to add identity without overfilling the room",
        ],
    },
    rising_wood: {
        id: "rising_wood",
        name: "Rising Wood",
        coreSentence: "Growth is trying to happen here. Clear the path.",
        coreTension: "The room is in transition, but old and new signals are still competing for authority.",
        baseScore: 10,
        goalBias: { vitality: 5, focus: 2, calm: 1 },
        issueBias: { stuck: 6, unfocused: 2, cluttered: 2 },
        signalWeights: {
            transition_state: 7,
            mixed_old_new_identity: 7,
            activation_blocked: 4,
            lack_of_anchor: 2,
        },
        contradictionPenalties: {
            heavy_storage: 2,
            sparse_unclaimed_space: 2,
        },
        proofPriority: [
            "transition_state",
            "mixed_old_new_identity",
            "activation_blocked",
        ],
        firstShiftPattern: {
            title: "Choose one transition zone to represent the room you are moving into",
            actionPrinciple: "Resolve one visible old-vs-new conflict before attempting a full refresh.",
            targetZoneHint: "the clearest transition pocket or mixed-identity surface",
        },
        fullReportHiddenFindings: [
            "Which zone is still carrying the old version of the room",
            "Where the new identity is already trying to emerge",
            "What should change first to make the transition feel real",
        ],
    },
    unknown: {
        id: "unknown",
        name: "Unknown",
        coreSentence: "The room needs more stable evidence before a type can be assigned confidently.",
        coreTension: "The visible signals are too mixed or too weak to make a confident diagnosis.",
        baseScore: 0,
        goalBias: {},
        issueBias: {},
        signalWeights: {},
        contradictionPenalties: {},
        proofPriority: [],
        firstShiftPattern: {
            title: "Capture a wider, clearer view",
            actionPrinciple: "Improve evidence quality before making a transformation recommendation.",
            targetZoneHint: "the whole room",
        },
        fullReportHiddenFindings: [
            "What becomes clearer once the room is photographed with more context",
            "Which zone is currently hardest to read",
            "How a better frame changes the diagnosis",
        ],
    },
};

export const DIAGNOSIS_SIGNAL_SELECTION_RULES = {
    maxProofSignalsInSnapshot: 3,
    minProofSignalsForPaid: 5,
    strongSignalThreshold: 6,
    softSignalThreshold: 3,
    hardMismatchConfidenceThreshold: 0.8,
    softMismatchConfidenceThreshold: 0.6,
} as const;
