import { Type } from "@google/genai";

export const roomPreAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        isRoomPhoto: {
            type: Type.BOOLEAN,
            description: "True only if the image clearly shows an indoor room or interior space.",
        },
        isUsablePhoto: {
            type: Type.BOOLEAN,
            description: "True only if the room is visible enough for layout, light, clutter, and style analysis.",
        },
        validationReason: {
            type: Type.STRING,
            description: "Short user-facing explanation about whether the room image is valid and usable.",
        },
        roomType: {
            type: Type.STRING,
            description: "Short label describing the room type or primary room function.",
        },
        visualSummary: {
            type: Type.STRING,
            description: "2-3 sentence summary of the visible room, focused only on photographic evidence.",
        },
        layoutSummary: {
            type: Type.STRING,
            description: "Concise summary of layout, movement flow, and furniture pressure.",
        },
        lightingSummary: {
            type: Type.STRING,
            description: "Concise summary of natural and artificial light conditions.",
        },
        clutterSummary: {
            type: Type.STRING,
            description: "Concise summary of density, surface coverage, and visual clutter.",
        },
        colorSummary: {
            type: Type.STRING,
            description: "Concise summary of the dominant palette and contrast.",
        },
        styleSummary: {
            type: Type.STRING,
            description: "Concise summary of the room's style cues, materials, and coherence.",
        },
        standoutFeatures: {
            type: Type.ARRAY,
            description: "Exactly 3 specific visible features that define this room.",
            items: { type: Type.STRING },
        },
        frictionPoints: {
            type: Type.ARRAY,
            description: "Exactly 3 specific visible tension points in the room.",
            items: { type: Type.STRING },
        },
        supportZones: {
            type: Type.ARRAY,
            description: "1-3 concise visible areas that already support the room's potential.",
            items: { type: Type.STRING },
        },
        stressZones: {
            type: Type.ARRAY,
            description: "1-3 concise visible areas where energy or function feels strained.",
            items: { type: Type.STRING },
        },
    },
    required: [
        "isRoomPhoto",
        "isUsablePhoto",
        "validationReason",
        "roomType",
        "visualSummary",
        "layoutSummary",
        "lightingSummary",
        "clutterSummary",
        "colorSummary",
        "styleSummary",
        "standoutFeatures",
        "frictionPoints",
        "supportZones",
        "stressZones",
    ],
};

export const visionObservationSchema = {
    type: Type.OBJECT,
    properties: {
        isRoomPhoto: {
            type: Type.BOOLEAN,
            description: "True only if the image clearly shows an indoor room or interior space.",
        },
        isUsablePhoto: {
            type: Type.BOOLEAN,
            description: "True only if the room is visible enough for structured analysis.",
        },
        validationReason: {
            type: Type.STRING,
            description: "Short user-facing explanation about whether the room image is valid and usable.",
        },
        roomTypeDetected: {
            type: Type.STRING,
            description: "Short label describing the room type or primary room function. If the room is mixed-use, choose the best primary label and let overlap appear in summaries or observations.",
        },
        observationSummary: {
            type: Type.STRING,
            description: "A concise 2-3 sentence factual summary of the room that captures the dominant function, major visible tensions, and any obvious mixed-use overlap.",
        },
        layoutSummary: {
            type: Type.STRING,
            description: "Concise summary of layout, movement flow, furniture placement, and whether circulation feels open, tight, or visually interrupted.",
        },
        lightingSummary: {
            type: Type.STRING,
            description: "Concise summary of natural and artificial light conditions, including darkness, glare, softness, window contribution, and whether the room feels evenly lit.",
        },
        clutterSummary: {
            type: Type.STRING,
            description: "Concise summary of surface load, density, exposed items, and where visual load is most concentrated.",
        },
        colorSummary: {
            type: Type.STRING,
            description: "Concise summary of the dominant palette, temperature, contrast, and overall color coherence that is actually visible in frame.",
        },
        styleSummary: {
            type: Type.STRING,
            description: "Concise summary of style cues, materials, and coherence, based only on visible furnishings, finishes, and decor.",
        },
        observations: {
            type: Type.ARRAY,
            description: "4-8 structured observations extracted from the image. Prefer a mix of layout, light, visual load, function overlap, and support/strain signals when visible.",
            items: {
                type: Type.OBJECT,
                properties: {
                    key: { type: Type.STRING, description: "Short machine-friendly identifier for the observation, such as work_rest_overlap or harsh_overhead_light." },
                    label: { type: Type.STRING, description: "Short user-readable label naming the visible issue or support signal." },
                    impact: { type: Type.STRING, enum: ["positive", "negative", "mixed"] },
                    confidence: { type: Type.NUMBER, description: "0-1 confidence based on actual visibility. Lower this when the area is partially visible or ambiguous." },
                    evidence: { type: Type.STRING, description: "One concise evidence sentence that mentions visible objects, surfaces, zones, or lighting conditions. Avoid vague statements." },
                },
                required: ["key", "label", "impact", "confidence", "evidence"],
            },
        },
        standoutFeatures: {
            type: Type.ARRAY,
            description: "Exactly 3 specific visible anchors that define the room at first glance. Each item should point to an object, surface, zone, or lighting condition actually in frame.",
            items: { type: Type.STRING },
        },
        frictionPoints: {
            type: Type.ARRAY,
            description: "Exactly 3 specific visible pressure points in the room, each grounded in something observable rather than abstract mood language.",
            items: { type: Type.STRING },
        },
        supportZones: {
            type: Type.ARRAY,
            description: "1-3 visible areas that already support the room's potential. Name real areas like a desk by the window, bed corner, shelf wall, or open floor zone.",
            items: { type: Type.STRING },
        },
        stressZones: {
            type: Type.ARRAY,
            description: "1-3 visible areas where energy or function feels strained. Name concrete zones or surfaces rather than vague phrases like the room itself.",
            items: { type: Type.STRING },
        },
    },
    required: [
        "isRoomPhoto",
        "isUsablePhoto",
        "validationReason",
        "roomTypeDetected",
        "observationSummary",
        "layoutSummary",
        "lightingSummary",
        "clutterSummary",
        "colorSummary",
        "styleSummary",
        "observations",
        "standoutFeatures",
        "frictionPoints",
        "supportZones",
        "stressZones",
    ],
};

