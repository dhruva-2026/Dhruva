-- DHRUVA Database Schema
-- SIH26063 - Integrated Polar Science Outreach, Knowledge Repository and Media Dissemination Portal

PRAGMA foreign_keys = ON;

-- 1. Users table (Role-Based Access Control)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('public', 'researcher', 'admin')),
    institution TEXT,
    avatar_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Polar Locations & Research Stations
CREATE TABLE IF NOT EXISTS locations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    region TEXT NOT NULL CHECK(region IN ('Arctic', 'Antarctic')),
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    country TEXT NOT NULL,
    description TEXT NOT NULL,
    station_type TEXT NOT NULL, -- e.g. 'Research Station', 'Mooring / Ocean Observatory', 'Field Camp'
    established_year INTEGER,
    status TEXT DEFAULT 'Active',
    thumbnail_url TEXT,
    is_demo INTEGER DEFAULT 1
);

-- 3. Researchers
CREATE TABLE IF NOT EXISTS researchers (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    institution TEXT NOT NULL,
    designation TEXT NOT NULL,
    research_area TEXT NOT NULL,
    polar_region TEXT NOT NULL CHECK(polar_region IN ('Arctic', 'Antarctic', 'Both')),
    bio TEXT NOT NULL,
    avatar TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 4. Research Papers
CREATE TABLE IF NOT EXISTS papers (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    abstract TEXT NOT NULL,
    authors TEXT NOT NULL, -- JSON array or comma separated
    institution TEXT NOT NULL,
    research_area TEXT NOT NULL,
    polar_region TEXT NOT NULL CHECK(polar_region IN ('Arctic', 'Antarctic')),
    location_id TEXT,
    keywords TEXT NOT NULL, -- Comma-separated or JSON string
    publication_year INTEGER NOT NULL,
    doi TEXT UNIQUE,
    document_url TEXT,
    thumbnail_url TEXT,
    status TEXT NOT NULL CHECK(status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'published', 'embargoed')),
    visibility TEXT NOT NULL CHECK(visibility IN ('public', 'private', 'embargoed', 'scheduled')),
    embargo_enabled INTEGER DEFAULT 0,
    embargo_until DATETIME,
    uploaded_by TEXT NOT NULL,
    rejection_reason TEXT,
    admin_comment TEXT,
    view_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    is_demo INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(location_id) REFERENCES locations(id) ON DELETE SET NULL,
    FOREIGN KEY(uploaded_by) REFERENCES researchers(id) ON DELETE RESTRICT
);

-- 5. Paper Sections (Structured Document Model)
CREATE TABLE IF NOT EXISTS paper_sections (
    id TEXT PRIMARY KEY,
    paper_id TEXT NOT NULL,
    section_name TEXT NOT NULL CHECK(section_name IN ('Abstract', 'Introduction', 'Methodology', 'Study Area', 'Results', 'Discussion', 'Conclusion', 'References')),
    section_order INTEGER NOT NULL,
    content TEXT NOT NULL,
    page_start INTEGER NOT NULL,
    page_end INTEGER NOT NULL,
    FOREIGN KEY(paper_id) REFERENCES papers(id) ON DELETE CASCADE
);

-- 6. Paper Chunks for Semantic Vector RAG
CREATE TABLE IF NOT EXISTS paper_chunks (
    id TEXT PRIMARY KEY,
    paper_id TEXT NOT NULL,
    section_id TEXT NOT NULL,
    section_name TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    text TEXT NOT NULL,
    page_number INTEGER NOT NULL,
    embedding_json TEXT, -- JSON vector string for cosine similarity
    FOREIGN KEY(paper_id) REFERENCES papers(id) ON DELETE CASCADE,
    FOREIGN KEY(section_id) REFERENCES paper_sections(id) ON DELETE CASCADE
);

-- 7. AI Outputs (Simple English Summary, Hindi Summary, Key Findings, Terms, Social Draft)
CREATE TABLE IF NOT EXISTS ai_outputs (
    id TEXT PRIMARY KEY,
    paper_id TEXT UNIQUE NOT NULL,
    english_summary TEXT NOT NULL,
    hindi_summary TEXT NOT NULL,
    key_findings TEXT NOT NULL, -- JSON array string
    important_terms TEXT NOT NULL, -- JSON array string of { term, definition }
    why_it_matters TEXT NOT NULL,
    social_media_draft TEXT NOT NULL,
    citation_text TEXT NOT NULL,
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(paper_id) REFERENCES papers(id) ON DELETE CASCADE
);

