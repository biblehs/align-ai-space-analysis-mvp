import type { ClaimedGoalTypeV2, SnapshotResultV2 } from "@/lib/align-v2/contracts";
import type { Goal, GoalData, SnapshotResult, SpaceData } from "@/types";
import { calculateBalanceScore, determineArchetype, getRatingDetails } from "@/lib/engine";

function toClaimedGoal(goal: Goal): ClaimedGoalTypeV2 {
    if (goal === "stress") {
        return "calm";
    }

    if (goal === "energy") {
        return "vitality";
    }

    return goal;
}

export function isSnapshotResultV2(snapshot: unknown): snapshot is SnapshotResultV2 {
    if (!snapshot || typeof snapshot !== "object") {
        return false;
    }

    return "type" in snapshot && "reading" in snapshot && "firstShift" in snapshot;
}

export function coerceSnapshotV2(snapshot: SnapshotResultV2 | SnapshotResult | null | undefined): SnapshotResultV2 | null {
    if (!snapshot) {
        return null;
    }

    if (isSnapshotResultV2(snapshot)) {
        return snapshot;
    }

    return {
        version: "2026-04-01.snapshot.v2",
        analysisMode: snapshot.analysisMode ?? "fallback",
        validation: {
            status: "valid",
            code: "valid",
            message: snapshot.analysisNotice ?? "Legacy ALIGN snapshot",
            finalRoomType: "unknown",
            roomMismatch: {
                mismatch: false,
                severity: "none",
                reason: null,
                userActionRequired: false,
                suggestedAction: "continue",
            },
        },
        type: {
            id: "unknown",
            name: snapshot.archetype,
            coreSentence: snapshot.archetypeDesc,
            confidence: 0.7,
        },
        summary: {
            headline: snapshot.primaryTension ?? "This room has a useful base, but still needs a clearer support signal.",
            statusTags: ["Legacy reading", "Support in progress", "Needs clearer cues"],
            body: snapshot.integratedReading ?? snapshot.stressImpact,
        },
        score: {
            goal: "focus",
            value: snapshot.score,
            overall: Math.round(
                (
                    snapshot.dimensions.sunlight.score +
                    snapshot.dimensions.clutter.score +
                    snapshot.dimensions.color.score +
                    snapshot.dimensions.style.score
                ) / 4,
            ),
            label: snapshot.ratingLabel,
            narrative: snapshot.analysisNotice ?? "Legacy ALIGN snapshot",
            meaning: snapshot.dimensions.sunlight.evaluation,
        },
        reading: {
            oneLiner: snapshot.primaryTension ?? snapshot.freeInsight,
            shortParagraph: snapshot.integratedReading ?? snapshot.stressImpact,
        },
        proof: (snapshot.sceneFingerprint ?? []).slice(0, 3).map((item, index) => ({
            label: `Legacy signal ${index + 1}`,
            evidence: item,
            impact: "mixed" as const,
        })),
        spaceState: {
            overallScore: snapshot.score,
            strongest: "Calm",
            weakest: "Restoration",
            coreGap: "Legacy snapshots do not yet carry the full six-dimension explanation.",
            dimensions: [
                { key: "calm", label: "Calm", score: snapshot.score, level: snapshot.score >= 72 ? "strong" : snapshot.score >= 52 ? "medium" : "weak", summary: snapshot.dimensions.sunlight.evaluation },
                { key: "clarity", label: "Clarity", score: snapshot.dimensions.clutter.score, level: snapshot.dimensions.clutter.score >= 72 ? "strong" : snapshot.dimensions.clutter.score >= 52 ? "medium" : "weak", summary: snapshot.dimensions.clutter.evaluation },
                { key: "grounding", label: "Grounding", score: snapshot.dimensions.style.score, level: snapshot.dimensions.style.score >= 72 ? "strong" : snapshot.dimensions.style.score >= 52 ? "medium" : "weak", summary: snapshot.dimensions.style.evaluation },
                { key: "warmth", label: "Warmth", score: snapshot.dimensions.color.score, level: snapshot.dimensions.color.score >= 72 ? "strong" : snapshot.dimensions.color.score >= 52 ? "medium" : "weak", summary: snapshot.dimensions.color.evaluation },
                { key: "openness", label: "Openness", score: snapshot.dimensions.sunlight.score, level: snapshot.dimensions.sunlight.score >= 72 ? "strong" : snapshot.dimensions.sunlight.score >= 52 ? "medium" : "weak", summary: snapshot.dimensions.sunlight.evaluation },
                { key: "restoration", label: "Restoration", score: snapshot.score, level: snapshot.score >= 72 ? "strong" : snapshot.score >= 52 ? "medium" : "weak", summary: snapshot.overallStrategy },
            ],
        },
        tension: {
            headline: snapshot.primaryTension ?? "Legacy snapshot tension",
            explanation: snapshot.stressImpact,
        },
        firstShift: {
            title: "First shift",
            action: snapshot.freeInsight,
            examples: [],
            whyItHelps: snapshot.overallStrategy,
            targetZone: snapshot.energyFlow?.supportZone ?? "the room",
            timing: "tonight",
        },
        brandHook: {
            title: "You do not need another reset.",
            subtitle: "You need a clearer restorative cue.",
            signals: [
                "A softer signal",
                "A calmer landing point",
                "More support where tension gathers",
                "A clearer sense of what to change first",
            ],
        },
        preview: {
            teaserTitle: "If you keep going, the full report shows you",
            hiddenFindings: snapshot.personalizedRecommendations?.slice(0, 2).map((item) => item.title) ?? [],
            fullReportPromise: snapshot.overallStrategy,
            ctaText: "Unlock Full Report",
        },
        meta: {
            noteUsed: false,
            diagnosisConfidence: 0.6,
            generationMode: "fully_templated",
        },
    };
}

