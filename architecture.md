# Architecture — Integrated Polar Science Outreach Portal

## 0. Assumptions (stated explicitly — correct if wrong)
- Team size: 2–4 people, no dedicated DevOps/GPU budget.
- Timeline: MVP demo-ready in 4–6 weeks.
- Budget: $0. Every service below has a free tier that covers MVP load.
- Primary goal: a **working, deployed, demoable product** — not a feature-complete platform.
- "No paid API keys" is honored, but resolved as **hosted free-tier open-weight inference**, not truly self-hosted LLMs on a free web container (see §4 for why, and the two real options).

---

## 1. High-Level System Overview

Three planes of the system:

1. **Public Plane** (no login) — landing page, search, interactive map, paper detail pages, AI summaries/quizzes/citations, Chrome extension.
2. **Authenticated Plane** (login required) — Scientist Dashboard, Editor Dashboard, Admin Dashboard.
3. **AI Processing Plane** — the agent pipeline that turns a raw uploaded paper into summaries, quizzes, social posts, and translations.

```
                       ┌───────────────────────────┐
                       │        Public Plane        │
                       │  Landing / Search / Map /  │
                       │  Paper Page / Chrome Ext   │
                       └─────────────┬───────────────┘
                                     │ reads
                                     ▼
                       ┌───────────────────────────┐
                       │   Supabase (Postgres+Auth) │◄──────┐
                       └─────────────┬───────────────┘      │
                                     │ file URLs             │ writes
                                     ▼                       │
                       ┌───────────────────────────┐         │
                       │   Google Drive (file store)│         │
                       └───────────────────────────┘         │
                                                              │
   ┌────────────┐   uploads    ┌──────────────┐   triggers   │
   │  Scientist  │────────────►│   FastAPI     │──────────────┘
   │  Dashboard  │              │   Backend    │
   └────────────┘              └──────┬───────┘
                                       │ orchestrates
                                       ▼
                       ┌───────────────────────────┐
                       │   AI Agent Pipeline        │
                       │  (extract→verify→generate) │
                       └───────────────────────────┘
                                       │ results
                                       ▼
   ┌────────────┐              ┌──────────────┐
   │   Editor    │◄─────────────┤ Supabase DB  │
   │  Dashboard  │  reads posts └──────────────┘
   └────────────┘
```

---

## 2. Tech Stack (final decision, with reasons)

| Layer | Choice | Why |
|---|---|---|
| Frontend | **Next.js (React) + Tailwind CSS** | SSR for public pages (SEO for outreach matters), file-based routing fits 3 dashboards + public site cleanly, huge ecosystem for map/chart libs. |
| Database | **Supabase (Postgres)** | Free tier: 500MB DB, 50k MAU auth, built-in Row Level Security for 3-role access control, native `pgvector` for future "chat with paper" RAG. |
| Auth | **Supabase Auth** | Email/password out of the box, RLS ties directly to `role` column — no custom auth code needed. |
| File storage | **Google Drive API (Service Account)** | Free 15GB, MVP-only. **Migration path documented**: swap to Supabase Storage or S3-compatible (Cloudflare R2 free tier) post-MVP without touching DB schema (we only ever store a URL). |
| Backend | **Python FastAPI** | Best PDF/text extraction ecosystem, async-friendly for chaining agent calls, auto Swagger docs for team collaboration. |
| Backend hosting | **Render or Railway free web service** | Free tier for a lightweight API server (not for running LLM weights — see §4). |
| AI inference | **Hosted free-tier open-weight models** — see §4 | Resolves the "no paid key" requirement without the GPU contradiction. |
| Orchestration | **Plain async Python pipeline (no LangGraph/CrewAI for MVP)** | 3–4 sequential functions with Pydantic schemas. Add LangGraph later only if you need conditional branching/loops. |
| Charting (CSV visualizer, if built) | **Recharts** | Works cleanly in React, minimal setup. |
| Map (geospatial search) | **Leaflet.js + OpenStreetMap tiles** | Free, no API key, unlike Google Maps. |
| Translation (English/Hindi) | Handled inside the AI generation step, same model, explicit prompt — no separate translation API needed. |
| Vector store (RAG) | **pgvector extension inside the same Supabase Postgres DB** | Same DB as everything else → transactional consistency (delete a paper, its vectors go with it in one transaction), no second service to deploy/monitor/pay for. Sufficient performance (HNSW/IVFFlat index) at realistic MVP corpus size (hundreds–low thousands of chunks). Migration trigger to a dedicated vector DB (Qdrant Cloud free tier) documented below if corpus/latency outgrows it. |
| Embeddings | **`bge-small-en-v1.5` or `all-MiniLM-L6-v2` via `sentence-transformers`, run in-process on the FastAPI backend (CPU)** | Embedding models are small enough to run on a free CPU container — unlike generation models. No API key, no GPU, no contradiction with the free-hosting constraint. |

