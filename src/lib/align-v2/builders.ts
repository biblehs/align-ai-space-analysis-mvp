import type {
    ClaimedContextV2,
    ClaimedGoalTypeV2,
    ClaimedIssueTypeV2,
    NoteInterpretationV2,
    OptionalPreferencesV2,
    PatternDiagnosisProofV2,
    PatternDiagnosisV2,
    SnapshotResultV2,
    VisionInvalidCodeV2,
    VisionValidationV2,
} from "./contracts";
import { DIAGNOSIS_SIGNAL_SELECTION_RULES, PATTERN_DIAGNOSIS_SCORING_MATRIX, type DiagnosisSignalKey } from "./pattern-diagnosis-matrix";
import { buildAlignInput, buildTensionMap } from "@/lib/tension-map";
import type { TensionMap } from "@/lib/tension-map";
import { buildStateRitual } from "@/lib/state-ritual";
import type { GoalData, NormalizedAnalysisInput, ScoreResult, VisionObservation } from "../../types";

function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
}

function toCanonicalRoomType(roomType: string | null | undefined) {
    const normalized = (roomType ?? "").trim().toLowerCase();

    if (!normalized) {
        return "unknown" as const;
    }

    if (normalized.includes("bed")) {
        return "bedroom" as const;
    }
    if (normalized.includes("living")) {
        return "living_room" as const;
    }
    if (normalized.includes("work") || normalized.includes("office") || normalized.includes("desk")) {
        return "workspace" as const;
    }
    if (normalized.includes("studio")) {
        return "creative_studio" as const;
    }
    if (normalized.includes("dining")) {
        return "dining_room" as const;
    }
    if (normalized.includes("kitchen")) {
        return "kitchen" as const;
    }
    if (normalized.includes("bath")) {
        return "bathroom" as const;
    }
    if (normalized.includes("entry") || normalized.includes("foyer") || normalized.includes("hall")) {
        return "entryway" as const;
    }

    return "unknown" as const;
}

function fromCurrentGoal(goal: NormalizedAnalysisInput["primaryGoal"]): ClaimedGoalTypeV2 {
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
            return "focus";
    }
}

function fromSelectedIssue(issue: string | null | undefined): ClaimedIssueTypeV2 | null {
    switch (issue) {
        case "cluttered":
        case "heavy":
        case "visually-noisy":
        case "unfocused":
        case "draining":
        case "hard-to-relax":
        case "lacking-warmth":
        case "stuck":
            return issue;
        default:
            return null;
    }
}

function buildClaimedContext(input: NormalizedAnalysisInput, goalData: GoalData): ClaimedContextV2 {
    return {
        claimedRoomType:
            input.roomType === "bedroom" ||
            input.roomType === "workspace" ||
            input.roomType === "living-room" ||
            input.roomType === "creative-studio"
                ? input.roomType
                : null,
        primaryGoal: fromCurrentGoal(input.primaryGoal),
        primaryIssue: fromSelectedIssue(goalData.selectedIssue),
    };
}

function buildOptionalPreferences(goalData: GoalData): OptionalPreferencesV2 {
    const provided = Boolean(goalData.supportPriority || goalData.changeOpenness || goalData.budgetComfort);

    const supportPriority = (() => {
        const normalized = goalData.supportPriority?.toLowerCase() ?? "";
        if (normalized.includes("sleep") || normalized.includes("rest")) return "sleep";
        if (normalized.includes("focus")) return "focus";
        if (normalized.includes("calm")) return "calm";
        if (normalized.includes("ground")) return "grounding";
        return null;
    })();

    const changeOpenness = (() => {
        const normalized = goalData.changeOpenness?.toLowerCase() ?? "";
        if (!normalized) return null;
        if (normalized.includes("no-cost") || normalized.includes("small")) return "light";
        if (normalized.includes("affordable") || normalized.includes("few")) return "moderate";
        return "significant";
    })();

    const budgetComfort = (() => {
        const normalized = goalData.budgetComfort?.toLowerCase() ?? "";
        if (!normalized) return null;
        if (normalized.includes("no budget") || normalized.includes("under")) return "low";
        if (normalized.includes("$30") || normalized.includes("$80")) return "medium";
        return "high";
    })();

    return {
        provided,
        supportPriority,
        changeOpenness,
        budgetComfort,
    };
}

function inferInvalidCode(vision: VisionObservation): VisionInvalidCodeV2 {
    if (!vision.isRoomPhoto) {
        return "not_a_room";
    }
    if (vision.isUsablePhoto) {
        return "valid";
    }

    const reason = vision.validationReason.toLowerCase();
    if (reason.includes("dark")) return "too_dark";
    if (reason.includes("blur")) return "too_blurry";
    if (reason.includes("close")) return "too_close";
    if (reason.includes("blank") || reason.includes("surface") || reason.includes("wall")) return "blank_or_nearly_blank";
    if (reason.includes("multiple") || reason.includes("confusing")) return "multiple_spaces_confusing";
    return "insufficient_context";
}

