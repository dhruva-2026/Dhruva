import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Send, 
  ShieldCheck, 
  User, 
  ChevronRight, 
  Compass, 
  Waves, 
  Thermometer, 
  Ship, 
  Snowflake, 
  Leaf, 
  Mountain, 
  Image as ImageIcon, 
  Paperclip, 
  FileText, 
  Lock, 
  ArrowRight,
  RotateCcw,
  Clock,
  Trash2,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Plus
} from 'lucide-react';
import { apiAskRAG } from '../../services/api';

interface StoredAttachment {
  name: string;
  size: number;
  type: string;
  dataUrl?: string;
}

interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  attachment?: StoredAttachment;
  sources?: Array<{
    paperId: string;
    paperTitle: string;
    sectionName: string;
    pageNumber: number;
    confidenceScore: number;
    snippet: string;
  }>;
}

interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: string;
  messages: ChatMessage[];
  attachment?: StoredAttachment;
}

interface AskDhruvaPageProps {
  onReadPaper: (id: string) => void;
  lang: 'en' | 'hi';
  currentUser?: any;
  onNavigate?: (tab: string) => void;
  initialQuery?: string;
}

const RESEARCH_INQUIRIES = [
  {
    id: 1,
    icon: <Waves className="w-3.5 h-3.5 text-sky-600" />,
    text: 'What causes seasonal changes in Antarctic sea ice in the Weddell Sea?'
  },
  {
    id: 2,
    icon: <Thermometer className="w-3.5 h-3.5 text-sky-600" />,
    text: 'How does permafrost thaw in Svalbard affect methane emissions?'
  },
  {
    id: 3,
    icon: <Ship className="w-3.5 h-3.5 text-sky-600" />,
    text: "What did India's IndARC mooring observatory observe in Kongsfjorden at 192m depth?"
  },
  {
    id: 4,
    icon: <Snowflake className="w-3.5 h-3.5 text-sky-600" />,
    text: 'What did research find regarding microplastics in Arctic snow around Himadri Station?'
  },
  {
    id: 5,
    icon: <Leaf className="w-3.5 h-3.5 text-sky-600" />,
    text: 'What role do phytoplankton blooms in Prydz Bay play near Bharati Station?'
  },
  {
    id: 6,
    icon: <Mountain className="w-3.5 h-3.5 text-sky-600" />,
    text: 'How is climate change affecting polar ecosystems in the Arctic and Antarctic?'
  }
];

