"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
    ArrowRight,
    ChevronRight,
    Mail,
    Pencil,
    Sparkles,
    UserRound,
} from "lucide-react";
import AppCenteredState from "@/components/app-shell/AppCenteredState";
import AppStatusNotice from "@/components/app-shell/AppStatusNotice";
import {
    MemberWorkspaceFooter,
    MemberWorkspaceHeader,
} from "@/features/app-ui/v2/shared/MemberChrome";
import { accountPageContent } from "@/features/auth/auth-content";
import { marketingBrand } from "@/features/marketing/site-content";
import { isLocalPreviewHostname } from "@/lib/routing";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import { coerceSnapshotV2 } from "@/lib/align-v2/snapshot-adapters";
import {
    getAuthHeaders,
    getLocalAnalyses,
    getLocalAuthUser,
    signOutCurrentUser,
    syncSignedInProfile,
} from "@/lib/auth-client";
import {
    appAccountBillingHref,
    appAuthHref,
    appUploadHref,
    getAccountReportHref,
} from "@/lib/navigation";
import type { AnalysisHistoryItem, UserProfile } from "@/types";

const goalPreferenceOptions = [
    "Restorative Sleep",
    "Mental Clarity & Focus",
    "More Calm",
    "Vitality & Energy",
] as const;

const budgetPreferenceOptions = [
    "No budget right now",
    "Under $30",
    "$30-$80",
    "$80-$150",
    "Open to suggestions",
] as const;

const stylePreferenceOptions = [
    "Warm Minimalism",
    "Soft Modern",
    "Natural Calm",
    "Layered Cozy",
    "Editorial Quiet",
] as const;

function normalizeGoalPreference(value?: string | null) {
    const normalized = value?.trim().toLowerCase() ?? "";

    if (!normalized) {
        return "Mental Clarity & Focus";
    }

    if (normalized === "sleep" || normalized.includes("sleep") || normalized.includes("restorative")) {
        return "Restorative Sleep";
    }

    if (normalized === "focus" || normalized.includes("focus") || normalized.includes("clarity")) {
        return "Mental Clarity & Focus";
    }

    if (normalized === "stress" || normalized === "calm" || normalized.includes("calm")) {
        return "More Calm";
    }

    if (normalized === "energy" || normalized === "vitality" || normalized.includes("energy")) {
        return "Vitality & Energy";
    }

    return value?.trim() || "Mental Clarity & Focus";
}

function normalizeBudgetPreference(value?: string | null) {
    const normalized = value?.trim().toLowerCase() ?? "";

    if (!normalized) {
        return "Open to suggestions";
    }

    if (normalized.includes("no budget")) {
        return "No budget right now";
    }

    if (normalized.includes("under $30")) {
        return "Under $30";
    }

    if (normalized.includes("$30-$80")) {
        return "$30-$80";
    }

    if (normalized.includes("$80-$150")) {
        return "$80-$150";
    }

    if (normalized.includes("open")) {
        return "Open to suggestions";
    }

    return value?.trim() || "Open to suggestions";
}

function normalizeStylePreference(value?: string | null) {
    const normalized = value?.trim().toLowerCase() ?? "";

    if (!normalized || normalized === "none") {
        return "Warm Minimalism";
    }

    if (normalized === "warm" || normalized.includes("warm")) {
        return "Warm Minimalism";
    }

    if (normalized === "minimalist" || normalized.includes("minimal")) {
        return "Warm Minimalism";
    }

    if (normalized === "modern" || normalized.includes("modern")) {
        return "Soft Modern";
    }

    if (normalized === "natural" || normalized.includes("natural")) {
        return "Natural Calm";
    }

    return value?.trim() || "Warm Minimalism";
}

function buildPreferenceOptions(currentValue: string, options: readonly string[]) {
    return options.includes(currentValue) ? [...options] : [currentValue, ...options];
}

function extractSessionFullName(sessionUser: {
    user_metadata?: {
        full_name?: unknown;
        name?: unknown;
    };
}) {
    const fullName =
        typeof sessionUser.user_metadata?.full_name === "string"
            ? sessionUser.user_metadata.full_name
            : typeof sessionUser.user_metadata?.name === "string"
                ? sessionUser.user_metadata.name
                : null;

    return fullName?.trim() || null;
}

function formatDate(value?: string | null) {
    if (!value) {
        return "Recently";
    }

    return new Date(value).toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
    });
}

function formatGoalLabel(profile: UserProfile | null, latestAnalysis: AnalysisHistoryItem | null) {
    return (
        profile?.onboarding_goal ||
        latestAnalysis?.goal_data?.intentionLabel ||
        latestAnalysis?.goal_data?.goal ||
        "Restorative Living"
    );
}

function formatBudgetLabel(profile: UserProfile | null, latestAnalysis: AnalysisHistoryItem | null) {
    return (
        profile?.budget_preference ||
        latestAnalysis?.goal_data?.budgetComfort ||
        latestAnalysis?.goal_data?.budget ||
        "Adaptive"
    );
}

function formatStyleLabel(profile: UserProfile | null, latestAnalysis: AnalysisHistoryItem | null) {
    return (
        profile?.style_preference_default ||
        latestAnalysis?.goal_data?.style ||
        "Warm Minimalism"
    );
}

function renderStatusBadge(analysis: AnalysisHistoryItem) {
    if (analysis.paid) {
        return {
            label: "Premium",
            className: "bg-[#f3ded7]/65 text-[#6d564e]",
        };
    }

    return {
        label: "Archive",
        className: "bg-[#ece8df] text-[#8c8379]",
    };
}

function getHistorySnapshot(analysis: AnalysisHistoryItem) {
    return coerceSnapshotV2(analysis.report_result?.free.snapshot ?? analysis.snapshot_result ?? null);
}

function getSnapshotHeadline(snapshot: ReturnType<typeof getHistorySnapshot>) {
    return snapshot?.type.name ?? "The Quiet Potential";
}

function getSnapshotScore(snapshot: ReturnType<typeof getHistorySnapshot>) {
    return snapshot?.score.value ?? 0;
}

function getSnapshotTension(snapshot: ReturnType<typeof getHistorySnapshot>) {
    return snapshot?.tension.explanation || "Your room is beginning to support you, but still has room to soften and restore.";
}

