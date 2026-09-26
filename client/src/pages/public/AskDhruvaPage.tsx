import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Send, 
  BookOpen, 
  ShieldCheck, 
  User, 
  ExternalLink, 
  HelpCircle, 
  ChevronRight, 
  CheckCircle2, 
  Plus, 
  MessageSquare, 
  MoreVertical, 
  Trash2, 
  Edit3, 
  Menu, 
  X, 
  LogIn, 
  Clock, 
  ChevronDown
} from 'lucide-react';
import { 
  apiAskRAG, 
  apiFetchChatSessions, 
  apiCreateChatSession, 
  apiRenameChatSession, 
  apiDeleteChatSession, 
  apiFetchChatMessages, 
  apiSendChatMessage, 
  getAuthToken 
} from '../../services/api';

interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{
    paperId: string;
    paperTitle: string;
    sectionName: string;
    pageNumber: number;
    confidenceScore: number;
    snippet: string;
  }>;
  createdAt?: string;
}

interface ChatSession {
  id: string;
  title: string;
  updated_at: string;
  created_at: string;
}

interface AskDhruvaPageProps {
  onReadPaper: (id: string) => void;
  lang: 'en' | 'hi';
  currentUser?: any;
  onNavigate?: (tab: string) => void;
}

const SAMPLE_QUESTIONS = [
  'What causes seasonal changes in Antarctic sea ice in the Weddell Sea?',
  'How does permafrost thaw in Svalbard affect methane emissions?',
  'What did Indiaâ€™s IndARC mooring observatory observe in Kongsfjorden at 192m depth?',
  'What did research find regarding microplastics in Arctic snow around Himadri Station?',
  'What role do phytoplankton blooms in Prydz Bay play near Bharati Station?'
];

const INITIAL_WELCOME: ChatMessage = {
  role: 'assistant',
  content: "Namaste! I am DHRUVA (à¤§à¥à¤°à¥à¤µ), the AI Research Assistant for India's Polar Science expeditions.\n\nI answer questions strictly grounded in our peer-reviewed polar science knowledge repository, providing verified section and page citations. Try selecting one of the suggested scientific queries below or ask your own question!"
};

// Helper: Group sessions into Today, Yesterday, Previous 7 Days, Older
function groupSessions(sessions: ChatSession[]) {
  const now = new Date();
  const today: ChatSession[] = [];
  const yesterday: ChatSession[] = [];
  const prev7Days: ChatSession[] = [];
  const older: ChatSession[] = [];

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
  const startOf7Days = startOfToday - 7 * 24 * 60 * 60 * 1000;

  sessions.forEach(session => {
    const time = new Date(session.updated_at || session.created_at || Date.now()).getTime();
    if (time >= startOfToday) {
      today.push(session);
    } else if (time >= startOfYesterday) {
      yesterday.push(session);
    } else if (time >= startOf7Days) {
      prev7Days.push(session);
    } else {
      older.push(session);
    }
  });

  return { today, yesterday, prev7Days, older };
}

// Generate short title from query
function generateShortTitle(query: string): string {
  if (!query) return 'New Discussion';
  const clean = query.replace(/[?.,!]/g, '').trim();
  const words = clean.split(/\s+/);
  if (words.length <= 5) return words.join(' ');
  return words.slice(0, 5).join(' ') + '...';
}

