import type { ComparisonSnapshotResultV2, SnapshotResultV2 } from "@/lib/align-v2/contracts";

const DIMENSION_ORDER = ["calm", "clarity", "grounding", "warmth", "openness", "restoration"] as const;

function clampChange(value: number) {
    return Math.round(value);
}

function findDimension(snapshot: SnapshotResultV2, key: typeof DIMENSION_ORDER[number]) {
    return snapshot.spaceState.dimensions.find((item) => item.key === key);
}

function directionFromChange(change: number): "up" | "down" | "flat" {
    if (change > 1) return "up";
    if (change < -1) return "down";
    return "flat";
}

function biggestShiftLabel(current: SnapshotResultV2, previous: SnapshotResultV2) {
    const deltas = DIMENSION_ORDER.map((key) => {
        const before = findDimension(previous, key)?.score ?? 0;
        const after = findDimension(current, key)?.score ?? 0;
        return {
            key,
            change: after - before,
            label: findDimension(current, key)?.label ?? key,
        };
    }).sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

    const winner = deltas[0];
    if (!winner) {
        return "The room is holding a similar pattern to the previous scan.";
    }

    if (winner.change > 1) {
        return `${winner.label} is the clearest gain in this new scan.`;
    }

    if (winner.change < -1) {
        return `${winner.label} is the area that softened the least in this new scan.`;
    }

    return "The room is moving in a similar direction, but the shifts are still subtle.";
}

function remainingGap(current: SnapshotResultV2) {
    return current.spaceState.coreGap || current.summary.body;
}

export function buildComparisonSnapshotV2(input: {
    previousAnalysisId: string;
    currentAnalysisId: string;
    previous: SnapshotResultV2;
    current: SnapshotResultV2;
}): ComparisonSnapshotResultV2 {
    const sameGoal = input.previous.score.goal === input.current.score.goal;
    const overallChange = clampChange(input.current.spaceState.overallScore - input.previous.spaceState.overallScore);

    const dimensions = DIMENSION_ORDER.map((key) => {
        const previousDimension = findDimension(input.previous, key);
        const currentDimension = findDimension(input.current, key);
        const previousScore = previousDimension?.score ?? 0;
        const currentScore = currentDimension?.score ?? 0;
        const change = clampChange(currentScore - previousScore);

        return {
            key,
            previous: previousScore,
            current: currentScore,
            change,
            direction: directionFromChange(change),
        };
    });

    const strongestPositive = dimensions
        .filter((item) => item.change > 0)
        .sort((a, b) => b.change - a.change)[0];

    const stillWeak = input.current.spaceState.dimensions
        .filter((item) => item.level === "weak")
        .slice(0, 3)
        .map((item) => item.label);

    return {
        version: "v2-comparison",
        analysisMode: "comparison",
        comparison: {
            previousAnalysisId: input.previousAnalysisId,
            currentAnalysisId: input.currentAnalysisId,
            sameGoal,
            goal: input.current.score.goal,
            headline: overallChange > 0
                ? "This scan shows a room that is beginning to support you more clearly than before."
                : overallChange < 0
                    ? "This scan suggests the room is carrying slightly more tension than the previous reading."
                    : "This scan reads close to the previous one, with only lighter changes so far.",
            summaryTags: [
                overallChange > 0 ? "Overall support is rising" : overallChange < 0 ? "Tension has crept back in" : "The pattern is still similar",
                strongestPositive ? `${strongestPositive.key} improved` : "No major lift yet",
                input.current.spaceState.weakest,
            ],
        },
        delta: {
            overallScore: {
                previous: input.previous.spaceState.overallScore,
                current: input.current.spaceState.overallScore,
                change: overallChange,
            },
            dimensions,
            biggestWin: biggestShiftLabel(input.current, input.previous),
            remainingGap: remainingGap(input.current),
        },
        whatChanged: dimensions
            .filter((item) => item.change !== 0)
            .slice(0, 3)
            .map((item) => {
                const currentDimension = findDimension(input.current, item.key);
                const previousDimension = findDimension(input.previous, item.key);
                return {
                    label: currentDimension?.label ?? item.key,
                    before: previousDimension?.summary ?? "The earlier reading was less supportive here.",
                    now: currentDimension?.summary ?? "The newer reading is shifting here.",
                    impact: item.change > 0
                        ? `This dimension improved by ${item.change} points in the latest scan.`
                        : `This dimension dropped by ${Math.abs(item.change)} points in the latest scan.`,
                };
            }),
        stillMissing: {
            headline: "The room has moved, but the full support pattern is not complete yet.",
            items: stillWeak.length > 0
                ? stillWeak.map((label) => `${label} is still lagging behind the rest of the room.`)
                : ["The biggest next step is to make the strongest gain feel more consistent throughout the room."],
        },
        nextShift: {
            title: "Keep the strongest gain, then reinforce the weakest layer",
            action: input.current.firstShift.action,
            whyItHelps: input.current.firstShift.whyItHelps,
        },
        preview: {
            ctaText: "Unlock Progress Report",
            fullReportPromise: "See which changes are genuinely working, which signals still pull the room off course, and what to reinforce next.",
        },
    };
}
