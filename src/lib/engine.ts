import {
    SpaceData,
    GoalData,
    PlanStep,
    Product,
    Goal
} from "@/types";

// ==========================================
// 1. Balance Score Calculation (§10.1.1)
// NOTE (V3 UPDATE): This deterministic logic is now a FALLBACK.
// Primary scoring and analysis is handled dynamically by 
// Gemini 1.5 Flash Vision in `/api/analyze/route.ts`.
// ==========================================
export function calculateBalanceScore(space: SpaceData, goal: Goal): number {
    const sunlight = space.sunlight ?? "medium";
    const density = space.density ?? "balanced";
    let score = 0;

    // 1. Sunlight vs Goal (25%)
    // Focus/Energy prefers Medium-High, Sleep/Stress prefers Low-Medium
    let sLightScore = 12.5; // Default mid
    if (goal === "focus" || goal === "energy") {
        sLightScore = sunlight === "high" ? 25 : sunlight === "medium" ? 20 : 10;
    } else { // Sleep/Stress
        sLightScore = sunlight === "low" ? 25 : sunlight === "medium" ? 20 : 10;
    }
    score += sLightScore;

    // 2. Density vs Goal (20%)
    // Focus/Energy prefers Sparse-Balanced, Sleep/Stress prefers Balanced-Dense
    let sDensityScore = 10; // Default mid
    if (goal === "focus" || goal === "energy") {
        sDensityScore = density === "sparse" ? 20 : density === "balanced" ? 15 : 5;
    } else {
        sDensityScore = density === "dense" ? 20 : density === "balanced" ? 15 : 5;
    }
    score += sDensityScore;

    // 3. Color Tone vs Goal (15%)
    let sColorScore = 7.5; // Default mid
    if (space.colorTone) {
        if (goal === "focus" || goal === "energy") {
            sColorScore = ["cool", "neutral"].includes(space.colorTone) ? 15 : 5;
        } else {
            sColorScore = ["warm", "neutral"].includes(space.colorTone) ? 15 : 5;
        }
    }
    score += sColorScore;

    // 4. Layout Flow (20%)
    let sLayoutScore = 10; // Default mid
    if (space.doorPosition && space.windowPosition) {
        if (space.doorPosition === space.windowPosition) sLayoutScore = 5; // Direct line, poor flow
        else sLayoutScore = 15; // Offset, better
        if (space.windowPosition === "none") sLayoutScore = 5; // No natural light flow
    }
    score += sLayoutScore;

    // 5. Goal Match Overall (20%)
    const sGoalScore = (sLightScore / 25) * 10 + (sDensityScore / 20) * 10; // Approximation based on main factors
    score += sGoalScore;

    return Math.round(Math.min(Math.max(score, 0), 100));
}

export function getRatingDetails(score: number): { label: string, color: string } {
    if (score <= 40) return { label: "Needs Attention", color: "text-red-500" };
    if (score <= 60) return { label: "Room to Grow", color: "text-yellow-500" };
    if (score <= 80) return { label: "Well Balanced", color: "text-green-500" };
    return { label: "Harmonized", color: "text-purple-500" };
}

// ==========================================
// 2. Archetype Mapping (§10.1.2)
// NOTE (V3 UPDATE): This deterministic logic is now a FALLBACK.
// Primary archetype matching is handled dynamically by 
// Gemini 1.5 Flash Vision in `/api/analyze/route.ts`.
// ==========================================
export function determineArchetype(space: SpaceData, goal: Goal): { title: string, desc: string } {
    const density = space.density ?? "balanced";
    const light = space.sunlight ?? "medium";

    if (density === "dense" && (goal === "focus" || goal === "energy")) {
        return {
            title: "The Creative Hub",
            desc: "Full of ideas — a few tweaks will sharpen your focus and vitality."
        };
    }
    if (density === "dense" && (goal === "sleep" || goal === "stress")) {
        return {
            title: "The Cozy Collector",
            desc: "Rich in character — strategic edits will unlock flow and peace."
        };
    }
    if (density === "sparse" && ["low", "medium"].includes(light)) {
        return {
            title: "The Blank Canvas",
            desc: "Minimal foundation — ready for intentional upgrades."
        };
    }
    if (["sparse", "balanced"].includes(density) && light === "low" && (goal === "sleep" || goal === "stress")) {
        return {
            title: "The Calm Cocoon",
            desc: "Great for rest — a touch of warmth will complete it."
        };
    }
    // Default or Focus/Energy fallback
    return {
        title: "The High-Energy Thinker",
        desc: "Your space has strong energy but needs grounding."
    };
}


