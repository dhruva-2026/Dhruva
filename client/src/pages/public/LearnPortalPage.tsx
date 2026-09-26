import React, { useState } from 'react';
import {
  Search, Bookmark, ArrowRight, BookOpen, Layers, BarChart2, Users,
  ChevronRight, HelpCircle, GraduationCap, Gamepad2, LayoutGrid,
  Globe, Mountain, Sliders, Activity
} from 'lucide-react';

interface LearnPortalPageProps {
  onOpenPaper: (id: string) => void;
  lang: 'en' | 'hi';
}

const MODULES = [
  {
    id: 'mod-1',
    paperId: 'paper-001',
    region: 'ANTARCTIC',
    level: 'INTERMEDIATE',
    title: 'Antarctic Sea Ice & Ocean Dynamics',
    desc: 'Learn about freeze-up delays, the Southern Annular Mode, and Circumpolar Deep Water upwelling in the Weddell Sea.',
    mcqs: 4,
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
    mcqs: 3,
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
    mcqs: 4,
    flashcards: 'Flashcards',
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
    mcqs: 3,
    flashcards: 'Flashcards',
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
    flashcards: 'Flashcards',
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
    mcqs: 4,
    flashcards: 'Case Studies',
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

  const toggleBookmark = (id: string) => {
    setBookmarked(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const filtered = MODULES.filter(m => {
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
        {/* Subtle dark polar gradient background overlay (as requested: change the bg) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(0, 229, 255, 0.08), transparent 70%), linear-gradient(180deg, rgba(3, 10, 30, 0.6) 0%, rgba(2, 6, 23, 0.85) 100%)',
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
          {/* Top row: Eyebrow badge + Quote */}
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
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 16px',
                borderRadius: '9999px',
                border: '1px solid rgba(0, 229, 255, 0.35)',
                background: 'rgba(0, 229, 255, 0.07)',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: '#00E5FF',
              }}
            >
              <GraduationCap size={14} />
              {lang === 'en' ? 'Polar Science Education Hub' : 'ध्रुवीय विज्ञान शिक्षा केंद्र'}
            </div>

            {/* Right quote with accent bar */}
            <div style={{ textAlign: 'right', maxWidth: '260px' }}>
              <p
                style={{
                  fontSize: '13px',
                  fontStyle: 'italic',
                  color: 'rgba(226, 232, 240, 0.82)',
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                "Knowledge today.
                <br />
                A brighter tomorrow
                <br />
                for our polar regions."
              </p>
              <div
                style={{
                  width: '36px',
                  height: '3px',
                  background: '#00E5FF',
                  marginTop: '8px',
                  marginLeft: 'auto',
                  borderRadius: '2px',
                  boxShadow: '0 0 8px rgba(0, 229, 255, 0.6)',
                }}
              />
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
            <span style={{ color: '#FFFFFF' }}>Interactive </span>
            <span
              style={{
                background: 'linear-gradient(135deg, #00E5FF 0%, #38BDF8 60%, #60A5FA 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Polar Science Learning
            </span>
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: '0.95rem',
              color: 'rgba(203, 213, 225, 0.85)',
              lineHeight: 1.7,
              maxWidth: '620px',
              marginBottom: '28px',
            }}
          >
            {lang === 'en'
              ? 'Transforming institutional research from Indian Arctic and Antarctic expeditions into structured, gamified learning modules with quizzes, flashcards, and verified citations.'
              : 'भारतीय अभियानों के संस्थागत अनुसंधान को संरचित शिक्षण मॉड्यूल, क्विज़ और फ्लैशकार्ड में बदलना।'}
          </p>

          {/* 4 Feature Badges in circular blue pills */}
          <div
            style={{
              display: 'flex',
              gap: '24px',
              flexWrap: 'wrap',
              alignItems: 'center',
              marginBottom: '32px',
            }}
          >
            {[
              { icon: BookOpen, text: 'Research-backed Content' },
              { icon: Gamepad2, text: 'Interactive Learning' },
              { icon: BarChart2, text: 'Verified Citations' },
              { icon: Users, text: 'For Students, Educators & Researchers' },
            ].map(({ icon: Icon, text }) => (
              <div
                key={text}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'rgba(226, 232, 240, 0.92)',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    border: '1px solid rgba(0, 229, 255, 0.35)',
                    background: 'rgba(0, 229, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#00E5FF',
                    flexShrink: 0,
                    boxShadow: '0 0 12px rgba(0, 229, 255, 0.15)',
                  }}
                >
                  <Icon size={16} />
                </div>
                <span>{text}</span>
              </div>
            ))}
          </div>

          {/* ═══ Sleek Search + Filter Bar Container ═══ */}
          <div
            style={{
              background: 'rgba(3, 10, 28, 0.88)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '9999px',
              padding: '6px 8px 6px 16px',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
            }}
          >
            {/* Search Input */}
            <div
              style={{
                position: 'relative',
                flex: '1 1 240px',
                minWidth: '200px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Search
                size={16}
                style={{
                  color: '#00E5FF',
                  marginRight: '10px',
                  flexShrink: 0,
                }}
              />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search learning modules, topics, or keywords..."
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  padding: '8px 0',
                  fontSize: '13px',
                  color: '#FFFFFF',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            {/* Filter Pills with Icons */}
            <div
              style={{
                display: 'flex',
                gap: '6px',
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              {FILTER_BUTTONS.map(f => {
                const active = activeFilter === f.id;
                const IconComponent = f.icon;
                return (
                  <button
                    key={f.id}
                    onClick={() => setActiveFilter(f.id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 16px',
                      borderRadius: '9999px',
                      border: active ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 600,
                      transition: 'all 0.18s ease',
                      background: active
                        ? 'linear-gradient(135deg, #00E5FF, #00BCD4)'
                        : 'rgba(255, 255, 255, 0.05)',
                      color: active ? '#020617' : '#94A3B8',
                      boxShadow: active ? '0 2px 14px rgba(0, 229, 255, 0.4)' : 'none',
                    }}
                    onMouseEnter={e => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.1)';
                        (e.currentTarget as HTMLElement).style.color = '#FFFFFF';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.05)';
                        (e.currentTarget as HTMLElement).style.color = '#94A3B8';
                      }
                    }}
                  >
                    <IconComponent size={13} />
                    {f.label}
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
                color: '#FFFFFF',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
                marginBottom: '4px',
              }}
            >
              Featured Learning Modules
            </h2>
            <p style={{ fontSize: '13px', color: 'rgba(148, 163, 184, 0.9)' }}>
              Explore curated modules based on real research from Indian polar expeditions.
            </p>
          </div>
          <button
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#00E5FF',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.color = '#67E8F9';
              (e.currentTarget as HTMLElement).style.transform = 'translateX(2px)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.color = '#00E5FF';
              (e.currentTarget as HTMLElement).style.transform = 'none';
            }}
          >
            View All Modules <ArrowRight size={14} />
          </button>
        </div>

        {/* 3-Column Card Grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <Search size={36} style={{ color: '#475569', margin: '0 auto 12px' }} />
            <p style={{ color: '#94A3B8', fontSize: '15px' }}>
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
                  style={{
                    borderRadius: '16px',
                    overflow: 'hidden',
                    background: 'rgba(4, 12, 34, 0.92)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0, 229, 255, 0.45)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 40px rgba(0, 0, 0, 0.6), 0 0 20px rgba(0, 229, 255, 0.15)';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255, 255, 255, 0.08)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.4)';
                    (e.currentTarget as HTMLElement).style.transform = 'none';
                  }}
                >
                  {/* Card Image Area with overlay badges & bookmark */}
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

                    {/* Gradient Overlay for badges contrast */}
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to bottom, rgba(2, 6, 23, 0.1) 0%, rgba(2, 6, 23, 0.75) 100%)',
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
                        border: '1px solid rgba(255, 255, 255, 0.18)',
                        background: 'rgba(2, 8, 24, 0.65)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: bookmarked.has(mod.id) ? '#00E5FF' : 'rgba(226, 232, 240, 0.85)',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(0, 229, 255, 0.2)';
                        (e.currentTarget as HTMLElement).style.color = '#00E5FF';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(2, 8, 24, 0.65)';
                        (e.currentTarget as HTMLElement).style.color = bookmarked.has(mod.id) ? '#00E5FF' : 'rgba(226, 232, 240, 0.85)';
                      }}
                    >
                      <Bookmark size={15} fill={bookmarked.has(mod.id) ? 'currentColor' : 'none'} />
                    </button>

                    {/* Badges on Bottom-Left of the image (as shown in reference image) */}
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
                          background: isAntarctic ? '#3B82F6' : '#00E5FF',
                          color: isAntarctic ? '#FFFFFF' : '#020617',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
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
                          background: 'rgba(4, 12, 32, 0.75)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          color: '#E2E8F0',
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
                      onClick={() => onOpenPaper(mod.paperId)}
                      style={{
                        fontSize: '15px',
                        fontWeight: 700,
                        color: '#FFFFFF',
                        lineHeight: 1.35,
                        marginBottom: '8px',
                        fontFamily: 'var(--font-heading)',
                        letterSpacing: '-0.01em',
                        cursor: 'pointer',
                        transition: 'color 0.15s ease',
                      }}
                      onMouseEnter={e => {
                        (e.target as HTMLElement).style.color = '#00E5FF';
                      }}
                      onMouseLeave={e => {
                        (e.target as HTMLElement).style.color = '#FFFFFF';
                      }}
                    >
                      {mod.title}
                    </h3>

                    {/* Description */}
                    <p
                      style={{
                        fontSize: '12.5px',
                        color: 'rgba(148, 163, 184, 0.88)',
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
                      borderTop: '1px solid rgba(255, 255, 255, 0.05)',
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
                          color: '#94A3B8',
                        }}
                      >
                        <HelpCircle size={12} style={{ color: '#00E5FF' }} />
                        {mod.mcqs} MCQs
                      </span>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                          color: '#94A3B8',
                        }}
                      >
                        <Layers size={12} style={{ color: '#00E5FF' }} />
                        {mod.flashcards}
                      </span>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                          color: '#94A3B8',
                        }}
                      >
                        <BarChart2 size={12} style={{ color: '#00E5FF' }} />
                        {mod.tag}
                      </span>
                    </div>

                    {/* Cyan Circular Arrow Button */}
                    <button
                      onClick={() => onOpenPaper(mod.paperId)}
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #00E5FF, #00BCD4)',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 0 14px rgba(0, 229, 255, 0.45)',
                        transition: 'all 0.18s ease',
                        flexShrink: 0,
                        color: '#020617',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.boxShadow = '0 0 22px rgba(0, 229, 255, 0.7)';
                        (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.boxShadow = '0 0 14px rgba(0, 229, 255, 0.45)';
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