export function buildVisionValidationV2(
    vision: VisionObservation,
    claimedRoomType: string | null | undefined,
): VisionValidationV2 {
    const detectedRoomType = toCanonicalRoomType(vision.roomTypeDetected);
    const claimedCanonical = claimedRoomType ? toCanonicalRoomType(claimedRoomType) : null;
    const confidence = detectedRoomType === "unknown" ? 0.45 : 0.85;
    const mismatch = Boolean(claimedCanonical && detectedRoomType !== "unknown" && claimedCanonical !== detectedRoomType);

    const code = inferInvalidCode(vision);
    if (code !== "valid") {
        return {
            status: "invalid",
            code,
            message: vision.validationReason,
            isRoomPhoto: vision.isRoomPhoto,
            isUsablePhoto: vision.isUsablePhoto,
            claimedRoomType: claimedCanonical,
            detectedRoomType,
            detectedRoomTypeConfidence: confidence,
            finalRoomType: null,
            roomMismatch: {
                mismatch,
                severity: "none",
                reason: null,
                userActionRequired: false,
                suggestedAction: "reupload",
            },
            quality: {
                brightness: vision.lightingSummary.toLowerCase().includes("dark") ? "low" : "medium",
                blur: "medium",
                framing: "partial",
                contextCoverage: "insufficient",
            },
        };
    }

    if (mismatch && confidence >= DIAGNOSIS_SIGNAL_SELECTION_RULES.hardMismatchConfidenceThreshold) {
        return {
            status: "action_required",
            code: "valid",
            message: `This looks more like a ${detectedRoomType.replace("_", " ")} than a ${claimedCanonical?.replace("_", " ")}.`,
            isRoomPhoto: true,
            isUsablePhoto: true,
            claimedRoomType: claimedCanonical,
            detectedRoomType,
            detectedRoomTypeConfidence: confidence,
            finalRoomType: null,
            roomMismatch: {
                mismatch: true,
                severity: "hard",
                reason: "Detected room type conflicts strongly with the user's selected room type.",
                userActionRequired: true,
                suggestedAction: "confirm_detected_room_type",
            },
            quality: {
                brightness: vision.lightingSummary.toLowerCase().includes("dark") ? "low" : "medium",
                blur: "low",
                framing: "good",
                contextCoverage: "sufficient",
            },
        };
    }

    const finalRoomType =
        !claimedCanonical ? detectedRoomType :
        detectedRoomType === "unknown" || confidence < DIAGNOSIS_SIGNAL_SELECTION_RULES.softMismatchConfidenceThreshold
            ? claimedCanonical
            : detectedRoomType;

    return {
        status: "valid",
        code: "valid",
        message: vision.validationReason,
        isRoomPhoto: true,
        isUsablePhoto: true,
        claimedRoomType: claimedCanonical,
        detectedRoomType,
        detectedRoomTypeConfidence: confidence,
        finalRoomType,
        roomMismatch: {
            mismatch,
            severity: mismatch ? "soft" : "none",
            reason: mismatch ? "Detected room type differs from the user's selection, but confidence is not high enough to block analysis." : null,
            userActionRequired: false,
            suggestedAction: "continue",
        },
        quality: {
            brightness: vision.lightingSummary.toLowerCase().includes("dark") ? "low" : "medium",
            blur: "low",
            framing: "good",
            contextCoverage: "sufficient",
        },
    };
}

