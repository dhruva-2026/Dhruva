import React, { useState } from 'react';
import { Compass, BookOpen, Sparkles, Image, Shield, UploadCloud, UserCheck, Globe, Menu, X, ChevronDown, Check, ArrowRight } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  lang: 'en' | 'hi';
  setLang: (l: 'en' | 'hi') => void;
  currentUser: any;
  onRoleSwitch: (role: 'public' | 'researcher' | 'admin', email?: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  lang,
  setLang,
  currentUser,
  onRoleSwitch
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

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
    { id: 'ask', label: t.ask, icon: <Sparkles className="w-4 h-4 text-cyan-600" /> }
  ];

  return (
    <header 
      className="sticky top-0 z-50 w-full transition-all" 
      style={{ 
        background: 'rgba(255, 255, 255, 0.88)', 
        backdropFilter: 'blur(16px)', 
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(14, 116, 144, 0.12)',
        boxShadow: '0 2px 16px rgba(15, 23, 42, 0.04)'
      }}
    >
      <div className="site-container-wide h-20 flex items-center justify-between">
        
        {/* Brand Logo with Uploaded Logo Image */}
        <div 
          className="flex items-center gap-3.5 cursor-pointer select-none"
          onClick={() => setCurrentTab('home')}
        >
          <div className="h-11 w-11 rounded-full bg-white p-1 shadow-sm border border-cyan-500/30 flex items-center justify-center relative overflow-hidden group flex-shrink-0">
            <img 
              src="/images/dhruva-logo.png" 
              alt="DHRUVA Logo" 
              className="h-full w-full object-contain group-hover:scale-105 transition-transform"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-wider text-slate-900" style={{ fontFamily: 'var(--font-heading)' }}>
                DHRUVA
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium tracking-wide">
              {lang === 'en' ? 'Polar Science Outreach & Knowledge Portal' : 'ध्रुवीय विज्ञान प्रसार एवं ज्ञान पोर्टल'}
            </p>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-7">
          {navLinks.map(link => (
            <button
              key={link.id}
              onClick={() => setCurrentTab(link.id)}
              className={`relative py-2 text-sm font-semibold transition-colors ${currentTab === link.id
                  ? 'text-cyan-700 font-bold'
                  : 'text-slate-600 hover:text-cyan-700'
                }`}
            >
              {link.label}
              {currentTab === link.id && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-cyan-600 rounded-full shadow-[0_0_8px_rgba(2,132,199,0.4)]" />
              )}
            </button>
          ))}
          <button
            onClick={() => setCurrentTab('about')}
            className={`relative py-2 text-sm font-semibold transition-colors ${currentTab === 'about' ? 'text-cyan-700 font-bold' : 'text-slate-600 hover:text-cyan-700'
              }`}
          >
            {lang === 'en' ? 'About' : 'परिचय'}
            {currentTab === 'about' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-cyan-600 rounded-full shadow-[0_0_8px_rgba(2,132,199,0.4)]" />
            )}
          </button>
        </nav>

        {/* Right Action Tools */}
        <div className="hidden sm:flex items-center gap-3">
          {/* Quick Search Button */}
          <button
            onClick={() => setCurrentTab('explore')}
            className="w-9 h-9 rounded-full bg-slate-50 hover:bg-cyan-50 border border-slate-200 hover:border-cyan-400 flex items-center justify-center text-slate-600 hover:text-cyan-700 transition-all shadow-sm"
            title="Search polar research"
          >
            <span className="sr-only">Search</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          {/* Bilingual Language Pill Toggle */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-full px-2.5 py-1 text-xs font-semibold text-slate-600 shadow-sm">
            <button
              onClick={() => setLang('en')}
              className={`transition-colors font-bold ${lang === 'en' ? 'text-cyan-700' : 'text-slate-400 hover:text-slate-700'
                }`}
            >
              EN
            </button>
            <span className="mx-1.5 text-slate-300">|</span>
            <button
              onClick={() => setLang('hi')}
              className={`transition-colors font-bold ${lang === 'hi' ? 'text-cyan-700' : 'text-slate-400 hover:text-slate-700'
                }`}
            >
              हिंदी
            </button>
          </div>

          {/* Role Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all shadow-sm cursor-pointer"
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
              {currentUser?.role === 'admin' ? (
                <Shield className="w-3.5 h-3.5" />
              ) : currentUser?.role === 'researcher' ? (
                <UserCheck className="w-3.5 h-3.5" />
              ) : null}
              <span>
                {currentUser?.role === 'admin' 
                  ? 'Admin Reviewer' 
                  : currentUser?.role === 'researcher' 
                  ? 'Dr. Ananya (Researcher)' 
                  : 'Public Portal'}
              </span>
              {currentUser?.role === 'public' || !currentUser ? (
                <ArrowRight className="w-3.5 h-3.5 opacity-80 ml-0.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              )}
            </button>

            {roleDropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-64 rounded-xl border p-2 shadow-xl z-50"
                style={{ background: '#FFFFFF', borderColor: 'rgba(14, 116, 144, 0.2)' }}
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-700 px-3 py-1.5 border-b border-slate-100">
                  Portal & Role Switcher
                </div>

                <button
                  onClick={() => {
                    onRoleSwitch('public');
                    setRoleDropdownOpen(false);
                    setCurrentTab('home');
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-slate-50 flex items-center justify-between text-slate-800 mt-1 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-cyan-600" />
                    <div>
                      <div className="font-semibold text-slate-900">Public User</div>
                      <div className="text-[10px] text-slate-500">Search, Read & Ask DHRUVA</div>
                    </div>
                  </div>
                  {(!currentUser || currentUser?.role === 'public') && <Check className="w-4 h-4 text-cyan-600" />}
                </button>

                <button
                  onClick={() => {
                    onRoleSwitch('researcher', 'dr.ananya@ncaor.gov.in');
                    setRoleDropdownOpen(false);
                    setCurrentTab('researcher-dashboard');
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-slate-50 flex items-center justify-between text-slate-800 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <UploadCloud className="w-4 h-4 text-sky-600" />
                    <div>
                      <div className="font-semibold text-slate-900">Dr. Ananya (Researcher)</div>
                      <div className="text-[10px] text-slate-500">Upload paper & Track review</div>
                    </div>
                  </div>
                  {currentUser?.role === 'researcher' && <Check className="w-4 h-4 text-sky-600" />}
                </button>

                <button
                  onClick={() => {
                    onRoleSwitch('admin', 'admin@dhruva.gov.in');
                    setRoleDropdownOpen(false);
                    setCurrentTab('admin-verification');
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-slate-50 flex items-center justify-between text-slate-800 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-rose-600" />
                    <div>
                      <div className="font-semibold text-slate-900">Dr. Swaminathan (Admin)</div>
                      <div className="text-[10px] text-slate-500">Verify AI claims & Publish</div>
                    </div>
                  </div>
                  {currentUser?.role === 'admin' && <Check className="w-4 h-4 text-rose-600" />}
                </button>

                <div className="border-t border-slate-100 mt-1 pt-1">
                  <button
                    onClick={() => {
                      setRoleDropdownOpen(false);
                      setCurrentTab('login');
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold text-cyan-700 hover:bg-cyan-50 flex items-center gap-2 cursor-pointer"
                  >
                    <span>Full Authentication / Sign In →</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Dedicated Sign In / Portal button */}
          <button
            onClick={() => setCurrentTab('login')}
            className={`text-xs px-3.5 py-1.5 rounded-full font-semibold transition-all cursor-pointer ${currentTab === 'login'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
          >
            {currentUser && currentUser.role !== 'public' ? 'Portal' : 'Sign In'}
          </button>

          {/* Quick Portal Jump Button depending on role */}
          {currentUser?.role === 'researcher' && (
            <button
              onClick={() => setCurrentTab('researcher-dashboard')}
              className="btn-cyan text-xs py-1.5 px-3 cursor-pointer"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>My Repository</span>
            </button>
          )}

          {currentUser?.role === 'admin' && (
            <button
              onClick={() => setCurrentTab('admin-verification')}
              className="btn-danger text-xs py-1.5 px-3 cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Review</span>
            </button>
          )}
        </div>

        {/* Mobile menu trigger */}
        <div className="lg:hidden flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-700 hover:text-cyan-700"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden px-4 pt-2 pb-6 border-t border-slate-100 bg-white/95 shadow-xl space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {navLinks.map(link => (
              <button
                key={link.id}
                onClick={() => {
                  setCurrentTab(link.id);
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold ${currentTab === link.id ? 'bg-cyan-50 text-cyan-700' : 'text-slate-700 hover:bg-slate-50'
                  }`}
              >
                {link.icon}
                {link.label}
              </button>
            ))}
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
                onClick={() => {
                  onRoleSwitch('admin', 'admin@dhruva.gov.in');
                  setCurrentTab('admin-verification');
                  setMobileMenuOpen(false);
                }}
                className="btn-danger text-xs py-1 px-2.5"
              >
                Admin
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => {
                setCurrentTab('login');
                setMobileMenuOpen(false);
              }}
              className="w-full btn-primary h-[40px] text-xs font-semibold flex items-center justify-center gap-2 rounded-xl"
            >
              <span>{currentUser && currentUser.role !== 'public' ? 'Manage Account / Portal' : 'Sign In to DHRUVA Portal'}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
