import type { BrandVoiceRules } from "@/lib/align-knowledge/types";

export const brandVoiceRules: BrandVoiceRules = {
    tone: [
        "warm but restrained",
        "professionally grounded",
        "emotionally intelligent without sounding therapeutic",
        "specific rather than poetic for its own sake",
    ],
    do: [
        "name what is already working before naming the gap",
        "stay close to visible evidence and deterministic diagnosis",
        "translate space signals into everyday felt experience",
        "favor short, clean sentences over dense explanation",
    ],
    dont: [
        "sound mystical, clinical, or guru-like",
        "overclaim what the image cannot support",
        "turn the snapshot into a full report",
        "stack too many metaphors in one sentence",
    ],
    preferredPhrases: [
        "restorative cue",
        "visual landing point",
        "more held",
        "more settled",
        "clearer signal for rest",
        "let the room soften",
        "supportive base",
    ],
    forbiddenPhrases: [
        "chakra",
        "energy field",
        "frequency",
        "trauma response",
        "diagnosis",
        "medical",
        "healing aura",
    ],
    outputRhythm: [
        "name the stable base",
        "name the core tension",
        "ground it in evidence",
        "guide toward one next move",
    ],
    healingExpressionPolicy: {
        maxShareOfCopy: "15-25%",
        role: [
            "translate evidence into felt experience",
            "soften the reader experience without changing the logic",
            "support CTA and progress framing with more warmth",
        ],
        disallowedLayers: [
            "observed evidence",
            "root-cause logic",
            "score or comparison reasoning",
        ],
    },
};
