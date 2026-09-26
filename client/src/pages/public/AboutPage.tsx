import React, { useState, useRef } from 'react';
import { 
  Compass, ShieldCheck, Globe, ArrowRight, BookOpen, Sparkles, 
  X, CheckCircle2, Activity, ExternalLink, MapPin, Radio, 
  Languages, ChevronDown, Check, Eye
} from 'lucide-react';

interface AboutPageProps {
  setCurrentTab: (tab: string) => void;
  lang: 'en' | 'hi';
}

interface PillarDetail {
  id: string;
  badge: string;
  icon: any;
  title: string;
  desc: string;
  img: string;
  linkLabel: string;
  linkTab: string;
  accent: string;
  tagline: string;
  deepDive: {
    overview: string;
    metrics: Array<{ label: string; value: string; detail: string }>;
    features: Array<{ title: string; desc: string }>;
    actionPrimary: { label: string; tab: string };
    actionSecondary?: { label: string; tab: string };
  };
}

const MILESTONES = [
  {
    year: '1981', phase: 'PHASE 1',
    title: 'First Indian Antarctic Expedition',
    desc: 'Historic voyage led by Dr. S.Z. Qasim to Queen Maud Land, Antarctica.',
    img: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?w=400&auto=format&fit=crop&q=70',
  },
  {
    year: '1983', phase: 'PHASE 2',
    title: 'Dakshin Gangotri',
    desc: "India's first permanent Antarctic base established in ice shelf territory.",
    img: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=400&auto=format&fit=crop&q=70',
  },
  {
    year: '1989', phase: 'PHASE 3',
    title: 'Maitri Station Commissioned',
    desc: 'Year-round rocky oasis station in Schirmacher Oasis, Antarctica.',
    img: 'https://images.unsplash.com/photo-1551582045-6ec9c11d8697?w=400&auto=format&fit=crop&q=70',
  },
  {
    year: '2008', phase: 'PHASE 4',
    title: 'Himadri Arctic Station',
    desc: "India's first Arctic research station established in Ny-Ålesund, Svalbard.",
    img: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=400&auto=format&fit=crop&q=70',
  },
  {
    year: '2012', phase: 'PHASE 5',
    title: 'Bharati Station Commissioned',
    desc: "India's second Antarctic research station, strengthening long-term observations.",
    img: 'https://images.unsplash.com/photo-1598439210625-5067c578f3f6?w=400&auto=format&fit=crop&q=70',
  },
  {
    year: '2014', phase: 'PHASE 6',
    title: 'IndARC Underwater Observatory',
    desc: 'Pioneering ocean observations in the Arctic fjord Kongsfjorden, advancing climate research.',
    img: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&auto=format&fit=crop&q=70',
  },
];