export function buildNoteInterpretationV2(note: string | null | undefined): NoteInterpretationV2 {
    const raw = note?.trim() ?? "";
    if (raw.length < 8) {
        return {
            usable: false,
            confidence: 0,
            raw: raw || null,
            feltState: null,
            routineMoment: null,
            desiredShift: null,
            hardConstraint: null,
            personalLanguage: null,
            summary: null,
        };
    }

    const normalized = raw.toLowerCase();
    const feltState =
        /(restless|can't switch off|cannot switch off|wired|anxious)/.test(normalized) ? "restless" :
        /(heavy|stuck|weighed down)/.test(normalized) ? "heavy" :
        /(scattered|all over|distracted|can't focus)/.test(normalized) ? "scattered" :
        /(flat|numb|empty)/.test(normalized) ? "flat" :
        /(drained|exhausted|tired)/.test(normalized) ? "drained" :
        /(unsettled|uneasy|off)/.test(normalized) ? "unsettled" :
        null;

    const routineMoment =
        /(sleep|bed|night|evening|before bed)/.test(normalized) ? "before_sleep" :
        /(work|desk|meeting|task|focus)/.test(normalized) ? "while_working" :
        /(walk in|enter|come in|door)/.test(normalized) ? "when_entering" :
        "all_day";

    const desiredShift =
        /(calm|peace|soothe|relax)/.test(normalized) ? "calmer" :
        /(clear|clarity|less noise)/.test(normalized) ? "clearer" :
        /(warm|cozy)/.test(normalized) ? "warmer" :
        /(lighter|airier)/.test(normalized) ? "lighter" :
        /(ground|grounded|stable)/.test(normalized) ? "more_grounded" :
        /(focus|concentrate)/.test(normalized) ? "more_focused" :
        null;

    const hardConstraint =
        /(rental|renting|landlord)/.test(normalized) ? "rental constraints" :
        /(shared|roommate|partner)/.test(normalized) ? "shared-space constraints" :
        /(budget|cheap|can't buy|no money)/.test(normalized) ? "tight budget" :
        /(small change|small changes only)/.test(normalized) ? "light-change preference" :
        null;

    return {
        usable: true,
        confidence: 0.68,
        raw,
        feltState,
        routineMoment,
        desiredShift,
        hardConstraint,
        personalLanguage: raw.split(/[.!?]/)[0]?.trim() || raw,
        summary: `${feltState ?? "mixed"} feeling, ${routineMoment ?? "general"} context, wants ${desiredShift ?? "support"}.`,
    };
}

function collectEvidenceStrings(vision: VisionObservation) {
    return [
        vision.observationSummary,
        vision.layoutSummary,
        vision.lightingSummary,
        vision.clutterSummary,
        vision.colorSummary,
        vision.styleSummary,
        ...vision.standoutFeatures,
        ...vision.frictionPoints,
        ...vision.supportZones,
        ...vision.stressZones,
        ...vision.observations.map((item) => `${item.label} ${item.evidence}`),
    ]
        .filter(Boolean)
        .join(" | ")
        .toLowerCase();
}

function scoreSignal(text: string, keywords: string[]) {
    const matches = keywords.reduce((count, keyword) => count + (text.includes(keyword) ? 1 : 0), 0);
    return clamp(matches, 0, 2);
}

function deriveSignalStrengths(vision: VisionObservation) {
    const text = collectEvidenceStrings(vision);

    return {
        activation_blocked: scoreSignal(text, ["blocked", "congest", "crowd", "stuck", "no clear path"]),
        unfinished_surfaces: scoreSignal(text, ["unfinished", "open loop", "in progress", "surface load", "stacked"]),
        work_rest_overlap: scoreSignal(text, ["desk", "bed", "task", "workspace in bedroom", "work and rest"]),
        overstimulating_focal_points: scoreSignal(text, ["competing", "multiple focal", "busy sightline", "pulls the eye"]),
        visual_noise: scoreSignal(text, ["visual noise", "busy", "messy", "overloaded", "cluttered"]),
        lack_of_anchor: scoreSignal(text, ["no anchor", "lacks anchor", "no focal point", "no settling point"]),
        heavy_storage: scoreSignal(text, ["heavy furniture", "storage", "boxes", "bulky", "packed shelving"]),
        emotional_accumulation: scoreSignal(text, ["old", "keepsake", "layered", "accumulated", "stored"]),
        cold_functional_light: scoreSignal(text, ["harsh", "cool light", "functional", "overhead", "glare"]),
        soft_restorative_light: scoreSignal(text, ["soft", "warm", "layered light", "ambient", "gentle"]),
        sparse_unclaimed_space: scoreSignal(text, ["sparse", "empty", "bare", "underused", "unclaimed"]),
        lack_of_personal_claim: scoreSignal(text, ["generic", "temporary", "impersonal", "not lived in"]),
        transition_state: scoreSignal(text, ["transition", "half-finished", "between", "in progress"]),
        mixed_old_new_identity: scoreSignal(text, ["mismatched", "mixed style", "old and new", "disjointed"]),
        coherent_anchor_zone: vision.supportZones.length > 0 ? 1 : 0,
        clear_support_zone: vision.supportZones.length > 0 ? 1 : 0,
    } satisfies Record<DiagnosisSignalKey, number>;
}

function goalImpactLine(goal: ClaimedGoalTypeV2, feltImpact: string, stressZone: string) {
    switch (goal) {
        case "sleep":
            return `${feltImpact} The pressure looks strongest around ${stressZone.toLowerCase()}, which may be keeping the room from cueing full rest.`;
        case "focus":
            return `${feltImpact} The most distracting pull appears to be around ${stressZone.toLowerCase()}, which may be raising switching cost.`;
        case "calm":
            return `${feltImpact} ${stressZone} seems to be holding the room's highest tension signal right now.`;
        case "vitality":
            return `${feltImpact} ${stressZone} looks like it is dulling forward movement instead of supporting momentum.`;
        default:
            return feltImpact;
    }
}

function selectEvidenceForSignal(signal: DiagnosisSignalKey, vision: VisionObservation) {
    const matches = vision.observations.filter((item) => {
        const text = `${item.label} ${item.evidence}`.toLowerCase();

        switch (signal) {
            case "activation_blocked":
                return /blocked|crowd|stuck|path|flow/.test(text);
            case "unfinished_surfaces":
                return /unfinished|stack|surface|papers|open/.test(text);
            case "work_rest_overlap":
                return /desk|bed|task|work/.test(text);
            case "overstimulating_focal_points":
                return /competing|focal|pulls the eye|contrast/.test(text);
            case "visual_noise":
                return /noise|busy|messy|overloaded|clutter/.test(text);
            case "lack_of_anchor":
                return /anchor|focal|settling/.test(text);
            case "heavy_storage":
                return /storage|box|shelf|bulky|heavy/.test(text);
            case "emotional_accumulation":
                return /old|keepsake|layered|stored/.test(text);
            case "cold_functional_light":
                return /cool|harsh|functional|glare|overhead/.test(text);
            case "soft_restorative_light":
                return /soft|warm|ambient|gentle/.test(text);
            case "sparse_unclaimed_space":
                return /sparse|empty|bare|underused/.test(text);
            case "lack_of_personal_claim":
                return /impersonal|temporary|generic/.test(text);
            case "transition_state":
                return /transition|half-finished|between/.test(text);
            case "mixed_old_new_identity":
                return /mixed|mismatch|old and new|disjointed/.test(text);
            case "coherent_anchor_zone":
            case "clear_support_zone":
                return /support|calm|anchor/.test(text);
            default:
                return false;
        }
    });

    return matches[0]?.evidence ?? vision.stressZones[0] ?? vision.supportZones[0] ?? vision.observationSummary;
}

function isActionableZone(zone: string) {
    const text = zone.toLowerCase();
    return /(wall|corner|bed|nightstand|dresser|desk|entry|window|shelf|surface|seating|floor|zone|area)/.test(text);
}

function isStructuralLightSource(zone: string) {
    return /(ceiling|light|fixture|overhead)/.test(zone.toLowerCase());
}

function buildEveningLightTargetZone(supportZone: string) {
    const normalized = supportZone.toLowerCase();

    if (/(bed|nightstand|bedside)/i.test(normalized)) {
        return "the evening light layer around the bed";
    }

    if (/(dresser)/i.test(normalized)) {
        return "the evening light layer near the dresser";
    }

    return "the room's evening light layer near the rest zone";
}

function selectStressZone(
    vision: VisionObservation,
    signalStrengths: Record<DiagnosisSignalKey, number>,
) {
    const actionableStressZone = vision.stressZones.find((zone) => isActionableZone(zone) && !isStructuralLightSource(zone));
    const actionableFriction = vision.frictionPoints.find((zone) => isActionableZone(zone));
    const bareOrEmptyZone = [...vision.stressZones, ...vision.frictionPoints].find((zone) => /(bare|empty|wall|blank|unclaimed)/i.test(zone));
    const lightingZone = [...vision.stressZones, ...vision.frictionPoints].find((zone) => /(light|ceiling|overhead|glare)/i.test(zone));

    if ((signalStrengths.sparse_unclaimed_space ?? 0) >= 1 && bareOrEmptyZone) {
        return bareOrEmptyZone;
    }

    if (actionableStressZone) {
        return actionableStressZone;
    }

    if ((signalStrengths.cold_functional_light ?? 0) >= 1) {
        return actionableFriction ?? vision.supportZones[0] ?? lightingZone ?? vision.stressZones[0] ?? "the room's highest-pressure area";
    }

    return actionableFriction ?? vision.stressZones[0] ?? vision.frictionPoints[0] ?? "the room's highest-pressure area";
}

function selectFirstShiftTargetZone(
    goal: ClaimedGoalTypeV2,
    stressZone: string,
    supportZone: string,
    signalStrengths: Record<DiagnosisSignalKey, number>,
) {
    if (
        goal === "sleep" &&
        (signalStrengths.cold_functional_light ?? 0) >= 1 &&
        (signalStrengths.sparse_unclaimed_space ?? 0) >= 1 &&
        /(wall|bare|empty|blank|unclaimed)/i.test(stressZone)
    ) {
        return buildEveningLightTargetZone(supportZone);
    }

    if ((signalStrengths.sparse_unclaimed_space ?? 0) >= 1 && /(wall|bare|empty|blank|unclaimed)/i.test(stressZone)) {
        return stressZone;
    }

    if ((signalStrengths.cold_functional_light ?? 0) >= 1 && /(ceiling|light|fixture|overhead)/i.test(stressZone)) {
        if (goal === "sleep" || goal === "calm") {
            return buildEveningLightTargetZone(supportZone);
        }

        return "the room's evening light layer";
    }

    return stressZone;
}

function signalLabel(signal: DiagnosisSignalKey) {
    switch (signal) {
        case "activation_blocked":
            return "Blocked activation";
        case "unfinished_surfaces":
            return "Unfinished visual loops";
        case "work_rest_overlap":
            return "Work-rest overlap";
        case "overstimulating_focal_points":
            return "Competing focal points";
        case "visual_noise":
            return "Visual noise";
        case "lack_of_anchor":
            return "Lack of anchor";
        case "heavy_storage":
            return "Heavy storage load";
        case "emotional_accumulation":
            return "Emotional accumulation";
        case "cold_functional_light":
            return "Bright overhead lighting";
        case "soft_restorative_light":
            return "Soft restorative lighting";
        case "sparse_unclaimed_space":
            return "Unclaimed wall space";
        case "lack_of_personal_claim":
            return "Lack of personal claim";
        case "transition_state":
            return "Transition-state signals";
        case "mixed_old_new_identity":
            return "Mixed old-new identity";
        case "coherent_anchor_zone":
            return "Coherent anchor zone";
        case "clear_support_zone":
            return "Clear support zone";
    }
}

function observationToProof(
    observation: VisionObservation["observations"][number],
): PatternDiagnosisProofV2 {
    return {
        key: observation.key as DiagnosisSignalKey,
        label: observation.label,
        impact: observation.impact === "positive" ? "positive" : observation.impact === "mixed" ? "mixed" : "negative",
        evidence: observation.evidence,
        sourceObservationKeys: [observation.key],
    };
}

function normalizeProofText(value: string) {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9\s]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function proofSignature(item: Pick<PatternDiagnosisProofV2, "label" | "evidence">) {
    const label = normalizeProofText(item.label);
    const evidence = normalizeProofText(item.evidence);
    return `${label}::${evidence}`;
}

function proofLooksRedundant(
    candidate: PatternDiagnosisProofV2,
    existing: PatternDiagnosisProofV2[],
) {
    const candidateSignature = proofSignature(candidate);
    const candidateEvidence = normalizeProofText(candidate.evidence);
    const candidateLabelTokens = new Set(normalizeProofText(candidate.label).split(" ").filter((token) => token.length >= 4));

    return existing.some((item) => {
        if (proofSignature(item) === candidateSignature) {
            return true;
        }

        if (normalizeProofText(item.evidence) === candidateEvidence) {
            return true;
        }

        const existingLabelTokens = new Set(normalizeProofText(item.label).split(" ").filter((token) => token.length >= 4));
        const sharedTokens = [...candidateLabelTokens].filter((token) => existingLabelTokens.has(token));
        return sharedTokens.length >= 2;
    });
}

function buildProofSignals(
    winner: (typeof PATTERN_DIAGNOSIS_SCORING_MATRIX)[keyof typeof PATTERN_DIAGNOSIS_SCORING_MATRIX],
    signalStrengths: Record<DiagnosisSignalKey, number>,
    vision: VisionObservation,
): PatternDiagnosisProofV2[] {
    const selected: PatternDiagnosisProofV2[] = winner.proofPriority
        .filter((signal) => (signalStrengths[signal] ?? 0) >= 1)
        .slice(0, DIAGNOSIS_SIGNAL_SELECTION_RULES.maxProofSignalsInSnapshot)
        .map((signal) => ({
            key: signal,
            label: signalLabel(signal),
            impact: signal === "soft_restorative_light" || signal === "coherent_anchor_zone" || signal === "clear_support_zone"
                ? "positive"
                : "negative",
            evidence: selectEvidenceForSignal(signal, vision),
            sourceObservationKeys: vision.observations.slice(0, 2).map((item) => item.key),
        }));

    const seenLabels = new Set(selected.map((item) => item.label.toLowerCase()));
    const supplementalObservations = vision.observations
        .filter((item) => item.impact !== "mixed")
        .sort((left, right) => {
            const impactRank = (item: typeof left) => (item.impact === "negative" ? 0 : 1);
            if (impactRank(left) !== impactRank(right)) {
                return impactRank(left) - impactRank(right);
            }
            return right.confidence - left.confidence;
        })
        .filter((item) => !seenLabels.has(item.label.toLowerCase()))
        .map(observationToProof);

    const combined = [...selected];
    for (const candidate of supplementalObservations) {
        if (combined.length >= DIAGNOSIS_SIGNAL_SELECTION_RULES.maxProofSignalsInSnapshot) {
            break;
        }
        if (proofLooksRedundant(candidate, combined)) {
            continue;
        }
        combined.push(candidate);
    }

    return combined.slice(0, DIAGNOSIS_SIGNAL_SELECTION_RULES.maxProofSignalsInSnapshot);
}

function scoreEnergyTypes(
    goal: ClaimedGoalTypeV2,
    issue: ClaimedIssueTypeV2 | null,
    signalStrengths: Record<DiagnosisSignalKey, number>,
) {
    return Object.values(PATTERN_DIAGNOSIS_SCORING_MATRIX)
        .map((profile) => {
            const goalBias = profile.goalBias[goal] ?? 0;
            const issueBias = issue ? profile.issueBias[issue] ?? 0 : 0;

            const positive = Object.entries(profile.signalWeights).reduce((sum, [signal, weight]) => {
                return sum + (signalStrengths[signal as DiagnosisSignalKey] ?? 0) * (weight ?? 0);
            }, 0);

            const contradiction = Object.entries(profile.contradictionPenalties).reduce((sum, [signal, penalty]) => {
                return sum + (signalStrengths[signal as DiagnosisSignalKey] ?? 0) * (penalty ?? 0);
            }, 0);

            return {
                profile,
                total: profile.baseScore + goalBias + issueBias + positive - contradiction,
            };
        })
        .sort((a, b) => b.total - a.total);
}

export function buildPatternDiagnosis(
    normalizedInput: NormalizedAnalysisInput,
    vision: VisionObservation,
    goalData: GoalData,
): PatternDiagnosisV2 {
    const claimedContext = buildClaimedContext(normalizedInput, goalData);
    const optionalPreferences = buildOptionalPreferences(goalData);
    const validation = buildVisionValidationV2(vision, claimedContext.claimedRoomType);
    const noteInterpretation = buildNoteInterpretationV2(normalizedInput.note);

    const goal = claimedContext.primaryGoal ?? "focus";
    const signalStrengths = deriveSignalStrengths(vision);
    const ranked = scoreEnergyTypes(goal, claimedContext.primaryIssue, signalStrengths);
    const winner = ranked[0]?.profile ?? PATTERN_DIAGNOSIS_SCORING_MATRIX.unknown;
    const winnerScore = ranked[0]?.total ?? 0;
    const runnerUpScore = ranked[1]?.total ?? 0;
    const confidence = clamp(
        0.55 + Math.max(0, winnerScore - runnerUpScore) / 40 + (validation.roomMismatch.severity === "soft" ? -0.08 : 0),
        0.4,
        0.93,
    );

    const proofSignals = buildProofSignals(winner, signalStrengths, vision);

    const supportZone = vision.supportZones[0] ?? vision.standoutFeatures[0] ?? "the room's clearest support area";
    const stressZone = selectStressZone(vision, signalStrengths);
    const firstShiftTargetZone = selectFirstShiftTargetZone(goal, stressZone, supportZone, signalStrengths);
    const firstShiftRationale = firstShiftTargetZone.toLowerCase().includes("evening light layer")
        ? `Start with ${firstShiftTargetZone.toLowerCase()} because the fastest relief for ${goal} comes from reducing night-time alertness before changing the room more broadly.`
        : `Start with ${firstShiftTargetZone.toLowerCase()} because it is carrying the room's clearest actionable tension signal for ${goal}.`;

    return {
        version: "v2",
        validForSnapshot: validation.status === "valid",
        roomTypeResolution: {
            claimed: validation.claimedRoomType,
            detected: validation.detectedRoomType,
            finalUsed: validation.finalRoomType,
            confidence: validation.detectedRoomTypeConfidence,
            mismatchSeverity: validation.roomMismatch.severity,
        },
        energyType: {
            id: winner.id,
            name: winner.name,
            state: winner.name.split(" ")[0] ?? null,
            element: winner.name.split(" ")[1] ?? null,
            coreSentence: winner.coreSentence,
            confidence,
        },
        matchRationale: `The strongest visible pattern matches ${winner.name} because the room shows ${winner.proofPriority.slice(0, 2).map((signal) => signalLabel(signal).toLowerCase()).join(" and ")}.`,
        coreTension: winner.coreTension,
        feltImpact: goalImpactLine(goal, winner.coreTension, stressZone),
        supportZone: {
            label: supportZone,
            evidence: vision.supportZones[0] ?? vision.observationSummary,
        },
        stressZone: {
            label: stressZone,
            evidence: stressZone,
        },
        proofSignals,
        firstShiftPattern: {
            title: winner.firstShiftPattern.title,
            actionPrinciple: winner.firstShiftPattern.actionPrinciple,
            targetZone: firstShiftTargetZone,
            rationale: firstShiftRationale,
            constraintsApplied: [
                ...(optionalPreferences.changeOpenness ? [optionalPreferences.changeOpenness] : []),
                ...(optionalPreferences.budgetComfort ? [optionalPreferences.budgetComfort] : []),
                ...(noteInterpretation.hardConstraint ? [noteInterpretation.hardConstraint] : []),
            ],
        },
        fullReportPromise: {
            hiddenFindings: winner.fullReportHiddenFindings,
            transformationDirection: `How to move this room from ${winner.name.toLowerCase()} toward a state that better supports ${goal}.`,
        },
        personalization: {
            goal,
            primaryIssue: claimedContext.primaryIssue,
            supportPriority: optionalPreferences.supportPriority,
            changeOpenness: optionalPreferences.changeOpenness,
            budgetComfort: optionalPreferences.budgetComfort,
            noteUsed: noteInterpretation.usable,
        },
    };
}

function scoreNarrative(score: number) {
    if (score <= 40) {
        return {
            label: "Needs Attention",
            narrative: "Under strain",
            meaning: "This room is currently working against your stated goal more often than it supports it.",
        };
    }
    if (score <= 60) {
        return {
            label: "Room to Grow",
            narrative: "Partially aligned",
            meaning: "There is clear potential here, but a few visible patterns are still pulling the room off course.",
        };
    }
    if (score <= 80) {
        return {
            label: "Well Balanced",
            narrative: "Gathering strength",
            meaning: "The room already contains a useful base, but one or two pressure zones are still limiting its full effect.",
        };
    }
    return {
        label: "Harmonized",
        narrative: "Strongly aligned",
        meaning: "Most of the visible room signals already support the goal you chose.",
    };
}

type SpaceStateDimensionKey = "calm" | "clarity" | "grounding" | "warmth" | "openness" | "restoration";

function dimensionLevel(score: number): "strong" | "medium" | "weak" {
    if (score >= 72) return "strong";
    if (score >= 52) return "medium";
    return "weak";
}

function buildSummaryTags(
    vision: VisionObservation,
    score: ScoreResult,
): string[] {
    const tags: string[] = [];
    const lighting = vision.lightingSummary.toLowerCase();
    const clutter = vision.clutterSummary.toLowerCase();
    const color = vision.colorSummary.toLowerCase();
    const friction = vision.frictionPoints.map((item) => item.toLowerCase()).join(" | ");
    const style = vision.styleSummary.toLowerCase();
    const observations = vision.observations.map((item) => `${item.label} ${item.evidence}`.toLowerCase()).join(" | ");

    if (
        clutter.includes("clear") ||
        clutter.includes("minimal") ||
        clutter.includes("orderly") ||
        clutter.includes("tidy") ||
        clutter.includes("low surface load") ||
        clutter.includes("low level") ||
        clutter.includes("few items")
    ) {
        tags.push("Stable base");
    }
    if (lighting.includes("harsh") || lighting.includes("glare") || lighting.includes("direct")) {
        tags.push("Light runs too hot");
    }
    if (color.includes("cold") || color.includes("stark") || score.goalScore < 58) {
        tags.push("Rest cues are thin");
    }
    if (
        friction.includes("empty") ||
        friction.includes("bare") ||
        friction.includes("sparse") ||
        friction.includes("unpersonalized") ||
        style.includes("unfinished") ||
        observations.includes("bare") ||
        observations.includes("empty")
    ) {
        tags.push("The room reads a little bare");
    }

    return Array.from(new Set(tags)).slice(0, 3);
}

function buildSummaryHeadline(diagnosis: PatternDiagnosisV2) {
    return `${diagnosis.supportZone.label} gives this room a stable base, but it is not yet soft enough to fully let the body settle.`;
}

function buildSummaryBody(diagnosis: PatternDiagnosisV2, tensionMap?: TensionMap) {
    if (tensionMap) {
        return tensionMap.coreConflict;
    }

    return `The room is not struggling because it is chaotic. It is struggling because ${diagnosis.stressZone.label.toLowerCase()} is still carrying more visible tension than restoration.`;
}

function buildSpaceStateDimensions(
    score: ScoreResult,
    vision: VisionObservation,
): SnapshotResultV2["spaceState"]["dimensions"] {
    const observationText = [
        vision.observationSummary,
        vision.layoutSummary,
        vision.lightingSummary,
        vision.clutterSummary,
        vision.colorSummary,
        vision.styleSummary,
        ...vision.frictionPoints,
        ...vision.supportZones,
        ...vision.stressZones,
    ].join(" ").toLowerCase();

    const adjust = (base: number, positives: string[], negatives: string[]) => {
        let next = base;
        positives.forEach((token) => {
            if (observationText.includes(token)) next += 6;
        });
        negatives.forEach((token) => {
            if (observationText.includes(token)) next -= 7;
        });
        return clamp(Math.round(next), 28, 90);
    };

    const calm = adjust(score.scores.stress + 8, ["quiet", "clear", "minimal", "orderly"], ["busy", "harsh", "glare", "overlap"]);
    const clarity = adjust(score.scores.focus - 1, ["clear", "defined", "cohesive"], ["competing", "visual noise", "crowded", "unfinished"]);
    const grounding = adjust(Math.round((score.scores.sleep + score.scores.stress) / 2) - 2, ["wood", "stable", "anchored", "defined"], ["floating", "bare", "empty", "cold"]);
    const warmth = adjust(Math.round((score.scores.sleep + score.scores.energy) / 2) - 10, ["warm", "soft", "wood", "welcoming"], ["cold", "stark", "functional", "harsh"]);
    const openness = adjust(score.scores.focus + 2, ["open", "airy", "spacious", "clear path"], ["tight", "blocked", "crowded", "compressed"]);
    const restoration = adjust(score.scores.sleep - 8, ["soft", "restore", "rest", "calm"], ["glare", "direct", "cold", "unfinished", "bare"]);

    const hints = {
        calm: calm >= 72 ? "The room reads as settled at first glance." : calm >= 52 ? "Some calmer cues are present, but they are not fully leading yet." : "The room is still holding more activation than rest.",
        clarity: clarity >= 72 ? "The room communicates its purpose fairly clearly." : clarity >= 52 ? "The structure is readable, but the message is not fully resolved." : "Too many competing cues are splitting the room's message.",
        grounding: grounding >= 72 ? "There is a felt sense of steadiness here." : grounding >= 52 ? "The room has some stability, but it is not fully embodied yet." : "The room still needs a stronger anchor point to land in.",
        warmth: warmth >= 72 ? "The space already feels more held than functional." : warmth >= 52 ? "Some warmth is present, but it is not leading the room yet." : "The room still reads more functional than nurturing.",
        openness: openness >= 72 ? "The room has enough visual breath to feel usable and open." : openness >= 52 ? "There is some room to breathe, though not fully." : "The room still feels visually compressed where tension gathers.",
        restoration: restoration >= 72 ? "The room already cues a meaningful exhale." : restoration >= 52 ? "Some recovery signals are present, but not consistently." : "The room is not yet clearly signaling recovery or rest.",
    } satisfies Record<SpaceStateDimensionKey, string>;

    return [
        { key: "calm", label: "Calm", score: calm, level: dimensionLevel(calm), summary: hints.calm },
        { key: "clarity", label: "Clarity", score: clarity, level: dimensionLevel(clarity), summary: hints.clarity },
        { key: "grounding", label: "Grounding", score: grounding, level: dimensionLevel(grounding), summary: hints.grounding },
        { key: "warmth", label: "Warmth", score: warmth, level: dimensionLevel(warmth), summary: hints.warmth },
        { key: "openness", label: "Openness", score: openness, level: dimensionLevel(openness), summary: hints.openness },
        { key: "restoration", label: "Restoration", score: restoration, level: dimensionLevel(restoration), summary: hints.restoration },
    ];
}

function buildSpaceState(snapshotGoalScore: number, score: ScoreResult, vision: VisionObservation): SnapshotResultV2["spaceState"] {
    const dimensions = buildSpaceStateDimensions(score, vision);
    const strongestDimension = [...dimensions].sort((a, b) => b.score - a.score)[0];
    const weakestDimensions = [...dimensions].sort((a, b) => a.score - b.score).slice(0, 2);

    return {
        overallScore: snapshotGoalScore,
        strongest: strongestDimension?.label ?? "Calm",
        weakest: weakestDimensions.map((item) => item.label).join(" / "),
        coreGap: snapshotGoalScore >= 72
            ? "The room has support, but one softer layer is still missing."
            : "The room has structure, but recovery is still lagging behind.",
        dimensions,
    };
}

function buildReadingOneLiner(diagnosis: PatternDiagnosisV2, noteInterpretation: NoteInterpretationV2) {
    if (noteInterpretation.personalLanguage) {
        return `${diagnosis.energyType.name} fits because your room is still carrying ${diagnosis.stressZone.label.toLowerCase()} more loudly than it is carrying rest.`;
    }

    return diagnosis.energyType.coreSentence;
}

function buildReadingParagraph(
    diagnosis: PatternDiagnosisV2,
    score: ScoreResult,
    noteInterpretation: NoteInterpretationV2,
    tensionMap?: TensionMap,
) {
    const noteClause = noteInterpretation.usable && noteInterpretation.feltState
        ? ` That likely matters more because you already describe the room as feeling ${noteInterpretation.feltState}.`
        : "";
    const leverageClause = tensionMap
        ? ` The best leverage point right now is simple: ${tensionMap.topLeveragePoint.toLowerCase()}`
        : "";

    return `${diagnosis.supportZone.label} already gives the room some support, but ${diagnosis.stressZone.label.toLowerCase()} is still carrying the strongest visible tension. ${diagnosis.feltImpact}${noteClause}${leverageClause} With a current goal score of ${score.goalScore}, this is a room that can improve quickly if you start with the right zone.`;
}

function buildFirstShiftCopy(diagnosis: PatternDiagnosisV2, goal: ClaimedGoalTypeV2) {
    const targetZone = diagnosis.firstShiftPattern.targetZone.toLowerCase();
    const lightLayerTarget = targetZone.includes("evening light layer");
    const examples = lightLayerTarget
        ? [
            "Turn the bright overhead lights off once the room is winding down.",
            "Let one lower, warmer lamp near the bed or dresser carry the room instead.",
            "Keep the bed area in softer, dimmer light than the rest of the room.",
        ]
        : [
            `Soften ${targetZone} with one lower, gentler light source.`,
            `Give ${targetZone} one quieter visual landing point.`,
            `Remove one hard or visually active cue from ${targetZone}.`,
        ];

    const title = lightLayerTarget
        ? "Soften the room's night light first"
        : targetZone.includes("wall")
        ? "Soften the unfinished wall first"
        : targetZone.includes("light")
            ? "Soften the room's brightest cue first"
            : diagnosis.firstShiftPattern.title;

    const action = lightLayerTarget
        ? "Tonight, shift the room away from bright overhead light and let one lower, warmer light lead near the bed."
        : targetZone.includes("wall")
        ? `Start with ${targetZone} tonight, and give it one softer cue instead of trying to solve the whole room at once.`
        : targetZone.includes("light")
            ? `Start with ${targetZone} tonight, and soften its effect before changing anything broader in the room.`
            : `${diagnosis.firstShiftPattern.actionPrinciple} Start with ${diagnosis.firstShiftPattern.targetZone.toLowerCase()} tonight.`;

    const whyItHelps = goal === "sleep"
        ? "This helps the room feel less alert and more ready for rest."
        : `This is the quickest visible move to make the room feel more supportive for ${goal}.`;

    return {
        title,
        action,
        examples,
        whyItHelps,
        targetZone: diagnosis.firstShiftPattern.targetZone,
        timing: "tonight" as const,
    };
}

export function buildSnapshotFromArtifactsV2(
    normalizedInput: NormalizedAnalysisInput,
    vision: VisionObservation,
    score: ScoreResult,
    goalData: GoalData,
): SnapshotResultV2 {
    const claimedContext = buildClaimedContext(normalizedInput, goalData);
    const noteInterpretation = buildNoteInterpretationV2(normalizedInput.note);
    const validation = buildVisionValidationV2(vision, claimedContext.claimedRoomType);
    const diagnosis = buildPatternDiagnosis(normalizedInput, vision, goalData);
    const scoreCopy = scoreNarrative(score.goalScore);
    const spaceState = buildSpaceState(score.goalScore, score, vision);
    const alignInput = buildAlignInput(normalizedInput, vision);
    const tensionMap = buildTensionMap(alignInput);
    const firstShift = buildFirstShiftCopy(diagnosis, claimedContext.primaryGoal ?? "focus");
    const stateRitual = buildStateRitual({
        roomType: validation.finalRoomType,
        goal: claimedContext.primaryGoal ?? "focus",
        firstShiftTargetZone: firstShift.targetZone,
        firstShiftAction: firstShift.action,
    });

    return {
        version: "v2",
        analysisMode: "vision",
        validation: {
            status: validation.status,
            code: validation.code,
            message: validation.message,
            finalRoomType: validation.finalRoomType,
            roomMismatch: validation.roomMismatch,
        },
        type: {
            id: diagnosis.energyType.id,
            name: diagnosis.energyType.name,
            coreSentence: diagnosis.energyType.coreSentence,
            confidence: diagnosis.energyType.confidence,
        },
        summary: {
            headline: buildSummaryHeadline(diagnosis),
            statusTags: buildSummaryTags(vision, score),
            body: buildSummaryBody(diagnosis, tensionMap),
        },
        score: {
            goal: claimedContext.primaryGoal ?? "focus",
            value: score.goalScore,
            overall: score.overallScore,
            label: scoreCopy.label,
            narrative: scoreCopy.narrative,
            meaning: scoreCopy.meaning,
        },
        reading: {
            oneLiner: buildReadingOneLiner(diagnosis, noteInterpretation),
            shortParagraph: buildReadingParagraph(diagnosis, score, noteInterpretation, tensionMap),
        },
        proof: diagnosis.proofSignals.map((item) => ({
            label: item.label,
            evidence: item.evidence,
            impact: item.impact,
        })),
        spaceState,
        tension: {
            headline: diagnosis.coreTension,
            explanation: diagnosis.feltImpact,
        },
        firstShift,
        stateRitual,
        brandHook: {
            title: "You do not need to rework the whole room.",
            subtitle: "You need one clearer cue for rest.",
            signals: [
                "A lower and softer light source",
                "A warmer layer of texture",
                "One place for the eye to settle",
                "A clearer signal that rest begins here",
            ],
        },
        preview: {
            teaserTitle: "If you keep going, the full report shows you",
            hiddenFindings: diagnosis.fullReportPromise.hiddenFindings,
            fullReportPromise: `See which missing restorative cue will make the clearest difference, and where it will matter most.`,
            ctaText: "Unlock Full Report",
        },
        meta: {
            noteUsed: noteInterpretation.usable,
            diagnosisConfidence: diagnosis.energyType.confidence,
            generationMode: "fully_templated",
        },
    };
}
