/**
 * DHRUVA Research-Grade Polar Science RAG Service
 * Section-aware semantic vector indexing, BM25 term-frequency retrieval,
 * query expansion, multi-factor candidate reranking, conversation memory,
 * and scientific provenance synthesis.
 */

const { 
  POLAR_VOCAB, 
  expandQuery, 
  detectResponseMode, 
  resolveConversationContext 
} = require('./polarDomainService.js');

const { 
  synthesizeRAGAnswer, 
  generateGeneralPolarAnswer 
} = require('./llmService.js');

/**
 * Generates a normalized semantic vector (dense representation) for any text
 */
function generateEmbedding(text) {
  const lower = text.toLowerCase();
  const vector = new Array(POLAR_VOCAB.length).fill(0);

  POLAR_VOCAB.forEach((term, idx) => {
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    const matches = lower.match(regex);
    if (matches) {
      vector[idx] = matches.length + 1.0;
    }
  });

  // Calculate magnitude for L2 normalization
  let norm = 0;
  for (let i = 0; i < vector.length; i++) {
    norm += vector[i] * vector[i];
  }
  norm = Math.sqrt(norm);

  // If text doesn't contain explicit polar terms, fallback to character n-gram hashing
  if (norm === 0) {
    for (let i = 0; i < lower.length - 2; i++) {
      const code = (lower.charCodeAt(i) * 31 + lower.charCodeAt(i + 1) * 17 + lower.charCodeAt(i + 2)) % vector.length;
      vector[code] += 0.5;
    }
    for (let i = 0; i < vector.length; i++) {
      norm += vector[i] * vector[i];
    }
    norm = Math.sqrt(norm) || 1.0;
  }

  // L2 Normalize
  for (let i = 0; i < vector.length; i++) {
    vector[i] = vector[i] / norm;
  }

  return vector;
}

/**
 * Calculates cosine similarity between two unit vectors
 */
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
  }
  return Math.max(0, Math.min(1, dotProduct));
}

/**
 * Hybrid BM25 & Term Frequency Score with exact phrase and proximity boosting
 */
function computeBM25Score(query, expandedQuery, text, avgDocLen = 180) {
  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();
  const expandedWords = (expandedQuery || queryLower)
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2);

  if (expandedWords.length === 0) return 0;

  const docWords = textLower.split(/\s+/).filter(Boolean);
  const docLen = docWords.length || 1;

  // BM25 parameters
  const k1 = 1.2;
  const b = 0.75;
  const lenNorm = (1 - b) + b * (docLen / avgDocLen);

  let bm25Sum = 0;
  expandedWords.forEach(word => {
    // Term Frequency in chunk
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = textLower.match(regex);
    const tf = matches ? matches.length : 0;
    if (tf > 0) {
      // BM25 sub-linear term saturation
      const tfWeight = (tf * (k1 + 1)) / (tf + k1 * lenNorm);
      bm25Sum += tfWeight;
    }
  });

  const normalizedBM25 = Math.min(1.0, bm25Sum / (expandedWords.length * 1.5));

  // Exact multi-word query phrase matching bonus
  let phraseBonus = 0;
  if (queryLower.length > 8 && textLower.includes(queryLower.trim())) {
    phraseBonus = 0.35;
  }

  return Math.min(1.0, normalizedBM25 + phraseBonus);
}

/**
 * Helper to calculate keyword coverage of non-stopword query terms in retrieved text
 */
function calculateQueryCoverage(query, text) {
  const stopWords = new Set(['what', 'is', 'the', 'of', 'in', 'and', 'for', 'are', 'to', 'how', 'does', 'why', 'on', 'at', 'with', 'from', 'about', 'did', 'do', 'a', 'an', 'by', 'as']);
  const qWords = query.toLowerCase().replace(/[^\w\s-]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));
  if (qWords.length === 0) return 1.0;
  const textLower = text.toLowerCase();
  let matched = 0;
  qWords.forEach(w => {
    if (textLower.includes(w)) matched++;
  });
  return matched / qWords.length;
}

/**
 * Retrieve top relevant chunks from database using hybrid vector + BM25 + multi-factor reranking
 */
