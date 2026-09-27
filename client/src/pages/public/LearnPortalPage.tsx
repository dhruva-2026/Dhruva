import React, { useState } from 'react';
import {
  Search, Bookmark, ArrowRight, BookOpen, Layers, BarChart2, Users,
  ChevronRight, HelpCircle, GraduationCap, Gamepad2, LayoutGrid,
  Globe, Mountain, Sliders, Activity, X
} from 'lucide-react';

import { apiFetchPapers } from '../../services/api';

interface LearnPortalPageProps {
  onOpenPaper: (id: string, initialTab?: 'summary' | 'abstract' | 'paper' | 'learn' | 'ask' | 'sources') => void;
  lang: 'en' | 'hi';
}

const INITIAL_MODULES = [
  {
    id: 'mod-1',
    paperId: 'paper-001',
    region: 'ANTARCTIC',
    level: 'INTERMEDIATE',
    title: 'Antarctic Sea Ice & Ocean Dynamics',
    desc: 'Learn about freeze-up delays, the Southern Annular Mode, and Circumpolar Deep Water upwelling in the Weddell Sea.',
    mcqs: 5,
    flashcards: '3D Flashcards',
    tag: 'Research Based',
    img: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?w=700&q=80',
  },
  {
    id: 'mod-2',
    paperId: 'paper-002',
    region: 'ARCTIC',
    level: 'ADVANCED',
    title: 'Arctic Permafrost Thaw & Methane Emissions',
    desc: 'Explore how deepening active-layer soil horizons in Svalbard awaken methanogenic archaea, creating potent climate feedbacks.',
    mcqs: 5,
    flashcards: '3D Flashcards',
    tag: 'Research Based',
    img: 'https://images.unsplash.com/photo-1517760444937-f6397edcbbcd?w=700&q=80',
  },
  {
    id: 'mod-3',
    paperId: 'paper-003',
    region: 'ANTARCTIC',
    level: 'BEGINNER',
    title: 'Prydz Bay Phytoplankton & Marine Carbon Pump',
    desc: 'Understand how glacial meltwater delivers iron to fuel massive diatom blooms that sustain Antarctic krill and penguins.',
    mcqs: 5,
    flashcards: '3D Flashcards',
    tag: 'Research Based',
    img: 'https://images.unsplash.com/photo-1559827291-72ee739d0d9a?w=700&q=80',
  },
  {
    id: 'mod-4',
    paperId: 'paper-004',
    region: 'ARCTIC',
    level: 'INTERMEDIATE',
    title: 'Atmospheric Black Carbon & Arctic Haze',
    desc: 'Track long-range transboundary transport of soot from industrial corridors to Ny-Ålesund and its impact on snow albedo.',
    mcqs: 5,
    flashcards: '3D Flashcards',
    tag: 'Research Based',
    img: 'https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=700&q=80',
  },
  {
    id: 'mod-5',
    paperId: 'paper-005',
    region: 'ANTARCTIC',
    level: 'BEGINNER',
    title: 'Glaciology: Ice Sheets, Flow & Change',
    desc: 'Learn the fundamentals of ice sheet dynamics, mass balance, and their role in global sea level rise.',
    mcqs: 5,
    flashcards: '3D Flashcards',
    tag: 'Research Based',
    img: 'https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?w=700&q=80',
  },
  {
    id: 'mod-6',
    paperId: 'paper-006',
    region: 'ARCTIC',
    level: 'INTERMEDIATE',
    title: 'Polar Regions, People & Policy',
    desc: 'Explore how science, communities, and international collaborations shape a sustainable polar future.',
    mcqs: 5,
    flashcards: '3D Flashcards',
    tag: 'Research Based',
    img: 'https://images.unsplash.com/photo-1548263594-a71ea65a8598?w=700&q=80',
  },
];

const FILTER_BUTTONS = [
  { id: 'All Modules', label: 'All Modules', icon: LayoutGrid },
  { id: 'Antarctic', label: 'Antarctic', icon: Globe },
  { id: 'Arctic', label: 'Arctic', icon: Mountain },
  { id: 'Beginner', label: 'Beginner', icon: GraduationCap },
  { id: 'Intermediate', label: 'Intermediate', icon: Sliders },
  { id: 'Advanced', label: 'Advanced', icon: Activity },
];