-- 8. Educational MCQs
CREATE TABLE IF NOT EXISTS mcqs (
    id TEXT PRIMARY KEY,
    paper_id TEXT NOT NULL,
    question TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_option TEXT NOT NULL CHECK(correct_option IN ('A', 'B', 'C', 'D')),
    explanation TEXT NOT NULL,
    source_section TEXT NOT NULL,
    source_page INTEGER NOT NULL,
    FOREIGN KEY(paper_id) REFERENCES papers(id) ON DELETE CASCADE
);

-- 9. Educational Flashcards
CREATE TABLE IF NOT EXISTS flashcards (
    id TEXT PRIMARY KEY,
    paper_id TEXT NOT NULL,
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    source_section TEXT NOT NULL,
    FOREIGN KEY(paper_id) REFERENCES papers(id) ON DELETE CASCADE
);

-- 10. AI Claims and Grounding Evidence
CREATE TABLE IF NOT EXISTS claims (
    id TEXT PRIMARY KEY,
    paper_id TEXT NOT NULL,
    generated_claim TEXT NOT NULL,
    source_text TEXT NOT NULL,
    source_section TEXT NOT NULL,
    source_page INTEGER NOT NULL,
    confidence_score REAL NOT NULL, -- e.g. 0.94 (94%)
    grounding_status TEXT NOT NULL CHECK(grounding_status IN ('Verified', 'Partially Verified', 'Unsupported', 'Needs Review')),
    decision TEXT DEFAULT 'Pending' CHECK(decision IN ('Pending', 'Approved', 'Edited', 'Rejected')),
    FOREIGN KEY(paper_id) REFERENCES papers(id) ON DELETE CASCADE
);

-- 11. Claim Verifications (Admin Decisions)
CREATE TABLE IF NOT EXISTS verifications (
    id TEXT PRIMARY KEY,
    claim_id TEXT NOT NULL,
    paper_id TEXT NOT NULL,
    reviewer_id TEXT NOT NULL,
    reviewer_comment TEXT,
    decision TEXT NOT NULL CHECK(decision IN ('Approved', 'Edited', 'Rejected')),
    verified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(claim_id) REFERENCES claims(id) ON DELETE CASCADE,
    FOREIGN KEY(paper_id) REFERENCES papers(id) ON DELETE CASCADE,
    FOREIGN KEY(reviewer_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- 12. Embargo Records
CREATE TABLE IF NOT EXISTS embargoes (
    id TEXT PRIMARY KEY,
    paper_id TEXT NOT NULL,
    embargo_enabled INTEGER DEFAULT 1,
    embargo_until DATETIME NOT NULL,
    reason TEXT,
    approved_by TEXT,
    status TEXT DEFAULT 'Active' CHECK(status IN ('Active', 'Released', 'Overridden')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(paper_id) REFERENCES papers(id) ON DELETE CASCADE
);

-- 13. Media Dissemination Records (Polar Stories, Infographics, Imagery)
CREATE TABLE IF NOT EXISTS media (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('Image', 'Video', 'Infographic', 'Expedition Story', 'News')),
    description TEXT NOT NULL,
    thumbnail_url TEXT NOT NULL,
    media_url TEXT,
    region TEXT NOT NULL CHECK(region IN ('Arctic', 'Antarctic', 'Global')),
    location_id TEXT,
    related_paper_id TEXT,
    publication_date DATE NOT NULL,
    status TEXT DEFAULT 'Published',
    is_demo INTEGER DEFAULT 1,
    FOREIGN KEY(location_id) REFERENCES locations(id) ON DELETE SET NULL,
    FOREIGN KEY(related_paper_id) REFERENCES papers(id) ON DELETE SET NULL
);

-- 14. Audit Logs (Tamper-evident system activity logging)
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    actor TEXT NOT NULL,
    role TEXT NOT NULL,
    action TEXT NOT NULL,
    paper_id TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    previous_value TEXT,
    new_value TEXT,
    details TEXT
);

-- 15. Chat Sessions (Persistent Ask DHRUVA conversation history)
CREATE TABLE IF NOT EXISTS chat_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    title TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 16. Chat Messages (Messages within conversation sessions)
CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    sources_json TEXT, -- JSON array of cited sources
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
);

-- Create Indexes for fast querying & search
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
