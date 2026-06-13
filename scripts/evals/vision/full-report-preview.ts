import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import type { GoalData, SpaceData } from "@/types";

type PreviewArgs = {
    imagePath: string;
    roomType: string;
    goal: GoalData["goal"];
    concern: string;
    note: string;
};

function parseArgs(argv: string[]): PreviewArgs {
    const imagePath = argv[0];
    if (!imagePath) {
        throw new Error("Usage: tsx scripts/evals/vision/full-report-preview.ts <image-path> [roomType] [goal] [concern] [note]");
    }

    return {
        imagePath,
        roomType: argv[1] ?? "bedroom",
        goal: (argv[2] as GoalData["goal"]) ?? "sleep",
        concern: argv[3] ?? "The room does not feel comfortable enough for the selected goal.",
        note: argv[4] ?? "The room feels orderly but still does not fully help me rest.",
    };
}

async function loadEnvFile(filePath: string) {
    try {
        const raw = await readFile(filePath, "utf8");
        for (const line of raw.split(/\r?\n/)) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith("#")) continue;

            const separatorIndex = trimmed.indexOf("=");
            if (separatorIndex <= 0) continue;

            const key = trimmed.slice(0, separatorIndex).trim();
            if (!key || process.env[key]) continue;

            let value = trimmed.slice(separatorIndex + 1).trim();
            if (
                (value.startsWith(`"`) && value.endsWith(`"`)) ||
                (value.startsWith(`'`) && value.endsWith(`'`))
            ) {
                value = value.slice(1, -1);
            }

            process.env[key] = value;
        }
    } catch {
        // optional env file
    }
}

async function ensureEnvLoaded(root: string) {
    await loadEnvFile(path.join(root, ".env.local"));
    await loadEnvFile(path.join(root, ".env"));

    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is missing. Add it to .env.local before running full-report preview.");
    }
}

function inferMimeType(imagePath: string) {
    const extension = path.extname(imagePath).toLowerCase();
    switch (extension) {
        case ".jpg":
        case ".jpeg":
            return "image/jpeg";
        case ".png":
            return "image/png";
        case ".webp":
            return "image/webp";
        default:
            throw new Error(`Unsupported image extension "${extension}" for ${imagePath}`);
    }
}

function toArrayBuffer(buffer: Buffer) {
    return Uint8Array.from(buffer).buffer;
}

async function withRetries<T>(fn: () => Promise<T | null>, attempts = 3) {
    for (let index = 0; index < attempts; index += 1) {
        const result = await fn();
        if (result) return result;
        await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    return null;
}

async function main() {
    const args = parseArgs(process.argv.slice(2));
    const root = process.cwd();
    await ensureEnvLoaded(root);

    const [
        { default: productsData },
        {
            buildFullReportArtifact,
            buildNormalizedAnalysisInput,
            buildScoreResult,
            buildSnapshotFromArtifactsV2,
        },
        { generatePlan },
        { generateVisionObservation },
        { applyFullReportWriterLayer },
        { applySnapshotWriterLayer },
    ] = await Promise.all([
        import("@/data/products.json"),
        import("@/lib/analysis-artifacts"),
        import("@/lib/engine"),
        import("@/lib/gemini"),
        import("@/lib/full-report-writer"),
        import("@/lib/snapshot-writer"),
    ]);

    const imageAbsolutePath = path.isAbsolute(args.imagePath)
        ? args.imagePath
        : path.join(root, args.imagePath);
    const imageBuffer = await readFile(imageAbsolutePath);
    const mimeType = inferMimeType(imageAbsolutePath);

    const spaceData: SpaceData = {
        spaceType: args.roomType,
        sunlight: "medium",
        density: "balanced",
        perspectives: ["wide"],
        photoPath: imageAbsolutePath,
    };

    const goalData: GoalData = {
        goal: args.goal,
        concern: args.concern,
        style: "none",
        stress: 7,
        usage: args.goal,
        budget: "medium",
        renting: false,
        acceptPlants: true,
        acceptLighting: true,
        spaceType: args.roomType,
        selectedIssue: args.goal === "sleep" ? "hard-to-relax" : "draining",
        note: args.note,
    };

    const visionResult = await withRetries(() =>
        generateVisionObservation(spaceData, toArrayBuffer(imageBuffer), mimeType),
    );
    if (!visionResult) {
        throw new Error("Vision observation failed after retries.");
    }

    const normalizedInput = buildNormalizedAnalysisInput(spaceData, goalData);
    const score = buildScoreResult(normalizedInput, visionResult.data, spaceData, goalData);
    const baseSnapshot = buildSnapshotFromArtifactsV2(normalizedInput, visionResult.data, score, goalData);
    const snapshotWriter = await applySnapshotWriterLayer({
        normalizedInput,
        visionObservation: visionResult.data,
        scoreResult: score,
        snapshot: baseSnapshot,
        force: true,
    });
    const snapshot = snapshotWriter.snapshot;

    const plan = generatePlan(spaceData, goalData, productsData as never);
    const baseFullReport = buildFullReportArtifact({
        normalizedInput,
        visionObservation: visionResult.data,
        scoreResult: score,
        snapshot,
        plan,
    });
    const fullReportWriter = await applyFullReportWriterLayer({
        normalizedInput,
        visionObservation: visionResult.data,
        scoreResult: score,
        snapshot,
        fullReport: baseFullReport,
        force: true,
    });

    console.log(
        JSON.stringify(
            {
                meta: {
                    snapshotWriterUsed: snapshotWriter.writerUsed,
                    fullReportWriterUsed: fullReportWriter.writerUsed,
                },
                snapshot: {
                    type: snapshot.type,
                    summary: snapshot.summary,
                    reading: snapshot.reading,
                    firstShift: snapshot.firstShift,
                    stateRitual: snapshot.stateRitual,
                    brandHook: snapshot.brandHook,
                    preview: snapshot.preview,
                },
                fullReport: fullReportWriter.fullReport,
            },
            null,
            2,
        ),
    );
}

main().catch((error) => {
    console.error(error instanceof Error ? error.stack ?? error.message : error);
    process.exitCode = 1;
});
