import type { SnapshotResultV2 } from "@/lib/align-v2/contracts";
import { alignKnowledge } from "@/lib/align-knowledge";
import type {
    HealingExpressionStage,
    HealingExpressionWhitelist,
    InterpretationActionRule,
    KnowledgeDimension,
    ObservationInterpretationRule,
    RoomGoalProfile,
    TensionPattern,
} from "@/lib/align-knowledge/types";
import type { NormalizedAnalysisInput, ScoreResult, VisionObservation } from "@/types";

type RetrievedWriterKnowledge = {
    roomGoalProfile: RoomGoalProfile | null;
    dimensions: KnowledgeDimension[];
    archetype: { id: string; name: string; coreQuality: string; suggestionDirections: string[] } | null;
    tensionPatterns: TensionPattern[];
    interpretationRules: ObservationInterpretationRule[];
    actionRules: InterpretationActionRule[];
    brandVoice: typeof alignKnowledge.brandVoiceRules;
    healingExpressions: HealingExpressionWhitelist[HealingExpressionStage];
    healingUniversalGuards: HealingExpressionWhitelist["universalGuards"];
};

export type SnapshotWriterKnowledgeHits = {
    knowledgeVersion: string;
    roomGoalProfile: string | null;
    dimensionKeys: string[];
    archetypeId: string | null;
    tensionPatternIds: string[];
    interpretationRuleIds: string[];
    actionRuleIds: string[];
    confidenceRuleIds: string[];
    healingStage: "snapshot";
};

export function getHealingExpressionStageRules(stage: HealingExpressionStage) {
    return alignKnowledge.healingExpressionWhitelist[stage];
}

export function buildHealingExpressionContext(stage: HealingExpressionStage) {
    const rules = getHealingExpressionStageRules(stage);
    return `Healing-expression whitelist for ${stage}:
- allowed roles: ${rules.allowedRoles.join(" | ")}
- preferred phrases: ${rules.preferredPhrases.join(" | ")}
- sentence patterns: ${rules.sentencePatterns.join(" | ")}
- avoid patterns: ${rules.avoidPatterns.join(" | ")}
- universal guards: ${alignKnowledge.healingExpressionWhitelist.universalGuards.join(" | ")}`;
}

export type RetrievedSnapshotWriterKnowledgeBundle = {
    retrieved: RetrievedWriterKnowledge;
    hits: SnapshotWriterKnowledgeHits;
};

function normalizeRoomType(roomType: string | null | undefined) {
    if (!roomType) return "other";
    const normalized = roomType.toLowerCase().replace(/\s+/g, "_");
    if (normalized.includes("bed")) return "bedroom";
    if (normalized.includes("living")) return "living_room";
    if (normalized.includes("work") || normalized.includes("office") || normalized.includes("desk")) return "workspace";
    return normalized;
}

function normalizeGoal(goal: string | null | undefined) {
    if (!goal) return "focus";
    if (goal === "stress") return "stress";
    if (goal === "energy") return "energy";
    if (goal === "sleep") return "sleep";
    return goal;
}

function collectSignalText(visionObservation: VisionObservation, snapshot: SnapshotResultV2) {
    return [
        visionObservation.observationSummary,
        visionObservation.layoutSummary,
        visionObservation.lightingSummary,
        visionObservation.clutterSummary,
        visionObservation.colorSummary,
        visionObservation.styleSummary,
        ...visionObservation.frictionPoints,
        ...visionObservation.supportZones,
        ...visionObservation.stressZones,
        ...visionObservation.observations.map((item) => `${item.label} ${item.evidence}`),
        snapshot.summary.headline,
        snapshot.summary.body,
        snapshot.tension.headline,
        snapshot.tension.explanation,
        snapshot.firstShift.targetZone,
        ...snapshot.summary.statusTags,
    ]
        .filter(Boolean)
        .join(" \n ")
        .toLowerCase();
}

function getLevelRank(level: string) {
    switch (level) {
        case "weak":
            return 0;
        case "medium":
            return 1;
        case "strong":
            return 2;
        default:
            return 1;
    }
}

function tokenize(value: string) {
    return value
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((token) => token.length >= 4);
}

function tokenOverlapScore(source: string, target: string) {
    const sourceTokens = tokenize(source);
    const targetTokens = new Set(tokenize(target));

    if (sourceTokens.length === 0 || targetTokens.size === 0) {
        return 0;
    }

    const shared = sourceTokens.filter((token) => targetTokens.has(token));
    return shared.length / sourceTokens.length;
}

function highestOverlap(sourceParts: string[], targets: string[]) {
    return Math.max(
        0,
        ...sourceParts.map((source) =>
            Math.max(0, ...targets.map((target) => tokenOverlapScore(source, target)))),
    );
}

export function retrieveSnapshotWriterKnowledge(
    normalizedInput: NormalizedAnalysisInput,
    visionObservation: VisionObservation,
    scoreResult: ScoreResult,
    snapshot: SnapshotResultV2,
): RetrievedWriterKnowledge {
    return retrieveSnapshotWriterKnowledgeBundle(
        normalizedInput,
        visionObservation,
        scoreResult,
        snapshot,
    ).retrieved;
}