export const visionValidationSchema = {
    type: Type.OBJECT,
    properties: {
        status: {
            type: Type.STRING,
            enum: ["valid", "invalid", "action_required"],
        },
        code: {
            type: Type.STRING,
            enum: [
                "valid",
                "not_a_room",
                "blank_or_nearly_blank",
                "too_dark",
                "too_blurry",
                "too_close",
                "insufficient_context",
                "multiple_spaces_confusing",
            ],
        },
        message: {
            type: Type.STRING,
            description: "A short user-facing explanation for the validation result.",
        },
        isRoomPhoto: { type: Type.BOOLEAN },
        isUsablePhoto: { type: Type.BOOLEAN },
        claimedRoomType: {
            type: Type.STRING,
            nullable: true,
            description: "The room type the user selected before upload, normalized into a canonical room label.",
        },
        detectedRoomType: {
            type: Type.STRING,
            description: "The room type inferred from the image itself.",
        },
        detectedRoomTypeConfidence: { type: Type.NUMBER },
        finalRoomType: {
            type: Type.STRING,
            nullable: true,
            description: "The room type the system will actually use for diagnosis after mismatch handling.",
        },
        roomMismatch: {
            type: Type.OBJECT,
            properties: {
                mismatch: { type: Type.BOOLEAN },
                severity: {
                    type: Type.STRING,
                    enum: ["none", "soft", "hard"],
                },
                reason: {
                    type: Type.STRING,
                    nullable: true,
                },
                userActionRequired: { type: Type.BOOLEAN },
                suggestedAction: {
                    type: Type.STRING,
                    enum: ["continue", "confirm_detected_room_type", "reupload"],
                },
            },
            required: ["mismatch", "severity", "reason", "userActionRequired", "suggestedAction"],
        },
        quality: {
            type: Type.OBJECT,
            properties: {
                brightness: { type: Type.STRING, enum: ["low", "medium", "high"] },
                blur: { type: Type.STRING, enum: ["low", "medium", "high"] },
                framing: { type: Type.STRING, enum: ["poor", "partial", "good"] },
                contextCoverage: { type: Type.STRING, enum: ["insufficient", "partial", "sufficient"] },
            },
            required: ["brightness", "blur", "framing", "contextCoverage"],
        },
    },
    required: [
        "status",
        "code",
        "message",
        "isRoomPhoto",
        "isUsablePhoto",
        "claimedRoomType",
        "detectedRoomType",
        "detectedRoomTypeConfidence",
        "finalRoomType",
        "roomMismatch",
        "quality",
    ],
};

