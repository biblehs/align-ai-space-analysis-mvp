import type { SnapshotResultV2 } from "../lib/align-v2/contracts";

export type Goal = "focus" | "sleep" | "stress" | "energy";
export type Density = "sparse" | "balanced" | "dense";
export type Sunlight = "low" | "medium" | "high";
export type StylePreference = "minimalist" | "warm" | "modern" | "natural" | "none";
export type ProductCategory = "lighting" | "plant" | "storage" | "decor" | "textile";
export type PriceTier = "budget" | "mid" | "premium";
export type BillingProvider = "creem" | "stripe";
export type BillingStatus =
    | "checkout_pending"
    | "paid"
    | "payment_failed"
    | "refunded"
    | "subscription_active"
    | "subscription_canceled";
export type AnalysisPipelineStage =
    | "initialized"
    | "photo_uploaded"
    | "preanalysis_queued"
    | "preanalysis_processing"
    | "preanalysis_completed"
    | "snapshot_queued"
    | "snapshot_processing"
    | "snapshot_action_required"
    | "snapshot_completed"
    | "full_report_queued"
    | "full_report_processing"
    | "full_report_completed"
    | "failed";
export type AnalysisPipelineStatus = "pending" | "processing" | "completed" | "failed";
export type AnalysisGenerationStatus = "pending" | "processing" | "completed" | "failed" | "locked";
export type AnalysisArtifactType =
    | "uploaded_photo"
    | "normalized_input"
    | "preanalysis"
    | "vision_observation"
    | "note_interpretation"
    | "pattern_diagnosis"
    | "score_result"
    | "snapshot"
    | "full_report";

export interface SpaceData {
    sunlight?: Sunlight;
    density?: Density;
    spaceType?: string;
    doorPosition?: string;
    windowPosition?: string;
    orientation?: string;
    colorTone?: string;
    perspectives?: string[];
    hasPhoto?: boolean;
    photoPath?: string;
    photoUrl?: string;
}

export interface RoomPreAnalysis {
    isRoomPhoto: boolean;
    isUsablePhoto: boolean;
    validationReason: string;
    roomType: string;
    visualSummary: string;
    layoutSummary: string;
    lightingSummary: string;
    clutterSummary: string;
    colorSummary: string;
    styleSummary: string;
    standoutFeatures: string[];
    frictionPoints: string[];
    supportZones: string[];
    stressZones: string[];
}

export interface GoalData {
    goal: Goal;
    concern: string;
    style: StylePreference;
    stress: number;
    usage: string;
    budget: PriceTier | "minimal" | "low" | "medium";
    renting: boolean;
    acceptPlants: boolean;
    acceptLighting: boolean;
    spaceType?: string;
    intentionLabel?: string;
    selectedIssue?: string;
    supportPriority?: string;
    changeOpenness?: string;
    budgetComfort?: string;
    note?: string;
    perspectives?: string[];
}

export interface NormalizedAnalysisInput {
    roomType: string;
    primaryGoal: Goal;
    concern: string;
    note: string | null;
    budget: GoalData["budget"];
    stylePreference: StylePreference;
    perspectives: string[];
    roomContext: {
        reportedSunlight: Sunlight;
        reportedDensity: Density;
        spaceType: string | null;
        orientation: string | null;
    };
    constraints: {
        renting: boolean;
        acceptPlants: boolean;
        acceptLighting: boolean;
        supportPriority: string | null;
        changeOpenness: string | null;
        budgetComfort: string | null;
    };
}

export interface VisionObservationItem {
    key: string;
    label: string;
    impact: "positive" | "negative" | "mixed";
    confidence: number;
    evidence: string;
}

export interface VisionObservation {
    isRoomPhoto: boolean;
    isUsablePhoto: boolean;
    validationReason: string;
    roomTypeDetected: string;
    observationSummary: string;
    layoutSummary: string;
    lightingSummary: string;
    clutterSummary: string;
    colorSummary: string;
    styleSummary: string;
    observations: VisionObservationItem[];
    standoutFeatures: string[];
    frictionPoints: string[];
    supportZones: string[];
    stressZones: string[];
}

