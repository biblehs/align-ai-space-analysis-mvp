import type { SnapshotResultV2 } from "@/lib/align-v2/contracts";

function normalizeSentence(value: string, maxLength: number) {
    const compact = value.replace(/\s+/g, " ").trim();
    if (compact.length <= maxLength) {
        return compact;
    }

    return `${compact.slice(0, Math.max(0, maxLength - 1)).trimEnd()}...`;
}

function dedupeParagraphs(...items: Array<string | null | undefined>) {
    const seen = new Set<string>();

    return items
        .map((item) => item?.replace(/\s+/g, " ").trim() ?? "")
        .filter(Boolean)
        .filter((item) => {
            const normalized = item.toLowerCase();
            if (seen.has(normalized)) {
                return false;
            }

            seen.add(normalized);
            return true;
        });
}

function buildNotes(snapshot: SnapshotResultV2) {
    const items = new Set<string>();

    if (snapshot.validation.status !== "valid" && snapshot.validation.message) {
        items.add(normalizeSentence(snapshot.validation.message, 140));
    }

    if (snapshot.validation.roomMismatch.mismatch && snapshot.validation.roomMismatch.reason) {
        items.add(normalizeSentence(snapshot.validation.roomMismatch.reason, 140));
    }

    if (snapshot.meta.diagnosisConfidence < 0.72) {
        items.add("This reading is directional rather than absolute, so use it as guidance and confirm it against how the room actually feels.");
    }

    return Array.from(items).slice(0, 2);
}

function buildGoalCue(goal: SnapshotResultV2["score"]["goal"]) {
    if (goal === "sleep") return "rest";
    if (goal === "focus") return "focus";
    if (goal === "vitality") return "energy";
    return "calm";
}

function buildSpaceStateTitle(spaceState: SnapshotResultV2["spaceState"]) {
    const strongest = spaceState.strongest.trim();
    const weakest = spaceState.weakest.trim().toLowerCase();

    if (weakest === "restoration") {
        return "Quiet structure, lighter restoration";
    }

    if (weakest === "warmth") {
        return "A steady base, with warmth still trailing";
    }

    if (weakest === "calm") {
        return "Structure is present, but calm is still catching up";
    }

    return `${strongest} is leading, while ${weakest} is still lighter`;
}

export interface SnapshotV2ViewModel {
    hero: {
        eyebrow: string;
        title: string;
        subtitle: string;
        tags: string[];
        balanceNote: string;
    };
    summary: {
        eyebrow: string;
        title: string;
        paragraphs: string[];
    };
    proof: {
        eyebrow: string;
        title: string;
        intro: string;
        items: SnapshotResultV2["proof"];
    };
    spaceState: {
        eyebrow: string;
        title: string;
        subtitle: string;
        balanceNote: string;
        strongest: string;
        weakest: string;
        coreGap: string;
        dimensions: SnapshotResultV2["spaceState"]["dimensions"];
    };
    firstShift: {
        eyebrow: string;
        title: string;
        action: string;
        examples: string[];
        whyItHelps: string;
        targetZone: string;
        supportingLine: string;
    };
    cta: {
        eyebrow: string;
        title: string;
        body: string;
        signals: string[];
        teaserTitle: string;
        hiddenFindings: string[];
        supportingLine: string;
        ctaText: string;
    };
    notes: string[];
}

export function buildSnapshotV2ViewModel(snapshot: SnapshotResultV2): SnapshotV2ViewModel {
    const goalCue = buildGoalCue(snapshot.score.goal);

    return {
        hero: {
            eyebrow: "Your Space Snapshot",
            title: snapshot.type.name,
            subtitle: snapshot.type.coreSentence,
            tags: snapshot.summary.statusTags.slice(0, 3),
            balanceNote: `Space balance: ${snapshot.spaceState.overallScore} / 100`,
        },
        summary: {
            eyebrow: "Overall Reading",
            title: snapshot.reading.oneLiner || snapshot.summary.headline,
            paragraphs: dedupeParagraphs(
                snapshot.summary.body,
                snapshot.reading.shortParagraph,
                snapshot.tension.explanation,
            ).slice(0, 2),
        },
        proof: {
            eyebrow: "What the AI saw",
            title: "The visible signals shaping this room",
            intro: "A first reading grounded in what is visually present, not generic advice.",
            items: snapshot.proof.slice(0, 3),
        },
        spaceState: {
            eyebrow: "Current space state",
            title: buildSpaceStateTitle(snapshot.spaceState),
            subtitle: "A lighter read of the room's current pattern.",
            balanceNote: `Space balance: ${snapshot.spaceState.overallScore} / 100`,
            strongest: snapshot.spaceState.strongest,
            weakest: snapshot.spaceState.weakest,
            coreGap: snapshot.spaceState.coreGap,
            dimensions: snapshot.spaceState.dimensions,
        },
        firstShift: {
            eyebrow: "Tonight's Shift",
            title: snapshot.firstShift.title,
            action: snapshot.firstShift.action,
            examples: snapshot.firstShift.examples.slice(0, 3),
            whyItHelps: snapshot.firstShift.whyItHelps,
            targetZone: snapshot.firstShift.targetZone,
            supportingLine: `You do not need to change the whole room. You only need one clearer cue for ${goalCue}.`,
        },
        cta: {
            eyebrow: "Keep Going",
            title: snapshot.brandHook.title,
            body: snapshot.brandHook.subtitle,
            signals: snapshot.brandHook.signals.slice(0, 3),
            teaserTitle: snapshot.preview.teaserTitle,
            hiddenFindings: snapshot.preview.hiddenFindings.slice(0, 3),
            supportingLine: snapshot.preview.fullReportPromise,
            ctaText: snapshot.preview.ctaText,
        },
        notes: buildNotes(snapshot),
    };
}