export const noteInterpretationSchema = {
    type: Type.OBJECT,
    properties: {
        usable: { type: Type.BOOLEAN },
        confidence: { type: Type.NUMBER },
        raw: {
            type: Type.STRING,
            nullable: true,
        },
        feltState: {
            type: Type.STRING,
            nullable: true,
            enum: ["restless", "heavy", "scattered", "flat", "drained", "unsettled"],
        },
        routineMoment: {
            type: Type.STRING,
            nullable: true,
            enum: ["before_sleep", "while_working", "when_entering", "all_day"],
        },
        desiredShift: {
            type: Type.STRING,
            nullable: true,
            enum: ["calmer", "clearer", "warmer", "lighter", "more_grounded", "more_focused"],
        },
        hardConstraint: {
            type: Type.STRING,
            nullable: true,
        },
        personalLanguage: {
            type: Type.STRING,
            nullable: true,
        },
        summary: {
            type: Type.STRING,
            nullable: true,
        },
    },
    required: [
        "usable",
        "confidence",
        "raw",
        "feltState",
        "routineMoment",
        "desiredShift",
        "hardConstraint",
        "personalLanguage",
        "summary",
    ],
};

export const patternDiagnosisSchema = {
    type: Type.OBJECT,
    properties: {
        version: { type: Type.STRING },
        validForSnapshot: { type: Type.BOOLEAN },
        roomTypeResolution: {
            type: Type.OBJECT,
            properties: {
                claimed: { type: Type.STRING, nullable: true },
                detected: { type: Type.STRING },
                finalUsed: { type: Type.STRING, nullable: true },
                confidence: { type: Type.NUMBER },
                mismatchSeverity: {
                    type: Type.STRING,
                    enum: ["none", "soft", "hard"],
                },
            },
            required: ["claimed", "detected", "finalUsed", "confidence", "mismatchSeverity"],
        },
        energyType: {
            type: Type.OBJECT,
            properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                state: { type: Type.STRING, nullable: true },
                element: { type: Type.STRING, nullable: true },
                coreSentence: { type: Type.STRING },
                confidence: { type: Type.NUMBER },
            },
            required: ["id", "name", "state", "element", "coreSentence", "confidence"],
        },
        matchRationale: { type: Type.STRING },
        coreTension: { type: Type.STRING },
        feltImpact: { type: Type.STRING },
        supportZone: {
            type: Type.OBJECT,
            properties: {
                label: { type: Type.STRING },
                evidence: { type: Type.STRING },
            },
            required: ["label", "evidence"],
        },
        stressZone: {
            type: Type.OBJECT,
            properties: {
                label: { type: Type.STRING },
                evidence: { type: Type.STRING },
            },
            required: ["label", "evidence"],
        },
        proofSignals: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    key: { type: Type.STRING },
                    label: { type: Type.STRING },
                    impact: { type: Type.STRING, enum: ["positive", "negative", "mixed"] },
                    evidence: { type: Type.STRING },
                    sourceObservationKeys: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                    },
                },
                required: ["key", "label", "impact", "evidence", "sourceObservationKeys"],
            },
        },
        firstShiftPattern: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                actionPrinciple: { type: Type.STRING },
                targetZone: { type: Type.STRING },
                rationale: { type: Type.STRING },
                constraintsApplied: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                },
            },
            required: ["title", "actionPrinciple", "targetZone", "rationale", "constraintsApplied"],
        },
        fullReportPromise: {
            type: Type.OBJECT,
            properties: {
                hiddenFindings: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                },
                transformationDirection: { type: Type.STRING },
            },
            required: ["hiddenFindings", "transformationDirection"],
        },
        personalization: {
            type: Type.OBJECT,
            properties: {
                goal: { type: Type.STRING },
                primaryIssue: { type: Type.STRING, nullable: true },
                supportPriority: { type: Type.STRING, nullable: true },
                changeOpenness: { type: Type.STRING, nullable: true },
                budgetComfort: { type: Type.STRING, nullable: true },
                noteUsed: { type: Type.BOOLEAN },
            },
            required: [
                "goal",
                "primaryIssue",
                "supportPriority",
                "changeOpenness",
                "budgetComfort",
                "noteUsed",
            ],
        },
    },
    required: [
        "version",
        "validForSnapshot",
        "roomTypeResolution",
        "energyType",
        "matchRationale",
        "coreTension",
        "feltImpact",
        "supportZone",
        "stressZone",
        "proofSignals",
        "firstShiftPattern",
        "fullReportPromise",
        "personalization",
    ],
};

