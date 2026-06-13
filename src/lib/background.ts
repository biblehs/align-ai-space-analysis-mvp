import { logger } from "@/lib/logger";

export function runInBackground(task: Promise<unknown>, label: string) {
    void task.catch((error) => {
        logger.warn(`Background task failed: ${label}`, {
            error: error instanceof Error ? error.message : String(error),
        });
    });
}