---

## 3. Data Model (Supabase / Postgres)

```
users
 ├─ id (uuid, from Supabase auth)
 ├─ role (enum: admin | editor | scientist)
 ├─ name, email, created_at

papers
 ├─ id
 ├─ scientist_id (fk → users)
 ├─ title, abstract_raw
 ├─ drive_file_url        -- pointer to Google Drive, not the file itself
 ├─ region_lat, region_lng, region_name   -- for the map
 ├─ status (enum: processing | embargoed | published)
 ├─ embargo_release_date (nullable)
 ├─ created_at

paper_ai_outputs
 ├─ id
 ├─ paper_id (fk → papers)
 ├─ type (enum: summary_simple | summary_key_concepts | mcq | flashcards |
   linkedin_post | twitter_thread | instagram_caption | news_story | citation)
 ├─ language (enum: en | hi)
 ├─ content (jsonb)
 ├─ verified (boolean)     -- set by the lightweight fact-check step
 ├─ created_at

media_assets
 ├─ id
 ├─ paper_id (fk, nullable)
 ├─ drive_file_url
 ├─ type (photo | video)
 ├─ tags (text[])

paper_chunks                          -- pgvector table, powers "Chat with the Paper" RAG
 ├─ id
 ├─ paper_id (fk → papers)
 ├─ section (enum: abstract | methodology | findings | conclusion | other)
 ├─ chunk_text (text)
 ├─ embedding (vector(384))           -- 384 dims for bge-small / all-MiniLM-L6-v2
 ├─ created_at
```

Rule: **the database never stores raw files** — only metadata + Drive URLs. This is the load-bearing architectural decision that keeps Postgres free-tier viable.

### pgvector setup notes
- Enable once per project: `create extension if not exists vector;`
- Index: `create index on paper_chunks using hnsw (embedding vector_cosine_ops);` — HNSW over IVFFlat for better recall at small-to-medium scale without needing to retune `lists` as the corpus grows.
- Chunking happens in **Stage 1 (Extract & Chunk)** of the AI pipeline (§4) — each section is split into ~300–500 token chunks, embedded locally, and inserted alongside the existing metadata insert for that paper, in the same DB transaction as the `papers` row update. This is what keeps deletes clean: `ON DELETE CASCADE` from `papers.id` to `paper_chunks.paper_id` removes vectors automatically when a paper is removed — no orphaned embeddings.
- Query path for "Chat with the Paper": embed the user's question (same local model) → `ORDER BY embedding <=> query_embedding LIMIT 5` → pass only those 5 chunks (not the whole paper) into the generation call. This is also what keeps the chat feature cheap on the free-tier inference rate limits.
- **Migration trigger to Qdrant Cloud (free tier, 1GB)**: only if the corpus exceeds ~5,000 chunks or query latency becomes noticeable — not before. Same embedding vectors, different client library; no re-embedding needed.

---

## 4. AI Processing Pipeline — the part that needed fixing

### The contradiction in the original discussion
"Run open-source models locally, no API keys" + "host everything for free on Render/Railway" cannot both be true. Free web containers are CPU-only, ~512MB–1GB RAM. A 7–8B parameter model will not run at usable latency there, if it loads at all.

### The two real options (pick one for MVP)

**Option A — Hosted free-tier open-weight inference (recommended for MVP)**
Use a provider that serves open models (Llama 3.1, Mistral, Qwen) over an API, on a free tier:
- Groq (free tier, extremely fast inference on Llama/Mixtral)
- OpenRouter (free-tier models available)
This keeps "not a paid proprietary key" true in spirit, avoids GPU hosting entirely, and is a two-line swap if you later want your own model.

**Option B — Actually self-hosted, accepted trade-off**
Run Ollama on a machine you control (a spare GPU machine, a free Colab session used as an offline batch worker, or a paid GPU box later). FastAPI calls this endpoint instead of a public API. This is the "purist" version of the original ask, but it is not compatible with a $0, always-on, free-hosted demo — flag this clearly to your team before committing to it.