export const snapshotSchemaV2 = {
    type: Type.OBJECT,
    properties: {
        version: { type: Type.STRING },
        analysisMode: {
            type: Type.STRING,
            enum: ["vision", "fallback"],
        },
        validation: {
            ...visionValidationSchema,
            properties: {
                status: visionValidationSchema.properties.status,
                code: visionValidationSchema.properties.code,
                message: visionValidationSchema.properties.message,
                finalRoomType: visionValidationSchema.properties.finalRoomType,
                roomMismatch: visionValidationSchema.properties.roomMismatch,
            },
            required: ["status", "code", "message", "finalRoomType", "roomMismatch"],
        },
        type: {
            type: Type.OBJECT,
            properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                coreSentence: { type: Type.STRING },
                confidence: { type: Type.NUMBER },
            },
            required: ["id", "name", "coreSentence", "confidence"],
        },
        score: {
            type: Type.OBJECT,
            properties: {
                goal: { type: Type.STRING },
                value: { type: Type.INTEGER },
                overall: { type: Type.INTEGER },
                label: { type: Type.STRING },
                narrative: { type: Type.STRING },
                meaning: { type: Type.STRING },
            },
            required: ["goal", "value", "overall", "label", "narrative", "meaning"],
        },
        reading: {
            type: Type.OBJECT,
            properties: {
                oneLiner: { type: Type.STRING },
                shortParagraph: { type: Type.STRING },
            },
            required: ["oneLiner", "shortParagraph"],
        },
        proof: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    label: { type: Type.STRING },
                    evidence: { type: Type.STRING },
                    impact: { type: Type.STRING, enum: ["positive", "negative", "mixed"] },
                },
                required: ["label", "evidence", "impact"],
            },
        },
        tension: {
            type: Type.OBJECT,
            properties: {
                headline: { type: Type.STRING },
                explanation: { type: Type.STRING },
            },
            required: ["headline", "explanation"],
        },
        firstShift: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                action: { type: Type.STRING },
                whyItHelps: { type: Type.STRING },
                targetZone: { type: Type.STRING },
                timing: { type: Type.STRING, enum: ["tonight"] },
            },
            required: ["title", "action", "whyItHelps", "targetZone", "timing"],
        },
        preview: {
            type: Type.OBJECT,
            properties: {
                hiddenFindings: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                },
                fullReportPromise: { type: Type.STRING },
            },
            required: ["hiddenFindings", "fullReportPromise"],
        },
        meta: {
            type: Type.OBJECT,
            properties: {
                noteUsed: { type: Type.BOOLEAN },
                diagnosisConfidence: { type: Type.NUMBER },
                generationMode: {
                    type: Type.STRING,
                    enum: ["fully_templated", "templated_plus_llm"],
                },
            },
            required: ["noteUsed", "diagnosisConfidence", "generationMode"],
        },
    },
    required: [
        "version",
        "analysisMode",
        "validation",
        "type",
        "score",
        "reading",
        "proof",
        "tension",
        "firstShift",
        "preview",
        "meta",
    ],
};

export const snapshotDiagnosisSchema = {
    type: Type.OBJECT,
    properties: {
        summary: {
            type: Type.OBJECT,
            properties: {
                headline: {
                    type: Type.STRING,
                    description: "One crisp room-diagnosis headline grounded in the visible evidence.",
                },
                body: {
                    type: Type.STRING,
                    description: "A concise 1-2 sentence explanation of the main room pattern without revealing the full paid plan.",
                },
            },
            required: ["headline", "body"],
        },
        reading: {
            type: Type.OBJECT,
            properties: {
                oneLiner: {
                    type: Type.STRING,
                    description: "One direct sentence that connects visible room evidence to the user's goal.",
                },
                shortParagraph: {
                    type: Type.STRING,
                    description: "A 2-4 sentence snapshot reading that feels image-grounded and coherent.",
                },
            },
            required: ["oneLiner", "shortParagraph"],
        },
        tension: {
            type: Type.OBJECT,
            properties: {
                headline: {
                    type: Type.STRING,
                    description: "The central spatial tension in the room.",
                },
                explanation: {
                    type: Type.STRING,
                    description: "A short explanation of why that tension affects the selected goal.",
                },
            },
            required: ["headline", "explanation"],
        },
        proof: {
            type: Type.ARRAY,
            description: "Exactly 3 visible proof signals. Each must cite real visible evidence from the provided truth.",
            items: {
                type: Type.OBJECT,
                properties: {
                    label: {
                        type: Type.STRING,
                        description: "Short label naming the visible signal.",
                    },
                    evidence: {
                        type: Type.STRING,
                        description: "One sentence naming visible objects, surfaces, light, layout, or zones.",
                    },
                    impact: {
                        type: Type.STRING,
                        enum: ["positive", "negative", "mixed"],
                    },
                },
                required: ["label", "evidence", "impact"],
            },
        },
        spaceState: {
            type: Type.OBJECT,
            properties: {
                coreGap: {
                    type: Type.STRING,
                    description: "One grounded sentence explaining the gap between the strongest and weakest space-state dimensions.",
                },
            },
            required: ["coreGap"],
        },
        firstShift: {
            type: Type.OBJECT,
            properties: {
                title: {
                    type: Type.STRING,
                    description: "Short title for the one free shift.",
                },
                action: {
                    type: Type.STRING,
                    description: "One practical action sentence that preserves the provided target zone.",
                },
                whyItHelps: {
                    type: Type.STRING,
                    description: "One short sentence tying the action to the selected goal.",
                },
                examples: {
                    type: Type.ARRAY,
                    description: "2-3 short example chips that support the same one free shift without becoming a full plan.",
                    items: { type: Type.STRING },
                },
            },
            required: ["title", "action", "whyItHelps", "examples"],
        },
        brandHook: {
            type: Type.OBJECT,
            properties: {
                title: {
                    type: Type.STRING,
                    description: "Conversion hook title that avoids overpromising.",
                },
                subtitle: {
                    type: Type.STRING,
                    description: "Conversion hook subtitle that names the missing support cue.",
                },
                signals: {
                    type: Type.ARRAY,
                    description: "3 short support signals that stay grounded and do not reveal the full paid report.",
                    items: { type: Type.STRING },
                },
            },
            required: ["title", "subtitle", "signals"],
        },
        preview: {
            type: Type.OBJECT,
            properties: {
                hiddenFindings: {
                    type: Type.ARRAY,
                    description: "Exactly 3 paid-report teasers. They must create curiosity without giving away exact placements, products, budgets, or the full plan.",
                    items: { type: Type.STRING },
                },
                fullReportPromise: {
                    type: Type.STRING,
                    description: "One sentence describing what the full report unlocks.",
                },
            },
            required: ["hiddenFindings", "fullReportPromise"],
        },
    },
    required: [
        "summary",
        "reading",
        "tension",
        "proof",
        "spaceState",
        "firstShift",
        "brandHook",
        "preview",
    ],
};

