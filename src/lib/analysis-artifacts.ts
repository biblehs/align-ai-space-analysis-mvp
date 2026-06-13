import {
    ANALYSIS_INPUT_VERSION,
    ANALYSIS_REPORT_VERSION,
    ANALYSIS_SCORING_VERSION,
} from "@/lib/analysis-pipeline";
import {
    buildNoteInterpretationV2,
    buildPatternDiagnosis as buildPatternDiagnosisV2FromBuilders,
    buildSnapshotFromArtifactsV2 as buildSnapshotFromArtifactsV2FromBuilders,
} from "@/lib/align-v2/builders";
import { buildLegacySnapshotFromV2 as buildLegacySnapshotFromV2Adapter } from "@/lib/align-v2/snapshot-adapters";
import { determineArchetype, getRatingDetails } from "@/lib/engine";
import { buildFullReportStateRitual } from "@/lib/state-ritual";
import { buildAlignInput, buildTensionMap } from "@/lib/tension-map";
import type {
    FullReportArtifact,
    GoalData,
    NormalizedAnalysisInput,
    PlanStep,
    RoomPreAnalysis,
    ScoreDriver,
    ScoreResult,
    SnapshotResult,
    SpaceData,
    VisionObservation,
    VisionObservationItem,
} from "@/types";
import type { NoteInterpretationV2, PatternDiagnosisV2, SnapshotResultV2 } from "@/lib/align-v2/contracts";

function clampScore(value: number, min = 20, max = 95) {
    return Math.max(min, Math.min(max, Math.round(value)));
}

function slugifyLabel(input: string) {
    return input
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .slice(0, 48) || "observation";
}

function buildObservation(label: string, impact: VisionObservationItem["impact"], evidence: string): VisionObservationItem {
    return {
        key: slugifyLabel(label),
        label,
        impact,
        confidence: 0.74,
        evidence,
    };
}

function pushObservation(
    target: VisionObservationItem[],
    label: string,
    impact: VisionObservationItem["impact"],
    evidence: string | undefined,
) {
    const normalizedEvidence = evidence?.trim();
    if (!normalizedEvidence) {
        return;
    }

    target.push(buildObservation(label, impact, normalizedEvidence));
}

export function buildNormalizedAnalysisInput(spaceData: SpaceData, goalData: GoalData): NormalizedAnalysisInput {
    return {
        roomType: goalData.spaceType ?? spaceData.spaceType ?? "unknown",
        primaryGoal: goalData.goal,
        concern: goalData.concern,
        note: goalData.note?.trim() || null,
        budget: goalData.budget,
        stylePreference: goalData.style,
        perspectives: goalData.perspectives ?? spaceData.perspectives ?? [],
        roomContext: {
            reportedSunlight: spaceData.sunlight ?? "medium",
            reportedDensity: spaceData.density ?? "balanced",
            spaceType: spaceData.spaceType ?? null,
            orientation: spaceData.orientation ?? null,
        },
        constraints: {
            renting: goalData.renting,
            acceptPlants: goalData.acceptPlants,
            acceptLighting: goalData.acceptLighting,
            supportPriority: goalData.supportPriority ?? null,
            changeOpenness: goalData.changeOpenness ?? null,
            budgetComfort: goalData.budgetComfort ?? null,
        },
    };
}

