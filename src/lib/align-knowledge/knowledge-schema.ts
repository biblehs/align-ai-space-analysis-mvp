import type {
    BrandVoiceRules,
    ConfidenceRule,
    HealingExpressionWhitelist,
    InterpretationActionRule,
    KnowledgeArchetype,
    KnowledgeDimension,
    ObservationInterpretationRule,
    RoomGoalProfile,
    StateContradictionType,
    StateRitualModuleRule,
    TensionPattern,
    VisualObservationRule,
} from "@/lib/align-knowledge/types";

function assert(condition: unknown, message: string): asserts condition {
    if (!condition) {
        throw new Error(`ALIGN knowledge validation failed: ${message}`);
    }
}

function isStringArray(value: unknown): value is string[] {
    return Array.isArray(value) && value.every((item) => typeof item === "string" && item.trim().length > 0);
}

function assertString(value: unknown, path: string) {
    assert(typeof value === "string" && value.trim().length > 0, `${path} must be a non-empty string`);
}

function assertEnum<T extends string>(value: unknown, path: string, allowed: readonly T[]) {
    assert(typeof value === "string" && allowed.includes(value as T), `${path} must be one of: ${allowed.join(", ")}`);
}

function assertStringArray(value: unknown, path: string) {
    assert(isStringArray(value), `${path} must be a non-empty string array`);
}

function assertObject(value: unknown, path: string): asserts value is Record<string, unknown> {
    assert(typeof value === "object" && value !== null && !Array.isArray(value), `${path} must be an object`);
}

function validateArray<T>(value: unknown, path: string, validateItem: (item: unknown, index: number) => T): T[] {
    assert(Array.isArray(value), `${path} must be an array`);
    return value.map((item, index) => validateItem(item, index));
}

export function validateDimensions(value: unknown): KnowledgeDimension[] {
    return validateArray(value, "dimensions", (item, index) => {
        const path = `dimensions[${index}]`;
        assertObject(item, path);
        assertEnum(item.key, `${path}.key`, ["calm", "clarity", "grounding", "warmth", "openness", "restoration"] as const);
        assertString(item.label, `${path}.label`);
        assertString(item.definition, `${path}.definition`);
        assertStringArray(item.positiveSignals, `${path}.positiveSignals`);
        assertStringArray(item.negativeSignals, `${path}.negativeSignals`);
        assertStringArray(item.commonActions, `${path}.commonActions`);
        assertStringArray(item.oftenConfusedWith, `${path}.oftenConfusedWith`);
        return item as unknown as KnowledgeDimension;
    });
}

export function validateArchetypes(value: unknown): KnowledgeArchetype[] {
    return validateArray(value, "archetypes", (item, index) => {
        const path = `archetypes[${index}]`;
        assertObject(item, path);
        assertString(item.id, `${path}.id`);
        assertString(item.name, `${path}.name`);
        assertString(item.coreQuality, `${path}.coreQuality`);
        assertStringArray(item.commonTension, `${path}.commonTension`);
        assertStringArray(item.commonSignals, `${path}.commonSignals`);
        assertStringArray(item.strongestWeakestPatterns, `${path}.strongestWeakestPatterns`);
        assertStringArray(item.suggestionDirections, `${path}.suggestionDirections`);
        return item as unknown as KnowledgeArchetype;
    });
}

export function validateTensionPatterns(value: unknown): TensionPattern[] {
    return validateArray(value, "tensionPatterns", (item, index) => {
        const path = `tensionPatterns[${index}]`;
        assertObject(item, path);
        assertString(item.id, `${path}.id`);
        assertString(item.label, `${path}.label`);
        assertStringArray(item.triggerKeywords, `${path}.triggerKeywords`);
        assertString(item.interpretation, `${path}.interpretation`);
        assertStringArray(item.stateEffects, `${path}.stateEffects`);
        assertStringArray(item.firstMovePrinciples, `${path}.firstMovePrinciples`);
        return item as unknown as TensionPattern;
    });
}