const latestReadingImage = "/media/auth/account-latest.webp";

const historyImages = [
    "/media/auth/account-history-1.webp",
    "/media/auth/account-history-2.webp",
];

const previewProfile: UserProfile = {
    id: "local-preview-han",
    email: "hello@alignflow.xyz",
    full_name: "Han Solo",
    provider: "email",
    marketing_opt_in: true,
    onboarding_goal: "Mental Clarity & Focus",
    budget_preference: "Artisan (Premium)",
    style_preference_default: "Warm Minimalism",
    created_at: "2024-08-24T09:00:00.000Z",
};

const previewAnalyses: AnalysisHistoryItem[] = [
    {
        id: "preview-latest",
        created_at: "2024-10-24T08:00:00.000Z",
        paid: false,
        goal_data: {
            goal: "focus",
            concern: "Visual stress",
            style: "warm",
            stress: 6,
            usage: "Restore and recharge",
            budget: "medium",
            renting: true,
            acceptPlants: true,
            acceptLighting: true,
            intentionLabel: "Mental Clarity & Focus",
            budgetComfort: "Artisan (Premium)",
        },
        snapshot_result: {
            version: "2026-04-01.snapshot.v2",
            analysisMode: "vision",
            validation: {
                status: "valid",
                code: "valid",
                message: "Preview snapshot",
                finalRoomType: "living_room",
                roomMismatch: { mismatch: false, severity: "none", reason: null, userActionRequired: false, suggestedAction: "continue" },
            },
            type: {
                id: "still_water",
                name: "The Quiet Potential",
                coreSentence: "A soft room with strong visual calm and room to deepen restoration.",
                confidence: 0.82,
            },
            summary: {
                headline: "This room already has a gentle base, but it still needs stronger restorative cues.",
                statusTags: ["Stable base", "Warmth can deepen", "Recovery can grow"],
                body: "The room already feels settled, but it is still reading more composed than fully restorative.",
            },
            score: {
                goal: "focus",
                value: 88,
                overall: 86,
                label: "Well Balanced",
                narrative: "Strong calm support",
                meaning: "Natural light supports daytime ease.",
            },
            reading: {
                oneLiner: "This room already holds a lot of calm.",
                shortParagraph: "A few softer textures and one warmer ambient light source would help this room exhale.",
            },
            proof: [{ label: "Calm structure", evidence: "Low clutter keeps the room visually quiet.", impact: "positive" }],
            spaceState: {
                overallScore: 88,
                strongest: "Calm",
                weakest: "Warmth",
                coreGap: "The room is already strong, but still has room to feel more held.",
                dimensions: [
                    { key: "calm", label: "Calm", score: 91, level: "strong", summary: "The room already reads as visually settled." },
                    { key: "clarity", label: "Clarity", score: 84, level: "strong", summary: "The structure is clean and easy to read." },
                    { key: "grounding", label: "Grounding", score: 80, level: "strong", summary: "The room already has a dependable base." },
                    { key: "warmth", label: "Warmth", score: 64, level: "medium", summary: "More warmth would help the room relax further." },
                    { key: "openness", label: "Openness", score: 85, level: "strong", summary: "The room feels breathable and open." },
                    { key: "restoration", label: "Restoration", score: 74, level: "strong", summary: "The room already supports calm, but could deepen its restorative feel." },
                ],
            },
            tension: {
                headline: "Soften the hardest edges",
                explanation: "Your living room currently prioritizes visual order but lacks the acoustic dampening needed for deep restoration.",
            },
            firstShift: {
                title: "Warm the evening tone",
                action: "Add one warmer light source and one softer surface.",
                examples: ["Add one lower warm lamp.", "Bring in one softer textile.", "Let one corner feel quieter at night."],
                whyItHelps: "This helps the room relax more fully at night.",
                targetZone: "the main seating area",
                timing: "tonight",
            },
            brandHook: {
                title: "You do not need to redesign the room.",
                subtitle: "You need to soften the signal it gives off at night.",
                signals: ["A warmer glow", "A softer surface", "A calmer evening rhythm"],
            },
            preview: {
                teaserTitle: "If you keep going, the full report shows you",
                hiddenFindings: ["Which corner should become the recovery zone"],
                fullReportPromise: "Preserve the room’s quiet structure, then add softness through texture, light, and sound-absorbing accents.",
                ctaText: "Unlock Full Report",
            },
            meta: { noteUsed: false, diagnosisConfidence: 0.82, generationMode: "fully_templated" },
        },
    },
    {
        id: "preview-history-1",
        created_at: "2024-09-12T08:00:00.000Z",
        paid: false,
        goal_data: {
            goal: "focus",
            concern: "Alignment",
            style: "minimalist",
            stress: 5,
            usage: "Work and think",
            budget: "low",
            renting: true,
            acceptPlants: true,
            acceptLighting: true,
            intentionLabel: "Work + Life Alignment",
        },
        snapshot_result: {
            version: "2026-04-01.snapshot.v2",
            analysisMode: "vision",
            validation: {
                status: "valid",
                code: "valid",
                message: "Preview snapshot",
                finalRoomType: "workspace",
                roomMismatch: { mismatch: false, severity: "none", reason: null, userActionRequired: false, suggestedAction: "continue" },
            },
            type: {
                id: "rising_wood",
                name: "Morning Light Studio",
                coreSentence: "A bright, ordered room with healthy focus support.",
                confidence: 0.88,
            },
            summary: {
                headline: "This workspace already supports clarity, but it still needs protection around its cleanest lane.",
                statusTags: ["Focus is strong", "Clarity holds", "Protect the main lane"],
                body: "The room is already helping focus, but it will stay that way only if the clearest desk zone remains protected.",
            },
            score: {
                goal: "focus",
                value: 92,
                overall: 91,
                label: "Well Balanced",
                narrative: "High focus support",
                meaning: "Excellent daylight support.",
            },
            reading: {
                oneLiner: "This workspace already supports clear thinking.",
                shortParagraph: "Keep the main desk zone clear to preserve this clarity.",
            },
            proof: [{ label: "Daylight", evidence: "Excellent daylight support.", impact: "positive" }],
            spaceState: {
                overallScore: 92,
                strongest: "Clarity",
                weakest: "Warmth",
                coreGap: "The room is highly effective, but still a little cool in tone.",
                dimensions: [
                    { key: "calm", label: "Calm", score: 80, level: "strong", summary: "The room already feels focused without becoming noisy." },
                    { key: "clarity", label: "Clarity", score: 94, level: "strong", summary: "The room communicates its purpose very clearly." },
                    { key: "grounding", label: "Grounding", score: 81, level: "strong", summary: "There is a clear working anchor here." },
                    { key: "warmth", label: "Warmth", score: 58, level: "medium", summary: "A little more softness would keep the room from reading too hard." },
                    { key: "openness", label: "Openness", score: 86, level: "strong", summary: "The room has enough visual breathing room for focus." },
                    { key: "restoration", label: "Restoration", score: 72, level: "strong", summary: "The room can recover between focus blocks, though that is not its strongest quality." },
                ],
            },
            tension: {
                headline: "Protect the clear desk zone",
                explanation: "A bright workspace with strong visual rhythm and calm structure.",
            },
            firstShift: {
                title: "Preserve the focus lane",
                action: "Keep the main desk zone clear to preserve this clarity.",
                examples: ["Leave one surface fully open.", "Keep one visual lane empty.", "Move one active object out of sight."],
                whyItHelps: "A clean focal zone prevents new visual drag from building up.",
                targetZone: "the desk area",
                timing: "tonight",
            },
            brandHook: {
                title: "You do not need more structure.",
                subtitle: "You need to preserve the clearest line of focus.",
                signals: ["One protected desk zone", "Less visual drag", "A stronger work anchor"],
            },
            preview: {
                teaserTitle: "If you keep going, the full report shows you",
                hiddenFindings: ["What would add warmth without reducing focus"],
                fullReportPromise: "Keep what works and layer in warmth without adding noise.",
                ctaText: "Unlock Full Report",
            },
            meta: { noteUsed: false, diagnosisConfidence: 0.88, generationMode: "fully_templated" },
        },
    },
    {
        id: "preview-history-2",
        created_at: "2024-08-09T08:00:00.000Z",
        paid: true,
        goal_data: {
            goal: "sleep",
            concern: "Restorative focus",
            style: "warm",
            stress: 7,
            usage: "Rest and reset",
            budget: "medium",
            renting: true,
            acceptPlants: true,
            acceptLighting: true,
            intentionLabel: "Restorative Focus",
        },
        snapshot_result: {
            version: "2026-04-01.snapshot.v2",
            analysisMode: "vision",
            validation: {
                status: "valid",
                code: "valid",
                message: "Preview snapshot",
                finalRoomType: "bedroom",
                roomMismatch: { mismatch: false, severity: "none", reason: null, userActionRequired: false, suggestedAction: "continue" },
            },
            type: {
                id: "heavy_earth",
                name: "The Sanctuary Nook",
                coreSentence: "Comforting but slightly under-supported for deeper recovery.",
                confidence: 0.79,
            },
            summary: {
                headline: "This bedroom already feels calm, but it still needs a clearer rest boundary.",
                statusTags: ["Calm base", "Storage still activates", "Recovery can deepen"],
                body: "The room already leans restful, but a few visible pressure points still keep the rest zone from feeling fully held.",
            },
            score: {
                goal: "sleep",
                value: 76,
                overall: 75,
                label: "Room to Grow",
                narrative: "Calm but under-supported",
                meaning: "Warm tones support comfort.",
            },
            reading: {
                oneLiner: "This bedroom is calm but not fully restorative yet.",
                shortParagraph: "A clearer rest boundary would help the room feel more held.",
            },
            proof: [{ label: "Warmth", evidence: "Warm tones support comfort.", impact: "positive" }],
            spaceState: {
                overallScore: 76,
                strongest: "Calm",
                weakest: "Restoration",
                coreGap: "The room feels calm, but the rest signal is not fully protected yet.",
                dimensions: [
                    { key: "calm", label: "Calm", score: 82, level: "strong", summary: "The room already has a quiet emotional tone." },
                    { key: "clarity", label: "Clarity", score: 68, level: "medium", summary: "The room is readable, though not fully resolved." },
                    { key: "grounding", label: "Grounding", score: 73, level: "strong", summary: "The room has a decent felt base." },
                    { key: "warmth", label: "Warmth", score: 74, level: "strong", summary: "Warmth is already helping the room feel more comfortable." },
                    { key: "openness", label: "Openness", score: 61, level: "medium", summary: "The room still needs a little more breathing room near rest." },
                    { key: "restoration", label: "Restoration", score: 58, level: "medium", summary: "The room is close, but not yet deeply restorative." },
                ],
            },
            tension: {
                headline: "Reduce visible storage near rest",
                explanation: "The room is calm, but a few heavier zones keep it from feeling fully restorative.",
            },
            firstShift: {
                title: "Clarify the rest boundary",
                action: "A clearer rest boundary would help the room feel more held.",
                examples: ["Reduce one active object near the bed.", "Quiet one visible storage zone.", "Let the rest area feel visually simpler."],
                whyItHelps: "Reducing activation near the bed makes deeper recovery easier.",
                targetZone: "the sleep zone",
                timing: "tonight",
            },
            brandHook: {
                title: "You do not need more calm.",
                subtitle: "You need the room to protect that calm more clearly.",
                signals: ["A cleaner rest boundary", "Less visible activation", "A more held sleep zone"],
            },
            preview: {
                teaserTitle: "If you keep going, the full report shows you",
                hiddenFindings: ["Which objects are keeping the room lightly activated"],
                fullReportPromise: "Reduce visible storage and soften the rest zone to deepen recovery.",
                ctaText: "Unlock Full Report",
            },
            meta: { noteUsed: false, diagnosisConfidence: 0.79, generationMode: "fully_templated" },
        },
    },
];

