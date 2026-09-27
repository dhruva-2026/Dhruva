import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Send, 
  ShieldCheck, 
  User, 
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
  Clock,
  Trash2,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  BookOpen,
  Mic,
  MicOff,
  Download
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

function downloadTableAsCsv(headers: string[], rows: string[][], filename = 'dhruva-polar-data.csv') {
  const escapeCsv = (str: string) => `"${(str || '').replace(/"/g, '""')}"`;
  const csvContent = [
    headers.map(escapeCsv).join(','),
    ...rows.map(row => row.map(escapeCsv).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Rich Formatted Markdown Renderer for DHRUVA AI Responses
 * Parses headers (###), blockquotes (>), bold (**), italics (*), bullet lists (• / -), numbered lists, and markdown tables (|...|)
 */
const FormattedMessageContent: React.FC<{ content: string; role: 'user' | 'assistant' }> = ({ content, role }) => {
  if (role === 'user') {
    return <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '13px', lineHeight: 1.55 }}>{content}</div>;
  }

  const lines = content.split('\n');
  const renderedElements: React.ReactNode[] = [];
  let inBlockquote = false;
  let blockquoteBuffer: string[] = [];
  let inList = false;
  let listBuffer: string[] = [];
  let inTable = false;
  let tableBuffer: string[] = [];

  const renderInlineMarkdown = (text: string) => {
    const parts: React.ReactNode[] = [];
    const boldRegex = /\*\*(.*?)\*\*/g;
    let lastIdx = 0;
    let match;

    while ((match = boldRegex.exec(text)) !== null) {
      if (match.index > lastIdx) {
        parts.push(renderItalics(text.substring(lastIdx, match.index), `txt-${match.index}`));
      }
      parts.push(
        <strong key={`b-${match.index}`} style={{ fontWeight: 700, color: '#0F172A' }}>
          {match[1]}
        </strong>
      );
      lastIdx = match.index + match[0].length;
    }

    if (lastIdx < text.length) {
      parts.push(renderItalics(text.substring(lastIdx), `txt-end`));
    }

    return parts.length > 0 ? parts : text;
  };

  const renderItalics = (text: string, keyPrefix: string) => {
    const parts: React.ReactNode[] = [];
    const italicRegex = /\*(.*?)\*/g;
    let lastIdx = 0;
    let match;

    while ((match = italicRegex.exec(text)) !== null) {
      if (match.index > lastIdx) {
        parts.push(text.substring(lastIdx, match.index));
      }
      parts.push(
        <em key={`${keyPrefix}-i-${match.index}`} style={{ fontStyle: 'italic', color: '#334155' }}>
          {match[1]}
        </em>
      );
      lastIdx = match.index + match[0].length;
    }

    if (lastIdx < text.length) {
      parts.push(text.substring(lastIdx));
    }

    return parts.length > 0 ? parts : text;
  };

  const flushBlockquote = (key: string) => {
    if (blockquoteBuffer.length > 0) {
      renderedElements.push(
        <div
          key={key}
          style={{
            borderLeft: '3px solid #0284C7',
            background: 'rgba(240, 249, 255, 0.8)',
            borderRadius: '0 8px 8px 0',
            padding: '8px 12px',
            margin: '6px 0 10px 0',
            fontSize: '12.5px',
            color: '#0F172A',
            fontStyle: 'italic',
            lineHeight: 1.55
          }}
        >
          {blockquoteBuffer.map((bLine, bIdx) => (
            <div key={bIdx}>{renderInlineMarkdown(bLine)}</div>
          ))}
        </div>
      );
      blockquoteBuffer = [];
      inBlockquote = false;
    }
  };

  const flushList = (key: string) => {
    if (listBuffer.length > 0) {
      renderedElements.push(
        <ul 
          key={key} 
          style={{ 
            margin: '6px 0 10px 0', 
            paddingLeft: '18px', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '5px' 
          }}
        >
          {listBuffer.map((item, idx) => (
            <li key={idx} style={{ fontSize: '12.5px', color: '#1E293B', lineHeight: 1.55 }}>
              {renderInlineMarkdown(item)}
            </li>
          ))}
        </ul>
      );
      listBuffer = [];
      inList = false;
    }
  };

  const flushTable = (key: string) => {
    if (tableBuffer.length >= 2) {
      const headerLine = tableBuffer[0];
      const headers = headerLine.split('|').map(s => s.trim()).filter(Boolean);
      const dataRows = tableBuffer.slice(2).map(r => r.split('|').map(s => s.trim()).filter(Boolean)).filter(r => r.length > 0);

      renderedElements.push(
        <div key={key} style={{ margin: '10px 0 14px 0', width: '100%', overflowX: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '4px' }}>
            <button
              onClick={() => downloadTableAsCsv(headers, dataRows)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 8px',
                borderRadius: '6px',
                background: '#F0F9FF',
                border: '1px solid #BAE6FD',
                color: '#0284C7',
                fontSize: '10px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              title="Export table as CSV"
            >
              <Download size={11} />
              <span>Export CSV</span>
            </button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', background: '#FFFFFF', borderRadius: '8px', overflow: 'hidden', border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1.5px solid #CBD5E1' }}>
                {headers.map((h, hIdx) => (
                  <th key={hIdx} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: '#0F172A' }}>
                    {renderInlineMarkdown(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataRows.map((row, rIdx) => (
                <tr key={rIdx} style={{ borderBottom: '1px solid #F1F5F9', background: rIdx % 2 === 1 ? '#FAFAFA' : '#FFFFFF' }}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} style={{ padding: '7px 12px', color: '#334155', verticalAlign: 'top' }}>
                      {renderInlineMarkdown(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    tableBuffer = [];
    inTable = false;
  };

  lines.forEach((line, i) => {
    const trimmed = line.trim();

    // Check for Markdown table line
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      if (inList) flushList(`list-before-tbl-${i}`);
      if (inBlockquote) flushBlockquote(`quote-before-tbl-${i}`);
      inTable = true;
      tableBuffer.push(trimmed);
      return;
    } else if (inTable) {
      flushTable(`table-${i}`);
    }

    // Check for blockquote
    if (trimmed.startsWith('>')) {
      if (inList) flushList(`list-before-quote-${i}`);
      inBlockquote = true;
      blockquoteBuffer.push(trimmed.replace(/^>\s*/, ''));
      return;
    } else if (inBlockquote) {
      flushBlockquote(`quote-${i}`);
    }

    // Check for bullet list
    if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('* ')) {
      inList = true;
      listBuffer.push(trimmed.replace(/^[•\-*]\s*/, ''));
      return;
    } else if (inList) {
      flushList(`list-${i}`);
    }

    if (!trimmed) {
      return;
    }

    // Check for Headings
    if (trimmed.startsWith('### ')) {
      renderedElements.push(
        <h4
          key={`h3-${i}`}
          style={{
            fontSize: '13.5px',
            fontWeight: 800,
            color: '#0284C7',
            margin: '10px 0 4px 0',
            letterSpacing: '-0.01em',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          {renderInlineMarkdown(trimmed.replace(/^###\s*/, ''))}
        </h4>
      );
    } else if (trimmed.startsWith('#### ')) {
      renderedElements.push(
        <h5
          key={`h4-${i}`}
          style={{
            fontSize: '12.5px',
            fontWeight: 700,
            color: '#0F172A',
            margin: '8px 0 4px 0'
          }}
        >
          {renderInlineMarkdown(trimmed.replace(/^####\s*/, ''))}
        </h5>
      );
    } else {
      renderedElements.push(
        <p
          key={`p-${i}`}
          style={{
            margin: '4px 0',
            fontSize: '12.5px',
            lineHeight: 1.6,
            color: '#1E293B'
          }}
        >
          {renderInlineMarkdown(trimmed)}
        </p>
      );
    }
  });

  if (inBlockquote) flushBlockquote('quote-final');
  if (inList) flushList('list-final');
  if (inTable) flushTable('table-final');

  return <div style={{ display: 'flex', flexDirection: 'column' }}>{renderedElements}</div>;
};

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
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);
  const [currentAttachment, setCurrentAttachment] = useState<StoredAttachment | null>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const toggleVoiceRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = lang === 'hi' ? 'hi-IN' : 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          setQuery(prev => (prev ? `${prev} ${transcript}` : transcript));
        }
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition notice:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Speech recognition error:', err);
      setIsListening(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputDockRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Mobile virtual keyboard handling - lifts the message input dock smoothly above the keyboard
  useEffect(() => {
    const handleViewportChange = () => {
      if (typeof window !== 'undefined' && window.visualViewport && inputDockRef.current) {
        const offsetFromBottom = window.innerHeight - window.visualViewport.height - window.visualViewport.offsetTop;
        if (offsetFromBottom > 15) {
          inputDockRef.current.style.transform = `translateY(-${Math.max(0, offsetFromBottom)}px)`;
        } else {
          inputDockRef.current.style.transform = 'none';
        }
      }
    };

    if (typeof window !== 'undefined' && window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
      window.visualViewport.addEventListener('scroll', handleViewportChange);
    }
    return () => {
      if (typeof window !== 'undefined' && window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
        window.visualViewport.removeEventListener('scroll', handleViewportChange);
      }
    };
  }, []);

  // Load search history from localStorage on mount
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

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const saveHistory = (items: SearchHistoryItem[]) => {
    setSearchHistory(items);
    try {
      const safeItems = items.map(item => ({
        ...item,
        attachment: item.attachment ? {
          name: item.attachment.name,
          size: item.attachment.size,
          type: item.attachment.type
        } : undefined,
        messages: (item.messages || []).map(m => ({
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

  const processSelectedFile = (file: File) => {
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

    // Active session ID or create new session ID for this thread
    const sessionId = currentSessionId || ('session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7));
    if (!currentSessionId) {
      setCurrentSessionId(sessionId);
    }

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
      const historyContext = newMessages.slice(-6).map(m => ({
        role: m.role,
        content: m.content
      }));
      const res = await apiAskRAG({ query: q, history: historyContext });
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: res.answer || 'No direct synthesis available.',
        sources: res.sources || []
      };
      
      const finalMessages = [...newMessages, assistantMessage];
      setMessages(finalMessages);

      // Save/Update Conversation Thread in History (single thread per conversation session)
      const existingSession = searchHistory.find(h => h.id === sessionId);
      const threadTitle = existingSession ? existingSession.query : (q || (attachedFile ? attachedFile.name : 'Polar Inquiry'));
      
      const updatedSessionItem: SearchHistoryItem = {
        id: sessionId,
        query: threadTitle,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        messages: finalMessages,
        attachment: existingSession?.attachment || attachedFile || undefined
      };

      const updatedHistory = [updatedSessionItem, ...searchHistory.filter(h => h.id !== sessionId)].slice(0, 30);
      saveHistory(updatedHistory);
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Error consulting polar science knowledge repository: ' + (err.message || 'Unknown network error.')
      };
      const finalMessagesWithErr = [...newMessages, errorMessage];
      setMessages(finalMessagesWithErr);

      const existingSession = searchHistory.find(h => h.id === sessionId);
      const threadTitle = existingSession ? existingSession.query : (q || (attachedFile ? attachedFile.name : 'Polar Inquiry'));
      
      const updatedSessionItem: SearchHistoryItem = {
        id: sessionId,
        query: threadTitle,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        messages: finalMessagesWithErr,
        attachment: existingSession?.attachment || attachedFile || undefined
      };

      const updatedHistory = [updatedSessionItem, ...searchHistory.filter(h => h.id !== sessionId)].slice(0, 30);
      saveHistory(updatedHistory);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectHistoryItem = (item: SearchHistoryItem) => {
    setCurrentSessionId(item.id);
    setMessages(item.messages && item.messages.length > 0 ? item.messages : [{ role: 'user', content: item.query }]);
    setQuery('');
    setCurrentAttachment(null);
  };

  const handleDeleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentSessionId === id) {
      setCurrentSessionId(null);
      setMessages([]);
      setQuery('');
      setCurrentAttachment(null);
    }
    const updated = searchHistory.filter(h => h.id !== id);
    saveHistory(updated);
  };

  const handleClearAllHistory = () => {
    if (window.confirm('Are you sure you want to clear all conversation history?')) {
      setCurrentSessionId(null);
      setMessages([]);
      setQuery('');
      setCurrentAttachment(null);
      saveHistory([]);
    }
  };

  const handleResetChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setQuery('');
    setCurrentAttachment(null);
    inputRef.current?.focus();
  };

  return (
    <div 
      style={{ 
        width: '100%', 
        height: 'calc(100vh - 76px)', 
        display: 'flex', 
        position: 'relative',
        overflow: 'hidden',
        background: '#F8FAFC'
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

      {/* Mobile Drawer Backdrop when history is open on mobile/tablet */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-30 lg:hidden animate-fadeIn"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* LEFT SIDEBAR: Search & Conversation History                    */}
      {/* ───────────────────────────────────────────────────────────── */}
      <aside 
        className={`transition-all duration-200 bg-white flex flex-col z-40 overflow-hidden ${
          sidebarOpen 
            ? 'fixed lg:relative inset-y-0 left-0 w-72 lg:w-[260px] lg:min-w-[260px] border-r border-slate-200 shadow-2xl lg:shadow-none' 
            : 'hidden lg:flex w-0 min-w-0 border-none'
        }`}
        style={{
          height: '100%'
        }}
      >
        {sidebarOpen && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '12px' }}>
            {/* Sidebar Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid #F1F5F9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={14} style={{ color: '#0284C7' }} />
                <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Chat History
                </span>
                {searchHistory.length > 0 && (
                  <span style={{ fontSize: '10px', fontWeight: 700, background: '#F1F5F9', color: '#64748B', padding: '1px 6px', borderRadius: '10px' }}>
                    {searchHistory.length}
                  </span>
                )}
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
                background: currentSessionId === null && messages.length === 0 ? '#0284C7' : '#F0F9FF',
                border: currentSessionId === null && messages.length === 0 ? '1px solid #0284C7' : '1px solid #BAE6FD',
                color: currentSessionId === null && messages.length === 0 ? '#FFFFFF' : '#0284C7',
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
                  No previous conversations.<br />Your chat sessions will be saved here automatically.
                </div>
              ) : (
                searchHistory.map((item) => {
                  const isActive = item.id === currentSessionId;
                  const inquiryCount = item.messages 
                    ? Math.max(1, item.messages.filter(m => m.role === 'user').length)
                    : 1;

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectHistoryItem(item)}
                      style={{
                        padding: '6px 8px',
                        borderRadius: '8px',
                        background: isActive ? '#E0F2FE' : '#F8FAFC',
                        border: isActive ? '1px solid #38BDF8' : '1px solid #E2E8F0',
                        borderLeft: isActive ? '3px solid #0284C7' : '1px solid #E2E8F0',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '6px',
                        transition: 'all 0.15s',
                        whiteSpace: 'nowrap'
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          (e.currentTarget as HTMLElement).style.background = '#F0F9FF';
                          (e.currentTarget as HTMLElement).style.borderColor = '#BAE6FD';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          (e.currentTarget as HTMLElement).style.background = '#F8FAFC';
                          (e.currentTarget as HTMLElement).style.borderColor = '#E2E8F0';
                        }
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ 
                          fontSize: '11px', 
                          fontWeight: isActive ? 700 : 600, 
                          color: isActive ? '#0369A1' : '#1E293B', 
                          whiteSpace: 'nowrap', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis',
                          flex: 1,
                          minWidth: 0
                        }}>
                          {item.query}
                        </span>
                        <span style={{ fontSize: '9px', color: isActive ? '#0284C7' : '#94A3B8', whiteSpace: 'nowrap', flexShrink: 0 }}>
                          {item.timestamp}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '4px',
                          background: 'transparent',
                          border: 'none',
                          color: '#94A3B8',
                          cursor: 'pointer',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.18s',
                          flexShrink: 0
                        }}
                        onMouseEnter={(e) => {
                          const el = e.currentTarget as HTMLElement;
                          el.style.background = '#FEE2E2';
                          el.style.color = '#DC2626';
                        }}
                        onMouseLeave={(e) => {
                          const el = e.currentTarget as HTMLElement;
                          el.style.background = 'transparent';
                          el.style.color = '#94A3B8';
                        }}
                        title="Delete this conversation"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  );
                })
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
                    borderRadius: '4px'
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.color = '#DC2626';
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.color = '#94A3B8';
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
      {/* MAIN VIEWPORT: Spacious, Non-Congested Layout                 */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div 
        style={{ 
          flex: 1, 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column', 
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Toggle Button to reopen sidebar when collapsed */}
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
              padding: '5px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11.5px',
              fontWeight: 600,
              color: '#475569',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
              zIndex: 15
            }}
            title="Open history sidebar"
          >
            <PanelLeftOpen size={14} style={{ color: '#0284C7' }} />
            <span>History</span>
          </button>
        )}

        {/* ── TOP COMPACT TOOLBAR (Only shown during active conversation) ── */}
        {messages.length > 0 && (
          <header 
            style={{
              width: '100%',
              padding: '10px 24px',
              background: '#FFFFFF',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              zIndex: 10,
              flexShrink: 0
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: !sidebarOpen ? '80px' : '0px' }}>
              <div 
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '8px',
                  background: '#E0F2FE',
                  border: '1px solid #BAE6FD',
                  color: '#0284C7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Sparkles size={16} />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Ask <span className="dhruva-brand-text">DHRUVA</span></span>
                  <span style={{ fontSize: '10px', fontWeight: 600, color: '#059669', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '1px 6px', borderRadius: '9999px' }}>
                    Active Intelligence
                  </span>
                </div>
                <div style={{ fontSize: '10.5px', color: '#64748B' }}>
                  Grounded in peer-reviewed NCPOR research archives
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={handleResetChat}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  color: '#0284C7',
                  background: '#F0F9FF',
                  border: '1px solid #BAE6FD',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                <Plus size={13} />
                <span>New Inquiry</span>
              </button>
            </div>
          </header>
        )}

        {/* ── CENTER SCROLL AREA: Hero + Suggestions (if empty) OR Clean Message Stream (if active) ── */}
        <div 
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            padding: messages.length === 0 ? '20px 24px' : '16px 24px 24px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          {/* INITIAL STATE: HERO + SUGGESTIONS + WELCOME CARD */}
          {messages.length === 0 && (
            <div 
              style={{ 
                width: '100%', 
                maxWidth: '860px', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                gap: '14px',
                margin: 'auto 0'
              }}
            >
              {/* 1. HERO HEADER */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px' }}>
                <div 
                  style={{ 
                    width: '48px', 
                    height: '48px', 
                    borderRadius: '14px', 
                    background: 'rgba(224, 242, 254, 0.9)', 
                    border: '1.5px solid #BAE6FD', 
                    color: '#0284C7', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(2, 132, 199, 0.12)',
                    flexShrink: 0
                  }}
                >
                  <Sparkles size={26} />
                </div>

                <div style={{ textAlign: 'left' }}>
                  <h1 
                    style={{ 
                      fontSize: 'clamp(26px, 3.2vw, 36px)', 
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
                      fontSize: '10.5px', 
                      fontWeight: 700, 
                      letterSpacing: '0.2em', 
                      textTransform: 'uppercase', 
                      color: '#64748B', 
                      marginTop: '3px', 
                      marginBottom: 0 
                    }}
                  >
                    AI POLAR RESEARCH INTELLIGENCE
                  </p>
                </div>
              </div>

              {/* 2. HERO BANNER CARD */}
              <div 
                style={{ 
                  width: '100%', 
                  background: '#FFFFFF', 
                  border: '1px solid rgba(2, 132, 199, 0.2)', 
                  borderRadius: '16px', 
                  padding: '12px 24px', 
                  textAlign: 'center', 
                  boxShadow: '0 4px 20px rgba(2, 132, 199, 0.04)' 
                }}
              >
                <h2 
                  style={{ 
                    fontSize: 'clamp(18px, 2.2vw, 22px)', 
                    fontWeight: 800, 
                    color: '#0F172A', 
                    margin: 0, 
                    lineHeight: 1.3, 
                    fontFamily: 'var(--font-heading)' 
                  }}
                >
                  Ask any <span style={{ color: '#0284C7' }}>polar</span> <span style={{ color: '#2563EB' }}>science</span> question
                </h2>
                <p 
                  style={{ 
                    fontSize: '12px', 
                    color: '#64748B', 
                    marginTop: '4px', 
                    marginBottom: 0, 
                    lineHeight: 1.45 
                  }}
                >
                  Strictly grounded in peer-reviewed NCPOR research — Arctic, Antarctic &amp; Himalayas — with page citations.
                </p>
              </div>

              {/* 3. SUGGESTED RESEARCH INQUIRIES */}
              <div style={{ width: '100%' }}>
                <div 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    marginBottom: '8px' 
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div 
                      style={{ 
                        width: '18px', 
                        height: '18px', 
                        borderRadius: '9999px', 
                        background: '#E0F2FE', 
                        color: '#0284C7', 
                        fontSize: '11px', 
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

                  <span style={{ fontSize: '11px', color: '#64748B' }}>
                    Click any prompt to ask
                  </span>
                </div>

                <div 
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5"
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
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = '#0284C7';
                        (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(2, 132, 199, 0.08)';
                        (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = '#E2E8F0';
                        (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)';
                        (e.currentTarget as HTMLElement).style.transform = 'none';
                      }}
                    >
                      <div 
                        style={{
                          width: '30px',
                          height: '30px',
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
                      <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#1E293B', lineHeight: 1.4, flex: 1 }}>
                        {item.text}
                      </span>
                      <ArrowRight size={13} style={{ color: '#0284C7', flexShrink: 0 }} />
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. DHRUVA ASSISTANT WELCOME CARD */}
              <div 
                style={{ 
                  width: '100%', 
                  background: '#FFFFFF', 
                  border: '1px solid #E2E8F0', 
                  borderRadius: '14px', 
                  padding: '12px 18px', 
                  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.02)', 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: '12px' 
                }}
              >
                <div 
                  style={{
                    width: '34px',
                    height: '34px',
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
                  <Sparkles size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#64748B', marginBottom: '2px' }}>
                    <span className="dhruva-brand-text font-bold">DHRUVA</span> ASSISTANT
                  </div>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0F172A', lineHeight: 1.35, marginBottom: '3px' }}>
                    Namaste! I am <span className="dhruva-brand-text font-bold">DHRUVA</span> (ध्रुव), the AI Research Assistant for India's Polar Science expeditions.
                  </div>
                  <p style={{ fontSize: '11.5px', color: '#475569', lineHeight: 1.5, margin: 0 }}>
                    I answer queries about polar geography, expeditions, research stations (<em>Himadri, Maitri, Bharati</em>), and peer-reviewed NCPOR publications. Ask anything from simple foundational questions to in-depth scientific queries!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ACTIVE STATE: CLEAN EXPANDED CONVERSATION STREAM */}
          {messages.length > 0 && (
            <div 
              style={{ 
                width: '100%', 
                maxWidth: '880px', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '16px'
              }}
            >
              {messages.map((msg, idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    display: 'flex', 
                    gap: '12px', 
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    width: '100%'
                  }}
                >
                  {/* Assistant Avatar */}
                  {msg.role === 'assistant' && (
                    <div 
                      style={{ 
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '10px', 
                        background: '#EEF2FF', 
                        border: '1px solid #C7D2FE', 
                        color: '#6366F1', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        flexShrink: 0, 
                        marginTop: '2px',
                        boxShadow: '0 2px 6px rgba(99, 102, 241, 0.12)'
                      }}
                    >
                      <Sparkles size={16} />
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div 
                    style={{
                      maxWidth: '85%',
                      borderRadius: '16px',
                      padding: '14px 18px',
                      background: msg.role === 'user' ? 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)' : '#FFFFFF',
                      color: msg.role === 'user' ? '#FFFFFF' : '#1E293B',
                      border: msg.role === 'user' ? 'none' : '1px solid #E2E8F0',
                      boxShadow: msg.role === 'user' ? '0 3px 12px rgba(2, 132, 199, 0.22)' : '0 2px 10px rgba(15, 23, 42, 0.04)'
                    }}
                  >
                    {msg.role === 'assistant' && (
                      <div 
                        style={{ 
                          fontSize: '10px', 
                          fontWeight: 700, 
                          color: '#6366F1', 
                          textTransform: 'uppercase', 
                          letterSpacing: '0.08em', 
                          marginBottom: '8px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          borderBottom: '1px solid #F1F5F9',
                          paddingBottom: '6px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Sparkles size={11} />
                          <span><span className="dhruva-brand-text font-bold">DHRUVA</span> AI · Grounded Synthesis</span>
                        </div>
                        <span style={{ fontSize: '9px', color: '#94A3B8', fontWeight: 600 }}>
                          MoES / NCPOR India
                        </span>
                      </div>
                    )}

                    {/* Attachment preview inside message */}
                    {msg.attachment && (
                      <div 
                        style={{ 
                          marginBottom: '8px', 
                          padding: '6px 12px', 
                          borderRadius: '8px', 
                          background: msg.role === 'user' ? 'rgba(255,255,255,0.18)' : '#F1F5F9', 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '6px', 
                          fontSize: '11.5px', 
                          border: '1px solid rgba(255,255,255,0.3)' 
                        }}
                      >
                        <Paperclip size={13} />
                        <span style={{ fontWeight: 600 }}>{msg.attachment.name}</span>
                        <span style={{ opacity: 0.85 }}>({(msg.attachment.size / 1024).toFixed(0)} KB)</span>
                      </div>
                    )}

                    {/* Parsed & Formatted Content */}
                    <FormattedMessageContent content={msg.content} role={msg.role} />

                    {/* Verified Sources & Provenance Cards */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #F1F5F9' }}>
                        <div 
                          style={{ 
                            fontSize: '10.5px', 
                            fontWeight: 700, 
                            color: '#059669', 
                            textTransform: 'uppercase', 
                            letterSpacing: '0.05em', 
                            marginBottom: '8px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '5px' 
                          }}
                        >
                          <ShieldCheck size={14} />
                          <span>Verified Scientific Citations ({msg.sources.length})</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {msg.sources.map((src, sIdx) => (
                            <div 
                              key={sIdx}
                              onClick={() => onReadPaper(src.paperId)}
                              style={{ 
                                background: '#F8FAFC', 
                                border: '1px solid #E2E8F0', 
                                borderRadius: '10px', 
                                padding: '8px 12px', 
                                fontSize: '11.5px', 
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
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
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                <span style={{ fontWeight: 700, color: '#0284C7', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                  <BookOpen size={12} />
                                  <span>{src.paperTitle}</span>
                                </span>
                                <span style={{ fontSize: '9.5px', fontWeight: 700, color: '#059669', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '2px 6px', borderRadius: '4px', flexShrink: 0 }}>
                                  {src.confidenceScore}% Verified
                                </span>
                              </div>
                              <div style={{ fontSize: '10px', color: '#64748B', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>§ {src.sectionName}</span>
                                <span>•</span>
                                <span>Page {src.pageNumber}</span>
                              </div>
                              <div style={{ fontStyle: 'italic', color: '#475569', borderLeft: '2px solid #0284C7', paddingLeft: '8px', marginTop: '4px', fontSize: '11px', lineHeight: 1.45 }}>
                                "{src.snippet.length > 240 ? src.snippet.slice(0, 240) + '...' : src.snippet}"
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* User Avatar */}
                  {msg.role === 'user' && (
                    <div 
                      style={{ 
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '10px', 
                        background: '#E0F2FE', 
                        border: '1px solid #BAE6FD', 
                        color: '#0284C7', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        flexShrink: 0, 
                        marginTop: '2px',
                        boxShadow: '0 2px 6px rgba(2, 132, 199, 0.12)'
                      }}
                    >
                      <User size={16} />
                    </div>
                  )}
                </div>
              ))}

              {/* Loading Indicator */}
              {loading && (
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', alignSelf: 'flex-start' }}>
                  <div 
                    style={{ 
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '10px', 
                      background: '#EEF2FF', 
                      border: '1px solid #C7D2FE',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center' 
                    }}
                  >
                    <Sparkles size={16} className="animate-spin text-indigo-600" />
                  </div>
                  <div 
                    style={{ 
                      background: '#FFFFFF', 
                      border: '1px solid #E2E8F0', 
                      borderRadius: '12px', 
                      padding: '10px 16px', 
                      fontSize: '12px', 
                      color: '#475569',
                      boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span className="inline-block w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                    <span>Synthesizing answer from polar scientific repository &amp; verifying citations...</span>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} style={{ height: '8px' }} />
            </div>
          )}
        </div>

        {/* ── BOTTOM DOCKED SECTION (SEARCH INPUT + ATTACHMENTS + TRUST BADGES) ── */}
        <div 
          ref={inputDockRef}
          style={{ 
            width: '100%', 
            padding: '8px clamp(10px, 3vw, 24px) 12px clamp(10px, 3vw, 24px)',
            background: 'linear-gradient(to top, #FFFFFF 85%, rgba(255,255,255,0.7) 100%)',
            borderTop: '1px solid #E2E8F0',
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            flexShrink: 0,
            zIndex: 20,
            transition: 'transform 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          <div style={{ width: '100%', maxWidth: '880px' }}>
            {/* Active Attachment Pill Preview */}
            {currentAttachment && (
              <div 
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 14px',
                  borderRadius: '10px',
                  background: '#F0F9FF',
                  border: '1px solid #BAE6FD',
                  marginBottom: '8px',
                  fontSize: '12px',
                  color: '#0284C7'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {currentAttachment.type.startsWith('image/') ? <ImageIcon size={14} /> : <Paperclip size={14} />}
                  <span style={{ fontWeight: 600 }}>Attached: {currentAttachment.name}</span>
                  <span style={{ color: '#64748B', fontSize: '10.5px' }}>({(currentAttachment.size / 1024).toFixed(0)} KB)</span>
                </div>
                <button 
                  type="button" 
                  onClick={handleRemoveAttachment}
                  style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px' }}
                  title="Remove attachment"
                >
                  <X size={15} />
                </button>
              </div>
            )}

            {/* Floating Rounded Query Input Bar */}
            <form 
              onSubmit={handleSubmit}
              style={{
                width: '100%',
                background: '#FFFFFF',
                border: '1.5px solid #CBD5E1',
                borderRadius: '9999px',
                boxShadow: '0 4px 16px rgba(15, 23, 42, 0.06)',
                padding: '4px 6px 4px clamp(10px, 2.5vw, 18px)',
                display: 'flex',
                alignItems: 'center',
                gap: 'clamp(4px, 1.5vw, 10px)',
                marginBottom: '8px',
                transition: 'border-color 0.15s, box-shadow 0.15s'
              }}
              onFocus={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = '#0284C7';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 18px rgba(2, 132, 199, 0.15)';
              }}
              onBlur={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = '#CBD5E1';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(15, 23, 42, 0.06)';
              }}
            >
              {/* Image upload button */}
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                style={{ 
                  color: currentAttachment?.type.startsWith('image/') ? '#0284C7' : '#94A3B8', 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '4px',
                  borderRadius: '9999px',
                  transition: 'all 0.15s'
                }}
                title="Attach polar research photo or diagram"
              >
                <ImageIcon size={17} />
              </button>

              {/* Document upload button */}
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                style={{ 
                  color: currentAttachment && !currentAttachment.type.startsWith('image/') ? '#0284C7' : '#94A3B8', 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '4px',
                  borderRadius: '9999px',
                  transition: 'all 0.15s'
                }}
                title="Attach research document or dataset"
              >
                <Paperclip size={17} />
              </button>

              {/* Query input field */}
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={(e) => {
                  setTimeout(() => {
                    e.target.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                  }, 120);
                }}
                placeholder="Ask a polar science question..."
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: 'clamp(12px, 2vw, 13.5px)',
                  color: '#0F172A',
                  fontFamily: 'var(--font-body)',
                  minWidth: 0
                }}
                disabled={loading}
              />

              {/* Voice recognition microphone button */}
              <button
                type="button"
                onClick={toggleVoiceRecognition}
                style={{
                  color: isListening ? '#EF4444' : '#64748B',
                  background: isListening ? '#FEE2E2' : 'none',
                  border: isListening ? '1px solid #FCA5A5' : 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px',
                  borderRadius: '9999px',
                  transition: 'all 0.15s',
                  animation: isListening ? 'pulse 1.5s infinite' : 'none'
                }}
                title={isListening ? 'Listening (Click to stop)...' : 'Ask using voice (English / Hindi)'}
              >
                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>

              {/* Send Pill Button */}
              <button
                type="submit"
                disabled={loading || (!query.trim() && !currentAttachment)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px clamp(10px, 2.5vw, 18px)',
                  borderRadius: '9999px',
                  background: '#0284C7',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 2px 10px rgba(2, 132, 199, 0.3)',
                  opacity: loading || (!query.trim() && !currentAttachment) ? 0.5 : 1,
                  transition: 'all 0.15s',
                  flexShrink: 0
                }}
              >
                <Send size={12} />
                <span>Send</span>
              </button>
            </form>

            {/* TRUST BADGES FOOTER */}
            <div 
              style={{
                width: '100%',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'clamp(8px, 2.5vw, 20px)',
                fontSize: '10.5px',
                color: '#64748B',
                fontWeight: 500
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={12} style={{ color: '#0284C7' }} />
                <span>Grounded in NCPOR research</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <FileText size={12} style={{ color: '#0284C7' }} />
                <span>Section &amp; page citations provided</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Lock size={11} style={{ color: '#0284C7' }} />
                <span>Scientific &amp; verified provenance</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
