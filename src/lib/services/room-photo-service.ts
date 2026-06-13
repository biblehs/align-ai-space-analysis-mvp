import { v4 as uuidv4 } from "uuid";
import { preprocessImage } from "@/lib/image";
import {
    SERVER_STORAGE_MAX_DIMENSION,
    SERVER_STORAGE_QUALITY,
} from "@/lib/image-optimization";
import { isSupabaseAdminConfigured, supabaseAdmin } from "@/lib/supabase";
import { getUploadMimeType } from "@/lib/upload-image";
import type { RoomPreAnalysis } from "@/types";

export type UploadedRoomPhoto = {
    path: string;
};

function getRoomPreAnalysisArtifactPath(analysisId: string) {
    return `derived/${analysisId}/room-preanalysis.json`;
}

function hasJpegSignature(bytes: ArrayBuffer) {
    const header = new Uint8Array(bytes, 0, Math.min(bytes.byteLength, 3));
    return header.length === 3 && header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
}

export async function uploadRoomPhoto(
    file: File,
    options?: {
        skipOptimization?: boolean;
    },
): Promise<UploadedRoomPhoto> {
    if (!isSupabaseAdminConfigured) {
        throw new Error("Image storage is not configured.");
    }

    const bytes = await file.arrayBuffer();
    const sourceMimeType = getUploadMimeType(file) || file.type || "image/jpeg";
    if (options?.skipOptimization && sourceMimeType.toLowerCase() === "image/jpeg" && !hasJpegSignature(bytes)) {
        throw new Error("Uploaded JPEG content is invalid.");
    }
    const shouldSkipOptimization = Boolean(
        options?.skipOptimization &&
        sourceMimeType.toLowerCase() === "image/jpeg",
    );
    const { data: buffer, mimeType } = shouldSkipOptimization
        ? { data: Buffer.from(bytes), mimeType: "image/jpeg" }
        : await preprocessImage(bytes, sourceMimeType, {
            maxWidth: SERVER_STORAGE_MAX_DIMENSION,
            quality: SERVER_STORAGE_QUALITY,
        });
    const fileName = `${uuidv4()}.jpg`;
    const storagePath = `uploads/${fileName}`;

    const { error } = await supabaseAdmin.storage.from("room-photos").upload(storagePath, buffer, {
        contentType: mimeType,
        upsert: false,
    });

    if (error) {
        throw new Error(error.message || "Unable to store the optimized image.");
    }

    return { path: storagePath };
}

export async function downloadRoomPhoto(storagePath: string) {
    if (!isSupabaseAdminConfigured) {
        return null;
    }

    const { data, error } = await supabaseAdmin.storage.from("room-photos").download(storagePath);
    if (error || !data) {
        return null;
    }

    return {
        buffer: await data.arrayBuffer(),
        mimeType: data.type || "image/jpeg",
    };
}

export async function deleteRoomPhoto(storagePath: string) {
    if (!isSupabaseAdminConfigured) {
        return false;
    }

    const { error } = await supabaseAdmin.storage.from("room-photos").remove([storagePath]);
    return !error;
}

export async function saveRoomPreAnalysisArtifact(analysisId: string, preAnalysis: RoomPreAnalysis) {
    if (!isSupabaseAdminConfigured) {
        return false;
    }

    const path = getRoomPreAnalysisArtifactPath(analysisId);
    const payload = JSON.stringify({
        analysisId,
        createdAt: new Date().toISOString(),
        preAnalysis,
    });

    const { error } = await supabaseAdmin.storage.from("room-photos").upload(path, payload, {
        contentType: "application/json",
        upsert: true,
    });

    return !error;
}

export async function loadRoomPreAnalysisArtifact(analysisId: string): Promise<RoomPreAnalysis | null> {
    if (!isSupabaseAdminConfigured) {
        return null;
    }

    const { data, error } = await supabaseAdmin.storage
        .from("room-photos")
        .download(getRoomPreAnalysisArtifactPath(analysisId));

    if (error || !data) {
        return null;
    }

    try {
        const json = JSON.parse(await data.text()) as {
            preAnalysis?: RoomPreAnalysis;
        };
        return json.preAnalysis ?? null;
    } catch {
        return null;
    }
}

export async function deleteRoomPreAnalysisArtifact(analysisId: string) {
    if (!isSupabaseAdminConfigured) {
        return false;
    }

    const { error } = await supabaseAdmin.storage
        .from("room-photos")
        .remove([getRoomPreAnalysisArtifactPath(analysisId)]);

    return !error;
}