export function buildVisionObservationFromPreAnalysis(preAnalysis: RoomPreAnalysis): VisionObservation {
    const observations: VisionObservationItem[] = [];

    pushObservation(observations, "layout condition", "mixed", preAnalysis.layoutSummary);
    pushObservation(observations, "lighting condition", "mixed", preAnalysis.lightingSummary);
    pushObservation(observations, "clutter condition", "mixed", preAnalysis.clutterSummary);
    pushObservation(observations, "color condition", "mixed", preAnalysis.colorSummary);
    pushObservation(observations, "style condition", "mixed", preAnalysis.styleSummary);

    preAnalysis.standoutFeatures.forEach((feature) => pushObservation(observations, "standout feature", "positive", feature));
    preAnalysis.frictionPoints.forEach((feature) => pushObservation(observations, "friction point", "negative", feature));
    preAnalysis.supportZones.forEach((feature) => pushObservation(observations, "support zone", "positive", feature));
    preAnalysis.stressZones.forEach((feature) => pushObservation(observations, "stress zone", "negative", feature));

    return {
        isRoomPhoto: preAnalysis.isRoomPhoto,
        isUsablePhoto: preAnalysis.isUsablePhoto,
        validationReason: preAnalysis.validationReason,
        roomTypeDetected: preAnalysis.roomType,
        observationSummary: preAnalysis.visualSummary,
        layoutSummary: preAnalysis.layoutSummary,
        lightingSummary: preAnalysis.lightingSummary,
        clutterSummary: preAnalysis.clutterSummary,
        colorSummary: preAnalysis.colorSummary,
        styleSummary: preAnalysis.styleSummary,
        observations,
        standoutFeatures: preAnalysis.standoutFeatures,
        frictionPoints: preAnalysis.frictionPoints,
        supportZones: preAnalysis.supportZones,
        stressZones: preAnalysis.stressZones,
    };
}

export function buildPreAnalysisFromVisionObservation(vision: VisionObservation): RoomPreAnalysis {
    return {
        isRoomPhoto: vision.isRoomPhoto,
        isUsablePhoto: vision.isUsablePhoto,
        validationReason: vision.validationReason,
        roomType: vision.roomTypeDetected,
        visualSummary: vision.observationSummary,
        layoutSummary: vision.layoutSummary,
        lightingSummary: vision.lightingSummary,
        clutterSummary: vision.clutterSummary,
        colorSummary: vision.colorSummary,
        styleSummary: vision.styleSummary,
        standoutFeatures: vision.standoutFeatures,
        frictionPoints: vision.frictionPoints,
        supportZones: vision.supportZones,
        stressZones: vision.stressZones,
    };
}

function scoreFromSummary(summary: string, config: { base: number; positive: string[]; negative: string[] }) {
    const normalized = summary.toLowerCase();
    let score = config.base;

    config.positive.forEach((token) => {
        if (normalized.includes(token)) {
            score += 7;
        }
    });

    config.negative.forEach((token) => {
        if (normalized.includes(token)) {
            score -= 9;
        }
    });

    return clampScore(score);
}

function createDriver(
    key: string,
    direction: ScoreDriver["direction"],
    impact: number,
    rationale: string,
): ScoreDriver {
    return {
        key,
        direction,
        impact,
        rationale,
    };
}

function normalizePlanSteps(plan: PlanStep[]) {
    return plan.map((step, index) => ({
        ...step,
        id: index + 1,
    }));
}

function buildBedroomSleepReportPlan(input: {
    normalizedInput?: NormalizedAnalysisInput | null;
    visionObservation?: VisionObservation | null;
    snapshot: SnapshotResultV2;
}) {
    const supportZone =
        input.visionObservation?.supportZones[0]?.toLowerCase() ||
        "the bed area";
    const wallZone =
        input.visionObservation?.stressZones.find((zone) => /wall|dresser|bed/i.test(zone)) ||
        "the wall above the dresser and bed";
    const eveningLightZone = input.snapshot.firstShift.targetZone || "the room's evening light layer near the bed";

    return normalizePlanSteps([
        {
            id: 1,
            title: "Soften the room's evening light",
            category: "lighting",
            iconName: "Lamp",
            reason: "Bright overhead lighting is the fastest source of night-time alertness to reduce for sleep.",
            action: `Tonight, let ${eveningLightZone} become softer and lower by switching away from the bright overhead lights.`,
            costRange: "$0-$45",
        },
        {
            id: 2,
            title: "Give the bare wall one quiet anchor",
            category: "accessory",
            iconName: "Frame",
            reason: `${wallZone} is still carrying more visual tension than restoration, which keeps the room feeling slightly unfinished.`,
            action: "Add one calm, low-contrast visual anchor so the wall stops reading as empty and unresolved.",
            costRange: "$20-$80",
        },
        {
            id: 3,
            title: "Build one softer layer at the bed",
            category: "textile",
            iconName: "BedDouble",
            reason: `${supportZone} has structure already, but it still needs more tactile softness to cue deeper rest.`,
            action: "Add one softer, more tactile layer around the bed, such as a rug, fuller bedding, or a textured throw.",
            costRange: "$35-$120",
        },
    ]);
}