export default function AccountPage() {
    const isConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const isLocalPreviewMode =
        typeof window !== "undefined" &&
        isLocalPreviewHostname(window.location.hostname);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [sessionFallbackProfile, setSessionFallbackProfile] = useState<UserProfile | null>(null);
    const [analyses, setAnalyses] = useState<AnalysisHistoryItem[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    const [isSendingPasswordReset, setIsSendingPasswordReset] = useState(false);
    const [preferenceDraft, setPreferenceDraft] = useState({
        goal: "Mental Clarity & Focus",
        budget: "Open to suggestions",
        style: "Warm Minimalism",
    });
    const [savedPreferenceDraft, setSavedPreferenceDraft] = useState({
        goal: "Mental Clarity & Focus",
        budget: "Open to suggestions",
        style: "Warm Minimalism",
    });
    const [preferenceMessage, setPreferenceMessage] = useState<string | null>(null);
    const [preferenceError, setPreferenceError] = useState<string | null>(null);
    const [isSavingPreferences, setIsSavingPreferences] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const loadAccount = async () => {
            try {
                const localUser = getLocalAuthUser();
                if (isLocalPreviewMode && localUser) {
                    if (isMounted) {
                        const localProfile = {
                            id: localUser.id,
                            email: localUser.email || previewProfile.email,
                            full_name: previewProfile.full_name,
                            provider: localUser.provider,
                            marketing_opt_in: localUser.marketing_opt_in,
                            onboarding_goal: previewProfile.onboarding_goal,
                            budget_preference: previewProfile.budget_preference,
                            style_preference_default: previewProfile.style_preference_default,
                            created_at: localUser.created_at,
                        };
                        setIsAuthenticated(true);
                        setProfile(localProfile);
                        setSessionFallbackProfile(localProfile);
                        const localAnalyses = getLocalAnalyses();
                        setAnalyses(localAnalyses.length > 0 ? localAnalyses : previewAnalyses);
                        setIsLoading(false);
                    }
                    return;
                }

                if (!isConfigured) {
                    if (isMounted) {
                        if (localUser) {
                            const localProfile = {
                                id: localUser.id,
                                email: localUser.email,
                                provider: localUser.provider,
                                marketing_opt_in: localUser.marketing_opt_in,
                                created_at: localUser.created_at,
                            };
                            setIsAuthenticated(true);
                            setProfile(localProfile);
                            setSessionFallbackProfile(localProfile);
                            setAnalyses(getLocalAnalyses());
                        }
                        setIsLoading(false);
                    }
                    return;
                }

                const supabase = getBrowserSupabase();
                const { data: sessionData } = await supabase.auth.getSession();
                const sessionUser = sessionData.session?.user ?? null;

                if (!sessionUser) {
                    if (isMounted) {
                        setIsAuthenticated(false);
                        setIsLoading(false);
                    }
                    return;
                }

                if (isMounted) {
                    setIsAuthenticated(true);
                    setSessionFallbackProfile({
                        id: sessionUser.id,
                        email: sessionUser.email ?? "No email available",
                        full_name: extractSessionFullName(sessionUser),
                        provider:
                            typeof sessionUser.app_metadata?.provider === "string"
                                ? sessionUser.app_metadata.provider
                                : null,
                        marketing_opt_in: false,
                        created_at: sessionUser.created_at,
                    });
                }

                const authHeaders = await getAuthHeaders();
                const [profileRes, analysesRes] = await Promise.all([
                    fetch("/api/account/profile", { headers: authHeaders }),
                    fetch("/api/account/analyses", { headers: authHeaders }),
                ]);

                const profileJson = await profileRes.json();
                const analysesJson = await analysesRes.json();

                if (!isMounted) return;

                if (profileRes.ok && profileJson.success) {
                    setProfile(profileJson.data.profile);
                } else if (profileRes.status === 404 && sessionUser.email) {
                    await syncSignedInProfile(undefined, { source: "account-page" });
                    const retryProfileRes = await fetch("/api/account/profile", { headers: authHeaders });
                    const retryProfileJson = await retryProfileRes.json();
                    if (retryProfileRes.ok && retryProfileJson.success) {
                        setProfile(retryProfileJson.data.profile);
                    } else {
                        setError("Your account session is active, but the profile record is still syncing.");
                    }
                }

                if (analysesRes.ok && analysesJson.success) {
                    setAnalyses(analysesJson.data.analyses || []);
                }

                if (!profileRes.ok && !analysesRes.ok) {
                    setError("Unable to load your account right now.");
                }
            } catch (accountError) {
                if (!isMounted) return;
                const message = accountError instanceof Error ? accountError.message : "Unable to load your account.";
                setError(message);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        let subscriptionCleanup = () => {};

        if (isConfigured) {
            const supabase = getBrowserSupabase();
            const {
                data: { subscription },
            } = supabase.auth.onAuthStateChange((event, session) => {
                if (!isMounted) return;

                if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session?.user) {
                    setIsAuthenticated(true);
                    setSessionFallbackProfile({
                        id: session.user.id,
                        email: session.user.email ?? "No email available",
                        full_name: extractSessionFullName(session.user),
                        provider:
                            typeof session.user.app_metadata?.provider === "string"
                                ? session.user.app_metadata.provider
                                : null,
                        marketing_opt_in: false,
                        created_at: session.user.created_at,
                    });
                    void loadAccount();
                    return;
                }

                if (event === "SIGNED_OUT") {
                    setIsAuthenticated(false);
                    setProfile(null);
                    setSessionFallbackProfile(null);
                    setAnalyses([]);
                    setIsLoading(false);
                }
            });

            subscriptionCleanup = () => subscription.unsubscribe();
        }

        void loadAccount();

        return () => {
            isMounted = false;
            subscriptionCleanup();
        };
    }, [isConfigured, isLocalPreviewMode]);

    const resolvedProfile = profile ?? sessionFallbackProfile;
    const latestAnalysis = analyses[0] ?? null;
    const latestSnapshot = latestAnalysis ? getHistorySnapshot(latestAnalysis) : null;
    const historyItems = latestAnalysis ? analyses.slice(1) : analyses;
    const profileGoal = useMemo(() => formatGoalLabel(resolvedProfile, latestAnalysis), [resolvedProfile, latestAnalysis]);
    const profileBudget = useMemo(() => formatBudgetLabel(resolvedProfile, latestAnalysis), [resolvedProfile, latestAnalysis]);
    const profileStyle = useMemo(() => formatStyleLabel(resolvedProfile, latestAnalysis), [resolvedProfile, latestAnalysis]);
    const normalizedGoalPreference = useMemo(() => normalizeGoalPreference(profileGoal), [profileGoal]);
    const normalizedBudgetPreference = useMemo(() => normalizeBudgetPreference(profileBudget), [profileBudget]);
    const normalizedStylePreference = useMemo(() => normalizeStylePreference(profileStyle), [profileStyle]);
    const goalOptions = useMemo(
        () => buildPreferenceOptions(normalizedGoalPreference, goalPreferenceOptions),
        [normalizedGoalPreference],
    );
    const budgetOptions = useMemo(
        () => buildPreferenceOptions(normalizedBudgetPreference, budgetPreferenceOptions),
        [normalizedBudgetPreference],
    );
    const styleOptions = useMemo(
        () => buildPreferenceOptions(normalizedStylePreference, stylePreferenceOptions),
        [normalizedStylePreference],
    );
    const hasPreferenceChanges =
        preferenceDraft.goal !== savedPreferenceDraft.goal ||
        preferenceDraft.budget !== savedPreferenceDraft.budget ||
        preferenceDraft.style !== savedPreferenceDraft.style;

    useEffect(() => {
        const nextDraft = {
            goal: normalizedGoalPreference,
            budget: normalizedBudgetPreference,
            style: normalizedStylePreference,
        };

        setPreferenceDraft(nextDraft);
        setSavedPreferenceDraft(nextDraft);
    }, [normalizedBudgetPreference, normalizedGoalPreference, normalizedStylePreference]);

    const handleSignOut = async () => {
        await signOutCurrentUser();
    };
    const ensureAuthenticatedSession = async () => {
        if (!isConfigured) {
            setPasswordError("Password actions require Supabase auth to be configured.");
            return null;
        }

        const supabase = getBrowserSupabase();
        const { data, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
            setPasswordError(sessionError.message);
            return null;
        }

        if (!data.session) {
            setPasswordError("Please sign in again before updating or resetting your password.");
            return null;
        }

        return supabase;
    };
    const handlePasswordUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (newPassword.length < 8) {
            setPasswordError("Use at least 8 characters for your password.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError("The password confirmation does not match.");
            return;
        }

        try {
            setIsUpdatingPassword(true);
            setPasswordError(null);
            setPasswordMessage(null);

            const supabase = await ensureAuthenticatedSession();
            if (!supabase) {
                return;
            }

            const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });

            if (updateError) {
                throw updateError;
            }

            setNewPassword("");
            setConfirmPassword("");
            setPasswordMessage("Password saved. You can now use email + password sign-in.");
        } catch (updateError) {
            const nextError = updateError instanceof Error ? updateError.message : "Unable to update password.";
            setPasswordError(nextError);
        } finally {
            setIsUpdatingPassword(false);
        }
    };
    const handlePasswordResetEmail = async () => {
        if (!resolvedProfile?.email) {
            setPasswordError("We could not find an email address for this account.");
            return;
        }

        try {
            setIsSendingPasswordReset(true);
            setPasswordError(null);
            setPasswordMessage(null);

            const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL?.trim();
            const base = configuredOrigin || window.location.origin;
            const params = new URLSearchParams({
                next: "/account",
                flow: "recovery",
            });

            const supabase = await ensureAuthenticatedSession();
            if (!supabase) {
                return;
            }

            const { error: resetError } = await supabase.auth.resetPasswordForEmail(resolvedProfile.email, {
                redirectTo: new URL(`/auth/callback?${params.toString()}`, base).toString(),
            });

            if (resetError) {
                throw resetError;
            }

            setPasswordMessage("Password reset email sent. Open the link in your inbox to choose a new password.");
        } catch (resetError) {
            const nextError = resetError instanceof Error ? resetError.message : "Unable to send password reset email.";
            setPasswordError(nextError);
        } finally {
            setIsSendingPasswordReset(false);
        }
    };
    const handlePreferenceSave = async () => {
        try {
            setIsSavingPreferences(true);
            setPreferenceError(null);
            setPreferenceMessage(null);

            if (isLocalPreviewMode || !isConfigured) {
                const nextProfile = {
                    ...(resolvedProfile ?? previewProfile),
                    onboarding_goal: preferenceDraft.goal,
                    budget_preference: preferenceDraft.budget,
                    style_preference_default: preferenceDraft.style,
                };

                setProfile(nextProfile);
                setSessionFallbackProfile((current) => current ? { ...current, ...nextProfile } : nextProfile);
                setSavedPreferenceDraft(preferenceDraft);
                setPreferenceMessage("Preferences updated for this preview session.");
                return;
            }

            const supabase = await ensureAuthenticatedSession();
            if (!supabase) {
                return;
            }

            const authHeaders = await getAuthHeaders();
            const res = await fetch("/api/account/profile", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    ...authHeaders,
                },
                body: JSON.stringify({
                    onboardingGoal: preferenceDraft.goal,
                    budgetPreference: preferenceDraft.budget,
                    stylePreferenceDefault: preferenceDraft.style,
                }),
            });
            const json = await res.json().catch(() => null);

            if (!res.ok || !json?.success) {
                throw new Error(json?.error || "Unable to update your preferences right now.");
            }

            setProfile(json.data.profile);
            setSavedPreferenceDraft(preferenceDraft);
            setPreferenceMessage("Space preferences saved. Future recommendations will use these selections.");
        } catch (updateError) {
            const nextError = updateError instanceof Error ? updateError.message : "Unable to save your preferences.";
            setPreferenceError(nextError);
        } finally {
            setIsSavingPreferences(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#fffcf7]">
                <div className="mx-auto flex min-h-screen max-w-screen-lg items-center justify-center px-6">
                    <AppCenteredState
                        icon={<div className="h-12 w-12 animate-spin rounded-full border-4 border-[#6a5b56] border-t-transparent" />}
                        title={accountPageContent.loadingAccount}
                    />
                </div>
            </div>
        );
    }

    if (!resolvedProfile && isAuthenticated) {
        return (
            <div className="min-h-screen bg-[#fffcf7]">
                <div className="mx-auto flex min-h-screen max-w-screen-lg items-center justify-center px-6">
                    <AppCenteredState
                        icon={<div className="h-12 w-12 animate-spin rounded-full border-4 border-[#6a5b56] border-t-transparent" />}
                        title={accountPageContent.loadingSetup}
                    />
                </div>
            </div>
        );
    }

    if (!resolvedProfile) {
        return (
            <div className="min-h-screen bg-[#fffcf7]">
                <div className="mx-auto flex min-h-screen max-w-screen-lg items-center justify-center px-6">
                    <AppCenteredState
                        icon={(
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f4ded3]">
                                <UserRound className="h-6 w-6 text-[#6a5b56]" />
                            </div>
                        )}
                        title={accountPageContent.anonymousTitle}
                        description={accountPageContent.anonymousCopy}
                        action={(
                            <Link
                                href={appAuthHref}
                                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#6a5b56] px-6 text-sm font-medium text-[#fff6f3] transition-opacity hover:opacity-90"
                            >
                                {isConfigured ? "Continue to Sign In" : "Continue to Local Test Sign In"}
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        )}
                    />
                </div>
            </div>
        );
    }

    const providerLabel =
        resolvedProfile.provider === "google"
            ? "Current sign-in method: Google"
            : resolvedProfile.provider === "email"
                ? "Current sign-in method: Email link"
                : "Current sign-in method is available";
    const paidAnalysesCount = analyses.filter((entry) => entry.paid).length;

    return (
        <div className="min-h-screen bg-[#fffcf7] text-[#383831]">
            <MemberWorkspaceHeader
                active="account"
                onSignOut={handleSignOut}
                brandName={marketingBrand.name}
            />

            <main className="mx-auto max-w-[1240px] px-8 pb-20 pt-12 md:px-10 md:pt-14">
                <header className="mb-14 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
                    <div className="max-w-[34rem]">
                        <h1 className="mb-4 font-serif text-[2.7rem] italic leading-[1.02] text-[#6a5b56] md:text-[3.5rem]">
                            Welcome back{resolvedProfile.full_name ? `, ${resolvedProfile.full_name.split(" ")[0]}.` : "."}
                        </h1>
                        <p className="max-w-[30rem] text-[0.94rem] font-light leading-7 text-[#6d6760]">
                            Your latest readings, saved reports, and personal preferences live here.
                            A curated space for your spatial wellness journey.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3.5">
                        <Link
                            href={appUploadHref}
                            className="inline-flex items-center justify-center rounded-full bg-[#6a5b56] px-7 py-3 text-[0.8rem] font-medium text-[#fff6f3] transition-opacity hover:opacity-90"
                        >
                            Start New Analysis
                        </Link>
                        {latestAnalysis && (
                            <Link
                                href={getAccountReportHref(latestAnalysis.id)}
                                className="inline-flex items-center justify-center rounded-full bg-[#f3ded7] px-7 py-3 text-[0.8rem] font-medium text-[#5d4f49] transition-colors hover:bg-[#ead5ce]"
                            >
                                View Latest Report
                            </Link>
                        )}
                    </div>
                </header>

                {error && (
                    <div className="mb-8">
                        <AppStatusNotice tone="error">{error}</AppStatusNotice>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-10">
                    <div className="space-y-12 lg:col-span-7">
                        <section>
                            <div className="mb-6 flex items-center justify-between">
                                <h2 className="font-serif text-[1.7rem] text-[#6a5b56]">Latest Reading</h2>
                                <span className="text-[0.72rem] uppercase tracking-[0.22em] text-[#8e877d]">Active Session</span>
                            </div>

                            {latestAnalysis ? (
                                <div className="overflow-hidden rounded-[1.7rem] bg-[#fcf9f3] transition-all duration-500 hover:shadow-[0_30px_60px_-20px_rgba(56,56,49,0.08)]">
                                    <div className="relative aspect-[16/8.8] w-full overflow-hidden">
                                        <Image
                                            src={latestReadingImage}
                                            alt="Minimal sunlit interior for latest reading"
                                            fill
                                            sizes="(max-width: 1024px) 92vw, 58vw"
                                            className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.03]"
                                        />
                                    </div>
                                    <div className="p-8 md:p-9">
                                        <div className="mb-5 flex items-start justify-between gap-6">
                                            <div>
                                                <span className={`mb-4 inline-block rounded-full px-3 py-1 text-[0.68rem] uppercase tracking-[0.22em] ${latestAnalysis.paid ? "bg-[#f3ded7]/70 text-[#6d564e]" : "bg-[#f0f6e2] text-[#626859]"}`}>
                                                    {latestAnalysis.paid ? "Full Report" : "Free Snapshot"}
                                                </span>
                                                <h3 className="mb-2 font-serif text-[1.82rem] italic text-[#6a5b56]">
                                                    {getSnapshotHeadline(latestSnapshot)}
                                                </h3>
                                                <p className="text-[0.88rem] font-light text-[#7b756d]">
                                                    Analyzed on {formatDate(latestAnalysis.created_at)}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-serif text-[2.6rem] leading-none text-[#6a5b56]">
                                                    {getSnapshotScore(latestSnapshot)}
                                                    <span className="text-lg italic opacity-40">/100</span>
                                                </div>
                                                <div className="mt-1 text-[0.68rem] uppercase tracking-[0.22em] text-[#8e877d]">
                                                    Spatial Score
                                                </div>
                                            </div>
                                        </div>

                                        <p className="mb-7 max-w-[38rem] text-[0.94rem] font-light italic leading-7 text-[#4f4a45]">
                                            &quot;{getSnapshotTension(latestSnapshot)}&quot;
                                        </p>

                                        <div className="flex flex-wrap gap-3">
                                            <Link
                                                href={getAccountReportHref(latestAnalysis.id)}
                                                className="inline-flex items-center justify-center rounded-full bg-[#6a5b56] px-5 py-2.5 text-[0.78rem] font-medium text-[#fff6f3]"
                                            >
                                                Open Snapshot
                                            </Link>
                                            <Link
                                                href={getAccountReportHref(latestAnalysis.id)}
                                                className="inline-flex items-center justify-center rounded-full border border-[#6a5b56]/20 px-5 py-2.5 text-[0.78rem] font-medium text-[#6a5b56] transition-colors hover:bg-[#6a5b56]/5"
                                            >
                                                View Full Report
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-[1.8rem] bg-[#fcf9f3] p-10 text-[#6d6760]">
                                    Run a new analysis while signed in and it will appear here automatically.
                                </div>
                            )}
                        </section>

                        <section id="reading-history">
                            <div className="mb-6 flex items-center justify-between">
                                <h2 className="font-serif text-[1.7rem] text-[#6a5b56]">Reading History</h2>
                                <span className="text-[0.72rem] uppercase tracking-[0.22em] text-[#8e877d]">View All Archives</span>
                            </div>

                            <div className="space-y-4">
                                {(historyItems.length > 0 ? historyItems : analyses).slice(0, 4).map((analysis, index) => {
                                    const badge = renderStatusBadge(analysis);
                                    const snapshot = getHistorySnapshot(analysis);
                                    return (
                                        <Link
                                            key={analysis.id}
                                            href={getAccountReportHref(analysis.id)}
                                            className="group flex items-center gap-5 rounded-[1.45rem] bg-[#fcf9f3] p-4.5 transition-colors hover:bg-[#f0eee5]"
                                        >
                                            <div className="relative h-[4.5rem] w-[4.5rem] flex-shrink-0 overflow-hidden rounded-xl bg-[#ece8df]">
                                                <Image
                                                    src={historyImages[index % historyImages.length]}
                                                    alt={getSnapshotHeadline(snapshot)}
                                                    fill
                                                    sizes="72px"
                                                    className="h-full w-full object-cover opacity-85 transition-opacity group-hover:opacity-100"
                                                />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h4 className="mb-1 text-[0.95rem] font-medium text-[#6a5b56]">
                                                    {snapshot ? getSnapshotHeadline(snapshot) : `Reading ${index + 1}`}
                                                </h4>
                                                <p className="text-[0.75rem] text-[#8b847a]">
                                                    {formatDate(analysis.created_at)} • {analysis.goal_data?.intentionLabel || analysis.goal_data?.goal || "Spatial wellness"}
                                                </p>
                                            </div>
                                            <div className="hidden items-center gap-6 text-right sm:flex">
                                                <span className={`rounded-full px-3 py-1 text-[0.64rem] uppercase tracking-[0.18em] ${badge.className}`}>
                                                    {badge.label}
                                                </span>
                                                <div className="font-serif text-[1.1rem] text-[#6a5b56]">
                                                    {snapshot ? getSnapshotScore(snapshot) : "--"}
                                                </div>
                                                <ChevronRight className="h-5 w-5 text-[#6a5b56]/40 transition-colors group-hover:text-[#6a5b56]" />
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </section>
                    </div>

                    <div className="space-y-7 lg:col-span-5">
                        <section className="rounded-[1.7rem] bg-[#fcf9f3] p-8 md:p-9">
                            <h2 className="mb-6 font-serif text-[1.42rem] text-[#6a5b56]">Your Profile</h2>
                            <div className="space-y-6">
                                <div>
                                    <label className="mb-2 block text-[0.68rem] uppercase tracking-[0.22em] text-[#8e877d]">Full Name</label>
                                    <div className="border-b border-[#6a5b56]/10 pb-2 text-[0.96rem] font-light text-[#4f4944]">
                                        {resolvedProfile.full_name || "Not set yet"}
                                    </div>
                                </div>
                                <div>
                                    <label className="mb-2 block text-[0.68rem] uppercase tracking-[0.22em] text-[#8e877d]">Email Address</label>
                                    <div className="border-b border-[#6a5b56]/10 pb-2 text-[0.96rem] font-light text-[#4f4944]">
                                        {resolvedProfile.email}
                                    </div>
                                </div>
                            </div>

                            <h2 className="mb-6 mt-11 font-serif text-[1.42rem] text-[#6a5b56]">Space Preferences</h2>
                            <div className="space-y-6">
                                <div>
                                    <div className="mb-2 flex items-center justify-between gap-4">
                                        <label className="block text-[0.68rem] uppercase tracking-[0.22em] text-[#8e877d]">Primary Goal</label>
                                        <Pencil className="h-4 w-4 text-[#6a5b56]/25" />
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {goalOptions.map((option) => {
                                            const isSelected = preferenceDraft.goal === option;
                                            return (
                                                <button
                                                    key={option}
                                                    type="button"
                                                    onClick={() => setPreferenceDraft((current) => ({ ...current, goal: option }))}
                                                    className={`rounded-full px-3.5 py-2 text-[0.8rem] transition ${
                                                        isSelected
                                                            ? "bg-[#6a5b56] text-[#fff6f3]"
                                                            : "border border-[#6a5b56]/12 bg-[#fffdfa] text-[#6a5b56] hover:bg-[#f4ede6]"
                                                    }`}
                                                >
                                                    {option}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <div className="mb-2 flex items-center justify-between gap-4">
                                        <label className="block text-[0.68rem] uppercase tracking-[0.22em] text-[#8e877d]">Budget Range</label>
                                        <Pencil className="h-4 w-4 text-[#6a5b56]/25" />
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {budgetOptions.map((option) => {
                                            const isSelected = preferenceDraft.budget === option;
                                            return (
                                                <button
                                                    key={option}
                                                    type="button"
                                                    onClick={() => setPreferenceDraft((current) => ({ ...current, budget: option }))}
                                                    className={`rounded-full px-3.5 py-2 text-[0.8rem] transition ${
                                                        isSelected
                                                            ? "bg-[#6a5b56] text-[#fff6f3]"
                                                            : "border border-[#6a5b56]/12 bg-[#fffdfa] text-[#6a5b56] hover:bg-[#f4ede6]"
                                                    }`}
                                                >
                                                    {option}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <div className="mb-2 flex items-center justify-between gap-4">
                                        <label className="block text-[0.68rem] uppercase tracking-[0.22em] text-[#8e877d]">Aesthetic Style</label>
                                        <Pencil className="h-4 w-4 text-[#6a5b56]/25" />
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {styleOptions.map((option) => {
                                            const isSelected = preferenceDraft.style === option;
                                            return (
                                                <button
                                                    key={option}
                                                    type="button"
                                                    onClick={() => setPreferenceDraft((current) => ({ ...current, style: option }))}
                                                    className={`rounded-full px-3.5 py-2 text-[0.8rem] transition ${
                                                        isSelected
                                                            ? "bg-[#6a5b56] text-[#fff6f3]"
                                                            : "border border-[#6a5b56]/12 bg-[#fffdfa] text-[#6a5b56] hover:bg-[#f4ede6]"
                                                    }`}
                                                >
                                                    {option}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="rounded-[1.2rem] border border-[#6a5b56]/8 bg-[#fffcf7] p-4">
                                    <p className="text-[0.78rem] leading-6 text-[#7b756d]">
                                        These tags are prefilled from your onboarding flow when available, then saved here so future room readings can stay aligned with your preferences.
                                    </p>
                                    <div className="mt-4 flex flex-wrap items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={handlePreferenceSave}
                                            disabled={!hasPreferenceChanges || isSavingPreferences}
                                            className="inline-flex items-center justify-center rounded-full bg-[#6a5b56] px-5 py-2.5 text-[0.78rem] font-medium text-[#fff6f3] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-55"
                                        >
                                            {isSavingPreferences ? "Saving preferences..." : "Save preferences"}
                                        </button>
                                        {hasPreferenceChanges && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setPreferenceDraft(savedPreferenceDraft);
                                                    setPreferenceError(null);
                                                    setPreferenceMessage(null);
                                                }}
                                                className="text-[0.78rem] font-medium text-[#6a5b56] underline-offset-4 transition hover:underline"
                                            >
                                                Reset changes
                                            </button>
                                        )}
                                    </div>
                                    {preferenceMessage && (
                                        <p className="mt-3 text-[0.78rem] text-[#5b6b45]">
                                            {preferenceMessage}
                                        </p>
                                    )}
                                    {preferenceError && (
                                        <p className="mt-3 text-[0.78rem] text-[#8a4f47]">
                                            {preferenceError}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </section>

                        <section className="space-y-5">
                            <div className="rounded-[1.7rem] border border-[#6a5b56]/5 bg-[#f6f4ec] p-7">
                                <div className="mb-5 flex items-center justify-between">
                                    <h3 className="font-serif text-[1.16rem] text-[#6a5b56]">Wellness Plan</h3>
                                    <span className={`rounded-full px-3 py-1 text-[0.68rem] ${paidAnalysesCount > 0 ? "bg-[#f0f6e2] text-[#626859]" : "bg-[#ece8df] text-[#8c8379]"}`}>
                                        {paidAnalysesCount > 0 ? "Active" : "Free"}
                                    </span>
                                </div>
                                <p className="mb-5 text-[0.86rem] font-light leading-6 text-[#817a71]">
                                    {paidAnalysesCount > 0
                                        ? `Your next renewal is saved in your billing center. You currently have ${paidAnalysesCount} paid report${paidAnalysesCount > 1 ? "s" : ""} linked to this account.`
                                        : "Manage receipts and future subscription settings from one calm billing center once a payment has been made."}
                                </p>
                                <Link href={appAccountBillingHref} className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[#6a5b56]">
                                    Manage subscription
                                </Link>
                            </div>

                            <div className="rounded-[1.7rem] bg-[#f6f4ec] p-7">
                                <h3 className="mb-5 font-serif text-[1.16rem] text-[#6a5b56]">Account Access</h3>
                                <div className="space-y-5 text-[0.86rem] text-[#6d6760]">
                                    <div className="flex items-center gap-3">
                                        <Sparkles className="h-4 w-4 text-[#6a5b56]" />
                                        <span>{providerLabel}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Mail className="h-4 w-4 text-[#6a5b56]" />
                                        <span>{resolvedProfile.marketing_opt_in ? "Email updates enabled" : "Email updates paused"}</span>
                                    </div>
                                    <div className="rounded-[1.25rem] border border-[#6a5b56]/10 bg-[#fffcf7] p-4">
                                        <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[#8e877d]">Password &amp; Security</p>
                                        <p className="mt-2 text-[0.82rem] leading-6 text-[#6d6760]">
                                            Add a password if you usually use Google or magic links, update it anytime, or send yourself a recovery email from here.
                                        </p>
                                        <form onSubmit={handlePasswordUpdate} className="mt-4 space-y-3">
                                            <input
                                                type="password"
                                                value={newPassword}
                                                onChange={(event) => setNewPassword(event.target.value)}
                                                autoComplete="new-password"
                                                placeholder="New password"
                                                className="w-full rounded-full border border-[#6a5b56]/15 bg-white px-4 py-3 text-[0.82rem] text-[#4f4944] outline-none transition focus:border-[#6a5b56]/35"
                                            />
                                            <input
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(event) => setConfirmPassword(event.target.value)}
                                                autoComplete="new-password"
                                                placeholder="Confirm new password"
                                                className="w-full rounded-full border border-[#6a5b56]/15 bg-white px-4 py-3 text-[0.82rem] text-[#4f4944] outline-none transition focus:border-[#6a5b56]/35"
                                            />
                                            <div className="flex flex-wrap gap-2.5">
                                                <button
                                                    type="submit"
                                                    disabled={isUpdatingPassword || isSendingPasswordReset}
                                                    className="inline-flex items-center justify-center rounded-full bg-[#6a5b56] px-5 py-2.5 text-[0.78rem] font-medium text-[#fff6f3] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                                                >
                                                    {isUpdatingPassword ? "Saving password..." : "Save password"}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handlePasswordResetEmail}
                                                    disabled={isUpdatingPassword || isSendingPasswordReset}
                                                    className="inline-flex items-center justify-center rounded-full border border-[#6a5b56]/15 bg-white px-5 py-2.5 text-[0.78rem] font-medium text-[#6a5b56] transition-colors hover:bg-[#f7f2ea] disabled:cursor-not-allowed disabled:opacity-60"
                                                >
                                                    {isSendingPasswordReset ? "Sending reset link..." : "Send reset email"}
                                                </button>
                                            </div>
                                        </form>
                                        {passwordMessage && (
                                            <p className="mt-3 text-[0.78rem] text-[#5b6b45]">
                                                {passwordMessage}
                                            </p>
                                        )}
                                        {passwordError && (
                                            <p className="mt-3 text-[0.78rem] text-[#8a4f47]">
                                                {passwordError}
                                            </p>
                                        )}
                                    </div>
                                    <div className="pt-2">
                                        <p className="mb-1 text-[0.68rem] uppercase tracking-[0.22em] text-[#8e877d]">Need help?</p>
                                        <a href={`mailto:${accountPageContent.supportEmail}`} className="text-[#6a5b56]">
                                            {accountPageContent.supportEmail}
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </main>

            <MemberWorkspaceFooter
                brandName={marketingBrand.name}
                supportEmail={accountPageContent.supportEmail}
            />
        </div>
    );
}
