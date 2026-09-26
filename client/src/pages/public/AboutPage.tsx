import React from 'react';
import { Compass, ShieldCheck, Globe, ArrowRight, FileCheck2, MapPin, BookOpen, Sparkles } from 'lucide-react';

interface AboutPageProps {
  setCurrentTab: (tab: string) => void;
  lang: 'en' | 'hi';
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

const PILLARS = [
  {
    badge: 'STATION GROUNDED',
    icon: Compass,
    title: 'Cryospheric Integrity',
    desc: 'Continuous telemetry and field manuscripts from Himadri (Arctic) to Maitri and Bharati (Antarctica) monitoring sea ice loss, glacial calving, and global sea-level rise.',
    img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&auto=format&fit=crop&q=75',
    linkLabel: 'Explore Research',
    linkTab: 'explore',
    accent: '#0284C7',
  },
  {
    badge: 'VERIFIABLE CITATIONS',
    icon: ShieldCheck,
    title: 'Section-Grounded AI',
    desc: 'Strict citation governance ensuring every AI synthesis, quiz question, and flashcard cites exact paper sections and page numbers with over 90% confidence.',
    img: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=75',
    linkLabel: 'Learn More',
    linkTab: 'learn',
    accent: '#4338CA',
  },
  {
    badge: 'NATIONAL IMPACT',
    icon: Globe,
    title: 'Bilingual Outreach',
    desc: 'Comprehensive dual English and Hindi dissemination making high-level polar research intuitive and inspiring for Indian researchers and students nationwide.',
    img: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&auto=format&fit=crop&q=75',
    linkLabel: 'Our Impact',
    linkTab: 'about',
    accent: '#059669',
  },
];

export const AboutPage: React.FC<AboutPageProps> = ({ setCurrentTab, lang }) => {
  return (
    <div style={{ minHeight: '100vh' }}>

      {/* ═══ HERO SECTION ═══ */}
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
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(240,249,255,0.6) 0%, rgba(255,255,255,0.85) 60%, #FFFFFF 100%)',
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
            <span className="heading-gradient">DHRUVA</span>
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
              onClick={() => setCurrentTab('explore')}
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
              onClick={() => setCurrentTab('ask')}
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
              <span>{lang === 'en' ? 'Ask DHRUVA' : 'ध्रुव से पूछें'}</span>
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
            Three Pillars of <span className="heading-gradient">DHRUVA</span>
          </h2>
          <p style={{ fontSize: '0.95rem', color: '#64748B', lineHeight: 1.6 }}>
            Bridging high-latitude polar field science with open public intelligence.
          </p>
        </div>

        {/* Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '20px', marginBottom: '60px' }}>
          {PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.title}
                style={{
                  borderRadius: '16px', overflow: 'hidden',
                  background: 'rgba(255, 255, 255, 0.92)',
                  border: '1px solid rgba(14, 116, 144, 0.16)',
                  backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                  boxShadow: '0 8px 30px rgba(15, 23, 42, 0.06)',
                  display: 'flex', flexDirection: 'column',
                  transition: 'transform 0.22s ease, box-shadow 0.22s ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 40px rgba(15, 23, 42, 0.1)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 30px rgba(15, 23, 42, 0.06)';
                }}
              >
                {/* Card image */}
                <div style={{ position: 'relative', height: '160px', overflow: 'hidden', flexShrink: 0 }}>
                  <img
                    src={pillar.img} alt={pillar.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 30%, rgba(15, 23, 42, 0.3) 100%)' }} />
                  {/* Badge */}
                  <div style={{
                    position: 'absolute', top: '12px', right: '12px',
                    fontSize: '9px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase',
                    color: '#0F172A', background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(148, 163, 184, 0.3)', borderRadius: '6px', padding: '4px 9px',
                  }}>
                    {pillar.badge}
                  </div>
                  {/* Floating icon */}
                  <div style={{
                    position: 'absolute', bottom: '-20px', left: '20px',
                    width: '44px', height: '44px', borderRadius: '12px',
                    background: '#FFFFFF', border: `1.5px solid ${pillar.accent}`,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={22} style={{ color: pillar.accent }} />
                  </div>
                </div>

                {/* Card body */}
                <div style={{ padding: '32px 20px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', marginBottom: '10px', fontFamily: 'var(--font-heading)', letterSpacing: '-0.01em' }}>
                    {pillar.title}
                  </h3>
                  <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.65, flex: 1 }}>
                    {pillar.desc}
                  </p>
                  <button
                    onClick={() => setCurrentTab(pillar.linkTab)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      marginTop: '18px', background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                      fontSize: '13px', fontWeight: 700, color: pillar.accent, transition: 'gap 0.15s',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.gap = '10px'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.gap = '6px'; }}
                  >
                    {pillar.linkLabel} <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

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
