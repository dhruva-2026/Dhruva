/**
 * DHRUVA Polar Science Domain Intelligence & Terminology Service
 * Research-grade polar lexicon, acronyms, synonyms, query expander,
 * conversation anaphora resolution, and response mode detector.
 */

// 1. Research-Grade Polar Science Terminology Lexicon & Acronyms
const POLAR_ACRONYMS = {
  'ncpor': 'National Centre for Polar and Ocean Research',
  'moes': 'Ministry of Earth Sciences Government of India',
  'indarc': 'IndARC Kongsfjorden underwater mooring observatory 192m depth Svalbard Arctic',
  'scar': 'Scientific Committee on Antarctic Research',
  'iasc': 'International Arctic Science Committee',
  'ipcc': 'Intergovernmental Panel on Climate Change',
  'modis': 'Moderate Resolution Imaging Spectroradiometer satellite',
  'grace': 'Gravity Recovery and Climate Experiment satellite mass balance',
  'cryosat': 'CryoSat ESA satellite radar altimeter ice thickness',
  'ctd': 'Conductivity Temperature Depth oceanographic profiler',
  'adcp': 'Acoustic Doppler Current Profiler',
  'aw': 'Atlantic Water warm saline inflow Kongsfjorden',
  'aabw': 'Antarctic Bottom Water high-density deep ocean mass',
  'amoc': 'Atlantic Meridional Overturning Circulation',
  'sam': 'Southern Annular Mode atmospheric circulation',
  'nao': 'North Atlantic Oscillation',
  'mjo': 'Madden-Julian Oscillation tropical-polar teleconnection',
  'enso': 'El Niño Southern Oscillation teleconnection',
  'glof': 'Glacial Lake Outburst Flood Third Pole Himalayas',
  'aod': 'Aerosol Optical Depth atmospheric black carbon',
  'cfc': 'Chlorofluorocarbon ozone depleting substance',
  'd18o': 'delta-18-O oxygen stable isotope paleoclimate proxy',
  'par': 'Photosynthetically Active Radiation marine phytoplankton'
};

// 2. Comprehensive Domain Synonyms & Concept Associations
const POLAR_SYNONYMS = {
  'himadri': ['himadri station', 'ny-alesund', 'svalbard', '79n', 'arctic base', 'spitsbergen'],
  'maitri': ['maitri station', 'schirmacher oasis', 'queen maud land', 'antarctic station', 'east antarctica'],
  'bharati': ['bharati station', 'larsemann hills', 'prydz bay', 'princess elizabeth land', 'east antarctica'],
  'dakshin gangotri': ['dakshin gangotri', 'first indian antarctic base', 'ice shelf station'],
  'indarc': ['indarc', 'kongsfjorden mooring', '192m depth', 'hydrographic observatory', 'atlantic water inflow'],
  'permafrost': ['permafrost thaw', 'active layer deepening', 'methanogenesis', 'microbial substrate', 'subterranean permafrost', 'talik'],
  'methane': ['methane flux', 'methanogenesis', 'biogenic ch4 emissions', 'methanogens', 'greenhouse gas feedback'],
  'sea ice': ['sea ice extent', 'sea ice concentration', 'weddell sea ice', 'pack ice', 'polynya', 'frazil ice', 'albedo feedback'],
  'phytoplankton': ['phytoplankton blooms', 'chlorophyll-a', 'primary productivity', 'prydz bay marine ecology', 'diatoms', 'krill'],
  'microplastics': ['microplastics', 'synthetic polymer fibers', 'arctic snowpack contamination', 'atmospheric transport', 'himadri snow'],
  'third pole': ['third pole', 'himalayas', 'karakoram', 'hindu kush', 'himansh station', 'spiti valley', 'glacier mass balance', 'siachen'],
  'ozone': ['stratospheric ozone hole', 'polar vortex', 'polar stratospheric clouds', 'ozone depletion', 'montreal protocol', 'cfcs'],
  'glacier': ['glacier retreat', 'ice mass balance', 'calving', 'grounding line', 'subglacial meltwater', 'ice core isotopes'],
  'albedo': ['surface albedo feedback', 'solar insolation reflectance', 'snow darkening', 'black carbon aerosols'],
  'cryoconite': ['cryoconite granules', 'microbial mats', 'glacial meltwater streams', 'cyanobacteria', 'biological albedo reduction'],
  'teleconnection': ['polar-tropical teleconnection', 'indian summer monsoon', 'monsoon modulation', 'rossby wave trains', 'arctic amplification'],
  'warm': ['warming', 'thermal anomaly', 'radiative forcing', 'temperature rise', 'heat flux'],
  'animals': ['polar wildlife', 'penguins', 'polar bears', 'krill', 'benthic fauna', 'phytoplankton', 'antarctic toothfish']
};

// 3. Dense Embedding Vocabulary (72 curated terms for precise cosine vector matching)
const POLAR_VOCAB = [
  'sea ice', 'extent', 'variability', 'climate', 'antarctic', 'arctic', 'glaciology',
  'permafrost', 'methane', 'thaw', 'svalbard', 'ny-alesund', 'himadri', 'maitri',
  'bharati', 'dakshin gangotri', 'schirrmacher', 'larsemann', 'prydz bay', 'southern ocean',
  'upwelling', 'phytoplankton', 'chlorophyll', 'krill', 'microplastics', 'snowpack',
  'aerosol', 'black carbon', 'albedo', 'atmospheric', 'ozone', 'stratosphere',
  'polar vortex', 'temperature', 'anomaly', 'salinity', 'circulation', 'ice sheet',
  'mass balance', 'calving', 'indarc', 'oceanography', 'cryosphere', 'paleoclimate',
  'ice core', 'isotopes', 'sediment', 'benthic', 'biodiversity', 'satellite', 'remote sensing',
  'radar', 'modis', 'cryosat', 'grace', 'meltwater', 'subglacial', 'aurora', 'third pole',
  'himalayas', 'karakoram', 'teleconnection', 'monsoon', 'active layer', 'methanogenesis',
  'kongsfjorden', 'weddell', 'ross sea', 'talik', 'cyanobacteria', 'extremophile', 'polynya'
];