export interface ScoreDriver {
    key: string;
    direction: "positive" | "negative";
    impact: number;
    rationale: string;
}

export interface ScoreResult {
    scoringVersion: string;
    goal: Goal;
    goalScore: number;
    overallScore: number;
    ratingLabel: string;
    ratingColor: string;
    scores: {
        focus: number;
        sleep: number;
        stress: number;
        energy: number;
    };
    drivers: ScoreDriver[];
    topIssues: string[];
    strengths: string[];
    quickWins: string[];
    overallStrategy: string;
    archetype: string;
    archetypeDesc: string;
}

export interface FullReportSection {
    key: string;
    title: string;
    body: string;
}

export interface FullReportArtifact {
    version: string;
    generatedFrom: {
        normalizedInput: boolean;
        visionObservation: boolean;
        scoreResult: boolean;
        snapshot: boolean;
    };
    summary: {
        headline: string;
        overview: string;
        strategy: string;
    };
    sections: FullReportSection[];
    plan: PlanStep[];
    stateRitual?: {
        title: string;
        body: string;
        feltShiftTitle: string;
        feltShiftBody: string;
    };
}

export interface SnapshotResult {
    analysisMode?: "vision" | "fallback";
    analysisNotice?: string;
    score: number;
    ratingLabel: string;
    ratingColor: string;
    archetype: string;
    archetypeDesc: string;
    sceneFingerprint?: string[];
    primaryTension?: string;
    stressImpact: string;
    freeInsight: string;
    integratedReading?: string;
    missingElement: { icon: string; text: string };
    overloadedElement: { icon: string; text: string };
    dimensions: {
        sunlight: { score: number; evaluation: string };
        clutter: { score: number; evaluation: string };
        color: { score: number; evaluation: string };
        style: { score: number; evaluation: string };
    };
    energyFlow?: {
        score: number;
        evaluation: string;
        blockageZone: string;
        supportZone: string;
    };
    elementBalance?: {
        score: number;
        missingElement: string;
        excessiveElement: string;
        recommendation: string;
    };
    wellnessSignals?: {
        score: number;
        nervousSystemLoad: string;
        restorativeSupport: string;
        ritualPotential: string;
    };
    holisticSupports?: {
        crystalSupport: string;
        incenseSupport: string;
        candleSupport: string;
        ritualSupport: string;
    };
    spatialRemedies?: Array<{
        zone: string;
        issue: string;
        remedy: string;
        expectedShift: string;
        modality: "lighting" | "crystal" | "incense" | "candle" | "layout" | "plant" | "texture" | "wellness";
    }>;
    preserveWhatWorks?: string;
    personalizedRecommendations?: Array<{
        category: "layout" | "lighting" | "declutter" | "color" | "texture" | "element" | "wellness" | "ritual";
        title: string;
        reason: string;
        action: string;
        expectedBenefit: string;
    }>;
    overallStrategy: string;
}

export interface ReportResult {
    version: string;
    pipeline: {
        stage: AnalysisPipelineStage;
        status: AnalysisPipelineStatus;
        preanalysisStatus: AnalysisGenerationStatus;
        snapshotStatus: AnalysisGenerationStatus;
        fullReportStatus: AnalysisGenerationStatus;
        lastErrorCode?: string | null;
        lastErrorMessage?: string | null;
    };
    free: {
        snapshot: SnapshotResultV2 | null;
    };
    paid: {
        unlocked: boolean;
        plan: PlanStep[] | null;
    };
    meta: {
        modelName?: string | null;
        promptVersion?: string | null;
        schemaVersion?: string | null;
        preanalysisVersion?: string | null;
        analysisMode?: "vision" | "fallback" | null;
        fallbackUsed: boolean;
        preanalysisUsed: boolean;
        snapshotGeneratedAt?: string | null;
        fullReportGeneratedAt?: string | null;
    };
}