**Decision for this plan: Option A**, documented here so it isn't silently reverted later.

### Pipeline (simplified from 6 agents to 3 stages for MVP)
```
Stage 1 — Extract & Chunk
  Input: raw PDF
  Tool: pdfplumber / PyPDF2
  Output: structured sections (abstract, findings, conclusion) + metadata

Stage 2 — Generate (single well-scoped prompt per output type)
  Input: relevant section only (not the whole PDF)
  Output: summary / MCQs / flashcards / social posts / citation
  Each output type = its own prompt + own model call (this is what actually
  fixes context overload — scoping input per task, not spinning up 6 agents)

Stage 3 — Lightweight verify
  Input: generated claim + source chunk
  Output: boolean "grounded" flag stored in paper_ai_outputs.verified
  Cheap check: does the claim's key entities/numbers appear in the source
  chunk? Not a full second LLM pass unless MVP timeline allows it.
```
A full multi-agent critic/orchestration graph (LangGraph, CrewAI) is documented as a **Phase 2** upgrade in `plan.md`, not part of MVP.

---

## 5. Role-Based Access (RBAC)

| Role | Created by | Access |
|---|---|---|
| Admin | Seeded manually (not via signup) | Full DB access, creates Editor accounts, approves Scientist signups, can force-unpublish anything |
| Scientist | Self-signup, admin-approved | Upload/manage own papers & media, set embargo date |
| Editor | Created by Admin | View un-embargoed papers, generate/publish social content |
| Public | No account | Read-only: search, map, paper detail pages, AI outputs, citation, Chrome extension |

Enforced via Supabase **Row Level Security policies**, not application-layer checks alone.

---

## 6. Folder Structure

```
polar-portal/
├── frontend/                    # Next.js
│   ├── app/
│   │   ├── (public)/
│   │   │   ├── page.tsx                 # landing + search + map
│   │   │   └── paper/[id]/page.tsx      # paper detail + AI tabs
│   │   ├── (auth)/
│   │   │   ├── admin/
│   │   │   ├── editor/
│   │   │   └── scientist/
│   │   └── layout.tsx
│   ├── components/
│   │   ├── map/            # Leaflet map + pins
│   │   ├── paper/          # summary tabs, quiz, flashcards, citation button
│   │   └── shared/
│   └── lib/supabaseClient.ts
│
├── backend/                      # FastAPI
│   ├── main.py
│   ├── routers/
│   │   ├── papers.py
│   │   ├── media.py
│   │   └── auth.py
│   ├── services/
│   │   ├── drive_service.py      # upload/download to Google Drive
│   │   ├── pdf_extractor.py
│   │   └── ai_pipeline/
│   │       ├── extract.py
│   │       ├── generate.py
│   │       └── verify.py
│   └── models/                   # Pydantic schemas
│
├── chrome-extension/              # Manifest V3
│   ├── manifest.json
│   ├── content_script.js          # captures highlighted text
│   ├── popup/
│   └── background.js              # calls backend API
│
├── docs/
│   ├── architecture.md
│   ├── plan.md
│   └── progress.md
│
└── README.md
```

---

## 7. Database Choice — SQL, Decided

**SQL (Postgres), not NoSQL.** The data is inherently relational: users→roles, scientists→papers, papers→AI outputs, papers→media, embargo logic dependent on dates, and RLS policies that must check role + ownership + embargo status in a single query — exactly what joins/constraints are for, and exactly what NoSQL is weak at. NoSQL only wins with unstable schemas or fully independent documents; neither applies here. One well-modeled Postgres DB (Supabase) is more production-grade than a SQL+NoSQL hybrid that now needs to be kept in sync. No second database is introduced for RAG either — see §3 (pgvector, same DB).

---

## 8. Production Readiness Checklist (non-negotiable, not hackathon-only)

These are the things a "hackathon MVP" typically skips that a **production MVP** cannot:

