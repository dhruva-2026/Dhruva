# Execution Plan — Integrated Polar Science Outreach Portal

Built directly from the Feature Inventory in `architecture.md` §9. MVP features are ordered so a **working, deployable, demoable product exists as early as possible** — Phase 2 "wow" features come last and are explicitly cuttable if time runs short.

Assumptions carried over from `architecture.md` §0: 2–4 person team, 4–6 week MVP window, $0 budget.

---

## PHASE 0 — Foundations & Infra (do not skip, everything depends on this)

### Part 0.1 — Accounts & Environments
- Step 1: Create Supabase project (staging) — enable Postgres + Auth.
- Step 2: Create a second Supabase project (production) — kept empty until launch.
- Step 3: Create Google Cloud project, enable Drive API, create Service Account, download JSON credentials.
- Step 4: Create a Google Drive folder, share it with the Service Account email.
- Step 5: Create free accounts: Render or Railway (backend hosting), Groq or OpenRouter (inference), Sentry (error tracking), UptimeRobot (uptime monitoring), Cloudflare (reverse proxy/rate limiting).
- Step 6: Set up a shared secrets manager (e.g., Render/Railway's built-in env var store) — no secrets ever in the repo. Commit a `.env.example` only.

### Part 0.2 — Repo & Tooling
- Step 1: Initialize monorepo per the folder structure in `architecture.md` §6.
- Step 2: Set up Next.js frontend skeleton + Tailwind.
- Step 3: Set up FastAPI backend skeleton with health-check endpoint.
- Step 4: Connect backend to Supabase (staging) and confirm a round-trip read/write.
- Step 5: Set up CI (GitHub Actions): lint + basic test run on every PR.
- Step 6: Set up the scheduled `pg_dump` backup GitHub Action (production readiness item #1).

### Part 0.3 — Database Schema
- Step 1: Create `users`, `papers`, `paper_ai_outputs`, `media_assets` tables per `architecture.md` §3.
- Step 2: Enable `pgvector` extension, create `paper_chunks` table with `ON DELETE CASCADE`.
- Step 3: Create HNSW index on `paper_chunks.embedding`.
- Step 4: Write and test Row Level Security policies for all 4 roles (admin/editor/scientist/public), including the embargo policy (production readiness item #2).

**Exit criteria for Phase 0:** empty frontend and backend are both deployed and talking to staging Supabase; RLS policies pass a manual test for each role.

---

## PHASE 1 — Core Data Flow (Upload → Store → Retrieve, no AI yet)

### Part 1.1 — Auth & Roles
- Step 1: Scientist signup flow (Supabase Auth) + Admin approval step.
- Step 2: Admin panel: create Editor accounts.
- Step 3: Role-based route guards on frontend (redirect based on `users.role`).

### Part 1.2 — Scientist Dashboard: Upload
- Step 1: File upload UI (PDF, images, video, CSV).
- Step 2: Backend endpoint: receive file → upload to Google Drive via Service Account → get shareable URL.
- Step 3: Save paper metadata + Drive URL into `papers` table.
- Step 4: Embargo date picker on upload form, saved to `embargo_release_date`.
- Step 5: "My Publications" view — list own papers with status (processing/embargoed/published).

### Part 1.3 — Public Landing & Search
- Step 1: Landing page with central search bar (no login).
- Step 2: Search endpoint querying `papers` (respecting RLS embargo filter).
- Step 3: Paper detail page — renders raw PDF link, title, abstract, Drive-hosted media.

### Part 1.4 — Interactive Map
- Step 1: Add `region_lat`/`region_lng` capture to the upload form.
- Step 2: Integrate Leaflet + OpenStreetMap tiles on landing page.
- Step 3: Plot published papers as pins; clicking a pin filters/links to matching papers.

**Exit criteria for Phase 1:** a scientist can upload a paper with location + embargo date, and it correctly appears/hides on the public site based on embargo status. No AI yet — this is the plumbing.

---

## PHASE 2 — AI Processing Pipeline (MVP scope: 3-stage, not 6-agent)

### Part 2.1 — Extraction & Chunking
- Step 1: PDF text extraction (`pdfplumber`/`PyPDF2`).
- Step 2: Section splitting (abstract/methodology/findings/conclusion).
- Step 3: Chunking (~300–500 tokens/chunk) + local embedding (`bge-small-en-v1.5` via `sentence-transformers`, CPU).
- Step 4: Insert chunks + embeddings into `paper_chunks` in the same transaction as the paper metadata update.

### Part 2.2 — Generation
- Step 1: Wire up hosted free-tier inference (Groq or OpenRouter) client in backend.
- Step 2: Prompt + generate: simplified summary, key concepts, MCQs, flashcards (from findings/conclusion sections only, not full PDF).
- Step 3: Prompt + generate: LinkedIn post, X thread, Instagram caption, news story draft.
- Step 4: Prompt + generate: citation (APA/MLA) from extracted metadata.
- Step 5: Bilingual pass — same generation step, explicit Hindi-output prompt variant, stored with `language = 'hi'`.
- Step 6: Store every output in `paper_ai_outputs` with `verified = false` by default.

### Part 2.3 — Lightweight Verification
- Step 1: For each generated claim, check whether key entities/numbers appear in the source chunk it was generated from.
- Step 2: Set `verified = true/false` accordingly — no second full LLM pass for MVP.
- Step 3: Surface `verified` flag in the review UI (Part 2.5).

### Part 2.4 — Job Queue (handles free-tier rate limits)
- Step 1: Add `status` column-based queue table (`queued/processing/done/failed`).
- Step 2: Worker loop (simple polling job, not Celery) that processes queued papers respecting inference RPM limits, with retry on failure.

### Part 2.5 — Human Review Gate
- Step 1: Scientist/Editor review screen showing all generated outputs + `verified` flags per output.
- Step 2: Explicit "Approve & Publish" action — nothing goes public without this.

**Exit criteria for Phase 2:** uploading a paper produces a queued, generated, minimally-verified set of outputs that a human must approve before they appear publicly.

---

## PHASE 3 — Dashboards & Outreach Tools

### Part 3.1 — Student/Public Learning UI
- Step 1: Paper detail page tabs: Simple Summary / Key Concepts / Full Paper.
- Step 2: MCQ quiz component (interactive, scored client-side).
- Step 3: Flashcard component (flip cards).
- Step 4: English/Hindi toggle wired to `paper_ai_outputs.language`.
- Step 5: "Cite This" button rendering stored citation, copy-to-clipboard.

### Part 3.2 — Editor Dashboard
- Step 1: List of un-embargoed, AI-processed papers awaiting content generation.
- Step 2: Display generated LinkedIn/X/Instagram/news drafts with verified flags.
- Step 3: Edit-before-publish text areas (editors can correct AI text).
- Step 4: Media attachment picker pulling from `media_assets` for a given paper.
- Step 5: "Publish" action (marks content ready for external posting — manual copy/paste for MVP, no auto-posting to social platforms).

### Part 3.3 — Admin Dashboard
- Step 1: Editor account creation form.
- Step 2: Scientist signup approval queue.
- Step 3: Storage/quota view (Google Drive usage indicator, Supabase DB size indicator).
- Step 4: Global content moderation: force-unpublish/force-embargo any paper.
- Step 5: Basic audit log view (who uploaded/published what, when).

**Exit criteria for Phase 3:** all 3 authenticated dashboards are functional end-to-end; a full "scientist uploads → AI generates → editor publishes → public reads" loop works without developer intervention.

---

## PHASE 4 — Production Hardening (do before calling this "production," not after)

### Part 4.1 — Security & Reliability
- Step 1: Confirm all secrets are env vars, rotate anything ever committed.
- Step 2: Cloudflare in front of the public site — basic rate limiting rules.
- Step 3: Confirm cascade deletes (paper → Drive file + `paper_chunks`) actually fire in a test.
- Step 4: Sentry wired into both frontend and backend.
- Step 5: UptimeRobot pinging the backend health-check endpoint.

### Part 4.2 — Documentation & Handover
- Step 1: README with setup instructions for a new developer (env vars needed, how to run locally).
- Step 2: Document every free-tier ceiling in one place (already drafted in `architecture.md` §8, item 10) — keep it updated as usage grows.
- Step 3: Record a demo video/walkthrough for pitching.

**Exit criteria for Phase 4:** the product could survive an unexpected traffic spike or a dev leaving the team without falling over or losing data.

---

## PHASE 5 — Cuttable "Wow" Features (only if time remains after Phase 0–4)

Ordered by effort-to-impact ratio, easiest/highest-impact first:

1. Automated media smart-tagging (AI Vision on upload).
2. Instant CSV data visualizer (Recharts on dataset upload).
3. Chrome extension (highlight-to-summarize using the existing Stage 2 generation endpoint).
4. "Chat with the Paper" (RAG query path already described in `architecture.md` §3 — mostly wiring, since `paper_chunks` already exists from Phase 2).
5. One-click press kit generator (.zip bundle).
6. Live polar telemetry dashboard (weather API on landing page).
7. Gamified educator hub (lesson plan PDF export, badges).
8. Full multi-agent critic/orchestration graph (LangGraph) replacing the 3-stage pipeline, if hallucination rate in practice demands it.
9. Storage migration: Google Drive → Cloudflare R2.
10. Vector store migration: pgvector → Qdrant Cloud (only if corpus/latency triggers hit, per `architecture.md` §3).

**Rule for Phase 5: nothing here starts until Phases 0–4 are fully done.** This list exists so scope creep has a home that isn't the MVP timeline.
