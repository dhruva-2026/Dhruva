/**
 * DHRUVA Multi-Provider Research-Grade LLM Intelligence Gateway
 * Single Unified LLM Gateway for DHRUVA Backend
 * Hierarchy: Groq (Primary: Llama 3.3 70B) -> Google Gemini (Fallback: Gemini 1.5 Flash) -> Grounded Deterministic Engine
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

/**
 * Call Groq Cloud API (OpenAI Compatible)
 */
async function callGroq(systemPrompt, userPrompt, options = {}) {
  const apiKey = (process.env.GROQ_API_KEY || '').trim();
  if (!apiKey) throw new Error('GROQ_API_KEY is not configured');

  const { temperature = 0.2, max_tokens = 1600, jsonMode = false, messages: priorMessages = [] } = options;

  const messages = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }

  // Include conversation history if provided
  if (priorMessages && priorMessages.length > 0) {
    priorMessages.forEach(m => {
      if (m.role && m.content) {
        messages.push({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content });
      }
    });
  }

  messages.push({ role: 'user', content: userPrompt });

  const body = {
    model: GROQ_MODEL,
    messages,
    temperature,
    max_tokens
  };

  if (jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq API Error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Groq returned empty completion');

  return {
    provider: 'Groq',
    model: GROQ_MODEL,
    content: content.trim()
  };
}

/**
 * Call Google Gemini API (REST / v1beta generateContent)
 */
async function callGemini(systemPrompt, userPrompt, options = {}) {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');

  const { temperature = 0.2, max_tokens = 1600, jsonMode = false, messages: priorMessages = [] } = options;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const generationConfig = {
    temperature,
    maxOutputTokens: max_tokens
  };

  if (jsonMode) {
    generationConfig.responseMimeType = 'application/json';
  }

  const contents = [];

  // Add system instruction as initial user/model priming or structured prompt
  let combinedPrompt = systemPrompt ? `System Instructions:\n${systemPrompt}\n\n` : '';

  if (priorMessages && priorMessages.length > 0) {
    combinedPrompt += 'Conversation Context:\n';
    priorMessages.forEach(m => {
      combinedPrompt += `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}\n`;
    });
    combinedPrompt += '\n';
  }

  combinedPrompt += `User Query:\n${userPrompt}`;

  contents.push({
    role: 'user',
    parts: [{ text: combinedPrompt }]
  });

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      generationConfig
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API Error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) throw new Error('Gemini returned empty candidate');

  return {
    provider: 'Google Gemini',
    model: GEMINI_MODEL,
    content: content.trim()
  };
}

/**
 * Universal text generation with automatic provider cascade:
 * Groq -> Gemini -> null
 */
async function generateChatCompletion(systemPrompt, userPrompt, options = {}) {
  const groqKey = (process.env.GROQ_API_KEY || '').trim();
  const geminiKey = (process.env.GEMINI_API_KEY || '').trim();

  // 1. Primary: Groq (Llama 3.3 70B)
  if (groqKey) {
    try {
      return await callGroq(systemPrompt, userPrompt, options);
    } catch (groqErr) {
      console.warn(`⚠️ Groq API attempt failed (${groqErr.message}). Switching to Google Gemini fallback...`);
    }
  }

  // 2. Fallback: Google Gemini (Gemini 1.5 Flash)
  if (geminiKey) {
    try {
      return await callGemini(systemPrompt, userPrompt, options);
    } catch (geminiErr) {
      console.warn(`⚠️ Gemini API attempt failed (${geminiErr.message}).`);
    }
  }

  return null;
}

/**
 * Helper to clean and parse JSON from LLM responses (strips ```json ... ``` codeblocks)
 */