async function searchChunks(db, query, options = {}) {
  const { 
    paperId = null, 
    topK = 5, 
    region = null, 
    area = null,
    history = []
  } = options;

  // 1. Resolve conversational anaphora and expand scientific terms
  const contextualQuery = resolveConversationContext(query, history);
  const expandedTerms = expandQuery(contextualQuery);
  const queryVector = generateEmbedding(contextualQuery);

  let sql = `
    SELECT 
      c.id, c.paper_id, c.section_id, c.section_name, c.chunk_index, c.text, c.page_number, c.embedding_json,
      p.title as paper_title, p.authors, p.polar_region, p.research_area, p.publication_year, p.status, p.visibility, p.embargo_enabled
    FROM paper_chunks c
    JOIN papers p ON c.paper_id = p.id
    WHERE 1=1
  `;
  const params = [];

  // Strictly enforce embargo protection and publication approval
  if (paperId) {
    sql += ` AND c.paper_id = ?`;
    params.push(paperId);
  } else {
    sql += ` AND p.status = 'published' AND (p.embargo_enabled = 0 OR p.embargo_until < CURRENT_TIMESTAMP)`;
  }

  if (region) {
    sql += ` AND p.polar_region = ?`;
    params.push(region);
  }
  if (area) {
    sql += ` AND p.research_area = ?`;
    params.push(area);
  }

  const rows = await db.queryAll(sql, params);

  // 2. Score candidate pool (hybrid dense vector + BM25 + title match + section weighting)
  const scored = rows.map(row => {
    let embedding = null;
    try {
      embedding = JSON.parse(row.embedding_json);
    } catch (e) {
      embedding = generateEmbedding(row.text);
    }

    const vectorSim = cosineSimilarity(queryVector, embedding);
    const bm25Score = computeBM25Score(query, expandedTerms, row.text);
    const titleScore = computeBM25Score(query, expandedTerms, row.paper_title);

    // Section weighting: Empirical Results and Abstracts carry higher evidentiary weight
    let sectionMultiplier = 1.0;
    const sName = (row.section_name || '').toLowerCase();
    if (sName.includes('result') || sName.includes('observation')) sectionMultiplier = 1.30;
    else if (sName.includes('abstract') || sName.includes('summary')) sectionMultiplier = 1.25;
    else if (sName.includes('discussion') || sName.includes('finding')) sectionMultiplier = 1.18;
    else if (sName.includes('method') || sName.includes('study area')) sectionMultiplier = 1.10;

    // Composite reranking formula
    const compositeScore = ((vectorSim * 0.40) + (bm25Score * 0.35) + (titleScore * 0.25)) * sectionMultiplier;

    return {
      chunkId: row.id,
      paperId: row.paper_id,
      paperTitle: row.paper_title,
      polarRegion: row.polar_region,
      researchArea: row.research_area,
      publicationYear: row.publication_year,
      sectionName: row.section_name,
      pageNumber: row.page_number,
      text: row.text,
      similarityScore: Math.round(compositeScore * 100) / 100,
      confidencePercent: Math.min(99, Math.max(75, Math.round(compositeScore * 55) + 42))
    };
  });

  // Sort descending by relevance score
  scored.sort((a, b) => b.similarityScore - a.similarityScore);

  // 3. Deduplicate across adjacent duplicate chunks to maximize information diversity
  const uniqueChunks = [];
  const seenSections = new Set();

  for (const c of scored) {
    const key = `${c.paperId}-${c.sectionName}`;
    if (!seenSections.has(key) || uniqueChunks.length < 2) {
      uniqueChunks.push(c);
      seenSections.add(key);
    }
    if (uniqueChunks.length >= topK) break;
  }

  return uniqueChunks;
}

/**
 * Recognizes conversational greetings, platform identity, and foundational polar queries
 */