export function validateVisualObservationRules(value: unknown): VisualObservationRule[] {
    return validateArray(value, "visualObservationRules", (item, index) => {
        const path = `visualObservationRules[${index}]`;
        assertObject(item, path);
        assertString(item.id, `${path}.id`);
        assertEnum(item.category, `${path}.category`, ["lighting", "visual_load", "blank_space", "materials", "layout", "restorative_cues"] as const);
        assertString(item.observationFocus, `${path}.observationFocus`);
        assertStringArray(item.watchFor, `${path}.watchFor`);
        assertStringArray(item.avoidOverclaiming, `${path}.avoidOverclaiming`);
        return item as unknown as VisualObservationRule;
    });
}

export function validateObservationToInterpretation(value: unknown): ObservationInterpretationRule[] {
    return validateArray(value, "observationToInterpretation", (item, index) => {
        const path = `observationToInterpretation[${index}]`;
        assertObject(item, path);
        assertString(item.id, `${path}.id`);
        assertString(item.observationPattern, `${path}.observationPattern`);
        assertString(item.means, `${path}.means`);
        assertStringArray(item.affects, `${path}.affects`);
        assertString(item.userTranslation, `${path}.userTranslation`);
        return item as unknown as ObservationInterpretationRule;
    });
}

export function validateInterpretationToActions(value: unknown): InterpretationActionRule[] {
    return validateArray(value, "interpretationToActions", (item, index) => {
        const path = `interpretationToActions[${index}]`;
        assertObject(item, path);
        assertString(item.id, `${path}.id`);
        assertString(item.interpretationPattern, `${path}.interpretationPattern`);
        assertStringArray(item.roomTypes, `${path}.roomTypes`);
        assertStringArray(item.goals, `${path}.goals`);
        assertStringArray(item.tonightMoves, `${path}.tonightMoves`);
        assertStringArray(item.weekMoves, `${path}.weekMoves`);
        assertEnum(item.costLevel, `${path}.costLevel`, ["zero", "low", "medium", "high"] as const);
        return item as unknown as InterpretationActionRule;
    });
}

export function validateRoomGoals(value: unknown): RoomGoalProfile[] {
    return validateArray(value, "roomGoals", (item, index) => {
        const path = `roomGoals[${index}]`;
        assertObject(item, path);
        assertString(item.roomType, `${path}.roomType`);
        assertString(item.goal, `${path}.goal`);
        assertStringArray(item.priorities, `${path}.priorities`);
        assertStringArray(item.supportSignals, `${path}.supportSignals`);
        assertStringArray(item.cautionSignals, `${path}.cautionSignals`);
        assertStringArray(item.defaultActionBias, `${path}.defaultActionBias`);
        return item as unknown as RoomGoalProfile;
    });
}

export function validateConfidenceRules(value: unknown): ConfidenceRule[] {
    return validateArray(value, "confidenceRules", (item, index) => {
        const path = `confidenceRules[${index}]`;
        assertObject(item, path);
        assertString(item.id, `${path}.id`);
        assertString(item.when, `${path}.when`);
        assertString(item.effect, `${path}.effect`);
        assertStringArray(item.guidance, `${path}.guidance`);
        return item as unknown as ConfidenceRule;
    });
}

export function validateBrandVoiceRules(value: unknown): BrandVoiceRules {
    assertObject(value, "brandVoiceRules");
    assertStringArray(value.tone, "brandVoiceRules.tone");
    assertStringArray(value.do, "brandVoiceRules.do");
    assertStringArray(value.dont, "brandVoiceRules.dont");
    assertStringArray(value.preferredPhrases, "brandVoiceRules.preferredPhrases");
    assertStringArray(value.forbiddenPhrases, "brandVoiceRules.forbiddenPhrases");
    assertStringArray(value.outputRhythm, "brandVoiceRules.outputRhythm");
    if (value.healingExpressionPolicy !== undefined) {
        assertObject(value.healingExpressionPolicy, "brandVoiceRules.healingExpressionPolicy");
        assertString(value.healingExpressionPolicy.maxShareOfCopy, "brandVoiceRules.healingExpressionPolicy.maxShareOfCopy");
        assertStringArray(value.healingExpressionPolicy.role, "brandVoiceRules.healingExpressionPolicy.role");
        assertStringArray(value.healingExpressionPolicy.disallowedLayers, "brandVoiceRules.healingExpressionPolicy.disallowedLayers");
    }
    return value as unknown as BrandVoiceRules;
}