/**
 * Expand query by injecting scientific acronym meanings and related keywords
 */
function expandQuery(query) {
  if (!query) return '';
  const lower = query.toLowerCase().trim();
  const tokens = lower.replace(/[^\w\s-]/g, ' ').split(/\s+/).filter(Boolean);
  const expansions = new Set(tokens);

  // 1. Expand acronyms
  tokens.forEach(t => {
    if (POLAR_ACRONYMS[t]) {
      POLAR_ACRONYMS[t].toLowerCase().split(/\s+/).forEach(w => expansions.add(w));
    }
  });

  // 2. Expand synonyms
  Object.keys(POLAR_SYNONYMS).forEach(key => {
    if (lower.includes(key)) {
      POLAR_SYNONYMS[key].forEach(syn => {
        syn.toLowerCase().split(/\s+/).forEach(w => expansions.add(w));
      });
    }
  });

  // 3. Special intent expansions (e.g. "what are poles", "climate change", "teleconnections")
  if (lower.includes('pole') || lower.includes('polar')) {
    expansions.add('arctic');
    expansions.add('antarctic');
    expansions.add('cryosphere');
  }

  if (lower.includes('india') || lower.includes('indian')) {
    expansions.add('ncpor');
    expansions.add('moes');
    expansions.add('himadri');
    expansions.add('maitri');
    expansions.add('bharati');
  }

  return Array.from(expansions).join(' ');
}

/**
 * Detect user's intent and appropriate response mode
 */
function detectResponseMode(query) {
  const q = query.toLowerCase();

  if (
    q.includes('compare') || 
    q.includes('versus') || 
    q.includes(' vs ') || 
    q.includes('difference between') ||
    q.includes('how does arctic differ from antarctic')
  ) {
    return 'compare_papers';
  }

  if (
    q.includes('method') || 
    q.includes('methodology') || 
    q.includes('instrument') || 
    q.includes('how was this measured') || 
    q.includes('sensor') || 
    q.includes('sampling technique')
  ) {
    return 'methodology_analysis';
  }

  if (
    q.includes('key finding') || 
    q.includes('main finding') || 
    q.includes('quantitative') || 
    q.includes('numbers') || 
    q.includes('statistics') || 
    q.includes('data points')
  ) {
    return 'key_findings';
  }

  if (
    q.includes('summarize') || 
    q.includes('summary') || 
    q.includes('abstract') || 
    q.includes('executive summary') || 
    q.includes('overview')
  ) {
    return 'research_summary';
  }

  if (
    q.includes('analyze') || 
    q.includes('deep dive') || 
    q.includes('detailed paper analysis') || 
    q.includes('paper breakdown')
  ) {
    return 'paper_analysis';
  }

  if (
    q.includes('explain simply') || 
    q.includes('for beginner') || 
    q.includes('for student') || 
    q.includes('like i am 5') || 
    q.includes('simple words')
  ) {
    return 'student_beginner';
  }

  if (
    q.includes('thermodynamic') || 
    q.includes('biogeochemical mechanism') || 
    q.includes('expert') || 
    q.includes('equation') || 
    q.includes('mathematical model')
  ) {
    return 'expert_explanation';
  }

  if (
    q.includes('briefly') || 
    q.includes('in short') || 
    q.includes('quick answer') || 
    q.includes('one line')
  ) {
    return 'quick_answer';
  }

  // Default for research inquiries
  return 'detailed_explanation';
}

/**
 * Resolves conversational context / follow-up anaphora using previous turns
 */
function resolveConversationContext(query, history = []) {
  if (!history || history.length === 0) return query;

  const q = query.trim().toLowerCase();
  const isFollowUp = (
    q.startsWith('why') ||
    q.startsWith('how') ||
    q.startsWith('what about') ||
    q.startsWith('explain that') ||
    q.startsWith('tell me more') ||
    q.startsWith('and what did') ||
    q.includes('that paper') ||
    q.includes('this study') ||
    q.includes('the authors') ||
    q.includes('it conclude') ||
    q.includes('that station') ||
    q.length < 25
  );

  if (!isFollowUp) return query;

  // Extract key topic entities from last user and assistant turns
  const previousTurns = history.slice(-4);
  let accumulatedContext = '';

  for (let i = previousTurns.length - 1; i >= 0; i--) {
    const turn = previousTurns[i];
    if (turn.content) {
      accumulatedContext += ' ' + turn.content;
    }
  }

  // Find mentioned paper titles, stations, or polar terms in previous context
  const detectedKeywords = [];
  Object.keys(POLAR_SYNONYMS).forEach(term => {
    if (accumulatedContext.toLowerCase().includes(term)) {
      detectedKeywords.push(term);
    }
  });

  if (detectedKeywords.length > 0) {
    return `${query} (Context: ${detectedKeywords.slice(0, 3).join(', ')})`;
  }

  return query;
}

module.exports = {
  POLAR_ACRONYMS,
  POLAR_SYNONYMS,
  POLAR_VOCAB,
  expandQuery,
  detectResponseMode,
  resolveConversationContext
};