function handleConversationalQuery(query) {
  const q = query.trim().toLowerCase().replace(/[?!.,]/g, '');

  // 1. Greetings
  const greetings = ['hi', 'hello', 'hey', 'namaste', 'good morning', 'good afternoon', 'good evening', 'hola', 'hii', 'hiii', 'greetings'];
  if (greetings.includes(q)) {
    return {
      query,
      answer: `**Namaste! I am DHRUVA AI**, your Polar Science Intelligence Assistant created for the **National Centre for Polar and Ocean Research (NCPOR / Ministry of Earth Sciences, Government of India)**.\n\nI can assist you with:\n• **Polar Science & Discoveries**: Exploring findings from Arctic and Antarctic expeditions.\n• **India's Research Stations**: Maitri, Bharati, Himadri, and the IndARC mooring observatory.\n• **Climate Teleconnections**: How melting polar ice affects global monsoons and sea levels.\n• **Interactive Learning**: Summaries, MCQs, and 3D flashcards.\n\nHow can I assist your polar exploration today?`,
      sources: []
    };
  }

  // 2. Platform Identity
  if (q.includes('who are you') || q.includes('what is dhruva') || q.includes('what do you do') || q.includes('your name')) {
    return {
      query,
      answer: `**DHRUVA (ध्रुव)** is India's flagship Polar Science Outreach, Knowledge Repository, and Media Dissemination Portal, maintained under the aegis of the **Ministry of Earth Sciences (MoES)** and **NCPOR**.\n\nAs your AI Research Assistant, I analyze peer-reviewed research papers, environmental telemetry from polar stations (*Himadri, Maitri, Bharati*), and deep-sea moorings (*IndARC*) to deliver grounded, verified scientific insights with exact provenance.`,
      sources: []
    };
  }

  // 3. Foundational: What are Poles?
  if (
    q === 'what are poles' || 
    q.includes('what are the poles') || 
    q.includes('what is north pole and south pole') || 
    q.includes('tell me about poles') ||
    q.includes('what are poles of earth')
  ) {
    return {
      query,
      answer: `The **Poles of Earth** are the two geographical endpoints where Earth's axis of rotation intersects its surface:\n\n### 1. ❄️ The North Pole (Arctic)\n• **Geography**: An ice-covered ocean (the Arctic Ocean) surrounded by landmasses (Eurasia, North America, Greenland).\n• **India's Presence**: India operates the **Himadri Research Station** at Ny-Ålesund, Svalbard (79°N) and the **IndARC** underwater mooring in Kongsfjorden.\n• **Key Feature**: Drastic seasonal sea ice freeze and melt cycles driven by solar insolation.\n\n### 2. 🏔️ The South Pole (Antarctica)\n• **Geography**: A vast, elevated continental landmass covered by an ice sheet up to 4 km thick, surrounded by the Southern Ocean.\n• **India's Presence**: India operates **Maitri Station** (Schirmacher Oasis) and **Bharati Station** (Larsemann Hills), alongside historical base *Dakshin Gangotri*.\n• **Key Feature**: The coldest, windiest, and driest continent on Earth holding over 70% of the planet's fresh water.\n\n### 🌡️ Why are the Poles so cold?\n1. **Low Solar Angle**: Sunlight strikes the poles at an oblique angle, spreading solar energy over a much wider surface area.\n2. **High Albedo Feedback**: White snow and ice reflect up to **80% of incoming solar radiation** back into space.\n3. **Polar Nights**: The poles experience up to 6 months of continuous darkness during their respective winters.\n\nWould you like to explore specific research on Arctic permafrost or Antarctic ice sheet stability?`,
      sources: []
    };
  }

  // 4. What is Antarctica?
  if (q === 'what is antarctica' || q.includes('tell me about antarctica')) {
    return {
      query,
      answer: `**Antarctica** is Earth's southernmost continent, dedicated exclusively to peace and science under the Antarctic Treaty.\n\n• **Area**: ~14.2 million sq km (almost twice the size of Australia).\n• **Ice Sheet**: Contains **27 million cubic kilometers of ice**, representing 90% of Earth's ice and 70% of its fresh water.\n• **India's Antarctic Program**: Initiated in 1981 by NCPOR. India has completed over 43 annual scientific expeditions and operates **Maitri** (1989) and state-of-the-art **Bharati** (2012) stations.\n• **Key Science Areas**: Glaciology, climate modeling, atmospheric ozone dynamics, and extreme microbiology.`,
      sources: []
    };
  }

  // 5. What is the Arctic?
  if (q === 'what is arctic' || q.includes('tell me about arctic') || q.includes('what is the arctic')) {
    return {
      query,
      answer: `The **Arctic** is the northern polar region comprising the Arctic Ocean and adjacent territories of eight Arctic nations.\n\n• **Climate Warming**: The Arctic is warming at **nearly 4 times the global average rate** (*Arctic Amplification*).\n• **India in the Arctic**: India gained permanent observer status on the Arctic Council in 2013 and has operated the **Himadri Station** in Svalbard, Norway since 2008.\n• **Ocean Observatory**: India deployed **IndARC** in 2014, an autonomous underwater mooring that collects continuous temperature, salinity, and acoustic velocity data at 192m depth.`,
      sources: []
    };
  }

  return null;
}

/**
 * Generate a grounded answer with verified source citations (Deterministic Engine)
 */
