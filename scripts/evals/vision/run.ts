import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { ANALYSIS_MODEL_NAME, ANALYSIS_PROMPT_VERSION, ANALYSIS_SCHEMA_VERSION } from "@/lib/analysis-pipeline";
import { getVisionObservationPrompt } from "@/lib/prompt";
import type { SpaceData, VisionObservation } from "@/types";
type GenerateVisionObservationRuntime = typeof import("@/lib/gemini").generateVisionObservation;

type CliOptions = {
    tag: string;
    caseId?: string;
    limit?: number;
    minScore?: number;
};

type VisionEvalCase = {
    id: string;
    imagePath: string;
    spaceData?: SpaceData;
    expectations: {
        isRoomPhoto?: boolean;
        isUsablePhoto?: boolean;
        roomTypeDetected?: string;
        roomTypeDetectedAnyOf?: string[];
        minimumObservationCount?: number;
        requiredObservationKeys?: string[];
        requiredEvidenceKeywords?: string[];
        supportZoneKeywords?: string[];
        stressZoneKeywords?: string[];
        frictionKeywords?: string[];
        standoutKeywords?: string[];
        forbiddenKeywords?: string[];
    };
    notes?: string;
};

type ScoreLine = {
    label: string;
    pointsAwarded: number;
    maxPoints: number;
    detail: string;
};

type CaseResult = {
    id: string;
    imagePath: string;
    score: number;
    passed: boolean;
    mismatches: string[];
    scoreLines: ScoreLine[];
    input: SpaceData;
    prompt: string;
    output: VisionObservation | null;
    usage: Record<string, unknown> | null;
    model: string | null;
    durationMs: number;
    error?: string;
    notes?: string;
};

const ROOT = process.cwd();
const CASES_DIR = path.join(ROOT, "evals", "vision", "cases");
const RUNS_DIR = path.join(ROOT, "evals", "vision", "runs");

let generateVisionObservationRuntime: GenerateVisionObservationRuntime | null = null;

function parseArgs(argv: string[]): CliOptions {
    const options: CliOptions = {
        tag: "local",
    };

    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];
        if (arg === "--tag") {
            options.tag = argv[index + 1] ?? options.tag;
            index += 1;
            continue;
        }
        if (arg === "--case") {
            options.caseId = argv[index + 1];
            index += 1;
            continue;
        }
        if (arg === "--limit") {
            const parsed = Number(argv[index + 1]);
            if (Number.isFinite(parsed) && parsed > 0) {
                options.limit = parsed;
            }
            index += 1;
            continue;
        }
        if (arg === "--min-score") {
            const parsed = Number(argv[index + 1]);
            if (Number.isFinite(parsed) && parsed >= 0) {
                options.minScore = parsed;
            }
            index += 1;
        }
    }

    return options;
}

function loadEnvFile(filePath: string) {
    return readFile(filePath, "utf8")
        .then((raw) => {
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
        })
        .catch(() => {
            // optional env file
        });
}

async function ensureEnvLoaded() {
    await loadEnvFile(path.join(ROOT, ".env.local"));
    await loadEnvFile(path.join(ROOT, ".env"));

    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is missing. Add it to .env.local before running eval:vision.");
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

function slugify(value: string) {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 64);
}

