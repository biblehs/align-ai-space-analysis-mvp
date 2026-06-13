const SUPPORTED_UPLOAD_IMAGE_MIME_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
    "image/heic-sequence",
    "image/heif-sequence",
]);

const SUPPORTED_UPLOAD_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"];
const MIME_TYPE_BY_EXTENSION: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".heic": "image/heic",
    ".heif": "image/heif",
};

export function isHeicMimeType(mimeType: string | null | undefined) {
    const normalizedType = mimeType?.trim().toLowerCase();

    return (
        normalizedType === "image/heic" ||
        normalizedType === "image/heif" ||
        normalizedType === "image/heic-sequence" ||
        normalizedType === "image/heif-sequence"
    );
}

export function isSupportedUploadImageType(mimeType: string | null | undefined) {
    const normalizedType = mimeType?.trim().toLowerCase();
    return normalizedType ? SUPPORTED_UPLOAD_IMAGE_MIME_TYPES.has(normalizedType) : false;
}

export function isSupportedUploadImageName(fileName: string | null | undefined) {
    const normalizedName = fileName?.trim().toLowerCase();
    return normalizedName ? SUPPORTED_UPLOAD_IMAGE_EXTENSIONS.some((extension) => normalizedName.endsWith(extension)) : false;
}

export function isSupportedUploadImageFile(file: { type?: string | null; name?: string | null }) {
    return isSupportedUploadImageType(file.type) || isSupportedUploadImageName(file.name);
}

export function getUploadMimeType(file: { type?: string | null; name?: string | null }) {
    if (isSupportedUploadImageType(file.type)) {
        return file.type!.trim().toLowerCase();
    }

    const normalizedName = file.name?.trim().toLowerCase() ?? "";
    const matchedExtension = Object.keys(MIME_TYPE_BY_EXTENSION).find((extension) => normalizedName.endsWith(extension));
    return matchedExtension ? MIME_TYPE_BY_EXTENSION[matchedExtension] : null;
}

export function getSupportedUploadFormatsLabel() {
    return "JPG, PNG, WebP, or HEIC";
}
