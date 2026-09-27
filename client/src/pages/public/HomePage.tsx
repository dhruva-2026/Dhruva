import React from 'react';
import { 
  BookOpen, Sparkles, ArrowRight, Activity, Mountain, Globe,
  Waves, Wind, Snowflake, Leaf, Calendar, Eye, MapPin,
  FileCheck2, GraduationCap, Users, UserCheck, FileSearch, ShieldCheck
} from 'lucide-react';

interface HomePageProps {
  setCurrentTab: (tab: string) => void;
  setSelectedPaperId: (id: string) => void;
  onSelectTheme?: (theme: string) => void;
  lang: 'en' | 'hi';
}

const THEME_CATEGORIES = [
  { id: 'climate-science',     name: 'Climate Science',     hindiName: 'जलवायु विज्ञान',       icon: <Activity className="w-4 h-4" />,  sub: 'Understanding a changing planet',  img: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&q=60' },
  { id: 'glaciology',          name: 'Glaciology',          hindiName: 'हिमनद विज्ञान',         icon: <Snowflake className="w-4 h-4" />, sub: 'Theory in the ice',                 img: 'https://images.unsplash.com/photo-1551582045-6ec9c11d8697?w=400&q=60' },
  { id: 'oceanography',        name: 'Oceanography',        hindiName: 'समुद्र विज्ञान',        icon: <Waves className="w-4 h-4" />,     sub: 'Oceans that Connect',               img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=60' },
  { id: 'atmospheric-science', name: 'Atmospheric Science', hindiName: 'वायुमंडलीय विज्ञान',   icon: <Wind className="w-4 h-4" />,      sub: 'Climate connections',               img: 'https://images.unsplash.com/photo-1530893609608-32a9af3aa95c?w=400&q=60' },
  { id: 'polar-biology',       name: 'Polar Biology',       hindiName: 'ध्रुवीय जीव विज्ञान',  icon: <Leaf className="w-4 h-4" />,      sub: 'Unique polar environments',         img: 'https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=400&q=60' },
  { id: 'geology',             name: 'Geology',             hindiName: 'भूविज्ञान',             icon: <Mountain className="w-4 h-4" />, sub: "Earth's frozen history",            img: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&q=60' },
  { id: 'environmental-science',name:'Environmental Science',hindiName: 'पर्यावरण विज्ञान',    icon: <Globe className="w-4 h-4" />,     sub: 'People, policy and a sustainable future', img: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&q=60' },
];

export const HomePage: React.FC<HomePageProps> = ({ setCurrentTab, setSelectedPaperId, onSelectTheme, lang }) => {
  const handleThemeClick = (themeName: string) => {
    if (onSelectTheme) onSelectTheme(themeName);
    else setCurrentTab('explore');
  };

  const featuredCardsData = [
    { id: 'paper-001', title: 'Seasonal Variability of Antarctic Sea Ice Extent in the Weddell Sea Sector', region: 'ANTARCTIC', theme: 'GLACIOLOGY',     year: '2024', views: '1.4K', location: 'Weddell Sea', img: 'https://images.unsplash.com/photo-1551582045-6ec9c11d8697?w=600&q=70' },
    { id: 'paper-002', title: 'Permafrost Active-Layer Deepening and Methanogenesis in Svalbard',           region: 'ARCTIC',    theme: 'CLIMATE SCIENCE', year: '2024', views: '1.1K', location: 'Svalbard',    img: 'https://images.unsplash.com/photo-1530893609608-32a9af3aa95c?w=600&q=70' },
    { id: 'paper-003', title: 'Phytoplankton Bloom Dynamics and Primary Productivity in Prydz Bay',         region: 'ANTARCTIC', theme: 'POLAR BIOLOGY',  year: '2023', views: '940',  location: 'Prydz Bay',  img: 'https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=600&q=70' },
  ];

  const cardBase: React.CSSProperties = {
    borderRadius: '14px',
    border: '1px solid #E2E8F0',
    background: '#FFFFFF',
    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
    overflow: 'hidden',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
  };

  return (
    <div style={{ width: '100%', overflowX: 'hidden' }}>

      {/* ═══════════════════════════════════════════ */}
      {/* 1. HERO                                     */}
      {/* ═══════════════════════════════════════════ */}
      <section 
        style={{ 
          width: '100%', 
          minHeight: '70vh', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          paddingTop: '36px', 
          paddingBottom: '44px' 
        }}
      >
        <div className="site-container-wide" style={{ margin: 'auto' }}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            <div className="lg:col-span-7 xl:col-span-8 max-w-2xl">
              <div className="section-eyebrow" style={{ marginBottom: '10px' }}>
                <span className="eyebrow-dot" />
                <span>{lang === 'en' ? 'KNOWLEDGE FOR A BRIGHTER TOMORROW' : 'उज्ज्वल कल के लिए ज्ञान'}</span>
              </div>
              <h1 className="text-3xl sm:text-5xl lg:text-[60px] font-extrabold tracking-tight text-slate-900 leading-[1.1] mb-4 sm:mb-5">
                {lang === 'en' ? (<>Discover India's<br /><span className="heading-gradient">Polar Science</span></>) : (<>भारत के<br /><span className="heading-gradient">ध्रुवीय विज्ञान</span></>)}
              </h1>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal mb-6 sm:mb-8 max-w-xl">
                {lang === 'en' ? 'Explore research, discoveries and expedition knowledge from the Arctic and Antarctic, AI-powered summaries, interactive learning and a trusted repository for a more informed world.' : 'आर्कटिक और अंटार्कटिक से अनुसंधान, खोजों और अभियान ज्ञान का अन्वेषण करें।'}
              </p>
              <div className="flex flex-wrap items-center gap-3.5 sm:gap-4">
                {/* Explore Research */}
                <button
                  onClick={() => setCurrentTab('explore')}
                  style={{
                    height: '46px',
                    paddingLeft: '22px',
                    paddingRight: '22px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                    color: '#FFFFFF',
                    fontSize: '14px',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)',
                    transition: 'all 0.2s ease',
                    fontFamily: 'var(--font-heading)',
                    letterSpacing: '-0.01em',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, #0369A1 0%, #0284C7 100%)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 18px rgba(2, 132, 199, 0.4)';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 14px rgba(2, 132, 199, 0.3)';
                    (e.currentTarget as HTMLElement).style.transform = 'none';
                  }}
                >
                  <BookOpen style={{ width: '16px', height: '16px', strokeWidth: 2.2, flexShrink: 0 }} />
                  <span>{lang === 'en' ? 'Explore Research' : 'अनुसंधान खोजें'}</span>
                  <ArrowRight style={{ width: '15px', height: '15px', flexShrink: 0 }} />
                </button>

                {/* Ask DHRUVA */}
                <button
                  onClick={() => setCurrentTab('ask')}
                  style={{
                    height: '46px',
                    paddingLeft: '20px',
                    paddingRight: '20px',
                    borderRadius: '12px',
                    border: '1.5px solid rgba(2, 132, 199, 0.35)',
                    background: '#FFFFFF',
                    color: '#0F172A',
                    fontSize: '14px',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)',
                    transition: 'all 0.2s ease',
                    fontFamily: 'var(--font-heading)',
                    letterSpacing: '-0.01em',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = '#0284C7';
                    (e.currentTarget as HTMLElement).style.color = '#0284C7';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(2, 132, 199, 0.35)';
                    (e.currentTarget as HTMLElement).style.color = '#0F172A';
                    (e.currentTarget as HTMLElement).style.transform = 'none';
                  }}
                >
                  <Sparkles style={{ width: '15px', height: '15px', flexShrink: 0, color: '#0284C7' }} />
                  <span>{lang === 'en' ? <>Ask <span className="dhruva-brand-text">DHRUVA</span></> : 'ध्रुव से पूछें'}</span>
                </button>
              </div>
            </div>
            <div className="lg:col-span-5 xl:col-span-4 hidden lg:flex flex-col justify-center">
              <div className="px-4 py-2 flex flex-col gap-0.5">
                <div 
                  style={{ 
                    fontFamily: 'var(--font-heading)', 
                    fontSize: 'clamp(1.9rem, 2.8vw, 2.6rem)', 
                    fontWeight: 500, 
                    color: '#0F172A', 
                    lineHeight: 1.15, 
                    letterSpacing: '-0.02em' 
                  }}
                >
                  {lang === 'en' ? 'Two poles.' : 'दो ध्रुव।'}
                </div>
                <div 
                  style={{ 
                    fontFamily: 'var(--font-heading)', 
                    fontSize: 'clamp(2.1rem, 3.2vw, 3rem)', 
                    fontWeight: 800, 
                    color: '#0062D2', 
                    lineHeight: 1.15, 
                    letterSpacing: '-0.025em' 
                  }}
                >
                  {lang === 'en' ? 'One planet.' : 'एक पृथ्वी।'}
                </div>
                <div 
                  style={{ 
                    fontFamily: 'var(--font-heading)', 
                    fontSize: 'clamp(2.1rem, 3.2vw, 3rem)', 
                    fontWeight: 800, 
                    background: 'linear-gradient(90deg, #0062D2 0%, #1D4ED8 38%, #4F46E5 72%, #6366F1 100%)', 
                    WebkitBackgroundClip: 'text', 
                    WebkitTextFillColor: 'transparent', 
                    display: 'inline-block', 
                    lineHeight: 1.15, 
                    letterSpacing: '-0.025em' 
                  }}
                >
                  {lang === 'en' ? 'A shared future.' : 'एक साझा भविष्य।'}
                </div>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* 4 PLATFORM OVERVIEW PILLARS (Unboxed, Close, One Line)         */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <div className="mt-7 sm:mt-9 pt-5 sm:pt-6 border-t border-slate-200/60 overflow-x-auto no-scrollbar select-none">
            <div className="inline-flex items-center gap-3.5 sm:gap-5 lg:gap-6 px-0.5 shrink-0">
              
              {/* 1. Peer-reviewed Research */}
              <div className="flex items-center gap-2.5 shrink-0">
                <div 
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%)',
                    border: '1px solid rgba(2, 132, 199, 0.25)',
                    boxShadow: '0 2px 6px rgba(2, 132, 199, 0.12)'
                  }}
                >
                  <FileSearch className="w-4 h-4 sm:w-5 sm:h-5 text-[#0284C7]" strokeWidth={2.3} />
                </div>
                <div 
                  className="text-xs sm:text-[12.5px] font-bold text-slate-800 leading-tight whitespace-nowrap" 
                  style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.01em' }}
                >
                  {lang === 'en' ? (
                    <>
                      <div>Peer-reviewed</div>
                      <div className="text-slate-600 font-medium">Research</div>
                    </>
                  ) : (
                    <>
                      <div>सहकर्मी-समीक्षित</div>
                      <div className="text-slate-600 font-medium">अनुसंधान</div>
                    </>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="w-[1px] h-7 bg-slate-200/90 shrink-0" />

              {/* 2. Verified Information */}
              <div className="flex items-center gap-2.5 shrink-0">
                <div 
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%)',
                    border: '1px solid rgba(2, 132, 199, 0.25)',
                    boxShadow: '0 2px 6px rgba(2, 132, 199, 0.12)'
                  }}
                >
                  <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-[#0284C7]" strokeWidth={2.3} />
                </div>
                <div 
                  className="text-xs sm:text-[12.5px] font-bold text-slate-800 leading-tight whitespace-nowrap" 
                  style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.01em' }}
                >
                  {lang === 'en' ? (
                    <>
                      <div>Verified</div>
                      <div className="text-slate-600 font-medium">Information</div>
                    </>
                  ) : (
                    <>
                      <div>सत्यापित</div>
                      <div className="text-slate-600 font-medium">जानकारी</div>
                    </>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="w-[1px] h-7 bg-slate-200/90 shrink-0" />

              {/* 3. Interactive Learning */}
              <div className="flex items-center gap-2.5 shrink-0">
                <div 
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%)',
                    border: '1px solid rgba(2, 132, 199, 0.25)',
                    boxShadow: '0 2px 6px rgba(2, 132, 199, 0.12)'
                  }}
                >
                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-[#0284C7]" strokeWidth={2.3} />
                </div>
                <div 
                  className="text-xs sm:text-[12.5px] font-bold text-slate-800 leading-tight whitespace-nowrap" 
                  style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.01em' }}
                >
                  {lang === 'en' ? (
                    <>
                      <div>Interactive</div>
                      <div className="text-slate-600 font-medium">Learning</div>
                    </>
                  ) : (
                    <>
                      <div>संवादात्मक</div>
                      <div className="text-slate-600 font-medium">शिक्षण</div>
                    </>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="w-[1px] h-7 bg-slate-200/90 shrink-0" />

              {/* 4. For Students, Researchers & Citizens */}
              <div className="flex items-center gap-2.5 shrink-0">
                <div 
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%)',
                    border: '1px solid rgba(2, 132, 199, 0.25)',
                    boxShadow: '0 2px 6px rgba(2, 132, 199, 0.12)'
                  }}
                >
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-[#0284C7]" strokeWidth={2.3} />
                </div>
                <div 
                  className="text-xs sm:text-[12.5px] font-bold text-slate-800 leading-tight whitespace-nowrap" 
                  style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.01em' }}
                >
                  {lang === 'en' ? (
                    <>
                      <div>For Students,</div>
                      <div className="text-slate-600 font-medium">Researchers & Citizens</div>
                    </>
                  ) : (
                    <>
                      <div>छात्रों, शोधकर्ताओं व</div>
                      <div className="text-slate-600 font-medium">नागरिकों के लिए</div>
                    </>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* 2. EXPLORE KNOWLEDGE BY THEME              */}
      {/* ═══════════════════════════════════════════ */}
      <section 
        style={{ 
          width: '100%', 
          paddingTop: '38px', 
          paddingBottom: '42px', 
          borderTop: '1px solid #F1F5F9' 
        }}
      >
        <div className="site-container-wide">

          {/* Balanced Header row */}
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'flex-end', 
              justifyContent: 'space-between', 
              marginBottom: '20px', 
              gap: '18px', 
              flexWrap: 'wrap' 
            }}
          >
            <div>
              <div className="section-eyebrow" style={{ marginBottom: '6px' }}>
                <span className="eyebrow-dot" />
                <span>{lang === 'en' ? 'EXPLORE BY THEME' : 'विषय अनुसार अन्वेषण'}</span>
              </div>
              <h2 
                style={{ 
                  fontSize: 'clamp(20px, 2.2vw, 26px)', 
                  fontWeight: 800, 
                  color: '#0F172A', 
                  letterSpacing: '-0.02em', 
                  lineHeight: 1.25, 
                  marginBottom: '4px', 
                  fontFamily: 'var(--font-heading)' 
                }}
              >
                {lang === 'en' ? 'Explore Knowledge by Theme' : 'विषय अनुसार ज्ञान का अन्वेषण करें'}
              </h2>
              <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, maxWidth: '640px', margin: 0 }}>
                {lang === 'en' ? 'Discover research, media and educational resources across key polar science domains.' : 'प्रमुख ध्रुवीय विज्ञान क्षेत्रों में अनुसंधान, मीडिया और शैक्षिक संसाधनों की खोज करें।'}
              </p>
            </div>

            {/* View All Themes Pill Button */}
            <button
              onClick={() => { if (onSelectTheme) onSelectTheme('All'); setCurrentTab('explore'); }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 16px',
                borderRadius: '9999px',
                border: '1px solid #BAE6FD',
                background: '#FFFFFF',
                color: '#0284C7',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: '0 1px 4px rgba(2, 132, 199, 0.08)',
                transition: 'all 0.18s ease',
                flexShrink: 0
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = '#F0F9FF';
                (e.currentTarget as HTMLElement).style.borderColor = '#0284C7';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = '#FFFFFF';
                (e.currentTarget as HTMLElement).style.borderColor = '#BAE6FD';
                (e.currentTarget as HTMLElement).style.transform = 'none';
              }}
            >
              <span>{lang === 'en' ? 'View All Themes' : 'सभी विषय देखें'}</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {/* 7 theme cards */}
          <div 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', 
              gap: '12px' 
            }}
          >
            {THEME_CATEGORIES.map((theme) => (
              <button
                key={theme.id}
                onClick={() => handleThemeClick(theme.name)}
                style={{
                  ...cardBase,
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'stretch',
                  padding: 0, 
                  textAlign: 'center', 
                  minHeight: '150px',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(2, 132, 199, 0.45)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 18px rgba(2, 132, 199, 0.08)';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = '#E2E8F0';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(15, 23, 42, 0.04)';
                  (e.currentTarget as HTMLElement).style.transform = 'none';
                }}
              >
                {/* Card image */}
                <div style={{ position: 'relative', height: '80px', overflow: 'hidden', flexShrink: 0 }}>
                  <img src={theme.img} alt={theme.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(15,23,42,0.05), rgba(15,23,42,0.25))' }} />
                </div>
                {/* Card content */}
                <div style={{ padding: '8px 6px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', flex: 1 }}>
                  <span style={{ color: '#0284C7' }}>{theme.icon}</span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#0F172A', lineHeight: 1.25 }}>{lang === 'en' ? theme.name : theme.hindiName}</span>
                  <span style={{ fontSize: '9px', color: '#64748B', lineHeight: 1.3 }}>{theme.sub}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* 3. FEATURED POLAR RESEARCH                  */}
      {/* ═══════════════════════════════════════════ */}
      <section 
        style={{ 
          width: '100%', 
          paddingTop: '40px', 
          paddingBottom: '44px', 
          borderTop: '1px solid #F1F5F9' 
        }}
      >
        <div className="site-container-wide">

          {/* Balanced Header row */}
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'flex-end', 
              justifyContent: 'space-between', 
              marginBottom: '20px', 
              gap: '18px', 
              flexWrap: 'wrap' 
            }}
          >
            <div>
              <div className="section-eyebrow" style={{ marginBottom: '6px' }}>
                <span className="eyebrow-dot" />
                <span>{lang === 'en' ? 'FEATURED' : 'प्रमुख शोध'}</span>
              </div>
              <h2 
                style={{ 
                  fontSize: 'clamp(20px, 2.2vw, 26px)', 
                  fontWeight: 800, 
                  color: '#0F172A', 
                  letterSpacing: '-0.02em', 
                  lineHeight: 1.25, 
                  marginBottom: '4px', 
                  fontFamily: 'var(--font-heading)' 
                }}
              >
                {lang === 'en' ? 'Featured Polar Research' : 'प्रमुख ध्रुवीय अनुसंधान'}
              </h2>
              <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, maxWidth: '640px', margin: 0 }}>
                {lang === 'en' ? 'Explore important peer-reviewed research from Arctic and Antarctic campaigns.' : 'आर्कटिक और अंटार्कटिक अभियानों से महत्वपूर्ण अनुसंधान।'}
              </p>
            </div>

            {/* View all research Pill Button */}
            <button
              onClick={() => setCurrentTab('explore')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 16px',
                borderRadius: '9999px',
                border: '1px solid #BAE6FD',
                background: '#FFFFFF',
                color: '#0284C7',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: '0 1px 4px rgba(2, 132, 199, 0.08)',
                transition: 'all 0.18s ease',
                flexShrink: 0
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = '#F0F9FF';
                (e.currentTarget as HTMLElement).style.borderColor = '#0284C7';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = '#FFFFFF';
                (e.currentTarget as HTMLElement).style.borderColor = '#BAE6FD';
                (e.currentTarget as HTMLElement).style.transform = 'none';
              }}
            >
              <span>{lang === 'en' ? 'View all research' : 'सभी शोध पत्र देखें'}</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {/* 3 featured cards */}
          <div 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 290px), 1fr))', 
              gap: '18px' 
            }}
          >
            {featuredCardsData.map((card) => {
              const isAntarctic = card.region === 'ANTARCTIC';
              return (
                <div
                  key={card.id}
                  style={{ ...cardBase, display: 'flex', flexDirection: 'column' }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(2, 132, 199, 0.45)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(15, 23, 42, 0.08)';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = '#E2E8F0';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(15, 23, 42, 0.04)';
                    (e.currentTarget as HTMLElement).style.transform = 'none';
                  }}
                >
                  {/* Image */}
                  <div style={{ position: 'relative', height: '170px', overflow: 'hidden', flexShrink: 0 }}>
                    <img src={card.img} alt={card.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(15, 23, 42, 0.6) 100%)' }} />
                  </div>

                  {/* Body */}
                  <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      {/* Badges */}
                      <div style={{ display: 'flex', gap: '7px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '2px 7px', borderRadius: '4px', background: isAntarctic ? '#EEF2FF' : '#E0F2FE', color: isAntarctic ? '#4338CA' : '#0369A1', border: `1px solid ${isAntarctic ? '#C7D2FE' : '#BAE6FD'}` }}>
                          {card.region}
                        </span>
                        <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '2px 7px', borderRadius: '4px', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#475569' }}>
                          {card.theme}
                        </span>
                      </div>
                      <h3
                        onClick={() => { setSelectedPaperId(card.id); setCurrentTab('paper-detail'); }}
                        style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', lineHeight: 1.35, marginBottom: '6px', cursor: 'pointer', fontFamily: 'var(--font-heading)', letterSpacing: '-0.01em', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', transition: 'color 0.15s' }}
                        onMouseEnter={(e) => { (e.target as HTMLElement).style.color = '#0284C7'; }}
                        onMouseLeave={(e) => { (e.target as HTMLElement).style.color = '#0F172A'; }}
                      >
                        {card.title}
                      </h3>
                    </div>

                    {/* Footer */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #F1F5F9' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#64748B' }}>
                          <Calendar size={12} style={{ color: '#94A3B8' }} />{card.year}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#64748B' }}>
                          <Eye size={12} style={{ color: '#94A3B8' }} />{card.views}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#0284C7' }}>
                          <MapPin size={11} />{card.location}
                        </span>
                      </div>
                      <button
                        onClick={() => { setSelectedPaperId(card.id); setCurrentTab('paper-detail'); }}
                        style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '12px', fontWeight: 700, color: '#0284C7', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.15s' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#0369A1'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#0284C7'; }}
                      >
                        Read <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* 4. INTERACTIVE POLAR SCIENCE (LEARN)        */}
      {/* ═══════════════════════════════════════════ */}
      <section 
        style={{ 
          width: '100%', 
          paddingTop: '40px', 
          paddingBottom: '44px', 
          borderTop: '1px solid #F1F5F9' 
        }}
      >
        <div className="site-container-wide">

          {/* Balanced Header row */}
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'flex-end', 
              justifyContent: 'space-between', 
              marginBottom: '20px', 
              gap: '18px', 
              flexWrap: 'wrap' 
            }}
          >
            <div>
              <div className="section-eyebrow" style={{ marginBottom: '6px' }}>
                <span className="eyebrow-dot" />
                <span>{lang === 'en' ? <>LEARN WITH <span className="dhruva-brand-text">DHRUVA</span></> : 'ध्रुव के साथ सीखें'}</span>
              </div>
              <h2 
                style={{ 
                  fontSize: 'clamp(20px, 2.2vw, 26px)', 
                  fontWeight: 800, 
                  color: '#0F172A', 
                  letterSpacing: '-0.02em', 
                  lineHeight: 1.25, 
                  marginBottom: '4px', 
                  fontFamily: 'var(--font-heading)' 
                }}
              >
                {lang === 'en' ? 'Interactive Polar Science' : 'इंटरैक्टिव ध्रुवीय विज्ञान'}
              </h2>
              <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, maxWidth: '640px', margin: 0 }}>
                {lang === 'en' ? 'Quizzes, flashcards and simple explanations for all learners grounded in peer-reviewed science.' : 'सभी शिक्षार्थियों के लिए क्विज़, फ़्लैशकार्ड और सरल व्याख्याएं।'}
              </p>
            </div>

            {/* Browse All Modules Pill Button */}
            <button
              onClick={() => setCurrentTab('learn')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 16px',
                borderRadius: '9999px',
                border: '1px solid #BAE6FD',
                background: '#FFFFFF',
                color: '#0284C7',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: '0 1px 4px rgba(2, 132, 199, 0.08)',
                transition: 'all 0.18s ease',
                flexShrink: 0
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = '#F0F9FF';
                (e.currentTarget as HTMLElement).style.borderColor = '#0284C7';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = '#FFFFFF';
                (e.currentTarget as HTMLElement).style.borderColor = '#BAE6FD';
                (e.currentTarget as HTMLElement).style.transform = 'none';
              }}
            >
              <span>{lang === 'en' ? 'Browse All Modules' : 'सभी मॉड्यूल देखें'}</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {/* 3 Learning cards */}
          <div 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 290px), 1fr))', 
              gap: '18px' 
            }}
          >
            {[
              {
                icon: <BookOpen size={22} strokeWidth={2} />,
                title: lang === 'en' ? 'Study Modules' : 'अध्ययन मॉड्यूल',
                desc: lang === 'en' ? 'Learn complex concepts in simple, accessible language with peer citations.' : 'सरल भाषा में जटिल अवधारणाओं को समझें',
                cta: lang === 'en' ? 'Start Learning' : 'शुरू करें',
                img: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&q=65',
              },
              {
                icon: <FileCheck2 size={22} strokeWidth={2} />,
                title: lang === 'en' ? 'Quizzes & Flashcards' : 'क्विज़ और फ़्लैशकार्ड',
                desc: lang === 'en' ? 'Test your knowledge with interactive, citation-backed quizzes and flashcards.' : 'इंटरैक्टिव क्विज़ के साथ अपने ज्ञान का परीक्षण करें',
                cta: lang === 'en' ? 'Start Practicing' : 'शुरू करें',
                img: 'https://images.unsplash.com/photo-1551582045-6ec9c11d8697?w=400&q=65',
              },
              {
                icon: <GraduationCap size={22} strokeWidth={2} />,
                title: lang === 'en' ? 'For Students & Researchers' : 'छात्रों व शोधकर्ताओं के लिए',
                desc: lang === 'en' ? 'Curated learning paths tailored for academic research and citizen exploration.' : 'प्रत्येक स्तर के लिए क्यूरेटेड शिक्षण पथ',
                cta: lang === 'en' ? 'Start Exploring' : 'शुरू करें',
                img: 'https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=400&q=65',
              },
            ].map((card, i) => (
              <div
                key={i}
                onClick={() => setCurrentTab('learn')}
                style={{
                  ...cardBase,
                  display: 'flex', 
                  flexDirection: 'row', 
                  alignItems: 'stretch',
                  overflow: 'hidden', 
                  minHeight: '155px',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(2, 132, 199, 0.45)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(15, 23, 42, 0.08)';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = '#E2E8F0';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(15, 23, 42, 0.04)';
                  (e.currentTarget as HTMLElement).style.transform = 'none';
                }}
              >
                {/* Left: text */}
                <div style={{ flex: 1, padding: '18px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: '#F0F9FF', border: '1px solid #E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284C7', marginBottom: '8px' }}>
                      {card.icon}
                    </div>
                    <h3 style={{ fontSize: '14.5px', fontWeight: 700, color: '#0F172A', lineHeight: 1.3, marginBottom: '4px', fontFamily: 'var(--font-heading)' }}>{card.title}</h3>
                    <p style={{ fontSize: '12px', color: '#475569', lineHeight: 1.45, margin: 0 }}>{card.desc}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', fontWeight: 700, color: '#0284C7', marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #F1F5F9', transition: 'color 0.15s' }}>
                    {card.cta} <ArrowRight size={12} />
                  </div>
                </div>
                {/* Right: image */}
                <div style={{ width: '105px', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
                  <img src={card.img} alt={card.title} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(15,23,42,0.08), transparent)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* 5. WHY DHRUVA MATTERS FOR INDIA (MISSION)   */}
      {/* ═══════════════════════════════════════════ */}
      <section 
        style={{ 
          width: '100%', 
          paddingTop: '40px', 
          paddingBottom: '48px', 
          borderTop: '1px solid #F1F5F9' 
        }}
      >
        <div className="site-container-wide">

          {/* Balanced Header row */}
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'flex-end', 
              justifyContent: 'space-between', 
              marginBottom: '20px', 
              gap: '18px', 
              flexWrap: 'wrap' 
            }}
          >
            <div>
              <div className="section-eyebrow" style={{ marginBottom: '6px' }}>
                <span className="eyebrow-dot" />
                <span>{lang === 'en' ? 'OUR MISSION' : 'हमारा उद्देश्य'}</span>
              </div>
              <h2 
                style={{ 
                  fontSize: 'clamp(20px, 2.2vw, 26px)', 
                  fontWeight: 800, 
                  color: '#0F172A', 
                  letterSpacing: '-0.02em', 
                  lineHeight: 1.25, 
                  marginBottom: '4px', 
                  fontFamily: 'var(--font-heading)' 
                }}
              >
                {lang === 'en' ? <>Why <span className="dhruva-brand-text">DHRUVA</span> Matters for India</> : 'भारत के लिए ध्रुव क्यों महत्वपूर्ण है'}
              </h2>
              <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, maxWidth: '640px', margin: 0 }}>
                {lang === 'en' ? 'Transforming complex polar science data into open, accessible and grounded knowledge for every citizen and researcher.' : 'जटिल ध्रुवीय विज्ञान डेटा को प्रत्येक नागरिक और शोधकर्ता के लिए खुले, सुलभ और प्रामाणिक ज्ञान में बदलना।'}
              </p>
            </div>

            {/* Our Mission Pill Button */}
            <button
              onClick={() => setCurrentTab('about')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 16px',
                borderRadius: '9999px',
                border: '1px solid #BAE6FD',
                background: '#FFFFFF',
                color: '#0284C7',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: '0 1px 4px rgba(2, 132, 199, 0.08)',
                transition: 'all 0.18s ease',
                flexShrink: 0
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = '#F0F9FF';
                (e.currentTarget as HTMLElement).style.borderColor = '#0284C7';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = '#FFFFFF';
                (e.currentTarget as HTMLElement).style.borderColor = '#BAE6FD';
                (e.currentTarget as HTMLElement).style.transform = 'none';
              }}
            >
              <span>{lang === 'en' ? 'Our Mission' : 'हमारा उद्देश्य'}</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {/* 3 mission cards */}
          <div 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 290px), 1fr))', 
              gap: '18px' 
            }}
          >
            {[
              { icon: <BookOpen size={20} strokeWidth={2} />, title: lang === 'en' ? 'Monsoon & Climate Connections' : 'मानसून और जलवायु संबंध', desc: lang === 'en' ? 'Linking polar cryospheric fluctuations with the Indian monsoon teleconnections.' : 'ध्रुवीय हिम आवरण का भारतीय मानसून चक्र से संबंध।' },
              { icon: <Users size={20} strokeWidth={2} />,   title: lang === 'en' ? 'Verifiable Grounding & Integrity' : 'सत्यापित स्रोत और प्रामाणिकता', desc: lang === 'en' ? 'Zero-hallucination AI cited directly to published peer-reviewed page numbers.' : 'सहकर्मी-समीक्षित पृष्ठ संख्याओं से सीधे उद्धृत प्रामाणिक जानकारी।' },
              { icon: <UserCheck size={20} strokeWidth={2} />,title: lang === 'en' ? 'Empowering Future Scientists' : 'भावी वैज्ञानिकों को सशक्त बनाना', desc: lang === 'en' ? 'Democratizing polar science for universities, students, and citizens nationwide.' : 'विश्वविद्यालयों, छात्रों और नागरिकों के लिए ध्रुवीय विज्ञान का लोकतंत्रीकरण।' },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: '14px',
                  padding: '20px 18px', 
                  borderRadius: '14px',
                  background: '#FFFFFF', 
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(2, 132, 199, 0.45)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(15, 23, 42, 0.08)';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = '#E2E8F0';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(15, 23, 42, 0.04)';
                  (e.currentTarget as HTMLElement).style.transform = 'none';
                }}
              >
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', border: '1.5px solid rgba(2, 132, 199, 0.3)', background: 'rgba(2, 132, 199, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284C7', flexShrink: 0, marginTop: '2px' }}>
                  {item.icon}
                </div>
                <div>
                  <div style={{ fontSize: '14.5px', fontWeight: 700, color: '#0F172A', lineHeight: 1.3, marginBottom: '4px', fontFamily: 'var(--font-heading)' }}>{item.title}</div>
                  <p style={{ fontSize: '12px', color: '#475569', lineHeight: 1.55, margin: 0 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};
