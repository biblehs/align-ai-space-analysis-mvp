"use client";

import type { GoalData, SpaceData } from "@/types";

const V2_INTAKE_KEY = "align_v2_upload_intake";
const V2_UPLOAD_SESSION_KEY = "align_v2_upload_session_id";

export type UploadV2SpaceId = "bedroom" | "workspace" | "living-room" | "creative-studio";
export type UploadV2IntentId = "sleep" | "focus" | "calm" | "vitality";

export type UploadV2Intake = {
  analysisId: string | null;
  spaceId: UploadV2SpaceId | null;
  intentionId: UploadV2IntentId | null;
  issueId: string | null;
  note: string;
  activePerspectives: string[];
  optionalProvided: boolean;
  changeLevel: number | null;
  budgetLevel: number | null;
  selectedSupport: string | null;
  photoPath: string | null;
  photoUrl: string | null;
  previewUrl: string | null;
};

const DEFAULT_V2_INTAKE: UploadV2Intake = {
  analysisId: null,
  spaceId: "workspace",
  intentionId: null,
  issueId: null,
  note: "",
  activePerspectives: ["full-room", "main-area", "window-light"],
  optionalProvided: false,
  changeLevel: null,
  budgetLevel: null,
  selectedSupport: null,
  photoPath: null,
  photoUrl: null,
  previewUrl: null,
};

const CHANGE_OPTIONS = [
  "No-cost shifts only",
  "Small changes",
  "A few affordable upgrades",
  "Open to a fuller refresh",
] as const;

const BUDGET_OPTIONS = [
  "No budget right now",
  "Under $30",
  "$30-$80",
  "$80-$150",
  "Open to suggestions",
] as const;

function getLocalStorageSafe() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

function buildPublicPhotoUrl(photoPath: string | null) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!supabaseUrl || !photoPath) {
    return null;
  }

  return `${supabaseUrl}/storage/v1/object/public/room-photos/${photoPath}`;
}

export function getUploadV2Intake(): UploadV2Intake {
  const storage = getLocalStorageSafe();
  if (!storage) {
    return DEFAULT_V2_INTAKE;
  }

  const raw = storage.getItem(V2_INTAKE_KEY);
  if (!raw) {
    return DEFAULT_V2_INTAKE;
  }

  try {
    return {
      ...DEFAULT_V2_INTAKE,
      ...(JSON.parse(raw) as Partial<UploadV2Intake>),
    };
  } catch {
    return DEFAULT_V2_INTAKE;
  }
}

export function saveUploadV2Intake(value: UploadV2Intake) {
  const storage = getLocalStorageSafe();
  if (!storage) {
    return;
  }

  storage.setItem(V2_INTAKE_KEY, JSON.stringify(value));
}

export function patchUploadV2Intake(partial: Partial<UploadV2Intake>) {
  const next = {
    ...getUploadV2Intake(),
    ...partial,
  };

  saveUploadV2Intake(next);
  return next;
}

export function clearUploadV2Intake() {
  const storage = getLocalStorageSafe();
  if (!storage) {
    return;
  }

  storage.removeItem(V2_INTAKE_KEY);
}

export function getOrCreateV2AnalysisId() {
  const current = getUploadV2Intake();
  if (current.analysisId) {
    return current.analysisId;
  }

  const nextId = window.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  patchUploadV2Intake({ analysisId: nextId });
  return nextId;
}

export function createFreshV2AnalysisId() {
  const nextId = window.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  patchUploadV2Intake({ analysisId: nextId });
  return nextId;
}

export function getOrCreateV2UploadSessionId() {
  if (typeof window === "undefined") {
    return null;
  }

  const existing = window.sessionStorage.getItem(V2_UPLOAD_SESSION_KEY);
  if (existing) {
    return existing;
  }

  const nextId = window.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.sessionStorage.setItem(V2_UPLOAD_SESSION_KEY, nextId);
  return nextId;
}

function mapIntentToGoal(intent: UploadV2IntentId | null): GoalData["goal"] {
  switch (intent) {
    case "sleep":
      return "sleep";
    case "focus":
      return "focus";
    case "calm":
      return "stress";
    case "vitality":
      return "energy";
    default:
      return "focus";
  }
}

function mapIssueToStress(issueId: string | null) {
  switch (issueId) {
    case "hard-to-relax":
    case "draining":
      return 8;
    case "visually-noisy":
    case "cluttered":
    case "heavy":
      return 7;
    case "stuck":
    case "lacking-warmth":
      return 6;
    default:
      return 5;
  }
}

function mapSpaceToUsage(spaceId: UploadV2SpaceId | null) {
  switch (spaceId) {
    case "bedroom":
      return "rest";
    case "workspace":
      return "work";
    case "living-room":
      return "mixed";
    case "creative-studio":
      return "creative";
    default:
      return "mixed";
  }
}

function mapBudgetLevelToGoalBudget(level: number): GoalData["budget"] {
  if (level <= 0) {
    return "minimal";
  }
  if (level === 1) {
    return "low";
  }
  if (level === 2) {
    return "low";
  }
  return "medium";
}

function mapIssueToConcern(issueId: string | null) {
  switch (issueId) {
    case "visually-noisy":
      return "visual noise and overstimulation";
    case "cluttered":
      return "visible clutter and overwhelm";
    case "heavy":
      return "heavy mood and low flow";
    case "unfocused":
      return "lack of focus and direction";
    case "draining":
      return "energy drain";
    case "hard-to-relax":
      return "difficulty unwinding";
    case "lacking-warmth":
      return "cold and under-supported atmosphere";
    case "stuck":
      return "stagnant energy";
    default:
      return "a room that feels slightly off";
  }
}

export function buildV2SpaceData(intake: UploadV2Intake): SpaceData {
  const photoUrl = intake.photoUrl?.trim() || buildPublicPhotoUrl(intake.photoPath);

  return {
    spaceType: intake.spaceId ?? undefined,
    perspectives: intake.activePerspectives,
    hasPhoto: Boolean(intake.photoPath || photoUrl),
    photoPath: intake.photoPath ?? undefined,
    photoUrl: photoUrl ?? undefined,
  };
}

export function buildV2GoalData(intake: UploadV2Intake): GoalData {
  const changeLevel = intake.optionalProvided ? intake.changeLevel : null;
  const budgetLevel = intake.optionalProvided ? intake.budgetLevel : null;
  const selectedSupport = intake.optionalProvided ? intake.selectedSupport : null;

  const goalData: GoalData = {
    goal: mapIntentToGoal(intake.intentionId),
    concern: mapIssueToConcern(intake.issueId),
    style: "none" as const,
    stress: mapIssueToStress(intake.issueId),
    usage: mapSpaceToUsage(intake.spaceId),
    budget: budgetLevel != null ? mapBudgetLevelToGoalBudget(budgetLevel) : "low",
    renting: true,
    acceptPlants: true,
    acceptLighting: true,
    spaceType: intake.spaceId ?? undefined,
    intentionLabel: intake.intentionId ?? undefined,
    selectedIssue: intake.issueId ?? undefined,
    supportPriority: selectedSupport ?? undefined,
    changeOpenness: changeLevel != null ? CHANGE_OPTIONS[changeLevel] ?? undefined : undefined,
    budgetComfort: budgetLevel != null ? BUDGET_OPTIONS[budgetLevel] ?? undefined : undefined,
    note: intake.note.trim() || undefined,
    perspectives: intake.activePerspectives,
  };

  return goalData;
}

export function getDefaultV2Intake() {
  return DEFAULT_V2_INTAKE;
}