export interface PlanStep {
    id: number;
    title: string;
    category: ProductCategory | "layout" | "declutter" | "accessory";
    iconName: string; // string representation for lucide-react dynamic loading or mapping
    reason: string;
    action: string;
    costRange: string;
    productRecommendation?: Product;
}

export interface Product {
    id: string;
    name: string;
    category: ProductCategory;
    priceTier: PriceTier;
    price: number;
    affiliateUrl: string;
    imageUrl: string;
    styleTags: string[];
    rentalFriendly: boolean;
}

export interface DatabaseRowAnalysis {
    id: string; // UUID
    user_id?: string | null;
    email?: string;
    photo_url?: string;
    request_ip_hash?: string | null;
    registration_required?: boolean;
    registration_completed_at?: string | null;
    analysis_status?: string;
    analysis_mode?: "vision" | "fallback" | null;
    failure_reason?: string | null;
    fallback_used?: boolean;
    pipeline_stage?: AnalysisPipelineStage | null;
    pipeline_status?: AnalysisPipelineStatus | null;
    preanalysis_status?: AnalysisGenerationStatus | null;
    snapshot_status?: AnalysisGenerationStatus | null;
    full_report_status?: AnalysisGenerationStatus | null;
    attempt_count?: number;
    last_error_code?: string | null;
    last_error_message?: string | null;
    prompt_version?: string | null;
    schema_version?: string | null;
    model_name?: string | null;
    ai_model?: string | null;
    preanalysis_version?: string | null;
    preanalysis_generated_at?: string | null;
    snapshot_generated_at?: string | null;
    full_report_generated_at?: string | null;
    space_data: SpaceData;
    goal_data: GoalData;
    snapshot_result: SnapshotResultV2;
    plan_result?: PlanStep[];
    report_result?: ReportResult | null;
    paid: boolean;
    billing_provider?: BillingProvider | null;
    billing_customer_id?: string | null;
    billing_subscription_id?: string | null;
    billing_checkout_id?: string | null;
    billing_order_id?: string | null;
    billing_product_id?: string | null;
    billing_status?: BillingStatus | null;
    stripe_session_id?: string;
    completed_at?: string | null;
    paid_at?: string | null;
    created_at: string;
    updated_at: string;
}

export interface UserProfile {
    id: string;
    email: string;
    full_name?: string | null;
    avatar_url?: string | null;
    provider?: string | null;
    marketing_opt_in: boolean;
    marketing_opt_in_at?: string | null;
    preferred_language?: string | null;
    timezone?: string | null;
    country_code?: string | null;
    city?: string | null;
    signup_source?: string | null;
    signup_campaign?: string | null;
    onboarding_goal?: string | null;
    budget_preference?: string | null;
    style_preference_default?: string | null;
    profile_completed_at?: string | null;
    last_active_at?: string | null;
    first_paid_at?: string | null;
    created_at?: string;
    updated_at?: string;
}

export type WaitlistStatus =
    | "waitlisted"
    | "invited"
    | "claimed"
    | "activated"
    | "converted"
    | "inactive";

export type WaitlistPrimaryGoal = "sleep" | "focus" | "calm" | "emotional_reset";
export type WaitlistFirstRoom = "bedroom" | "workspace" | "living_room" | "not_sure";
export type WaitlistFeedbackWillingness = "yes" | "maybe" | "not_right_now";

export interface WaitlistUserRecord {
    id: string;
    email: string;
    status: WaitlistStatus;
    priority_score: number;
    source?: string | null;
    referrer?: string | null;
    landing_path?: string | null;
    utm_source?: string | null;
    utm_medium?: string | null;
    utm_campaign?: string | null;
    primary_goal?: WaitlistPrimaryGoal | null;
    first_room?: WaitlistFirstRoom | null;
    feedback_willingness?: WaitlistFeedbackWillingness | null;
    open_text_note?: string | null;
    confirmation_email_sent_at?: string | null;
    invited_at?: string | null;
    claimed_at?: string | null;
    activated_at?: string | null;
    created_at: string;
    updated_at: string;
}

