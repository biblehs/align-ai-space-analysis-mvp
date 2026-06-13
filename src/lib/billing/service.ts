import productsData from "@/data/products.json";
import {
    ANALYSIS_PREANALYSIS_VERSION,
    ANALYSIS_PROMPT_VERSION,
    ANALYSIS_SCHEMA_VERSION,
    buildPipelineSnapshot,
    buildReportResult,
} from "@/lib/analysis-pipeline";
import { ANALYSIS_ARTIFACT_VERSIONS, buildFullReportArtifact } from "@/lib/analysis-artifacts";
import { applyFullReportWriterLayer } from "@/lib/full-report-writer";
import { generatePlan } from "@/lib/engine";
import {
    createBillingCheckoutSession,
    createBillingPortalLink,
    getPaidBillingWebhookPayment,
    retrieveBillingCheckout,
    verifyBillingWebhook,
    type BillingCheckoutSession,
    type BillingProductKey,
} from "@/lib/billing";
import { createAnalyticsEvent } from "@/lib/repositories/analytics-repository";
import {
    getAnalysisBillingState,
    getAnalysisForBillingFulfillment,
    getLatestBillingCustomerIdForUser,
    markAnalysisBillingPaid,
    saveAnalysisBillingCheckout,
} from "@/lib/repositories/billing-repository";
import { getLatestAnalysisArtifact, recordAnalysisArtifact, updateAnalysisProgress } from "@/lib/repositories/analysis-repository";
import type { NormalizedAnalysisInput, Product, ScoreResult, VisionObservation } from "@/types";
import type { Json } from "@/types/database";

async function buildFullReportPayload(input: {
    analysisId: string;
    snapshot: NonNullable<Awaited<ReturnType<typeof getAnalysisForBillingFulfillment>>>["snapshot_result"];
    plan: NonNullable<Awaited<ReturnType<typeof getAnalysisForBillingFulfillment>>>["plan_result"];
}) {
    const [normalizedInputArtifact, visionObservationArtifact, scoreResultArtifact] = await Promise.all([
        getLatestAnalysisArtifact<NormalizedAnalysisInput>(input.analysisId, "normalized_input"),
        getLatestAnalysisArtifact<VisionObservation>(input.analysisId, "vision_observation"),
        getLatestAnalysisArtifact<ScoreResult>(input.analysisId, "score_result"),
    ]);

    const baseFullReport = buildFullReportArtifact({
        normalizedInput: normalizedInputArtifact?.payload ?? null,
        visionObservation: visionObservationArtifact?.payload ?? null,
        scoreResult: scoreResultArtifact?.payload ?? null,
        snapshot: input.snapshot,
        plan: input.plan ?? [],
    });

    const writerLayer = await applyFullReportWriterLayer({
        normalizedInput: normalizedInputArtifact?.payload ?? null,
        visionObservation: visionObservationArtifact?.payload ?? null,
        scoreResult: scoreResultArtifact?.payload ?? null,
        snapshot: input.snapshot,
        fullReport: baseFullReport,
    });

    return writerLayer.fullReport;
}

type CreateAnalysisBillingCheckoutInput = {
    analysisId: string;
    userId?: string | null;
    userEmail?: string | null;
    sessionId?: string | null;
    pagePath?: string | null;
    productKey?: BillingProductKey;
    productId?: string;
    successPath?: string;
    cancelPath?: string;
};

export async function createAnalysisBillingCheckout(
    input: CreateAnalysisBillingCheckoutInput,
): Promise<BillingCheckoutSession> {
    const analysis = await getAnalysisBillingState(input.analysisId);
    if (!analysis) {
        throw new Error("Analysis not found");
    }

    if (analysis.paid) {
        throw new Error("Already paid");
    }

    const session = await createBillingCheckoutSession({
        analysisId: input.analysisId,
        productKey: input.productKey,
        productId: input.productId,
        customerEmail: input.userEmail ?? analysis.email ?? null,
        successPath: input.successPath,
        cancelPath: input.cancelPath,
    });

    const checkoutSaved = await saveAnalysisBillingCheckout(input.analysisId, {
        provider: session.provider,
        checkoutId: session.checkoutId,
        productId: session.productId,
    });

    if (!checkoutSaved) {
        throw new Error("Failed to persist billing checkout state");
    }

    await createAnalyticsEvent({
        eventName: "checkout_started",
        userId: input.userId ?? null,
        sessionId: input.sessionId ?? null,
        analysisId: input.analysisId,
        pagePath: input.pagePath ?? null,
        eventSource: "checkout-route",
        properties: {
            billingProvider: session.provider,
            billingCheckoutId: session.checkoutId,
            billingProductId: session.productId,
        },
    });

    return session;
}

export async function createUserBillingPortalLink(userId: string) {
    const customerId = await getLatestBillingCustomerIdForUser(userId);
    if (!customerId) {
        throw new Error("Billing portal will be available after the first successful Creem payment.");
    }

    return createBillingPortalLink(customerId);
}

