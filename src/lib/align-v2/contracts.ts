export type ClaimedRoomTypeV2 =
    | "bedroom"
    | "workspace"
    | "living-room"
    | "creative-studio";

export type ClaimedGoalTypeV2 = "sleep" | "focus" | "calm" | "vitality";

export type ClaimedIssueTypeV2 =
    | "cluttered"
    | "heavy"
    | "visually-noisy"
    | "unfocused"
    | "draining"
    | "hard-to-relax"
    | "lacking-warmth"
    | "stuck";

export type CanonicalRoomTypeV2 =
    | "bedroom"
    | "living_room"
    | "workspace"
    | "creative_studio"
    | "dining_room"
    | "kitchen"
    | "bathroom"
    | "entryway"
    | "mixed"
    | "unknown";

export type VisionValidationStatusV2 = "valid" | "invalid" | "action_required";

export type VisionInvalidCodeV2 =
    | "valid"
    | "not_a_room"
    | "blank_or_nearly_blank"
    | "too_dark"
    | "too_blurry"
    | "too_close"
    | "insufficient_context"
    | "multiple_spaces_confusing";

export type RoomMismatchSeverityV2 = "none" | "soft" | "hard";

export type EnergyTypeIdV2 =
    | "dormant_fire"
    | "scattered_moon"
    | "heavy_earth"
    | "still_water"
    | "empty_sky"
    | "rising_wood"
    | "unknown";

export interface ClaimedContextV2 {
    claimedRoomType: ClaimedRoomTypeV2 | null;
    primaryGoal: ClaimedGoalTypeV2 | null;
    primaryIssue: ClaimedIssueTypeV2 | null;
}

export interface PhotoInputV2 {
    photoUrl: string | null;
    photoPath: string | null;
    activePerspectives: string[];
}

export interface OptionalPreferencesV2 {
    provided: boolean;
    supportPriority: "sleep" | "focus" | "calm" | "grounding" | null;
    changeOpenness: "light" | "moderate" | "significant" | null;
    budgetComfort: "low" | "medium" | "high" | null;
}

export interface OptionalNoteV2 {
    provided: boolean;
    raw: string | null;
}

export interface VisionValidationV2 {
    status: VisionValidationStatusV2;
    code: VisionInvalidCodeV2;
    message: string;
    isRoomPhoto: boolean;
    isUsablePhoto: boolean;
    claimedRoomType: CanonicalRoomTypeV2 | null;
    detectedRoomType: CanonicalRoomTypeV2;
    detectedRoomTypeConfidence: number;
    finalRoomType: CanonicalRoomTypeV2 | null;
    roomMismatch: {
        mismatch: boolean;
        severity: RoomMismatchSeverityV2;
        reason: string | null;
        userActionRequired: boolean;
        suggestedAction: "continue" | "confirm_detected_room_type" | "reupload";
    };
    quality: {
        brightness: "low" | "medium" | "high";
        blur: "low" | "medium" | "high";
        framing: "poor" | "partial" | "good";
        contextCoverage: "insufficient" | "partial" | "sufficient";
    };
}

export interface VisionObservationItemV2 {
    key: string;
    label: string;
    impact: "positive" | "negative" | "mixed";
    confidence: number;
    evidence: string;
}

export interface VisionObservationV2 {
    validation: VisionValidationV2;
    summary: string;
    supportZones: string[];
    stressZones: string[];
    visibleSignals: string[];
    lightSummary: string;
    densitySummary: string;
    layoutSummary: string;
    proofSignals: VisionObservationItemV2[];
}

export interface NoteInterpretationV2 {
    usable: boolean;
    confidence: number;
    raw: string | null;
    feltState:
        | "restless"
        | "heavy"
        | "scattered"
        | "flat"
        | "drained"
        | "unsettled"
        | null;
    routineMoment:
        | "before_sleep"
        | "while_working"
        | "when_entering"
        | "all_day"
        | null;
    desiredShift:
        | "calmer"
        | "clearer"
        | "warmer"
        | "lighter"
        | "more_grounded"
        | "more_focused"
        | null;
    hardConstraint: string | null;
    personalLanguage: string | null;
    summary: string | null;
}

export interface PatternDiagnosisProofV2 {
    key: string;
    label: string;
    impact: "positive" | "negative" | "mixed";
    evidence: string;
    sourceObservationKeys: string[];
}