function timestampStamp(date: Date) {
    const pad = (value: number) => String(value).padStart(2, "0");
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

function normalizeText(value: string | undefined | null) {
    return (value ?? "").trim().toLowerCase();
}

function keywordCoverage(haystacks: string[], keywords: string[]) {
    if (keywords.length === 0) {
        return { matched: keywords, missing: [] as string[], ratio: 1 };
    }

    const normalizedHaystack = haystacks.map((item) => normalizeText(item)).join(" | ");
    const matched = keywords.filter((keyword) => normalizedHaystack.includes(normalizeText(keyword)));
    const missing = keywords.filter((keyword) => !matched.includes(keyword));

    return {
        matched,
        missing,
        ratio: matched.length / keywords.length,
    };
}

function keywordMissesAnywhere(output: VisionObservation, forbiddenKeywords: string[]) {
    const haystack = [
        output.validationReason,
        output.roomTypeDetected,
        output.observationSummary,
        output.layoutSummary,
        output.lightingSummary,
        output.clutterSummary,
        output.colorSummary,
        output.styleSummary,
        ...output.standoutFeatures,
        ...output.frictionPoints,
        ...output.supportZones,
        ...output.stressZones,
        ...output.observations.flatMap((item) => [item.key, item.label, item.evidence]),
    ]
        .join(" | ")
        .toLowerCase();

    return forbiddenKeywords.filter((keyword) => haystack.includes(normalizeText(keyword)));
}

function addScoreLine(scoreLines: ScoreLine[], mismatches: string[], condition: {
    label: string;
    maxPoints: number;
    passed: boolean;
    detail: string;
    mismatch?: string;
}) {
    scoreLines.push({
        label: condition.label,
        pointsAwarded: condition.passed ? condition.maxPoints : 0,
        maxPoints: condition.maxPoints,
        detail: condition.detail,
    });

    if (!condition.passed && condition.mismatch) {
        mismatches.push(condition.mismatch);
    }
}

function scoreCase(output: VisionObservation, testCase: VisionEvalCase) {
    const scoreLines: ScoreLine[] = [];
    const mismatches: string[] = [];
    const expectations = testCase.expectations;

    if (typeof expectations.isRoomPhoto === "boolean") {
        addScoreLine(scoreLines, mismatches, {
            label: "Room photo validity",
            maxPoints: 10,
            passed: output.isRoomPhoto === expectations.isRoomPhoto,
            detail: `expected=${expectations.isRoomPhoto} actual=${output.isRoomPhoto}`,
            mismatch: "isRoomPhoto did not match expectation.",
        });
    }

    if (typeof expectations.isUsablePhoto === "boolean") {
        addScoreLine(scoreLines, mismatches, {
            label: "Usable photo validity",
            maxPoints: 10,
            passed: output.isUsablePhoto === expectations.isUsablePhoto,
            detail: `expected=${expectations.isUsablePhoto} actual=${output.isUsablePhoto}`,
            mismatch: "isUsablePhoto did not match expectation.",
        });
    }

    const roomTypeOptions = [
        ...(expectations.roomTypeDetected ? [expectations.roomTypeDetected] : []),
        ...(expectations.roomTypeDetectedAnyOf ?? []),
    ].map((value) => normalizeText(value));

    if (roomTypeOptions.length > 0) {
        const actual = normalizeText(output.roomTypeDetected);
        addScoreLine(scoreLines, mismatches, {
            label: "Room type detection",
            maxPoints: 20,
            passed: roomTypeOptions.includes(actual),
            detail: `expected any of=${roomTypeOptions.join(", ")} actual=${actual}`,
            mismatch: `roomTypeDetected "${output.roomTypeDetected}" fell outside the expected set.`,
        });
    }

    if (typeof expectations.minimumObservationCount === "number") {
        const passed = output.observations.length >= expectations.minimumObservationCount;
        addScoreLine(scoreLines, mismatches, {
            label: "Observation count coverage",
            maxPoints: 10,
            passed,
            detail: `expected >= ${expectations.minimumObservationCount} actual=${output.observations.length}`,
            mismatch: "Observation count was lower than expected.",
        });
    }

    if (expectations.requiredObservationKeys?.length) {
        const normalizedKeys = output.observations.map((item) => normalizeText(item.key));
        const matched = expectations.requiredObservationKeys.filter((key) => normalizedKeys.includes(normalizeText(key)));
        const passed = matched.length === expectations.requiredObservationKeys.length;
        addScoreLine(scoreLines, mismatches, {
            label: "Required observation keys",
            maxPoints: 15,
            passed,
            detail: `matched ${matched.length}/${expectations.requiredObservationKeys.length}`,
            mismatch: `Missing observation keys: ${expectations.requiredObservationKeys.filter((key) => !matched.includes(key)).join(", ")}`,
        });
    }

    if (expectations.requiredEvidenceKeywords?.length) {
        const coverage = keywordCoverage(
            output.observations.map((item) => item.evidence),
            expectations.requiredEvidenceKeywords,
        );
        addScoreLine(scoreLines, mismatches, {
            label: "Evidence keyword coverage",
            maxPoints: 10,
            passed: coverage.ratio === 1,
            detail: `matched ${coverage.matched.length}/${expectations.requiredEvidenceKeywords.length}`,
            mismatch: `Missing evidence keywords: ${coverage.missing.join(", ")}`,
        });
    }

    if (expectations.supportZoneKeywords?.length) {
        const coverage = keywordCoverage(output.supportZones, expectations.supportZoneKeywords);
        addScoreLine(scoreLines, mismatches, {
            label: "Support zone relevance",
            maxPoints: 10,
            passed: coverage.ratio === 1,
            detail: `matched ${coverage.matched.length}/${expectations.supportZoneKeywords.length}`,
            mismatch: `Missing support zone keywords: ${coverage.missing.join(", ")}`,
        });
    }

    if (expectations.stressZoneKeywords?.length) {
        const coverage = keywordCoverage(output.stressZones, expectations.stressZoneKeywords);
        addScoreLine(scoreLines, mismatches, {
            label: "Stress zone relevance",
            maxPoints: 10,
            passed: coverage.ratio === 1,
            detail: `matched ${coverage.matched.length}/${expectations.stressZoneKeywords.length}`,
            mismatch: `Missing stress zone keywords: ${coverage.missing.join(", ")}`,
        });
    }

    if (expectations.frictionKeywords?.length) {
        const coverage = keywordCoverage(output.frictionPoints, expectations.frictionKeywords);
        addScoreLine(scoreLines, mismatches, {
            label: "Friction point capture",
            maxPoints: 8,
            passed: coverage.ratio === 1,
            detail: `matched ${coverage.matched.length}/${expectations.frictionKeywords.length}`,
            mismatch: `Missing friction keywords: ${coverage.missing.join(", ")}`,
        });
    }

    if (expectations.standoutKeywords?.length) {
        const coverage = keywordCoverage(output.standoutFeatures, expectations.standoutKeywords);
        addScoreLine(scoreLines, mismatches, {
            label: "Standout feature capture",
            maxPoints: 7,
            passed: coverage.ratio === 1,
            detail: `matched ${coverage.matched.length}/${expectations.standoutKeywords.length}`,
            mismatch: `Missing standout keywords: ${coverage.missing.join(", ")}`,
        });
    }

    if (expectations.forbiddenKeywords?.length) {
        const matchedForbidden = keywordMissesAnywhere(output, expectations.forbiddenKeywords);
        addScoreLine(scoreLines, mismatches, {
            label: "Forbidden language guardrail",
            maxPoints: 10,
            passed: matchedForbidden.length === 0,
            detail: matchedForbidden.length === 0 ? "No forbidden keywords found." : `Matched: ${matchedForbidden.join(", ")}`,
            mismatch: matchedForbidden.length > 0 ? `Forbidden keywords present: ${matchedForbidden.join(", ")}` : undefined,
        });
    }

    const totalPossible = scoreLines.reduce((sum, item) => sum + item.maxPoints, 0);
    const totalAwarded = scoreLines.reduce((sum, item) => sum + item.pointsAwarded, 0);
    const normalizedScore = totalPossible > 0 ? Math.round((totalAwarded / totalPossible) * 100) : 100;

    return {
        score: normalizedScore,
        scoreLines,
        mismatches,
    };
}

async function listCaseFiles() {
    const entries = await readdir(CASES_DIR, { withFileTypes: true });
    return entries
        .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
        .map((entry) => path.join(CASES_DIR, entry.name))
        .sort();
}

function parseCase(raw: string, filePath: string): VisionEvalCase {
    const parsed = JSON.parse(raw) as Partial<VisionEvalCase>;
    if (!parsed.id) {
        throw new Error(`Case file ${filePath} is missing "id".`);
    }
    if (!parsed.imagePath) {
        throw new Error(`Case file ${filePath} is missing "imagePath".`);
    }
    if (!parsed.expectations || typeof parsed.expectations !== "object") {
        throw new Error(`Case file ${filePath} is missing "expectations".`);
    }

    return {
        id: parsed.id,
        imagePath: parsed.imagePath,
        spaceData: parsed.spaceData ?? {},
        expectations: parsed.expectations,
        notes: parsed.notes,
    };
}

async function loadCases(options: CliOptions) {
    const caseFiles = await listCaseFiles();
    const loaded = await Promise.all(
        caseFiles.map(async (filePath) => parseCase(await readFile(filePath, "utf8"), filePath)),
    );

    const filtered =
        options.caseId
            ? loaded.filter((item) => item.id === options.caseId)
            : loaded;

    if (options.caseId && filtered.length === 0) {
        throw new Error(`No case found with id "${options.caseId}".`);
    }

    return typeof options.limit === "number" ? filtered.slice(0, options.limit) : filtered;
}

async function evaluateCase(testCase: VisionEvalCase): Promise<CaseResult> {
    if (!generateVisionObservationRuntime) {
        throw new Error("Vision evaluation runtime is not initialized.");
    }

    const imageAbsolutePath = path.isAbsolute(testCase.imagePath)
        ? testCase.imagePath
        : path.join(ROOT, testCase.imagePath);

    const imageBuffer = await readFile(imageAbsolutePath);
    const mimeType = inferMimeType(imageAbsolutePath);
    const input: SpaceData = {
        sunlight: testCase.spaceData?.sunlight ?? "medium",
        density: testCase.spaceData?.density ?? "balanced",
        spaceType: testCase.spaceData?.spaceType,
        perspectives: testCase.spaceData?.perspectives ?? [],
        photoPath: imageAbsolutePath,
    };

    const prompt = getVisionObservationPrompt(input);
    const startedAt = Date.now();

    try {
        const result = await generateVisionObservationRuntime(input, toArrayBuffer(imageBuffer), mimeType);
        const durationMs = Date.now() - startedAt;

        if (!result) {
            return {
                id: testCase.id,
                imagePath: testCase.imagePath,
                score: 0,
                passed: false,
                mismatches: ["Model returned no structured output."],
                scoreLines: [],
                input,
                prompt,
                output: null,
                usage: null,
                model: null,
                durationMs,
                error: "Model returned null response.",
                notes: testCase.notes,
            };
        }

        const scoring = scoreCase(result.data, testCase);
        return {
            id: testCase.id,
            imagePath: testCase.imagePath,
            score: scoring.score,
            passed: scoring.mismatches.length === 0,
            mismatches: scoring.mismatches,
            scoreLines: scoring.scoreLines,
            input,
            prompt,
            output: result.data,
            usage: result.usage,
            model: result.model,
            durationMs,
            notes: testCase.notes,
        };
    } catch (error) {
        return {
            id: testCase.id,
            imagePath: testCase.imagePath,
            score: 0,
            passed: false,
            mismatches: [error instanceof Error ? error.message : String(error)],
            scoreLines: [],
            input,
            prompt,
            output: null,
            usage: null,
            model: null,
            durationMs: Date.now() - startedAt,
            error: error instanceof Error ? error.message : String(error),
            notes: testCase.notes,
        };
    }
}

function buildMarkdownSummary(options: CliOptions, results: CaseResult[], runFolderName: string) {
    const averageScore = results.length > 0
        ? Math.round(results.reduce((sum, item) => sum + item.score, 0) / results.length)
        : 0;

    const lines = [
        "# Vision Eval Summary",
        "",
        `- Run: \`${runFolderName}\``,
        `- Model: \`${ANALYSIS_MODEL_NAME}\``,
        `- Prompt version: \`${ANALYSIS_PROMPT_VERSION}\``,
        `- Schema version: \`${ANALYSIS_SCHEMA_VERSION}\``,
        `- Cases: \`${results.length}\``,
        `- Average score: \`${averageScore}\``,
        `- Tag: \`${options.tag}\``,
        "",
        "| Case | Score | Status | Notes |",
        "| --- | ---: | --- | --- |",
        ...results.map((result) => `| ${result.id} | ${result.score} | ${result.passed ? "pass" : "review"} | ${result.mismatches[0] ?? "ok"} |`),
        "",
        "## Cases Needing Review",
        "",
    ];

    const failing = results.filter((result) => !result.passed);
    if (failing.length === 0) {
        lines.push("All cases passed their labeled expectations.");
    } else {
        for (const result of failing) {
            lines.push(`### ${result.id}`);
            for (const mismatch of result.mismatches) {
                lines.push(`- ${mismatch}`);
            }
            lines.push("");
        }
    }

    return lines.join("\n");
}

async function persistRunArtifacts(options: CliOptions, results: CaseResult[]) {
    const runFolderName = `${timestampStamp(new Date())}--${slugify(options.tag)}`;
    const runFolder = path.join(RUNS_DIR, runFolderName);
    const caseFolder = path.join(runFolder, "cases");

    await mkdir(caseFolder, { recursive: true });

    const summary = {
        runFolderName,
        modelName: ANALYSIS_MODEL_NAME,
        promptVersion: ANALYSIS_PROMPT_VERSION,
        schemaVersion: ANALYSIS_SCHEMA_VERSION,
        tag: options.tag,
        createdAt: new Date().toISOString(),
        caseCount: results.length,
        averageScore: results.length > 0
            ? Math.round(results.reduce((sum, item) => sum + item.score, 0) / results.length)
            : 0,
        results,
    };

    await writeFile(path.join(runFolder, "summary.json"), JSON.stringify(summary, null, 2));
    await writeFile(path.join(runFolder, "summary.md"), buildMarkdownSummary(options, results, runFolderName));

    await Promise.all(
        results.map((result) =>
            writeFile(
                path.join(caseFolder, `${slugify(result.id)}.json`),
                JSON.stringify(result, null, 2),
            ),
        ),
    );

    return runFolderName;
}

async function main() {
    const options = parseArgs(process.argv.slice(2));
    const cases = await loadCases(options);
    if (cases.length === 0) {
        throw new Error("No eval cases found. Add JSON files under evals/vision/cases/ before running the harness.");
    }

    await ensureEnvLoaded();
    generateVisionObservationRuntime = (await import("@/lib/gemini")).generateVisionObservation;

    const results: CaseResult[] = [];
    for (const testCase of cases) {
        process.stdout.write(`Evaluating ${testCase.id}...\n`);
        results.push(await evaluateCase(testCase));
    }

    const runFolderName = await persistRunArtifacts(options, results);
    const averageScore = Math.round(results.reduce((sum, item) => sum + item.score, 0) / results.length);

    process.stdout.write(`\nSaved run artifacts to evals/vision/runs/${runFolderName}\n`);
    process.stdout.write(`Average score: ${averageScore}\n`);

    const reviewCases = results.filter((result) => !result.passed);
    if (reviewCases.length > 0) {
        process.stdout.write(`Cases needing review: ${reviewCases.map((item) => item.id).join(", ")}\n`);
    } else {
        process.stdout.write("All evaluated cases passed their labeled expectations.\n");
    }

    if (typeof options.minScore === "number" && averageScore < options.minScore) {
        process.exitCode = 1;
    }
}

main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
});
