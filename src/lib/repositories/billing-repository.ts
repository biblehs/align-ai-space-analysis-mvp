import { supabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase";
import type {
    BillingProvider,
    BillingStatus,
    DatabaseRowAnalysis,
    PlanStep,
} from "@/types";

export type AnalysisBillingState = Pick<
    DatabaseRowAnalysis,
    "id" | "paid" | "email" | "billing_status"
>;

export type AnalysisBillingFulfillmentRecord = Pick<
    DatabaseRowAnalysis,
    | "id"
    | "paid"
    | "plan_result"
    | "space_data"
    | "goal_data"
    | "snapshot_result"
    | "photo_url"
    | "billing_status"
    | "report_result"
    | "full_report_status"
>;

export async function getAnalysisBillingState(analysisId: string): Promise<AnalysisBillingState | null> {
    if (!isSupabaseAdminConfigured) {
        return null;
    }

    const { data, error } = await supabaseAdmin
        .from("analyses")
        .select("id, paid, email, billing_status")
        .eq("id", analysisId)
        .single<AnalysisBillingState>();

    if (error || !data) {
        return null;
    }

    return data;
}

export async function saveAnalysisBillingCheckout(
    analysisId: string,
    payload: {
        provider: BillingProvider;
        checkoutId: string;
        productId: string;
    },
) {
    if (!isSupabaseAdminConfigured) {
        return false;
    }

    const { error } = await supabaseAdmin
        .from("analyses")
        .update({
            billing_provider: payload.provider,
            billing_checkout_id: payload.checkoutId,
            billing_product_id: payload.productId,
            billing_status: "checkout_pending",
            // Keep the historical Stripe-named field in sync until it is safe to retire.
            stripe_session_id: payload.checkoutId,
        })
        .eq("id", analysisId);

    return !error;
}

export async function getAnalysisForBillingFulfillment(
    analysisId: string,
): Promise<AnalysisBillingFulfillmentRecord | null> {
    if (!isSupabaseAdminConfigured) {
        return null;
    }

    const { data, error } = await supabaseAdmin
        .from("analyses")
        .select("id, paid, plan_result, space_data, goal_data, snapshot_result, photo_url, billing_status, report_result, full_report_status")
        .eq("id", analysisId)
        .single<AnalysisBillingFulfillmentRecord>();

    if (error || !data) {
        return null;
    }

    return data;
}

export async function markAnalysisBillingPaid(
    analysisId: string,
    payload: {
        email?: string | null;
        planResult: PlanStep[];
        billing: {
            provider: BillingProvider;
            customerId?: string | null;
            subscriptionId?: string | null;
            checkoutId?: string | null;
            orderId?: string | null;
            productId?: string | null;
            status: BillingStatus;
        };
        reportResult?: DatabaseRowAnalysis["report_result"];
    },
) {
    if (!isSupabaseAdminConfigured) {
        return false;
    }

    const { error } = await supabaseAdmin
        .from("analyses")
        .update({
            paid: true,
            email: payload.email ?? null,
            plan_result: payload.planResult,
            billing_provider: payload.billing.provider,
            billing_customer_id: payload.billing.customerId ?? null,
            billing_subscription_id: payload.billing.subscriptionId ?? null,
            billing_checkout_id: payload.billing.checkoutId ?? null,
            billing_order_id: payload.billing.orderId ?? null,
            billing_product_id: payload.billing.productId ?? null,
            billing_status: payload.billing.status,
            full_report_status: "completed",
            full_report_generated_at: new Date().toISOString(),
            report_result: payload.reportResult ?? null,
            paid_at: new Date().toISOString(),
        })
        .eq("id", analysisId);

    return !error;
}

export async function getLatestBillingCustomerIdForUser(userId: string) {
    if (!isSupabaseAdminConfigured) {
        return null;
    }

    const { data, error } = await supabaseAdmin
        .from("analyses")
        .select("billing_customer_id")
        .eq("user_id", userId)
        .not("billing_customer_id", "is", null)
        .order("paid_at", { ascending: false })
        .limit(1)
        .maybeSingle<{ billing_customer_id: string | null }>();

    if (error || !data?.billing_customer_id) {
        return null;
    }

    return data.billing_customer_id;
}
