# Tension Map

This module creates ALIGN's middle layer between raw room signals and final user-facing copy.

Flow:

1. room facts and user inputs become `AlignInput`
2. `AlignInput` is reduced into a `TensionMap`
3. snapshot / full report / progress report can later consume `TensionMap`

Why this exists:

- avoids collapsing every room into generic actions
- keeps "why this room feels this way" separate from "how we phrase it"
- gives the product a stronger paid-value layer: mechanism, prioritization, and tradeoffs

Current scope:

- `buildAlignInput(...)`
- `buildTensionMap(...)`

Boundary:

- this layer should stay deterministic
- writer models may phrase the tension map more gracefully, but should not invent it