function parseJsonFromLlm(text) {
  if (!text) return null;
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/i, '').replace(/\s*```$/, '');
  }
  return JSON.parse(cleaned);
}

/**
 * Universal JSON generator with schema enforcement
 */
async function generateStructuredJson(systemPrompt, userPrompt, options = {}) {
  const completion = await generateChatCompletion(
    systemPrompt + '\nIMPORTANT: Respond ONLY with a single valid JSON object or array. Do NOT include markdown text outside the JSON.',
    userPrompt,
    { ...options, jsonMode: true }
  );

  if (!completion || !completion.content) return null;

  try {
    const parsed = parseJsonFromLlm(completion.content);
    return {
      data: parsed,
      provider: completion.provider,
      model: completion.model
    };
  } catch (parseErr) {
    console.warn(`⚠️ JSON parsing failed on ${completion.provider} response:`, parseErr.message);
    return null;
  }
}

/**
 * Synthesize a research-grade grounded RAG answer with live LLM and citation references
 */
async function synthesizeRAGAnswer(query, sources, options = {}) {
  if (!sources || sources.length === 0) return null;

  const mode = options.mode || 'detailed_explanation';
  const history = options.history || [];

  const contextPrompt = sources.map((c, i) => 
    `[Source ${i+1}: "${c.paperTitle}", Section: ${c.sectionName}, Page: ${c.pageNumber}]\n${c.snippet || c.text}`
  ).join('\n\n');

  let modeInstruction = '';
  switch (mode) {
    case 'compare_papers':
      modeInstruction = 'Produce a structured comparison highlighting differences in research area, observational timeframe, methodology, and key quantitative findings, followed by an overarching synthesis.';
      break;
    case 'methodology_analysis':
      modeInstruction = 'Focus deeply on experimental design, sensors, oceanographic moorings/satellite telemetry, coordinate zones, and statistical validation (p-values, Mann-Kendall tests).';
      break;
    case 'key_findings':
      modeInstruction = 'Present findings as clear, bulleted empirical observations with exact numerical metrics, seasonal anomalies, and statistical confidences.';
      break;
    case 'research_summary':
      modeInstruction = 'Provide an executive academic summary: Objective, Methodology, Key Observations, and Planetary Implications.';
      break;
    case 'student_beginner':
      modeInstruction = 'Explain the polar science concepts clearly and accessibly with intuitive analogies, bold scientific terms, and step-by-step points.';
      break;
    case 'expert_explanation':
      modeInstruction = 'Provide a rigorous thermodynamic, atmospheric, and biogeochemical explanation utilizing exact polar terminology.';
      break;
    case 'quick_answer':
      modeInstruction = 'Provide a concise, direct answer in 2-3 focused paragraphs with direct citations.';
      break;
    default:
      modeInstruction = 'Provide a comprehensive scientific answer with formatted markdown headings (###), bullet points, blockquotes for primary measurements, and clear takeaways.';
  }

  const systemPrompt = `You are DHRUVA AI, the research-grade Polar Science Intelligence Assistant for India's National Centre for Polar and Ocean Research (NCPOR / Ministry of Earth Sciences, Government of India).

Core Directives:
1. Ground every scientific claim strictly in the provided verified research source chunks.
2. Include in-text citations referencing the exact paper title, section name, and page number (e.g. *[Paper Title, Section, p.X]*).
3. If the provided sources only partially answer the question, explicitly state the boundaries of the documented research rather than speculating or inventing data.
4. Distinguish between empirical field observations and theoretical interpretations.
5. NEVER hallucinate papers, dates, statistics, author names, or experimental findings.
6. Response Mode: ${modeInstruction}`;

  const userPrompt = `Verified Polar Science Context Chunks:\n${contextPrompt}\n\nUser Question:\n${query}`;

  const completion = await generateChatCompletion(systemPrompt, userPrompt, {
    temperature: 0.2,
    max_tokens: 1200,
    messages: history.slice(-4)
  });

  if (completion) {
    return {
      answer: completion.content,
      provider: completion.provider,
      model: completion.model
    };
  }

  return null;
}

/**
 * Generate a rich, conversational polar science answer for general inquiries (e.g. "what are poles", "hi", "what is antarctica")
 */
async function generateGeneralPolarAnswer(query, options = {}) {
  const mode = options.mode || 'detailed_explanation';

  const systemPrompt = `You are DHRUVA AI (ध्रुव), the official Polar Science & Cryosphere Intelligence Assistant for India's National Centre for Polar and Ocean Research (NCPOR / Ministry of Earth Sciences, Government of India).

You provide clear, engaging, scientifically rigorous, and friendly answers to questions regarding:
- General greetings and introductions (Namaste, polite exploration guidance)
- Earth's Poles (North Pole/Arctic, South Pole/Antarctica, Third Pole/Himalayas)
- India's Polar Research Stations (Himadri in Svalbard, Maitri & Bharati in Antarctica, IndARC underwater mooring observatory in Kongsfjorden, Himansh in Himalayas)
- Polar science concepts, climate change, glaciers, oceans, wildlife, permafrost, and ice sheets.

Guidelines:
1. Always maintain a professional, warm, and research-grade educational tone.
2. Structure answers with clean markdown headings (###), bold key terms, and bullet points.
3. Highlight India's scientific expeditions through NCPOR and MoES where appropriate.
4. Response Mode: ${mode}`;

  const userPrompt = `User Query: ${query}`;
  const completion = await generateChatCompletion(systemPrompt, userPrompt, {
    temperature: 0.3,
    max_tokens: 950
  });

  if (completion) {
    return {
      answer: completion.content,
      provider: completion.provider,
      model: completion.model
    };
  }

  return null;
}

/**
 * Generate full dynamic document artifacts (summaries, MCQs, flashcards, claims) using live LLM
 */
async function generateDocumentArtifactsWithLLM({
  title,
  abstract,
  text = '',
  region = 'Antarctic',
  area = 'Glaciology',
  institution = 'National Centre for Polar and Ocean Research',
  authors = 'NCPOR Scientist'
}) {
  const isAntarctic = region.toLowerCase().includes('antarctic');
  const polarZone = isAntarctic ? 'Antarctic' : 'Arctic';

  const systemPrompt = `You are the lead polar science editor and AI synthesizer for DHRUVA (NCPOR / Ministry of Earth Sciences, India).
You will receive metadata and text of a polar research manuscript.
Generate a structured JSON output with educational, outreach, and verification artifacts.

Return a JSON object with this EXACT structure:
{
  "english_summary": "Plain, engaging English summary explaining the core findings for educators and media (3-4 sentences)",
  "hindi_summary": "उच्च स्तरीय प्रामाणिक हिंदी सारांश (3-4 वाक्य जो शोध के मुख्य निष्कर्षों को समझाते हैं)",
  "key_findings": ["Finding 1 with quantitative facts", "Finding 2", "Finding 3", "Finding 4"],
  "important_terms": [
    {"term": "Term Name", "definition": "Clear polar science definition"},
    {"term": "Term Name 2", "definition": "Clear polar science definition"},
    {"term": "Term Name 3", "definition": "Clear polar science definition"},
    {"term": "Term Name 4", "definition": "Clear polar science definition"}
  ],
  "why_it_matters": "2 sentences explaining the climate and societal importance to India and the world",
  "social_media_draft": "Engaging Twitter/LinkedIn outreach post with emojis and #DHRUVA #PolarScience #NCPOR hashtags",
  "mcqs": [
    {
      "question": "Scientific question grounded in the study",
      "option_a": "Option A text",
      "option_b": "Option B text",
      "option_c": "Option C text",
      "option_d": "Option D text",
      "correct_option": "A",
      "explanation": "In-depth explanation referencing the exact findings",
      "source_section": "Results",
      "source_page": 8
    }
  ],
  "flashcards": [
    {
      "front": "Key polar concept or question from paper",
      "back": "Detailed scientific answer with facts and significance"
    }
  ],
  "claims": [
    {
      "claim": "Specific factual scientific claim from paper",
      "status": "verified",
      "confidence": 95,
      "source_section": "Results"
    }
  ]
}`;

  const userPrompt = `Paper Details:
Title: ${title}
Polar Zone: ${polarZone}
Research Area: ${area}
Institution: ${institution}
Authors: ${authors}
Abstract: ${abstract}
Text Extract: ${text.slice(0, 3000)}`;

  const result = await generateStructuredJson(systemPrompt, userPrompt, {
    temperature: 0.2,
    max_tokens: 3000
  });

  return result ? result.data : null;
}

/**
 * Check provider status & health
 */
function getLLMProviderStatus() {
  const groqKey = (process.env.GROQ_API_KEY || '').trim();
  const geminiKey = (process.env.GEMINI_API_KEY || '').trim();

  return {
    groq: {
      configured: !!groqKey,
      model: GROQ_MODEL,
      keyMasked: groqKey ? `${groqKey.slice(0, 6)}...${groqKey.slice(-4)}` : null
    },
    gemini: {
      configured: !!geminiKey,
      model: GEMINI_MODEL,
      keyMasked: geminiKey ? `${geminiKey.slice(0, 6)}...${geminiKey.slice(-4)}` : null
    },
    activeProvider: groqKey 
      ? 'Groq (Llama 3.3 70B)' 
      : (geminiKey ? 'Google Gemini (1.5 Flash)' : 'Deterministic Grounded Engine')
  };
}

module.exports = {
  callGroq,
  callGemini,
  generateChatCompletion,
  generateStructuredJson,
  synthesizeRAGAnswer,
  generateGeneralPolarAnswer,
  generateDocumentArtifactsWithLLM,
  getLLMProviderStatus
};