function buildReportPlan(input: {
    normalizedInput?: NormalizedAnalysisInput | null;
    visionObservation?: VisionObservation | null;
    snapshot: SnapshotResultV2;
    legacyPlan: PlanStep[];
}) {
    const roomType = input.normalizedInput?.roomType?.toLowerCase() ?? "";
    const goal = input.normalizedInput?.primaryGoal;

    if (roomType === "bedroom" && goal === "sleep") {
        return buildBedroomSleepReportPlan(input);
    }

    return normalizePlanSteps(input.legacyPlan);
}

export function buildScoreResult(
    normalizedInput: NormalizedAnalysisInput,
    vision: VisionObservation,
    spaceData: SpaceData,
    goalData: GoalData,
): ScoreResult {
    const reportedSunlight = spaceData.sunlight ?? "medium";
    const reportedDensity = spaceData.density ?? "balanced";
    const lightBase = reportedSunlight === "high" ? 78 : reportedSunlight === "medium" ? 66 : 48;
    const clutterBase = reportedDensity === "sparse" ? 82 : reportedDensity === "balanced" ? 68 : 44;

    const lightScore = scoreFromSummary(vision.lightingSummary, {
        base: lightBase,
        positive: ["soft", "layered", "natural", "bright", "airy", "balanced"],
        negative: ["harsh", "dim", "dark", "flat", "glare", "shadowed"],
    });
    const clutterScore = scoreFromSummary(vision.clutterSummary, {
        base: clutterBase,
        positive: ["clear", "orderly", "tidy", "open", "edited"],
        negative: ["cluttered", "busy", "crowded", "visual noise", "overloaded", "messy"],
    });
    const colorScore = scoreFromSummary(vision.colorSummary, {
        base: 68,
        positive: ["cohesive", "warm", "soft", "harmonious", "balanced"],
        negative: ["cold", "chaotic", "stark", "flat", "competing"],
    });
    const styleScore = scoreFromSummary(vision.styleSummary, {
        base: 70,
        positive: ["cohesive", "consistent", "intentional", "curated", "grounded"],
        negative: ["mismatched", "unfinished", "disjointed", "random"],
    });

    const focus = clampScore(lightScore * 0.3 + clutterScore * 0.35 + colorScore * 0.15 + styleScore * 0.2);
    const sleep = clampScore(lightScore * 0.2 + clutterScore * 0.15 + colorScore * 0.3 + styleScore * 0.35);
    const stress = clampScore(lightScore * 0.15 + clutterScore * 0.25 + colorScore * 0.3 + styleScore * 0.3);
    const energy = clampScore(lightScore * 0.35 + clutterScore * 0.2 + colorScore * 0.2 + styleScore * 0.25);
    const scores = { focus, sleep, stress, energy };

    const goalScore = scores[goalData.goal];
    const overallScore = clampScore((focus + sleep + stress + energy) / 4);
    const { label: ratingLabel, color: ratingColor } = getRatingDetails(goalScore);
    const { title: archetype, desc: archetypeDesc } = determineArchetype(spaceData, goalData.goal);

    const drivers: ScoreDriver[] = [];
    const negativeZone = vision.stressZones[0] ?? vision.frictionPoints[0] ?? "the room's busiest area";
    const positiveZone = vision.supportZones[0] ?? vision.standoutFeatures[0] ?? "the room's calmest visible area";

    drivers.push(
        createDriver(
            "lighting",
            lightScore >= 65 ? "positive" : "negative",
            Math.abs(lightScore - 70),
            `${vision.lightingSummary} This is most visible around ${negativeZone.toLowerCase()}.`,
        ),
    );
    drivers.push(
        createDriver(
            "clutter",
            clutterScore >= 65 ? "positive" : "negative",
            Math.abs(clutterScore - 70),
            `${vision.clutterSummary} The strongest effect shows near ${negativeZone.toLowerCase()}.`,
        ),
    );
    drivers.push(
        createDriver(
            "support_zone",
            "positive",
            8,
            `${positiveZone} already gives the room a stronger base for ${normalizedInput.primaryGoal}.`,
        ),
    );

    const topIssues = vision.frictionPoints.slice(0, 3);
    const strengths = vision.standoutFeatures.slice(0, 3);
    const quickWins = [
        `Start with ${negativeZone.toLowerCase()} and remove one competing visual distraction.`,
        `Reinforce ${positiveZone.toLowerCase()} as the clearest support zone for ${normalizedInput.primaryGoal}.`,
        normalizedInput.constraints.acceptLighting
            ? "Add one softer secondary light source only if the room still feels harsh at night."
            : "Use layout and texture changes first because lighting changes are off the table.",
    ];

    return {
        scoringVersion: ANALYSIS_SCORING_VERSION,
        goal: normalizedInput.primaryGoal,
        goalScore,
        overallScore,
        ratingLabel,
        ratingColor,
        scores,
        drivers,
        topIssues,
        strengths,
        quickWins,
        overallStrategy: `Reduce pressure around ${negativeZone.toLowerCase()} and build more intentional support around ${positiveZone.toLowerCase()} for ${normalizedInput.primaryGoal}.`,
        archetype,
        archetypeDesc,
    };
}