export const snapshotWriterSchema = {
    type: Type.OBJECT,
    properties: {
        summary: {
            type: Type.OBJECT,
            properties: {
                headline: {
                    type: Type.STRING,
                    description: "One concise diagnostic sentence that keeps the same conclusion while sounding more human and product-quality.",
                },
                body: {
                    type: Type.STRING,
                    description: "A short supporting explanation that stays grounded in the structured room signals and does not turn into a long report.",
                },
            },
            required: ["headline", "body"],
        },
        reading: {
            type: Type.OBJECT,
            properties: {
                oneLiner: {
                    type: Type.STRING,
                    description: "One concise emotionally resonant sentence grounded in the provided snapshot truth.",
                },
                shortParagraph: {
                    type: Type.STRING,
                    description: "A short paragraph that deepens the reading without adding new facts or changing the diagnosis.",
                },
            },
            required: ["oneLiner", "shortParagraph"],
        },
        firstShift: {
            type: Type.OBJECT,
            properties: {
                action: {
                    type: Type.STRING,
                    description: "One practical sentence that keeps the same target zone and action direction.",
                },
                whyItHelps: {
                    type: Type.STRING,
                    description: "One short sentence tying the action back to the selected goal.",
                },
            },
            required: ["action", "whyItHelps"],
        },
        brandHook: {
            type: Type.OBJECT,
            properties: {
                title: {
                    type: Type.STRING,
                    description: "The first half of the brand hook, usually framed as 'not this'.",
                },
                subtitle: {
                    type: Type.STRING,
                    description: "The second half of the brand hook, framed as the clearer missing support cue.",
                },
            },
            required: ["title", "subtitle"],
        },
    },
    required: ["summary", "reading", "firstShift", "brandHook"],
};

export const fullReportWriterSchema = {
    type: Type.OBJECT,
    properties: {
        summary: {
            type: Type.OBJECT,
            properties: {
                overview: {
                    type: Type.STRING,
                    description: "A stronger, more grounded report overview that stays aligned with the existing diagnosis.",
                },
                strategy: {
                    type: Type.STRING,
                    description: "A concise forward-looking strategy line that deepens the deterministic strategy without changing the action order.",
                },
            },
            required: ["overview", "strategy"],
        },
        sections: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    key: {
                        type: Type.STRING,
                        description: "Existing full report section key to update.",
                    },
                    body: {
                        type: Type.STRING,
                        description: "A revised section body that stays specific, grounded, and concise.",
                    },
                },
                required: ["key", "body"],
            },
        },
        stateRitual: {
            type: Type.OBJECT,
            properties: {
                title: {
                    type: Type.STRING,
                    description: "Short ritual module title for the report stage.",
                },
                body: {
                    type: Type.STRING,
                    description: "A grounded but warm ritual paragraph that helps the room action land in the body.",
                },
                feltShiftTitle: {
                    type: Type.STRING,
                    description: "Short title for the felt-change subsection.",
                },
                feltShiftBody: {
                    type: Type.STRING,
                    description: "A concise paragraph naming what the user may notice tonight.",
                },
            },
            required: ["title", "body", "feltShiftTitle", "feltShiftBody"],
        },
    },
    required: ["summary", "sections", "stateRitual"],
};