export function retrieveSnapshotWriterKnowledgeBundle(
    normalizedInput: NormalizedAnalysisInput,
    visionObservation: VisionObservation,
    scoreResult: ScoreResult,
    snapshot: SnapshotResultV2,
): RetrievedSnapshotWriterKnowledgeBundle {
    const roomType = normalizeRoomType(snapshot.validation.finalRoomType ?? normalizedInput.roomType);
    const goal = normalizeGoal(scoreResult.goal ?? normalizedInput.primaryGoal);
    const signalText = collectSignalText(visionObservation, snapshot);

    const roomGoalProfile =
        alignKnowledge.roomGoals.find((item) => item.roomType === roomType && item.goal === goal) ??
        alignKnowledge.roomGoals.find((item) => item.roomType === roomType) ??
        null;

    const rankedDimensions = [...snapshot.spaceState.dimensions].sort((a, b) => {
        if (a.score === b.score) {
            return getLevelRank(a.level) - getLevelRank(b.level);
        }
        return a.score - b.score;
    });
    const focusDimensionKeys = new Set([
        rankedDimensions[0]?.key,
        rankedDimensions[1]?.key,
        rankedDimensions[rankedDimensions.length - 1]?.key,
    ].filter(Boolean));

    const dimensions = alignKnowledge.dimensions.filter((item) => focusDimensionKeys.has(item.key));

    const archetype =
        alignKnowledge.archetypes.find((item) => item.id === snapshot.type.id) ??
        alignKnowledge.archetypes.find((item) => item.name.toLowerCase() === snapshot.type.name.toLowerCase()) ??
        null;

    const tensionPatterns = alignKnowledge.tensionPatterns.filter((pattern) =>
        pattern.triggerKeywords.some((keyword) => signalText.includes(keyword.toLowerCase())),
    ).slice(0, 3);

    const interpretationRules = alignKnowledge.observationToInterpretation
        .map((rule) => {
            const observationScore = highestOverlap(
                [rule.observationPattern],
                [
                    signalText,
                    ...visionObservation.frictionPoints,
                    ...visionObservation.stressZones,
                    ...visionObservation.observations.flatMap((item) => [item.label, item.evidence]),
                ],
            );

            const tensionScore = highestOverlap(
                [rule.observationPattern, rule.means, rule.userTranslation],
                tensionPatterns.flatMap((pattern) => [
                    pattern.label,
                    pattern.interpretation,
                    ...pattern.firstMovePrinciples,
                ]),
            );

            const dimensionScore = rule.affects.some((dimension) =>
                focusDimensionKeys.has(dimension as SnapshotResultV2["spaceState"]["dimensions"][number]["key"]))
                ? 0.2
                : 0;

            return {
                rule,
                matchScore: Math.max(observationScore, tensionScore) + dimensionScore,
            };
        })
        .filter((item) => item.matchScore >= 0.28)
        .sort((left, right) => right.matchScore - left.matchScore)
        .map((item) => item.rule)
        .slice(0, 3);

    const interpretationCorpus = [
        ...interpretationRules.flatMap((item) => [item.observationPattern, item.means, item.userTranslation]),
        ...tensionPatterns.flatMap((item) => [item.label, item.interpretation, ...item.firstMovePrinciples]),
    ];

    const actionRules = alignKnowledge.interpretationToActions
        .map((rule) => {
            const roomMatches = rule.roomTypes.includes(roomType) || rule.roomTypes.includes("other");
            const goalMatches = rule.goals.includes(goal);
            const interpretationScore = Math.max(
                0,
                ...interpretationCorpus.map((text) => tokenOverlapScore(rule.interpretationPattern, text)),
            );
            const moveScore = Math.max(
                0,
                ...rule.tonightMoves.map((move) => tokenOverlapScore(move, signalText)),
            );

            return {
                rule,
                roomMatches,
                goalMatches,
                matchScore: Math.max(interpretationScore, moveScore),
            };
        })
        .filter((item) => {
            if (!item.roomMatches || !item.goalMatches) {
                return false;
            }

            return item.matchScore >= 0.25;
        })
        .sort((left, right) => right.matchScore - left.matchScore)
        .map((item) => item.rule)
        .slice(0, 3);

    const retrieved = {
        roomGoalProfile,
        dimensions,
        archetype: archetype
            ? {
                id: archetype.id,
                name: archetype.name,
                coreQuality: archetype.coreQuality,
                suggestionDirections: archetype.suggestionDirections,
            }
            : null,
        tensionPatterns,
        interpretationRules,
        actionRules,
        brandVoice: alignKnowledge.brandVoiceRules,
        healingExpressions: getHealingExpressionStageRules("snapshot"),
        healingUniversalGuards: alignKnowledge.healingExpressionWhitelist.universalGuards,
    };

    const hits: SnapshotWriterKnowledgeHits = {
        knowledgeVersion: alignKnowledge.version,
        roomGoalProfile: roomGoalProfile ? `${roomGoalProfile.roomType}:${roomGoalProfile.goal}` : null,
        dimensionKeys: dimensions.map((item) => item.key),
        archetypeId: archetype?.id ?? null,
        tensionPatternIds: tensionPatterns.map((item) => item.id),
        interpretationRuleIds: interpretationRules.map((item) => item.id),
        actionRuleIds: actionRules.map((item) => item.id),
        confidenceRuleIds: alignKnowledge.confidenceRules.map((item) => item.id),
        healingStage: "snapshot",
    };

    return { retrieved, hits };
}

