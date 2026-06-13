import { after, NextRequest, NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth-server";
import { startPreanalysisPipeline } from "@/lib/analysis-pipeline-service";
import { logger } from "@/lib/logger";
import { runInBackground } from "@/lib/background";
import { recordAnalysisArtifact, updateAnalysisProgress } from "@/lib/repositories/analysis-repository";
import {
    getAnonymousUploadUsage,
    getUploadRateLimit,
    incrementAnonymousUploadUsage,
    incrementUploadRateLimit,
    recordSecurityEvent,
} from "@/lib/repositories/security-repository";
import {
    assertAnonymousHumanVerification,
    getClientIp,
    getHumanVerificationConfig,
    hashIpAddress,
    MAX_AUTHENTICATED_UPLOADS_PER_DAY,
    MAX_FREE_ANONYMOUS_UPLOADS_PER_IP,
    MAX_UPLOAD_ATTEMPTS_PER_IP_WINDOW,
    MAX_UPLOAD_ATTEMPTS_PER_SESSION_WINDOW,
    SHORT_IP_UPLOAD_WINDOW_MS,
    SHORT_SESSION_UPLOAD_WINDOW_MS,
    shouldRequireAnonymousTurnstile,
    sendSecurityAlert,
} from "@/lib/security";
import { uploadRoomPhoto } from "@/lib/services/room-photo-service";
import { createAnalyticsEvent } from "@/lib/repositories/analytics-repository";
import { getSupportedUploadFormatsLabel, getUploadMimeType, isSupportedUploadImageFile } from "@/lib/upload-image";
import type { SpaceData } from "@/types";

function parsePositiveInteger(value: FormDataEntryValue | null) {
    if (typeof value !== "string") {
        return null;
    }

    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function getScopedUsageCount(input: {
    windowStartedAt?: string;
    uploadCount?: number;
    now: Date;
    windowMs?: number;
}) {
    if (!input.windowStartedAt || typeof input.uploadCount !== "number") {
        return 0;
    }

    if (!input.windowMs) {
        return input.uploadCount;
    }

    const windowStartedAt = new Date(input.windowStartedAt);
    return input.now.getTime() - windowStartedAt.getTime() < input.windowMs ? input.uploadCount : 0;
}

function getDailyUsageCount(input: { windowStartedAt?: string; uploadCount?: number; now: Date }) {
    if (!input.windowStartedAt || typeof input.uploadCount !== "number") {
        return 0;
    }

    return input.windowStartedAt.slice(0, 10) === input.now.toISOString().slice(0, 10) ? input.uploadCount : 0;
}

export async function POST(req: NextRequest) {
    try {
        const requestUser = await getRequestUser(req);
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const analysisId = typeof formData.get("analysisId") === "string" ? String(formData.get("analysisId")) : null;
        const compressionStatus =
            typeof formData.get("compressionStatus") === "string" ? String(formData.get("compressionStatus")) : null;
        const turnstileToken =
            typeof formData.get("turnstileToken") === "string" ? String(formData.get("turnstileToken")) : null;
        const honeypot = typeof formData.get("website") === "string" ? String(formData.get("website")) : null;
        const startedAt = typeof formData.get("startedAt") === "string" ? String(formData.get("startedAt")) : null;
        const uploadSessionId =
            typeof formData.get("uploadSessionId") === "string" ? String(formData.get("uploadSessionId")) : null;
        const parsedSpaceData = typeof formData.get("spaceData") === "string" ? String(formData.get("spaceData")) : null;
        const originalFileSize = parsePositiveInteger(formData.get("originalFileSize"));
        const compressedFileSize = parsePositiveInteger(formData.get("compressedFileSize"));
        const originalWidth = parsePositiveInteger(formData.get("originalWidth"));
        const originalHeight = parsePositiveInteger(formData.get("originalHeight"));
        const compressedWidth = parsePositiveInteger(formData.get("compressedWidth"));
        const compressedHeight = parsePositiveInteger(formData.get("compressedHeight"));
        const now = new Date();
        const startedAtMs = Number(startedAt);
        const ipHash = hashIpAddress(getClientIp(req));
        const normalizedFileType = getUploadMimeType(file);
        let userAgent: string | null = req.headers.get("user-agent");
        const sessionId = uploadSessionId;
        const humanVerificationConfig = getHumanVerificationConfig();
        let recentIpUploads = 0;
        let recentSessionUploads = 0;
        let spaceData: SpaceData | null = null;

        if (parsedSpaceData) {
            try {
                spaceData = JSON.parse(parsedSpaceData) as SpaceData;
            } catch {
                spaceData = null;
            }
        }

        const recordUploadEvent = (eventName: "upload_started" | "upload_completed" | "upload_failed", properties?: Record<string, unknown>) => {
            runInBackground(createAnalyticsEvent({
                eventName,
                userId: requestUser?.id ?? null,
                sessionId,
                analysisId,
                pagePath: req.nextUrl.pathname,
                eventSource: "upload-route",
                properties: {
                    compressionStatus,
                    originalFileSize,
                    compressedFileSize,
                    originalWidth,
                    originalHeight,
                    compressedWidth,
                    compressedHeight,
                    ...(properties ?? {}),
                },
            }), `upload:${eventName}`);
        };

        if (!file) {
            recordUploadEvent("upload_failed", { reason: "missing_file" });
            return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            recordUploadEvent("upload_failed", { reason: "file_too_large", fileSize: file.size });
            return NextResponse.json({ success: false, error: "File too large (max 10MB)" }, { status: 400 });
        }

        if (!isSupportedUploadImageFile(file)) {
            recordUploadEvent("upload_failed", { reason: "invalid_file_type", fileType: file.type });
            return NextResponse.json(
                { success: false, error: `Please upload a ${getSupportedUploadFormatsLabel()} image.` },
                { status: 400 },
            );
        }

        if (!uploadSessionId) {
            recordUploadEvent("upload_failed", { reason: "missing_upload_session" });
            return NextResponse.json({ success: false, error: "Upload session missing. Please refresh and try again." }, { status: 400 });
        }

        if (!analysisId) {
            recordUploadEvent("upload_failed", { reason: "missing_analysis_id" });
            return NextResponse.json({ success: false, error: "Analysis session missing. Please refresh and try again." }, { status: 400 });
        }

        if (!spaceData) {
            recordUploadEvent("upload_failed", { reason: "missing_space_data" });
            return NextResponse.json({ success: false, error: "Room details are missing. Please refresh and try again." }, { status: 400 });
        }

        if (compressionStatus !== "compressed" && compressionStatus !== "server_fallback") {
            recordUploadEvent("upload_failed", { reason: "missing_compression" });
            return NextResponse.json(
                { success: false, error: "This photo must be optimized before upload." },
                { status: 400 }
            );
        }

        if (compressionStatus === "compressed" && normalizedFileType !== "image/jpeg") {
            recordUploadEvent("upload_failed", { reason: "unexpected_mime_type", fileType: normalizedFileType || file.type });
            return NextResponse.json(
                { success: false, error: "Compressed uploads must be sent as JPEG." },
                { status: 400 }
            );
        }

        recordUploadEvent("upload_started", {
            fileType: normalizedFileType || file.type,
            fileSize: file.size,
            isAuthenticated: Boolean(requestUser?.id),
        });

        if (ipHash) {
            const ipUsage = await getUploadRateLimit("ip_short", ipHash);
            recentIpUploads = getScopedUsageCount({
                windowStartedAt: ipUsage?.window_started_at,
                uploadCount: ipUsage?.upload_count,
                now,
                windowMs: SHORT_IP_UPLOAD_WINDOW_MS,
            });
            if (recentIpUploads >= MAX_UPLOAD_ATTEMPTS_PER_IP_WINDOW) {
                recordUploadEvent("upload_failed", { reason: "ip_rate_limit" });
                return NextResponse.json(
                    { success: false, error: "Too many upload attempts from this network. Please wait a few minutes and try again." },
                    { status: 429 }
                );
            }
        }

        if (uploadSessionId) {
            const sessionUsage = await getUploadRateLimit("session_short", uploadSessionId);
            recentSessionUploads = getScopedUsageCount({
                windowStartedAt: sessionUsage?.window_started_at,
                uploadCount: sessionUsage?.upload_count,
                now,
                windowMs: SHORT_SESSION_UPLOAD_WINDOW_MS,
            });
            if (recentSessionUploads >= MAX_UPLOAD_ATTEMPTS_PER_SESSION_WINDOW) {
                recordUploadEvent("upload_failed", { reason: "session_rate_limit" });
                return NextResponse.json(
                    { success: false, error: "Too many upload attempts in this session. Please pause and try again shortly." },
                    { status: 429 }
                );
            }
        }

        if (requestUser?.id) {
            const dailyUsage = await getUploadRateLimit("user_daily", requestUser.id);
            const uploadsToday = getDailyUsageCount({
                windowStartedAt: dailyUsage?.window_started_at,
                uploadCount: dailyUsage?.upload_count,
                now,
            });

            if (uploadsToday >= MAX_AUTHENTICATED_UPLOADS_PER_DAY) {
                recordUploadEvent("upload_failed", { reason: "authenticated_daily_limit" });
                return NextResponse.json(
                    { success: false, error: "You have reached today’s upload limit for your account. Please try again tomorrow." },
                    { status: 429 }
                );
            }
        }

        if (!requestUser) {
            const requiresTurnstile = shouldRequireAnonymousTurnstile({
                enabled: humanVerificationConfig.enabled,
                recentIpUploads,
                recentSessionUploads,
            });

            if (requiresTurnstile && !turnstileToken) {
                recordUploadEvent("upload_failed", {
                    reason: "turnstile_required",
                    recentIpUploads,
                    recentSessionUploads,
                });
                return NextResponse.json(
                    {
                        success: false,
                        code: "TURNSTILE_REQUIRED",
                        error: "We detected unusual upload activity from this network. Please complete a quick verification to continue.",
                    },
                    { status: 403 },
                );
            }

            try {
                const verification = await assertAnonymousHumanVerification(req, {
                    analysisId,
                    honeypot,
                    requireTurnstile: requiresTurnstile,
                    startedAt,
                    turnstileToken,
                });
                userAgent = verification.userAgent;
            } catch (error) {
                const message =
                    error instanceof Error && error.message
                        ? error.message
                        : "Human verification failed. Please try again.";
                recordUploadEvent("upload_failed", { reason: "human_verification_failed", message });
                return NextResponse.json({ success: false, error: message }, { status: 403 });
            }

            if (ipHash) {
                const usage = await getAnonymousUploadUsage(ipHash);
                if ((usage?.upload_count ?? 0) >= MAX_FREE_ANONYMOUS_UPLOADS_PER_IP) {
                    runInBackground(recordSecurityEvent({
                        eventType: "anonymous_upload_limit_reached",
                        severity: "critical",
                        ipHash,
                        analysisId,
                        requestPath: req.nextUrl.pathname,
                        userAgent,
                        detail: {
                            uploadCount: usage?.upload_count ?? 0,
                            maxFreeAnonymousUploadsPerIp: MAX_FREE_ANONYMOUS_UPLOADS_PER_IP,
                        },
                    }), "security:anonymous_upload_limit_reached");
                    runInBackground(sendSecurityAlert({
                        title: "Anonymous upload limit reached",
                        severity: "critical",
                        eventType: "anonymous_upload_limit_reached",
                        ipHash,
                        analysisId,
                        detail: {
                            uploadCount: usage?.upload_count ?? 0,
                            maxFreeAnonymousUploadsPerIp: MAX_FREE_ANONYMOUS_UPLOADS_PER_IP,
                        },
                    }), "security-alert:anonymous_upload_limit_reached");

                    return NextResponse.json(
                        {
                            success: false,
                            code: "ANON_UPLOAD_LIMIT_REACHED",
                            error: "This network has already used its free upload. Please sign in and continue with a paid plan.",
                        },
                        { status: 429 }
                    );
                }
            }
        }

        if (ipHash) {
            runInBackground(incrementUploadRateLimit({
                scope: "ip_short",
                scopeKey: ipHash,
                now,
                windowMs: SHORT_IP_UPLOAD_WINDOW_MS,
            }), "rate-limit:ip_short");
        }

        if (uploadSessionId) {
            runInBackground(incrementUploadRateLimit({
                scope: "session_short",
                scopeKey: uploadSessionId,
                now,
                windowMs: SHORT_SESSION_UPLOAD_WINDOW_MS,
            }), "rate-limit:session_short");
        }

        let uploadedPhoto;
        try {
            uploadedPhoto = await uploadRoomPhoto(file, {
                skipOptimization: compressionStatus === "compressed" && normalizedFileType === "image/jpeg",
            });
        } catch (error) {
            logger.warn("Upload route storage failure", {
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size,
                compressionStatus,
                error: error instanceof Error ? error.message : String(error),
            });
            recordUploadEvent("upload_failed", {
                reason: "storage_error",
                compressionStatus,
                message: error instanceof Error ? error.message : "storage error",
            });
            return NextResponse.json(
                {
                    success: false,
                    error:
                        compressionStatus === "server_fallback"
                            ? "We could not optimize this photo on the server. Please try a JPG or PNG image, or export the HEIC photo again from your phone."
                            : "We could not optimize and store this photo. Please try again.",
                },
                { status: 500 },
            );
        }

        if (!requestUser && ipHash) {
            runInBackground(incrementAnonymousUploadUsage({
                ipHash,
                analysisId,
                userAgent,
            }), "anonymous-upload-usage");
        }

        if (requestUser?.id) {
            runInBackground(incrementUploadRateLimit({
                scope: "user_daily",
                scopeKey: requestUser.id,
                now,
            }), "rate-limit:user_daily");
        }

        recordUploadEvent("upload_completed", {
            photoPath: uploadedPhoto.path,
            fileSize: file.size,
            clientElapsedMs: Number.isFinite(startedAtMs) ? Math.max(0, Date.now() - startedAtMs) : null,
        });

        await recordAnalysisArtifact({
            analysisId,
            artifactType: "uploaded_photo",
            artifactVersion: "2026-03-31.upload.v1",
            storagePath: uploadedPhoto.path,
            payload: {
                mimeType: normalizedFileType || file.type || null,
                fileSize: file.size,
                compressionStatus,
                originalFileSize,
                compressedFileSize,
                originalWidth,
                originalHeight,
                compressedWidth,
                compressedHeight,
            },
        });

        await updateAnalysisProgress(analysisId, {
            pipelineStage: "preanalysis_queued",
            pipelineStatus: "pending",
            preanalysisStatus: "pending",
            snapshotStatus: "pending",
            fullReportStatus: "locked",
            lastErrorCode: null,
            lastErrorMessage: null,
        });

        logger.info("Upload image optimized", {
            analysisId,
            uploadedFileSize: file.size,
            originalFileSize,
            compressedFileSize,
            originalWidth,
            originalHeight,
            compressedWidth,
            compressedHeight,
            uploadReductionBytes:
                typeof originalFileSize === "number" ? Math.max(0, originalFileSize - file.size) : null,
            uploadReductionRatio:
                typeof originalFileSize === "number" && originalFileSize > 0
                    ? Number(((originalFileSize - file.size) / originalFileSize).toFixed(4))
                    : null,
            fileType: file.type,
            storagePath: uploadedPhoto.path,
        });

        after(async () => {
            await startPreanalysisPipeline({
                analysisId,
                requestPath: req.nextUrl.pathname,
                sessionId,
                spaceData: {
                    ...spaceData,
                    hasPhoto: true,
                    photoPath: uploadedPhoto.path,
                },
                userId: requestUser?.id ?? null,
            });
        });

        return NextResponse.json({
            success: true,
            data: { photoPath: uploadedPhoto.path }
        });
    } catch (error) {
        logger.error("Upload route error", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
