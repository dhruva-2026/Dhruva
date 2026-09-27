/**
 * API Service Client for DHRUVA Polar Science Portal
 */

const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('dhruva_token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('dhruva_token', token);
}

export function clearAuthToken() {
  localStorage.removeItem('dhruva_token');
  localStorage.removeItem('dhruva_user');
}

export function getStoredUser(): any | null {
  const data = localStorage.getItem('dhruva_user');
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch (e) {
    return null;
  }
}

export function setStoredUser(user: any) {
  localStorage.setItem('dhruva_user', JSON.stringify(user));
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Network request failed');
  }

  return data as T;
}

// 1. Auth API
export const apiLogin = (email: string, password?: string, expectedRole?: string) =>
  request<{ message: string; token: string; user: any }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password, expectedRole })
  });

export const apiRegister = (payload: { name: string; email: string; password: string; role: string; institution?: string }) =>
  request<{ message: string; token: string; user: any }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

export const apiGetDemoAccounts = () =>
  request<{ demoAccounts: any[] }>('/auth/demo-accounts');

// 1.1 Chat Persistence API
export const apiFetchChatSessions = () =>
  request<{ sessions: any[] }>('/chat/sessions');

export const apiCreateChatSession = (title?: string) =>
  request<{ session: any }>('/chat/sessions', {
    method: 'POST',
    body: JSON.stringify({ title })
  });