export interface WaitlistEmailEventRecord {
    id: string;
    waitlist_user_id?: string | null;
    email: string;
    email_type: string;
    provider?: string | null;
    provider_message_id?: string | null;
    status: string;
    error_message?: string | null;
    sent_at?: string | null;
    opened_at?: string | null;
    clicked_at?: string | null;
    metadata?: Record<string, unknown>;
    created_at: string;
}

export interface WaitlistSubmissionPayload {
    email: string;
    primary_goal: WaitlistPrimaryGoal;
    first_room: WaitlistFirstRoom;
    feedback_willingness: WaitlistFeedbackWillingness;
    open_text_note?: string | null;
    source?: string | null;
    session_id?: string | null;
    page_path?: string | null;
    referrer?: string | null;
    landing_path?: string | null;
    utm_source?: string | null;
    utm_medium?: string | null;
    utm_campaign?: string | null;
}

export interface WaitlistAdminSummary {
    total: number;
    confirmationSent: number;
    feedbackFriendly: number;
    highPriority: number;
    byStatus: Record<string, number>;
    byGoal: Record<string, number>;
    byRoom: Record<string, number>;
    emailByStatus: Record<string, number>;
}

export interface WaitlistAdminResponse {
    users: WaitlistUserRecord[];
    summary: WaitlistAdminSummary;
}

export interface UserSessionRecord {
    id: string;
    user_id: string;
    session_id: string;
    ip_hash?: string | null;
    user_agent?: string | null;
    browser?: string | null;
    os?: string | null;
    device_type?: string | null;
    locale?: string | null;
    timezone?: string | null;
    referrer?: string | null;
    landing_path?: string | null;
    utm_source?: string | null;
    utm_medium?: string | null;
    utm_campaign?: string | null;
    login_at: string;
    last_seen_at: string;
    logout_at?: string | null;
    created_at: string;
    updated_at: string;
}

export type AnalyticsEventName =
    | "auth_started"
    | "auth_completed"
    | "auth_failed"
    | "profile_synced"
    | "account_updated"
    | "upload_started"
    | "upload_completed"
    | "upload_failed"
    | "analysis_requested"
    | "analysis_succeeded"
    | "analysis_failed"
    | "analysis_processing_completed"
    | "analysis_timing"
    | "preanalysis_started"
    | "preanalysis_completed"
    | "preanalysis_failed"
    | "hero_email_started"
    | "waitlist_modal_opened"
    | "waitlist_step_completed"
    | "waitlist_submitted"
    | "waitlist_submit_success"
    | "waitlist_submit_error"
    | "checkout_started"
    | "checkout_completed"
    | "plan_viewed";

export interface AnalyticsEventRecord {
    id: string;
    user_id?: string | null;
    session_id?: string | null;
    analysis_id?: string | null;
    event_name: AnalyticsEventName | string;
    page_path?: string | null;
    event_source?: string | null;
    properties?: Record<string, unknown>;
    created_at: string;
}

export interface AnalysisHistoryItem {
    id: string;
    created_at: string;
    paid: boolean;
    photo_url?: string | null;
    goal_data?: GoalData | null;
    snapshot_result?: SnapshotResultV2 | null;
    report_result?: ReportResult | null;
}

export interface AnalysisReportItem {
    id: string;
    created_at: string;
    paid: boolean;
    photo_url?: string | null;
    goal_data: GoalData;
    plan_result?: PlanStep[] | null;
    snapshot_result: SnapshotResultV2;
    space_data: SpaceData;
    report_result?: ReportResult | null;
}

export interface AnalysisAccessRecord {
    id: string;
    user_id: string | null;
    email: string | null;
    paid: boolean;
    snapshot_result: SnapshotResultV2;
    registration_required: boolean;
    report_result?: ReportResult | null;
}
