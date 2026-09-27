# DHRUVA — Complete AI API Inventory

The following table documents the active inventory of all AI, RAG, and Grounding API endpoints across the DHRUVA platform.

| Method | Endpoint | Purpose | Auth | Role | DB Access | AI Service | Frontend Caller | Status |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `GET` | `/api/ai/health` | AI subsystem health & dependency status | None | All | `db.checkHealth()` | `ragService.js` | `apiAiHealth()` | **EXISTS AND WORKS** |
| `POST` | `/api/ai/search` | Weighted hybrid retrieval (0.65 Cosine + 0.35 BM25) | Optional | All | `paper_chunks` | `searchChunks()` | `apiAiSearch()` | **EXISTS AND WORKS** |
| `POST` | `/api/ai/ask` | Section-grounded question answering with provenance | Optional | All | `paper_chunks`, `audit_logs` | `answerQueryAsync()` | `apiAiAsk()` | **EXISTS AND WORKS** |
| `POST` | `/api/rag/ask` | Primary RAG Question Answering pipeline | Optional | All | `paper_chunks`, `audit_logs` | `answerQueryAsync()` | `apiAskRAG()` | **EXISTS AND WORKS** |
| `GET` | `/api/rag/stream` | Server-Sent Events (SSE) token streaming for RAG | Optional | All | `paper_chunks` | `answerQueryAsync()` | EventSource streaming | **EXISTS AND WORKS** |
| `POST` | `/api/ai/summarize` | Multi-language summary, key findings & glossary | Optional | All | `ai_outputs`, `papers` | `aiOutputs` resolver | `apiAiSummarize()` | **EXISTS AND WORKS** |
| `POST` | `/api/ai/claims` | Extracted fact-checked claims with confidence | None | All | `claims`, `verifications` | Section fact extraction | `apiAiClaims()` | **EXISTS AND WORKS** |
| `POST` | `/api/ai/claims/:id/verify` | Admin decision workflow (`Approved`, `Edited`, `Rejected`) | Required | Admin | `claims`, `verifications`, `audit_logs` | Claim grounder | `apiAiVerifyClaim()` | **EXISTS AND WORKS** |
| `POST` | `/api/ai/mcqs/generate` | Grounded educational multiple-choice questions | None | All | `mcqs`, `papers` | MCQ generator | `apiAiGenerateMCQs()` | **EXISTS AND WORKS** |
| `POST` | `/api/ai/flashcards/generate` | Scientific revision flashcards | None | All | `flashcards`, `papers` | Flashcard generator | `apiAiGenerateFlashcards()` | **EXISTS AND WORKS** |
| `POST` | `/api/chat/sessions` | Create persistent multi-turn chat session | Optional | All | `chat_sessions` | Conversational RAG | `apiCreateChatSession()` | **EXISTS AND WORKS** |
| `GET` | `/api/chat/sessions` | List user chat sessions | Optional | All | `chat_sessions` | Session history | `apiFetchChatSessions()` | **EXISTS AND WORKS** |
| `GET` | `/api/chat/sessions/:id/messages` | Retrieve conversation turn history | Optional | All | `chat_messages` | Session history | `apiFetchChatMessages()` | **EXISTS AND WORKS** |
| `POST` | `/api/chat/sessions/:id/messages` | Post user prompt & store grounded citations | Optional | All | `chat_messages`, `chat_sessions` | Grounded dialog | `apiSendChatMessage()` | **EXISTS AND WORKS** |
