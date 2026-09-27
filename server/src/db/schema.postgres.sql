-- DHRUVA PostgreSQL Production Database Schema
-- SIH26063 - Integrated Polar Science Outreach, Knowledge Repository and Media Dissemination Portal

-- 0. Optional: Enable pgvector extension if installed
DO $$ 
BEGIN 
  CREATE EXTENSION IF NOT EXISTS vector;
EXCEPTION WHEN OTHERS THEN 
  RAISE NOTICE 'pgvector extension not installed on host, using native PostgreSQL JSON vector storage.';
END $$;

-- 1. Users table (Role-Based Access Control)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL CHECK(role IN ('public', 'researcher', 'admin')),
    institution VARCHAR(255),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Polar Locations & Research Stations
CREATE TABLE IF NOT EXISTS locations (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    region VARCHAR(32) NOT NULL CHECK(region IN ('Arctic', 'Antarctic')),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    country VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    station_type VARCHAR(255) NOT NULL,
    established_year INTEGER,
    status VARCHAR(64) DEFAULT 'Active',
    thumbnail_url TEXT,
    is_demo INTEGER DEFAULT 1
);

-- 3. Researchers
CREATE TABLE IF NOT EXISTS researchers (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    institution VARCHAR(255) NOT NULL,
    designation VARCHAR(255) NOT NULL,
    research_area VARCHAR(255) NOT NULL,
    polar_region VARCHAR(32) NOT NULL CHECK(polar_region IN ('Arctic', 'Antarctic', 'Both')),
    bio TEXT NOT NULL,
    avatar TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Research Papers
CREATE TABLE IF NOT EXISTS papers (
    id VARCHAR(64) PRIMARY KEY,
    title TEXT NOT NULL,
    abstract TEXT NOT NULL,
    authors TEXT NOT NULL,
    institution VARCHAR(255) NOT NULL,
    research_area VARCHAR(255) NOT NULL,
    polar_region VARCHAR(32) NOT NULL CHECK(polar_region IN ('Arctic', 'Antarctic')),
    location_id VARCHAR(64) REFERENCES locations(id) ON DELETE SET NULL,
    keywords TEXT NOT NULL,
    publication_year INTEGER NOT NULL,
    doi VARCHAR(255) UNIQUE,
    document_url TEXT,
    thumbnail_url TEXT,
    status VARCHAR(32) NOT NULL CHECK(status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'published', 'embargoed')),
    visibility VARCHAR(32) NOT NULL CHECK(visibility IN ('public', 'private', 'embargoed', 'scheduled')),
    embargo_enabled INTEGER DEFAULT 0,
    embargo_until TIMESTAMPTZ,
    uploaded_by VARCHAR(64) REFERENCES researchers(id) ON DELETE RESTRICT,
    rejection_reason TEXT,
    admin_comment TEXT,
    view_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    is_demo INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. Paper Sections (Structured Document Model)
CREATE TABLE IF NOT EXISTS paper_sections (
    id VARCHAR(64) PRIMARY KEY,
    paper_id VARCHAR(64) NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
    section_name VARCHAR(64) NOT NULL CHECK(section_name IN ('Abstract', 'Introduction', 'Methodology', 'Study Area', 'Results', 'Discussion', 'Conclusion', 'References')),
    section_order INTEGER NOT NULL,
    content TEXT NOT NULL,
    page_start INTEGER NOT NULL,
    page_end INTEGER NOT NULL
);

-- 6. Paper Chunks for Semantic Vector RAG
CREATE TABLE IF NOT EXISTS paper_chunks (
    id VARCHAR(64) PRIMARY KEY,
    paper_id VARCHAR(64) NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
    section_id VARCHAR(64) NOT NULL REFERENCES paper_sections(id) ON DELETE CASCADE,
    section_name VARCHAR(64) NOT NULL,
    chunk_index INTEGER NOT NULL,
    text TEXT NOT NULL,
    page_number INTEGER NOT NULL,
    embedding_json TEXT
);

-- 7. AI Outputs
CREATE TABLE IF NOT EXISTS ai_outputs (
    id VARCHAR(64) PRIMARY KEY,
    paper_id VARCHAR(64) UNIQUE NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
    english_summary TEXT NOT NULL,
    hindi_summary TEXT NOT NULL,
    key_findings TEXT NOT NULL,
    important_terms TEXT NOT NULL,
    why_it_matters TEXT NOT NULL,
    social_media_draft TEXT NOT NULL,
    citation_text TEXT NOT NULL,
    generated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 8. Educational MCQs
CREATE TABLE IF NOT EXISTS mcqs (
    id VARCHAR(64) PRIMARY KEY,
    paper_id VARCHAR(64) NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_option CHAR(1) NOT NULL CHECK(correct_option IN ('A', 'B', 'C', 'D')),
    explanation TEXT NOT NULL,
    source_section VARCHAR(64) NOT NULL,
    source_page INTEGER NOT NULL
);

-- 9. Educational Flashcards
CREATE TABLE IF NOT EXISTS flashcards (
    id VARCHAR(64) PRIMARY KEY,
    paper_id VARCHAR(64) NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    source_section VARCHAR(64) NOT NULL
);

-- 10. AI Claims and Grounding Evidence
CREATE TABLE IF NOT EXISTS claims (
    id VARCHAR(64) PRIMARY KEY,
    paper_id VARCHAR(64) NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
    generated_claim TEXT NOT NULL,
    source_text TEXT NOT NULL,
    source_section VARCHAR(64) NOT NULL,
    source_page INTEGER NOT NULL,
    confidence_score REAL NOT NULL,
    grounding_status VARCHAR(64) NOT NULL CHECK(grounding_status IN ('Verified', 'Partially Verified', 'Unsupported', 'Needs Review')),
    decision VARCHAR(64) DEFAULT 'Pending' CHECK(decision IN ('Pending', 'Approved', 'Edited', 'Rejected'))
);

-- 11. Claim Verifications (Admin Decisions)
CREATE TABLE IF NOT EXISTS verifications (
    id VARCHAR(64) PRIMARY KEY,
    claim_id VARCHAR(64) NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
    paper_id VARCHAR(64) NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
    reviewer_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    reviewer_comment TEXT,
    decision VARCHAR(64) NOT NULL CHECK(decision IN ('Approved', 'Edited', 'Rejected')),
    verified_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 12. Embargo Records
CREATE TABLE IF NOT EXISTS embargoes (
    id VARCHAR(64) PRIMARY KEY,
    paper_id VARCHAR(64) NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
    embargo_enabled INTEGER DEFAULT 1,
    embargo_until TIMESTAMPTZ NOT NULL,
    reason TEXT,
    approved_by VARCHAR(255),
    status VARCHAR(64) DEFAULT 'Active' CHECK(status IN ('Active', 'Released', 'Overridden')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 13. Media Dissemination Records
CREATE TABLE IF NOT EXISTS media (
    id VARCHAR(64) PRIMARY KEY,
    title TEXT NOT NULL,
    type VARCHAR(64) NOT NULL CHECK(type IN ('Image', 'Video', 'Infographic', 'Expedition Story', 'News')),
    description TEXT NOT NULL,
    thumbnail_url TEXT NOT NULL,
    media_url TEXT,
    region VARCHAR(32) NOT NULL CHECK(region IN ('Arctic', 'Antarctic', 'Global')),
    location_id VARCHAR(64) REFERENCES locations(id) ON DELETE SET NULL,
    related_paper_id VARCHAR(64) REFERENCES papers(id) ON DELETE SET NULL,
    publication_date DATE NOT NULL,
    status VARCHAR(64) DEFAULT 'Published',
    is_demo INTEGER DEFAULT 1
);

-- 14. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    actor VARCHAR(255) NOT NULL,
    role VARCHAR(64) NOT NULL,
    action VARCHAR(255) NOT NULL,
    paper_id VARCHAR(64),
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    previous_value TEXT,
    new_value TEXT,
    details TEXT
);

-- 15. Chat Sessions
CREATE TABLE IF NOT EXISTS chat_sessions (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 16. Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id VARCHAR(64) PRIMARY KEY,
    session_id VARCHAR(64) NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(32) NOT NULL CHECK(role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    sources_json TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Optimized Performance Indexes
CREATE INDEX IF NOT EXISTS idx_papers_status ON papers(status);
CREATE INDEX IF NOT EXISTS idx_papers_region ON papers(polar_region);
CREATE INDEX IF NOT EXISTS idx_papers_area ON papers(research_area);
CREATE INDEX IF NOT EXISTS idx_papers_year ON papers(publication_year);
CREATE INDEX IF NOT EXISTS idx_sections_paper ON paper_sections(paper_id);
CREATE INDEX IF NOT EXISTS idx_chunks_paper ON paper_chunks(paper_id);
CREATE INDEX IF NOT EXISTS idx_claims_paper ON claims(paper_id);
CREATE INDEX IF NOT EXISTS idx_audit_paper ON audit_logs(paper_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);
