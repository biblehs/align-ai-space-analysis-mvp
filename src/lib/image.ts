import {
    AI_ANALYSIS_MAX_DIMENSION,
    AI_ANALYSIS_QUALITY,
} from "@/lib/image-optimization";
import { isHeicMimeType } from "@/lib/upload-image";

/**
 * Image preprocessing utilities for ALIGN.
 * Compresses and converts uploaded room photos before sending to Gemini AI,
 * reducing token consumption and improving response speed.
 *
 * NOTE: For full `sharp` support, run `npm install sharp`.
 * If sharp is unavailable, this module gracefully falls back to passthrough.
 */

interface ProcessedImage {
    data: Buffer;
    mimeType: string;
}

type PreprocessImageOptions = {
    maxWidth?: number;
    quality?: number;
};

type SharpModule = typeof import("sharp");

async function loadSharpModule(): Promise<SharpModule | null> {
    try {
        const sharpModule = (await import("sharp")) as SharpModule & { default?: SharpModule };
        return sharpModule.default ?? sharpModule;
    } catch {
        return null;
    }
}

async function convertHeicBufferToJpeg(buffer: Buffer, quality: number) {
    const heicConvertModule = await import("heic-convert");
    const convert = (heicConvertModule.default ?? heicConvertModule) as (input: {
        buffer: Buffer;
        format: "JPEG";
        quality: number;
    }) => Promise<Buffer | Uint8Array>;

    const converted = await convert({
        buffer,
        format: "JPEG",
        quality: Math.max(0.4, Math.min(1, quality / 100)),
    });

    return Buffer.from(converted);
}

async function compressWithSharp(input: Buffer, maxWidth: number, quality: number) {
    const sharp = await loadSharpModule();
    if (!sharp) {
        throw new Error("Server image compression is unavailable.");
    }

    return await sharp(input)
        .rotate()
        .resize({ width: maxWidth, withoutEnlargement: true })
        .jpeg({ quality, mozjpeg: true })
        .toBuffer();
}

/**
 * Attempt to compress an image buffer.
 * - Resize to max 1024px width (preserves aspect ratio)
 * - Convert to JPEG quality 62
 * - Falls back to original buffer if sharp is not installed
 */
export async function preprocessImage(
    buffer: ArrayBuffer,
    mimeType: string,
    options: PreprocessImageOptions = {},
): Promise<ProcessedImage> {
    const {
        maxWidth = AI_ANALYSIS_MAX_DIMENSION,
        quality = AI_ANALYSIS_QUALITY,
    } = options;

    const inputBuffer = Buffer.from(buffer);
    const normalizedMimeType = mimeType.toLowerCase();

    try {
        const processed = await compressWithSharp(inputBuffer, maxWidth, quality);
        return { data: processed, mimeType: "image/jpeg" };
    } catch (sharpError) {
        if (!isHeicMimeType(normalizedMimeType)) {
            throw sharpError;
        }
    }

    const convertedBuffer = await convertHeicBufferToJpeg(inputBuffer, quality);

    try {
        const processed = await compressWithSharp(convertedBuffer, maxWidth, quality);
        return { data: processed, mimeType: "image/jpeg" };
    } catch {
        return { data: convertedBuffer, mimeType: "image/jpeg" };
    }
}
