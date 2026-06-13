import type {
    WaitlistFeedbackWillingness,
    WaitlistFirstRoom,
    WaitlistPrimaryGoal,
    WaitlistSubmissionPayload,
} from "@/types";

export const waitlistPrimaryGoalOptions: Array<{ value: WaitlistPrimaryGoal; label: string; description: string }> = [
    { value: "sleep", label: "Better sleep", description: "Support deeper rest and more restorative evenings." },
    { value: "focus", label: "More focus", description: "Reduce friction and make daily work feel steadier." },
    { value: "calm", label: "Calm", description: "Create a room that feels softer and less overstimulating." },
    { value: "emotional_reset", label: "Emotional reset", description: "Help home feel grounding after heavier days." },
];

export const waitlistFirstRoomOptions: Array<{ value: WaitlistFirstRoom; label: string }> = [
    { value: "bedroom", label: "Bedroom" },
    { value: "workspace", label: "Workspace" },
    { value: "living_room", label: "Living room" },
    { value: "not_sure", label: "Not sure yet" },
];

export const waitlistFeedbackOptions: Array<{ value: WaitlistFeedbackWillingness; label: string; description: string }> = [
    { value: "yes", label: "Yes", description: "I would be happy to share feedback after trying Align." },
    { value: "maybe", label: "Maybe", description: "I may be open to sharing feedback later." },
    { value: "not_right_now", label: "Not right now", description: "I mostly want early access without follow-up." },
];

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeWaitlistEmail(email: string | null | undefined) {
    const normalized = email?.trim().toLowerCase() ?? "";
    return normalized || "";
}

function sanitizeOptionalText(value: unknown, maxLength: number) {
    if (typeof value !== "string") {
        return null;
    }

    const trimmed = value.trim();
    if (!trimmed) {
        return null;
    }

    return trimmed.slice(0, maxLength);
}

export function isValidWaitlistEmail(email: string) {
    return emailPattern.test(email);
}

export function computeWaitlistPriorityScore(input: {
    primaryGoal?: WaitlistPrimaryGoal | string | null;
    firstRoom?: WaitlistFirstRoom | string | null;
    feedbackWillingness?: WaitlistFeedbackWillingness | string | null;
    openTextNote?: string | null;
    source?: string | null;
}) {
    let score = 0;

    if (input.primaryGoal === "sleep") {
        score += 3;
    }

    if (input.firstRoom === "bedroom") {
        score += 2;
    }

    if (input.feedbackWillingness === "yes") {
        score += 2;
    }

    if ((input.openTextNote?.trim().length ?? 0) > 20) {
        score += 1;
    }

    if ((input.source ?? "").toLowerCase().includes("referral")) {
        score += 2;
    }

    return score;
}

export function parseWaitlistSubmission(input: unknown):
    | { success: true; data: WaitlistSubmissionPayload }
    | { success: false; error: string } {
    if (!input || typeof input !== "object") {
        return { success: false, error: "Invalid payload." };
    }

    const payload = input as Record<string, unknown>;
    const email = normalizeWaitlistEmail(typeof payload.email === "string" ? payload.email : "");
    if (!email || !isValidWaitlistEmail(email)) {
        return { success: false, error: "Please enter a valid email address." };
    }

    const primaryGoal = payload.primary_goal;
    if (!["sleep", "focus", "calm", "emotional_reset"].includes(String(primaryGoal ?? ""))) {
        return { success: false, error: "Please choose what you want your space to support." };
    }

    const firstRoom = payload.first_room;
    if (!["bedroom", "workspace", "living_room", "not_sure"].includes(String(firstRoom ?? ""))) {
        return { success: false, error: "Please choose the room you would upload first." };
    }

    const feedbackWillingness = payload.feedback_willingness;
    if (!["yes", "maybe", "not_right_now"].includes(String(feedbackWillingness ?? ""))) {
        return { success: false, error: "Please choose your feedback preference." };
    }

    return {
        success: true,
        data: {
            email,
            primary_goal: primaryGoal as WaitlistPrimaryGoal,
            first_room: firstRoom as WaitlistFirstRoom,
            feedback_willingness: feedbackWillingness as WaitlistFeedbackWillingness,
            open_text_note: sanitizeOptionalText(payload.open_text_note, 600),
            source: sanitizeOptionalText(payload.source, 80),
            session_id: sanitizeOptionalText(payload.session_id, 120),
            page_path: sanitizeOptionalText(payload.page_path, 255),
            referrer: sanitizeOptionalText(payload.referrer, 255),
            landing_path: sanitizeOptionalText(payload.landing_path, 255),
            utm_source: sanitizeOptionalText(payload.utm_source, 120),
            utm_medium: sanitizeOptionalText(payload.utm_medium, 120),
            utm_campaign: sanitizeOptionalText(payload.utm_campaign, 120),
        },
    };
}
