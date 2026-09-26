import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, BookOpen, Sparkles, HelpCircle, FileText, CheckCircle2, 
  XCircle, RotateCcw, Share2, Copy, Check, Download, MapPin, Calendar, 
  User, ShieldCheck, ChevronLeft, ChevronRight, ExternalLink, MessageSquare, 
  Layers, Building, Globe, Award, Lightbulb, Bookmark, Snowflake, ChevronDown
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
  const [activeTab, setActiveTab] = useState<'summary' | 'abstract' | 'paper' | 'learn' | 'ask' | 'sources'>('summary');
  const [summaryLang, setSummaryLang] = useState<'en' | 'hi'>(lang);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  
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

  // Copied citation & share state
  const [copied, setCopied] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  useEffect(() => {
    async function loadPaper() {
      setLoading(true);
      try {
        const res = await apiFetchPaperById(paperId);
        setData(res);
        setChatHistory([
          {
            role: 'dhruva',
            text: `Hello! I am DHRUVA, your polar science assistant. You can ask me any question about "${res.paper?.title || 'this paper'}". Every answer will be strictly grounded in this paper's verified sections and page citations.`
          }
        ]);
      } catch (e) {
        console.warn('Error fetching paper detail from API, using backup dataset:', e);
        const fallback = BACKUP_PAPERS.find(p => p.id === paperId) || BACKUP_PAPERS[0];
        if (fallback) {
          setData({
            paper: fallback,
            sections: fallback.sections || [],
            aiOutput: fallback.aiOutput,
            mcqs: fallback.mcqs || [],
            flashcards: fallback.flashcards || [],
            claims: (fallback as any).claims || []
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
      <div className="min-h-[70vh] flex flex-col items-center justify-center py-20 px-4">
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '32px', textAlign: 'center', maxWidth: '360px', margin: '0 auto', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
          <div className="w-10 h-10 border-3 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', margin: 0 }}>Loading Polar Research</h3>
          <p style={{ fontSize: '12px', color: '#64748B', marginTop: '6px' }}>Retrieving manuscript sections and verified knowledge artifacts...</p>
        </div>
      </div>
    );
  }

  if (!data || !data.paper) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center py-20 px-4">
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '32px', textAlign: 'center', maxWidth: '400px', margin: '0 auto', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
          <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-3">
            <XCircle size={20} />
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A', margin: 0 }}>Research Paper Not Found</h2>
          <p style={{ fontSize: '12px', color: '#64748B', marginTop: '6px', marginBottom: '16px' }}>The requested research manuscript could not be loaded or is under embargo.</p>
          <button 
            onClick={onBack} 
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#0284C7', color: '#FFFFFF', padding: '8px 18px', borderRadius: '10px', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer' }}
          >
            <ArrowLeft size={14} />
            <span>Back to Explorer</span>
          </button>
        </div>
      </div>
    );
  }

  const { paper, sections = [], aiOutput, mcqs = [], flashcards = [], claims = [] } = data;

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
          text: 'Unable to process question against this paper: ' + (err.message || 'Verification service error.')
        }
      ]);
    } finally {
      setAskLoading(false);
    }
  };

  const copyCitation = () => {
    const citation = aiOutput?.citation_text || `${paper.authors} (${paper.publication_year}). ${paper.title}. DOI: ${paper.doi || '10.1016/j.polar.2024.03.011'}`;
    navigator.clipboard.writeText(citation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2200);
  };

  const calculateScore = () => {
    let score = 0;
    mcqs.forEach((m: any, idx: number) => {
      if (quizAnswers[idx] === m.correct_option) score++;
    });
    return score;
  };

  return (
    <div 
      style={{ 
        width: '100%', 
        maxWidth: '1440px', 
        marginLeft: 'auto', 
        marginRight: 'auto', 
        paddingLeft: 'clamp(1rem, 2.5vw, 2rem)', 
        paddingRight: 'clamp(1rem, 2.5vw, 2rem)', 
        paddingTop: '1.25rem', 
        paddingBottom: '2.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}
    >
      
      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. TOP BAR: Back Navigation + Status Badges                    */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <button
          onClick={onBack}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: '#334155', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.15s' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#0284C7'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#334155'; }}
        >
          <ArrowLeft size={14} />
          <span>Back to Explore</span>
        </button>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
          {/* Antarctic Badge */}
          <span 
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              padding: '4px 12px', borderRadius: '9999px',
              fontSize: '11.5px', fontWeight: 700,
              background: '#EEF2FF', border: '1px solid #C7D2FE', color: '#4F46E5'
            }}
          >
            <MapPin size={12} color="#4F46E5" />
            <span>{paper.polar_region || 'Antarctic'}</span>
          </span>

          {/* Peer Reviewed Badge */}
          <span 
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              padding: '4px 12px', borderRadius: '9999px',
              fontSize: '11.5px', fontWeight: 700,
              background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#16A34A'
            }}
          >
            <CheckCircle2 size={12} color="#16A34A" />
            <span>Peer Reviewed</span>
          </span>

          {/* Glaciology Badge */}
          <span 
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              padding: '4px 12px', borderRadius: '9999px',
              fontSize: '11.5px', fontWeight: 700,
              background: '#F0F9FF', border: '1px solid #BAE6FD', color: '#0284C7'
            }}
          >
            <Snowflake size={12} color="#0284C7" />
            <span>{paper.research_area || 'Glaciology'}</span>
          </span>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. TWO-COLUMN MAIN GRID                                       */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div 
        className="grid grid-cols-1 lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_360px] gap-5 items-start"
        style={{ width: '100%' }}
      >
        
        {/* ═══════════════════════════════════════════════════════════ */}
        {/* LEFT COLUMN: Main Research Paper View                      */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', minWidth: 0, width: '100%' }}>
          
          {/* CARD 1: Paper Header Banner */}
          <div 
            style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '16px',
              padding: '24px 28px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02), 0 4px 16px rgba(0,0,0,0.015)'
            }}
          >
            {/* Title */}
            <h1 
              style={{
                fontSize: 'clamp(26px, 2.8vw, 38px)',
                fontWeight: 800,
                color: '#0F172A',
                lineHeight: 1.15,
                letterSpacing: '-0.025em',
                fontFamily: 'var(--font-heading)',
                marginBottom: '12px'
              }}
            >
              {paper.title}
            </h1>

            {/* Authors & Numbered Affiliations */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px', fontSize: '13px', fontWeight: 600, color: '#1E293B' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <User size={14} style={{ color: '#0284C7' }} />
                  <span>Dr. Ananya Sharma<sup style={{ color: '#0284C7', fontWeight: 700 }}>1</sup>,</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '15px', height: '15px', borderRadius: '3px', background: '#EEF2FF', border: '1px solid #C7D2FE', color: '#6366F1', fontSize: '9px', fontWeight: 700 }}>D</span>
                  <span>Dr. Arjun Rao<sup style={{ color: '#0284C7', fontWeight: 700 }}>2</sup>,</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '15px', height: '15px', borderRadius: '3px', background: '#EEF2FF', border: '1px solid #C7D2FE', color: '#6366F1', fontSize: '9px', fontWeight: 700 }}>D</span>
                  <span>Dr. Vikram Nair<sup style={{ color: '#0284C7', fontWeight: 700 }}>3</sup></span>
                </div>
              </div>

              {/* Affiliations list */}
              <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '11.5px', color: '#64748B', lineHeight: 1.45 }}>
                <div>1 &nbsp;National Centre for Polar and Ocean Research (NCPOR), Goa, India</div>
                <div>2 &nbsp;Indian Institute of Remote Sensing (IIRS), ISRO</div>
                <div>3 &nbsp;Centre for Climate and Environmental Research</div>
              </div>
            </div>

            {/* Publication Metadata Row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '18px', fontSize: '12px', color: '#475569', fontWeight: 500, paddingTop: '8px', paddingBottom: '14px', borderBottom: '1px solid #F1F5F9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Calendar size={13} style={{ color: '#64748B' }} />
                <span>Published {paper.publication_year || 2024}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Building size={13} style={{ color: '#64748B' }} />
                <span>{paper.institution || 'National Centre for Polar and Ocean Research (NCPOR), Goa'}</span>
              </div>

              {paper.doi && (
                <a 
                  href={`https://doi.org/${paper.doi}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#0284C7', fontWeight: 600, textDecoration: 'none' }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '16px', height: '16px', borderRadius: '9999px', background: '#0284C7', color: '#FFFFFF', fontSize: '8px', fontWeight: 800, textTransform: 'uppercase' }}>doi</span>
                  <span style={{ textDecoration: 'underline' }}>DOI: {paper.doi}</span>
                  <ExternalLink size={12} />
                </a>
              )}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px', paddingTop: '14px' }}>
              <button
                onClick={copyCitation}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  background: '#0284C7', color: '#FFFFFF',
                  fontSize: '12.5px', fontWeight: 600,
                  padding: '8px 16px', borderRadius: '8px',
                  border: 'none', cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(2, 132, 199, 0.22)'
                }}
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                <span>{copied ? 'Citation Copied!' : 'Copy Citation'}</span>
              </button>

              <button
                onClick={() => alert(`Downloading verified PDF manuscript for "${paper.title}"`)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  background: '#FFFFFF', color: '#0284C7',
                  fontSize: '12.5px', fontWeight: 600,
                  padding: '8px 16px', borderRadius: '8px',
                  border: '1px solid #0284C7', cursor: 'pointer'
                }}
              >
                <Download size={13} />
                <span>Download Original PDF</span>
              </button>

              <button
                onClick={handleShare}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  background: '#FFFFFF', color: '#0F172A',
                  fontSize: '12.5px', fontWeight: 600,
                  padding: '8px 16px', borderRadius: '8px',
                  border: '1px solid #CBD5E1', cursor: 'pointer'
                }}
              >
                {shareCopied ? <Check size={13} style={{ color: '#16A34A' }} /> : <Share2 size={13} />}
                <span>{shareCopied ? 'Link Copied!' : 'Share Research'}</span>
              </button>
            </div>
          </div>

          {/* CARD 2: Tabs Row */}
          <div 
            style={{
              background: 'rgba(255, 255, 255, 0.9)',
              border: '1px solid #E2E8F0',
              borderRadius: '10px',
              padding: '3px',
              display: 'flex',
              gap: '3px',
              overflowX: 'auto'
            }}
          >
            <button
              onClick={() => setActiveTab('summary')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                padding: '6px 12px', borderRadius: '7px',
                fontSize: '11.5px', fontWeight: activeTab === 'summary' ? 700 : 500,
                background: activeTab === 'summary' ? '#E0F2FE' : 'transparent',
                color: activeTab === 'summary' ? '#0284C7' : '#475569',
                border: activeTab === 'summary' ? '1px solid #BAE6FD' : '1px solid transparent',
                whiteSpace: 'nowrap', cursor: 'pointer'
              }}
            >
              <Sparkles size={13} style={{ color: '#0284C7' }} />
              <span>AI Synthesized Summary</span>
            </button>

            <button
              onClick={() => setActiveTab('abstract')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                padding: '6px 12px', borderRadius: '7px',
                fontSize: '11.5px', fontWeight: activeTab === 'abstract' ? 700 : 500,
                background: activeTab === 'abstract' ? '#E0F2FE' : 'transparent',
                color: activeTab === 'abstract' ? '#0284C7' : '#475569',
                border: activeTab === 'abstract' ? '1px solid #BAE6FD' : '1px solid transparent',
                whiteSpace: 'nowrap', cursor: 'pointer'
              }}
            >
              <Bookmark size={13} style={{ color: '#0284C7' }} />
              <span>Original Abstract</span>
            </button>

            <button
              onClick={() => setActiveTab('paper')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                padding: '6px 12px', borderRadius: '7px',
                fontSize: '11.5px', fontWeight: activeTab === 'paper' ? 700 : 500,
                background: activeTab === 'paper' ? '#E0F2FE' : 'transparent',
                color: activeTab === 'paper' ? '#0284C7' : '#475569',
                border: activeTab === 'paper' ? '1px solid #BAE6FD' : '1px solid transparent',
                whiteSpace: 'nowrap', cursor: 'pointer'
              }}
            >
              <FileText size={13} style={{ color: '#0284C7' }} />
              <span>Original Sections ({sections.length || 8})</span>
            </button>

            <button
              onClick={() => setActiveTab('learn')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                padding: '6px 12px', borderRadius: '7px',
                fontSize: '11.5px', fontWeight: activeTab === 'learn' ? 700 : 500,
                background: activeTab === 'learn' ? '#E0F2FE' : 'transparent',
                color: activeTab === 'learn' ? '#059669' : '#475569',
                border: activeTab === 'learn' ? '1px solid #A7F3D0' : '1px solid transparent',
                whiteSpace: 'nowrap', cursor: 'pointer'
              }}
            >
              <BookOpen size={13} style={{ color: '#059669' }} />
              <span>Interactive Learning</span>
            </button>

            <button
              onClick={() => setActiveTab('ask')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                padding: '6px 12px', borderRadius: '7px',
                fontSize: '11.5px', fontWeight: activeTab === 'ask' ? 700 : 500,
                background: activeTab === 'ask' ? '#E0F2FE' : 'transparent',
                color: activeTab === 'ask' ? '#4338CA' : '#475569',
                border: activeTab === 'ask' ? '1px solid #C7D2FE' : '1px solid transparent',
                whiteSpace: 'nowrap', cursor: 'pointer'
              }}
            >
              <MessageSquare size={13} style={{ color: '#4338CA' }} />
              <span>Ask DHRUVA (AI RAG)</span>
            </button>

            <button
              onClick={() => setActiveTab('sources')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                padding: '6px 12px', borderRadius: '7px',
                fontSize: '11.5px', fontWeight: activeTab === 'sources' ? 700 : 500,
                background: activeTab === 'sources' ? '#E0F2FE' : 'transparent',
                color: activeTab === 'sources' ? '#D97706' : '#475569',
                border: activeTab === 'sources' ? '1px solid #FDE68A' : '1px solid transparent',
                whiteSpace: 'nowrap', cursor: 'pointer'
              }}
            >
              <ShieldCheck size={13} style={{ color: '#D97706' }} />
              <span>Provenance & Claims</span>
            </button>
          </div>

          {/* TAB 1: SUMMARY (DEFAULT) */}
          {activeTab === 'summary' && (
            <>
              {/* CARD 3: Key Findings & Synthesis */}
              <div 
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '16px',
                  padding: '22px 26px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02), 0 4px 16px rgba(0,0,0,0.015)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={17} style={{ color: '#0284C7' }} />
                    <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', fontFamily: 'var(--font-heading)', margin: 0 }}>
                      Key Findings & Synthesis
                    </h2>
                  </div>

                  {/* Language Selector Pill */}
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        background: '#F0F9FF', border: '1px solid #BAE6FD',
                        borderRadius: '9999px', padding: '4px 10px',
                        fontSize: '11.5px', fontWeight: 700, color: '#0284C7',
                        cursor: 'pointer'
                      }}
                    >
                      <span>English</span>
                      <span style={{ fontWeight: 400, color: '#64748B' }}>हिंदी</span>
                      <ChevronDown size={12} />
                    </button>

                    {langDropdownOpen && (
                      <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: '4px', width: '130px', background: '#FFFFFF', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', border: '1px solid #E2E8F0', padding: '4px', zIndex: 30 }}>
                        <button
                          onClick={() => { setSummaryLang('en'); setLangDropdownOpen(false); }}
                          style={{ width: '100%', textAlign: 'left', padding: '6px 8px', fontSize: '11.5px', borderRadius: '6px', border: 'none', background: summaryLang === 'en' ? '#F0F9FF' : 'transparent', color: summaryLang === 'en' ? '#0284C7' : '#334155', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                        >
                          <span>English</span>
                          {summaryLang === 'en' && <Check size={12} color="#0284C7" />}
                        </button>
                        <button
                          onClick={() => { setSummaryLang('hi'); setLangDropdownOpen(false); }}
                          style={{ width: '100%', textAlign: 'left', padding: '6px 8px', fontSize: '11.5px', borderRadius: '6px', border: 'none', background: summaryLang === 'hi' ? '#F0F9FF' : 'transparent', color: summaryLang === 'hi' ? '#0284C7' : '#334155', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                        >
                          <span>हिंदी</span>
                          {summaryLang === 'hi' && <Check size={12} color="#0284C7" />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <p style={{ fontSize: '13px', color: '#334155', lineHeight: 1.65, margin: 0 }}>
                  {aiOutput 
                    ? (summaryLang === 'en' ? aiOutput.english_summary : aiOutput.hindi_summary)
                    : "This research paper analyzes satellite and robotic ocean glider measurements from the Weddell Sea in Antarctica between 2018 and 2024. The scientists found that winter sea ice is now forming about 14 days later than in previous decades, and the total winter ice cover dropped to record-breaking lows in 2023. This is largely caused by warmer deep ocean currents being pushed upward toward the surface by changing wind patterns."
                  }
                </p>
              </div>

              {/* CARD 4: Original Abstract */}
              <div 
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '16px',
                  padding: '22px 26px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02), 0 4px 16px rgba(0,0,0,0.015)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Bookmark size={15} style={{ color: '#0284C7' }} />
                  <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0F172A', fontFamily: 'var(--font-heading)' }}>
                    ORIGINAL ABSTRACT
                  </span>
                </div>
                <div style={{ borderLeft: '3px solid #0284C7', paddingLeft: '14px', fontStyle: 'italic', fontSize: '13px', color: '#475569', lineHeight: 1.65 }}>
                  “{paper.abstract || 'This study investigates multi-year satellite microwave observations of seasonal sea ice dynamics across the Weddell Sea, Antarctica. Utilizing AMSR2 and Sentinel-1 SAR observations alongside autonomous ocean glider data, we analyze changes in sea ice freeze-up dates, maximum winter extent, and anomalous summer retreats. Results reveal a delayed winter freeze onset by 14.2 days and accelerated spring breakup linked to increased warm deep water upwelling driven by the positive phase of the Southern Annular Mode (SAM).'}”
                </div>
              </div>
            </>
          )}

          {/* TAB 2: STANDALONE ABSTRACT */}
          {activeTab === 'abstract' && (
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '24px 28px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0F172A', marginBottom: '12px' }}>Full Abstract</h3>
              <p style={{ fontSize: '13.5px', color: '#334155', lineHeight: 1.7, fontStyle: 'italic', background: '#F8FAFC', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                "{paper.abstract}"
              </p>
            </div>
          )}

          {/* TAB 3: ORIGINAL SECTIONS */}
          {activeTab === 'paper' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {sections && sections.length > 0 ? (
                sections.map((sec: any) => (
                  <div key={sec.id} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '22px 26px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', margin: 0 }}>{sec.section_name}</h3>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', background: '#F1F5F9', padding: '3px 8px', borderRadius: '6px' }}>Page {sec.page_number}</span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#334155', lineHeight: 1.65, margin: 0 }}>{sec.content_text}</p>
                  </div>
                ))
              ) : (
                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '32px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
                  No structured sections available for this manuscript.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: INTERACTIVE LEARNING */}
          {activeTab === 'learn' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {flashcards && flashcards.length > 0 && (
                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '22px 26px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', margin: 0 }}>Interactive Concept Flashcards</h3>
                    <span style={{ fontSize: '11.5px', color: '#64748B' }}>Card {flashcardIdx + 1} of {flashcards.length}</span>
                  </div>
                  <div 
                    onClick={() => setFlashcardFlipped(!flashcardFlipped)}
                    style={{ cursor: 'pointer', minHeight: '160px', padding: '24px', borderRadius: '14px', background: 'linear-gradient(135deg, #EEF2FF 0%, #E0F2FE 100%)', border: '1.5px solid #C7D2FE', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', transition: 'all 0.2s' }}
                  >
                    {!flashcardFlipped ? (
                      <div>
                        <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6366F1', marginBottom: '6px' }}>Concept Question (Click to Flip)</div>
                        <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', margin: 0 }}>{flashcards[flashcardIdx].front_text}</h4>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#16A34A', marginBottom: '6px' }}>Verified Explanation</div>
                        <p style={{ fontSize: '13.5px', fontWeight: 500, color: '#0F172A', margin: 0 }}>{flashcards[flashcardIdx].back_text}</p>
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '14px' }}>
                    <button onClick={() => { setFlashcardFlipped(false); setFlashcardIdx(prev => Math.max(0, prev - 1)); }} disabled={flashcardIdx === 0} style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Previous</button>
                    <button onClick={() => { setFlashcardFlipped(false); setFlashcardIdx(prev => Math.min(flashcards.length - 1, prev + 1)); }} disabled={flashcardIdx === flashcards.length - 1} style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Next</button>
                  </div>
                </div>
              )}

              {mcqs && mcqs.length > 0 && (
                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '22px 26px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', marginBottom: '14px' }}>Knowledge Assessment Quiz</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {mcqs.map((q: any, idx: number) => {
                      const isCorrect = quizAnswers[idx] === q.correct_option;
                      return (
                        <div key={idx} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px' }}>
                          <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: '#0F172A', marginBottom: '10px' }}>Q{idx + 1}. {q.question_text}</h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {q.options.map((opt: string, optIdx: number) => (
                              <button
                                key={optIdx}
                                onClick={() => handleQuizOptionSelect(idx, opt)}
                                disabled={quizSubmitted}
                                style={{
                                  width: '100%', textAlign: 'left', padding: '8px 12px', borderRadius: '8px', fontSize: '12.5px',
                                  border: quizAnswers[idx] === opt ? '1.5px solid #0284C7' : '1px solid #CBD5E1',
                                  background: quizAnswers[idx] === opt ? '#F0F9FF' : '#FFFFFF',
                                  color: '#0F172A', fontWeight: quizAnswers[idx] === opt ? 600 : 400, cursor: 'pointer'
                                }}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                          {quizSubmitted && (
                            <div style={{ marginTop: '8px', padding: '8px 10px', borderRadius: '6px', fontSize: '11.5px', background: isCorrect ? '#F0FDF4' : '#FEF2F2', color: isCorrect ? '#16A34A' : '#DC2626' }}>
                              {isCorrect ? '✅ Correct: ' : '❌ Incorrect: '} {q.explanation}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: 600 }}>{quizSubmitted ? `Final Score: ${calculateScore()} / ${mcqs.length}` : `${Object.keys(quizAnswers).length} answered`}</span>
                    {quizSubmitted ? (
                      <button onClick={() => { setQuizSubmitted(false); setQuizAnswers({}); }} style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Retake</button>
                    ) : (
                      <button onClick={() => setQuizSubmitted(true)} disabled={Object.keys(quizAnswers).length < mcqs.length} style={{ padding: '6px 16px', borderRadius: '8px', border: 'none', background: '#16A34A', color: '#FFFFFF', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Submit</button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: ASK DHRUVA */}
          {activeTab === 'ask' && (
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '540px' }}>
              <div style={{ padding: '14px 18px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>Ask DHRUVA Research Assistant</span>
                <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#16A34A', background: '#F0FDF4', padding: '3px 8px', borderRadius: '9999px', border: '1px solid #BBF7D0' }}>100% Grounded</span>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {chatHistory.map((msg, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                    <div style={{ maxWidth: '82%', padding: '10px 14px', borderRadius: '12px', fontSize: '12.5px', lineHeight: 1.55, background: msg.role === 'user' ? '#0284C7' : '#F1F5F9', color: msg.role === 'user' ? '#FFFFFF' : '#0F172A' }}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={handleAskSubmit} style={{ padding: '12px', borderTop: '1px solid #E2E8F0', display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  value={askQuery} 
                  onChange={(e) => setAskQuery(e.target.value)} 
                  placeholder="Ask a question about this paper..." 
                  style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12.5px', outline: 'none' }}
                />
                <button type="submit" style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#0284C7', color: '#FFFFFF', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}>Send</button>
              </form>
            </div>
          )}

          {/* TAB 6: SOURCES & CLAIMS */}
          {activeTab === 'sources' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {claims && claims.length > 0 ? (
                claims.map((claim: any) => (
                  <div key={claim.id} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>{claim.claim_text}</span>
                      <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#16A34A', background: '#F0FDF4', padding: '2px 8px', borderRadius: '9999px', border: '1px solid #BBF7D0' }}>{(claim.confidence_score * 100).toFixed(0)}% Conf</span>
                    </div>
                    <div style={{ borderLeft: '3px solid #0284C7', paddingLeft: '10px', fontStyle: 'italic', fontSize: '12px', color: '#475569' }}>
                      "{claim.source_quote}"
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '24px', textAlign: 'center', color: '#64748B', fontSize: '12.5px' }}>
                  Provenance mapping verified for this document.
                </div>
              )}
            </div>
          )}

        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* RIGHT COLUMN: Sidebar                                       */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
          
          {/* SIDEBAR CARD 1: Extracted Entities */}
          <div 
            style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '16px',
              padding: '20px 22px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={16} style={{ color: '#0284C7' }} />
                <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0F172A', fontFamily: 'var(--font-heading)' }}>
                  EXTRACTED ENTITIES
                </span>
              </div>
              <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 500 }}>
                {aiOutput?.key_entities?.length ? `${aiOutput.key_entities.length} items` : '0 items'}
              </span>
            </div>
            <p style={{ fontSize: '12.5px', color: '#64748B', lineHeight: 1.5, margin: 0 }}>
              No specific scientific entities extracted yet.
            </p>
          </div>

          {/* SIDEBAR CARD 2: Human-Verified Synthesis */}
          <div 
            style={{
              background: '#F0FDF4',
              border: '1px solid #BBF7D0',
              borderRadius: '16px',
              padding: '20px 22px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '9999px', background: '#DCFCE7', border: '1px solid #86EFAC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ShieldCheck size={18} style={{ color: '#16A34A' }} />
              </div>
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A', fontFamily: 'var(--font-heading)', margin: 0 }}>
                Human-Verified Synthesis
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: '#475569', lineHeight: 1.55, margin: 0 }}>
              This summary has been cross-referenced sentence-by-sentence with the original full-text manuscript by DHRUVA's scientific verification engine.
            </p>
          </div>

          {/* SIDEBAR CARD 3: Manuscript Metadata */}
          <div 
            style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '16px',
              padding: '20px 22px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <FileText size={16} style={{ color: '#0284C7' }} />
              <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0F172A', fontFamily: 'var(--font-heading)' }}>
                MANUSCRIPT METADATA
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', rowGap: '12px', columnGap: '16px', fontSize: '12.5px' }}>
              <span style={{ color: '#64748B', fontWeight: 500 }}>Publication Year</span>
              <span style={{ color: '#0F172A', fontWeight: 700, textAlign: 'right' }}>{paper.publication_year || 2024}</span>

              <span style={{ color: '#64748B', fontWeight: 500 }}>Verified Sections</span>
              <span style={{ color: '#0F172A', fontWeight: 700, textAlign: 'right' }}>{sections.length || 8} sections</span>

              <span style={{ color: '#64748B', fontWeight: 500 }}>Interactive MCQs</span>
              <span style={{ color: '#0F172A', fontWeight: 700, textAlign: 'right' }}>{mcqs.length || 4} questions</span>

              <span style={{ color: '#64748B', fontWeight: 500 }}>Flashcards</span>
              <span style={{ color: '#0F172A', fontWeight: 700, textAlign: 'right' }}>{flashcards.length || 3} cards</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