/**
 * Strict JSON schema for Gemini snapshot output.
 * Aligned with AI_MODEL_PRD v2.0 §6.
 *
 * Enhanced field descriptions guide the AI toward
 * spatially-pinpointed, element-specific output.
 */
export const snapshotSchema = {
    type: Type.OBJECT,
    properties: {
        isRoomPhoto: {
            type: Type.BOOLEAN,
            description: "True only if the image clearly shows an analyzable indoor room or interior living/work space.",
        },
        isUsablePhoto: {
            type: Type.BOOLEAN,
            description: "True only if the room is visible enough to analyze layout, light, clutter, color, or style.",
        },
        validationReason: {
            type: Type.STRING,
            description: "A short end-user reason explaining why the image is valid or why it should be rejected.",
        },
        score: {
            type: Type.INTEGER,
            description: "Overall space balance score from 0 to 100, calculated as a weighted average of the four dimension scores using the goal-specific weights provided in the prompt. Higher = better aligned with user's goal.",
        },
        ratingLabel: {
            type: Type.STRING,
            description: "One of exactly four labels: 'Needs Attention' (0-40), 'Room to Grow' (41-60), 'Well Balanced' (61-80), or 'Harmonized' (81-100).",
        },
        ratingColor: {
            type: Type.STRING,
            description: "Tailwind CSS class matching ratingLabel: 'text-red-500' / 'text-yellow-500' / 'text-green-500' / 'text-purple-500'.",
        },
        archetype: {
            type: Type.STRING,
            description: "A positive, creative title for the space's personality (e.g., 'The High-Energy Thinker', 'The Cozy Cocoon', 'The Creative Hub', 'The Blank Canvas'). Must be encouraging, never negative.",
        },
        archetypeDesc: {
            type: Type.STRING,
            description: "One sentence describing the archetype. Format: '{positive trait of the space} — {growth direction}'. Example: 'A stimulating creative environment — ready to be channeled for deeper focus.'",
        },
        sceneFingerprint: {
            type: Type.ARRAY,
            description: "Exactly 3 short observations that make this room visually unique. Each item must reference a specific object, surface, corner, or spatial condition visible in the photo. Generic statements are forbidden.",
            items: {
                type: Type.STRING,
            },
        },
        primaryTension: {
            type: Type.STRING,
            description: "A single sentence naming the core contradiction between what the room currently signals and the user's stated goal. Must be specific to this photo, not a generic rule.",
        },
        stressImpact: {
            type: Type.STRING,
            description: "1-2 sentences analyzing how the room's weakest dimension impacts the user's specific goal. MUST reference a specific location or object visible in the photo. MUST include a quantified estimate (e.g., 'increasing cognitive switching cost by ~25%'). Format: 'Your [specific element at specific location] is [mechanism of impact] your [goal] goals, [quantified estimate].'",
        },
        freeInsight: {
            type: Type.STRING,
            description: "One immediately actionable, zero-cost piece of advice. MUST reference something visible in the photo. MUST connect to the user's goal. MUST state the expected benefit. Format: '[Action involving specific item in photo] — this alone can [specific benefit with estimated improvement %].'",
        },
        integratedReading: {
            type: Type.STRING,
            description: "A longer 3-5 sentence paragraph that blends design, energy, ritual, and emotional support. It should feel custom to the exact room and can include crystals, incense, or candlelight as supportive layers when appropriate, but must stay anchored to visible evidence.",
        },
        missingElement: {
            type: Type.OBJECT,
            properties: {
                icon: { type: Type.STRING, description: "A single emoji representing the missing element category (💡 for lighting, 🪴 for plants, 📦 for storage, 🎨 for decor, 🛋️ for textiles)" },
                text: { type: Type.STRING, description: "What is missing AND where it should go. Format: '[Specific element type] [for specific location in photo]'. Example: 'A daylight-spectrum desk lamp for the dim workspace area to the left of the window'." }
            },
            required: ["icon", "text"],
        },
        overloadedElement: {
            type: Type.OBJECT,
            properties: {
                icon: { type: Type.STRING, description: "A single emoji representing the overloaded element (📚 for clutter, 🌈 for color chaos, ☀️ for harsh light, 🪑 for style conflict)" },
                text: { type: Type.STRING, description: "What is excessive AND where in the photo. Format: '[Specific issue] [at specific location]'. Example: 'Unsorted papers and devices covering 80% of the desk surface near the window'." }
            },
            required: ["icon", "text"],
        },
        dimensions: {
            type: Type.OBJECT,
            properties: {
                sunlight: {
                    type: Type.OBJECT,
                    properties: {
                        score: { type: Type.INTEGER, description: "Score 0-100 based on visible natural light. Check: window count, light angle, shadow depth, curtain obstruction, artificial light type." },
                        evaluation: { type: Type.STRING, description: "1-2 sentences citing specific light sources, windows, or obstructions VISIBLE in the photo. Never use generic language." }
                    },
                    required: ["score", "evaluation"],
                },
                clutter: {
                    type: Type.OBJECT,
                    properties: {
                        score: { type: Type.INTEGER, description: "Score 0-100 for spatial order. Check: surface coverage %, item count, floor clearance, visual noise level." },
                        evaluation: { type: Type.STRING, description: "1-2 sentences referencing specific surfaces, objects, or areas of clutter VISIBLE in the photo." }
                    },
                    required: ["score", "evaluation"],
                },
                color: {
                    type: Type.OBJECT,
                    properties: {
                        score: { type: Type.INTEGER, description: "Score 0-100 for color harmony relative to user's goal. Check: dominant palette, warm/cool ratio, contrast level, number of competing colors." },
                        evaluation: { type: Type.STRING, description: "1-2 sentences identifying specific colors of walls, furniture, or accents VISIBLE in the photo and how they relate to the user's goal." }
                    },
                    required: ["score", "evaluation"],
                },
                style: {
                    type: Type.OBJECT,
                    properties: {
                        score: { type: Type.INTEGER, description: "Score 0-100 for stylistic cohesion. Check: furniture era/style consistency, material harmony, decorative theme." },
                        evaluation: { type: Type.STRING, description: "1-2 sentences noting specific furniture pieces, materials, or decorations VISIBLE in the photo and their stylistic relationship." }
                    },
                    required: ["score", "evaluation"],
                }
            },
            required: ["sunlight", "clutter", "color", "style"],
        },
        energyFlow: {
            type: Type.OBJECT,
            properties: {
                score: {
                    type: Type.INTEGER,
                    description: "Score 0-100 for how freely attention and movement can travel through the room. Consider entry visibility, blocked corners, furniture pressure, and whether the room can 'breathe'.",
                },
                evaluation: {
                    type: Type.STRING,
                    description: "1-2 sentences describing the energy flow of the space. Must mention a specific path, corner, doorway, or visual blockage visible in the image.",
                },
                blockageZone: {
                    type: Type.STRING,
                    description: "One concise phrase identifying where energy or attention gets stuck in the photo.",
                },
                supportZone: {
                    type: Type.STRING,
                    description: "One concise phrase identifying the area in the room that already feels supportive or restorative.",
                },
            },
            required: ["score", "evaluation", "blockageZone", "supportZone"],
        },
        elementBalance: {
            type: Type.OBJECT,
            properties: {
                score: {
                    type: Type.INTEGER,
                    description: "Score 0-100 for the balance of elemental qualities in the room: wood/growth, fire/vitality, earth/grounding, metal/clarity, water/calm. Use practical modern interpretation, not superstition.",
                },
                missingElement: {
                    type: Type.STRING,
                    description: "The weakest element quality missing from the room, tied to visible evidence in the photo.",
                },
                excessiveElement: {
                    type: Type.STRING,
                    description: "The element quality that feels overrepresented or imbalanced in the photo, tied to visible evidence.",
                },
                recommendation: {
                    type: Type.STRING,
                    description: "A concrete way to rebalance the room using material, color, shape, or object placement. Must reference a specific location.",
                },
            },
            required: ["score", "missingElement", "excessiveElement", "recommendation"],
        },
        wellnessSignals: {
            type: Type.OBJECT,
            properties: {
                score: {
                    type: Type.INTEGER,
                    description: "Score 0-100 for how supportive the room is for nervous-system regulation, emotional recovery, and daily rituals.",
                },
                nervousSystemLoad: {
                    type: Type.STRING,
                    description: "1 sentence describing the main sensory or psychological burden this room may create, using visible evidence.",
                },
                restorativeSupport: {
                    type: Type.STRING,
                    description: "1 sentence describing what in the room already supports calm, focus, or emotional regulation.",
                },
                ritualPotential: {
                    type: Type.STRING,
                    description: "1 sentence suggesting a micro-ritual zone or anchor point that could be created within the visible space.",
                },
            },
            required: ["score", "nervousSystemLoad", "restorativeSupport", "ritualPotential"],
        },
        holisticSupports: {
            type: Type.OBJECT,
            properties: {
                crystalSupport: {
                    type: Type.STRING,
                    description: "A specific crystal or stone suggestion, where it should go, and what energetic or emotional quality it supports. Keep the tone practical and respectful, not absolute or medical.",
                },
                incenseSupport: {
                    type: Type.STRING,
                    description: "A specific incense or aromatic suggestion, such as sandalwood, agarwood, mugwort, or another fitting scent, including where or when to use it.",
                },
                candleSupport: {
                    type: Type.STRING,
                    description: "A specific candle or fire-element suggestion, including its placement and intended mood shift.",
                },
                ritualSupport: {
                    type: Type.STRING,
                    description: "A short ritual suggestion tied to a visible area of the room, such as tea, breathing, journaling, stretching, or a reset practice.",
                },
            },
            required: ["crystalSupport", "incenseSupport", "candleSupport", "ritualSupport"],
        },
        spatialRemedies: {
            type: Type.ARRAY,
            description: "Exactly 2 location-based remedies. Each should identify a zone in the room, what energetic or functional issue is happening there, what to place or change there, and what shift it is expected to create.",
            items: {
                type: Type.OBJECT,
                properties: {
                    zone: {
                        type: Type.STRING,
                        description: "A precise visible zone or directional area in the room, such as 'left-front corner near the chair' or 'wall behind the bed'.",
                    },
                    issue: {
                        type: Type.STRING,
                        description: "What feels weak, stagnant, overactive, cold, harsh, empty, or unsupported in that zone.",
                    },
                    remedy: {
                        type: Type.STRING,
                        description: "What specific object, ritual, or spatial shift should happen there.",
                    },
                    expectedShift: {
                        type: Type.STRING,
                        description: "What emotional, energetic, or functional change this zone-level remedy is expected to create.",
                    },
                    modality: {
                        type: Type.STRING,
                        description: "One of: lighting, crystal, incense, candle, layout, plant, texture, wellness.",
                    },
                },
                required: ["zone", "issue", "remedy", "expectedShift", "modality"],
            },
        },
        preserveWhatWorks: {
            type: Type.STRING,
            description: "One sentence naming a feature that is already helping this room and should be preserved. Must reference something visible in the image.",
        },
        personalizedRecommendations: {
            type: Type.ARRAY,
            description: "Exactly 3 recommendations. They must cover 3 different intervention categories. Lighting can appear at most once, and only if the image shows a clear lighting problem or the room lacks an evening light source. Prefer layout, texture, element, ritual, or wellness interventions before defaulting to lighting. Each recommendation must be anchored to the photo.",
            items: {
                type: Type.OBJECT,
                properties: {
                    category: {
                        type: Type.STRING,
                        description: "One of: layout, lighting, declutter, color, texture, element, wellness, ritual. Across the array, 3 different categories are required.",
                    },
                    title: {
                        type: Type.STRING,
                        description: "A short, specific title for the intervention.",
                    },
                    reason: {
                        type: Type.STRING,
                        description: "Explain why this action matters for this room and this user's goal. Must cite visible evidence.",
                    },
                    action: {
                        type: Type.STRING,
                        description: "Describe the exact action, placement, and suggested element or adjustment.",
                    },
                    expectedBenefit: {
                        type: Type.STRING,
                        description: "Describe the expected emotional, functional, or energy benefit in one sentence.",
                    },
                },
                required: ["category", "title", "reason", "action", "expectedBenefit"],
            },
        },
        overallStrategy: {
            type: Type.STRING,
            description: "A 4-6 sentence strategic roadmap. Structure: (1) Name the unique tension of this room, (2) Identify the top priority shift with exact location, (3) Name a second, different intervention type, (4) Describe one energy or wellness gain, (5) End with a phased path: free shift -> low-cost add-on -> optional upgrade. Must feel custom to the photo.",
        }
    },
    required: [
        "isRoomPhoto",
        "isUsablePhoto",
        "validationReason",
        "score",
        "ratingLabel",
        "ratingColor",
        "archetype",
        "archetypeDesc",
        "sceneFingerprint",
        "primaryTension",
        "stressImpact",
        "freeInsight",
        "integratedReading",
        "missingElement",
        "overloadedElement",
        "dimensions",
        "energyFlow",
        "elementBalance",
        "wellnessSignals",
        "holisticSupports",
        "spatialRemedies",
        "preserveWhatWorks",
        "personalizedRecommendations",
        "overallStrategy",
    ],
};
