# ALIGN AI Space Analysis MVP

> An AI-native spatial analysis product that turns a room photo and a user goal into actionable insights.

ALIGN generates two connected outputs:

- **Snapshot** — A concise, evidence-grounded reading with scores, tensions, and a first practical shift
- **Full Report** — An expanded action plan that preserves Snapshot logic instead of generating a disconnected second answer

---

## Architecture

ALIGN deliberately avoids asking one model call to own the whole result. The system uses a multi-layer pipeline:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ALIGN AI Pipeline                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                   │
│  │  Perception   │───▶│ Normalization │───▶│  Reasoning   │                   │
│  │  (Gemini)     │    │  (Schema)     │    │ (Deterministic)│                 │
│  └──────────────┘    └──────────────┘    └──────────────┘                   │
│         │                   │                   │                            │
│         ▼                   ▼                   ▼                            │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                   │
│  │  Vision       │    │  Versioned   │    │  Scores &    │                   │
│  │  Evidence     │    │  Artifacts   │    │  Diagnosis   │                   │
│  └──────────────┘    └──────────────┘    └──────────────┘                   │
│                                                      │                       │
│                                                      ▼                       │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                   │
│  │  Retrieval    │◀───│   Writing    │◀───│  Guardrails  │                   │
│  │  (Knowledge)  │    │  (Writers)   │    │  (Fallbacks) │                   │
│  └──────────────┘    └──────────────┘    └──────────────┘                   │
│         │                   │                   │                            │
│         ▼                   ▼                   ▼                            │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                   │
│  │  Rules &     │    │  Snapshot &  │    │  Quality     │                   │
│  │  Patterns    │    │  Full Report │    │  Protection  │                   │
│  └──────────────┘    └──────────────┘    └──────────────┘                   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        Observability Layer                           │    │
│  │  Artifacts │ Prompt Versions │ Timings │ Job State │ Fallback Usage │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Pipeline Stages

| Stage | Purpose | Technology |
|-------|---------|------------|
| **Perception** | Extract bounded visual evidence from uploaded images | Google Gemini Vision |
| **Normalization** | Convert model output into versioned artifacts | JSON Schema Validation |
| **Reasoning Control** | Calculate scores, priorities, contradictions, pattern diagnosis | Deterministic Builders |
| **Retrieval** | Select room-goal rules, tension patterns, action mappings | Local Knowledge Layer |
| **Writing** | Improve clarity without changing evidence or scores | Dedicated Writer Modules |
| **Guardrails** | Forbid claims, unsupported inferences, enforce limits | Validation & Fallbacks |
| **Observability** | Persist artifacts, timings, job state for debugging | Structured Logging |

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 16, React 19, Tailwind CSS 4 | App Router, Server Components |
| **AI Engine** | Google Gemini via `@google/genai` | Vision analysis, text generation |
| **Database** | Supabase (PostgreSQL) | Auth, storage, real-time |
| **Billing** | Creem | Payment processing |
| **Email** | Resend | Transactional emails |
| **Security** | Cloudflare Turnstile | Bot protection |

---

## Quick Start

```bash
git clone https://github.com/biblehs/align-ai-space-analysis-mvp.git
cd align-ai-space-analysis-mvp
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app runs in demo mode without external credentials — live AI, persistence, and billing require the corresponding environment variables.

---

## Status

**MVP Complete** — A production-shaped reference implementation demonstrating the complete product and AI workflow.

See [SECURITY.md](SECURITY.md) for deployment guidelines.
