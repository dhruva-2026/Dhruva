import React, { useState, useRef, useEffect } from 'react';
import { Compass, BookOpen, Sparkles, Image, Shield, UploadCloud, UserCheck, User, Globe, Menu, X, ChevronDown, Check, ArrowRight, ArrowLeft, LogOut, Search } from 'lucide-react';
import { GlobalSearchBar } from './GlobalSearchBar';
import { SignOutModal } from './SignOutModal';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  lang: 'en' | 'hi';
  setLang: (l: 'en' | 'hi') => void;
  currentUser: any;
  onRoleSwitch: (role: 'public' | 'researcher' | 'admin', email?: string) => void;
  canGoBack?: boolean;
  canGoForward?: boolean;
  onGoBack?: () => void;
  onGoForward?: () => void;
  onReadPaper?: (id: string) => void;
  onSelectTheme?: (theme: string) => void;
  onSelectStation?: (stationId: string, stationName?: string) => void;
  onSearchExplore?: (query: string) => void;
  onAskDhruva?: (query: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  lang,
  setLang,
  currentUser,
  onRoleSwitch,
  canGoBack,
  canGoForward,
  onGoBack,
  onGoForward,
  onReadPaper,
  onSelectTheme,
  onSelectStation,
  onSearchExplore,
  onAskDhruva
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [searchBarOpen, setSearchBarOpen] = useState(false);
  const [signOutWarningOpen, setSignOutWarningOpen] = useState(false);
  const roleDropdownRef = useRef<HTMLDivElement>(null);

  // Global Ctrl+K / Cmd+K listener to open search anywhere
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchBarOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target as Node)) {
        setRoleDropdownOpen(false);
      }
    };

    if (roleDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [roleDropdownOpen]);

  const t = {
    home: lang === 'en' ? 'Home' : 'मुख्य पृष्ठ',
    explore: lang === 'en' ? 'Explore Research' : 'अनुसंधान खोजें',
    learn: lang === 'en' ? 'Learn' : 'ज्ञान केंद्र',
    media: lang === 'en' ? 'Media' : 'मीडिया गैलरी',
    ask: lang === 'en' ? 'Ask DHRUVA' : 'ध्रुव से पूछें',
    about: lang === 'en' ? 'About' : 'परिचय',
    login: lang === 'en' ? 'Sign In / Portal' : 'लॉग इन / पोर्टल',
    researcherPortal: lang === 'en' ? 'Researcher Portal' : 'शोधकर्ता पोर्टल',
    adminPortal: lang === 'en' ? 'Admin Review' : 'प्रशासक समीक्षा',
    role: lang === 'en' ? 'Switch Mode / Role' : 'मोड / भूमिका बदलें'
  };

  const navLinks = [
    { id: 'home', label: t.home, icon: <Compass className="w-4 h-4" /> },
    { id: 'explore', label: t.explore, icon: <BookOpen className="w-4 h-4" /> },
    { id: 'learn', label: t.learn, icon: <Sparkles className="w-4 h-4" /> },
    { id: 'media', label: t.media, icon: <Image className="w-4 h-4" /> },
  ];

  const isTabActive = (linkId: string) => {
    if (linkId === 'home') {
      return currentTab === 'home';
    }
    if (linkId === 'explore') {
      return currentTab === 'explore' || currentTab === 'paper-detail' || currentTab === 'paper' || currentTab === 'research-detail';
    }
    if (linkId === 'learn') {
      return currentTab === 'learn' || currentTab === 'interactive-learning' || currentTab === 'flashcards';
    }
    if (linkId === 'media') {
      return currentTab === 'media' || currentTab === 'gallery';
    }
    if (linkId === 'about') {
      return currentTab === 'about';
    }
    if (linkId === 'ask') {
      return currentTab === 'ask';
    }
    return currentTab === linkId;
  };

  return (
    <header 
      className="sticky top-0 z-50 w-full transition-all" 
      style={{ 
        background: 'rgba(255, 255, 255, 0.95)', 
        backdropFilter: 'blur(12px)', 
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(14, 116, 144, 0.12)',
        boxShadow: '0 2px 16px rgba(15, 23, 42, 0.04)'
      }}
    >
      <div className="site-container-wide h-20 flex items-center justify-between gap-3 lg:gap-6 relative">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
          <div 
            className="flex items-center gap-3 cursor-pointer select-none shrink-0"
            onClick={() => setCurrentTab('home')}
          >
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-white shadow-xs border border-cyan-500/30 flex items-center justify-center relative overflow-hidden group shrink-0">
              <img 
                src="/images/dhruva-logo.png" 
                alt="DHRUVA Logo" 
                className="h-full w-full object-cover rounded-full group-hover:scale-105 transition-transform"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl font-black tracking-wider leading-tight dhruva-brand-text">
                DHRUVA
              </span>
              <p className="text-[10px] xl:text-[11px] text-slate-500 font-medium tracking-wide leading-none mt-0.5 hidden sm:block whitespace-nowrap">
                {lang === 'en' ? 'Polar Science Outreach & Knowledge Portal' : 'ध्रुवीय विज्ञान प्रसार एवं ज्ञान पोर्टल'}
              </p>
            </div>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-3.5 xl:gap-6 2xl:gap-7 shrink-0">
          {navLinks.map(link => {
            const isActive = isTabActive(link.id);
            return (
              <button
                key={link.id}
                onClick={() => setCurrentTab(link.id)}
                className={`relative py-1.5 text-xs xl:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${isActive
                    ? 'text-cyan-700 font-bold'
                    : 'text-slate-600 hover:text-cyan-700'
                  }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-cyan-600 rounded-full shadow-[0_0_8px_rgba(2,132,199,0.4)]" />
                )}
              </button>
            );
          })}
          <button
            onClick={() => setCurrentTab('about')}
            className={`relative py-1.5 text-xs xl:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${isTabActive('about') ? 'text-cyan-700 font-bold' : 'text-slate-600 hover:text-cyan-700'
                }`}
          >
            {lang === 'en' ? 'About' : 'परिचय'}
            {isTabActive('about') && (
              <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-cyan-600 rounded-full shadow-[0_0_8px_rgba(2,132,199,0.4)]" />
            )}
          </button>
        </nav>

        {/* Right Action Tools */}
        <div className="hidden sm:flex items-center gap-2 xl:gap-2.5 shrink-0">
          {/* Ask DHRUVA Pill Button */}
          <button
            onClick={() => setCurrentTab('ask')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0 whitespace-nowrap"
            style={{
              background: currentTab === 'ask' ? '#E0F2FE' : 'rgba(2, 132, 199, 0.08)',
              border: `1px solid ${currentTab === 'ask' ? '#0284C7' : 'rgba(2, 132, 199, 0.28)'}`,
              color: '#0284C7',
            }}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
            <span>Ask <span className="dhruva-brand-text">DHRUVA</span></span>
          </button>

          {/* Quick Search Button */}
          <button
            type="button"
            onClick={() => setSearchBarOpen((prev) => !prev)}
            className="w-8 h-8 rounded-full bg-slate-50 hover:bg-cyan-50 border border-slate-200 hover:border-cyan-400 flex items-center justify-center text-slate-600 hover:text-cyan-700 transition-all shadow-xs shrink-0 cursor-pointer group"
            title={lang === 'en' ? 'Search polar research (Ctrl+K)' : 'ध्रुवीय अनुसंधान खोजें (Ctrl+K)'}
            aria-label="Search polar research"
          >
            <span className="sr-only">Search</span>
            <Search className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
          </button>

          {/* Bilingual Language Pill Toggle */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-full px-2.5 py-1 text-xs font-semibold text-slate-600 shadow-xs shrink-0 whitespace-nowrap">
            <button
              onClick={() => setLang('en')}
              className={`transition-colors font-bold cursor-pointer ${lang === 'en' ? 'text-cyan-700' : 'text-slate-400 hover:text-slate-700'}`}
            >
              EN
            </button>
            <span className="mx-1 text-slate-300">|</span>
            <button
              onClick={() => setLang('hi')}
              className={`transition-colors font-bold cursor-pointer ${lang === 'hi' ? 'text-cyan-700' : 'text-slate-400 hover:text-slate-700'}`}
            >
              हिंदी
            </button>
          </div>

          {/* Role Switcher Split Pill */}
          <div className="relative shrink-0" ref={roleDropdownRef}>
            <div
              className="flex items-center rounded-full text-xs font-semibold border transition-all shadow-xs overflow-hidden"
              style={{
                background: currentUser?.role === 'admin' 
                  ? '#FFE4E6' 
                  : currentUser?.role === 'researcher' 
                  ? '#E0F2FE' 
                  : '#F1F5F9',
                borderColor: currentUser?.role === 'admin'
                  ? '#FDA4AF'
                  : currentUser?.role === 'researcher'
                  ? '#7DD3FC'
                  : '#CBD5E1',
                color: currentUser?.role === 'admin'
                  ? '#BE123C'
                  : currentUser?.role === 'researcher'
                  ? '#0369A1'
                  : '#0F172A'
              }}
            >
              {/* Main Role Button: Clicking text/icon navigates directly to Dashboard (or opens menu for public) */}
              <button
                type="button"
                onClick={() => {
                  if (currentUser?.role === 'researcher') {
                    setCurrentTab('researcher-dashboard');
                  } else if (currentUser?.role === 'admin') {
                    setCurrentTab('admin-dashboard');
                  } else {
                    setRoleDropdownOpen(!roleDropdownOpen);
                  }
                }}
                title={
                  currentUser?.role === 'researcher' 
                    ? 'Visit Researcher Dashboard' 
                    : currentUser?.role === 'admin' 
                    ? 'Visit Admin Dashboard' 
                    : 'Switch Portal or Role'
                }
                className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 cursor-pointer hover:opacity-80 transition-opacity whitespace-nowrap"
              >
                {currentUser?.role === 'admin' ? (
                  <Shield className="w-3.5 h-3.5 shrink-0" />
                ) : currentUser?.role === 'researcher' ? (
                  <UserCheck className="w-3.5 h-3.5 shrink-0" />
                ) : null}
                <span className="font-semibold">
                  {currentUser?.role === 'admin' 
                    ? 'Admin' 
                    : currentUser?.role === 'researcher' 
                    ? 'Researcher' 
                    : 'Public Portal'}
                </span>
              </button>

              {/* Vertical divider */}
              <div 
                className="h-3.5 w-[1px] opacity-35" 
                style={{
                  backgroundColor: currentUser?.role === 'admin'
                    ? '#BE123C'
                    : currentUser?.role === 'researcher'
                    ? '#0369A1'
                    : '#475569'
                }}
              />

              {/* Arrow Button: Clicking arrow toggles the pop-up switcher menu */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setRoleDropdownOpen(!roleDropdownOpen);
                }}
                title="Switch Roles or Portals"
                className="pl-1.5 pr-2.5 py-1.5 cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center"
              >
                <ChevronDown className={`w-3.5 h-3.5 opacity-80 shrink-0 transition-transform duration-200 ${roleDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {roleDropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-64 rounded-xl border p-2 shadow-xl z-50 animate-fadeIn"
                style={{ background: '#FFFFFF', borderColor: 'rgba(14, 116, 144, 0.2)' }}
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-700 px-3 py-1.5 border-b border-slate-100 flex items-center justify-between">
                  <span>Portal & Role Switcher</span>
                  <span className="text-[9px] font-normal text-slate-500">Switch view</span>
                </div>

                {/* Option 1: Public User */}
                <button
                  type="button"
                  onClick={() => {
                    onRoleSwitch('public');
                    setRoleDropdownOpen(false);
                    setCurrentTab('home');
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-slate-50 flex items-center justify-between mt-1 cursor-pointer transition-colors ${
                    (!currentUser || currentUser?.role === 'public') ? 'bg-cyan-50/60 font-semibold' : 'text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-cyan-600" />
                    <div>
                      <div className="font-semibold text-slate-900">Public User</div>
                      <div className="text-[10px] text-slate-500">Search, Read & Ask <span className="dhruva-brand-text">DHRUVA</span></div>
                    </div>
                  </div>
                  {(!currentUser || currentUser?.role === 'public') && <Check className="w-4 h-4 text-cyan-600" />}
                </button>

                {/* Option 2: Researcher (GUARANTEED TO WORK) */}
                <button
                  type="button"
                  onClick={() => {
                    onRoleSwitch('researcher', 'dr.ananya@ncaor.gov.in');
                    setRoleDropdownOpen(false);
                    setCurrentTab('researcher-dashboard');
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-slate-50 flex items-center justify-between cursor-pointer transition-colors ${
                    currentUser?.role === 'researcher' ? 'bg-sky-50 font-semibold' : 'text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <UploadCloud className="w-4 h-4 text-sky-600" />
                    <div>
                      <div className="font-semibold text-slate-900">Researcher</div>
                      <div className="text-[10px] text-slate-500">Upload paper & Track review</div>
                    </div>
                  </div>
                  {currentUser?.role === 'researcher' && <Check className="w-4 h-4 text-sky-600" />}
                </button>

                {/* Option 3: Admin */}
                <button
                  type="button"
                  onClick={() => {
                    onRoleSwitch('admin', 'admin@dhruva.gov.in');
                    setRoleDropdownOpen(false);
                    setCurrentTab('admin-dashboard');
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-slate-50 flex items-center justify-between cursor-pointer transition-colors ${
                    currentUser?.role === 'admin' ? 'bg-rose-50 font-semibold' : 'text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-rose-600" />
                    <div>
                      <div className="font-semibold text-slate-900">Admin</div>
                      <div className="text-[10px] text-slate-500">Verify AI claims & Publish</div>
                    </div>
                  </div>
                  {currentUser?.role === 'admin' && <Check className="w-4 h-4 text-rose-600" />}
                </button>

                <div className="border-t border-slate-100 mt-1 pt-1 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setRoleDropdownOpen(false);
                      setCurrentTab('account');
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold text-cyan-700 hover:bg-cyan-50 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-cyan-600" />
                    <span>My Account & Profile →</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRoleDropdownOpen(false);
                      setCurrentTab('login');
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <span>Sign In with another account →</span>
                  </button>

                  {currentUser && currentUser?.role !== 'public' && (
                    <button
                      type="button"
                      onClick={() => {
                        setRoleDropdownOpen(false);
                        setSignOutWarningOpen(true);
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-500" />
                      <span>Sign Out</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Dedicated Account & Dashboard / Sign In buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Account / Profile Icon Button */}
            <button
              type="button"
              onClick={() => setCurrentTab('account')}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-xs cursor-pointer shrink-0 ${
                currentTab === 'account'
                  ? 'bg-cyan-700 text-white shadow-xs ring-2 ring-cyan-500/30'
                  : 'bg-slate-50 hover:bg-cyan-50 text-slate-600 hover:text-cyan-700 border border-slate-200 hover:border-cyan-400'
              }`}
              title={lang === 'en' ? 'My Account & Profile' : 'मेरा खाता एवं प्रोफ़ाइल'}
              aria-label="My Account"
            >
              <User className="w-4 h-4" />
            </button>

            {currentUser && currentUser?.role !== 'public' ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    if (currentUser?.role === 'researcher') setCurrentTab('researcher-dashboard');
                    else if (currentUser?.role === 'admin') setCurrentTab('admin-dashboard');
                    else setCurrentTab('login');
                  }}
                  className={`text-xs px-3.5 py-1.5 rounded-full font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    currentTab === 'researcher-dashboard' || currentTab === 'admin-dashboard'
                      ? 'bg-cyan-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                  }`}
                >
                  Dashboard
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setCurrentTab('login')}
                className={`text-xs px-3.5 py-1.5 rounded-full font-semibold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                  currentTab === 'login'
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                }`}
              >
                Sign In
              </button>
            )}
          </div>
        </div>

        {/* Mobile menu trigger & search button */}
        <div className="lg:hidden flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSearchBarOpen((prev) => !prev)}
            className="w-8 h-8 rounded-full bg-slate-50 hover:bg-cyan-50 border border-slate-200 hover:border-cyan-400 flex items-center justify-center text-slate-600 hover:text-cyan-700 transition-all shadow-xs cursor-pointer"
            title={lang === 'en' ? 'Search polar research' : 'ध्रुवीय अनुसंधान खोजें'}
            aria-label="Open search"
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-700 hover:text-cyan-700"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer (Responsive & Scrollable for all phone heights) */}
      {mobileMenuOpen && (
        <div className="lg:hidden px-4 pt-2 pb-6 border-t border-slate-100 bg-white/95 backdrop-blur-md shadow-xl space-y-3 max-h-[calc(100vh-80px)] overflow-y-auto no-scrollbar">
          {/* Quick Search Bar Trigger in Drawer */}
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              setSearchBarOpen(true);
            }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-cyan-50 border border-slate-200 hover:border-cyan-300 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
          >
            <Search className="w-4 h-4 text-cyan-600 shrink-0" />
            <span>{lang === 'en' ? 'Search polar research...' : 'ध्रुवीय अनुसंधान खोजें...'}</span>
          </button>

          <div className="flex flex-col gap-1.5">
            {navLinks.map(link => {
              const isActive = isTabActive(link.id);
              return (
                <button
                  key={link.id}
                  onClick={() => {
                    setCurrentTab(link.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${isActive ? 'bg-cyan-50 text-cyan-700 font-bold border border-cyan-200 shadow-xs' : 'text-slate-700 hover:bg-slate-50 border border-transparent'
                    }`}
                >
                  <span className={isActive ? 'text-cyan-600' : 'text-slate-500'}>{link.icon}</span>
                  <span>{link.label}</span>
                </button>
              );
            })}
            <button
              onClick={() => {
                setCurrentTab('account');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${isTabActive('account') ? 'bg-cyan-50 text-cyan-700 font-bold border border-cyan-200 shadow-xs' : 'text-slate-700 hover:bg-slate-50 border border-transparent'
                }`}
            >
              <User className="w-4 h-4 text-cyan-600" />
              <span>{lang === 'en' ? 'My Account' : 'मेरा खाता'}</span>
            </button>
            <button
              onClick={() => {
                setCurrentTab('about');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${isTabActive('about') ? 'bg-cyan-50 text-cyan-700 font-bold border border-cyan-200 shadow-xs' : 'text-slate-700 hover:bg-slate-50 border border-transparent'
                }`}
            >
              <Compass className="w-4 h-4 text-slate-500" />
              <span>{lang === 'en' ? 'About' : 'परिचय'}</span>
            </button>
            <button
              onClick={() => {
                setCurrentTab('ask');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${isTabActive('ask') ? 'bg-sky-50 text-sky-700 font-bold border border-sky-300 shadow-xs' : 'text-slate-700 hover:bg-slate-50 border border-transparent'
                }`}
            >
              <Sparkles className="w-4 h-4 text-sky-600" />
              <span>Ask <span className="dhruva-brand-text">DHRUVA</span></span>
            </button>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setLang('en')}
                className={`px-3 py-1 text-xs font-bold rounded ${lang === 'en' ? 'bg-cyan-600 text-white' : 'text-slate-600 bg-slate-100'}`}
              >
                EN
              </button>
              <button
                onClick={() => setLang('hi')}
                className={`px-3 py-1 text-xs font-bold rounded ${lang === 'hi' ? 'bg-cyan-600 text-white' : 'text-slate-600 bg-slate-100'}`}
              >
                हिंदी
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  onRoleSwitch('researcher', 'dr.ananya@ncaor.gov.in');
                  setCurrentTab('researcher-dashboard');
                  setMobileMenuOpen(false);
                }}
                className="btn-cyan text-xs py-1 px-2.5"
              >
                Researcher
              </button>
              <button
                type="button"
                onClick={() => {
                  onRoleSwitch('admin', 'admin@dhruva.gov.in');
                  setCurrentTab('admin-dashboard');
                  setMobileMenuOpen(false);
                }}
                className="btn-danger text-xs py-1 px-2.5"
              >
                Admin
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-2">
            <button
              onClick={() => {
                setCurrentTab('login');
                setMobileMenuOpen(false);
              }}
              className="w-full btn-primary h-[40px] text-xs font-semibold flex items-center justify-center gap-2 rounded-xl"
            >
              <span>{currentUser && currentUser.role !== 'public' ? 'Manage Account / Portal' : <>Sign In to <span className="dhruva-brand-text">DHRUVA</span> Portal</>}</span>
            </button>

            {currentUser && currentUser.role !== 'public' && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setSignOutWarningOpen(true);
                }}
                className="w-full h-[38px] text-xs font-semibold flex items-center justify-center gap-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Clean Global Search Dropdown */}
      <GlobalSearchBar
        isOpen={searchBarOpen}
        onClose={() => setSearchBarOpen(false)}
        onReadPaper={(id) => {
          setSearchBarOpen(false);
          if (onReadPaper) {
            onReadPaper(id);
          } else {
            setCurrentTab('paper-detail');
          }
        }}
        onSearchExplore={(q) => {
          setSearchBarOpen(false);
          if (onSearchExplore) {
            onSearchExplore(q);
          } else {
            setCurrentTab('explore');
          }
        }}
        lang={lang}
      />

      {/* Sign Out Confirmation Warning Dialog */}
      <SignOutModal
        isOpen={signOutWarningOpen}
        onClose={() => setSignOutWarningOpen(false)}
        onConfirm={() => {
          onRoleSwitch('public');
          setCurrentTab('home');
        }}
        userName={currentUser?.name}
        userRole={currentUser?.role}
        lang={lang}
      />
    </header>
  );
};