// ==========================================
// 3. 5-Step Plan Generation (§10.1.3 & §12.1)
// ==========================================
export function generatePlan(
    space: SpaceData,
    goalData: GoalData,
    products: Product[]
): PlanStep[] {
    const steps: PlanStep[] = [];
    const goal = goalData.goal;

    // Helper to find one matching product
    const findProduct = (category: string) => {
        return products.find(p =>
            p.category === category &&
            (p.priceTier === goalData.budget || goalData.budget === "low" || goalData.budget === "medium" || goalData.budget === "minimal") &&
            (goalData.style === "none" || p.styleTags.includes(goalData.style)) &&
            (!goalData.renting || p.rentalFriendly)
        ) || products.find(p => p.category === category) || undefined; // Fallback
    };

    // Step 1: Lighting (Driven by sunlight & acceptLighting toggle)
    if (goalData.acceptLighting) {
        if (goal === "focus" && ["high", "medium"].includes(space.sunlight || "")) {
            steps.push({
                id: 1,
                title: "Diffuse Overhead Glare",
                category: "lighting",
                iconName: "Lightbulb",
                reason: `Your room's intense ${space.sunlight} natural light combined with harsh overheads is causing rapid eye strain, acting against your ${goal} goal.`,
                action: "Swap overhead bulbs to 3000K (Warm White) and use a woven or paper lantern shade to scatter light softly.",
                costRange: "~$25",
                productRecommendation: findProduct("lighting")
            });
        } else if (goal === "sleep" && space.density === "sparse") {
            steps.push({
                id: 1,
                title: "Layer Warm Ambient Light",
                category: "lighting",
                iconName: "Lamp",
                reason: `Your ${space.density} room feels stark in the evening. Combining this with your goal of deep rest requires lowering the light horizon.`,
                action: "Add a warm floor lamp or table lamp in the corner. Keep it below eye level to trigger melatonin release.",
                costRange: "~$40",
                productRecommendation: findProduct("lighting")
            });
        }
    }

    // Step 2: Plant / Organic Anchor
    if (goalData.acceptPlants) {
        steps.push({
            id: 2,
            title: "Add Organic Anchors",
            category: "plant",
            iconName: "Leaf",
            reason: `Your current density level (${space.density}) lacks visual softness, leading to a tension-inducing feel when you want to lower your ${goalData.stress}/10 stress level.`,
            action: `Place ONE low-maintenance plant within your peripheral vision when seated in your ${goalData.usage} area.`,
            costRange: "~$20",
            productRecommendation: findProduct("plant")
        });
    }

    // Step 3: Layout Reorientation
    const windowAction = space.windowPosition ? `away from the ${space.windowPosition} window` : "perpendicular to the main light source";
    steps.push({
        id: 3,
        title: "Reorient Primary Axis",
        category: "layout",
        iconName: "ArrowLeftRight",
        reason: `Based on your ${goalData.renting ? "rental constraint" : "space constraint"} and ${space.orientation || "current"} orientation, you might be facing high-glare areas.`,
        action: `Rotate your main furniture ${windowAction}. Avoid putting your back completely to the door to reduce subconscious tension.`,
        costRange: "$0"
    });

    // Step 4: Declutter / Organization
    if (space.density === "dense") {
        steps.push({
            id: 4,
            title: "Remove High-Contrast Clutter",
            category: "declutter",
            iconName: "Crosshair",
            reason: `Your visual overload level is high (${goalData.stress}/10) alongside a ${space.density} setup, which taxes your cognitive bandwidth.`,
            action: "Remove all items from your primary surface except current task tools. Group loose items in one solid-colored tray.",
            costRange: "~$15",
            productRecommendation: findProduct("storage")
        });
    } else {
        steps.push({
            id: 4,
            title: "Introduce Tactile Accessories",
            category: "accessory",
            iconName: "Crosshair",
            reason: `Your ${space.density} environment needs a grounding element to support your ${goal} intent without adding visual noise.`,
            action: "Add a single, high-quality tactile accessory (like a weighted blanket or textured throw) to anchor the body.",
            costRange: "~$45",
            productRecommendation: findProduct("textile")
        });
    }

    // Step 5: Final Check (Filler if steps < 5)
    if (steps.length < 5) {
        steps.push({
            id: 5,
            title: "Define the Entry Boundary",
            category: "layout",
            iconName: "DoorOpen",
            reason: `Since you mentioned ${goalData.concern} as your biggest concern, establishing a clear separation between outside and inside helps.`,
            action: "Clear the immediate 3 feet around your door. Let the entrance breathe to create a psychological transition zone.",
            costRange: "$0"
        });
    }

    // Ensure IDs are sequential and max 5
    return steps.slice(0, 5).map((step, idx) => ({ ...step, id: idx + 1 }));
}
