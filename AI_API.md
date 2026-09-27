# DHRUVA — AI Subsystem API Reference Manual

This document provides the complete technical specification for all AI and Section-Aware RAG API endpoints available on the **DHRUVA Polar Science Portal**.

---

## 1. AI Health Check

### `GET /api/ai/health`
Checks the operational readiness of the AI subsystem, embedding service, database connection, and configured LLM providers.

- **Authentication:** None (Public)
- **Role:** All
- **Request:** None

#### Response (`200 OK`)
```json
{
  "status": "ok",
  "aiEngine": "DHRUVA Section-Aware Polar RAG",
  "embeddingService": {
    "status": "active",
    "vocabularySize": 58,
    "vectorDimension": 58,
    "normalization": "L2 Unit Normalization",
    "fallback": "3-gram Character Hashing"
  },
  "scoringFormula": "0.65 * Cosine Similarity + 0.35 * Keyword Score",
  "database": {
    "status": "connected",
    "engine": "PostgreSQL / SQLite"
  },
  "liveLlmProvider": "Deterministic Grounded Synthesizer",
  "timestamp": "2026-09-27T13:55:00.000Z"
}
```

---

## 2. Hybrid Semantic & Keyword Search

### `POST /api/ai/search`
Performs multi-document hybrid retrieval across indexed research chunks using weighted cosine vector distance and BM25-inspired term matching.

- **Authentication:** Optional (Embargo filtering automatically applies for public callers)
- **Role:** Public, Researcher, Admin
- **Request Body:**
```json
{
  "query": "IndARC Kongsfjorden Atlantic oceanography",
  "limit": 5,
  "filters": {
    "region": "Arctic",
    "area": "Oceanography"
  }
}
```

#### Response (`200 OK`)
```json
{
  "query": "IndARC Kongsfjorden Atlantic oceanography",
  "total": 4,
  "scoring": "0.65 * Cosine + 0.35 * Keyword",
  "results": [
    {
      "chunkId": "chunk-006-0",
      "paperId": "paper-006",
      "paperTitle": "Atlantic Water Inflow and Deep-Water Mooring Observations at IndARC Observatory, Kongsfjorden",
      "polarRegion": "Arctic",
      "researchArea": "Oceanography",
      "section": "Conclusion",
      "page": 12,
      "snippet": "Year-round multi-depth observatories like IndARC provide irreplaceable data for deciphering the impacts of ocean warming on polar glaciers.",
      "cosineScore": 0.7071,
      "keywordScore": 0.75,
      "hybridScore": 0.7221,
      "confidence": 0.85,
      "provenance": {
        "paperId": "paper-006",
        "paperTitle": "Atlantic Water Inflow and Deep-Water Mooring Observations at IndARC Observatory, Kongsfjorden",
        "sectionName": "Conclusion",
        "pageNumber": 12,
        "confidenceScore": 85
      }
    }
  ]
}
```

---

## 3. Grounded Question Answering (Ask DHRUVA)

### `POST /api/ai/ask`
Answers user questions synthesized strictly from verified polar research papers with complete section and page provenance citations.

- **Authentication:** Optional (Embargo filtering strictly enforced)
- **Role:** All
- **Request Body:**
```json
{
  "query": "What are the main observations from IndARC in Kongsfjorden?",
  "paperId": "paper-006"
}
```

#### Response (`200 OK`)
```json
{
  "answer": "Based on the verified scientific findings documented in \"Atlantic Water Inflow and Deep-Water Mooring Observations at IndARC Observatory, Kongsfjorden\" (Conclusion, Page 12):\n\nYear-round multi-depth observatories like IndARC provide irreplaceable data for deciphering the impacts of ocean warming on polar glaciers.\n\n*Scientific Note: This answer is strictly synthesized from verified research data in the DHRUVA repository with full section and page provenance.*",
  "sources": [
    {
      "paperId": "paper-006",
      "paperTitle": "Atlantic Water Inflow and Deep-Water Mooring Observations at IndARC Observatory, Kongsfjorden",
      "sectionName": "Conclusion",
      "pageNumber": 12,
      "confidenceScore": 85,
      "snippet": "Year-round multi-depth observatories like IndARC provide irreplaceable data..."
    }
  ],
  "confidence": 0.85,
  "retrieval": {
    "sourcesCount": 4,
    "isLlmSynthesized": false,
    "scoringFormula": "0.65 * Cosine + 0.35 * Keyword"
  }
}
```

---

## 4. Multi-Language Paper Summarization

### `POST /api/ai/summarize`
Fetches or generates comprehensive plain-English summaries, Hindi summaries, key findings, and glossary terms for any research paper.

- **Authentication:** Optional
- **Role:** All
- **Request Body:**
```json
{
  "paperId": "paper-006"
}
```

#### Response (`200 OK`)
```json
{
  "paperId": "paper-006",
  "paperTitle": "Atlantic Water Inflow and Deep-Water Mooring Observations at IndARC Observatory, Kongsfjorden",
  "englishSummary": "Moored oceanographic records collected continuously by India's IndARC observatory...",
  "hindiSummary": "भारत की IndARC वेधशाला द्वारा कांग्सफ्योर्डन में समुद्र के भीतर 192 मीटर की गहराई पर...",
  "keyFindings": [
    "Atlantic Water intrusion increased water column temperatures by +2.8°C.",
    "Winter sea-ice formation was delayed by 3 weeks compared to historical baselines."
  ],
  "importantTerms": [
    { "term": "Atlantic Water (AW)", "definition": "Warm, saline water mass originating from the North Atlantic." },
    { "term": "Mooring Observatory", "definition": "Underwater sensor array tethered to seabed." }
  ],
  "whyItMatters": "Demonstrates the direct linkage between Arctic ocean warming and global climate feedback.",
  "socialMediaDraft": "❄️ Discover how India's IndARC mooring in Svalbard is tracking warming Arctic waters!",
  "citationText": "Rao, A. et al. (2024). Atlantic Water Inflow at IndARC. DHRUVA Repository."
}
```

---

## 5. Scientific Claim Extraction & Verification

### `POST /api/ai/claims`
Retrieves all AI fact-checked claims extracted from a research paper with section, page attribution, and confidence scores.

- **Authentication:** None
- **Request Body:**
```json
{
  "paperId": "paper-001"
}
```

---

### `POST /api/ai/claims/:id/verify`
Allows authorized administrators to review, approve, edit, or reject specific AI-extracted claims.

- **Authentication:** Required (`Bearer <token>`)
- **Role:** `admin`
- **Request Body:**
```json
{
  "decision": "Approved",
  "reviewerComment": "Verified against Section 4 Results table."
}
```

#### Response (`200 OK`)
```json
{
  "message": "claim approved successfully.",
  "claimId": "claim-paper-001-1",
  "decision": "Approved",
  "groundingStatus": "Verified"
}
```

---

## 6. Educational Content Generation

### `POST /api/ai/mcqs/generate`
Fetches or generates section-grounded educational multiple choice questions.

- **Request Body:** `{ "paperId": "paper-006" }`
- **Response:** `{ "paperId": "paper-006", "totalMCQs": 2, "mcqs": [ ... ] }`

### `POST /api/ai/flashcards/generate`
Fetches or generates interactive concept revision flashcards.

- **Request Body:** `{ "paperId": "paper-006" }`
- **Response:** `{ "paperId": "paper-006", "totalFlashcards": 2, "flashcards": [ ... ] }`