export const AskDhruvaPage: React.FC<AskDhruvaPageProps> = ({ 
  onReadPaper, 
  lang, 
  currentUser, 
  onNavigate 
}) => {
  const isAuthenticated = !!(getAuthToken() && currentUser && currentUser.role !== 'guest');
  
  // Chat state
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_WELCOME]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  
  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [menuOpenSessionId, setMenuOpenSessionId] = useState<string | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Load chat sessions on mount or auth change
  useEffect(() => {
    loadSessions();
  }, [isAuthenticated, currentUser]);

  const loadSessions = async () => {
    if (isAuthenticated) {
      try {
        const res = await apiFetchChatSessions();
        setSessions(res.sessions || []);
      } catch (err) {
        console.error('Error fetching sessions:', err);
        loadGuestSessions();
      }
    } else {
      loadGuestSessions();
    }
  };

  const loadGuestSessions = () => {
    try {
      const stored = localStorage.getItem('dhruva_guest_chats');
      if (stored) {
        const parsed = JSON.parse(stored);
        setSessions(parsed.sessions || []);
      } else {
        setSessions([]);
      }
    } catch (e) {
      setSessions([]);
    }
  };

  const saveGuestSessions = (updatedSessions: ChatSession[], updatedMessagesMap?: Record<string, ChatMessage[]>) => {
    try {
      const stored = localStorage.getItem('dhruva_guest_chats');
      const parsed = stored ? JSON.parse(stored) : { sessions: [], messages: {} };
      parsed.sessions = updatedSessions;
      if (updatedMessagesMap) {
        parsed.messages = { ...parsed.messages, ...updatedMessagesMap };
      }
      localStorage.setItem('dhruva_guest_chats', JSON.stringify(parsed));
    } catch (e) {
      console.error('Error saving guest sessions:', e);
    }
  };

  // Open a specific conversation
  const handleSelectSession = async (session: ChatSession) => {
    setActiveSessionId(session.id);
    setMobileDrawerOpen(false);
    setMenuOpenSessionId(null);
    setEditingSessionId(null);

    if (isAuthenticated) {
      try {
        setLoading(true);
        const res = await apiFetchChatMessages(session.id);
        if (res.messages && res.messages.length > 0) {
          setMessages(res.messages);
        } else {
          setMessages([INITIAL_WELCOME]);
        }
      } catch (err) {
        console.error('Error loading session messages:', err);
      } finally {
        setLoading(false);
      }
    } else {
      try {
        const stored = localStorage.getItem('dhruva_guest_chats');
        if (stored) {
          const parsed = JSON.parse(stored);
          const sMessages = parsed.messages?.[session.id];
          if (sMessages && sMessages.length > 0) {
            setMessages(sMessages);
          } else {
            setMessages([INITIAL_WELCOME]);
          }
        }
      } catch (e) {
        setMessages([INITIAL_WELCOME]);
      }
    }
  };

  // Start New Chat
  const handleNewChat = () => {
    setActiveSessionId(null);
    setMessages([INITIAL_WELCOME]);
    setQuery('');
    setMobileDrawerOpen(false);
    setMenuOpenSessionId(null);
    setEditingSessionId(null);
    inputRef.current?.focus();
  };

  // Rename Session
  const handleStartRename = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditingTitle(session.title);
    setMenuOpenSessionId(null);
  };

  const handleSaveRename = async (sessionId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTitle.trim()) return;

    if (isAuthenticated) {
      try {
        await apiRenameChatSession(sessionId, editingTitle.trim());
        setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, title: editingTitle.trim() } : s));
      } catch (err) {
        console.error('Error renaming session:', err);
      }
    } else {
      const updated = sessions.map(s => s.id === sessionId ? { ...s, title: editingTitle.trim() } : s);
      setSessions(updated);
      saveGuestSessions(updated);
    }
    setEditingSessionId(null);
  };

  // Delete Session
  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpenSessionId(null);

    if (isAuthenticated) {
      try {
        await apiDeleteChatSession(sessionId);
        setSessions(prev => prev.filter(s => s.id !== sessionId));
      } catch (err) {
        console.error('Error deleting session:', err);
      }
    } else {
      const updated = sessions.filter(s => s.id !== sessionId);
      setSessions(updated);
      try {
        const stored = localStorage.getItem('dhruva_guest_chats');
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.sessions = updated;
          if (parsed.messages) delete parsed.messages[sessionId];
          localStorage.setItem('dhruva_guest_chats', JSON.stringify(parsed));
        }
      } catch (e) {}
    }

    if (activeSessionId === sessionId) {
      handleNewChat();
    }
  };

  // Send message
  const handleSubmit = async (e?: React.FormEvent, customQ?: string) => {
    if (e) e.preventDefault();
    const q = (customQ || query).trim();
    if (!q || loading) return;

    setQuery('');
    const userMsg: ChatMessage = { role: 'user', content: q, createdAt: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      // 1. Get Answer from Knowledge Engine API
      const res = await apiAskRAG({ query: q });
      
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: res.answer,
        sources: res.sources,
        createdAt: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMsg]);

      // 2. Persist in Session
      let currentSessionId = activeSessionId;

      if (!currentSessionId) {
        // Need to create a new session
        const title = generateShortTitle(q);
        if (isAuthenticated) {
          const sRes = await apiCreateChatSession(title);
          const newSessionId: string = sRes.session.id;
          currentSessionId = newSessionId;
          setSessions(prev => [sRes.session, ...prev]);
          setActiveSessionId(newSessionId);

          // Save both messages
          await apiSendChatMessage(newSessionId, { role: 'user', content: userMsg.content });
          await apiSendChatMessage(newSessionId, { 
            role: 'assistant', 
            content: assistantMsg.content, 
            sources: assistantMsg.sources 
          });
        } else {
          // Guest mode session creation
          const guestSessionId = `guest-sess-${Date.now()}`;
          currentSessionId = guestSessionId;
          const newSession: ChatSession = {
            id: guestSessionId,
            title,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          const updatedSessions = [newSession, ...sessions];
          setSessions(updatedSessions);
          setActiveSessionId(guestSessionId);
          saveGuestSessions(updatedSessions, {
            [guestSessionId]: [INITIAL_WELCOME, userMsg, assistantMsg]
          });
        }
      } else {
        // Existing session, append messages
        const validSessionId: string = currentSessionId;
        if (isAuthenticated) {
          await apiSendChatMessage(validSessionId, { role: 'user', content: userMsg.content });
          await apiSendChatMessage(validSessionId, { 
            role: 'assistant', 
            content: assistantMsg.content, 
            sources: assistantMsg.sources 
          });
          // Update session updated_at in local state
          setSessions(prev => prev.map(s => s.id === validSessionId ? { ...s, updated_at: new Date().toISOString() } : s));
        } else {
          const stored = localStorage.getItem('dhruva_guest_chats');
          const parsed = stored ? JSON.parse(stored) : { sessions: [], messages: {} };
          const existing = parsed.messages?.[validSessionId] || [INITIAL_WELCOME];
          existing.push(userMsg, assistantMsg);
          parsed.messages[validSessionId] = existing;
          const updated = sessions.map(s => s.id === validSessionId ? { ...s, updated_at: new Date().toISOString() } : s);
          setSessions(updated);
        }
      }
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Error consulting polar science knowledge repository: ' + (err.message || 'Unknown network error.')
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const grouped = groupSessions(sessions);

  // Render Sidebar Content
  const renderSidebar = () => (
    <div className="h-full flex flex-col" style={{ background: 'linear-gradient(180deg, #07101f 0%, #060c1a 100%)' }}>

      {/* Header */}
      <div className="px-4 pt-5 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'rgba(0,240,255,0.12)', border: '1px solid rgba(0,240,255,0.25)' }}>
              <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div>
              <div className="text-xs font-bold text-white" style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.04em' }}>Chat History</div>
              <div className="text-[10px] text-slate-500 font-mono">{sessions.length} saved</div>
            </div>
          </div>
          {/* Desktop collapse */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="hidden md:flex p-1.5 rounded-lg text-slate-500 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.04)' }}
            title="Collapse sidebar"
          >
            <X size={13} />
          </button>
          {/* Mobile close */}
          <button
            onClick={() => setMobileDrawerOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-slate-500 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          >
            <X size={13} />
          </button>
        </div>

        <button
          onClick={handleNewChat}
          className="w-full h-[40px] px-4 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold transition-all cursor-pointer"
          style={{
            background: 'rgba(0,240,255,0.1)',
            border: '1px solid rgba(0,240,255,0.28)',
            color: '#00F0FF',
          }}
        >
          <Plus size={14} />
          <span>New Conversation</span>
        </button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto py-3 px-3 space-y-4 text-xs"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(56,189,248,0.15) transparent' }}>
        {sessions.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-3">
            <div className="w-11 h-11 rounded-2xl mx-auto flex items-center justify-center"
              style={{ background: 'rgba(0,240,255,0.06)', border: '1px solid rgba(0,240,255,0.15)' }}>
              <MessageSquare className="w-5 h-5 text-cyan-600" />
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">No conversations yet.<br />Ask a polar science question!</p>
          </div>
        ) : (
          <>
            {grouped.today.length > 0 && (
              <div className="space-y-0.5">
                <div className="text-[10px] font-bold uppercase tracking-widest text-cyan-400/70 px-2 pb-1.5">Today</div>
                {grouped.today.map(renderSessionItem)}
              </div>
            )}
            {grouped.yesterday.length > 0 && (
              <div className="space-y-0.5">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-600 px-2 pb-1.5">Yesterday</div>
                {grouped.yesterday.map(renderSessionItem)}
              </div>
            )}
            {grouped.prev7Days.length > 0 && (
              <div className="space-y-0.5">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-600 px-2 pb-1.5">Previous 7 Days</div>
                {grouped.prev7Days.map(renderSessionItem)}
              </div>
            )}
            {grouped.older.length > 0 && (
              <div className="space-y-0.5">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-600 px-2 pb-1.5">Older</div>
                {grouped.older.map(renderSessionItem)}
              </div>
            )}
          </>
        )}
      </div>

      {/* Guest sign-in */}
      {!isAuthenticated && (
        <div className="p-3 m-3 rounded-2xl space-y-2.5"
          style={{ background: 'rgba(0,240,255,0.04)', border: '1px solid rgba(0,240,255,0.14)' }}>
          <div className="flex items-start gap-2">
            <Clock size={12} className="text-cyan-500 shrink-0 mt-0.5" />
            <p className="text-[10.5px] text-slate-400 leading-snug">Guest mode â€” chats stored locally in your browser.</p>
          </div>
          {onNavigate && (
            <button
              onClick={() => onNavigate('login')}
              className="w-full h-[34px] rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
              style={{ background: 'rgba(0,240,255,0.08)', border: '1px solid rgba(0,240,255,0.22)', color: '#67E8F9' }}
            >
              <LogIn size={12} />
              <span>Sign In to Sync</span>
            </button>
          )}
        </div>
      )}
    </div>
  );

  // Render individual session item
  const renderSessionItem = (session: ChatSession) => {
    const isActive = activeSessionId === session.id;
    const isEditing = editingSessionId === session.id;
    const isMenuOpen = menuOpenSessionId === session.id;

    if (isEditing) {
      return (
        <form key={session.id} onSubmit={(e) => handleSaveRename(session.id, e)} className="p-1">
          <input
            type="text"
            autoFocus
            value={editingTitle}
            onChange={(e) => setEditingTitle(e.target.value)}
            onBlur={() => setEditingSessionId(null)}
            className="w-full rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
            style={{ background: 'rgba(0,240,255,0.08)', border: '1px solid rgba(0,240,255,0.5)' }}
          />
        </form>
      );
    }

    return (
      <div
        key={session.id}
        onClick={() => handleSelectSession(session)}
        className="group relative flex items-center justify-between px-2.5 py-2 rounded-xl cursor-pointer transition-all"
        style={isActive ? {
          background: 'rgba(0,240,255,0.09)',
          border: '1px solid rgba(0,240,255,0.28)',
          boxShadow: '0 0 10px rgba(0,240,255,0.06)'
        } : {
          border: '1px solid transparent'
        }}
      >
        <div className="flex items-center gap-2 min-w-0 pr-1">
          <div className="w-6 h-6 rounded-md shrink-0 flex items-center justify-center"
            style={{ background: isActive ? 'rgba(0,240,255,0.14)' : 'rgba(255,255,255,0.04)' }}>
            <MessageSquare className={`w-3 h-3 ${isActive ? 'text-cyan-400' : 'text-slate-600'}`} />
          </div>
          <span className={`truncate text-xs leading-snug ${isActive ? 'text-white font-medium' : 'text-slate-400 group-hover:text-slate-200'}`}>
            {session.title}
          </span>
        </div>

        <div className="relative shrink-0">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setMenuOpenSessionId(isMenuOpen ? null : session.id); }}
            className="p-1 rounded-md text-slate-600 hover:text-white opacity-0 group-hover:opacity-100 transition"
            aria-label="Conversation actions"
          >
            <MoreVertical size={13} />
          </button>

          {isMenuOpen && (
            <div
              className="absolute right-0 top-7 w-28 rounded-xl shadow-2xl py-1 z-30"
              style={{ background: '#0b1b33', border: '1px solid rgba(255,255,255,0.1)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <button type="button" onClick={(e) => handleStartRename(session, e)}
                className="w-full px-3 py-1.5 text-left text-xs text-slate-200 hover:bg-cyan-500/20 hover:text-cyan-300 flex items-center gap-2">
                <Edit3 size={12} /><span>Rename</span>
              </button>
              <button type="button" onClick={(e) => handleDeleteSession(session.id, e)}
                className="w-full px-3 py-1.5 text-left text-xs text-red-400 hover:bg-red-500/20 flex items-center gap-2">
                <Trash2 size={12} /><span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };


  return (
    <div className="flex flex-col" style={{ height: 'calc(100dvh - 80px)', background: 'linear-gradient(180deg, #060c18 0%, #030712 100%)' }}>

      {/* CHAT HISTORY SIDEBAR â€” fixed overlay drawer */}
      <aside
        className="hidden md:flex flex-col fixed top-[80px] left-0 bottom-0 z-40 overflow-hidden transition-transform duration-300 ease-in-out"
        style={{
          width: '272px',
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          borderRight: '1px solid rgba(255,255,255,0.08)',
          boxShadow: sidebarOpen ? '4px 0 32px rgba(0,0,0,0.6)' : 'none',
        }}
      >
        {renderSidebar()}
      </aside>
      {sidebarOpen && (
        <div
          className="hidden md:block fixed inset-0 z-30 top-[80px]"
          style={{ background: 'rgba(0,0,0,0.3)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileDrawerOpen(false)} />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10">{renderSidebar()}</div>
        </div>
      )}

      {/* SCROLLABLE CONTENT â€” one centred container governs ALL */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(56,189,248,0.12) transparent' }}>
        <div style={{ width: '100%', maxWidth: '1200px', marginLeft: 'auto', marginRight: 'auto', paddingLeft: 'clamp(1rem, 3vw, 2rem)', paddingRight: 'clamp(1rem, 3vw, 2rem)' }}>

          {/* HERO HEADER */}
          <div style={{ paddingTop: '2rem', paddingBottom: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>

            {/* Top action bar — flex row, NO absolute positioning, all within centered container */}
            <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>

              {/* Left: sidebar toggle + New Chat */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  onClick={() => setSidebarOpen(v => !v)}
                  className="hidden md:flex p-2 rounded-xl transition-all items-center"
                  style={{
                    background: sidebarOpen ? 'rgba(0,240,255,0.1)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${sidebarOpen ? 'rgba(0,240,255,0.3)' : 'rgba(255,255,255,0.1)'}`,
                    color: sidebarOpen ? '#00F0FF' : '#64748B',
                  }}
                  title={sidebarOpen ? 'Collapse history' : 'Show history'}
                >
                  <Menu size={15} />
                </button>
                <button
                  onClick={() => setMobileDrawerOpen(true)}
                  className="md:hidden flex p-2 rounded-xl items-center gap-1.5 text-xs font-medium"
                  style={{ background: 'rgba(0,240,255,0.08)', border: '1px solid rgba(0,240,255,0.25)', color: '#67E8F9' }}
                >
                  <Menu size={15} />
                  <span>History</span>
                </button>
                <button
                  onClick={handleNewChat}
                  className="flex p-2 rounded-xl items-center gap-1.5 text-xs font-medium transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#94A3B8' }}
                  title="New conversation"
                >
                  <Plus size={14} />
                  <span className="hidden sm:inline">New Chat</span>
                </button>
              </div>

              {/* Right: Repository Grounded status */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '11px' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-slate-300 hidden sm:inline">Repository Grounded</span>
                <span className="text-slate-600 hidden sm:inline">|</span>
                <span className="flex items-center gap-1 text-cyan-400 font-mono">
                  <BookOpen className="w-3 h-3" />
                  <span>20 Papers</span>
                </span>
              </div>
            </div>

            {/* Centered title block */}
            <div className="flex items-center gap-4 mb-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                style={{
                  background: 'linear-gradient(135deg, rgba(0,240,255,0.18), rgba(129,140,248,0.22))',
                  border: '1px solid rgba(0,240,255,0.35)',
                  boxShadow: '0 0 24px rgba(0,240,255,0.12)',
                }}
              >
                <Sparkles className="w-6 h-6 text-cyan-300" />
              </div>
              <h1
                className="text-4xl sm:text-5xl font-extrabold text-white"
                style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.03em' }}
              >
                Ask DHRUVA
              </h1>
            </div>
            <p className="text-xs font-mono tracking-widest text-slate-400 uppercase" style={{ letterSpacing: '0.2em' }}>
              AI Polar Research Assistant
            </p>
          </div>

          {/* INTRO CARD */}
          {messages.length <= 1 && (
            <div
              className="rounded-2xl px-8 py-8 text-center mb-5"
              style={{
                background: 'rgba(0,240,255,0.04)',
                border: '1px solid rgba(0,240,255,0.15)',
                boxShadow: '0 0 40px rgba(0,240,255,0.04)',
              }}
            >
              <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
                Ask any polar science question
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed max-w-xl mx-auto">
                Strictly grounded in peer-reviewed NCPOR research â€” Arctic &amp; Antarctic expeditions â€” with section &amp; page citations.
              </p>
            </div>
          )}

          {/* SUGGESTED QUESTIONS */}
          {messages.length <= 1 && (
            <div className="mb-8">
              <div className="text-[10.5px] font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-1.5">
                <HelpCircle className="w-3 h-3" />
                <span>Suggested Research Inquiries</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {SAMPLE_QUESTIONS.map((sq, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSubmit(undefined, sq)}
                    className="min-h-[56px] p-4 rounded-xl text-left transition-all flex items-start justify-between gap-3 group"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,240,255,0.35)';
                      (e.currentTarget as HTMLElement).style.background = 'rgba(0,240,255,0.05)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
                      (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)';
                    }}
                  >
                    <span className="leading-relaxed flex-1 text-xs text-slate-300 group-hover:text-white transition-colors">{sq}</span>
                    <ChevronRight className="w-4 h-4 shrink-0 mt-0.5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* MESSAGE STREAM */}
          <div className="space-y-5 pb-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div
                  className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
                  style={msg.role === 'user'
                    ? { background: 'rgba(0,240,255,0.12)', border: '1px solid rgba(0,240,255,0.28)' }
                    : { background: 'rgba(129,140,248,0.12)', border: '1px solid rgba(129,140,248,0.28)' }}
                >
                  {msg.role === 'user' ? <User className="w-4 h-4 text-cyan-300" /> : <Sparkles className="w-4 h-4 text-indigo-300" />}
                </div>

                <div className="flex-1 min-w-0 max-w-[90%] space-y-1.5">
                  <div className={`text-[10.5px] font-bold uppercase tracking-widest flex items-center gap-2 ${msg.role === 'user' ? 'justify-end text-cyan-400/70' : 'text-indigo-400/70'}`}>
                    {msg.role === 'user' ? 'You' : 'DHRUVA Assistant'}
                    {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase"
                        style={{ background: 'rgba(16,185,129,0.14)', border: '1px solid rgba(16,185,129,0.28)', color: '#34D399' }}>
                        {msg.sources.length} cited
                      </span>
                    )}
                  </div>
                  <div
                    className={`rounded-2xl px-5 py-4 text-sm leading-relaxed ${msg.role === 'user' ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
                    style={msg.role === 'user'
                      ? { background: 'rgba(0,240,255,0.09)', border: '1px solid rgba(0,240,255,0.22)', color: '#E0F2FE' }
                      : { background: 'rgba(10,24,46,0.85)', border: '1px solid rgba(255,255,255,0.08)', color: '#CBD5E1' }}
                  >
                    <div className="whitespace-pre-line">{msg.content}</div>
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-4 pt-4 space-y-2" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                        <div className="text-[10.5px] font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: '#34D399' }}>
                          <ShieldCheck className="w-3.5 h-3.5" />Verified Citations
                        </div>
                        <div className="space-y-1.5">
                          {msg.sources.map((s, sIdx) => (
                            <div
                              key={sIdx}
                              onClick={() => onReadPaper(s.paperId)}
                              className="p-3 rounded-xl cursor-pointer transition-all"
                              style={{ background: 'rgba(6,14,26,0.85)', border: '1px solid rgba(255,255,255,0.07)' }}
                              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,240,255,0.35)'; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'; }}
                            >
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <span className="text-xs font-semibold text-white hover:text-cyan-300 transition-colors line-clamp-1">ðŸ“„ {s.paperTitle}</span>
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0"
                                  style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', color: '#6EE7B7' }}>
                                  {s.confidenceScore}%
                                </span>
                              </div>
                              <div className="text-[10.5px] font-mono mb-1.5" style={{ color: 'rgba(103,232,249,0.8)' }}>Â§ {s.sectionName} Â· p.{s.pageNumber}</div>
                              <div className="text-[10.5px] text-slate-400 line-clamp-2 italic pl-2.5" style={{ borderLeft: '2px solid rgba(0,240,255,0.3)' }}>"{s.snippet}"</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(129,140,248,0.12)', border: '1px solid rgba(129,140,248,0.28)' }}>
                  <Sparkles className="w-4 h-4 text-indigo-300 animate-spin" />
                </div>
                <div className="rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-3"
                  style={{ background: 'rgba(10,24,46,0.85)', border: '1px solid rgba(0,240,255,0.2)' }}>
                  <span className="text-xs text-cyan-300/80">Consulting polar research repository</span>
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="h-28" />
        </div>
      </div>

      {/* STICKY INPUT BAR â€” full-width background, centred inner content */}
      <div
        className="shrink-0 w-full"
        style={{ background: 'rgba(4,10,24,0.97)', borderTop: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}
      >
        <div style={{ width: '100%', maxWidth: '1200px', marginLeft: 'auto', marginRight: 'auto', paddingLeft: 'clamp(1rem, 3vw, 2rem)', paddingRight: 'clamp(1rem, 3vw, 2rem)', paddingTop: '1rem', paddingBottom: '1rem' }}>
          <form onSubmit={handleSubmit}>
            <div className="flex gap-3 items-center">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask a polar science question..."
                className="flex-1 h-[52px] px-5 text-sm text-white placeholder-slate-500 rounded-2xl focus:outline-none transition-all"
                style={{
                  background: 'rgba(8,18,38,0.9)',
                  border: `1px solid ${query ? 'rgba(0,240,255,0.45)' : 'rgba(255,255,255,0.1)'}`,
                  boxShadow: query ? '0 0 0 3px rgba(0,240,255,0.07)' : 'none',
                }}
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="h-[52px] px-7 rounded-2xl text-sm font-bold flex items-center gap-2 shrink-0 transition-all disabled:opacity-40 cursor-pointer"
                style={{
                  background: query.trim() ? 'linear-gradient(135deg, #00E5FF 0%, #0BC5EB 100%)' : 'rgba(255,255,255,0.06)',
                  color: query.trim() ? '#020617' : '#475569',
                  boxShadow: query.trim() ? '0 0 24px rgba(0,229,255,0.3)' : 'none',
                  minWidth: '108px',
                }}
              >
                <Send className="w-4 h-4" />
                <span>Send</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-600 text-center mt-2">
              Grounded in NCPOR peer-reviewed research Â· Section &amp; page citations provided
            </p>
          </form>
        </div>
      </div>

    </div>
  );
};
