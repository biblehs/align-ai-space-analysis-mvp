import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { ANALYSIS_MODEL_NAME, ANALYSIS_PROMPT_VERSION, ANALYSIS_SCHEMA_VERSION } from "@/lib/analysis-pipeline";
import { buildNormalizedAnalysisInput, buildScoreResult, buildSnapshotFromArtifactsV2 } from "@/lib/analysis-artifacts";
import { buildPatternDiagnosis, buildVisionValidationV2, buildNoteInterpretationV2 } from "@/lib/align-v2/builders";
import { buildSnapshotV2ViewModel } from "@/features/analysis/snapshot/snapshot-v2-view-model";
import { retrieveSnapshotWriterKnowledgeBundle } from "@/lib/align-knowledge/retrieval";
import { ALIGN_KNOWLEDGE_VERSION } from "@/lib/align-knowledge";
import { applySnapshotDiagnosisLayer } from "@/lib/snapshot-diagnosis";
import { applySnapshotWriterLayer } from "@/lib/snapshot-writer";
import type { GoalData, SpaceData } from "@/types";

type PreviewArgs = {
    imagePath: string;
    roomType: string;
    goal: GoalData["goal"];
    concern: string;
    note: string;
    writer: boolean;
    diagnosis: boolean;
};

function parseArgs(argv: string[]): PreviewArgs {
    const writer = argv.includes("--writer");
    const diagnosis = argv.includes("--diagnosis");
    const positional = argv.filter((value) => value !== "--writer" && value !== "--diagnosis");
    const imagePath = positional[0];
    if (!imagePath) {
        throw new Error("Usage: tsx scripts/evals/vision/preview.ts <image-path> [roomType] [goal] [concern] [note] [--writer] [--diagnosis]");
    }

    return {
        imagePath,
        roomType: positional[1] ?? "bedroom",
        goal: (positional[2] as GoalData["goal"]) ?? "sleep",
        concern: positional[3] ?? "The room does not feel comfortable enough for the selected goal.",
        note: positional[4] ?? "The room does not feel good and needs a more supportive atmosphere.",
        writer,
        diagnosis,
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
        throw new Error("GEMINI_API_KEY is missing. Add it to .env.local before running preview.");
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
        case ".heic":
            return "image/heic";
        default:
            throw new Error(`Unsupported image extension "${extension}" for ${imagePath}`);
    }
}

function toArrayBuffer(buffer: Buffer) {
    return Uint8Array.from(buffer).buffer;
}

async function main() {
    const args = parseArgs(process.argv.slice(2));
    const root = process.cwd();
    await ensureEnvLoaded(root);

    const imageAbsolutePath = path.isAbsolute(args.imagePath)
        ? args.imagePath
        : path.join(root, args.imagePath);
    const imageBuffer = await readFile(imageAbsolutePath);
    const mimeType = inferMimeType(imageAbsolutePath);

    const { generateVisionObservation } = await import("@/lib/gemini");

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

    const visionResult = await generateVisionObservation(spaceData, toArrayBuffer(imageBuffer), mimeType);
    if (!visionResult) {
        throw new Error("Vision observation returned null.");
    }

    const normalizedInput = buildNormalizedAnalysisInput(spaceData, goalData);
    const validation = buildVisionValidationV2(visionResult.data, normalizedInput.roomType);
    const noteInterpretation = buildNoteInterpretationV2(normalizedInput.note);
    const diagnosis = buildPatternDiagnosis(normalizedInput, visionResult.data, goalData);
    const score = buildScoreResult(normalizedInput, visionResult.data, spaceData, goalData);
    const baseSnapshot = buildSnapshotFromArtifactsV2(normalizedInput, visionResult.data, score, goalData);
    const knowledgeBundle = retrieveSnapshotWriterKnowledgeBundle(
        normalizedInput,
        visionResult.data,
        score,
        baseSnapshot,
    );
    const diagnosisLayer = await applySnapshotDiagnosisLayer({
        normalizedInput,
        visionObservation: visionResult.data,
        scoreResult: score,
        snapshot: baseSnapshot,
        force: args.diagnosis,
    });
    const writerLayer = diagnosisLayer.diagnosisUsed
        ? {
            snapshot: diagnosisLayer.snapshot,
            writerUsed: false,
            modelName: null,
            promptVersion: null,
            schemaVersion: null,
        }
        : await applySnapshotWriterLayer({
        normalizedInput,
        visionObservation: visionResult.data,
        scoreResult: score,
        snapshot: baseSnapshot,
        force: args.writer,
    });
    const snapshot = writerLayer.snapshot;
    const viewModel = buildSnapshotV2ViewModel(snapshot);

    console.log(JSON.stringify({
        meta: {
            model: ANALYSIS_MODEL_NAME,
            promptVersion: ANALYSIS_PROMPT_VERSION,
            schemaVersion: ANALYSIS_SCHEMA_VERSION,
            usage: visionResult.usage,
            diagnosisUsed: diagnosisLayer.diagnosisUsed,
            diagnosisModel: diagnosisLayer.modelName,
            diagnosisPromptVersion: diagnosisLayer.promptVersion,
            diagnosisSchemaVersion: diagnosisLayer.schemaVersion,
            writerUsed: writerLayer.writerUsed,
            writerModel: writerLayer.modelName,
            writerPromptVersion: writerLayer.promptVersion,
            writerSchemaVersion: writerLayer.schemaVersion,
            knowledgeVersion: ALIGN_KNOWLEDGE_VERSION,
        },
        input: {
            roomType: args.roomType,
            goal: args.goal,
            concern: args.concern,
            note: args.note,
        },
        vision: visionResult.data,
        validation,
        noteInterpretation,
        diagnosis,
        score,
        knowledgeHits: knowledgeBundle.hits,
        snapshot,
        viewModel,
    }, null, 2));
}

main().catch((error) => {
    console.error(error instanceof Error ? error.stack ?? error.message : error);
    process.exitCode = 1;
});
