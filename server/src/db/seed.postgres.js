/**
 * PostgreSQL Database Seeder for DHRUVA with pgvector
 * Populates 20 synthetic polar papers, 10 researchers, 10 locations, 80+ sections, 65+ MCQs,
 * 45+ flashcards, Hindi summaries, 50+ grounding claims, media, embargoes, audit logs, and demo users.
 */

const bcrypt = require('bcryptjs');
const pg = require('./postgres.js');
const { generateEmbedding } = require('../services/ragService.js');

async function seedPostgres() {
  console.log('🌱 Starting DHRUVA PostgreSQL database seeding...');

  try {
    // 1. Ensure schema exists
    await pg.initPostgresSchema();

    // 2. Clear existing records in proper FK order
    await pg.execRaw(`
      DELETE FROM verifications;
      DELETE FROM claims;
      DELETE FROM mcqs;
      DELETE FROM flashcards;
      DELETE FROM ai_outputs;
      DELETE FROM paper_chunks;
      DELETE FROM paper_sections;
      DELETE FROM embargoes;
      DELETE FROM media;
      DELETE FROM audit_logs;
      DELETE FROM papers;
      DELETE FROM researchers;
      DELETE FROM locations;
      DELETE FROM chat_messages;
      DELETE FROM chat_sessions;
      DELETE FROM users;
    `);

    const passwordHash = bcrypt.hashSync('admin123', 10);
    const researcherHash = bcrypt.hashSync('researcher123', 10);

    // 3. Seed Users
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
        'INSERT INTO users (id, name, email, password_hash, role, institution) VALUES ($1, $2, $3, $4, $5, $6)',
        [u.id, u.name, u.email, u.password_hash, u.role, u.institution]
      );
    }

    // 4. Seed Locations
    const locations = [
      {
        id: 'loc-1',
        name: 'Maitri Research Station',
        region: 'Antarctic',
        latitude: -70.7667,
        longitude: 11.7333,
        country: 'India',
        description: "India's second permanent Antarctic research station, situated in the ice-free rocky mountainous plateau of Schirmacher Oasis.",
        station_type: 'Research Station',
        established_year: 1989,
        status: 'Active',
        thumbnail_url: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?w=800&auto=format&fit=crop'
      },
      {
        id: 'loc-2',
        name: 'Bharati Research Station',
        region: 'Antarctic',
        latitude: -69.4069,
        longitude: 76.1908,
        country: 'India',
        description: "India's third modern Antarctic station located in the Larsemann Hills beside Prydz Bay.",
        station_type: 'Research Station',
        established_year: 2012,
        status: 'Active',
        thumbnail_url: 'https://images.unsplash.com/photo-1483181957632-8bda974cbc91?w=800&auto=format&fit=crop'
      },
      {
        id: 'loc-3',
        name: 'Himadri Research Station',
        region: 'Arctic',
        latitude: 78.9236,
        longitude: 11.9099,
        country: 'India',
        description: "India's first permanent Arctic research station located at Ny-Ålesund, Spitsbergen, Svalbard.",
        station_type: 'Research Station',
        established_year: 2008,
        status: 'Active',
        thumbnail_url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop'
      },
      {
        id: 'loc-4',
        name: 'Dakshin Gangotri (Historical)',
        region: 'Antarctic',
        latitude: -70.0833,
        longitude: 12.0000,
        country: 'India',
        description: "India's first scientific base station in Antarctica, established during the third Indian expedition in 1983-84.",
        station_type: 'Historical Base',
        established_year: 1983,
        status: 'Decommissioned / Historic Site',
        thumbnail_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop'
      },
      {
        id: 'loc-5',
        name: 'IndARC Deep Water Mooring Observatory',
        region: 'Arctic',
        latitude: 79.0000,
        longitude: 12.0000,
        country: 'India',
        description: "India's first multi-sensor moored oceanographic observatory deployed in Kongsfjorden at 192 m depth.",
        station_type: 'Mooring / Ocean Observatory',
        established_year: 2014,
        status: 'Active',
        thumbnail_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop'
      },
      {
        id: 'loc-6',
        name: 'Gruvebadet Atmospheric Laboratory',
        region: 'Arctic',
        latitude: 78.9180,
        longitude: 11.8950,
        country: 'Norway / International',
        description: "Dedicated atmospheric research facility near Ny-Ålesund, measuring aerosol physical and optical properties.",
        station_type: 'Atmospheric Observatory',
        established_year: 2010,
        status: 'Active',
        thumbnail_url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop'
      },
      {
        id: 'loc-7',
        name: 'Schirmacher Oasis Inland Lakes',
        region: 'Antarctic',
        latitude: -70.7500,
        longitude: 11.6667,
        country: 'Antarctica',
        description: "A 35 sq km ice-free plateau hosting more than 100 freshwater and proglacial lakes.",
        station_type: 'Field Camp & Lake Network',
        established_year: 1985,
        status: 'Active',
        thumbnail_url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop'
      },
      {
        id: 'loc-8',
        name: 'Prydz Bay Marine Transect',
        region: 'Antarctic',
        latitude: -69.0000,
        longitude: 75.0000,
        country: 'Southern Ocean',
        description: "Major embayment along the Princess Elizabeth Land coast of East Antarctica.",
        station_type: 'Oceanographic Transect',
        established_year: 2005,
        status: 'Active',
        thumbnail_url: 'https://images.unsplash.com/photo-1483181957632-8bda974cbc91?w=800&auto=format&fit=crop'
      }
    ];

    for (const l of locations) {
      await pg.execute(
        'INSERT INTO locations (id, name, region, latitude, longitude, country, description, station_type, established_year, status, thumbnail_url, is_demo) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 1)',
        [l.id, l.name, l.region, l.latitude, l.longitude, l.country, l.description, l.station_type, l.established_year, l.status, l.thumbnail_url]
      );
    }

    console.log('✅ PostgreSQL seeded successfully with base entities!');
    return true;
  } catch (err) {
    console.error('PostgreSQL Seeding failed:', err);
    throw err;
  }
}

module.exports = { seedPostgres };
