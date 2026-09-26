import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Send, 
  BookOpen, 
  ShieldCheck, 
  User, 
  HelpCircle, 
  ChevronRight, 
  Plus, 
  MessageSquare, 
  MoreVertical, 
  Trash2, 
  Edit3, 
  Menu, 
  X, 
  LogIn, 
  Clock
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
  'What did India’s IndARC mooring observatory observe in Kongsfjorden at 192m depth?',
  'What did research find regarding microplastics in Arctic snow around Himadri Station?',
  'What role do phytoplankton blooms in Prydz Bay play near Bharati Station?'
];

const INITIAL_WELCOME: ChatMessage = {
  role: 'assistant',
  content: "Namaste! I am DHRUVA (ध्रुव), the AI Research Assistant for India's Polar Science expeditions.\n\nI answer questions strictly grounded in our peer-reviewed polar science knowledge repository, providing verified section and page citations. Try selecting one of the suggested scientific queries below or ask your own question!"
};

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
  
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_WELCOME]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [menuOpenSessionId, setMenuOpenSessionId] = useState<string | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

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
      }
    } catch (e) {
      console.warn('Failed to parse guest sessions:', e);
    }
  };

  const saveGuestSessions = (updatedSessions: ChatSession[], updatedMessages?: Record<string, ChatMessage[]>) => {
    try {
      const stored = localStorage.getItem('dhruva_guest_chats');
      const parsed = stored ? JSON.parse(stored) : { sessions: [], messages: {} };
      parsed.sessions = updatedSessions;
      if (updatedMessages) {
        parsed.messages = { ...parsed.messages, ...updatedMessages };
      }
      localStorage.setItem('dhruva_guest_chats', JSON.stringify(parsed));
    } catch (e) {
      console.warn('Failed to save guest sessions:', e);
    }
  };

  const handleNewChat = () => {
    setActiveSessionId(null);
    setMessages([INITIAL_WELCOME]);
    setQuery('');
    setSidebarOpen(false);
    setMobileDrawerOpen(false);
    inputRef.current?.focus();
  };

  const handleSelectSession = async (session: ChatSession) => {
    setActiveSessionId(session.id);
    setSidebarOpen(false);
    setMobileDrawerOpen(false);

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
        console.error('Error fetching messages:', err);
        setMessages([INITIAL_WELCOME]);
      } finally {
        setLoading(false);
      }
    } else {
      try {
        const stored = localStorage.getItem('dhruva_guest_chats');
        if (stored) {
          const parsed = JSON.parse(stored);
          const sessMessages = parsed.messages?.[session.id];
          setMessages(sessMessages && sessMessages.length > 0 ? sessMessages : [INITIAL_WELCOME]);
        } else {
          setMessages([INITIAL_WELCOME]);
        }
      } catch (e) {
        setMessages([INITIAL_WELCOME]);
      }
    }
  };

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

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
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
      saveGuestSessions(updated);
    }

    if (activeSessionId === sessionId) {
      handleNewChat();
    }
    setMenuOpenSessionId(null);
  };

  const handleSubmit = async (e?: React.FormEvent, customQ?: string) => {
    if (e) e.preventDefault();
    const q = (customQ || query).trim();
    if (!q || loading) return;

    setQuery('');
    const userMsg: ChatMessage = { role: 'user', content: q, createdAt: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await apiAskRAG({ query: q });
      
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: res.answer,
        sources: res.sources,
        createdAt: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMsg]);

      let currentSessionId = activeSessionId;

      if (!currentSessionId) {
        const title = generateShortTitle(q);
        if (isAuthenticated) {
          const sRes = await apiCreateChatSession(title);
          const newSessionId: string = sRes.session.id;
          currentSessionId = newSessionId;
          setSessions(prev => [sRes.session, ...prev]);
          setActiveSessionId(newSessionId);

          await apiSendChatMessage(newSessionId, { role: 'user', content: userMsg.content });
          await apiSendChatMessage(newSessionId, { 
            role: 'assistant', 
            content: assistantMsg.content, 
            sources: assistantMsg.sources 
          });
        } else {
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
        const validSessionId: string = currentSessionId;
        if (isAuthenticated) {
          await apiSendChatMessage(validSessionId, { role: 'user', content: userMsg.content });
          await apiSendChatMessage(validSessionId, { 
            role: 'assistant', 
            content: assistantMsg.content, 
            sources: assistantMsg.sources 
          });
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

  const renderSidebar = () => (
    <div className="h-full flex flex-col" style={{ background: '#FFFFFF' }}>

      {/* Header */}
      <div className="px-4 pt-5 pb-4" style={{ borderBottom: '1px solid #E2E8F0' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'rgba(2, 132, 199, 0.1)', border: '1px solid rgba(2, 132, 199, 0.25)' }}>
              <MessageSquare className="w-3.5 h-3.5 text-cyan-700" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900" style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.04em' }}>Chat History</div>
              <div className="text-[10px] text-slate-500 font-mono">{sessions.length} saved</div>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-800 transition-colors"
            style={{ background: '#F1F5F9' }}
            title="Collapse sidebar"
          >
            <X size={13} />
          </button>
          <button
            onClick={() => setMobileDrawerOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-800 transition-colors"
            style={{ background: '#F1F5F9' }}
          >
            <X size={13} />
          </button>
        </div>

        <button
          onClick={handleNewChat}
          className="w-full h-[40px] px-4 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, #0284C7, #0369A1)',
            color: '#FFFFFF',
            boxShadow: '0 2px 8px rgba(2, 132, 199, 0.25)',
          }}
        >
          <Plus size={14} />
          <span>New Conversation</span>
        </button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto py-3 px-3 space-y-4 text-xs"
        style={{ scrollbarWidth: 'thin' }}>
        {sessions.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-3">
            <div className="w-11 h-11 rounded-2xl mx-auto flex items-center justify-center"
              style={{ background: '#F1F5F9', border: '1px solid #E2E8F0' }}>
              <MessageSquare className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">No conversations yet.<br />Ask a polar science question!</p>
          </div>
        ) : (
          <>
            {grouped.today.length > 0 && (
              <div className="space-y-0.5">
                <div className="text-[10px] font-bold uppercase tracking-widest text-cyan-700 px-2 pb-1.5">Today</div>
                {grouped.today.map(renderSessionItem)}
              </div>
            )}
            {grouped.yesterday.length > 0 && (
              <div className="space-y-0.5">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-2 pb-1.5">Yesterday</div>
                {grouped.yesterday.map(renderSessionItem)}
              </div>
            )}
            {grouped.prev7Days.length > 0 && (
              <div className="space-y-0.5">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-2 pb-1.5">Previous 7 Days</div>
                {grouped.prev7Days.map(renderSessionItem)}
              </div>
            )}
            {grouped.older.length > 0 && (
              <div className="space-y-0.5">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-2 pb-1.5">Older</div>
                {grouped.older.map(renderSessionItem)}
              </div>
            )}
          </>
        )}
      </div>

      {/* Guest sign-in */}
      {!isAuthenticated && (
        <div className="p-3 m-3 rounded-2xl space-y-2.5"
          style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
          <div className="flex items-start gap-2">
            <Clock size={12} className="text-cyan-600 shrink-0 mt-0.5" />
            <p className="text-[10.5px] text-slate-600 leading-snug">Guest mode — chats stored locally in your browser.</p>
          </div>
          {onNavigate && (
            <button
              onClick={() => onNavigate('login')}
              className="w-full h-[34px] rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              style={{ background: 'rgba(2, 132, 199, 0.1)', border: '1px solid rgba(2, 132, 199, 0.3)', color: '#0284C7' }}
            >
              <LogIn size={12} />
              <span>Sign In to Sync</span>
            </button>
          )}
        </div>
      )}
    </div>
  );

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
            className="w-full rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none"
            style={{ background: '#FFFFFF', border: '1px solid #0284C7' }}
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
          background: 'rgba(2, 132, 199, 0.09)',
          border: '1px solid rgba(2, 132, 199, 0.3)',
        } : {
          border: '1px solid transparent'
        }}
      >
        <div className="flex items-center gap-2 min-w-0 pr-1">
          <div className="w-6 h-6 rounded-md shrink-0 flex items-center justify-center"
            style={{ background: isActive ? 'rgba(2, 132, 199, 0.15)' : '#F1F5F9' }}>
            <MessageSquare className={`w-3 h-3 ${isActive ? 'text-cyan-700' : 'text-slate-500'}`} />
          </div>
          <span className={`truncate text-xs leading-snug ${isActive ? 'text-cyan-800 font-bold' : 'text-slate-600 group-hover:text-slate-900'}`}>
            {session.title}
          </span>
        </div>

        <div className="relative shrink-0">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setMenuOpenSessionId(isMenuOpen ? null : session.id); }}
            className="p-1 rounded-md text-slate-400 hover:text-slate-800 opacity-0 group-hover:opacity-100 transition cursor-pointer"
            aria-label="Conversation actions"
          >
            <MoreVertical size={13} />
          </button>

          {isMenuOpen && (
            <div
              className="absolute right-0 top-7 w-28 rounded-xl shadow-xl py-1 z-30"
              style={{ background: '#FFFFFF', border: '1px solid #CBD5E1' }}
              onClick={(e) => e.stopPropagation()}
            >
              <button type="button" onClick={(e) => handleStartRename(session, e)}
                className="w-full px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50 hover:text-cyan-700 flex items-center gap-2 cursor-pointer">
                <Edit3 size={12} /><span>Rename</span>
              </button>
              <button type="button" onClick={(e) => handleDeleteSession(session.id, e)}
                className="w-full px-3 py-1.5 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer">
                <Trash2 size={12} /><span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col" style={{ height: 'calc(100dvh - 80px)', background: 'transparent' }}>

      {/* CHAT HISTORY SIDEBAR */}
      <aside
        className="hidden md:flex flex-col fixed top-[80px] left-0 bottom-0 z-40 overflow-hidden transition-transform duration-300 ease-in-out"
        style={{
          width: '272px',
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          borderRight: '1px solid rgba(14, 116, 144, 0.16)',
          boxShadow: sidebarOpen ? '4px 0 32px rgba(15, 23, 42, 0.12)' : 'none',
        }}
      >
        {renderSidebar()}
      </aside>
      {sidebarOpen && (
        <div
          className="hidden md:block fixed inset-0 z-30 top-[80px]"
          style={{ background: 'rgba(15, 23, 42, 0.25)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setMobileDrawerOpen(false)} />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10">{renderSidebar()}</div>
        </div>
      )}

      {/* SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
        <div style={{ width: '100%', maxWidth: '1200px', marginLeft: 'auto', marginRight: 'auto', paddingLeft: 'clamp(1rem, 3vw, 2rem)', paddingRight: 'clamp(1rem, 3vw, 2rem)' }}>

          {/* HERO HEADER */}
          <div style={{ paddingTop: '2rem', paddingBottom: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>

            <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>

              {/* Left: sidebar toggle + New Chat */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  onClick={() => setSidebarOpen(v => !v)}
                  className="hidden md:flex p-2 rounded-xl transition-all items-center cursor-pointer"
                  style={{
                    background: sidebarOpen ? 'rgba(2, 132, 199, 0.1)' : '#FFFFFF',
                    border: `1px solid ${sidebarOpen ? '#0284C7' : '#CBD5E1'}`,
                    color: sidebarOpen ? '#0284C7' : '#475569',
                  }}
                  title={sidebarOpen ? 'Collapse history' : 'Show history'}
                >
                  <Menu size={15} />
                </button>
                <button
                  onClick={() => setMobileDrawerOpen(true)}
                  className="md:hidden flex p-2 rounded-xl items-center gap-1.5 text-xs font-semibold cursor-pointer"
                  style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0284C7' }}
                >
                  <Menu size={15} />
                  <span>History</span>
                </button>
                <button
                  onClick={handleNewChat}
                  className="flex p-2 rounded-xl items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer"
                  style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#475569' }}
                  title="New conversation"
                >
                  <Plus size={14} />
                  <span className="hidden sm:inline">New Chat</span>
                </button>
              </div>

              {/* Right: Repository Grounded status */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '11px' }}>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-slate-600 font-semibold hidden sm:inline">Repository Grounded</span>
                <span className="text-slate-300 hidden sm:inline">|</span>
                <span className="flex items-center gap-1 text-cyan-700 font-bold font-mono">
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
                  background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.12), rgba(99, 102, 241, 0.15))',
                  border: '1px solid rgba(2, 132, 199, 0.35)',
                  boxShadow: '0 4px 14px rgba(2, 132, 199, 0.15)',
                }}
              >
                <Sparkles className="w-6 h-6 text-cyan-600" />
              </div>
              <h1
                className="text-4xl sm:text-5xl font-extrabold text-slate-900"
                style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.03em' }}
              >
                Ask DHRUVA
              </h1>
            </div>
            <p className="text-xs font-mono tracking-widest text-slate-500 uppercase font-semibold" style={{ letterSpacing: '0.2em' }}>
              AI Polar Research Assistant
            </p>
          </div>

          {/* INTRO CARD */}
          {messages.length <= 1 && (
            <div
              className="rounded-2xl px-8 py-8 text-center mb-5"
              style={{
                background: 'rgba(255, 255, 255, 0.92)',
                border: '1px solid rgba(14, 116, 144, 0.18)',
                boxShadow: '0 8px 30px rgba(15, 23, 42, 0.06)',
              }}
            >
              <h2 className="text-2xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
                Ask any polar science question
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed max-w-xl mx-auto">
                Strictly grounded in peer-reviewed NCPOR research — Arctic &amp; Antarctic expeditions — with section &amp; page citations.
              </p>
            </div>
          )}

          {/* SUGGESTED QUESTIONS */}
          {messages.length <= 1 && (
            <div className="mb-8">
              <div className="text-[10.5px] font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-cyan-600" />
                <span>Suggested Research Inquiries</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {SAMPLE_QUESTIONS.map((sq, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSubmit(undefined, sq)}
                    className="min-h-[56px] p-4 rounded-xl text-left transition-all flex items-start justify-between gap-3 group cursor-pointer"
                    style={{ background: 'rgba(255, 255, 255, 0.92)', border: '1px solid rgba(14, 116, 144, 0.16)', boxShadow: '0 4px 14px rgba(15, 23, 42, 0.04)' }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(2, 132, 199, 0.5)';
                      (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(2, 132, 199, 0.12)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(14, 116, 144, 0.16)';
                      (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 14px rgba(15, 23, 42, 0.04)';
                    }}
                  >
                    <span className="leading-relaxed flex-1 text-xs text-slate-700 font-medium group-hover:text-cyan-700 transition-colors">{sq}</span>
                    <ChevronRight className="w-4 h-4 shrink-0 mt-0.5 text-slate-400 group-hover:text-cyan-600 transition-colors" />
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
                  className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
                  style={msg.role === 'user'
                    ? { background: '#E0F2FE', border: '1px solid #BAE6FD' }
                    : { background: '#EEF2FF', border: '1px solid #C7D2FE' }}
                >
                  {msg.role === 'user' ? <User className="w-4 h-4 text-cyan-700" /> : <Sparkles className="w-4 h-4 text-indigo-700" />}
                </div>

                <div className="flex-1 min-w-0 max-w-[90%] space-y-1.5">
                  <div className={`text-[10.5px] font-bold uppercase tracking-widest flex items-center gap-2 ${msg.role === 'user' ? 'justify-end text-cyan-700' : 'text-indigo-700'}`}>
                    {msg.role === 'user' ? 'You' : 'DHRUVA Assistant'}
                    {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase"
                        style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#047857' }}>
                        {msg.sources.length} cited
                      </span>
                    )}
                  </div>
                  <div
                    className={`rounded-2xl px-5 py-4 text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
                    style={msg.role === 'user'
                      ? { background: '#E0F2FE', border: '1px solid #BAE6FD', color: '#0369A1' }
                      : { background: 'rgba(255, 255, 255, 0.95)', border: '1px solid rgba(14, 116, 144, 0.16)', color: '#1E293B' }}
                  >
                    <div className="whitespace-pre-line">{msg.content}</div>
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-4 pt-4 space-y-2" style={{ borderTop: '1px solid rgba(148, 163, 184, 0.2)' }}>
                        <div className="text-[10.5px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-emerald-700">
                          <ShieldCheck className="w-3.5 h-3.5" />Verified Citations
                        </div>
                        <div className="space-y-1.5">
                          {msg.sources.map((s, sIdx) => (
                            <div
                              key={sIdx}
                              onClick={() => onReadPaper(s.paperId)}
                              className="p-3 rounded-xl cursor-pointer transition-all bg-slate-50 border border-slate-200 hover:border-cyan-500/50 hover:bg-cyan-50/30"
                            >
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <span className="text-xs font-bold text-slate-900 hover:text-cyan-700 transition-colors line-clamp-1">📄 {s.paperTitle}</span>
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  {s.confidenceScore}%
                                </span>
                              </div>
                              <div className="text-[10.5px] font-mono mb-1.5 text-cyan-700 font-semibold">§ {s.sectionName} · p.{s.pageNumber}</div>
                              <div className="text-[10.5px] text-slate-600 line-clamp-2 italic pl-2.5 border-l-2 border-cyan-500">"{s.snippet}"</div>
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
                <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center bg-indigo-50 border border-indigo-200">
                  <Sparkles className="w-4 h-4 text-indigo-600 animate-spin" />
                </div>
                <div className="rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-3 bg-white border border-cyan-200 shadow-sm">
                  <span className="text-xs text-cyan-700 font-semibold">Consulting polar research repository</span>
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="h-28" />
        </div>
      </div>

      {/* STICKY INPUT BAR */}
      <div
        className="shrink-0 w-full"
        style={{ background: 'rgba(255, 255, 255, 0.95)', borderTop: '1px solid rgba(14, 116, 144, 0.16)', backdropFilter: 'blur(20px)' }}
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
                className="flex-1 h-[52px] px-5 text-sm text-slate-900 placeholder-slate-400 rounded-2xl focus:outline-none transition-all"
                style={{
                  background: '#FFFFFF',
                  border: `1px solid ${query ? '#0284C7' : 'rgba(14, 116, 144, 0.22)'}`,
                  boxShadow: query ? '0 0 0 3px rgba(2, 132, 199, 0.12)' : 'none',
                }}
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="h-[52px] px-7 rounded-2xl text-sm font-bold flex items-center gap-2 shrink-0 transition-all disabled:opacity-40 cursor-pointer"
                style={{
                  background: query.trim() ? 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)' : '#F1F5F9',
                  color: query.trim() ? '#FFFFFF' : '#94A3B8',
                  boxShadow: query.trim() ? '0 4px 14px rgba(2, 132, 199, 0.35)' : 'none',
                  minWidth: '108px',
                }}
              >
                <Send className="w-4 h-4" />
                <span>Send</span>
              </button>
            </div>
            <p className="text-[10.5px] text-slate-500 text-center mt-2 font-medium">
              Grounded in NCPOR peer-reviewed research · Section &amp; page citations provided
            </p>
          </form>
        </div>
      </div>

    </div>
  );
};