export function buildLegacySnapshotFromV2(snapshotV2: SnapshotResultV2): SnapshotResult {
    const strongestNegativeProof = snapshotV2.proof.find((item) => item.impact === "negative") ?? snapshotV2.proof[0];
    const strongestPositiveProof = [...snapshotV2.proof].reverse().find((item) => item.impact !== "negative") ?? snapshotV2.proof[0];
    const ratingColorMap: Record<string, string> = {
        "Needs Care": "text-red-500",
        "Needs Attention": "text-red-500",
        "Quiet Potential": "text-yellow-500",
        "Room to Grow": "text-yellow-500",
        "Strong Support": "text-green-500",
        "Well Balanced": "text-green-500",
        Harmonized: "text-purple-500",
    };

    return {
        analysisMode: snapshotV2.analysisMode,
        score: snapshotV2.score.value,
        ratingLabel: snapshotV2.score.label,
        ratingColor: ratingColorMap[snapshotV2.score.label] ?? "text-green-500",
        archetype: snapshotV2.type.name,
        archetypeDesc: snapshotV2.type.coreSentence,
        sceneFingerprint: snapshotV2.proof.map((item) => item.evidence),
        primaryTension: snapshotV2.tension.headline,
        stressImpact: snapshotV2.tension.explanation,
        freeInsight: snapshotV2.firstShift.action,
        integratedReading: `${snapshotV2.reading.oneLiner} ${snapshotV2.reading.shortParagraph}`.trim(),
        missingElement: {
            icon: strongestNegativeProof?.impact === "negative" ? "⚠️" : "🪴",
            text: strongestNegativeProof?.evidence ?? "A clearer support cue",
        },
        overloadedElement: {
            icon: strongestNegativeProof?.impact === "negative" ? "📦" : "✨",
            text: strongestNegativeProof?.evidence ?? "A competing visual signal",
        },
        dimensions: {
            sunlight: { score: snapshotV2.score.value, evaluation: snapshotV2.score.meaning },
            clutter: { score: snapshotV2.score.overall, evaluation: strongestNegativeProof?.evidence ?? snapshotV2.tension.explanation },
            color: { score: snapshotV2.score.overall, evaluation: snapshotV2.reading.shortParagraph },
            style: { score: snapshotV2.score.overall, evaluation: snapshotV2.type.coreSentence },
        },
        overallStrategy: snapshotV2.preview.fullReportPromise,
        preserveWhatWorks: strongestPositiveProof?.evidence ?? snapshotV2.reading.shortParagraph,
        spatialRemedies: [
            {
                zone: snapshotV2.firstShift.targetZone,
                issue: snapshotV2.tension.headline,
                remedy: snapshotV2.firstShift.action,
                expectedShift: snapshotV2.firstShift.whyItHelps,
                modality: "layout",
            },
        ],
        personalizedRecommendations: snapshotV2.preview.hiddenFindings.map((finding) => ({
            category: "layout" as const,
            title: finding,
            reason: snapshotV2.tension.explanation,
            action: snapshotV2.firstShift.action,
            expectedBenefit: snapshotV2.preview.fullReportPromise,
        })),
    };
}

