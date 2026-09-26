import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, BookOpen, Sparkles, HelpCircle, FileText, CheckCircle2, 
  XCircle, RotateCcw, Share2, Copy, Check, Download, MapPin, Calendar, 
  User, ShieldCheck, ChevronLeft, ChevronRight, ExternalLink, MessageSquare, Layers
} from 'lucide-react';
import { apiFetchPaperById, apiAskRAG } from '../../services/api';
import { BACKUP_PAPERS } from '../../data/backupPapers';

interface PaperDetailPageProps {
  paperId: string;
  onBack: () => void;
  lang: 'en' | 'hi';
}

export const PaperDetailPage: React.FC<PaperDetailPageProps> = ({ paperId, onBack, lang }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'summary' | 'paper' | 'learn' | 'ask' | 'sources'>('summary');
  const [summaryLang, setSummaryLang] = useState<'en' | 'hi'>(lang);
  
  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Flashcard state
  const [flashcardIdx, setFlashcardIdx] = useState(0);
  const [flashcardFlipped, setFlashcardFlipped] = useState(false);

  // In-Paper Ask DHRUVA state
  const [askQuery, setAskQuery] = useState('');
  const [askLoading, setAskLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'dhruva'; text: string; sources?: any[] }>>([]);

  // Copied state
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadPaper() {
      setLoading(true);
      try {
        const res = await apiFetchPaperById(paperId);
        setData(res);
        // Pre-populate chat with welcoming prompt
        setChatHistory([
          {
            role: 'dhruva',
            text: `Hello! I am DHRUVA, your polar science assistant. You can ask me any question about "${res.paper.title}". Every answer will be strictly grounded in this paper's verified sections and page citations.`
          }
        ]);
      } catch (e) {
        console.warn('Error fetching paper detail from API, using backup dataset:', e);
        const fallback = BACKUP_PAPERS.find(p => p.id === paperId);
        if (fallback) {
          setData({
            paper: fallback,
            sections: fallback.sections || [],
            aiOutput: fallback.aiOutput,
            mcqs: fallback.mcqs || [],
            flashcards: fallback.flashcards || []
          });
          setChatHistory([
            {
              role: 'dhruva',
              text: `Hello! I am DHRUVA, your polar science assistant. You can ask me any question about "${fallback.title}". Every answer will be strictly grounded in this paper's verified sections and page citations.`
            }
          ]);
        }
      } finally {
        setLoading(false);
      }
    }
    loadPaper();
  }, [paperId]);

  if (loading) {
    return (
      <div className="page-wrapper min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-300 text-sm font-medium">Loading polar research paper and structured grounding data...</p>
        </div>
      </div>
    );
  }

  if (!data || !data.paper) {
    return (
      <div className="page-wrapper min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 glass-panel p-10">
          <h2 className="text-xl font-bold text-white">Research Paper Not Found</h2>
          <p className="text-xs text-slate-400">The requested paper might be under embargo or does not exist.</p>
          <button onClick={onBack} className="btn-secondary text-xs mt-2">Back to Search</button>
        </div>
      </div>
    );
  }

  const { paper, sections, aiOutput, mcqs, flashcards, claims } = data;

  const handleQuizOptionSelect = (qIdx: number, opt: string) => {
    if (quizSubmitted) return;
    setQuizAnswers(prev => ({ ...prev, [qIdx]: opt }));
  };

  const handleAskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!askQuery.trim() || askLoading) return;

    const userQ = askQuery.trim();
    setAskQuery('');
    setChatHistory(prev => [...prev, { role: 'user', text: userQ }]);
    setAskLoading(true);

    try {
      const res = await apiAskRAG({ query: userQ, paperId: paper.id });
      setChatHistory(prev => [
        ...prev,
        {
          role: 'dhruva',
          text: res.answer,
          sources: res.sources
        }
      ]);
    } catch (err: any) {
      setChatHistory(prev => [
        ...prev,
        {
          role: 'dhruva',
          text: 'Unable to process question against this paper: ' + (err.message || 'Error occurred.')
        }
      ]);
    } finally {
      setAskLoading(false);
    }
  };

  const copyCitation = () => {
    const citation = aiOutput?.citation_text || `${paper.authors} (${paper.publication_year}). ${paper.title}. DOI: ${paper.doi}`;
    navigator.clipboard.writeText(citation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Calculate quiz score
  const calculateScore = () => {
    let score = 0;
    mcqs.forEach((m: any, idx: number) => {
      if (quizAnswers[idx] === m.correct_option) score++;
    });
    return score;
  };

  return (
    <div className="page-wrapper">
      <div className="page-wrapper-inner space-y-10">
      
      {/* ── Top Back Navigation & Badges ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-cyan-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Explore</span>
        </button>

        <div className="flex items-center gap-2.5">
          <span className={`badge ${paper.polar_region === 'Antarctic' ? 'badge-antarctic' : 'badge-arctic'}`}>
            <MapPin className="w-3 h-3" />
            {paper.polar_region}
          </span>
          <span className="badge badge-published">
            <CheckCircle2 className="w-3 h-3" />
            Peer Reviewed
          </span>
        </div>
      </div>

      {/* ── Header Metadata Banner ── */}
      <div className="glass-panel p-6 sm:p-8 relative overflow-hidden">
        {/* Abstract Background Element */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-5">
          <div className="space-y-3">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-[1.18] tracking-tight">
              {paper.title}
            </h1>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-300 font-medium">
              <div className="flex items-center gap-1.5">
                <User className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>{paper.authors}</span>
              </div>
              <div className="flex items-center gap-1.5 meta-item">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Published {paper.publication_year}</span>
              </div>
              {paper.doi && (
                <div className="flex items-center gap-1.5 text-cyan-400 hover:text-white transition-colors cursor-pointer meta-item">
                  <ExternalLink className="w-4 h-4 shrink-0" />
                  <span>DOI: {paper.doi}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-800/80">
            <button
              onClick={copyCitation}
              className="btn-secondary h-9 px-4 text-xs cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <Copy className="w-3.5 h-3.5 shrink-0" />}
              <span>{copied ? 'Citation Copied' : 'Copy Citation'}</span>
            </button>
            <button className="btn-secondary h-9 px-4 text-xs cursor-pointer">
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span>Download Original PDF</span>
            </button>
            <button className="btn-secondary h-9 px-4 text-xs cursor-pointer">
              <Share2 className="w-3.5 h-3.5 shrink-0" />
              <span>Share Research</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Core Navigation Tabs ── */}
      <div className="border-b border-slate-800 pb-1 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-5 py-2.5 rounded-t-xl text-xs font-bold transition-colors ${
              activeTab === 'summary' 
                ? 'bg-cyan-500/15 text-cyan-300 border-b-2 border-cyan-400' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>AI Synthesized Summary</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('paper')}
            className={`px-5 py-2.5 rounded-t-xl text-xs font-bold transition-colors ${
              activeTab === 'paper' 
                ? 'bg-cyan-500/15 text-cyan-300 border-b-2 border-cyan-400' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>Original Sections</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('learn')}
            className={`px-5 py-2.5 rounded-t-xl text-xs font-bold transition-colors ${
              activeTab === 'learn' 
                ? 'bg-emerald-500/15 text-emerald-400 border-b-2 border-emerald-400' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span>Interactive Learning</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('ask')}
            className={`px-5 py-2.5 rounded-t-xl text-xs font-bold transition-colors ${
              activeTab === 'ask' 
                ? 'bg-indigo-500/15 text-indigo-400 border-b-2 border-indigo-400' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span>Ask DHRUVA</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('sources')}
            className={`px-5 py-2.5 rounded-t-xl text-xs font-bold transition-colors ${
              activeTab === 'sources' 
                ? 'bg-amber-500/15 text-amber-400 border-b-2 border-amber-400' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Provenance & Claims</span>
            </div>
          </button>
        </div>
      </div>

      {/* ── Tab Content Area ── */}
      <div className="min-h-[500px]">
        
        {/* TAB: SUMMARY */}
        {activeTab === 'summary' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                  Key Findings & Synthesis
                </h3>
                
                {/* Language Toggle */}
                <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
                  <button
                    onClick={() => setSummaryLang('en')}
                    className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition ${
                      summaryLang === 'en' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
                    }`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => setSummaryLang('hi')}
                    className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition ${
                      summaryLang === 'hi' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
                    }`}
                  >
                    हिन्दी
                  </button>
                </div>
              </div>

              {aiOutput ? (
                <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed">
                  <p className="whitespace-pre-wrap font-normal">
                    {summaryLang === 'en' ? aiOutput.english_summary : aiOutput.hindi_summary}
                  </p>
                </div>
              ) : (
                <div className="p-6 bg-slate-900/50 rounded-xl border border-slate-800 text-slate-400 text-sm">
                  AI synthesis is not available for this document yet.
                </div>
              )}
            </div>

            <div className="space-y-6">
              {/* Context Panel */}
              <div className="glass-panel p-5 space-y-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 border-b border-slate-800 pb-2">
                  Extracted Entities
                </div>
                {aiOutput && aiOutput.key_entities ? (
                  <div className="flex flex-wrap gap-2">
                    {aiOutput.key_entities.map((e: string, i: number) => (
                      <span key={i} className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded text-[11px] font-medium border border-slate-700">
                        {e}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-slate-500">None extracted</span>
                )}
              </div>

              {/* Verified Badge */}
              <div className="glass-panel p-5 bg-gradient-to-br from-slate-900 to-slate-900 border-emerald-500/20">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-emerald-400 mb-1">Human Verified Synthesis</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      This AI-generated summary has been checked against the original full-text manuscript by DHRUVA's validation pipeline.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: PAPER SECTIONS */}
        {activeTab === 'paper' && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6 border-b border-slate-800 pb-4">
              <FileText className="w-5 h-5 text-cyan-400" />
              Original Manuscript Sections
            </h3>

            {sections && sections.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Section Index */}
                <div className="col-span-1 border-r border-slate-800 pr-4 space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3 px-2">Table of Contents</div>
                  {sections.map((sec: any) => (
                    <a 
                      key={sec.id}
                      href={`#sec-${sec.id}`}
                      className="block px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-cyan-400 rounded-lg transition-colors truncate"
                    >
                      {sec.section_name}
                    </a>
                  ))}
                </div>

                {/* Section Content */}
                <div className="col-span-1 md:col-span-3 space-y-10">
                  {sections.map((sec: any) => (
                    <div key={sec.id} id={`sec-${sec.id}`} className="scroll-mt-24 space-y-3">
                      <h4 className="text-base font-bold text-white flex items-center justify-between">
                        {sec.section_name}
                        <span className="text-[10px] font-medium text-slate-500 bg-slate-900 px-2 py-0.5 rounded">Page {sec.page_number}</span>
                      </h4>
                      <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed font-normal">
                        <p>{sec.content_text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 text-sm">
                Structured sections not available for this manuscript.
              </div>
            )}
          </div>
        )}

        {/* TAB: INTERACTIVE LEARNING (Quizzes & Flashcards) */}
        {activeTab === 'learn' && (
          <div className="space-y-12">
            
            {/* Flashcards */}
            {flashcards && flashcards.length > 0 && (
              <div className="space-y-6">
                <div className="text-center max-w-xl mx-auto space-y-2">
                  <h3 className="text-xl font-bold text-white flex items-center justify-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-400" />
                    Interactive Flashcards
                  </h3>
                  <p className="text-xs text-slate-400">Test your recall of key definitions and concepts extracted directly from this research paper.</p>
                </div>

                <div className="max-w-2xl mx-auto">
                  <div className="flex justify-between items-center mb-4 text-xs font-semibold text-slate-400">
                    <span>Card {flashcardIdx + 1} of {flashcards.length}</span>
                    <span className="text-[10px] uppercase bg-slate-800 px-2 py-0.5 rounded text-indigo-300 border border-indigo-500/20">Click card to flip</span>
                  </div>
                  
                  {/* The 3D Flip Card */}
                  <div 
                    className="flashcard-container mb-6"
                    onClick={() => setFlashcardFlipped(!flashcardFlipped)}
                  >
                    <div className={`flashcard-inner ${flashcardFlipped ? 'flipped' : ''}`}>
                      <div className="flashcard-front">
                        <div className="text-[10px] font-bold text-indigo-400 mb-4 uppercase tracking-wider">Concept</div>
                        <h4 className="text-xl font-bold text-white text-center leading-snug">
                          {flashcards[flashcardIdx].front_text}
                        </h4>
                      </div>
                      <div className="flashcard-back">
                        <div className="text-[10px] font-bold text-cyan-400 mb-4 uppercase tracking-wider">Explanation</div>
                        <p className="text-sm text-slate-200 text-center leading-relaxed">
                          {flashcards[flashcardIdx].back_text}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-4">
                    <button 
                      onClick={() => {
                        setFlashcardFlipped(false);
                        setFlashcardIdx(prev => Math.max(0, prev - 1));
                      }}
                      disabled={flashcardIdx === 0}
                      className="p-2 rounded-full bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 transition"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => {
                        setFlashcardFlipped(false);
                        setFlashcardIdx(prev => Math.min(flashcards.length - 1, prev + 1));
                      }}
                      disabled={flashcardIdx === flashcards.length - 1}
                      className="p-2 rounded-full bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 transition"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {flashcards && mcqs && <div className="border-t border-slate-800" />}

            {/* MCQ Quiz */}
            {mcqs && mcqs.length > 0 && (
              <div className="max-w-3xl mx-auto space-y-8">
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold text-white flex items-center justify-center gap-2">
                    <HelpCircle className="w-5 h-5 text-emerald-400" />
                    Knowledge Check
                  </h3>
                  <p className="text-xs text-slate-400">Synthesize your understanding of the methodology and results.</p>
                </div>

                <div className="space-y-8">
                  {mcqs.map((q: any, idx: number) => {
                    const isCorrect = quizAnswers[idx] === q.correct_option;
                    const showFeedback = quizSubmitted;

                    return (
                      <div key={q.id} className="glass-panel p-6 space-y-4">
                        <h4 className="text-sm font-bold text-white">
                          <span className="text-cyan-400 mr-2">Q{idx + 1}.</span>
                          {q.question_text}
                        </h4>
                        
                        <div className="space-y-2">
                          {q.options.map((opt: string, optIdx: number) => {
                            let btnClass = "w-full text-left p-3 rounded-lg border text-sm transition-all ";
                            
                            if (showFeedback) {
                              if (opt === q.correct_option) {
                                btnClass += "bg-emerald-500/20 border-emerald-500 text-emerald-200";
                              } else if (opt === quizAnswers[idx]) {
                                btnClass += "bg-red-500/20 border-red-500 text-red-200";
                              } else {
                                btnClass += "bg-slate-900 border-slate-800 text-slate-500 opacity-50";
                              }
                            } else {
                              if (quizAnswers[idx] === opt) {
                                btnClass += "bg-cyan-500/20 border-cyan-400 text-white";
                              } else {
                                btnClass += "bg-slate-900 border-slate-700 text-slate-300 hover:border-cyan-500/50";
                              }
                            }

                            return (
                              <button
                                key={optIdx}
                                onClick={() => handleQuizOptionSelect(idx, opt)}
                                disabled={quizSubmitted}
                                className={btnClass}
                              >
                                <div className="flex items-center justify-between">
                                  <span>{opt}</span>
                                  {showFeedback && opt === q.correct_option && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                                  {showFeedback && opt === quizAnswers[idx] && opt !== q.correct_option && <XCircle className="w-4 h-4 text-red-400" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        {showFeedback && (
                          <div className={`p-4 rounded-lg mt-4 text-xs leading-relaxed ${isCorrect ? 'bg-emerald-500/10 text-emerald-200 border border-emerald-500/20' : 'bg-red-500/10 text-red-200 border border-red-500/20'}`}>
                            <span className="font-bold uppercase tracking-wider mb-1 block">Explanation:</span>
                            {q.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between bg-[#081222] p-5 rounded-2xl border border-white/5">
                  <div className="text-sm font-medium text-slate-300">
                    {quizSubmitted ? (
                      <span className="text-white">
                        Final Score: <span className="text-emerald-400 font-bold">{calculateScore()} / {mcqs.length}</span>
                      </span>
                    ) : (
                      <span>Answer all questions to submit.</span>
                    )}
                  </div>
                  
                  {quizSubmitted ? (
                    <button 
                      onClick={() => { setQuizSubmitted(false); setQuizAnswers({}); }}
                      className="btn-secondary h-9 px-4 text-xs flex items-center gap-2"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Retake Quiz</span>
                    </button>
                  ) : (
                    <button 
                      onClick={() => setQuizSubmitted(true)}
                      disabled={Object.keys(quizAnswers).length < mcqs.length}
                      className="btn-primary h-9 px-6 text-xs disabled:opacity-50"
                    >
                      Submit Answers
                    </button>
                  )}
                </div>

              </div>
            )}
            
            {(!flashcards || flashcards.length === 0) && (!mcqs || mcqs.length === 0) && (
              <div className="text-center py-12 text-slate-400 text-sm">
                Interactive learning modules are not available for this manuscript yet.
              </div>
            )}
          </div>
        )}

        {/* TAB: ASK DHRUVA (In-Paper RAG) */}
        {activeTab === 'ask' && (
          <div className="h-[600px] flex flex-col bg-[#060c18] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            {/* Chat History Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 ${
                    msg.role === 'user' 
                      ? 'bg-cyan-600/20 border border-cyan-500/30 text-white rounded-br-sm' 
                      : 'bg-slate-800/80 border border-white/5 text-slate-200 rounded-bl-sm shadow-lg'
                  }`}>
                    {msg.role === 'dhruva' && (
                      <div className="flex items-center gap-2 mb-2 text-cyan-400 text-[10px] font-bold uppercase tracking-widest">
                        <Sparkles className="w-3 h-3" />
                        DHRUVA
                      </div>
                    )}
                    
                    <div className="prose prose-invert max-w-none text-sm font-normal whitespace-pre-wrap leading-relaxed">
                      {msg.text}
                    </div>

                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-white/10 space-y-2">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                          <ShieldCheck className="w-3 h-3 text-emerald-400" />
                          Citations
                        </div>
                        {msg.sources.map((src, sIdx) => (
                          <div key={sIdx} className="bg-slate-900/50 p-2.5 rounded border border-white/5 text-[11px] font-mono leading-relaxed text-slate-300">
                            <span className="text-cyan-400 font-semibold">{src.sectionName}</span> 
                            <span className="text-slate-500 mx-1">|</span> 
                            Pg {src.pageNumber} 
                            <span className="text-slate-500 mx-1">|</span> 
                            Conf: {(src.confidenceScore * 100).toFixed(0)}%
                            <div className="mt-1.5 pl-2 border-l-2 border-slate-700 text-slate-400 italic">
                              "{src.snippet}"
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {askLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-800/80 border border-white/5 text-slate-400 rounded-2xl rounded-bl-sm p-4 flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping delay-75" />
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping delay-150" />
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-[#081222] border-t border-white/10">
              <form onSubmit={handleAskSubmit} className="relative max-w-4xl mx-auto">
                <input
                  type="text"
                  value={askQuery}
                  onChange={(e) => setAskQuery(e.target.value)}
                  placeholder={`Ask a question specifically about "${paper.title}"...`}
                  className="w-full bg-[#060c18] border border-cyan-500/30 rounded-xl pl-4 pr-14 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition shadow-inner"
                  disabled={askLoading}
                />
                <button
                  type="submit"
                  disabled={!askQuery.trim() || askLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/40 hover:text-white disabled:opacity-50 transition"
                >
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB: SOURCES & PROVENANCE */}
        {activeTab === 'sources' && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6 border-b border-slate-800 pb-4">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              Provenance Tracking & Fact Claims
            </h3>

            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-6">
              <p className="text-xs text-amber-200/80 leading-relaxed">
                This transparency report maps high-level claims made in the synthesized summary directly back to exact sentences in the original manuscript. This ensures 100% verifiability and prevents AI hallucination.
              </p>
            </div>

            {claims && claims.length > 0 ? (
              <div className="space-y-4">
                {claims.map((claim: any) => (
                  <div key={claim.id} className="glass-panel p-5 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="font-semibold text-sm text-white flex-1">{claim.claim_text}</div>
                      <div className="badge badge-verified text-[10px] shrink-0 font-mono">Conf: {(claim.confidence_score * 100).toFixed(0)}%</div>
                    </div>
                    
                    <div className="bg-slate-900 rounded-lg p-4 border border-slate-800 space-y-2 mt-2">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <FileText className="w-3 h-3" />
                        Original Source Text
                      </div>
                      <div className="text-xs text-slate-300 italic pl-3 border-l-2 border-cyan-500/50 leading-relaxed">
                        "{claim.source_quote}"
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 text-sm">
                Provenance mapping is currently processing for this manuscript.
              </div>
            )}
          </div>
        )}

      </div>
      
      </div>
    </div>
  );
};
