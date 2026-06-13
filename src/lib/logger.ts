/**
 * Unified logging utility for ALIGN.
 * MVP: outputs to console (captured by Vercel Logs).
 * Future: swap to LogTail / Sentry without changing call sites.
 */

type LogMeta = Record<string, unknown>;

function formatMeta(meta?: LogMeta): string {
    if (!meta || Object.keys(meta).length === 0) return "";
    return " " + JSON.stringify(meta);
}

export const logger = {
    info(msg: string, meta?: LogMeta) {
        console.log(`[ALIGN] ${msg}${formatMeta(meta)}`);
    },

    warn(msg: string, meta?: LogMeta) {
        console.warn(`[ALIGN] ⚠️ ${msg}${formatMeta(meta)}`);
    },

    error(msg: string, err?: unknown, meta?: LogMeta) {
        const errMsg = err instanceof Error ? err.message : String(err ?? "");
        console.error(`[ALIGN] ❌ ${msg}${errMsg ? ": " + errMsg : ""}${formatMeta(meta)}`);
    },

    /** Track an API request lifecycle */
    api(method: string, path: string, durationMs?: number, meta?: LogMeta) {
        const dur = durationMs !== undefined ? ` (${durationMs}ms)` : "";
        console.log(`[ALIGN] 🔗 ${method} ${path}${dur}${formatMeta(meta)}`);
    },
};