export function buildNoteInterpretation(
    normalizedInput: NormalizedAnalysisInput,
): NoteInterpretationV2 {
    return buildNoteInterpretationV2(normalizedInput.note);
}

export function buildPatternDiagnosis(
    normalizedInput: NormalizedAnalysisInput,
    vision: VisionObservation,
    goalData: GoalData,
): PatternDiagnosisV2 {
    return buildPatternDiagnosisV2FromBuilders(normalizedInput, vision, goalData);
}

export function buildSnapshotFromArtifactsV2(
    normalizedInput: NormalizedAnalysisInput,
    vision: VisionObservation,
    score: ScoreResult,
    goalData: GoalData,
): SnapshotResultV2 {
    return buildSnapshotFromArtifactsV2FromBuilders(normalizedInput, vision, score, goalData);
}

export function buildLegacySnapshotFromV2(snapshotV2: SnapshotResultV2): SnapshotResult {
    return buildLegacySnapshotFromV2Adapter(snapshotV2);
}

export function buildSnapshotFromArtifacts(
    vision: VisionObservation,
    score: ScoreResult,
    goalData: GoalData,
): SnapshotResult {
    const supportZone = vision.supportZones[0] || "the calmest visible part of the room";
    const stressZone = vision.stressZones[0] || vision.frictionPoints[0] || "the busiest visible area";
    const firstFeature = vision.standoutFeatures[0] || "a promising visual anchor";
    const firstIssue = score.topIssues[0] || "a visible pressure point";
    const lightingScore = score.scores[goalData.goal];

    return {
        analysisMode: "fallback",
        analysisNotice: "This report used ALIGN's structured observation and scoring pipeline.",
        score: score.goalScore,
        ratingLabel: score.ratingLabel,
        ratingColor: score.ratingColor,
        archetype: score.archetype,
        archetypeDesc: score.archetypeDesc,
        sceneFingerprint: vision.standoutFeatures.slice(0, 3),
        primaryTension: `${firstIssue} is still competing with your ${goalData.goal} goal and needs a clearer directional cue.`,
        stressImpact: `${stressZone} appears to be carrying the most sensory pressure right now, which is making ${goalData.goal} feel harder to sustain.`,
        freeInsight: score.quickWins[0] ?? `Start with ${stressZone.toLowerCase()} and remove one visible distraction.`,
        integratedReading: `${vision.observationSummary} ${vision.layoutSummary} ${vision.styleSummary}`,
        missingElement: {
            icon: "🪴",
            text: `A calmer support layer around ${supportZone.toLowerCase()}`,
        },
        overloadedElement: {
            icon: "📦",
            text: `${firstIssue} around ${stressZone.toLowerCase()}`,
        },
        dimensions: {
            sunlight: { score: lightingScore, evaluation: vision.lightingSummary },
            clutter: { score: scoreFromSummary(vision.clutterSummary, { base: 65, positive: ["clear", "tidy"], negative: ["cluttered", "busy"] }), evaluation: vision.clutterSummary },
            color: { score: scoreFromSummary(vision.colorSummary, { base: 68, positive: ["warm", "cohesive"], negative: ["cold", "chaotic"] }), evaluation: vision.colorSummary },
            style: { score: scoreFromSummary(vision.styleSummary, { base: 70, positive: ["cohesive", "intentional"], negative: ["mismatched", "unfinished"] }), evaluation: vision.styleSummary },
        },
        energyFlow: {
            score: clampScore(score.overallScore - 4),
            evaluation: vision.layoutSummary,
            blockageZone: stressZone,
            supportZone,
        },
        elementBalance: {
            score: clampScore(score.overallScore - 2),
            missingElement: `The room could use more grounding softness near ${supportZone.toLowerCase()}.`,
            excessiveElement: `${stressZone} currently concentrates too much visual pressure.`,
            recommendation: `Reduce contrast around ${stressZone.toLowerCase()} and make ${supportZone.toLowerCase()} the room's main stabilizing anchor.`,
        },
        wellnessSignals: {
            score: clampScore(score.goalScore - 1),
            nervousSystemLoad: `${stressZone} is likely carrying the room's highest cognitive or emotional load.`,
            restorativeSupport: `${supportZone} already offers the strongest restorative signal visible in the room.`,
            ritualPotential: `A short reset ritual anchored near ${supportZone.toLowerCase()} would make the room feel more supportive without a major redesign.`,
        },
        holisticSupports: {
            crystalSupport: `Place a grounding crystal near ${supportZone.toLowerCase()} to reinforce the room's calmest visible zone.`,
            incenseSupport: `Use a soft incense near ${supportZone.toLowerCase()} during a short reset ritual to mark a calmer transition.`,
            candleSupport: `A warm candle near ${supportZone.toLowerCase()} can soften the room's current tension and reinforce evening calm.`,
            ritualSupport: `Use ${supportZone.toLowerCase()} as a two-minute breathing, tea, or journaling anchor so the room carries a repeatable emotional cue.`,
        },
        spatialRemedies: [
            {
                zone: stressZone,
                issue: firstIssue,
                remedy: `Reduce one competing object or visual distraction in ${stressZone.toLowerCase()} and let a single intentional item lead the eye.`,
                expectedShift: `This should lower visual drag and make the room feel more supportive for ${goalData.goal}.`,
                modality: "layout",
            },
            {
                zone: supportZone,
                issue: `This area has strong potential but is not yet fully activated for ${goalData.goal}.`,
                remedy: `Add one grounding texture, ritual cue, or softer layer near ${supportZone.toLowerCase()}.`,
                expectedShift: "This should make the room feel more intentional, calm, and usable day to day.",
                modality: "wellness",
            },
        ],
        preserveWhatWorks: `${firstFeature} is already giving the room a useful point of support, so the goal is to reinforce it rather than replace it.`,
        personalizedRecommendations: [
            {
                category: "layout",
                title: "Clear the main pressure point first",
                reason: `${firstIssue} is the clearest obstacle to your ${goalData.goal} goal.`,
                action: score.quickWins[0] ?? `Start with ${stressZone.toLowerCase()} and remove one competing distraction.`,
                expectedBenefit: `This should quickly reduce visual drag and make the room feel more aligned with ${goalData.goal}.`,
            },
            {
                category: "texture",
                title: "Strengthen the calmest support zone",
                reason: `${supportZone} already reads as the room's best support area.`,
                action: score.quickWins[1] ?? `Add one soft or grounding cue near ${supportZone.toLowerCase()}.`,
                expectedBenefit: "A stronger support zone will make the whole room feel more settled without a major redesign.",
            },
            {
                category: "wellness",
                title: "Create one repeatable room ritual",
                reason: "Habit reinforcement usually creates the fastest emotional shift once the room has a visible support zone.",
                action: `Use ${supportZone.toLowerCase()} for a short daily reset ritual such as tea, breathing, or journaling.`,
                expectedBenefit: "This helps the room support your nervous system more consistently over time.",
            },
        ],
        overallStrategy: score.overallStrategy,
    };
}