export interface PatternDiagnosisV2 {
    version: string;
    validForSnapshot: boolean;
    roomTypeResolution: {
        claimed: CanonicalRoomTypeV2 | null;
        detected: CanonicalRoomTypeV2;
        finalUsed: CanonicalRoomTypeV2 | null;
        confidence: number;
        mismatchSeverity: RoomMismatchSeverityV2;
    };
    energyType: {
        id: EnergyTypeIdV2;
        name: string;
        state: string | null;
        element: string | null;
        coreSentence: string;
        confidence: number;
    };
    matchRationale: string;
    coreTension: string;
    feltImpact: string;
    supportZone: {
        label: string;
        evidence: string;
    };
    stressZone: {
        label: string;
        evidence: string;
    };
    proofSignals: PatternDiagnosisProofV2[];
    firstShiftPattern: {
        title: string;
        actionPrinciple: string;
        targetZone: string;
        rationale: string;
        constraintsApplied: string[];
    };
    fullReportPromise: {
        hiddenFindings: string[];
        transformationDirection: string;
    };
    personalization: {
        goal: ClaimedGoalTypeV2;
        primaryIssue: ClaimedIssueTypeV2 | null;
        supportPriority: OptionalPreferencesV2["supportPriority"];
        changeOpenness: OptionalPreferencesV2["changeOpenness"];
        budgetComfort: OptionalPreferencesV2["budgetComfort"];
        noteUsed: boolean;
    };
}

export interface ScoreResultV2 {
    goal: ClaimedGoalTypeV2;
    goalScore: number;
    overallScore: number;
    scoreLabel: string;
    scoreNarrative: string;
    scoreMeaning: string;
    drivers: string[];
}

export interface SnapshotResultV2 {
    version: string;
    analysisMode: "vision" | "fallback";
    validation: Pick<
        VisionValidationV2,
        "status" | "code" | "message" | "finalRoomType" | "roomMismatch"
    >;
    type: {
        id: EnergyTypeIdV2;
        name: string;
        coreSentence: string;
        confidence: number;
    };
    summary: {
        headline: string;
        statusTags: string[];
        body: string;
    };
    score: {
        goal: ClaimedGoalTypeV2;
        value: number;
        overall: number;
        label: string;
        narrative: string;
        meaning: string;
    };
    reading: {
        oneLiner: string;
        shortParagraph: string;
    };
    proof: Array<{
        label: string;
        evidence: string;
        impact: "positive" | "negative" | "mixed";
    }>;
    spaceState: {
        overallScore: number;
        strongest: string;
        weakest: string;
        coreGap: string;
        dimensions: Array<{
            key: "calm" | "clarity" | "grounding" | "warmth" | "openness" | "restoration";
            label: string;
            score: number;
            level: "strong" | "medium" | "weak";
            summary: string;
        }>;
    };
    tension: {
        headline: string;
        explanation: string;
    };
    firstShift: {
        title: string;
        action: string;
        examples: string[];
        whyItHelps: string;
        targetZone: string;
        timing: "tonight";
    };
    stateRitual?: {
        title: string;
        body: string;
        feltShiftTitle: string;
        feltShiftBody: string;
    };
    brandHook: {
        title: string;
        subtitle: string;
        signals: string[];
    };
    preview: {
        teaserTitle: string;
        hiddenFindings: string[];
        fullReportPromise: string;
        ctaText: string;
    };
    meta: {
        noteUsed: boolean;
        diagnosisConfidence: number;
        generationMode: "fully_templated" | "templated_plus_llm";
    };
}

export interface ComparisonSnapshotResultV2 {
    version: "v2-comparison";
    analysisMode: "comparison";
    comparison: {
        previousAnalysisId: string;
        currentAnalysisId: string;
        sameGoal: boolean;
        goal: ClaimedGoalTypeV2;
        headline: string;
        summaryTags: string[];
    };
    delta: {
        overallScore: {
            previous: number;
            current: number;
            change: number;
        };
        dimensions: Array<{
            key: "calm" | "clarity" | "grounding" | "warmth" | "openness" | "restoration";
            previous: number;
            current: number;
            change: number;
            direction: "up" | "down" | "flat";
        }>;
        biggestWin: string;
        remainingGap: string;
    };
    whatChanged: Array<{
        label: string;
        before: string;
        now: string;
        impact: string;
    }>;
    stillMissing: {
        headline: string;
        items: string[];
    };
    nextShift: {
        title: string;
        action: string;
        whyItHelps: string;
    };
    preview: {
        ctaText: string;
        fullReportPromise: string;
    };
}

export interface FullReportResultV2 {
    version: string;
    summary: {
        typeName: string;
        overview: string;
        transformationOutcome: string;
    };
    sections: {
        whatThisRoomIsDoing: string;
        whatIsWorking: string;
        whatIsHoldingItBack: string;
    };
    zones: Array<{
        zone: string;
        issue: string;
        change: string;
        expectedShift: string;
    }>;
    priorityShifts: Array<{
        title: string;
        why: string;
        action: string;
        expectedBenefit: string;
    }>;
    timeline: {
        tonight: string[];
        thisWeek: string[];
        thisMonth: string[];
    };
    optionalSupports?: Array<{
        category: "lighting" | "storage" | "textile" | "decor" | "plant" | "ritual";
        title: string;
        why: string;
        placement?: string;
        priceTier?: "minimal" | "low" | "medium" | "budget" | "mid" | "premium";
    }>;
    meta: {
        roomTypeUsed: CanonicalRoomTypeV2 | null;
        generatedFrom: {
            snapshotV2: boolean;
            patternDiagnosis: boolean;
            scoreResult: boolean;
        };
    };
}
