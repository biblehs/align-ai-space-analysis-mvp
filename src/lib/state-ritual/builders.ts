import { alignKnowledge } from "@/lib/align-knowledge";
import type { StateRitualModuleRule } from "@/lib/align-knowledge/types";
import type { StateRitualBuildInput, StateRitualContent, StateRitualFullReportInput } from "@/lib/state-ritual/types";

function findStateRitualRule(roomType: string | null | undefined, goal: string | null | undefined): StateRitualModuleRule | undefined {
    if (!roomType || !goal) {
        return undefined;
    }

    return alignKnowledge.stateRitualModuleRules.find((rule) => rule.roomType === roomType && rule.goal === goal);
}

function buildLeadIn(input: StateRitualBuildInput) {
    const targetZone = input.firstShiftTargetZone?.toLowerCase() ?? "";
    const actionLower = input.firstShiftAction?.toLowerCase() ?? "";

    if (targetZone.includes("light") || actionLower.includes("light")) {
        return "Once the light feels softer, stop there for tonight.";
    }

    if (targetZone.includes("bed")) {
        return "After you lighten the bed zone, stop there for tonight.";
    }

    return "Once this part of the room feels lighter, stop there for tonight.";
}

export function buildStateRitual(input: StateRitualBuildInput): StateRitualContent | undefined {
    const rule = findStateRitualRule(input.roomType, input.goal);
    if (!rule) {
        return undefined;
    }

    const template = rule.template;

    return {
        title: template.title,
        body: `${buildLeadIn(input)} Put your phone down for ten minutes, keep only one soft light on, and sit at the bed or by the window long enough to let the room quiet with you. The goal is not to do more, but to let the room's shift land in your body.`,
        feltShiftTitle: template.feltShiftTitle,
        feltShiftBody: template.feltShiftBody,
    };
}

export function buildFullReportStateRitual(input: StateRitualFullReportInput): StateRitualContent | undefined {
    const roomType = input.roomType?.toLowerCase();
    const goal = input.goal?.toLowerCase();

    if (roomType !== "bedroom" || goal !== "sleep" || !input.snapshotStateRitual) {
        return undefined;
    }

    return {
        ...input.snapshotStateRitual,
    };
}