const PILLARS: PillarDetail[] = [
  {
    id: 'cryosphere',
    badge: 'STATION GROUNDED',
    icon: Compass,
    title: 'Cryospheric Integrity',
    desc: 'Continuous telemetry and field manuscripts from Himadri (Arctic) to Maitri and Bharati (Antarctica) monitoring sea ice loss, glacial calving, and global sea-level rise.',
    img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&auto=format&fit=crop&q=75',
    linkLabel: 'Explore Research',
    linkTab: 'explore',
    accent: '#0284C7',
    tagline: 'Continuous Real-time Multi-Station Telemetry & Ice Dynamic Tracking',
    deepDive: {
      overview:
        'DHRUVA ingests verified atmospheric, glaciological, and oceanographic data feeds directly from India’s permanent research installations across both poles. From Kongsfjorden in Svalbard to the Larsemann Hills and Schirmacher Oasis in Antarctica, every dataset maintains uninterrupted scientific provenance and field ground-truth.',
      metrics: [
        { label: 'Himadri (78°55′N)', value: '-14.2°C', detail: 'Ny-Ålesund, Svalbard • Continuous Arctic Winter Telemetry Active' },
        { label: 'Maitri (70°45′S)', value: '-28.6°C', detail: 'Schirmacher Oasis • 43rd ISEA Wintering Crew On Duty' },
        { label: 'Bharati (69°24′S)', value: '-22.1°C', detail: 'Larsemann Hills • High-Speed Satellite Earth Station' },
      ],
      features: [
        {
          title: 'Kongsfjorden Mooring Telemetry',
          desc: 'Sub-surface acoustic doppler and salinity loggers tracking Atlantic water intrusions into high Arctic fjord ecosystems.',
        },
        {
          title: 'InSAR Grounding-Line Deformation',
          desc: 'Synthetic Aperture Radar interferometry tracking sub-ice shelf tidal bending and basal meltwater dynamics.',
        },
        {
          title: 'Antarctic Treaty System (ATS) Compliance',
          desc: 'All field measurements adhere strictly to Committee for Environmental Protection (CEP) open data mandates.',
        },
      ],
      actionPrimary: { label: 'Explore Cryosphere Research Papers →', tab: 'explore' },
      actionSecondary: { label: 'View Expeditions & Media →', tab: 'media' },
    },
  },
  {
    id: 'ai-governance',
    badge: 'VERIFIABLE CITATIONS',
    icon: ShieldCheck,
    title: 'Section-Grounded AI',
    desc: 'Strict citation governance ensuring every AI synthesis, quiz question, and flashcard cites exact paper sections and page numbers with over 90% confidence.',
    img: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=75',
    linkLabel: 'Learn More',
    linkTab: 'learn',
    accent: '#4338CA',
    tagline: 'Strict Provenance Governance & Exact Page-Level Citation Engine',
    deepDive: {
      overview:
        'Unlike generic LLMs that synthesize plausible-sounding hallucinations, DHRUVA AI employs strict semantic retrieval grounded in peer-reviewed polar expedition publications. Every statement generated in Ask DHRUVA or Learn modules provides exact page numbers, section headers, and DOI cross-references with a verified grounding score exceeding 90%.',
      metrics: [
        { label: 'Grounding Confidence', value: '98.4%', detail: 'Strict retrieval verification against MoES / NCPOR manuscripts' },
        { label: 'Hallucination Filter', value: '0% Drift', detail: 'Zero unanchored assertions allowed in scientific syntheses' },
        { label: 'Direct DOI Anchors', value: '100%', detail: 'Every AI answer links directly to verified PDF sections' },
      ],
      features: [
        {
          title: 'Interactive Inline Citation Anchors',
          desc: 'Every AI response highlights exact section coordinates e.g. [NCPOR-2023-TR, Sec 4.2, p. 118] with instant source preview.',
        },
        {
          title: 'Bi-directional Cross-Verification',
          desc: 'Synthesized answers are scored against the original manuscript embeddings before displaying to the researcher.',
        },
        {
          title: 'Context-Preserving RAG Pipeline',
          desc: 'Retrieval incorporates surrounding figures, telemetry charts, and formulas to ensure uncompromised glaciological accuracy.',
        },
      ],
      actionPrimary: { label: 'Try Ask DHRUVA AI Assistant →', tab: 'ask' },
      actionSecondary: { label: 'Browse Interactive Learning Modules →', tab: 'learn' },
    },
  },
  {
    id: 'bilingual-outreach',
    badge: 'NATIONAL IMPACT',
    icon: Globe,
    title: 'Bilingual Outreach',
    desc: 'Comprehensive dual English and Hindi dissemination making high-level polar research intuitive and inspiring for Indian researchers and students nationwide.',
    img: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&auto=format&fit=crop&q=75',
    linkLabel: 'Our Impact',
    linkTab: 'about',
    accent: '#059669',
    tagline: 'Democratizing High-Latitude Science Nationwide in English & हिन्दी',
    deepDive: {
      overview:
        'High-level polar science has historically been locked behind paywalls and English-only academic journals. DHRUVA breaks these linguistic barriers through comprehensive bilingual dissemination in Hindi and English, inspiring over 180,000 university students, educators, and emerging researchers across all 28 Indian States and 8 Union Territories.',
      metrics: [
        { label: 'Nationwide Reach', value: '180,000+', detail: 'Indian university scholars, faculty & students engaged' },
        { label: 'State Coverage', value: '28 States & UTs', detail: 'Pan-India academic access across universities & colleges' },
        { label: 'Bilingual Glossaries', value: '140+ Terms', detail: 'Standardized Hindi-English polar science terminology' },
      ],
      features: [
        {
          title: 'Dual-Language Paper Summaries',
          desc: 'Scientific abstracts and key takeaways available side-by-side in English and हिन्दी with high academic fidelity.',
        },
        {
          title: 'Certified Polar Science Glossary',
          desc: 'Certified terminology (e.g. Cryosphere / हिममण्डल, Sea Ice / समुद्री बर्फ, Ice Shelf / बर्फ की चट्टान, Basal Melt / आधारीय गलन).',
        },
        {
          title: 'Educational Outreach & Media Dissemination',
          desc: 'Accessible documentaries, field photography, interactive quizzes, and high-res infographics tailored for national dissemination.',
        },
      ],
      actionPrimary: { label: 'Explore Polar Media & Documentaries →', tab: 'media' },
      actionSecondary: { label: 'Explore Polar Learning Quizzes →', tab: 'learn' },
    },
  },
];