export async function processBillingWebhookEvent(input: {
    rawBody: string;
    signatureHeader: string | null;
    pagePath?: string | null;
}) {
    const event = verifyBillingWebhook(input.rawBody, input.signatureHeader);
    const payment = getPaidBillingWebhookPayment(event);

    if (!payment) {
        return { handled: false as const, reason: "ignored" as const };
    }

    if (!payment.analysisId) {
        return { handled: false as const, reason: "missing-analysis-id" as const };
    }

    const analysis = await getAnalysisForBillingFulfillment(payment.analysisId);
    if (!analysis) {
        return { handled: false as const, reason: "analysis-not-found" as const, analysisId: payment.analysisId };
    }

    await updateAnalysisProgress(payment.analysisId, {
        pipelineStage: "full_report_processing",
        pipelineStatus: "processing",
        fullReportStatus: "processing",
    });

    const plan =
        analysis.plan_result && analysis.plan_result.length > 0
            ? analysis.plan_result
            : generatePlan(analysis.space_data, analysis.goal_data, productsData as Product[]);
    const fullReport = await buildFullReportPayload({
        analysisId: payment.analysisId,
        snapshot: analysis.snapshot_result,
        plan,
    });

    const updated = await markAnalysisBillingPaid(payment.analysisId, {
        email: payment.customerEmail,
        planResult: plan,
        reportResult: buildReportResult({
            snapshot: analysis.snapshot_result,
            plan,
            paid: true,
            pipeline: buildPipelineSnapshot({
                stage: "full_report_completed",
                status: "completed",
                preanalysisStatus: analysis.report_result?.pipeline.preanalysisStatus ?? "completed",
                snapshotStatus: "completed",
                fullReportStatus: "completed",
            }),
            meta: {
                modelName: analysis.report_result?.meta.modelName ?? null,
                promptVersion: analysis.report_result?.meta.promptVersion ?? ANALYSIS_PROMPT_VERSION,
                schemaVersion: analysis.report_result?.meta.schemaVersion ?? ANALYSIS_SCHEMA_VERSION,
                preanalysisVersion: analysis.report_result?.meta.preanalysisVersion ?? ANALYSIS_PREANALYSIS_VERSION,
                analysisMode: analysis.snapshot_result.analysisMode ?? null,
                fallbackUsed: analysis.snapshot_result.analysisMode === "fallback",
                preanalysisUsed: analysis.report_result?.meta.preanalysisUsed ?? true,
                snapshotGeneratedAt: analysis.report_result?.meta.snapshotGeneratedAt ?? null,
                fullReportGeneratedAt: new Date().toISOString(),
            },
        }),
        billing: {
            provider: payment.provider,
            customerId: payment.customerId,
            subscriptionId: payment.subscriptionId,
            checkoutId: payment.checkoutId,
            orderId: payment.orderId,
            productId: payment.productId,
            status: payment.status,
        },
    });

    if (!updated) {
        throw new Error("Failed to persist paid billing state");
    }

    await recordAnalysisArtifact({
        analysisId: payment.analysisId,
        artifactType: "full_report",
        artifactVersion: ANALYSIS_ARTIFACT_VERSIONS.fullReport,
        payload: fullReport as unknown as Json,
    });

    await updateAnalysisProgress(payment.analysisId, {
        pipelineStage: "full_report_completed",
        pipelineStatus: "completed",
        fullReportStatus: "completed",
        fullReportGeneratedAt: new Date().toISOString(),
    });

    await createAnalyticsEvent({
        eventName: "checkout_completed",
        analysisId: payment.analysisId,
        pagePath: input.pagePath ?? null,
        eventSource: "creem-webhook",
        properties: {
            email: payment.customerEmail,
            creemEventId: payment.eventId,
            creemOrderId: payment.orderId,
            billingProvider: payment.provider,
        },
    });

    return {
        handled: true as const,
        analysisId: payment.analysisId,
        provider: payment.provider,
    };
}

