# Progress Tracker — Integrated Polar Science Outreach Portal

Mirrors `plan.md` exactly. Every phase/part/step here maps 1:1 to `plan.md`.
Update this file directly as work completes — this is the team's single source of truth for "what's actually done" vs. "what's planned."

**Legend:** `[ ]` not started · `[~]` in progress · `[x]` done · `[!]` blocked (note why next to it)

**Last updated:** _(update this line every time the file changes)_
**Overall status:** Not started

---

## PHASE 0 — Foundations & Infra
**Status:** [ ] Not started

### Part 0.1 — Accounts & Environments
- [ ] Step 1: Supabase project (staging) created, Postgres + Auth enabled
- [ ] Step 2: Supabase project (production) created, kept empty
- [ ] Step 3: Google Cloud project + Drive API + Service Account + JSON credentials
- [ ] Step 4: Google Drive folder created and shared with Service Account
- [ ] Step 5: Free accounts created — Render/Railway, Groq/OpenRouter, Sentry, UptimeRobot, Cloudflare
- [ ] Step 6: Secrets manager set up, `.env.example` committed, no real secrets in repo

### Part 0.2 — Repo & Tooling
- [ ] Step 1: Monorepo initialized per `architecture.md` §6 folder structure
- [ ] Step 2: Next.js frontend skeleton + Tailwind
- [ ] Step 3: FastAPI backend skeleton + health-check endpoint
- [ ] Step 4: Backend ↔ Supabase (staging) round-trip confirmed
- [ ] Step 5: CI (GitHub Actions) — lint + test on every PR
- [ ] Step 6: Scheduled `pg_dump` backup Action set up

### Part 0.3 — Database Schema
- [ ] Step 1: `users`, `papers`, `paper_ai_outputs`, `media_assets` tables created
- [ ] Step 2: `pgvector` enabled, `paper_chunks` table created with `ON DELETE CASCADE`
- [ ] Step 3: HNSW index on `paper_chunks.embedding`
- [ ] Step 4: RLS policies written + tested for all 4 roles, including embargo policy

**Phase 0 exit criteria met?** [ ] Empty frontend + backend deployed and talking to staging Supabase; RLS manually verified per role.

---

## PHASE 1 — Core Data Flow
**Status:** [ ] Not started

### Part 1.1 — Auth & Roles
- [ ] Step 1: Scientist signup + Admin approval flow
- [ ] Step 2: Admin panel — create Editor accounts
- [ ] Step 3: Role-based route guards on frontend

### Part 1.2 — Scientist Dashboard: Upload
- [ ] Step 1: File upload UI (PDF/images/video/CSV)
- [ ] Step 2: Backend upload → Google Drive → shareable URL
- [ ] Step 3: Save metadata + Drive URL to `papers`
- [ ] Step 4: Embargo date picker wired to `embargo_release_date`
- [ ] Step 5: "My Publications" status view

### Part 1.3 — Public Landing & Search
- [ ] Step 1: Landing page with central search bar
- [ ] Step 2: Search endpoint (RLS-respecting embargo filter)
- [ ] Step 3: Paper detail page (PDF link, abstract, media)

### Part 1.4 — Interactive Map
- [ ] Step 1: Lat/lng capture on upload form
- [ ] Step 2: Leaflet + OpenStreetMap integrated
- [ ] Step 3: Pins plotted, click-to-filter working

**Phase 1 exit criteria met?** [ ] Scientist can upload with location + embargo; public visibility correctly gated by embargo status.

---

## PHASE 2 — AI Processing Pipeline (3-stage MVP)
**Status:** [ ] Not started

### Part 2.1 — Extraction & Chunking
- [ ] Step 1: PDF text extraction wired up
- [ ] Step 2: Section splitting implemented
- [ ] Step 3: Chunking + local embedding (`bge-small-en-v1.5`/`all-MiniLM-L6-v2`, CPU)
- [ ] Step 4: Chunks + embeddings inserted transactionally with paper metadata

### Part 2.2 — Generation
- [ ] Step 1: Hosted free-tier inference client wired (Groq/OpenRouter)
- [ ] Step 2: Summary / key concepts / MCQs / flashcards generation
- [ ] Step 3: LinkedIn / X thread / Instagram / news story generation
- [ ] Step 4: Citation generation (APA/MLA)
- [ ] Step 5: Bilingual (Hindi) generation pass
- [ ] Step 6: All outputs stored in `paper_ai_outputs`, `verified = false` default