export const LearnPortalPage: React.FC<LearnPortalPageProps> = ({ onOpenPaper, lang }) => {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All Modules');
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const [allModules, setAllModules] = useState(INITIAL_MODULES);

  React.useEffect(() => {
    async function loadDynamicModules() {
      try {
        const res = await apiFetchPapers({ sort: 'views' });
        if (res && res.papers && res.papers.length > 0) {
          const knownIds = new Set(INITIAL_MODULES.map(m => m.paperId));
          const extraModules = res.papers
            .filter((p: any) => !knownIds.has(p.id))
            .slice(0, 6)
            .map((p: any, idx: number) => ({
              id: `dyn-mod-${idx + 1}`,
              paperId: p.id,
              region: (p.polar_region || 'Antarctic').toUpperCase(),
              level: idx % 2 === 0 ? 'INTERMEDIATE' : 'ADVANCED',
              title: p.title,
              desc: p.abstract || 'Learn through interactive MCQs and 3D flashcards generated from this polar research paper.',
              mcqs: 5,
              flashcards: '3D Flashcards',
              tag: 'Research Based',
              img: p.thumbnail_url || 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?w=700&q=80'
            }));

          setAllModules([...INITIAL_MODULES, ...extraModules]);
        }
      } catch (e) {
        // Fallback to initial modules
      }
    }
    loadDynamicModules();
  }, []);

  const toggleBookmark = (id: string) => {
    setBookmarked(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const filtered = allModules.filter(m => {
    const matchSearch =
      search === '' ||
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.desc.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      activeFilter === 'All Modules' ||
      m.region.toLowerCase() === activeFilter.toLowerCase() ||
      m.level.toLowerCase() === activeFilter.toLowerCase();
    return matchSearch && matchFilter;
  });

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>

      {/* ═══ HERO ═══ */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(2, 132, 199, 0.08), transparent 70%), linear-gradient(180deg, rgba(240, 249, 255, 0.4) 0%, transparent 100%)',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />

        <div
          style={{
            position: 'relative',
            zIndex: 2,
            maxWidth: '1520px',
            margin: '0 auto',
            padding: 'clamp(2.5rem, 4vw, 4rem) clamp(1.2rem, 3vw, 3rem) 2rem',
          }}
        >
          {/* Top row: Eyebrow badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              marginBottom: '18px',
              gap: '24px',
              flexWrap: 'wrap',
            }}
          >
            {/* Eyebrow badge */}
            <div className="section-eyebrow">
              <GraduationCap size={14} />
              <span>{lang === 'en' ? 'Polar Science Education Hub' : 'ध्रुवीय विज्ञान शिक्षा केंद्र'}</span>
            </div>
          </div>

          {/* Main Hero Heading */}
          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(2.2rem, 5vw, 3.8rem)',
              fontWeight: 800,
              lineHeight: 1.12,
              letterSpacing: '-0.03em',
              marginBottom: '16px',
            }}
          >
            <span style={{ color: '#0F172A' }}>Interactive </span>
            <span className="heading-gradient">
              Polar Science Learning
            </span>
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: '0.95rem',
              color: '#475569',
              lineHeight: 1.7,
              maxWidth: '620px',
              marginBottom: '28px',
            }}
          >
            {lang === 'en'
              ? 'Transforming institutional research from Indian Arctic and Antarctic expeditions into structured, gamified learning modules with quizzes, flashcards, and verified citations.'
              : 'भारतीय अभियानों के संस्थागत अनुसंधान को संरचित शिक्षण मॉड्यूल, क्विज़ और फ्लैशकार्ड में बदलना।'}
          </p>

          {/* 4 Feature Badges (Responsive Grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-7">
            {[
              { icon: BookOpen, text: 'Research-backed Content' },
              { icon: Gamepad2, text: 'Interactive Learning' },
              { icon: BarChart2, text: 'Verified Citations' },
              { icon: Users, text: 'For Students, Educators & Researchers' },
            ].map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl bg-white/85 border border-slate-200/80 shadow-xs backdrop-blur-xs text-xs font-semibold text-slate-700"
              >
                <div className="w-8 h-8 rounded-full border border-sky-500/25 bg-sky-50 flex items-center justify-center text-sky-600 shrink-0">
                  <Icon size={15} />
                </div>
                <span className="leading-tight">{text}</span>
              </div>
            ))}
          </div>

          {/* ═══ Sleek Search + Filter Bar ═══ */}
          <div className="w-full space-y-3.5">
            {/* Search Input Bar */}
            <div className="w-full flex items-center bg-white/95 border border-slate-200 hover:border-sky-400 focus-within:border-sky-500 rounded-xl sm:rounded-full px-4 py-2.5 shadow-xs backdrop-blur-md transition-all">
              <Search
                size={16}
                className="text-sky-600 mr-2.5 shrink-0"
              />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search learning modules, topics, or keywords..."
                className="w-full bg-transparent border-none outline-none text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 font-medium"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-2 items-center">
              {FILTER_BUTTONS.map(f => {
                const active = activeFilter === f.id;
                const IconComponent = f.icon;
                return (
                  <button
                    key={f.id}
                    onClick={() => setActiveFilter(f.id)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      active
                        ? 'bg-gradient-to-r from-sky-600 to-cyan-700 text-white shadow-sm shadow-sky-600/30 border border-transparent'
                        : 'bg-white/90 text-slate-600 border border-slate-200/90 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <IconComponent size={13} />
                    <span>{f.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ FEATURED MODULES SECTION ═══ */}
      <div
        style={{
          maxWidth: '1520px',
          margin: '0 auto',
          padding: '1.5rem clamp(1.2rem, 3vw, 3rem) 4rem',
        }}
      >
        {/* Section Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            marginBottom: '24px',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(1.5rem, 3vw, 1.85rem)',
                fontWeight: 800,
                color: '#0F172A',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
                marginBottom: '4px',
              }}
            >
              Featured Learning Modules
            </h2>
            <p style={{ fontSize: '13px', color: '#64748B' }}>
              Explore curated modules based on real research from Indian polar expeditions.
            </p>
          </div>
          <button
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 700,
              color: '#0284C7',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.color = '#0369A1';
              (e.currentTarget as HTMLElement).style.transform = 'translateX(2px)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.color = '#0284C7';
              (e.currentTarget as HTMLElement).style.transform = 'none';
            }}
          >
            View All Modules <ArrowRight size={14} />
          </button>
        </div>

        {/* 3-Column Card Grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <Search size={36} style={{ color: '#94A3B8', margin: '0 auto 12px' }} />
            <p style={{ color: '#64748B', fontSize: '15px' }}>
              No modules found matching your query. Try adjusting your search or filters.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '20px',
            }}
          >
            {filtered.map(mod => {
              const isAntarctic = mod.region === 'ANTARCTIC';

              return (
                <div
                  key={mod.id}
                  onClick={() => onOpenPaper(mod.paperId, 'learn')}
                  style={{
                    borderRadius: '16px',
                    overflow: 'hidden',
                    background: 'rgba(255, 255, 255, 0.92)',
                    border: '1px solid rgba(14, 116, 144, 0.16)',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: '0 8px 30px rgba(15, 23, 42, 0.06)',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(2, 132, 199, 0.45)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 40px rgba(15, 23, 42, 0.1)';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(14, 116, 144, 0.16)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 30px rgba(15, 23, 42, 0.06)';
                    (e.currentTarget as HTMLElement).style.transform = 'none';
                  }}
                >
                  {/* Card Image Area */}
                  <div
                    style={{
                      position: 'relative',
                      height: '180px',
                      overflow: 'hidden',
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src={mod.img}
                      alt={mod.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.6s ease',
                      }}
                      onMouseEnter={e => {
                        (e.target as HTMLImageElement).style.transform = 'scale(1.06)';
                      }}
                      onMouseLeave={e => {
                        (e.target as HTMLImageElement).style.transform = 'scale(1)';
                      }}
                    />

                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to bottom, transparent 30%, rgba(15, 23, 42, 0.45) 100%)',
                        pointerEvents: 'none',
                      }}
                    />

                    {/* Bookmark Icon in top right */}
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        toggleBookmark(mod.id);
                      }}
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        border: '1px solid rgba(148, 163, 184, 0.4)',
                        background: 'rgba(255, 255, 255, 0.9)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: bookmarked.has(mod.id) ? '#0284C7' : '#64748B',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.background = '#FFFFFF';
                        (e.currentTarget as HTMLElement).style.color = '#0284C7';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.9)';
                        (e.currentTarget as HTMLElement).style.color = bookmarked.has(mod.id) ? '#0284C7' : '#64748B';
                      }}
                    >
                      <Bookmark size={15} fill={bookmarked.has(mod.id) ? 'currentColor' : 'none'} />
                    </button>

                    {/* Badges on Bottom-Left */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '12px',
                        left: '14px',
                        display: 'flex',
                        gap: '6px',
                        alignItems: 'center',
                        zIndex: 2,
                      }}
                    >
                      {/* Region badge */}
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          padding: '3px 9px',
                          borderRadius: '9999px',
                          background: isAntarctic ? '#4338CA' : '#0284C7',
                          color: '#FFFFFF',
                          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
                        }}
                      >
                        {mod.region}
                      </span>

                      {/* Level badge */}
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          padding: '3px 9px',
                          borderRadius: '9999px',
                          background: 'rgba(255, 255, 255, 0.9)',
                          border: '1px solid rgba(148, 163, 184, 0.3)',
                          color: '#0F172A',
                          backdropFilter: 'blur(4px)',
                        }}
                      >
                        {mod.level}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div
                    style={{
                      padding: '16px 18px 12px',
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    {/* Title */}
                    <h3
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenPaper(mod.paperId, 'learn');
                      }}
                      style={{
                        fontSize: '15px',
                        fontWeight: 700,
                        color: '#0F172A',
                        lineHeight: 1.35,
                        marginBottom: '8px',
                        fontFamily: 'var(--font-heading)',
                        letterSpacing: '-0.01em',
                        cursor: 'pointer',
                        transition: 'color 0.15s ease',
                      }}
                      onMouseEnter={e => {
                        (e.target as HTMLElement).style.color = '#0284C7';
                      }}
                      onMouseLeave={e => {
                        (e.target as HTMLElement).style.color = '#0F172A';
                      }}
                    >
                      {mod.title}
                    </h3>

                    {/* Description */}
                    <p
                      style={{
                        fontSize: '12.5px',
                        color: '#475569',
                        lineHeight: 1.6,
                        flex: 1,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        margin: 0,
                      }}
                    >
                      {mod.desc}
                    </p>
                  </div>

                  {/* Card Footer with Stats & Cyan Circular Arrow Button */}
                  <div
                    style={{
                      padding: '12px 18px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderTop: '1px solid rgba(148, 163, 184, 0.2)',
                    }}
                  >
                    {/* Left stats */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                          color: '#64748B',
                        }}
                      >
                        <HelpCircle size={12} style={{ color: '#0284C7' }} />
                        {mod.mcqs} MCQs
                      </span>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                          color: '#64748B',
                        }}
                      >
                        <Layers size={12} style={{ color: '#0284C7' }} />
                        {mod.flashcards}
                      </span>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                          color: '#64748B',
                        }}
                      >
                        <BarChart2 size={12} style={{ color: '#0284C7' }} />
                        {mod.tag}
                      </span>
                    </div>

                    {/* Circular Arrow Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenPaper(mod.paperId, 'learn');
                      }}
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #0284C7, #0369A1)',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(2, 132, 199, 0.35)',
                        transition: 'all 0.18s ease',
                        flexShrink: 0,
                        color: '#FFFFFF',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 14px rgba(2, 132, 199, 0.5)';
                        (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(2, 132, 199, 0.35)';
                        (e.currentTarget as HTMLElement).style.transform = 'none';
                      }}
                    >
                      <ChevronRight size={17} strokeWidth={2.6} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
