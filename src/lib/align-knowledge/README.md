# ALIGN Knowledge Module

This folder contains the structured knowledge system used for lightweight retrieval and prompt injection.

Scope:

- Used only for the second AI call (`snapshot writer layer`)
- Not used for the first image-analysis call
- Kept separate from generic prompt and builder logic so the knowledge system can evolve without polluting product code

Contents:

- `content/*.json` — structured domain knowledge
- `content/brand_voice_rules.ts` — ALIGN voice boundaries
- `content/healing_expression_whitelist.json` — approved healing-language usage by report stage
- `content/state_ritual_module_rules.json` — reusable ritual-module rules for state landing after space shifts
- `content/state_contradiction_types.json` — canonical contradiction patterns for the tension-map middle layer
- `content/confidence_rules.json` — low-claim and uncertainty rules
- `content/forbidden_claims.md` — prohibited interpretation boundaries
- `types.ts` — knowledge file contracts
- `knowledge-schema.ts` — runtime validation for all knowledge files
- `version.ts` — knowledge version stamp for preview/eval/debug output
- `retrieval.ts` — lightweight rule-based selection for the writer layer
- `index.ts` — consolidated exports

Operational notes:

- Knowledge files are validated at runtime on import. Invalid content should fail fast.
- Preview tooling exposes `knowledgeHits` so retrieval behavior can be inspected without guessing.
- The current knowledge version is exported as `ALIGN_KNOWLEDGE_VERSION`.

Design rule:

The knowledge system should help the writer layer sound more professional, more consistent, and more aligned with the product. It should never give the model permission to invent facts that are not present in the structured truth layer.

Healing-expression rule:

- Healing language is allowed only as emotional translation and brand tone.
- It must not be used as analytical evidence, scoring logic, or causal proof.
- The current policy targets roughly 15-25% of the total copy, with the rest remaining observational and explanatory.
