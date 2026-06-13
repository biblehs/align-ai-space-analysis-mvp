# SCENE COMMERCE ENGINE PRD

## Purpose

This document defines ALIGN's long-term scene-commerce strategy: turning room understanding into model selection, user-intent matching, and high-quality product recommendation distribution.

It exists because ALIGN is not only a room-analysis tool. In its mature form, it becomes:

- a scene-consumption AI platform
- a channel for personalized product distribution
- a recommendation engine driven by room context, user goals, and evolving taste patterns

## Strategic objective

ALIGN should move from:

- static or semi-static product recommendation lists

to:

- multi-space understanding
- multi-model scene analysis
- user-intent-aware recommendation ranking
- personalized commerce surfaces that improve over time

## End-state vision

The mature system should be able to:

1. understand many kinds of spaces uploaded by one user
2. cluster these spaces into scene types and style signatures
3. choose the best analysis model or prompt strategy per scene
4. infer user preference, budget behavior, and emotional intent
5. rank products, rituals, materials, and upgrades based on true fit
6. improve recommendation quality through interaction feedback

## Core concept: Scene Commerce Graph

ALIGN should eventually model recommendations through the interaction of:

- user profile
- room profile
- scene type
- goal and emotional context
- product metadata
- recommendation model strategy
- commercial performance signals

In other words, the recommendation target is not:

- "show product X to everyone"

It is:

- "for this user, in this room, for this goal, at this budget and style level, what is the most relevant upgrade to show now?"

## Key layers

### 1. User layer

Data to understand:

- long-term goals
- repeated room types
- style affinity
- budget tolerance
- purchase behavior
- provider and acquisition source
- retention and engagement behavior

### 2. Space layer

Each uploaded room should become a structured scene object, not just an image.

Useful dimensions:

- room type
- light profile
- clutter density
- color palette
- style coherence
- support zones
- stress zones
- room function
- wellness friction

### 3. Goal layer

Recommendations should vary based on:

- focus
- sleep
- stress relief
- energy

Later this may expand into:

- work-from-home optimization
- emotional reset
- relationship harmony
- small-space organization
- morning routine support

### 4. Commerce layer

Each recommendation candidate should carry:

- category
- price tier
- room-fit tags
- style tags
- rental friendliness
- emotional-use tags
- energy / wellness tags
- conversion and satisfaction history

## Recommendation evolution stages

### Stage 1: Rule-based recommendation

Current or near-current state:

- use simple business logic
- map dimensions and goals to product categories
- use curated product lists

Best for:

- MVP
- explainability
- control

### Stage 2: Scene-conditioned ranking

Next state:

- use room pre-analysis plus goal data
- score products based on scene fit
- rank products, not just filter them

Best for:

- better relevance
- improved conversion
- better merchant or affiliate yield

### Stage 3: Model-routing recommendation engine

More advanced state:

- choose different analysis or recommendation models by room type, quality, or user segment
- use different prompt strategies by goal, style, and intent

Examples:

- small, cluttered workspace may use a stronger functional optimization model
- calm bedroom may use a softer ritual-and-rest model
- image-poor uploads may use a lightweight fallback ranking model

### Stage 4: Feedback-trained recommendation system

Longer-term state:

- learn from clicks
- learn from purchases
- learn from save / dismiss behavior
- learn from repeated room uploads

This allows:

- better ranking
- product-person fit learning
- personalized recommendation distribution

## Why this document needs to exist separately

This layer crosses multiple systems:

- product rules
- AI prompt design
- backend model routing
- data analytics
- monetization

If it only lives inside AI or backend docs, the commercial objective will stay fragmented.

## Core system objects to define

### User taste profile

A reusable user-level object summarizing:

- preferred style direction
- dominant room patterns
- tolerated budget range
- preferred categories
- historical conversions

### Room scene profile

A reusable room-level object summarizing:

- scene type
- spatial pressures
- upgrade priorities
- likely product-fit areas

### Recommendation candidate

Each product or upgrade should be scored by:

- scene fit
- goal fit
- style fit
- budget fit
- rental fit
- confidence score
- expected outcome
- expected conversion value

### Recommendation explanation

Every surfaced recommendation should ideally answer:

- why this item
- why this room
- why now

## Model-routing framework

ALIGN should eventually support multiple recommendation strategies, for example:

- `vision_scene_fast`
- `wellness_sleep_bias`
- `focus_functional_bias`
- `budget_minimalist_bias`
- `fallback_text_only`
- `multi-room_user_profile_ranker`

Routing inputs may include:

- upload quality
- room type
- goal
- user history
- product surface
- latency budget

## Recommendation surfaces

Recommendations should not live only in the final report.

They can appear in:

- snapshot upgrade teaser
- full report sections
- account re-engagement flows
- admin or CRM export tools
- email follow-up recommendations
- multi-room comparison surfaces

## Data requirements

This strategy requires more than basic analytics.

You should eventually track:

- recommendation impressions
- recommendation clicks
- recommendation saves
- recommendation dismissals
- purchase conversion by recommendation type
- purchase conversion by room type
- purchase conversion by goal type
- repeat recommendation performance per user

## Commerce metrics

Important KPIs:

- recommendation CTR
- recommendation-to-checkout conversion
- checkout-to-purchase conversion
- average order value by scene type
- revenue per analysis
- revenue per active user
- recommendation precision by room category

## Document dependencies

This file should stay aligned with:

- [01_PRODUCT_RULES_PRD.md](../../docs/system/01_PRODUCT_RULES_PRD.md)
- [02_AI_SYSTEM_PRD.md](../../docs/system/02_AI_SYSTEM_PRD.md)
- [04_BACKEND_ARCHITECTURE_PRD.md](../../docs/system/04_BACKEND_ARCHITECTURE_PRD.md)
- [07_DATA_ANALYTICS_PRD.md](../../docs/system/07_DATA_ANALYTICS_PRD.md)

## Next implementation implications

To support this strategy, the system will later need:

- richer room scene objects
- recommendation-scoring services
- product metadata expansion
- recommendation event tracking
- possibly a dedicated `recommendation_candidates` or `recommendation_events` table
- user-level taste profile aggregation

## Design rule

Recommendations should feel:

- personalized
- contextual
- low-friction
- non-spammy
- clearly useful in the room the user actually showed

The system should recommend less, but better.
