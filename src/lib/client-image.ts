"use client";

import {
    CLIENT_UPLOAD_MAX_DIMENSION,
    CLIENT_UPLOAD_QUALITY,
} from "@/lib/image-optimization";
import {
    getSupportedUploadFormatsLabel,
    isHeicMimeType,
    isSupportedUploadImageFile,
} from "@/lib/upload-image";

type CompressImageOptions = {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    mimeType?: string;
};

export type CompressedImageResult = {
    file: File;
    originalSize: number;
    compressedSize: number;
    originalWidth: number;
    originalHeight: number;
    compressedWidth: number;
    compressedHeight: number;
    mode: "compressed";
};

export function isHeicLikeFile(file: File) {
    return isHeicMimeType(file.type) || /\.hei[cf]$/i.test(file.name);
}

async function convertHeicToJpeg(file: File) {
    const heic2any = (await import("heic2any")).default;
    const converted = await heic2any({
        blob: file,
        toType: "image/jpeg",
        quality: CLIENT_UPLOAD_QUALITY,
    });

    const convertedBlob = Array.isArray(converted) ? converted[0] : converted;
    if (!(convertedBlob instanceof Blob)) {
        throw new Error("This HEIC photo could not be converted in your browser.");
    }

    const baseName = file.name.replace(/\.(heic|heif)$/i, "") || "align-upload";
    return new File([convertedBlob], `${baseName}.jpg`, {
        type: "image/jpeg",
        lastModified: Date.now(),
    });
}

async function normalizeForCompression(file: File) {
    if (!isHeicLikeFile(file)) {
        return file;
    }

    return await convertHeicToJpeg(file);
}

async function decodeWithBitmap(file: File) {
    if (typeof createImageBitmap !== "function") {
        return null;
    }

    try {
        return await createImageBitmap(file);
    } catch {
        return null;
    }
}

function decodeWithImageElement(file: File) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
        const objectUrl = URL.createObjectURL(file);
        const image = new Image();

        image.onload = () => {
            URL.revokeObjectURL(objectUrl);
            resolve(image);
        };
        image.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error("Unable to read the selected image."));
        };

        image.src = objectUrl;
    });
}

function calculateTargetSize(width: number, height: number, maxWidth: number, maxHeight: number) {
    const scale = Math.min(1, maxWidth / width, maxHeight / height);
    return {
        width: Math.max(1, Math.round(width * scale)),
        height: Math.max(1, Math.round(height * scale)),
    };
}

export async function compressImageFile(
    file: File,
    options: CompressImageOptions = {},
): Promise<CompressedImageResult> {
    const originalSize = file.size;
    const {
        maxWidth = CLIENT_UPLOAD_MAX_DIMENSION,
        maxHeight = CLIENT_UPLOAD_MAX_DIMENSION,
        quality = CLIENT_UPLOAD_QUALITY,
        mimeType = "image/jpeg",
    } = options;

    if (!file.type.startsWith("image/")) {
        throw new Error(`Please choose a ${getSupportedUploadFormatsLabel()} image.`);
    }

    if (!isSupportedUploadImageFile(file)) {
        throw new Error(`Please choose a ${getSupportedUploadFormatsLabel()} image.`);
    }

    const normalizedFile = await normalizeForCompression(file);
    const bitmap = await decodeWithBitmap(normalizedFile);
    let width = 0;
    let height = 0;
    let source: CanvasImageSource;

    if (bitmap) {
        width = bitmap.width;
        height = bitmap.height;
        source = bitmap;
    } else {
        let image: HTMLImageElement;
        try {
            image = await decodeWithImageElement(normalizedFile);
        } catch {
            throw new Error(
                `This photo format cannot be compressed in your current browser. Please choose a ${getSupportedUploadFormatsLabel()} image.`,
            );
        }

        width = image.naturalWidth;
        height = image.naturalHeight;
        source = image;
    }

    if (!width || !height) {
        throw new Error("This photo could not be prepared for AI analysis in your browser.");
    }

    const targetSize = calculateTargetSize(width, height, maxWidth, maxHeight);
    const canvas = document.createElement("canvas");
    canvas.width = targetSize.width;
    canvas.height = targetSize.height;

    const context = canvas.getContext("2d");
    if (!context) {
        throw new Error("Your browser could not prepare this image for compression.");
    }

    context.drawImage(source, 0, 0, targetSize.width, targetSize.height);

    const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, mimeType, quality);
    });

    if (!blob) {
        throw new Error("Your browser could not compress this photo.");
    }

    const baseName = normalizedFile.name.replace(/\.[a-z0-9]+$/i, "") || "align-upload";
    const compressedFile = new File([blob], `${baseName}.jpg`, {
        type: mimeType,
        lastModified: Date.now(),
    });

    if (bitmap && "close" in bitmap && typeof bitmap.close === "function") {
        bitmap.close();
    }

    return {
        file: compressedFile,
        originalSize,
        compressedSize: compressedFile.size,
        originalWidth: width,
        originalHeight: height,
        compressedWidth: targetSize.width,
        compressedHeight: targetSize.height,
        mode: "compressed",
    };
}
