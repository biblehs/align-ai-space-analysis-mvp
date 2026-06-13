"use client";

import { useState } from "react";
import type { SpaceData } from "@/types";

type UploadInput = {
    analysisId: string;
    file: File;
    spaceData: SpaceData;
    compressionStatus: "compressed" | "server_fallback";
    compressionMetrics?: {
        originalFileSize: number;
        compressedFileSize: number;
        originalWidth: number;
        originalHeight: number;
        compressedWidth: number;
        compressedHeight: number;
    } | null;
    headers?: HeadersInit;
    turnstileToken?: string | null;
    honeypot?: string;
    startedAt?: number;
    uploadSessionId?: string | null;
};

type UploadResult =
    | {
        success: true;
        photoPath: string;
    }
    | {
        success: false;
        error: string;
        code?: string;
        status: number;
    };

interface UseUploadReturn {
    upload: (input: UploadInput) => Promise<UploadResult>;
    photoPath: string | null;
    loading: boolean;
    error: string | null;
}

/**
 * Encapsulates the /api/upload interaction.
 * Returns { upload, photoPath, loading, error }.
 */
export function useUpload(): UseUploadReturn {
    const [photoPath, setPhotoPath] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function upload({
        analysisId,
        file,
        spaceData,
        compressionStatus,
        compressionMetrics,
        headers,
        turnstileToken,
        honeypot,
        startedAt,
        uploadSessionId,
    }: UploadInput): Promise<UploadResult> {
        setLoading(true);
        setError(null);
        try {
            const formData = new FormData();
            formData.append("analysisId", analysisId);
            formData.append("file", file);
            formData.append("spaceData", JSON.stringify(spaceData));
            formData.append("compressionStatus", compressionStatus);
            formData.append("website", honeypot ?? "");
            formData.append("startedAt", String(startedAt ?? Date.now()));
            if (compressionMetrics) {
                formData.append("originalFileSize", String(compressionMetrics.originalFileSize));
                formData.append("compressedFileSize", String(compressionMetrics.compressedFileSize));
                formData.append("originalWidth", String(compressionMetrics.originalWidth));
                formData.append("originalHeight", String(compressionMetrics.originalHeight));
                formData.append("compressedWidth", String(compressionMetrics.compressedWidth));
                formData.append("compressedHeight", String(compressionMetrics.compressedHeight));
            }

            if (turnstileToken) {
                formData.append("turnstileToken", turnstileToken);
            }

            if (uploadSessionId) {
                formData.append("uploadSessionId", uploadSessionId);
            }

            const res = await fetch("/api/upload", {
                method: "POST",
                headers: headers ?? {},
                body: formData,
            });
            const json = await res.json().catch(() => null);

            if (res.ok && json?.success && json?.data?.photoPath) {
                setPhotoPath(json.data.photoPath);
                return {
                    success: true,
                    photoPath: json.data.photoPath,
                };
            }

            const message = json?.error || "Upload failed";
            setError(message);
            return {
                success: false,
                error: message,
                code: json?.code,
                status: res.status,
            };
        } catch {
            setError("Network error during upload");
            return {
                success: false,
                error: "Network error during upload",
                status: 500,
            };
        } finally {
            setLoading(false);
        }
    }

    return { upload, photoPath, loading, error };
}