export function buildPendingSnapshotPlaceholderV2(): SnapshotResultV2 {
    return {
        version: "2026-04-01.snapshot.v2",
        analysisMode: "fallback",
        validation: {
            status: "valid",
            code: "valid",
            message: "Your room snapshot is still processing.",
            finalRoomType: "unknown",
            roomMismatch: {
                mismatch: false,
                severity: "none",
                reason: null,
                userActionRequired: false,
                suggestedAction: "continue",
            },
        },
        type: {
            id: "unknown",
            name: "Preparing Analysis",
            coreSentence: "ALIGN is still reading your room and building the report.",
            confidence: 0,
        },
        summary: {
            headline: "Your room reading is still taking shape.",
            statusTags: ["Analysis in progress", "Reading the room", "Building your first shift"],
            body: "We are still turning the room scan into a clearer reading, a support map, and one first move.",
        },
        score: {
            goal: "focus",
            value: 0,
            overall: 0,
            label: "Preparing",
            narrative: "We are still evaluating your room.",
            meaning: "Preparing your report.",
        },
        reading: {
            oneLiner: "Your room reading is in progress.",
            shortParagraph: "We are still evaluating light, layout, density, and support zones.",
        },
        proof: [],
        spaceState: {
            overallScore: 0,
            strongest: "None yet",
            weakest: "None yet",
            coreGap: "The analysis is still being built.",
            dimensions: [
                { key: "calm", label: "Calm", score: 0, level: "weak", summary: "Preparing your reading." },
                { key: "clarity", label: "Clarity", score: 0, level: "weak", summary: "Preparing your reading." },
                { key: "grounding", label: "Grounding", score: 0, level: "weak", summary: "Preparing your reading." },
                { key: "warmth", label: "Warmth", score: 0, level: "weak", summary: "Preparing your reading." },
                { key: "openness", label: "Openness", score: 0, level: "weak", summary: "Preparing your reading." },
                { key: "restoration", label: "Restoration", score: 0, level: "weak", summary: "Preparing your reading." },
            ],
        },
        tension: {
            headline: "Analysis in progress",
            explanation: "We are still evaluating how your room affects focus, rest, and emotional balance.",
        },
        firstShift: {
            title: "Preparing your first shift",
            action: "Your free snapshot is being prepared right now.",
            examples: [],
            whyItHelps: "This will appear as soon as analysis completes.",
            targetZone: "the room",
            timing: "tonight",
        },
        brandHook: {
            title: "This is more than a room score.",
            subtitle: "We are building the next best move for your space.",
            signals: [],
        },
        preview: {
            teaserTitle: "If you keep going, the full report shows you",
            hiddenFindings: [],
            fullReportPromise: "Preparing your report.",
            ctaText: "Unlock Full Report",
        },
        meta: {
            noteUsed: false,
            diagnosisConfidence: 0,
            generationMode: "fully_templated",
        },
    };
}