export function buildFullReportArtifact(input: {
    normalizedInput?: NormalizedAnalysisInput | null;
    visionObservation?: VisionObservation | null;
    scoreResult?: ScoreResult | null;
    snapshot: SnapshotResultV2;
    plan: PlanStep[];
}): FullReportArtifact {
    const reportPlan = buildReportPlan({
        normalizedInput: input.normalizedInput,
        visionObservation: input.visionObservation,
        snapshot: input.snapshot,
        legacyPlan: input.plan,
    });
    const stateRitual = buildFullReportStateRitual({
        roomType: input.normalizedInput?.roomType,
        goal: input.normalizedInput?.primaryGoal,
        snapshotStateRitual: input.snapshot.stateRitual,
    });
    const supportZone =
        input.visionObservation?.supportZones[0] ||
        input.snapshot.firstShift.targetZone ||
        "the room's strongest existing support zone";
    const stressZone =
        input.visionObservation?.stressZones[0] ||
        input.snapshot.tension.headline ||
        "the room's highest-pressure area";
    const topIssue =
        input.scoreResult?.topIssues[0] ||
        input.visionObservation?.frictionPoints[0] ||
        input.snapshot.tension.headline ||
        "the room's main visible pressure point";
    const topStrength =
        input.scoreResult?.strengths[0] ||
        input.visionObservation?.standoutFeatures[0] ||
        input.snapshot.proof.find((item) => item.impact !== "negative")?.evidence ||
        "a visible strength already present in the room";
    const goal = input.normalizedInput?.primaryGoal ?? "focus";
    const tensionMap =
        input.normalizedInput && input.visionObservation
            ? buildTensionMap(buildAlignInput(input.normalizedInput, input.visionObservation))
            : null;

    return {
        version: ANALYSIS_REPORT_VERSION,
        generatedFrom: {
            normalizedInput: Boolean(input.normalizedInput),
            visionObservation: Boolean(input.visionObservation),
            scoreResult: Boolean(input.scoreResult),
            snapshot: true,
        },
        summary: {
            headline: input.snapshot.type.name,
            overview:
                `${input.snapshot.reading.oneLiner} ${input.snapshot.reading.shortParagraph} ${tensionMap?.whyThisMatters ?? ""}`.trim() ||
                `${topStrength} is already helping, but ${topIssue} is still getting in the way of ${goal}.`,
            strategy: input.snapshot.preview.fullReportPromise,
        },
        sections: [
            {
                key: "overview",
                title: "Overview",
                body:
                    `${input.snapshot.reading.oneLiner} ${input.snapshot.reading.shortParagraph} ${tensionMap?.whyThisMatters ?? ""}`.trim() ||
                    `${topStrength} gives the room a good starting point, but ${topIssue} is still diluting the room's support for ${goal}.`,
            },
            {
                key: "pressure_points",
                title: "Top Pressure Points",
                body: tensionMap
                    ? `${stressZone} is carrying the room's main friction right now. ${tensionMap.coreConflict}`
                    : `${stressZone} is carrying the room's main friction right now. ${input.snapshot.tension.explanation}`,
            },
            {
                key: "strengths",
                title: "What Is Already Working",
                body: `${supportZone} is the clearest support zone visible in the room. ${topStrength}`,
            },
            ...(tensionMap
                ? [
                    {
                        key: "not_yet",
                        title: "What Not to Do Yet",
                        body: tensionMap.notYet.join(" "),
                    },
                    {
                        key: "first_relief",
                        title: "What May Shift First",
                        body: tensionMap.likelyFirstRelief.join(" "),
                    },
                ]
                : []),
            {
                key: "next_steps",
                title: "Priority Shifts",
                body: `${tensionMap ? `${tensionMap.topLeveragePoint} ` : ""}${reportPlan.map((step, index) => `${index + 1}. ${step.title}: ${step.action}`).join(" ")}`,
            },
        ],
        plan: reportPlan,
        stateRitual,
    };
}

export const ANALYSIS_ARTIFACT_VERSIONS = {
    normalizedInput: ANALYSIS_INPUT_VERSION,
    scoreResult: ANALYSIS_SCORING_VERSION,
    fullReport: ANALYSIS_REPORT_VERSION,
    snapshotV2: "2026-04-01.snapshot.v2",
    patternDiagnosis: "2026-04-01.pattern-diagnosis.v2",
    noteInterpretation: "2026-04-01.note-interpretation.v2",
} as const;