export function buildSnapshotWriterKnowledgeContext(
    normalizedInput: NormalizedAnalysisInput,
    visionObservation: VisionObservation,
    scoreResult: ScoreResult,
    snapshot: SnapshotResultV2,
) {
    const { retrieved } = retrieveSnapshotWriterKnowledgeBundle(
        normalizedInput,
        visionObservation,
        scoreResult,
        snapshot,
    );

    const sections: string[] = [];
    const clip = (value: string, maxLength = 180) => {
        const normalized = value.replace(/\s+/g, " ").trim();
        return normalized.length > maxLength ? `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…` : normalized;
    };
    const joinShort = (values: string[], limit = 4, maxLength = 120) =>
        values.slice(0, limit).map((value) => clip(value, maxLength)).join(" | ");

    if (retrieved.roomGoalProfile) {
        sections.push(`Room-goal profile:
- room type: ${retrieved.roomGoalProfile.roomType}
- goal: ${retrieved.roomGoalProfile.goal}
- priorities: ${joinShort(retrieved.roomGoalProfile.priorities)}
- support signals: ${joinShort(retrieved.roomGoalProfile.supportSignals)}
- caution signals: ${joinShort(retrieved.roomGoalProfile.cautionSignals)}
- action bias: ${joinShort(retrieved.roomGoalProfile.defaultActionBias)}`);
    }

    if (retrieved.archetype) {
        sections.push(`Archetype guidance:
- name: ${retrieved.archetype.name}
- core quality: ${clip(retrieved.archetype.coreQuality)}
- suggestion directions: ${joinShort(retrieved.archetype.suggestionDirections)}`);
    }

    if (retrieved.dimensions.length > 0) {
        sections.push(`Dimension guardrails:
${retrieved.dimensions.map((dimension) => `- ${dimension.label}: ${joinShort(dimension.commonActions, 3)}`).join("\n")}`);
    }

    if (retrieved.tensionPatterns.length > 0) {
        sections.push(`Matched tension patterns:
${retrieved.tensionPatterns.map((pattern) => `- ${pattern.label}: ${clip(pattern.interpretation)}
  - first move principles: ${joinShort(pattern.firstMovePrinciples, 3)}`).join("\n")}`);
    }

    if (retrieved.interpretationRules.length > 0) {
        sections.push(`Observation-to-meaning mapping:
${retrieved.interpretationRules.map((rule) => `- ${clip(rule.observationPattern, 110)} -> ${clip(rule.userTranslation, 140)}`).join("\n")}`);
    }

    if (retrieved.actionRules.length > 0) {
        sections.push(`Action guidance:
${retrieved.actionRules.map((rule) => `- pattern: ${rule.interpretationPattern}
  - tonight moves: ${joinShort(rule.tonightMoves, 3)}
  - cost level: ${rule.costLevel}`).join("\n")}`);
    }

    sections.push(`Confidence guardrails:
${alignKnowledge.confidenceRules.map((rule) => `- ${clip(rule.when, 100)} -> ${joinShort(rule.guidance, 2, 100)}`).join("\n")}`);

    sections.push(`Brand voice:
- tone: ${retrieved.brandVoice.tone.join(", ")}
- do: ${joinShort(retrieved.brandVoice.do, 4)}
- don't: ${joinShort(retrieved.brandVoice.dont, 4)}
- preferred phrases: ${joinShort(retrieved.brandVoice.preferredPhrases, 8, 80)}
- forbidden phrases: ${joinShort(retrieved.brandVoice.forbiddenPhrases, 8, 80)}
- output rhythm: ${retrieved.brandVoice.outputRhythm.join(" -> ")}`);

    if (retrieved.brandVoice.healingExpressionPolicy) {
        sections.push(`Healing-expression policy:
- max share of copy: ${retrieved.brandVoice.healingExpressionPolicy.maxShareOfCopy}
- role: ${joinShort(retrieved.brandVoice.healingExpressionPolicy.role, 3)}
- disallowed layers: ${joinShort(retrieved.brandVoice.healingExpressionPolicy.disallowedLayers, 4)}`);
    }

    sections.push(`Healing-expression whitelist:
- preferred phrases: ${joinShort(retrieved.healingExpressions.preferredPhrases, 8, 80)}
- sentence patterns: ${joinShort(retrieved.healingExpressions.sentencePatterns, 5, 110)}
- avoid patterns: ${joinShort(retrieved.healingExpressions.avoidPatterns, 5, 110)}
- universal guards: ${joinShort(retrieved.healingUniversalGuards, 4, 110)}`);

    return sections.join("\n\n");
}
