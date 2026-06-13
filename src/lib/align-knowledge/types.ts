export type KnowledgeDimension = {
    key: "calm" | "clarity" | "grounding" | "warmth" | "openness" | "restoration";
    label: string;
    definition: string;
    positiveSignals: string[];
    negativeSignals: string[];
    commonActions: string[];
    oftenConfusedWith: string[];
};

export type KnowledgeArchetype = {
    id: string;
    name: string;
    coreQuality: string;
    commonTension: string[];
    commonSignals: string[];
    strongestWeakestPatterns: string[];
    suggestionDirections: string[];
};

export type TensionPattern = {
    id: string;
    label: string;
    triggerKeywords: string[];
    interpretation: string;
    stateEffects: string[];
    firstMovePrinciples: string[];
};

export type VisualObservationRule = {
    id: string;
    category: "lighting" | "visual_load" | "blank_space" | "materials" | "layout" | "restorative_cues";
    observationFocus: string;
    watchFor: string[];
    avoidOverclaiming: string[];
};

export type ObservationInterpretationRule = {
    id: string;
    observationPattern: string;
    means: string;
    affects: string[];
    userTranslation: string;
};

export type InterpretationActionRule = {
    id: string;
    interpretationPattern: string;
    roomTypes: string[];
    goals: string[];
    tonightMoves: string[];
    weekMoves: string[];
    costLevel: "zero" | "low" | "medium" | "high";
};

export type RoomGoalProfile = {
    roomType: string;
    goal: string;
    priorities: string[];
    supportSignals: string[];
    cautionSignals: string[];
    defaultActionBias: string[];
};

export type BrandVoiceRules = {
    tone: string[];
    do: string[];
    dont: string[];
    preferredPhrases: string[];
    forbiddenPhrases: string[];
    outputRhythm: string[];
    healingExpressionPolicy?: {
        maxShareOfCopy: string;
        role: string[];
        disallowedLayers: string[];
    };
};

export type ConfidenceRule = {
    id: string;
    when: string;
    effect: string;
    guidance: string[];
};

export type HealingExpressionStageRules = {
    allowedRoles: string[];
    preferredPhrases: string[];
    sentencePatterns: string[];
    avoidPatterns: string[];
};

export type HealingExpressionStage = "snapshot" | "fullReport" | "progressReport";

export type HealingExpressionWhitelist = {
    snapshot: HealingExpressionStageRules;
    fullReport: HealingExpressionStageRules;
    progressReport: HealingExpressionStageRules;
    universalGuards: string[];
};

export type StateRitualModuleRule = {
    roomType: string;
    goal: string;
    moduleNameOptions: string[];
    placement: {
        snapshotAfter: string;
        snapshotBefore: string;
        fullReportAfter: string;
    };
    purpose: string[];
    hardRules: string[];
    structure: {
        leadIn: string[];
        coreAction: string[];
        stateLink: string[];
        whatYouMayFeelTonight: string[];
    };
    template: {
        title: string;
        body: string;
        feltShiftTitle: string;
        feltShiftBody: string;
    };
};

export type StateContradictionType = {
    id: string;
    label: string;
    roomTypes: string[];
    goals: string[];
    triggerSignals: string[];
    amplifiedStates: string[];
    blockedStates: string[];
    coreConflictTemplate: string;
    topLeverageTemplate: string;
    notYet: string[];
    likelyFirstRelief: string[];
};
