import type { CanonicalRoomTypeV2, ClaimedGoalTypeV2 } from "@/lib/align-v2/contracts";

export type StateRitualContent = {
    title: string;
    body: string;
    feltShiftTitle: string;
    feltShiftBody: string;
};

export type StateRitualBuildInput = {
    roomType: CanonicalRoomTypeV2 | null;
    goal: ClaimedGoalTypeV2;
    firstShiftTargetZone?: string | null;
    firstShiftAction?: string | null;
};

export type StateRitualFullReportInput = {
    roomType?: string | null;
    goal?: string | null;
    snapshotStateRitual?: StateRitualContent | null;
};
