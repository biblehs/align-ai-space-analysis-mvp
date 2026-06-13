import type {
    AnalysisGenerationStatus,
    AnalysisPipelineStage,
    AnalysisPipelineStatus,
    ReportResult,
    BillingProvider,
    BillingStatus,
    GoalData,
    PlanStep,
    SpaceData,
    UserProfile,
} from "@/types";
import type { SnapshotResultV2 } from "@/lib/align-v2/contracts";

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export interface Database {
    public: {
        Tables: {
            analyses: {
                Row: {
                    id: string;
                    user_id: string | null;
                    email: string | null;
                    photo_url: string | null;
                    request_ip_hash: string | null;
                    registration_required: boolean;
                    registration_completed_at: string | null;
                    analysis_status: string;
                    analysis_mode: "vision" | "fallback" | null;
                    failure_reason: string | null;
                    fallback_used: boolean;
                    pipeline_stage: AnalysisPipelineStage;
                    pipeline_status: AnalysisPipelineStatus;
                    preanalysis_status: AnalysisGenerationStatus;
                    snapshot_status: AnalysisGenerationStatus;
                    full_report_status: AnalysisGenerationStatus;
                    attempt_count: number;
                    last_error_code: string | null;
                    last_error_message: string | null;
                    prompt_version: string | null;
                    schema_version: string | null;
                    model_name: string | null;
                    preanalysis_version: string | null;
                    preanalysis_generated_at: string | null;
                    snapshot_generated_at: string | null;
                    full_report_generated_at: string | null;
                    space_data: SpaceData;
                    goal_data: GoalData;
                    snapshot_result: SnapshotResultV2;
                    plan_result: PlanStep[] | null;
                    report_result: ReportResult | null;
                    paid: boolean;
                    billing_provider: BillingProvider | null;
                    billing_customer_id: string | null;
                    billing_subscription_id: string | null;
                    billing_checkout_id: string | null;
                    billing_order_id: string | null;
                    billing_product_id: string | null;
                    billing_status: BillingStatus | null;
                    stripe_session_id: string | null;
                    ai_model: string | null;
                    completed_at: string | null;
                    paid_at: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id: string;
                    user_id?: string | null;
                    email?: string | null;
                    photo_url?: string | null;
                    request_ip_hash?: string | null;
                    registration_required?: boolean;
                    registration_completed_at?: string | null;
                    analysis_status?: string;
                    analysis_mode?: "vision" | "fallback" | null;
                    failure_reason?: string | null;
                    fallback_used?: boolean;
                    pipeline_stage?: AnalysisPipelineStage;
                    pipeline_status?: AnalysisPipelineStatus;
                    preanalysis_status?: AnalysisGenerationStatus;
                    snapshot_status?: AnalysisGenerationStatus;
                    full_report_status?: AnalysisGenerationStatus;
                    attempt_count?: number;
                    last_error_code?: string | null;
                    last_error_message?: string | null;
                    prompt_version?: string | null;
                    schema_version?: string | null;
                    model_name?: string | null;
                    preanalysis_version?: string | null;
                    preanalysis_generated_at?: string | null;
                    snapshot_generated_at?: string | null;
                    full_report_generated_at?: string | null;
                    space_data: SpaceData;
                    goal_data: GoalData;
                    snapshot_result: SnapshotResultV2;
                    plan_result?: PlanStep[] | null;
                    report_result?: ReportResult | null;
                    paid?: boolean;
                    billing_provider?: BillingProvider | null;
                    billing_customer_id?: string | null;
                    billing_subscription_id?: string | null;
                    billing_checkout_id?: string | null;
                    billing_order_id?: string | null;
                    billing_product_id?: string | null;
                    billing_status?: BillingStatus | null;
                    stripe_session_id?: string | null;
                    ai_model?: string | null;
                    completed_at?: string | null;
                    paid_at?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: Partial<Database["public"]["Tables"]["analyses"]["Insert"]>;
                Relationships: [];
            };
            profiles: {
                Row: Required<Pick<UserProfile, "id" | "email" | "marketing_opt_in">> & {
                    full_name: string | null;
                    avatar_url: string | null;
                    provider: string | null;
                    marketing_opt_in_at: string | null;
                    preferred_language: string | null;
                    timezone: string | null;
                    country_code: string | null;
                    city: string | null;
                    signup_source: string | null;
                    signup_campaign: string | null;
                    onboarding_goal: string | null;
                    budget_preference: string | null;
                    style_preference_default: string | null;
                    profile_completed_at: string | null;
                    last_active_at: string | null;
                    first_paid_at: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id: string;
                    email: string;
                    full_name?: string | null;
                    avatar_url?: string | null;
                    provider?: string | null;
                    marketing_opt_in?: boolean;
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
                };
                Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
                Relationships: [];
            };
            checkins: {
                Row: {
                    id: string;
                    analysis_id: string;
                    user_id: string | null;
                    steps_completed: number | null;
                    satisfaction_score: number | null;
                    feedback: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    analysis_id: string;
                    user_id?: string | null;
                    steps_completed?: number | null;
                    satisfaction_score?: number | null;
                    feedback?: string | null;
                    created_at?: string;
                };
                Update: Partial<Database["public"]["Tables"]["checkins"]["Insert"]>;
                Relationships: [];
            };
            anonymous_upload_limits: {
                Row: {
                    ip_hash: string;
                    upload_count: number;
                    first_upload_at: string;
                    last_upload_at: string;
                    last_analysis_id: string | null;
                    last_user_agent: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    ip_hash: string;
                    upload_count?: number;
                    first_upload_at?: string;
                    last_upload_at?: string;
                    last_analysis_id?: string | null;
                    last_user_agent?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: Partial<Database["public"]["Tables"]["anonymous_upload_limits"]["Insert"]>;
                Relationships: [];
            };
            upload_rate_limits: {
                Row: {
                    scope: string;
                    scope_key: string;
                    window_started_at: string;
                    last_upload_at: string;
                    upload_count: number;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    scope: string;
                    scope_key: string;
                    window_started_at?: string;
                    last_upload_at?: string;
                    upload_count?: number;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: Partial<Database["public"]["Tables"]["upload_rate_limits"]["Insert"]>;
                Relationships: [];
            };
            analysis_jobs: {
                Row: {
                    analysis_id: string;
                    user_id: string | null;
                    ip_hash: string | null;
                    status: string;
                    job_type: string;
                    stage: string;
                    attempt_count: number;
                    max_attempts: number;
                    started_at: string;
                    last_error: string | null;
                    next_retry_at: string | null;
                    created_at: string;
                    updated_at: string;
                    completed_at: string | null;
                };
                Insert: {
                    analysis_id: string;
                    user_id?: string | null;
                    ip_hash?: string | null;
                    status?: string;
                    job_type?: string;
                    stage?: string;
                    attempt_count?: number;
                    max_attempts?: number;
                    started_at?: string;
                    last_error?: string | null;
                    next_retry_at?: string | null;
                    created_at?: string;
                    updated_at?: string;
                    completed_at?: string | null;
                };
                Update: Partial<Database["public"]["Tables"]["analysis_jobs"]["Insert"]>;
                Relationships: [];
            };
            analysis_artifacts: {
                Row: {
                    id: string;
                    analysis_id: string;
                    artifact_type: string;
                    artifact_version: string | null;
                    storage_path: string | null;
                    payload: Json | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    analysis_id: string;
                    artifact_type: string;
                    artifact_version?: string | null;
                    storage_path?: string | null;
                    payload?: Json | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: Partial<Database["public"]["Tables"]["analysis_artifacts"]["Insert"]>;
                Relationships: [];
            };
            security_events: {
                Row: {
                    id: string;
                    event_type: string;
                    severity: string;
                    ip_hash: string | null;
                    analysis_id: string | null;
                    request_path: string | null;
                    user_agent: string | null;
                    detail: Json;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    event_type: string;
                    severity?: string;
                    ip_hash?: string | null;
                    analysis_id?: string | null;
                    request_path?: string | null;
                    user_agent?: string | null;
                    detail?: Json;
                    created_at?: string;
                };
                Update: Partial<Database["public"]["Tables"]["security_events"]["Insert"]>;
                Relationships: [];
            };
            user_sessions: {
                Row: {
                    id: string;
                    user_id: string;
                    session_id: string;
                    ip_hash: string | null;
                    user_agent: string | null;
                    browser: string | null;
                    os: string | null;
                    device_type: string | null;
                    locale: string | null;
                    timezone: string | null;
                    referrer: string | null;
                    landing_path: string | null;
                    utm_source: string | null;
                    utm_medium: string | null;
                    utm_campaign: string | null;
                    login_at: string;
                    last_seen_at: string;
                    logout_at: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
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
                    login_at?: string;
                    last_seen_at?: string;
                    logout_at?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: Partial<Database["public"]["Tables"]["user_sessions"]["Insert"]>;
                Relationships: [];
            };
            analytics_events: {
                Row: {
                    id: string;
                    user_id: string | null;
                    session_id: string | null;
                    analysis_id: string | null;
                    event_name: string;
                    page_path: string | null;
                    event_source: string | null;
                    properties: Json;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id?: string | null;
                    session_id?: string | null;
                    analysis_id?: string | null;
                    event_name: string;
                    page_path?: string | null;
                    event_source?: string | null;
                    properties?: Json;
                    created_at?: string;
                };
                Update: Partial<Database["public"]["Tables"]["analytics_events"]["Insert"]>;
                Relationships: [];
            };
            waitlist_users: {
                Row: {
                    id: string;
                    email: string;
                    status: string;
                    priority_score: number;
                    source: string | null;
                    referrer: string | null;
                    landing_path: string | null;
                    utm_source: string | null;
                    utm_medium: string | null;
                    utm_campaign: string | null;
                    primary_goal: string | null;
                    first_room: string | null;
                    feedback_willingness: string | null;
                    open_text_note: string | null;
                    confirmation_email_sent_at: string | null;
                    invited_at: string | null;
                    claimed_at: string | null;
                    activated_at: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    email: string;
                    status?: string;
                    priority_score?: number;
                    source?: string | null;
                    referrer?: string | null;
                    landing_path?: string | null;
                    utm_source?: string | null;
                    utm_medium?: string | null;
                    utm_campaign?: string | null;
                    primary_goal?: string | null;
                    first_room?: string | null;
                    feedback_willingness?: string | null;
                    open_text_note?: string | null;
                    confirmation_email_sent_at?: string | null;
                    invited_at?: string | null;
                    claimed_at?: string | null;
                    activated_at?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: Partial<Database["public"]["Tables"]["waitlist_users"]["Insert"]>;
                Relationships: [];
            };
            email_events: {
                Row: {
                    id: string;
                    waitlist_user_id: string | null;
                    email: string;
                    email_type: string;
                    provider: string | null;
                    provider_message_id: string | null;
                    status: string;
                    error_message: string | null;
                    sent_at: string | null;
                    opened_at: string | null;
                    clicked_at: string | null;
                    metadata: Json;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    waitlist_user_id?: string | null;
                    email: string;
                    email_type: string;
                    provider?: string | null;
                    provider_message_id?: string | null;
                    status?: string;
                    error_message?: string | null;
                    sent_at?: string | null;
                    opened_at?: string | null;
                    clicked_at?: string | null;
                    metadata?: Json;
                    created_at?: string;
                };
                Update: Partial<Database["public"]["Tables"]["email_events"]["Insert"]>;
                Relationships: [];
            };
        };
        Views: Record<string, never>;
        Functions: Record<string, never>;
        Enums: Record<string, never>;
        CompositeTypes: Record<string, never>;
    };
}