export const apiRenameChatSession = (id: string, title: string) =>
  request<{ session: any }>(`/chat/sessions/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ title })
  });

export const apiDeleteChatSession = (id: string) =>
  request<{ message: string }>(`/chat/sessions/${id}`, {
    method: 'DELETE'
  });

export const apiFetchChatMessages = (sessionId: string) =>
  request<{ messages: any[] }>(`/chat/sessions/${sessionId}/messages`);

export const apiSendChatMessage = (sessionId: string, payload: { role: 'user' | 'assistant'; content: string; sources?: any[] }) =>
  request<{ message: any }>(`/chat/sessions/${sessionId}/messages`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });

// 2. Papers API
export const apiFetchPapers = (params: Record<string, any> = {}) => {
  const query = new URLSearchParams();
  Object.keys(params).forEach(k => {
    if (params[k] !== undefined && params[k] !== null && params[k] !== '') {
      query.append(k, params[k]);
    }
  });
  return request<{ count: number; papers: any[] }>(`/papers?${query.toString()}`);
};

export const apiFetchFeaturedPapers = () =>
  request<{ papers: any[] }>('/papers/featured');

export const apiFetchPaperById = (id: string) =>
  request<{
    paper: any;
    sections: any[];
    aiOutput: any;
    mcqs: any[];
    flashcards: any[];
    claims: any[];
  }>(`/papers/${id}`);

// 3. RAG Engine API
export const apiAskRAG = (payload: { query: string; paperId?: string; region?: string; area?: string }) =>
  request<{
    query: string;
    answer: string;
    sources: Array<{
      paperId: string;
      paperTitle: string;
      sectionName: string;
      pageNumber: number;
      confidenceScore: number;
      snippet: string;
    }>;
  }>('/rag/ask', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

// 3.1 Dedicated AI Subsystem APIs
export const apiAiHealth = () =>
  request<{
    status: string;
    aiEngine: string;
    embeddingService: any;
    scoringFormula: string;
    database: any;
    liveLlmProvider: string;
  }>('/ai/health');

export const apiAiSearch = (payload: { query: string; limit?: number; filters?: Record<string, any> }) =>
  request<{
    query: string;
    total: number;
    scoring: string;
    results: Array<{
      chunkId: string;
      paperId: string;
      paperTitle: string;
      polarRegion: string;
      researchArea: string;
      section: string;
      page: number;
      snippet: string;
      cosineScore: number;
      keywordScore: number;
      hybridScore: number;
      confidence: number;
      provenance: any;
    }>;
  }>('/ai/search', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

export const apiAiAsk = (payload: { query: string; paperId?: string; region?: string; area?: string }) =>
  request<{
    answer: string;
    sources: any[];
    confidence: number;
    retrieval: any;
  }>('/ai/ask', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

export const apiAiSummarize = (paperId: string) =>
  request<{
    paperId: string;
    paperTitle: string;
    englishSummary: string;
    hindiSummary: string;
    keyFindings: string[];
    importantTerms: Array<{ term: string; definition: string }>;
    whyItMatters: string;
    socialMediaDraft: string;
    citationText: string;
    generatedAt: string;
  }>('/ai/summarize', {
    method: 'POST',
    body: JSON.stringify({ paperId })
  });

export const apiAiClaims = (paperId: string) =>
  request<{
    paperId: string;
    totalClaims: number;
    claims: any[];
  }>('/ai/claims', {
    method: 'POST',
    body: JSON.stringify({ paperId })
  });

export const apiAiVerifyClaim = (claimId: string, payload: {
  paperId?: string;
  decision: 'Approved' | 'Edited' | 'Rejected';
  reviewerComment?: string;
  editedText?: string;
}) =>
  request<{ message: string; claimId: string; decision: string; groundingStatus: string }>(`/ai/claims/${claimId}/verify`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });

export const apiAiGenerateMCQs = (paperId: string) =>
  request<{
    paperId: string;
    totalMCQs: number;
    mcqs: any[];
  }>('/ai/mcqs/generate', {
    method: 'POST',
    body: JSON.stringify({ paperId })
  });

export const apiAiGenerateFlashcards = (paperId: string) =>
  request<{
    paperId: string;
    totalFlashcards: number;
    flashcards: any[];
  }>('/ai/flashcards/generate', {
    method: 'POST',
    body: JSON.stringify({ paperId })
  });

// 4. Polar Locations & Media
export const apiFetchLocations = () =>
  request<{ locations: any[] }>('/locations');

export const apiFetchLocationById = (id: string) =>
  request<{ location: any; papers: any[] }>(`/locations/${id}`);

export const apiFetchMedia = (params: { type?: string; region?: string } = {}) => {
  const query = new URLSearchParams();
  if (params.type) query.append('type', params.type);
  if (params.region) query.append('region', params.region);
  return request<{ media: any[] }>(`/media?${query.toString()}`);
};

// 5. Researcher Portal API
export const apiFetchResearcherDashboard = () =>
  request<{ metrics: any; recentPapers: any[] }>('/researcher/dashboard');

export const apiFetchResearcherPapers = (status: string = 'all') =>
  request<{ papers: any[] }>(`/researcher/papers?status=${status}`);

export const apiUploadPaper = (data: any) =>
  request<{ message: string; paperId: string; status: string }>('/researcher/upload', {
    method: 'POST',
    body: JSON.stringify(data)
  });

export const apiResubmitPaper = (id: string, data: any) =>
  request<{ message: string; paperId: string }>(`/researcher/resubmit/${id}`, {
    method: 'POST',
    body: JSON.stringify(data)
  });

// 6. Admin Portal API
export const apiFetchAdminDashboard = () =>
  request<{ metrics: any }>('/admin/dashboard');

export const apiFetchAdminQueue = () =>
  request<{ queue: any[] }>('/admin/queue');

export const apiFetchAdminVerification = (paperId: string) =>
  request<{
    paper: any;
    sections: any[];
    aiOutput: any;
    mcqs: any[];
    flashcards: any[];
    claims: any[];
  }>(`/admin/verification/${paperId}`);

export const apiVerifyClaim = (payload: {
  claimId: string;
  paperId: string;
  decision: 'Approved' | 'Edited' | 'Rejected';
  reviewerComment?: string;
  editedText?: string;
}) =>
  request<{ message: string; claimId: string; decision: string; groundingStatus: string }>('/admin/claims/verify', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

export const apiDecidePaper = (payload: {
  paperId: string;
  decision: 'approve' | 'reject';
  comment?: string;
  reason?: string;
  overrideEmbargo?: boolean;
}) =>
  request<{ message: string; status: string; visibility: string }>('/admin/papers/decision', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

export const apiOverrideEmbargo = (paperId: string, action: 'release' | 'extend') =>
  request<{ message: string; status: string }>('/admin/embargo/override', {
    method: 'POST',
    body: JSON.stringify({ paperId, action })
  });

export const apiFetchAuditLogs = () =>
  request<{ logs: any[] }>('/admin/audit-logs');

export const apiFetchAnalytics = () =>
  request<{
    regionBreakdown: any[];
    areaBreakdown: any[];
    statusBreakdown: any[];
    topViewed: any[];
    questionsAnswered: number;
  }>('/admin/analytics');
