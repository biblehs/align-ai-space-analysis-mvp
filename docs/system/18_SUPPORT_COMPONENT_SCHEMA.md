# Support Component Schema

## Purpose

This document defines the front-end field schema for support recommendation surfaces shown after Snapshot or Full Report.

The support layer should feel like a continuation of the report, not a generic shopping module.

---

## 1. Snapshot Support Module

```ts
type SnapshotSupportModule = {
  eyebrow: string;
  title: string;
  description: string;
  whyThisFitsTitle: string;
  whyThisFitsBody: string;
  ctaPrimary: string;
  ctaSecondary?: string;
  footerNote?: string;
};
```

Use case:
- one lightweight support recommendation after Snapshot
- should point to a single, most relevant support path

---

## 2. Full Report Support Module

```ts
type FullReportSupportModule = {
  eyebrow: string;
  title: string;
  description: string;
  primarySupportId: string;
  secondarySupportIds: string[];
  trustLayer: {
    title: string;
    body: string;
    tags: string[];
  };
};
```

Use case:
- one primary support
- up to two optional supports
- one explicit trust layer to avoid feeling like generic commerce

---

## 3. Support Card

```ts
type SupportCard = {
  id: string;
  name: string;
  oneLiner: string;
  whyThisMattersTitle: string;
  whyThisMattersBody: string;
  whatItHelpsShift: string[];
  bestFor: string;
  ctaPrimary: string;
  ctaSecondary?: string;
  productExplanationCard: ProductExplanationCard;
};
```

Use case:
- primary or secondary recommendation cards
- headline should describe the support layer, not the product category

---

## 4. Product Explanation Card

```ts
type ProductExplanationCard = {
  title: string;
  body: string;
  supports: string[];
  bestWhen: string;
};
```

Use case:
- appears on support detail page or product cards
- answers "why this helps your room"
- must be tied to the room state, not generic shopping copy

---

## 5. Kit Card

```ts
type SupportKit = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  goodFor: string;
  containsDirections: string[];
  ctaPrimary: string;
  ctaSecondary?: string;
};
```

Use case:
- bundle-level recommendation
- should feel like a support set for the room's current state

---

## 6. CTA Library

```ts
type SupportCtaLibrary = {
  snapshot: string[];
  fullReport: string[];
  kit: string[];
  productCard: string[];
};
```

Use case:
- central CTA inventory for experimentation
- helps keep CTA tone product-led rather than store-led

---

## 7. Brand Line

```ts
type SupportBrandLine = {
  headline: string;
  body: string;
};
```

Use case:
- reusable bridge between analysis and support layer
- helps explain why support recommendations exist at all

---

## 8. Recommended UI Composition

### Snapshot

1. Support intro
2. Single primary support card
3. One CTA path

### Full Report

1. Support intro
2. Primary support card
3. Two secondary support cards
4. Optional kit entry
5. Trust layer

### Support Detail

1. Support explanation
2. Why this helps your room
3. Product cards with explanation cards
4. Kit cross-sell

---

## 9. Guardrails

- Do not label this surface as `Shop` in the first interaction layer.
- Do not present products before the report has established a problem and a priority.
- Do not recommend products as decoration fixes.
- Do recommend supports as tools that make the chosen shift easier to land.
- Keep the primary support aligned to the room's top leverage point.