export const AskDhruvaPage: React.FC<AskDhruvaPageProps> = ({ 
  onReadPaper, 
  lang, 
  currentUser, 
  onNavigate,
  initialQuery
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [query, setQuery] = useState(initialQuery || '');
  const [loading, setLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentAttachment, setCurrentAttachment] = useState<StoredAttachment | null>(null);

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Load search history from localStorage on initial mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('dhruva_search_history');
      if (stored) {
        setSearchHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Error loading search history from localStorage:', e);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Save history to localStorage
  const saveHistory = (items: SearchHistoryItem[]) => {
    setSearchHistory(items);
    try {
      // Save items without huge raw data URLs if needed to prevent quota exhaustion
      const safeItems = items.map(item => ({
        ...item,
        attachment: item.attachment ? {
          name: item.attachment.name,
          size: item.attachment.size,
          type: item.attachment.type
        } : undefined,
        messages: item.messages.map(m => ({
          ...m,
          attachment: m.attachment ? {
            name: m.attachment.name,
            size: m.attachment.size,
            type: m.attachment.type
          } : undefined
        }))
      }));
      localStorage.setItem('dhruva_search_history', JSON.stringify(safeItems));
    } catch (e) {
      console.error('Error saving search history to localStorage:', e);
    }
  };

  // Handle file attachment via file/image pickers and save in localStorage
  const processSelectedFile = (file: File) => {
    // 5MB safety limit
    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds the 5MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const attachment: StoredAttachment = {
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl: reader.result as string
      };
      setCurrentAttachment(attachment);

      // Cache metadata in localStorage
      try {
        localStorage.setItem('dhruva_latest_attachment', JSON.stringify({
          name: attachment.name,
          size: attachment.size,
          type: attachment.type,
          timestamp: new Date().toISOString()
        }));
      } catch (err) {
        console.warn('Could not cache attachment in localStorage:', err);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDocumentSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processSelectedFile(file);
    e.target.value = '';
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processSelectedFile(file);
    e.target.value = '';
  };

  const handleRemoveAttachment = () => {
    setCurrentAttachment(null);
  };

  const handleSubmit = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const q = (customQuery || query).trim();
    if (!q && !currentAttachment) return;
    if (loading) return;

    const attachedFile = currentAttachment;
    const userMessage: ChatMessage = { 
      role: 'user', 
      content: q || (attachedFile ? `[Attached Document: ${attachedFile.name}]` : ''),
      attachment: attachedFile || undefined
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setQuery('');
    setCurrentAttachment(null);
    setLoading(true);

    try {
      const res = await apiAskRAG({ query: q });
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: res.answer || 'No direct synthesis available.',
        sources: res.sources || []
      };
      
      const finalMessages = [...newMessages, assistantMessage];
      setMessages(finalMessages);

      // Save to Search History in localStorage
      const historyItem: SearchHistoryItem = {
        id: 'hist_' + Date.now(),
        query: q || (attachedFile ? attachedFile.name : 'Polar Inquiry'),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        messages: finalMessages,
        attachment: attachedFile || undefined
      };

      const updatedHistory = [historyItem, ...searchHistory.filter(h => h.query !== historyItem.query)].slice(0, 25);
      saveHistory(updatedHistory);
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Error consulting polar science knowledge repository: ' + (err.message || 'Unknown network error.')
      };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectHistoryItem = (item: SearchHistoryItem) => {
    setMessages(item.messages || [{ role: 'user', content: item.query }]);
    setQuery('');
  };

  const handleDeleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = searchHistory.filter(h => h.id !== id);
    saveHistory(updated);
  };

  const handleClearAllHistory = () => {
    if (window.confirm('Are you sure you want to clear all search history?')) {
      saveHistory([]);
    }
  };

  const handleResetChat = () => {
    setMessages([]);
    setQuery('');
    setCurrentAttachment(null);
    inputRef.current?.focus();
  };

  return (
    <div 
      style={{ 
        width: '100%', 
        height: 'calc(100vh - 80px)', 
        maxHeight: 'calc(100vh - 80px)',
        display: 'flex', 
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Hidden file inputs for attachment handling */}
      <input 
        ref={fileInputRef} 
        type="file" 
        style={{ display: 'none' }} 
        accept=".pdf,.doc,.docx,.txt,.csv,image/*"
        onChange={handleDocumentSelect} 
      />
      <input 
        ref={imageInputRef} 
        type="file" 
        style={{ display: 'none' }} 
        accept="image/*"
        onChange={handleImageSelect} 
      />

      {/* ───────────────────────────────────────────────────────────── */}
      {/* LEFT SIDEBAR: Search History (backed by localStorage)         */}
      {/* ───────────────────────────────────────────────────────────── */}
      <aside 
        style={{
          width: sidebarOpen ? '260px' : '0px',
          minWidth: sidebarOpen ? '260px' : '0px',
          transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
          height: '100%',
          background: '#FFFFFF',
          borderRight: sidebarOpen ? '1px solid #E2E8F0' : 'none',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 20,
          overflow: 'hidden'
        }}
      >
        {sidebarOpen && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '12px' }}>
            {/* Sidebar Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid #F1F5F9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={14} style={{ color: '#0284C7' }} />
                <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Search History
                </span>
              </div>
              <button 
                onClick={() => setSidebarOpen(false)} 
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px' }}
                title="Collapse history"
              >
                <PanelLeftClose size={15} />
              </button>
            </div>

            {/* New Inquiry Action Button */}
            <button
              onClick={handleResetChat}
              style={{
                marginTop: '10px',
                marginBottom: '10px',
                width: '100%',
                padding: '7px 12px',
                borderRadius: '8px',
                background: '#F0F9FF',
                border: '1px solid #BAE6FD',
                color: '#0284C7',
                fontSize: '11.5px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              <Plus size={13} />
              <span>New Inquiry</span>
            </button>

            {/* History Items Scroll List */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px', paddingRight: '2px' }}>
              {searchHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 10px', color: '#94A3B8', fontSize: '11px', lineHeight: 1.5 }}>
                  No previous searches.<br />Your queries will be saved here automatically.
                </div>
              ) : (
                searchHistory.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectHistoryItem(item)}
                    style={{
                      padding: '7px 10px',
                      borderRadius: '8px',
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = '#F0F9FF';
                      (e.currentTarget as HTMLElement).style.borderColor = '#BAE6FD';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = '#F8FAFC';
                      (e.currentTarget as HTMLElement).style.borderColor = '#E2E8F0';
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.query}
                      </div>
                      <div style={{ fontSize: '9px', color: '#94A3B8', marginTop: '2px' }}>
                        {item.timestamp}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        background: 'transparent',
                        border: '1px solid transparent',
                        color: '#94A3B8',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                        flexShrink: 0
                      }}
                      onMouseEnter={(e) => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.background = '#FEE2E2';
                        el.style.borderColor = '#FECACA';
                        el.style.color = '#DC2626';
                        el.style.transform = 'scale(1.15)';
                        el.style.boxShadow = '0 2px 6px rgba(220, 38, 38, 0.22)';
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.background = 'transparent';
                        el.style.borderColor = 'transparent';
                        el.style.color = '#94A3B8';
                        el.style.transform = 'scale(1)';
                        el.style.boxShadow = 'none';
                      }}
                      title="Delete this search"
                      aria-label="Delete this search"
                    >
                      <Trash2 size={13} strokeWidth={2.1} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Clear All History Button */}
            {searchHistory.length > 0 && (
              <div style={{ paddingTop: '8px', borderTop: '1px solid #F1F5F9', textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={handleClearAllHistory}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94A3B8',
                    fontSize: '10.5px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.color = '#DC2626';
                    el.style.background = '#FEE2E2';
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.color = '#94A3B8';
                    el.style.background = 'transparent';
                  }}
                >
                  Clear all history
                </button>
              </div>
            )}
          </div>
        )}
      </aside>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MAIN VIEWPORT: Compact, Centered, Fits Screen Without Scroll  */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div 
        style={{ 
          flex: 1, 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'space-between',
          alignItems: 'center',
          overflowY: 'auto',
          padding: '10px 20px',
          position: 'relative'
        }}
      >
        {/* Toggle Button to reopen sidebar when closed */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            style={{
              position: 'absolute',
              top: '12px',
              left: '16px',
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              padding: '5px 9px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              fontWeight: 600,
              color: '#475569',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
              zIndex: 10
            }}
            title="Open history sidebar"
          >
            <PanelLeftOpen size={14} style={{ color: '#0284C7' }} />
            <span>History</span>
          </button>
        )}


        {/* ── TOP SECTION (HERO + BANNER + INQUIRIES + GREETING) ── */}
        <div 
          style={{ 
            width: '100%', 
            maxWidth: '1020px', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {/* 1. HERO HEADER (Horizontal alignment matching reference image) */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', marginBottom: '2px' }}>
            <div 
              style={{ 
                width: '46px', 
                height: '46px', 
                borderRadius: '14px', 
                background: 'rgba(224, 242, 254, 0.85)', 
                border: '1.5px solid #BAE6FD', 
                color: '#0284C7', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(2, 132, 199, 0.1)',
                flexShrink: 0
              }}
            >
              <Sparkles size={24} />
            </div>

            <div style={{ textAlign: 'left' }}>
              <h1 
                style={{ 
                  fontSize: 'clamp(28px, 3.4vw, 38px)', 
                  fontWeight: 800, 
                  color: '#0F172A', 
                  letterSpacing: '-0.03em', 
                  lineHeight: 1.1, 
                  margin: 0, 
                  fontFamily: 'var(--font-heading)' 
                }}
              >
                Ask <span className="dhruva-brand-text">DHRUVA</span>
              </h1>

              <p 
                style={{ 
                  fontSize: '10px', 
                  fontWeight: 700, 
                  letterSpacing: '0.22em', 
                  textTransform: 'uppercase', 
                  color: '#64748B', 
                  marginTop: '3px', 
                  marginBottom: 0 
                }}
              >
                AI POLAR RESEARCH ASSISTANT
              </p>
            </div>
          </div>

          {/* 2. HERO BANNER CARD */}
          <div 
            style={{ 
              width: '100%', 
              maxWidth: '820px', 
              background: '#FFFFFF', 
              border: '1px solid rgba(2, 132, 199, 0.18)', 
              borderRadius: '16px', 
              padding: '11px 24px', 
              textAlign: 'center', 
              boxShadow: '0 2px 14px rgba(2, 132, 199, 0.04)' 
            }}
          >
            <h2 
              style={{ 
                fontSize: 'clamp(18px, 2vw, 23px)', 
                fontWeight: 800, 
                color: '#0F172A', 
                margin: 0, 
                lineHeight: 1.25, 
                fontFamily: 'var(--font-heading)' 
              }}
            >
              Ask any <span style={{ color: '#0284C7' }}>polar</span> <span style={{ color: '#2563EB' }}>science</span> question
            </h2>
            <p 
              style={{ 
                fontSize: '11.5px', 
                color: '#64748B', 
                marginTop: '4px', 
                marginBottom: 0, 
                lineHeight: 1.4 
              }}
            >
              Strictly grounded in peer-reviewed NCPOR research — Arctic &amp; Antarctic expeditions — with section &amp; page citations.
            </p>
          </div>

          {/* 3. SUGGESTED RESEARCH INQUIRIES (Initial State) */}
          {messages.length === 0 && (
            <div style={{ width: '100%' }}>
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  marginBottom: '6px' 
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div 
                    style={{ 
                      width: '17px', 
                      height: '17px', 
                      borderRadius: '9999px', 
                      background: '#E0F2FE', 
                      color: '#0284C7', 
                      fontSize: '10.5px', 
                      fontWeight: 700, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center' 
                    }}
                  >
                    ?
                  </div>
                  <h3 style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                    Suggested Research Inquiries
                  </h3>
                </div>

                <button 
                  onClick={() => handleSubmit(undefined, RESEARCH_INQUIRIES[0].text)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, color: '#0284C7', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <span>View All Suggestions</span>
                  <ArrowRight size={11} />
                </button>
              </div>

              {/* 3 Columns × 2 Rows Compact Grid */}
              <div 
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2"
                style={{ width: '100%' }}
              >
                {RESEARCH_INQUIRIES.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSubmit(undefined, item.text)}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '12px',
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = '#0284C7';
                      (e.currentTarget as HTMLElement).style.boxShadow = '0 3px 10px rgba(2, 132, 199, 0.08)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = '#E2E8F0';
                      (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)';
                    }}
                  >
                    <div 
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '8px',
                        background: '#F0F9FF',
                        border: '1px solid #E0F2FE',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      {item.icon}
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#1E293B', lineHeight: 1.35, flex: 1 }}>
                      {item.text}
                    </span>
                    <ArrowRight size={13} style={{ color: '#0284C7', flexShrink: 0 }} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 4. DHRUVA ASSISTANT WELCOME CARD */}
          {messages.length === 0 && (
            <div 
              style={{ 
                width: '100%', 
                background: '#FFFFFF', 
                border: '1px solid #E2E8F0', 
                borderRadius: '14px', 
                padding: '10px 18px', 
                boxShadow: '0 2px 8px rgba(15, 23, 42, 0.02)', 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: '12px' 
              }}
            >
              <div 
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '9999px',
                  background: '#EEF2FF',
                  border: '1px solid #C7D2FE',
                  color: '#6366F1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '2px'
                }}
              >
                <Sparkles size={16} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '9.5px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#64748B', marginBottom: '2px' }}>
                  <span className="dhruva-brand-text font-bold">DHRUVA</span> ASSISTANT
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A', lineHeight: 1.35, marginBottom: '2px' }}>
                  Namaste! I am <span className="dhruva-brand-text font-bold">DHRUVA</span> (ध्रुव), the AI Research Assistant for India's Polar Science expeditions.
                </div>
                <p style={{ fontSize: '11px', color: '#475569', lineHeight: 1.45, margin: 0 }}>
                  I answer questions strictly grounded in our peer-reviewed polar science knowledge repository, providing verified section and page citations. Try selecting one of the suggested scientific queries below or ask your own question!
                </p>
              </div>
            </div>
          )}

          {/* 5. ACTIVE CHAT THREAD (When conversation has started) */}
          {messages.length > 0 && (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: 'calc(100vh - 270px)', overflowY: 'auto', paddingRight: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleResetChat}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, color: '#64748B', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer' }}
                >
                  <RotateCcw size={11} />
                  <span>New Inquiry</span>
                </button>
              </div>

              {messages.map((msg, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '10px', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  {msg.role === 'assistant' && (
                    <div style={{ width: '28px', height: '28px', borderRadius: '9999px', background: '#EEF2FF', border: '1px solid #C7D2FE', color: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                      <Sparkles size={14} />
                    </div>
                  )}

                  <div 
                    style={{
                      maxWidth: '82%',
                      borderRadius: '14px',
                      padding: '10px 14px',
                      fontSize: '12.5px',
                      lineHeight: 1.55,
                      background: msg.role === 'user' ? '#0284C7' : '#FFFFFF',
                      color: msg.role === 'user' ? '#FFFFFF' : '#1E293B',
                      border: msg.role === 'user' ? 'none' : '1px solid #E2E8F0',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                    }}
                  >
                    {msg.role === 'assistant' && (
                      <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#6366F1', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Sparkles size={10} />
                        <span><span className="dhruva-brand-text font-bold">DHRUVA</span> AI · GROUNDED SYNTHESIS</span>
                      </div>
                    )}

                    {/* Attachment preview inside message */}
                    {msg.attachment && (
                      <div style={{ marginBottom: '6px', padding: '6px 10px', borderRadius: '8px', background: msg.role === 'user' ? 'rgba(255,255,255,0.18)' : '#F1F5F9', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', border: '1px solid rgba(255,255,255,0.3)' }}>
                        <Paperclip size={12} />
                        <span style={{ fontWeight: 600 }}>{msg.attachment.name}</span>
                        <span style={{ opacity: 0.8 }}>({(msg.attachment.size / 1024).toFixed(0)} KB)</span>
                      </div>
                    )}

                    <div style={{ whiteSpace: 'pre-line' }}>{msg.content}</div>

                    {/* Verified Sources Citations */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #F1F5F9' }}>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <ShieldCheck size={12} />
                          <span>Verified Citations ({msg.sources.length})</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {msg.sources.map((src, sIdx) => (
                            <div 
                              key={sIdx}
                              onClick={() => onReadPaper(src.paperId)}
                              style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '6px 10px', fontSize: '11px', cursor: 'pointer' }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontWeight: 700, color: '#0284C7' }}>📄 {src.paperTitle}</span>
                                <span style={{ fontSize: '9px', fontWeight: 700, color: '#059669', background: '#ECFDF5', padding: '1px 5px', borderRadius: '4px' }}>
                                  {(src.confidenceScore * 100).toFixed(0)}% Conf
                                </span>
                              </div>
                              <div style={{ fontSize: '9.5px', color: '#64748B', fontFamily: 'var(--font-mono)' }}>
                                § {src.sectionName} · Page {src.pageNumber}
                              </div>
                              <div style={{ fontStyle: 'italic', color: '#475569', borderLeft: '2px solid #0284C7', paddingLeft: '6px', marginTop: '2px' }}>
                                "{src.snippet}"
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {msg.role === 'user' && (
                    <div style={{ width: '28px', height: '28px', borderRadius: '9999px', background: '#E0F2FE', border: '1px solid #BAE6FD', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                      <User size={14} />
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '9999px', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Sparkles size={14} className="animate-spin text-indigo-600" />
                  </div>
                  <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '8px 14px', fontSize: '11.5px', color: '#64748B' }}>
                    Searching polar scientific knowledge repository &amp; validating page citations...
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* ── BOTTOM DOCKED SECTION (SEARCH INPUT + ATTACHMENTS + TRUST BADGES) ── */}
        <div 
          style={{ 
            width: '100%', 
            maxWidth: '1020px', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            paddingTop: '4px'
          }}
        >
          {/* Active Attachment Pill Preview (if selected via paperclip/image) */}
          {currentAttachment && (
            <div 
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '5px 12px',
                borderRadius: '8px',
                background: '#F0F9FF',
                border: '1px solid #BAE6FD',
                marginBottom: '6px',
                fontSize: '11.5px',
                color: '#0284C7'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {currentAttachment.type.startsWith('image/') ? <ImageIcon size={13} /> : <Paperclip size={13} />}
                <span style={{ fontWeight: 600 }}>Attached: {currentAttachment.name}</span>
                <span style={{ color: '#64748B', fontSize: '10px' }}>({(currentAttachment.size / 1024).toFixed(0)} KB)</span>
              </div>
              <button 
                type="button" 
                onClick={handleRemoveAttachment}
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                title="Remove attachment"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Floating Rounded-Full Query Input Bar */}
          <form 
            onSubmit={handleSubmit}
            style={{
              width: '100%',
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: '9999px',
              boxShadow: '0 4px 18px rgba(15, 23, 42, 0.05)',
              padding: '4px 6px 4px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '8px'
            }}
          >
            {/* Image icon button (workable - triggers image file picker & saves in localStorage) */}
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              style={{ color: currentAttachment?.type.startsWith('image/') ? '#0284C7' : '#94A3B8', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
              title="Attach polar research photo or diagram"
            >
              <ImageIcon size={16} />
            </button>

            {/* Query input field */}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a polar science question..."
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontSize: '13px',
                color: '#0F172A',
                fontFamily: 'var(--font-body)'
              }}
              disabled={loading}
            />

            {/* Paperclip icon button (workable - triggers document file picker & saves in localStorage) */}
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              style={{ color: currentAttachment && !currentAttachment.type.startsWith('image/') ? '#0284C7' : '#94A3B8', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
              title="Attach research document or dataset"
            >
              <Paperclip size={16} />
            </button>

            {/* Send Pill Button */}
            <button
              type="submit"
              disabled={loading || (!query.trim() && !currentAttachment)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 18px',
                borderRadius: '9999px',
                background: '#0284C7',
                color: '#FFFFFF',
                fontSize: '12.5px',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(2, 132, 199, 0.28)',
                opacity: loading || (!query.trim() && !currentAttachment) ? 0.5 : 1
              }}
            >
              <Send size={12} />
              <span>Send</span>
            </button>
          </form>

          {/* 7. THREE FOOTER TRUST BADGES */}
          <div 
            style={{
              width: '100%',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '24px',
              fontSize: '11.5px',
              color: '#475569',
              fontWeight: 500
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div 
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '9999px',
                  background: '#E0F2FE',
                  color: '#0284C7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <ShieldCheck size={12} />
              </div>
              <span>Grounded in NCPOR research</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div 
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '9999px',
                  background: '#E0F2FE',
                  color: '#0284C7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <FileText size={12} />
              </div>
              <span>Section &amp; page citations provided</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div 
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '9999px',
                  background: '#E0F2FE',
                  color: '#0284C7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Lock size={11} />
              </div>
              <span>Scientific &amp; verified information</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