### Part 2.3 — Lightweight Verification
- [ ] Step 1: Entity/number grounding check implemented
- [ ] Step 2: `verified` flag set per output
- [ ] Step 3: `verified` flag surfaced in review UI

### Part 2.4 — Job Queue
- [ ] Step 1: `status` column-based queue table
- [ ] Step 2: Polling worker respecting inference RPM limits, with retry

### Part 2.5 — Human Review Gate
- [ ] Step 1: Review screen showing outputs + verified flags
- [ ] Step 2: "Approve & Publish" explicit action implemented

**Phase 2 exit criteria met?** [ ] Upload → queued → generated → minimally verified → requires human approval before going public.

---

## PHASE 3 — Dashboards & Outreach Tools
**Status:** [ ] Not started

### Part 3.1 — Student/Public Learning UI
- [ ] Step 1: Summary/Key Concepts/Full Paper tabs
- [ ] Step 2: MCQ quiz component
- [ ] Step 3: Flashcard component
- [ ] Step 4: English/Hindi toggle
- [ ] Step 5: "Cite This" button + copy-to-clipboard

### Part 3.2 — Editor Dashboard
- [ ] Step 1: List of un-embargoed, processed papers
- [ ] Step 2: Display generated drafts with verified flags
- [ ] Step 3: Edit-before-publish text areas
- [ ] Step 4: Media attachment picker
- [ ] Step 5: "Publish" action (manual copy/paste for MVP)

### Part 3.3 — Admin Dashboard
- [ ] Step 1: Editor account creation form
- [ ] Step 2: Scientist signup approval queue
- [ ] Step 3: Storage/quota view (Drive + Supabase)
- [ ] Step 4: Global moderation (force-unpublish/embargo)
- [ ] Step 5: Basic audit log view

**Phase 3 exit criteria met?** [ ] Full scientist→AI→editor→public loop works without developer intervention.

---

## PHASE 4 — Production Hardening
**Status:** [ ] Not started

### Part 4.1 — Security & Reliability
- [ ] Step 1: Secrets confirmed as env vars only, rotated if ever committed
- [ ] Step 2: Cloudflare rate limiting rules in front of public site
- [ ] Step 3: Cascade deletes tested (paper → Drive file + chunks)
- [ ] Step 4: Sentry wired into frontend + backend
- [ ] Step 5: UptimeRobot monitoring backend health-check

### Part 4.2 — Documentation & Handover
- [ ] Step 1: README with local setup instructions
- [ ] Step 2: Free-tier ceilings documented and kept current
- [ ] Step 3: Demo video/walkthrough recorded

**Phase 4 exit criteria met?** [ ] Product survives a traffic spike or a dev leaving without falling over or losing data.

---

## PHASE 5 — Cuttable "Wow" Features
**Status:** [ ] Not started — do not begin until Phases 0–4 are fully checked off

- [ ] 1. Automated media smart-tagging (AI Vision on upload)
- [ ] 2. Instant CSV data visualizer (Recharts)
- [ ] 3. Chrome extension (highlight-to-summarize)
- [ ] 4. "Chat with the Paper" (RAG query path)
- [ ] 5. One-click press kit generator (.zip)
- [ ] 6. Live polar telemetry dashboard (weather API)
- [ ] 7. Gamified educator hub (lesson plan PDF, badges)
- [ ] 8. Full multi-agent critic/orchestration graph (LangGraph)
- [ ] 9. Storage migration: Google Drive → Cloudflare R2
- [ ] 10. Vector store migration: pgvector → Qdrant Cloud (only if triggered)

---

## Decision Log (key calls made during planning — don't relitigate without reason)
- SQL (Postgres/Supabase) over NoSQL — data is relational, RLS needs joins.
- pgvector in same DB over separate vector service — avoids sync/consistency issues at MVP scale.
- Hosted free-tier inference (Groq/OpenRouter) over self-hosted local LLMs — free web hosting has no GPU; self-hosting would break the "always-on free demo" requirement.
- Embeddings run in-process on CPU (`bge-small-en-v1.5`) — small enough to not need the inference API.
- 3-stage AI pipeline (extract → generate → verify-lite) over 6-agent LangGraph orchestration for MVP — full agent graph deferred to Phase 5, only if hallucination rate demands it.
- Google Drive for files is MVP-only, explicitly not a production-final decision — migration path to Cloudflare R2 documented.
- No public/student dashboard — public features live on the open site, not behind login.
- Nothing auto-publishes — human approval gate required for all AI-generated public content.
