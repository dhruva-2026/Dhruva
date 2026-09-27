/**
 * DHRUVA PostgreSQL Seed Script
 * Migrates & populates all 20 research papers, 10 researchers, 10 locations,
 * 80+ structured sections, 65+ MCQs, 50+ 3D flashcards, bilingual summaries,
 * and grounding claims directly into PostgreSQL.
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const pg = require('./postgres.js');
const { generateEmbedding } = require('../services/ragService.js');
const { generateDocumentArtifacts } = require('../services/aiGenerator.js');

async function seedPostgres() {
  console.log('🌱 Starting DHRUVA PostgreSQL seeding into dhruva_db...');

  // 1. Reset tables
  await pg.execute('DELETE FROM chat_messages;');
  await pg.execute('DELETE FROM chat_sessions;');
  await pg.execute('DELETE FROM verifications;');
  await pg.execute('DELETE FROM claims;');
  await pg.execute('DELETE FROM mcqs;');
  await pg.execute('DELETE FROM flashcards;');
  await pg.execute('DELETE FROM ai_outputs;');
  await pg.execute('DELETE FROM paper_chunks;');
  await pg.execute('DELETE FROM paper_sections;');
  await pg.execute('DELETE FROM embargoes;');
  await pg.execute('DELETE FROM media;');
  await pg.execute('DELETE FROM audit_logs;');
  await pg.execute('DELETE FROM papers;');
  await pg.execute('DELETE FROM researchers;');
  await pg.execute('DELETE FROM locations;');
  await pg.execute('DELETE FROM users;');

  const passwordHash = bcrypt.hashSync('admin123', 10);
  const researcherHash = bcrypt.hashSync('researcher123', 10);

  // 2. Users
  const users = [
    { id: 'usr-admin-1', name: 'Dr. K. Swaminathan (Admin Reviewer)', email: 'admin@dhruva.gov.in', password_hash: passwordHash, role: 'admin', institution: 'NCPOR / Ministry of Earth Sciences' },
    { id: 'usr-res-1', name: 'Dr. Ananya Sharma', email: 'dr.ananya@ncaor.gov.in', password_hash: researcherHash, role: 'researcher', institution: 'National Centre for Polar and Ocean Research (NCPOR), Goa' },
    { id: 'usr-res-2', name: 'Dr. Arjun Rao', email: 'arjun.rao@iitr.ac.in', password_hash: researcherHash, role: 'researcher', institution: 'Department of Earth Sciences, IIT Roorkee' },
    { id: 'usr-res-3', name: 'Dr. Meera Sen', email: 'meera.sen@iiserpune.ac.in', password_hash: researcherHash, role: 'researcher', institution: 'Center for Climate & Environmental Studies, IISER Pune' },
    { id: 'usr-res-4', name: 'Dr. Rohan Das', email: 'rohan.das@nio.res.in', password_hash: researcherHash, role: 'researcher', institution: 'CSIR - National Institute of Oceanography (NIO), Goa' },
    { id: 'usr-res-5', name: 'Dr. Vikram Nair', email: 'vikram.nair@sac.isro.gov.in', password_hash: researcherHash, role: 'researcher', institution: 'Space Applications Centre (ISRO), Ahmedabad' },
    { id: 'usr-res-6', name: 'Dr. Sunita Kulkarni', email: 'sunita.k@imd.gov.in', password_hash: researcherHash, role: 'researcher', institution: 'India Meteorological Department (IMD), New Delhi' },
    { id: 'usr-res-7', name: 'Dr. Rajeshwari Menon', email: 'r.menon@bhu.ac.in', password_hash: researcherHash, role: 'researcher', institution: 'Banaras Hindu University, Dept of Geophysics' },
    { id: 'usr-res-8', name: 'Dr. Amitav Ghosh', email: 'amitav.ghosh@iisc.ac.in', password_hash: researcherHash, role: 'researcher', institution: 'Divecha Centre for Climate Change, IISc Bengaluru' },
    { id: 'usr-res-9', name: 'Dr. Preeti Varma', email: 'preeti.varma@wadia.res.in', password_hash: researcherHash, role: 'researcher', institution: 'Wadia Institute of Himalayan Geology' },
    { id: 'usr-res-10', name: 'Dr. Tariq Al-Mansoor', email: 'tariq.m@ncpor.res.in', password_hash: researcherHash, role: 'researcher', institution: 'National Centre for Polar and Ocean Research (NCPOR), Goa' },
    { id: 'usr-pub-1', name: 'Siddharth Patel (Student Explorer)', email: 'student@dhruva.edu', password_hash: researcherHash, role: 'public', institution: 'Delhi University' }
  ];

  for (const u of users) {
    await pg.execute(
      `INSERT INTO users (id, name, email, password_hash, role, institution) VALUES (?, ?, ?, ?, ?, ?)`,
      [u.id, u.name, u.email, u.password_hash, u.role, u.institution]
    );
  }

  // 3. Locations
  const locations = [
    { id: 'loc-1', name: 'Maitri Research Station', region: 'Antarctic', latitude: -70.7667, longitude: 11.7333, country: 'India', description: "India's second permanent Antarctic research station in Schirmacher Oasis.", station_type: 'Research Station', established_year: 1989, status: 'Active', thumbnail_url: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?w=800&auto=format&fit=crop' },
    { id: 'loc-2', name: 'Bharati Research Station', region: 'Antarctic', latitude: -69.4069, longitude: 76.1908, country: 'India', description: "India's third modern Antarctic station located in Larsemann Hills beside Prydz Bay.", station_type: 'Research Station', established_year: 2012, status: 'Active', thumbnail_url: 'https://images.unsplash.com/photo-1483181957632-8bda974cbc91?w=800&auto=format&fit=crop' },
    { id: 'loc-3', name: 'Himadri Research Station', region: 'Arctic', latitude: 78.9236, longitude: 11.9099, country: 'India', description: "India's first permanent Arctic research station located at Ny-Ålesund, Svalbard (Norway).", station_type: 'Research Station', established_year: 2008, status: 'Active', thumbnail_url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop' },
    { id: 'loc-4', name: 'Dakshin Gangotri (Historical Base)', region: 'Antarctic', latitude: -70.0833, longitude: 12.0000, country: 'India', description: "India's historic first Antarctic base established in 1983.", station_type: 'Field Camp', established_year: 1983, status: 'Decommissioned / Historic', thumbnail_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop' },
    { id: 'loc-5', name: 'IndARC Deep Water Mooring Observatory', region: 'Arctic', latitude: 79.0000, longitude: 11.5000, country: 'India', description: "India's underwater multi-sensor moored observatory deployed at Kongsfjorden at 192m depth.", station_type: 'Mooring / Ocean Observatory', established_year: 2014, status: 'Active', thumbnail_url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&auto=format&fit=crop' },
    { id: 'loc-6', name: 'Kongsfjorden Glacier Front Transect', region: 'Arctic', latitude: 78.9500, longitude: 12.1000, country: 'Norway', description: "Tidewater glacier margin exhibiting high calving rates and meltwater plumes.", station_type: 'Field Camp', established_year: 2010, status: 'Active', thumbnail_url: 'https://images.unsplash.com/photo-1517760444937-f6397edcbbcd?w=800&auto=format&fit=crop' },
    { id: 'loc-7', name: 'Prydz Bay Marine Ecosystem Station', region: 'Antarctic', latitude: -68.5000, longitude: 75.0000, country: 'India', description: "Southern Ocean marine research sector covering coastal diatoms and krill swarms.", station_type: 'Mooring / Ocean Observatory', established_year: 2013, status: 'Active', thumbnail_url: 'https://images.unsplash.com/photo-1559827291-72ee739d0d9a?w=800&auto=format&fit=crop' },
    { id: 'loc-8', name: 'Schirmacher Oasis Glaciological Grid', region: 'Antarctic', latitude: -70.7500, longitude: 11.7000, country: 'India', description: "Ice-free plateau covering approximately 35 sq km with over 100 periglacial lakes.", station_type: 'Field Camp', established_year: 1988, status: 'Active', thumbnail_url: 'https://images.unsplash.com/photo-1465056836041-7f43ac27dcb5?w=800&auto=format&fit=crop' },
    { id: 'loc-9', name: 'Ny-Ålesund International Polar Village', region: 'Arctic', latitude: 78.9250, longitude: 11.9300, country: 'Norway', description: "Northernmost civilian settlement hosting polar science teams from 11 nations.", station_type: 'Research Station', established_year: 1968, status: 'Active', thumbnail_url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop' },
    { id: 'loc-10', name: 'Weddell Sea Sea-Ice Observation Sector', region: 'Antarctic', latitude: -72.0000, longitude: -45.0000, country: 'International', description: "Crucial sea-ice gyre and Southern Ocean polynya zone.", station_type: 'Mooring / Ocean Observatory', established_year: 2015, status: 'Active', thumbnail_url: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?w=800&auto=format&fit=crop' }
  ];

  for (const loc of locations) {
    await pg.execute(
      `INSERT INTO locations (id, name, region, latitude, longitude, country, description, station_type, established_year, status, thumbnail_url, is_demo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [loc.id, loc.name, loc.region, loc.latitude, loc.longitude, loc.country, loc.description, loc.station_type, loc.established_year, loc.status, loc.thumbnail_url]
    );
  }

  // 4. Researchers
  const researchers = [
    { id: 'res-1', user_id: 'usr-res-1', name: 'Dr. Ananya Sharma', email: 'dr.ananya@ncaor.gov.in', institution: 'National Centre for Polar and Ocean Research (NCPOR), Goa', designation: 'Senior Scientist (Glaciology & Cryosphere)', research_area: 'Glaciology', polar_region: 'Both', bio: 'Lead investigator for Antarctic ice shelf stability.', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop' },
    { id: 'res-2', user_id: 'usr-res-2', name: 'Dr. Arjun Rao', email: 'arjun.rao@iitr.ac.in', institution: 'Department of Earth Sciences, IIT Roorkee', designation: 'Associate Professor (Polar Oceanography)', research_area: 'Oceanography', polar_region: 'Antarctic', bio: 'Specialist in Southern Ocean circulation and autonomous gliders.', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop' },
    { id: 'res-3', user_id: 'usr-res-3', name: 'Dr. Meera Sen', email: 'meera.sen@iiserpune.ac.in', institution: 'Center for Climate & Environmental Studies, IISER Pune', designation: 'Principal Investigator (Polar Atmospheric Science)', research_area: 'Atmospheric Science', polar_region: 'Arctic', bio: 'Expert on atmospheric aerosols and Arctic amplification.', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop' },
    { id: 'res-4', user_id: 'usr-res-4', name: 'Dr. Rohan Das', email: 'rohan.das@nio.res.in', institution: 'CSIR - National Institute of Oceanography (NIO), Goa', designation: 'Senior Principal Scientist (Marine Biology)', research_area: 'Polar Biology', polar_region: 'Antarctic', bio: 'Pioneering marine biologist studying Antarctic krill dynamics.', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop' },
    { id: 'res-5', user_id: 'usr-res-5', name: 'Dr. Vikram Nair', email: 'vikram.nair@sac.isro.gov.in', institution: 'Space Applications Centre (ISRO), Ahmedabad', designation: 'Group Director (Polar Remote Sensing)', research_area: 'Remote Sensing', polar_region: 'Both', bio: 'Space scientist utilizing SAR and altimetry data.', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop' },
    { id: 'res-6', user_id: 'usr-res-6', name: 'Dr. Sunita Kulkarni', email: 'sunita.k@imd.gov.in', institution: 'India Meteorological Department (IMD), New Delhi', designation: 'Scientist F (Polar Meteorology & Ozone)', research_area: 'Climate Science', polar_region: 'Antarctic', bio: 'Specialist in Antarctic ozone hole recovery dynamics.', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop' },
    { id: 'res-7', user_id: 'usr-res-7', name: 'Dr. Rajeshwari Menon', email: 'r.menon@bhu.ac.in', institution: 'Banaras Hindu University, Dept of Geophysics', designation: 'Professor (Permafrost & Geomagnetism)', research_area: 'Geology', polar_region: 'Arctic', bio: 'GPR surveys of permafrost active-layer thickness.', avatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=400&auto=format&fit=crop' },
    { id: 'res-8', user_id: 'usr-res-8', name: 'Dr. Amitav Ghosh', email: 'amitav.ghosh@iisc.ac.in', institution: 'Divecha Centre for Climate Change, IISc Bengaluru', designation: 'Associate Professor (Cryosphere Dynamics)', research_area: 'Cryosphere', polar_region: 'Antarctic', bio: 'Numerical modeler focusing on subglacial meltwater channels.', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&auto=format&fit=crop' },
    { id: 'res-9', user_id: 'usr-res-9', name: 'Dr. Preeti Varma', email: 'preeti.varma@wadia.res.in', institution: 'Wadia Institute of Himalayan Geology', designation: 'Senior Geochemist (Polar Organic Carbon)', research_area: 'Environmental Science', polar_region: 'Both', bio: 'Investigates black carbon deposition on polar snowfields.', avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&auto=format&fit=crop' },
    { id: 'res-10', user_id: 'usr-res-10', name: 'Dr. Tariq Al-Mansoor', email: 'tariq.m@ncpor.res.in', institution: 'National Centre for Polar and Ocean Research (NCPOR), Goa', designation: 'Lead Astrobiologist & Microbiologist', research_area: 'Polar Biology', polar_region: 'Antarctic', bio: 'Discovered novel psychrophilic bacterial enzymes in Lake Priyadarshini.', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop' }
  ];

  for (const r of researchers) {
    await pg.execute(
      `INSERT INTO researchers (id, user_id, name, email, institution, designation, research_area, polar_region, bio, avatar)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [r.id, r.user_id, r.name, r.email, r.institution, r.designation, r.research_area, r.polar_region, r.bio, r.avatar]
    );
  }

  // 5. Seed 20 Papers with 8 structured sections, 5 MCQs, 5 flashcards, claims, and bilingual summaries
  const { BACKUP_PAPERS } = require('../../client/src/data/backupPapers.js');
  console.log(`📚 Inserting ${BACKUP_PAPERS.length} research papers and relational entities into PostgreSQL...`);

  for (const p of BACKUP_PAPERS) {
    await pg.execute(
      `INSERT INTO papers (id, title, abstract, authors, institution, research_area, polar_region, location_id, keywords, publication_year, doi, document_url, thumbnail_url, status, visibility, embargo_enabled, embargo_until, uploaded_by, rejection_reason, admin_comment, view_count, download_count, is_demo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        p.id, p.title, p.abstract, p.authors, p.institution, p.research_area, p.polar_region, p.location_id || 'loc-1',
        p.keywords, p.publication_year || 2024, p.doi, p.document_url, p.thumbnail_url, p.status || 'published', p.visibility || 'public',
        p.embargo_enabled || 0, p.embargo_until || null, p.uploaded_by || 'res-1', p.rejection_reason || null, p.admin_comment || null,
        p.view_count || 100, p.download_count || 20
      ]
    );

    // Generate full suite of 8 sections, 5 MCQs, 5 flashcards, claims and AI outputs
    const artifacts = generateDocumentArtifacts({
      title: p.title,
      abstract: p.abstract,
      region: p.polar_region,
      area: p.research_area,
      institution: p.institution,
      authors: p.authors,
      pubYear: p.publication_year,
      doi: p.doi
    });

    const finalSections = (p.sections && p.sections.length >= 8) ? p.sections : artifacts.sections;
    const finalMcqs = (p.mcqs && p.mcqs.length >= 5) ? p.mcqs : [
      ...(p.mcqs || []),
      ...artifacts.mcqs.slice(p.mcqs ? p.mcqs.length : 0)
    ];
    const finalFlashcards = (p.flashcards && p.flashcards.length >= 5) ? p.flashcards : [
      ...(p.flashcards || []),
      ...artifacts.flashcards.slice(p.flashcards ? p.flashcards.length : 0)
    ];
    const finalClaims = (p.claims && p.claims.length >= 3) ? p.claims : artifacts.claims;

    // Insert Sections & Chunks
    for (let sIdx = 0; sIdx < finalSections.length; sIdx++) {
      const s = finalSections[sIdx];
      const sectionId = `sec-${p.id}-${sIdx + 1}`;
      await pg.execute(
        `INSERT INTO paper_sections (id, paper_id, section_name, section_order, content, page_start, page_end)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [sectionId, p.id, s.name || s.section_name, s.order || sIdx + 1, s.content, s.page_start || sIdx + 1, s.page_end || sIdx + 2]
      );

      const chunkId = `chk-${p.id}-${sIdx + 1}`;
      const embedding = generateEmbedding(s.content);
      await pg.execute(
        `INSERT INTO paper_chunks (id, paper_id, section_id, section_name, chunk_index, text, page_number, embedding_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [chunkId, p.id, sectionId, s.name || s.section_name, 1, s.content, s.page_start || sIdx + 1, JSON.stringify(embedding)]
      );
    }

    // Insert AI Outputs
    const aiData = p.aiOutput || artifacts.aiOutput;
    await pg.execute(
      `INSERT INTO ai_outputs (id, paper_id, english_summary, hindi_summary, key_findings, important_terms, why_it_matters, social_media_draft, citation_text)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        `ai-${p.id}`, p.id,
        aiData.english_summary || aiData.english || artifacts.aiOutput.english_summary,
        aiData.hindi_summary || aiData.hindi || artifacts.aiOutput.hindi_summary,
        JSON.stringify(aiData.key_findings || artifacts.aiOutput.key_findings),
        JSON.stringify(aiData.important_terms || artifacts.aiOutput.important_terms),
        aiData.why_it_matters || artifacts.aiOutput.why_it_matters,
        aiData.social_media_draft || artifacts.aiOutput.social_media_draft,
        aiData.citation_text || artifacts.aiOutput.citation_text
      ]
    );

    // Insert MCQs
    for (let mIdx = 0; mIdx < finalMcqs.length; mIdx++) {
      const m = finalMcqs[mIdx];
      await pg.execute(
        `INSERT INTO mcqs (id, paper_id, question, option_a, option_b, option_c, option_d, correct_option, explanation, source_section, source_page)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          `mcq-${p.id}-${mIdx + 1}`, p.id,
          m.question || m.question_text,
          m.option_a || (m.options && m.options[0]) || 'Option A',
          m.option_b || (m.options && m.options[1]) || 'Option B',
          m.option_c || (m.options && m.options[2]) || 'Option C',
          m.option_d || (m.options && m.options[3]) || 'Option D',
          m.correct_option || 'B',
          m.explanation || 'Verified from polar manuscript sections.',
          m.source_section || 'Results',
          m.source_page || 8
        ]
      );
    }

    // Insert Flashcards
    for (let fIdx = 0; fIdx < finalFlashcards.length; fIdx++) {
      const f = finalFlashcards[fIdx];
      await pg.execute(
        `INSERT INTO flashcards (id, paper_id, front, back, source_section)
         VALUES (?, ?, ?, ?, ?)`,
        [`fc-${p.id}-${fIdx + 1}`, p.id, f.front || f.front_text, f.back || f.back_text, f.source_section || 'Results']
      );
    }

    // Insert Claims
    for (let cIdx = 0; cIdx < finalClaims.length; cIdx++) {
      const c = finalClaims[cIdx];
      const claimId = `claim-${p.id}-${cIdx + 1}`;
      await pg.execute(
        `INSERT INTO claims (id, paper_id, generated_claim, source_text, source_section, source_page, confidence_score, grounding_status, decision)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [claimId, p.id, c.generated_claim || c.claim_text, c.source_text || c.source_quote, c.source_section || 'Results', c.source_page || 8, c.confidence_score || 0.96, c.grounding_status || 'Verified', c.decision || 'Approved']
      );

      await pg.execute(
        `INSERT INTO verifications (id, claim_id, paper_id, reviewer_id, reviewer_comment, decision)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [`ver-${claimId}`, claimId, p.id, 'usr-admin-1', 'Cross-verified against source section and verified numerically.', 'Approved']
      );
    }
  }

  // 6. Media
  const mediaRecords = [
    { id: 'med-1', title: 'Sunrise Over Maitri: 40 Years of Indian Presence in Antarctica', type: 'Expedition Story', description: 'A photo documentary commemorating 40 continuous years of scientific expeditions at Maitri Station.', thumbnail_url: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?w=800&auto=format&fit=crop', media_url: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?w=1600&auto=format&fit=crop', region: 'Antarctic', location_id: 'loc-1', related_paper_id: 'paper-005', publication_date: '2024-01-15' },
    { id: 'med-2', title: 'Deploying IndARC: High-Seas Robotics in Kongsfjorden', type: 'Infographic', description: 'Schematic explaining how IndARC operates at 192m depth under Arctic ice.', thumbnail_url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&auto=format&fit=crop', media_url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1600&auto=format&fit=crop', region: 'Arctic', location_id: 'loc-5', related_paper_id: 'paper-006', publication_date: '2024-02-20' },
    { id: 'med-3', title: 'Adélie Penguin Colonies Around Bharati Station', type: 'Image', description: 'Telephoto imagery of breeding Adélie penguin pairs in Larsemann Hills.', thumbnail_url: 'https://images.unsplash.com/photo-1598439210625-5067c578f3f6?w=800&auto=format&fit=crop', media_url: 'https://images.unsplash.com/photo-1598439210625-5067c578f3f6?w=1600&auto=format&fit=crop', region: 'Antarctic', location_id: 'loc-2', related_paper_id: 'paper-003', publication_date: '2024-03-05' }
  ];

  for (const m of mediaRecords) {
    await pg.execute(
      `INSERT INTO media (id, title, type, description, thumbnail_url, media_url, region, location_id, related_paper_id, publication_date, status, is_demo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Published', 1)`,
      [m.id, m.title, m.type, m.description, m.thumbnail_url, m.media_url, m.region, m.location_id, m.related_paper_id, m.publication_date]
    );
  }

  // 7. Audit Logs
  const auditEvents = [
    { actor: 'Dr. Ananya Sharma', role: 'researcher', action: 'PAPER_SUBMITTED', paper_id: 'paper-001', previous_value: 'draft', new_value: 'submitted', details: 'Initial manuscript upload with 8 structured sections' },
    { actor: 'System Pipeline', role: 'system', action: 'AI_EXTRACTION_COMPLETED', paper_id: 'paper-001', previous_value: 'submitted', new_value: 'under_review', details: 'Extracted 8 sections, generated summary, 5 MCQs, 5 flashcards' },
    { actor: 'Dr. K. Swaminathan', role: 'admin', action: 'CLAIM_VERIFIED', paper_id: 'paper-001', previous_value: 'Needs Review', new_value: 'Approved', details: 'Claim: Sea ice extent decreased by 8.4% grounded in Results p.8' },
    { actor: 'Dr. K. Swaminathan', role: 'admin', action: 'PAPER_APPROVED', paper_id: 'paper-001', previous_value: 'under_review', new_value: 'approved', details: 'All AI claims verified. Ready for public release.' },
    { actor: 'Dr. K. Swaminathan', role: 'admin', action: 'PAPER_PUBLISHED', paper_id: 'paper-001', previous_value: 'approved', new_value: 'published', details: 'Published to DHRUVA Public Knowledge Portal' }
  ];

  for (let idx = 0; idx < auditEvents.length; idx++) {
    const a = auditEvents[idx];
    await pg.execute(
      `INSERT INTO audit_logs (id, actor, role, action, paper_id, previous_value, new_value, details, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW() - INTERVAL '${15 - idx} hours')`,
      [`audit-${idx + 1}`, a.actor, a.role, a.action, a.paper_id, a.previous_value, a.new_value, a.details]
    );
  }

  console.log('✅ PostgreSQL Seeding completed successfully!');
}

seedPostgres()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ PostgreSQL Seeding failed:', err);
    process.exit(1);
  });