function readCheckoutMetadataAnalysisId(metadata: Record<string, unknown> | undefined) {
    const value = metadata?.analysisId;
    return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readCheckoutProductId(product: Awaited<ReturnType<typeof retrieveBillingCheckout>>["product"]) {
    if (typeof product === "string") {
        return product;
    }

    return product?.id || null;
}

function readCheckoutCustomer(input: Awaited<ReturnType<typeof retrieveBillingCheckout>>["customer"]) {
    if (!input || typeof input === "string") {
        return {
            customerId: typeof input === "string" ? input : null,
            customerEmail: null,
        };
    }

    return {
        customerId: input.id || null,
        customerEmail: input.email || null,
    };
}

export async function confirmBillingCheckoutPayment(input: {
    analysisId: string;
    checkoutId: string;
    pagePath?: string | null;
}) {
    const analysis = await getAnalysisForBillingFulfillment(input.analysisId);
    if (!analysis) {
        throw new Error("Analysis not found");
    }

    if (analysis.paid) {
        return {
            paid: true as const,
            source: "database" as const,
            pipeline:
                analysis.report_result?.pipeline ??
                buildPipelineSnapshot({
                    stage: analysis.full_report_status === "completed" ? "full_report_completed" : "full_report_processing",
                    status: analysis.full_report_status === "completed" ? "completed" : "processing",
                    preanalysisStatus: "completed",
                    snapshotStatus: "completed",
                    fullReportStatus: analysis.full_report_status ?? "completed",
                }),
        };
    }

    await updateAnalysisProgress(input.analysisId, {
        pipelineStage: "full_report_processing",
        pipelineStatus: "processing",
        fullReportStatus: "processing",
    });

    const checkout = await retrieveBillingCheckout(input.checkoutId);
    const checkoutAnalysisId = checkout.request_id || readCheckoutMetadataAnalysisId(checkout.metadata);

    if (checkoutAnalysisId !== input.analysisId) {
        throw new Error("Checkout does not belong to this analysis");
    }

    const isCheckoutCompleted = checkout.status === "completed";
    const isOrderPaid = checkout.order?.status === "paid";

    if (!isCheckoutCompleted || !isOrderPaid) {
        return {
            paid: false as const,
            source: "provider" as const,
            status: checkout.status || "pending",
            pipeline:
                analysis.report_result?.pipeline ??
                buildPipelineSnapshot({
                    stage: "full_report_processing",
                    status: "processing",
                    preanalysisStatus: "completed",
                    snapshotStatus: "completed",
                    fullReportStatus: "processing",
                }),
        };
    }

    const { customerId, customerEmail } = readCheckoutCustomer(checkout.customer);
    const plan =
        analysis.plan_result && analysis.plan_result.length > 0
            ? analysis.plan_result
            : generatePlan(analysis.space_data, analysis.goal_data, productsData as Product[]);
    const fullReport = await buildFullReportPayload({
        analysisId: input.analysisId,
        snapshot: analysis.snapshot_result,
        plan,
    });

    const updated = await markAnalysisBillingPaid(input.analysisId, {
        email: customerEmail,
        planResult: plan,
        reportResult: buildReportResult({
            snapshot: analysis.snapshot_result,
            plan,
            paid: true,
            pipeline: buildPipelineSnapshot({
                stage: "full_report_completed",
                status: "completed",
                preanalysisStatus: analysis.report_result?.pipeline.preanalysisStatus ?? "completed",
                snapshotStatus: "completed",
                fullReportStatus: "completed",
            }),
            meta: {
                modelName: analysis.report_result?.meta.modelName ?? null,
                promptVersion: analysis.report_result?.meta.promptVersion ?? ANALYSIS_PROMPT_VERSION,
                schemaVersion: analysis.report_result?.meta.schemaVersion ?? ANALYSIS_SCHEMA_VERSION,
                preanalysisVersion: analysis.report_result?.meta.preanalysisVersion ?? ANALYSIS_PREANALYSIS_VERSION,
                analysisMode: analysis.snapshot_result.analysisMode ?? null,
                fallbackUsed: analysis.snapshot_result.analysisMode === "fallback",
                preanalysisUsed: analysis.report_result?.meta.preanalysisUsed ?? true,
                snapshotGeneratedAt: analysis.report_result?.meta.snapshotGeneratedAt ?? null,
                fullReportGeneratedAt: new Date().toISOString(),
            },
        }),
        billing: {
            provider: "creem",
            customerId,
            subscriptionId: checkout.subscription?.id || null,
            checkoutId: checkout.id,
            orderId: checkout.order?.id || null,
            productId: readCheckoutProductId(checkout.product),
            status: "paid",
        },
    });

    if (!updated) {
        throw new Error("Failed to persist paid billing state");
    }

    await recordAnalysisArtifact({
        analysisId: input.analysisId,
        artifactType: "full_report",
        artifactVersion: ANALYSIS_ARTIFACT_VERSIONS.fullReport,
        payload: fullReport as unknown as Json,
    });

    await updateAnalysisProgress(input.analysisId, {
        pipelineStage: "full_report_completed",
        pipelineStatus: "completed",
        fullReportStatus: "completed",
        fullReportGeneratedAt: new Date().toISOString(),
    });

    await createAnalyticsEvent({
        eventName: "checkout_completed",
        analysisId: input.analysisId,
        pagePath: input.pagePath ?? null,
        eventSource: "creem-confirmation",
        properties: {
            billingProvider: "creem",
            creemCheckoutId: checkout.id,
            creemOrderId: checkout.order?.id || null,
        },
    });

    return {
        paid: true as const,
        source: "provider" as const,
        pipeline: buildPipelineSnapshot({
            stage: "full_report_completed",
            status: "completed",
            preanalysisStatus: analysis.report_result?.pipeline.preanalysisStatus ?? "completed",
            snapshotStatus: "completed",
            fullReportStatus: "completed",
        }),
    };
}