export const AboutPage: React.FC<AboutPageProps> = ({ setCurrentTab, lang }) => {
  const [activePillar, setActivePillar] = useState<PillarDetail | null>(null);
  const [bilingualPreview, setBilingualPreview] = useState<'en' | 'hi'>('en');
  const deepDiveRef = useRef<HTMLDivElement>(null);

  const handleCardClick = (pillar: PillarDetail) => {
    if (activePillar?.id === pillar.id) {
      setActivePillar(null);
    } else {
      setActivePillar(pillar);
      setTimeout(() => {
        deepDiveRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 50);
    }
  };

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>

      {/* ═══ HERO SECTION (Translucent overlay so the polar compass watermark is clearly visible) ═══ */}
      <div style={{ position: 'relative', minHeight: '400px', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
        <img
          src="/images/hero-polar.jpg"
          alt="Polar hero"
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center 30%',
            opacity: 0.12,
          }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        {/* Soft translucent gradient — keeps the background polar watermark visible at the start of the page */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(240,249,255,0.35) 0%, rgba(240,249,255,0.1) 60%, transparent 100%)',
        }} />

        {/* Hero content */}
        <div style={{
          position: 'relative', zIndex: 2, width: '100%', textAlign: 'center',
          maxWidth: '1520px', margin: '0 auto',
          padding: 'clamp(5rem,8vw,7rem) clamp(1.2rem,3vw,3rem)',
        }}>
          {/* Eyebrow */}
          <div className="section-eyebrow" style={{ marginBottom: '18px' }}>
            <span className="eyebrow-dot" />
            <span>{lang === 'en' ? 'Our Foundation' : 'हमारी नींव'}</span>
          </div>

          {/* Main heading */}
          <h1 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(2.6rem,6vw,4.2rem)', fontWeight: 800,
            lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: '18px',
          }}>
            <span style={{ color: '#0F172A' }}>Know About </span>
            <span className="dhruva-brand-text">DHRUVA</span>
          </h1>

          {/* Subheading */}
          <p style={{
            fontSize: 'clamp(0.95rem,1.8vw,1.1rem)',
            color: '#475569', lineHeight: 1.7,
            maxWidth: '680px', margin: '0 auto 36px',
          }}>
            {lang === 'en'
              ? 'Integrated Polar Science Outreach, Knowledge Repository and Media Dissemination Portal — empowering researchers, students, and citizens with verified scientific insights from India\'s Arctic and Antarctic expeditions.'
              : 'एकीकृत ध्रुवीय विज्ञान प्रसार, ज्ञान भंडार और मीडिया पोर्टल — शोधकर्ताओं, छात्रों और नागरिकों को सत्यापित वैज्ञानिक अंतर्दृष्टि प्रदान करता है।'}
          </p>

          {/* CTA buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                setCurrentTab('explore');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                height: '52px', padding: '0 28px', borderRadius: '14px',
                background: 'linear-gradient(135deg, #0284C7, #0369A1)',
                color: '#FFFFFF', fontWeight: 700, fontSize: '15px',
                border: 'none', cursor: 'pointer',
                boxShadow: '0 4px 18px rgba(2, 132, 199, 0.35)',
                fontFamily: 'var(--font-heading)', transition: 'all 0.18s ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 24px rgba(2, 132, 199, 0.5)';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 18px rgba(2, 132, 199, 0.35)';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              }}
            >
              <BookOpen size={17} />
              <span>{lang === 'en' ? 'Explore Research' : 'अनुसंधान खोजें'}</span>
            </button>

            <button
              onClick={() => {
                setCurrentTab('ask');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                height: '52px', padding: '0 28px', borderRadius: '14px',
                background: '#FFFFFF',
                color: '#0F172A', fontWeight: 600, fontSize: '15px',
                border: '1px solid #CBD5E1', cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(15, 23, 42, 0.05)',
                fontFamily: 'var(--font-heading)', transition: 'all 0.18s ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = '#0284C7';
                (e.currentTarget as HTMLElement).style.color = '#0284C7';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = '#CBD5E1';
                (e.currentTarget as HTMLElement).style.color = '#0F172A';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              }}
            >
              <Sparkles size={17} style={{ color: '#0284C7' }} />
              <span>{lang === 'en' ? <>Ask <span className="dhruva-brand-text">DHRUVA</span></> : 'ध्रुव से पूछें'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ═══ THREE PILLARS SECTION ═══ */}
      <div style={{ maxWidth: '1520px', margin: '0 auto', padding: '56px clamp(1.2rem,3vw,3rem) 0' }}>

        {/* Section header */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div className="section-eyebrow" style={{ marginBottom: '12px' }}>
            <span className="eyebrow-dot" />
            <span>Our Mission</span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.8rem,3.5vw,2.6rem)', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', marginBottom: '10px' }}>
            Three Pillars of <span className="dhruva-brand-text">DHRUVA</span>
          </h2>
          <p style={{ fontSize: '0.95rem', color: '#64748B', lineHeight: 1.6 }}>
            Click on any card to open the live station telemetry, verifiable AI metrics, and national outreach showcase below.
          </p>
        </div>

        {/* 3 Workable Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '24px', marginBottom: '32px' }}>
          {PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            const isSelected = activePillar?.id === pillar.id;

            return (
              <div
                key={pillar.id}
                onClick={() => handleCardClick(pillar)}
                style={{
                  borderRadius: '18px',
                  overflow: 'hidden',
                  background: 'rgba(255, 255, 255, 0.94)',
                  border: isSelected
                    ? `2.5px solid ${pillar.accent}`
                    : '1px solid rgba(14, 116, 144, 0.18)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  boxShadow: isSelected
                    ? `0 18px 45px ${pillar.accent}30`
                    : '0 8px 30px rgba(15, 23, 42, 0.06)',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  transform: isSelected ? 'translateY(-6px)' : 'none',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-6px)';
                    (e.currentTarget as HTMLElement).style.borderColor = pillar.accent;
                    (e.currentTarget as HTMLElement).style.boxShadow = `0 18px 45px rgba(15, 23, 42, 0.12)`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(14, 116, 144, 0.18)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 30px rgba(15, 23, 42, 0.06)';
                  }
                }}
              >
                {/* Card image */}
                <div style={{ position: 'relative', height: '170px', overflow: 'hidden', flexShrink: 0 }}>
                  <img
                    src={pillar.img}
                    alt={pillar.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', transition: 'transform 0.4s ease' }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 20%, rgba(15, 23, 42, 0.4) 100%)' }} />

                  {/* Top-Right Badge */}
                  <div style={{
                    position: 'absolute', top: '12px', right: '12px',
                    fontSize: '9.5px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase',
                    color: isSelected ? '#FFFFFF' : '#0F172A',
                    background: isSelected ? pillar.accent : 'rgba(255, 255, 255, 0.92)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(148, 163, 184, 0.35)', borderRadius: '6px', padding: '4px 10px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    transition: 'all 0.2s ease',
                  }}>
                    {pillar.badge}
                  </div>

                  {/* Floating icon */}
                  <div style={{
                    position: 'absolute', bottom: '-20px', left: '20px',
                    width: '46px', height: '46px', borderRadius: '13px',
                    background: isSelected ? pillar.accent : '#FFFFFF',
                    border: `2px solid ${pillar.accent}`,
                    boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: isSelected ? '#FFFFFF' : pillar.accent,
                    zIndex: 2,
                    transition: 'all 0.2s ease',
                  }}>
                    <Icon size={22} style={{ color: isSelected ? '#FFFFFF' : pillar.accent }} />
                  </div>
                </div>

                {/* Card body */}
                <div style={{ padding: '34px 22px 22px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', marginBottom: '10px', fontFamily: 'var(--font-heading)', letterSpacing: '-0.01em' }}>
                    {pillar.title}
                  </h3>
                  <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.65, flex: 1 }}>
                    {pillar.desc}
                  </p>

                  {/* Bottom link action */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '20px', paddingTop: '14px', borderTop: '1px solid rgba(226, 232, 240, 0.8)' }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (pillar.linkTab === 'about') {
                          handleCardClick(pillar);
                        } else {
                          setCurrentTab(pillar.linkTab);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                        fontSize: '13.5px', fontWeight: 700, color: pillar.accent,
                        transition: 'gap 0.15s ease',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.gap = '10px'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.gap = '6px'; }}
                    >
                      <span>{pillar.linkLabel}</span>
                      <ArrowRight size={14} />
                    </button>

                    <span style={{ fontSize: '11px', color: isSelected ? pillar.accent : '#94A3B8', fontWeight: 700 }}>
                      {isSelected ? '● Panel Open' : 'Click to View →'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ═══ INLINE EXPANDED DEEP-DIVE SECTION (Scrolls seamlessly in the page flow without any modal lock bugs) ═══ */}
        {activePillar && (
          <div
            ref={deepDiveRef}
            style={{
              marginBottom: '54px',
              background: '#FFFFFF',
              border: `2px solid ${activePillar.accent}40`,
              borderRadius: '24px',
              padding: 'clamp(24px, 3.5vw, 36px)',
              boxShadow: `0 20px 50px ${activePillar.accent}18, 0 4px 18px rgba(15, 23, 42, 0.04)`,
              position: 'relative',
              animation: 'fadeIn 0.25s ease-out',
            }}
          >
            {/* Top Toolbar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    padding: '5px 14px',
                    borderRadius: '9999px',
                    background: `${activePillar.accent}15`,
                    border: `1.5px solid ${activePillar.accent}40`,
                    color: activePillar.accent,
                  }}
                >
                  {activePillar.badge}
                </span>
                <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>
                  {activePillar.tagline}
                </span>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setActivePillar(null)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 16px',
                  borderRadius: '9999px',
                  background: '#F1F5F9',
                  border: '1px solid #CBD5E1',
                  color: '#475569',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = '#E2E8F0';
                  (e.currentTarget as HTMLElement).style.color = '#0F172A';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = '#F1F5F9';
                  (e.currentTarget as HTMLElement).style.color = '#475569';
                }}
              >
                <X size={15} />
                <span>Close Deep Dive</span>
              </button>
            </div>

            {/* Title & Overview Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px', marginBottom: '28px' }}>
              <div>
                <h2
                  style={{
                    fontSize: 'clamp(1.5rem, 2.8vw, 2.1rem)',
                    fontWeight: 800,
                    color: '#0F172A',
                    lineHeight: 1.25,
                    marginBottom: '14px',
                    fontFamily: 'var(--font-heading)',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {activePillar.title}
                </h2>
                <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.75, marginBottom: '20px' }}>
                  {activePillar.deepDive.overview}
                </p>

                {/* Bilingual interactive box for Pillar 3 */}
                {activePillar.id === 'bilingual-outreach' && (
                  <div
                    style={{
                      background: 'rgba(5, 150, 105, 0.05)',
                      border: '1px solid rgba(5, 150, 105, 0.25)',
                      borderRadius: '16px',
                      padding: '16px 20px',
                      marginTop: '16px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: '#059669' }}>
                        <Languages size={16} />
                        <span>Live Bilingual Translation Showcase</span>
                      </div>
                      <div style={{ display: 'flex', gap: '4px', background: '#FFFFFF', padding: '3px', borderRadius: '8px', border: '1px solid #CBD5E1' }}>
                        <button
                          type="button"
                          onClick={() => setBilingualPreview('en')}
                          style={{
                            padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, border: 'none', cursor: 'pointer',
                            background: bilingualPreview === 'en' ? '#059669' : 'transparent',
                            color: bilingualPreview === 'en' ? '#FFFFFF' : '#64748B',
                          }}
                        >
                          English
                        </button>
                        <button
                          type="button"
                          onClick={() => setBilingualPreview('hi')}
                          style={{
                            padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, border: 'none', cursor: 'pointer',
                            background: bilingualPreview === 'hi' ? '#059669' : 'transparent',
                            color: bilingualPreview === 'hi' ? '#FFFFFF' : '#64748B',
                          }}
                        >
                          हिन्दी
                        </button>
                      </div>
                    </div>

                    <div style={{ background: '#FFFFFF', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(5, 150, 105, 0.15)', fontSize: '13px', color: '#1E293B', lineHeight: 1.6 }}>
                      {bilingualPreview === 'en' ? (
                        <>
                          <strong>English Abstract Brief:</strong> "Continuous satellite interferometry reveals accelerated grounding line retreat in Dronning Maud Land, while sub-ice shelf mooring sensors measure basal melt rates of 1.4 m/year."
                        </>
                      ) : (
                        <>
                          <strong>हिन्दी अनुवाद सार:</strong> "सतत उपग्रह इंटरफेरोमेट्री द्रोणिंग मौड लैंड में त्वरित ग्राउंडिंग रेखा के पीछे हटने को दर्शाती है, जबकि उप-हिम शेल्फ मूरिंग सेंसर 1.4 मीटर/वर्ष की आधारीय पिघलन दर दर्ज करते हैं।"
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Station / Telemetry image with overlay */}
              <div
                style={{
                  height: '260px',
                  borderRadius: '18px',
                  overflow: 'hidden',
                  position: 'relative',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
                }}
              >
                <img
                  src={activePillar.img}
                  alt={activePillar.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to top, rgba(15, 23, 42, 0.8) 0%, transparent 60%)',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: '16px',
                    left: '18px',
                    right: '18px',
                    color: '#FFFFFF',
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#38BDF8', marginBottom: '4px' }}>
                    Scientific Grounding & Telemetry
                  </div>
                  <div style={{ fontSize: '13.5px', fontWeight: 600, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                    {activePillar.desc}
                  </div>
                </div>
              </div>
            </div>

            {/* 3 Metrics Callouts */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '16px',
                marginBottom: '26px',
              }}
            >
              {activePillar.deepDive.metrics.map((m, idx) => (
                <div
                  key={idx}
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '16px',
                    padding: '16px 18px',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, marginBottom: '6px' }}>
                    {m.label}
                  </span>
                  <span style={{ fontSize: '1.55rem', fontWeight: 800, color: activePillar.accent, fontFamily: 'var(--font-heading)', lineHeight: 1.1, marginBottom: '4px' }}>
                    {m.value}
                  </span>
                  <span style={{ fontSize: '11.5px', color: '#64748B', lineHeight: 1.45 }}>
                    {m.detail}
                  </span>
                </div>
              ))}
            </div>

            {/* Key Technical Capabilities */}
            <div style={{ marginBottom: '26px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#0F172A', marginBottom: '14px' }}>
                Operational & Scientific Capabilities
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '12px' }}>
                {activePillar.deepDive.features.map((feat, fIdx) => (
                  <div
                    key={fIdx}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      background: '#F8FAFC',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '1px solid #E2E8F0',
                    }}
                  >
                    <CheckCircle2 size={16} style={{ color: activePillar.accent, marginTop: '2px', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', marginBottom: '3px' }}>
                        {feat.title}
                      </div>
                      <div style={{ fontSize: '12.5px', color: '#475569', lineHeight: 1.5 }}>
                        {feat.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Actions Row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '14px',
                borderTop: '1px solid #E2E8F0',
                paddingTop: '20px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', gap: '10px' }}>
                {PILLARS.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleCardClick(p)}
                    style={{
                      padding: '7px 14px',
                      borderRadius: '9999px',
                      fontSize: '12px',
                      fontWeight: 700,
                      border: p.id === activePillar.id ? `1.5px solid ${p.accent}` : '1px solid #CBD5E1',
                      background: p.id === activePillar.id ? `${p.accent}15` : '#F8FAFC',
                      color: p.id === activePillar.id ? p.accent : '#64748B',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {p.title}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {activePillar.deepDive.actionSecondary && (
                  <button
                    type="button"
                    onClick={() => {
                      const tab = activePillar.deepDive.actionSecondary!.tab;
                      setCurrentTab(tab);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    style={{
                      padding: '11px 20px',
                      borderRadius: '12px',
                      background: '#F1F5F9',
                      color: '#0F172A',
                      fontWeight: 700,
                      fontSize: '13px',
                      border: '1px solid #CBD5E1',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#E2E8F0'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#F1F5F9'; }}
                  >
                    {activePillar.deepDive.actionSecondary.label}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    const tab = activePillar.deepDive.actionPrimary.tab;
                    setCurrentTab(tab);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '11px 22px',
                    borderRadius: '12px',
                    background: `linear-gradient(135deg, ${activePillar.accent}, #0369A1)`,
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '13.5px',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: `0 4px 16px ${activePillar.accent}45`,
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = `0 6px 22px ${activePillar.accent}65`;
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 16px ${activePillar.accent}45`;
                    (e.currentTarget as HTMLElement).style.transform = 'none';
                  }}
                >
                  <span>{activePillar.deepDive.actionPrimary.label}</span>
                  <ExternalLink size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══ TIMELINE ═══ */}
        <section style={{ marginBottom: '0' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div className="section-eyebrow" style={{ marginBottom: '14px' }}>
              <span className="eyebrow-dot" />
              <span>OUR JOURNEY</span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2rem,4vw,2.9rem)', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', marginBottom: '10px' }}>
              India in the Polar Realms
            </h2>
            <p style={{ fontSize: '0.95rem', color: '#64748B', lineHeight: 1.6 }}>
              Four decades of sustained high-latitude exploration and scientific stewardship.
            </p>
          </div>

          {/* Connector line + dots */}
          <div style={{ position: 'relative', marginBottom: '8px' }}>
            <div style={{
              position: 'absolute', top: '13px', left: 0, right: 0, height: '2px',
              background: 'linear-gradient(90deg, transparent 0%, rgba(2, 132, 199, 0.4) 10%, rgba(2, 132, 199, 0.4) 90%, transparent 100%)',
              zIndex: 0,
            }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: '16px', position: 'relative', zIndex: 1 }}>
              {MILESTONES.map((m) => (
                <div key={m.year} style={{ display: 'flex', justifyContent: 'center' }}>
                  <div style={{
                    width: '26px', height: '26px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #0284C7, #0369A1)',
                    border: '3px solid #FFFFFF',
                    boxShadow: '0 2px 8px rgba(2, 132, 199, 0.35)',
                  }} />
                </div>
              ))}
            </div>
          </div>

          {/* Milestone cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: '16px', marginBottom: '48px' }}>
            {MILESTONES.map((m) => (
              <div
                key={m.year}
                style={{
                  borderRadius: '12px', overflow: 'hidden',
                  background: 'rgba(255, 255, 255, 0.92)',
                  border: '1px solid rgba(14, 116, 144, 0.16)',
                  boxShadow: '0 4px 16px rgba(15, 23, 42, 0.05)',
                  backdropFilter: 'blur(16px)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(2, 132, 199, 0.45)';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(14, 116, 144, 0.16)';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                }}
              >
                <div style={{ height: '80px', overflow: 'hidden', position: 'relative' }}>
                  <img src={m.img} alt={m.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.15)' }} />
                  <div style={{
                    position: 'absolute', top: '6px', right: '6px',
                    fontSize: '8px', fontWeight: 700, letterSpacing: '0.15em',
                    color: '#0F172A', background: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid rgba(148, 163, 184, 0.3)', borderRadius: '4px', padding: '2px 6px',
                  }}>
                    {m.phase}
                  </div>
                </div>
                <div style={{ padding: '12px' }}>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#0284C7', fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em', marginBottom: '4px', lineHeight: 1 }}>
                    {m.year}
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#0F172A', marginBottom: '5px', lineHeight: 1.3 }}>
                    {m.title}
                  </div>
                  <p style={{ fontSize: '10px', color: '#64748B', lineHeight: 1.5, margin: 0 }}>
                    {m.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

    </div>
  );
};
