import dimensions from "@/lib/align-knowledge/content/dimensions.json";
import archetypes from "@/lib/align-knowledge/content/archetypes.json";
import tensionPatterns from "@/lib/align-knowledge/content/tension_patterns.json";
import visualObservationRules from "@/lib/align-knowledge/content/visual_observation_rules.json";
import observationToInterpretation from "@/lib/align-knowledge/content/observation_to_interpretation.json";
import interpretationToActions from "@/lib/align-knowledge/content/interpretation_to_actions.json";
import roomGoals from "@/lib/align-knowledge/content/room_goals.json";
import confidenceRules from "@/lib/align-knowledge/content/confidence_rules.json";
import healingExpressionWhitelist from "@/lib/align-knowledge/content/healing_expression_whitelist.json";
import stateRitualModuleRules from "@/lib/align-knowledge/content/state_ritual_module_rules.json";
import stateContradictionTypes from "@/lib/align-knowledge/content/state_contradiction_types.json";
import { brandVoiceRules } from "@/lib/align-knowledge/content/brand_voice_rules";
import {
    validateArchetypes,
    validateBrandVoiceRules,
    validateConfidenceRules,
    validateDimensions,
    validateHealingExpressionWhitelist,
    validateInterpretationToActions,
    validateObservationToInterpretation,
    validateRoomGoals,
    validateStateContradictionTypes,
    validateStateRitualModuleRules,
    validateTensionPatterns,
    validateVisualObservationRules,
} from "@/lib/align-knowledge/knowledge-schema";
import { ALIGN_KNOWLEDGE_VERSION } from "@/lib/align-knowledge/version";
import type {
    KnowledgeArchetype,
    KnowledgeDimension,
    ObservationInterpretationRule,
    RoomGoalProfile,
    TensionPattern,
    InterpretationActionRule,
    VisualObservationRule,
    BrandVoiceRules,
    ConfidenceRule,
    HealingExpressionWhitelist,
    StateRitualModuleRule,
    StateContradictionType,
} from "@/lib/align-knowledge/types";

export const alignKnowledge = {
    version: ALIGN_KNOWLEDGE_VERSION,
    dimensions: validateDimensions(dimensions) as KnowledgeDimension[],
    archetypes: validateArchetypes(archetypes) as KnowledgeArchetype[],
    tensionPatterns: validateTensionPatterns(tensionPatterns) as TensionPattern[],
    visualObservationRules: validateVisualObservationRules(visualObservationRules) as VisualObservationRule[],
    observationToInterpretation: validateObservationToInterpretation(observationToInterpretation) as ObservationInterpretationRule[],
    interpretationToActions: validateInterpretationToActions(interpretationToActions) as InterpretationActionRule[],
    roomGoals: validateRoomGoals(roomGoals) as RoomGoalProfile[],
    confidenceRules: validateConfidenceRules(confidenceRules) as ConfidenceRule[],
    brandVoiceRules: validateBrandVoiceRules(brandVoiceRules) as BrandVoiceRules,
    healingExpressionWhitelist: validateHealingExpressionWhitelist(healingExpressionWhitelist) as HealingExpressionWhitelist,
    stateRitualModuleRules: validateStateRitualModuleRules(stateRitualModuleRules) as StateRitualModuleRule[],
    stateContradictionTypes: validateStateContradictionTypes(stateContradictionTypes) as StateContradictionType[],
};

export type AlignKnowledge = typeof alignKnowledge;

export * from "@/lib/align-knowledge/types";
export * from "@/lib/align-knowledge/version";