function validateHealingStageRules(value: unknown, path: string) {
    assertObject(value, path);
    assertStringArray(value.allowedRoles, `${path}.allowedRoles`);
    assertStringArray(value.preferredPhrases, `${path}.preferredPhrases`);
    assertStringArray(value.sentencePatterns, `${path}.sentencePatterns`);
    assertStringArray(value.avoidPatterns, `${path}.avoidPatterns`);
}

export function validateHealingExpressionWhitelist(value: unknown): HealingExpressionWhitelist {
    assertObject(value, "healingExpressionWhitelist");
    validateHealingStageRules(value.snapshot, "healingExpressionWhitelist.snapshot");
    validateHealingStageRules(value.fullReport, "healingExpressionWhitelist.fullReport");
    validateHealingStageRules(value.progressReport, "healingExpressionWhitelist.progressReport");
    assertStringArray(value.universalGuards, "healingExpressionWhitelist.universalGuards");
    return value as unknown as HealingExpressionWhitelist;
}

export function validateStateRitualModuleRules(value: unknown): StateRitualModuleRule[] {
    return validateArray(value, "stateRitualModuleRules", (item, index) => {
        const path = `stateRitualModuleRules[${index}]`;
        assertObject(item, path);
        assertString(item.roomType, `${path}.roomType`);
        assertString(item.goal, `${path}.goal`);
        assertStringArray(item.moduleNameOptions, `${path}.moduleNameOptions`);

        assertObject(item.placement, `${path}.placement`);
        assertString(item.placement.snapshotAfter, `${path}.placement.snapshotAfter`);
        assertString(item.placement.snapshotBefore, `${path}.placement.snapshotBefore`);
        assertString(item.placement.fullReportAfter, `${path}.placement.fullReportAfter`);

        assertStringArray(item.purpose, `${path}.purpose`);
        assertStringArray(item.hardRules, `${path}.hardRules`);

        assertObject(item.structure, `${path}.structure`);
        assertStringArray(item.structure.leadIn, `${path}.structure.leadIn`);
        assertStringArray(item.structure.coreAction, `${path}.structure.coreAction`);
        assertStringArray(item.structure.stateLink, `${path}.structure.stateLink`);
        assertStringArray(item.structure.whatYouMayFeelTonight, `${path}.structure.whatYouMayFeelTonight`);

        assertObject(item.template, `${path}.template`);
        assertString(item.template.title, `${path}.template.title`);
        assertString(item.template.body, `${path}.template.body`);
        assertString(item.template.feltShiftTitle, `${path}.template.feltShiftTitle`);
        assertString(item.template.feltShiftBody, `${path}.template.feltShiftBody`);

        return item as unknown as StateRitualModuleRule;
    });
}

export function validateStateContradictionTypes(value: unknown): StateContradictionType[] {
    return validateArray(value, "stateContradictionTypes", (item, index) => {
        const path = `stateContradictionTypes[${index}]`;
        assertObject(item, path);
        assertString(item.id, `${path}.id`);
        assertString(item.label, `${path}.label`);
        assertStringArray(item.roomTypes, `${path}.roomTypes`);
        assertStringArray(item.goals, `${path}.goals`);
        assertStringArray(item.triggerSignals, `${path}.triggerSignals`);
        assertStringArray(item.amplifiedStates, `${path}.amplifiedStates`);
        assertStringArray(item.blockedStates, `${path}.blockedStates`);
        assertString(item.coreConflictTemplate, `${path}.coreConflictTemplate`);
        assertString(item.topLeverageTemplate, `${path}.topLeverageTemplate`);
        assertStringArray(item.notYet, `${path}.notYet`);
        assertStringArray(item.likelyFirstRelief, `${path}.likelyFirstRelief`);
        return item as unknown as StateContradictionType;
    });
}
