import type { SnapshotResultV2 } from "@/lib/align-v2/contracts";
import type { GoalData, SpaceData } from "@/types";

export const ANALYSIS_STORAGE_KEYS = {
    upload: "align_upload",
    goalData: "align_goal_data",
    snapshot: "align_snapshot",
    pendingAccess: "align_pending_access",
} as const;

export type StoredUpload = {
    analysisId: string;
    spaceData: SpaceData;
};

export type StoredGoalData = {
    analysisId: string;
    goalData: GoalData;
};

export type StoredSnapshot = {
    analysisId: string;
    snapshot: SnapshotResultV2;
};

export type StoredPendingAccess = {
    analysisId: string;
    requiresRegistration: boolean;
};

function readStoredItem<T>(key: string): T | null {
    if (typeof window === "undefined") {
        return null;
    }

    const raw = window.localStorage.getItem(key);
    if (!raw) {
        return null;
    }

    try {
        return JSON.parse(raw) as T;
    } catch {
        return null;
    }
}

function writeStoredItem<T>(key: string, value: T) {
    if (typeof window === "undefined") {
        return;
    }

    window.localStorage.setItem(key, JSON.stringify(value));
}

function removeStoredItem(key: string) {
    if (typeof window === "undefined") {
        return;
    }

    window.localStorage.removeItem(key);
}

export function getStoredUpload() {
    return readStoredItem<StoredUpload>(ANALYSIS_STORAGE_KEYS.upload);
}

export function saveStoredUpload(value: StoredUpload) {
    writeStoredItem(ANALYSIS_STORAGE_KEYS.upload, value);
}

export function getStoredGoalData() {
    return readStoredItem<StoredGoalData>(ANALYSIS_STORAGE_KEYS.goalData);
}

export function saveStoredGoalData(value: StoredGoalData) {
    writeStoredItem(ANALYSIS_STORAGE_KEYS.goalData, value);
}

export function getStoredSnapshot() {
    return readStoredItem<StoredSnapshot>(ANALYSIS_STORAGE_KEYS.snapshot);
}

export function saveStoredSnapshot(value: StoredSnapshot) {
    writeStoredItem(ANALYSIS_STORAGE_KEYS.snapshot, value);
}

export function getStoredPendingAccess() {
    return readStoredItem<StoredPendingAccess>(ANALYSIS_STORAGE_KEYS.pendingAccess);
}

export function saveStoredPendingAccess(value: StoredPendingAccess) {
    writeStoredItem(ANALYSIS_STORAGE_KEYS.pendingAccess, value);
}

export function clearStoredPendingAccess() {
    removeStoredItem(ANALYSIS_STORAGE_KEYS.pendingAccess);
}

export function clearStoredSnapshot() {
    removeStoredItem(ANALYSIS_STORAGE_KEYS.snapshot);
}

export function clearStoredGoalData() {
    removeStoredItem(ANALYSIS_STORAGE_KEYS.goalData);
}

export function clearStoredUpload() {
    removeStoredItem(ANALYSIS_STORAGE_KEYS.upload);
}

export function clearStoredAnalysisFlow() {
    clearStoredPendingAccess();
    clearStoredSnapshot();
    clearStoredGoalData();
    clearStoredUpload();
}