1. **Backups.** Supabase free tier has no point-in-time recovery. Add a scheduled `pg_dump` via GitHub Actions cron (free) pushed to a durable location (e.g., a private repo artifact or free-tier object storage). Without this, one bad migration or accidental delete = permanent data loss.
2. **Embargo enforced at the database layer, never the frontend.** RLS policy: `status != 'embargoed' OR embargo_release_date <= now()`. A UI toggle that merely hides embargoed content while the API still returns it is not embargo — it's theater.
3. **Rate limiting on all public (no-login) endpoints.** Search and paper-detail pages have no natural abuse throttle. Put Cloudflare (free) in front as a reverse proxy for basic rate limiting and DDoS protection before going public.
4. **Secrets hygiene.** Google service account JSON, Supabase service key, inference API keys — environment variables in Render/Railway's secret store only, never committed. Ship a `.env.example`, gitignore the real `.env`, rotate any key that ever touched a commit.
5. **Human review gate before any AI output goes public.** A hallucinated statistic in a public science summary is a credibility/misinformation problem, not just a bug. Nothing auto-publishes — Scientist/Editor must explicitly approve. Surface the `verified` flag from `paper_ai_outputs` in the review UI so reviewers can see what wasn't grounded against source text.
6. **A job queue for AI processing, not synchronous calls.** Free-tier hosted inference (Groq/OpenRouter) has requests-per-minute caps. Use a simple Postgres table with a `status` column (`queued | processing | done | failed`) as the queue — do not reach for Celery/Redis at this scale. Uploads queue and retry instead of failing outright when limits are hit.
7. **Orphan cleanup on delete.** Deleting a `papers` row must cascade to its Drive file (via API call in the same request) and its `paper_chunks` vectors (via `ON DELETE CASCADE`, already in schema). Otherwise the free 15GB Drive quota fills with dead files silently.
8. **Staging vs production separation.** Two free Supabase projects (staging/prod) so schema changes and AI pipeline experiments never touch real user data.
9. **Monitoring, for free.** Sentry free tier for backend error tracking; a free uptime monitor (UptimeRobot or Better Uptime) pinging the API. An unattended AI pipeline fails silently if nothing is watching it.
10. **State every free-tier ceiling explicitly, in writing.** Supabase: 500MB DB / 50k MAU auth. Google Drive: 15GB per account + API rate limits. Groq/OpenRouter: requests-per-minute caps. Render/Railway free instance: cold-start spin-down after inactivity. A production plan that hides its limits isn't more credible — it's just dishonest about when real money will be needed.

---

## 9. Full Feature Inventory (everything discussed, mapped to plane + phase)

| # | Feature | Plane | MVP or Phase 2 |
|---|---|---|---|
| 1 | Landing page: public search bar, no forced login | Public | MVP |
| 2 | Scientist signup/login (Admin-approved) | Auth | MVP |
| 3 | Admin creates Editor accounts | Admin | MVP |
| 4 | Digital repository: upload/manage papers, datasets, photos, videos | Scientist | MVP |
| 5 | Advanced public search | Public | MVP |
| 6 | Interactive expedition map (geospatial search, Leaflet) | Public | MVP |
| 7 | AI document understanding (extract → generate → verify pipeline) | AI | MVP (3-stage version) |
| 8 | Student/public learning tools: layered summaries, MCQs, flashcards | Public | MVP |
| 9 | Editor AI content generator: LinkedIn/X/Instagram/news drafts | Editor | MVP |
| 10 | Bilingual English/Hindi toggle | Public + Editor | MVP |
| 11 | Automated citation generator (APA/MLA) | Public | MVP |
| 12 | Embargo & access control (release date gating) | Scientist + DB | MVP |
| 13 | Chrome extension: highlight-to-summarize on external sites | Public | Phase 2 |
| 14 | "Chat with the Paper" (RAG via pgvector) | Public | Phase 2 |
| 15 | Automated media smart-tagging (AI Vision) | Scientist | Phase 2 |
| 16 | One-click press kit generator (.zip bundle) | Editor | Phase 2 |
| 17 | Instant CSV data visualizer (Recharts) | Public/Scientist | Phase 2 |
| 18 | Live polar telemetry dashboard (weather API) | Public | Phase 2 |
| 19 | Gamified educator hub (lesson plan PDF, badges) | Public | Phase 2 |
| 20 | Full multi-agent critic/orchestration graph (LangGraph) | AI | Phase 2 |
| 21 | Migration: Google Drive → S3-compatible storage (Cloudflare R2) | Infra | Phase 2 |
| 22 | Migration: pgvector → Qdrant Cloud (if corpus/latency demands it) | Infra | Phase 2 (conditional) |

This table is the single source of truth for what's in MVP scope — `plan.md` and `progress.md` are built directly from it.