export function buildFallbackSnapshotV2(input: {
    goal: Goal;
    goalData: GoalData;
    spaceData: SpaceData;
}): SnapshotResultV2 {
    const fallbackSunlight = input.spaceData.sunlight ?? "medium";
    const fallbackDensity = input.spaceData.density ?? "balanced";
    const score = calculateBalanceScore(input.spaceData, input.goal);
    const { label } = getRatingDetails(score);
    const { title: archetype, desc: archetypeDesc } = determineArchetype(input.spaceData, input.goal);

    const tensionExplanation =
        fallbackDensity === "dense"
            ? `Your environment's high visual density is directly competing with your ${input.goal} goals, increasing cognitive load by an estimated 25%.`
            : fallbackDensity === "sparse"
                ? `The sparse nature of your room lacks warmth, making it harder to establish a relaxing rhythm for your ${input.goal} goals.`
                : "Your current density level combined with your lighting choices affects cognitive fatigue.";

    return {
        version: "2026-04-01.snapshot.v2",
        analysisMode: "fallback",
        validation: {
            status: "valid",
            code: "valid",
            message: "This report is an estimate based on your questionnaire because image analysis was unavailable for this run.",
            finalRoomType: "unknown",
            roomMismatch: {
                mismatch: false,
                severity: "none",
                reason: null,
                userActionRequired: false,
                suggestedAction: "continue",
            },
        },
        type: {
            id: "unknown",
            name: archetype,
            coreSentence: archetypeDesc,
            confidence: 0.4,
        },
        summary: {
            headline: "Your room already has a direction, but the support is not fully consistent yet.",
            statusTags: ["Fast fallback", "Directional reading", "Next move available"],
            body: "This fallback snapshot uses your room inputs and visible context to give you a first reading while keeping the guidance practical.",
        },
        score: {
            goal: toClaimedGoal(input.goal),
            value: score,
            overall: score,
            label,
            narrative: "Temporary estimate",
            meaning: "This provisional report is based on your questionnaire because photo analysis was unavailable.",
        },
        reading: {
            oneLiner: "This is a provisional room reading.",
            shortParagraph:
                "It can estimate your room's mood and pressure level, but it cannot yet see the exact corners, surfaces, or objects shaping your energy.",
        },
        proof: [
            {
                label: "Reported sunlight",
                evidence: `Self-reported sunlight is ${fallbackSunlight}.`,
                impact: fallbackSunlight === "low" ? "negative" : "mixed",
            },
            {
                label: "Reported density",
                evidence: `Self-reported density is ${fallbackDensity}.`,
                impact: fallbackDensity === "dense" ? "negative" : "mixed",
            },
        ],
        spaceState: {
            overallScore: score,
            strongest: "Calm",
            weakest: "Restoration",
            coreGap: "This fallback view is directional and still needs the full room reading for precision.",
            dimensions: [
                { key: "calm", label: "Calm", score: score, level: score >= 72 ? "strong" : score >= 52 ? "medium" : "weak", summary: "A first directional read based on the available room context." },
                { key: "clarity", label: "Clarity", score: Math.max(score - 2, 0), level: score - 2 >= 72 ? "strong" : score - 2 >= 52 ? "medium" : "weak", summary: "This is a lighter read until the full room scan is available." },
                { key: "grounding", label: "Grounding", score: Math.max(score - 4, 0), level: score - 4 >= 72 ? "strong" : score - 4 >= 52 ? "medium" : "weak", summary: "The room likely has some support, but not enough confirmed detail yet." },
                { key: "warmth", label: "Warmth", score: Math.max(score - 6, 0), level: score - 6 >= 72 ? "strong" : score - 6 >= 52 ? "medium" : "weak", summary: "Warmth is inferred more lightly in fallback mode." },
                { key: "openness", label: "Openness", score: Math.max(score - 1, 0), level: score - 1 >= 72 ? "strong" : score - 1 >= 52 ? "medium" : "weak", summary: "The room likely has some usable breathing space." },
                { key: "restoration", label: "Restoration", score: Math.max(score - 8, 0), level: score - 8 >= 72 ? "strong" : score - 8 >= 52 ? "medium" : "weak", summary: "Restoration is the least certain piece in fallback mode." },
            ],
        },
        tension: {
            headline: `Your biggest tension is between your ${input.goal} goal and the limited visual evidence currently available.`,
            explanation: tensionExplanation,
        },
        firstShift: {
            title: "Calibrate the room gently",
            action: "Start with small adjustments to lighting and one visible friction zone.",
            examples: [
                "Use one lower, warmer light source.",
                "Quiet one active surface.",
                "Add one softer cue near the calmest area.",
            ],
            whyItHelps: "Small visible changes can improve comfort even before a full image-based diagnosis is available.",
            targetZone: "the room's busiest visible area",
            timing: "tonight",
        },
        brandHook: {
            title: "You do not need to change everything.",
            subtitle: "You need the room to send a clearer signal.",
            signals: [
                "One calmer zone",
                "One softer cue",
                "One clearer support pattern",
            ],
        },
        preview: {
            teaserTitle: "If you keep going, the full report shows you",
            hiddenFindings: [
                "Where the strongest support zone will emerge once the image is readable",
                "Which corner is holding the most visual pressure",
            ],
            fullReportPromise: "A full image-based report will identify the clearest support zone, friction points, and next shifts for your actual room.",
            ctaText: "Unlock Full Report",
        },
        meta: {
            noteUsed: Boolean(input.goalData.note?.trim()),
            diagnosisConfidence: 0.35,
            generationMode: "fully_templated",
        },
    };
}