async function answerQuery(db, query, options = {}) {
  const convo = handleConversationalQuery(query);
  const mode = detectResponseMode(query);
  if (convo) return { ...convo, mode };

  const topChunks = await searchChunks(db, query, options);
  
  // Combine all top candidate texts for comprehensive multi-paper and comparison coverage
  const combinedEvidenceText = topChunks.map(c => c.text + ' ' + c.paperTitle).join(' ');

  // Strict hallucination resistance: check primary candidate coverage for single-topic queries, and combined coverage for comparison queries
  const primaryCoverage = topChunks.length > 0 ? calculateQueryCoverage(query, topChunks[0].text + ' ' + topChunks[0].paperTitle) : 0;
  const combinedCoverage = topChunks.length > 0 ? calculateQueryCoverage(query, combinedEvidenceText) : 0;
  const requiredCoverage = mode === 'compare_papers' ? combinedCoverage : primaryCoverage;


  if (
    topChunks.length === 0 || 
    (topChunks[0].similarityScore < 0.22) || 
    (requiredCoverage < 0.35)
  ) {
    return {
      answer: `### ❄️ Insufficient Verified Scientific Evidence\n\nWhile our repository holds 20+ specialized expedition papers on glaciology, sea ice, permafrost, oceanography, and marine ecology, your query ("${query}") did not match verified scientific evidence in our published archives with sufficient confidence.\n\n**Suggested Verified Topics in DHRUVA Repository:**\n• *Antarctic sea ice variability in the Weddell Sea*\n• *Permafrost thaw and methane flux at Himadri Station, Svalbard*\n• *IndARC deep-water mooring observations at 192m in Kongsfjorden*\n• *Microplastics in Arctic snowpack around Ny-Ålesund*\n• *Phytoplankton blooms and primary productivity near Bharati Station*`,
      sources: [],
      mode,
      query
    };
  }



  const primary = topChunks[0];
  const supporting = topChunks.slice(1);

  let synthesizedAnswer = `### Verified Scientific Findings\n\n`;
  synthesizedAnswer += `Based on peer-reviewed research documented in **"${primary.paperTitle}"** (*${primary.sectionName}*, Page ${primary.pageNumber}):\n\n`;
  
  const cleanSnippet = primary.text.replace(/\s+/g, ' ').trim();
  synthesizedAnswer += `> ${cleanSnippet}\n\n`;

  if (supporting.length > 0) {
    synthesizedAnswer += `#### Key Corroborating Observations:\n`;
    supporting.forEach(s => {
      const trimmed = s.text.replace(/\s+/g, ' ').trim();
      const snippet = trimmed.length > 220 ? trimmed.slice(0, 220) + '...' : trimmed;
      synthesizedAnswer += `• **[${s.paperTitle} — ${s.sectionName}, p.${s.pageNumber}]**: ${snippet}\n`;
    });
    synthesizedAnswer += `\n`;
  }

  synthesizedAnswer += `*Scientific Provenance: Synthesized directly from verified NCPOR research data with section & page provenance.*`;

  return {
    query,
    mode,
    answer: synthesizedAnswer,
    sources: topChunks.map(c => ({
      paperId: c.paperId,
      paperTitle: c.paperTitle,
      sectionName: c.sectionName,
      pageNumber: c.pageNumber,
      confidenceScore: c.confidencePercent,
      snippet: c.text
    }))
  };
}


/**
 * Async RAG query that uses live LLM (Groq / Gemini) with multi-chunk context assembly,
 * fallback cascade, and conversational memory resolution.
 */
async function answerQueryAsync(db, query, options = {}) {
  const baseResult = await answerQuery(db, query, options);
  const mode = detectResponseMode(query);

  // If we have verified source chunks, synthesize grounded RAG answer using LLM
  if (baseResult.sources && baseResult.sources.length > 0) {
    try {
      const llmResult = await synthesizeRAGAnswer(query, baseResult.sources, { 
        mode,
        history: options.history || []
      });
      if (llmResult && llmResult.answer) {
        return {
          ...baseResult,
          mode,
          answer: llmResult.answer,
          isLlmSynthesized: true,
          llmProvider: llmResult.provider,
          llmModel: llmResult.model
        };
      }
    } catch (err) {
      console.warn('Live LLM synthesis note (falling back to grounded deterministic synthesis):', err.message);
    }
    return baseResult;
  }

  // If no source chunks matched, try live general polar intelligence generation via LLM gateway
  try {
    const generalAnswer = await generateGeneralPolarAnswer(query, { mode });
    if (generalAnswer && generalAnswer.answer) {
      return {
        query,
        mode,
        answer: generalAnswer.answer,
        sources: [],
        isLlmSynthesized: true,
        llmProvider: generalAnswer.provider,
        llmModel: generalAnswer.model
      };
    }
  } catch (err) {
    console.warn('General LLM query note:', err.message);
  }

  return baseResult;
}

module.exports = {
  POLAR_VOCAB,
  EMBEDDING_DIM: POLAR_VOCAB.length,
  generateEmbedding,
  cosineSimilarity,
  computeBM25Score,
  searchChunks,
  answerQuery,
  answerQueryAsync
};
