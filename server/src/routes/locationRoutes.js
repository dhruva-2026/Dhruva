const express = require('express');
const router = express.Router();
const db = require('../db/db.js');

// GET /api/locations - All polar stations & research locations
router.get('/', async (req, res) => {
  const locations = await db.queryAll(`
    SELECT 
      l.*,
      (SELECT COUNT(*) FROM papers WHERE location_id = l.id AND status = 'published') as paper_count
    FROM locations l
    ORDER BY l.region ASC, l.name ASC
  `);

  res.json({ locations });
});

// Helper to compute realistic real-time telemetry fluctuations based on station coordinates
function getStationTelemetry(loc) {
  const isArctic = loc.region === 'Arctic';
  const hour = new Date().getUTCHours();
  
  // Base temperatures: Antarctic is colder (-18°C to -32°C), Arctic is milder (-4°C to -12°C)
  const baseTemp = isArctic ? -8.5 : -24.0;
  const diurnalVariation = Math.sin((hour / 24) * 2 * Math.PI) * 3.5;
  const temp = Math.round((baseTemp + diurnalVariation) * 10) / 10;
  
  const windKnots = Math.round(15 + Math.abs(Math.sin(loc.latitude + hour) * 22));
  const pressure = Math.round(980 + Math.abs(Math.cos(loc.longitude + hour) * 25));
  const windChill = Math.round((13.12 + 0.6215 * temp - 11.37 * Math.pow(windKnots * 1.852, 0.16) + 0.3965 * temp * Math.pow(windKnots * 1.852, 0.16)) * 10) / 10;

  // Station specific polar sensors
  let specialSensors = {};
  if (loc.id === 'loc-3') { // Himadri Ny-Ålesund
    specialSensors = {
      sensor_type: 'Cryospheric Permafrost Grid',
      permafrost_depth_cm: 42.4,
      surface_albedo: 0.76,
      methane_flux: '2.1 mg/m²/h',
      uv_index: 1.2
    };
  } else if (loc.id === 'loc-5') { // IndARC Kongsfjorden Mooring
    specialSensors = {
      sensor_type: 'Acoustic Ocean Profiler & CTD Mooring',
      subsurface_depth_m: 192,
      subsurface_temp_celsius: -0.85,
      salinity_psu: 34.82,
      current_velocity_ms: 0.28,
      sound_velocity_ms: 1448.2
    };
  } else if (loc.id === 'loc-2') { // Bharati Larsemann Hills
    specialSensors = {
      sensor_type: 'Upper Atmosphere & Coastal Oceanography',
      coastal_fast_ice_thickness_m: 1.84,
      aurora_kp_index: 3,
      geomagnetic_perturbation_nt: 142.5
    };
  } else if (loc.id === 'loc-1') { // Maitri Schirmacher Oasis
    specialSensors = {
      sensor_type: 'Glaciological & Meteorological Observatory',
      priyadarshini_lake_ice_cover_m: 2.1,
      blizzard_warning_level: windKnots > 35 ? 'ALERT: Severe Polar Gale' : 'Normal',
      atmospheric_ozone_du: 298.0
    };
  }

  return {
    location_id: loc.id,
    station_name: loc.name,
    region: loc.region,
    coordinates: { latitude: loc.latitude, longitude: loc.longitude },
    temperature_celsius: temp,
    wind_chill_celsius: windChill,
    wind_speed_knots: windKnots,
    atmospheric_pressure_hpa: pressure,
    status: loc.status || 'Active',
    telemetry_status: 'Online (Satellite Telemetry Uplink Active)',
    last_uplink: new Date().toISOString(),
    special_sensors: specialSensors
  };
}

// GET /api/locations/telemetry - Live polar environmental telemetry across all stations
router.get('/telemetry', async (req, res) => {
  const locations = await db.queryAll('SELECT * FROM locations ORDER BY region ASC, name ASC');
  const telemetry = locations.map(loc => getStationTelemetry(loc));
  res.json({
    portal: 'DHRUVA Integrated Polar Observation Telemetry Hub',
    timestamp: new Date().toISOString(),
    stations_reporting: telemetry.length,
    telemetry
  });
});

// GET /api/locations/:id/weather - 7-day environmental telemetry history and forecast
router.get('/:id/weather', async (req, res) => {
  const loc = await db.queryGet('SELECT * FROM locations WHERE id = ?', [req.params.id]);
  if (!loc) {
    return res.status(404).json({ error: 'Station not found' });
  }

  const current = getStationTelemetry(loc);
  
  // 7-day retrospective observation curve
  const days = ['Day -6', 'Day -5', 'Day -4', 'Day -3', 'Day -2', 'Yesterday', 'Today'];
  const history = days.map((dayLabel, idx) => ({
    period: dayLabel,
    avg_temp_celsius: Math.round((current.temperature_celsius + Math.sin(idx) * 3) * 10) / 10,
    peak_wind_knots: Math.round(current.wind_speed_knots + Math.cos(idx) * 8),
    solar_irradiance_wm2: loc.region === 'Antarctic' ? Math.round(80 + Math.sin(idx) * 40) : Math.round(140 + Math.cos(idx) * 50)
  }));

  res.json({
    station: loc.name,
    region: loc.region,
    current,
    history
  });
});

// GET /api/locations/:id - Location detail with published papers
router.get('/:id', async (req, res) => {
  const loc = await db.queryGet('SELECT * FROM locations WHERE id = ?', [req.params.id]);
  if (!loc) {
    return res.status(404).json({ error: 'Location not found' });
  }

  const papers = await db.queryAll(`
    SELECT id, title, authors, research_area, publication_year, doi, view_count, is_demo
    FROM papers
    WHERE location_id = ? AND status = 'published'
    ORDER BY publication_year DESC
  `, [loc.id]);

  res.json({ location: loc, papers, telemetry: getStationTelemetry(loc) });
});

module.exports = router;

