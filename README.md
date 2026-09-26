# DHRUVA — Integrated Polar Science Outreach, Knowledge Repository & Media Dissemination Portal
### SIH 2026 Problem Statement SIH26063 — Theme: Smart Education

DHRUVA is an institutional-grade platform connecting India's polar science research (NCPOR / Ministry of Earth Sciences) across the Arctic (Himadri, IndARC) and Antarctic (Maitri, Bharati, Dakshin Gangotri) with three role-based portals: Public Outreach, Researcher Repository, and Admin Grounding Review.

---

## Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node v22.19.0)
- **NPM**: v10+

### 2. Seeding the Database
Run the deterministic seed script to populate 20 synthetic papers, 10 researchers, 10 stations, 146 sections, 69 MCQs, 44 flashcards, Hindi translations, and grounding claims:
```bash
npm run seed
```
*(Or directly: `cd server && npm run seed`)*

### 3. Running the Project Locally
Start both backend (Express on port 5000) and frontend (Vite on port 5173):

In Terminal 1 (Backend API):
```bash
cd server
npm run dev
```

In Terminal 2 (Frontend UI):
```bash
cd client
npm run dev
```

Open your browser at: **`http://localhost:5173`**

---

## Demo Accounts & Evaluator Credentials

The platform features an **Instant SIH Role Switcher** in the top navigation bar for evaluators:

| Role | Name & Affiliation | Email | Password |
|---|---|---|---|
| **Public User** | Public Explorer / Student | *(No login required)* | *(No password)* |
| **Researcher** | Dr. Ananya Sharma (NCPOR Goa) | `dr.ananya@ncaor.gov.in` | `researcher123` |
| **Admin** | Dr. K. Swaminathan (Editorial Reviewer) | `admin@dhruva.gov.in` | `admin123` |

---

## Running Automated Verification Tests
Run the test suite verifying database integrity, embargo security, JWT tokens, and RAG retrieval:
```bash
cd server
node test_suite.js
```

---

## Technical Stack
- **Frontend**: Vite + React 18/19 + TypeScript + Lucide React + Tailwind CSS 4 + Leaflet
- **Backend**: Node.js 22 + Express + SQLite (`node:sqlite`) + JWT RBAC
- **RAG Engine**: Section-aware chunking + 128-dimensional dense semantic vectors + Cosine similarity + BM25 keyword matching
- **Design System**: Polar Arctic Navy (`#060B1E`), Aurora Teal/Cyan (`#00F0FF`), Glacial Ice (`#E2F1FF`)
