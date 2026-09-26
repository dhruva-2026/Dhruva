import React from 'react';
import { Compass, ShieldCheck, Globe, ArrowRight, Users, FileCheck2, MapPin, BookOpen, Sparkles } from 'lucide-react';

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
    desc: "India's first Arctic research station established in Ny-Ã…lesund, Svalbard.",
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
    desc: 'Pioneering ocean observations in the Southern Ocean, advancing climate research.',
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
    accent: '#00E5FF',
  },
  {
    badge: 'VERIFIABLE CITATIONS',
    icon: ShieldCheck,
    title: 'Section-Grounded AI',
    desc: 'Strict citation governance ensuring every AI synthesis, quiz question, and flashcard cites exact paper sections and page numbers with over 90% confidence.',
    img: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=75',
    linkLabel: 'Learn More',
    linkTab: 'learn',
    accent: '#818CF8',
  },
  {
    badge: 'NATIONAL IMPACT',
    icon: Globe,
    title: 'Bilingual Outreach',
    desc: 'Comprehensive dual English and Hindi dissemination making high-level polar research intuitive and inspiring for Indian researchers and students nationwide.',
    img: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&auto=format&fit=crop&q=75',
    linkLabel: 'Our Impact',
    linkTab: 'about',
    accent: '#34D399',
  },
];

const STATS = [
  { icon: Compass,    value: '40+',                  label: 'Years of Polar Presence' },
  { icon: FileCheck2, value: '500+',                 label: 'Research Publications' },
  { icon: MapPin,     value: '2 Polar Stations',     label: 'Maitri (Antarctica) & Himadri (Arctic)' },
  { icon: Users,      value: 'Global Collaborations', label: 'Working towards a sustainable planet' },
];

export const AboutPage: React.FC<AboutPageProps> = ({ setCurrentTab, lang }) => {
  return (
    <div style={{ minHeight: '100vh' }}>

      {/* â•â•â• HERO SECTION â•â•â• */}
      <div style={{ position: 'relative', minHeight: '400px', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
        {/* Background â€” same local image, NOT changed */}
        <img
          src="/images/hero-polar.jpg"
          alt="Polar hero"
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center 30%',
            filter: 'brightness(0.55) contrast(1.1)',
          }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(2,8,28,0.4) 0%, rgba(2,8,28,0.55) 60%, rgba(2,6,23,0.98) 100%)',
        }} />

        {/* Hero content â€” centred */}
        <div style={{
          position: 'relative', zIndex: 2, width: '100%', textAlign: 'center',
          maxWidth: '1520px', margin: '0 auto',
          padding: 'clamp(5rem,8vw,7rem) clamp(1.2rem,3vw,3rem)',
        }}>
          {/* Eyebrow */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            fontSize: '11px', fontWeight: 700, letterSpacing: '0.22em',
            textTransform: 'uppercase', color: '#00E5FF', marginBottom: '18px',
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00E5FF', boxShadow: '0 0 8px #00E5FF' }} />
            {lang === 'en' ? 'Our Foundation' : 'à¤¹à¤®à¤¾à¤°à¥€ à¤¨à¥€à¤‚à¤µ'}
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00E5FF', boxShadow: '0 0 8px #00E5FF' }} />
          </div>

          {/* Main heading */}
          <h1 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(2.6rem,6vw,4.2rem)', fontWeight: 800,
            lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: '18px',
          }}>
            <span style={{ color: '#FFFFFF' }}>Know About </span>
            <span style={{
              background: 'linear-gradient(135deg,#00E5FF 0%,#38BDF8 60%,#60A5FA 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>DHRUVA</span>
          </h1>

          {/* Subheading */}
          <p style={{
            fontSize: 'clamp(0.95rem,1.8vw,1.1rem)',
            color: 'rgba(203,213,225,0.9)', lineHeight: 1.7,
            maxWidth: '620px', margin: '0 auto 36px',
          }}>
            {lang === 'en'
              ? 'Integrated Polar Science Outreach, Knowledge Repository and Media Dissemination Portal â€” empowering researchers, students, and citizens with verified scientific insights from India\'s Arctic and Antarctic expeditions.'
              : 'à¤à¤•à¥€à¤•à¥ƒà¤¤ à¤§à¥à¤°à¥à¤µà¥€à¤¯ à¤µà¤¿à¤œà¥à¤žà¤¾à¤¨ à¤ªà¥à¤°à¤¸à¤¾à¤°, à¤œà¥à¤žà¤¾à¤¨ à¤­à¤‚à¤¡à¤¾à¤° à¤”à¤° à¤®à¥€à¤¡à¤¿à¤¯à¤¾ à¤ªà¥‹à¤°à¥à¤Ÿà¤² â€” à¤¶à¥‹à¤§à¤•à¤°à¥à¤¤à¤¾à¤“à¤‚, à¤›à¤¾à¤¤à¥à¤°à¥‹à¤‚ à¤”à¤° à¤¨à¤¾à¤—à¤°à¤¿à¤•à¥‹à¤‚ à¤•à¥‹ à¤¸à¤¤à¥à¤¯à¤¾à¤ªà¤¿à¤¤ à¤µà¥ˆà¤œà¥à¤žà¤¾à¤¨à¤¿à¤• à¤…à¤‚à¤¤à¤°à¥à¤¦à¥ƒà¤·à¥à¤Ÿà¤¿ à¤ªà¥à¤°à¤¦à¤¾à¤¨ à¤•à¤°à¤¤à¤¾ à¤¹à¥ˆà¥¤'}
          </p>

          {/* CTA buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setCurrentTab('explore')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                height: '52px', padding: '0 28px', borderRadius: '14px',
                background: 'linear-gradient(135deg,#00E5FF,#0EA5E9)',
                color: '#020617', fontWeight: 700, fontSize: '15px',
                border: 'none', cursor: 'pointer',
                boxShadow: '0 4px 24px rgba(0,229,255,0.4)',
                fontFamily: 'var(--font-heading)', transition: 'all 0.18s ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 32px rgba(0,229,255,0.6)';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 24px rgba(0,229,255,0.4)';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              }}
            >
              <BookOpen size={17} />
              {lang === 'en' ? 'Explore Research' : 'à¤…à¤¨à¥à¤¸à¤‚à¤§à¤¾à¤¨ à¤–à¥‹à¤œà¥‡à¤‚'}
            </button>

            <button
              onClick={() => setCurrentTab('ask')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                height: '52px', padding: '0 28px', borderRadius: '14px',
                background: 'rgba(255,255,255,0.07)',
                color: '#E2E8F0', fontWeight: 600, fontSize: '15px',
                border: '1px solid rgba(255,255,255,0.18)', cursor: 'pointer',
                backdropFilter: 'blur(12px)',
                fontFamily: 'var(--font-heading)', transition: 'all 0.18s ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.13)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,229,255,0.4)';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.18)';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              }}
            >
              <Sparkles size={17} style={{ color: '#00E5FF' }} />
              {lang === 'en' ? 'Ask DHRUVA' : 'à¤§à¥à¤°à¥à¤µ à¤¸à¥‡ à¤ªà¥‚à¤›à¥‡à¤‚'}
            </button>
          </div>
        </div>
      </div>

      {/* â•â•â• THREE PILLARS SECTION â•â•â• */}
      <div style={{ maxWidth: '1520px', margin: '0 auto', padding: '56px clamp(1.2rem,3vw,3rem) 0' }}>

        {/* Section header */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            fontSize: '10px', fontWeight: 700, letterSpacing: '0.22em',
            textTransform: 'uppercase', color: '#00E5FF', marginBottom: '12px',
          }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#00E5FF', boxShadow: '0 0 7px #00E5FF' }} />
            Our Mission
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#00E5FF', boxShadow: '0 0 7px #00E5FF' }} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.8rem,3.5vw,2.6rem)', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em', marginBottom: '10px' }}>
            Three Pillars of <span style={{ background: 'linear-gradient(135deg,#00E5FF,#38BDF8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>DHRUVA</span>
          </h2>
          <p style={{ fontSize: '0.95rem', color: 'rgba(148,163,184,0.9)', lineHeight: 1.6 }}>
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
                  background: 'rgba(6,14,34,0.92)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                  boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
                  display: 'flex', flexDirection: 'column',
                  transition: 'transform 0.22s ease, box-shadow 0.22s ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 56px rgba(0,0,0,0.55)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 40px rgba(0,0,0,0.4)';
                }}
              >
                {/* Card image */}
                <div style={{ position: 'relative', height: '160px', overflow: 'hidden', flexShrink: 0 }}>
                  <img
                    src={pillar.img} alt={pillar.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(4,10,28,0.15) 0%, rgba(4,10,28,0.65) 100%)' }} />
                  {/* Badge */}
                  <div style={{
                    position: 'absolute', top: '12px', right: '12px',
                    fontSize: '9px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase',
                    color: '#FFFFFF', background: 'rgba(4,10,28,0.75)', backdropFilter: 'blur(8px)',
                    border: `1px solid ${pillar.accent}55`, borderRadius: '6px', padding: '4px 9px',
                  }}>
                    {pillar.badge}
                  </div>
                  {/* Floating icon */}
                  <div style={{
                    position: 'absolute', bottom: '-20px', left: '20px',
                    width: '44px', height: '44px', borderRadius: '12px',
                    background: `${pillar.accent}22`, border: `1.5px solid ${pillar.accent}66`,
                    backdropFilter: 'blur(12px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={22} style={{ color: pillar.accent }} />
                  </div>
                </div>

                {/* Card body */}
                <div style={{ padding: '32px 20px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#FFFFFF', marginBottom: '10px', fontFamily: 'var(--font-heading)', letterSpacing: '-0.01em' }}>
                    {pillar.title}
                  </h3>
                  <p style={{ fontSize: '13px', color: 'rgba(203,213,225,0.85)', lineHeight: 1.65, flex: 1 }}>
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

        {/* â•â•â• TIMELINE â•â•â• */}
        <section style={{ marginBottom: '0' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              fontSize: '10px', fontWeight: 700, letterSpacing: '0.22em',
              textTransform: 'uppercase', color: '#00E5FF', marginBottom: '14px',
            }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#00E5FF', boxShadow: '0 0 7px #00E5FF' }} />
              OUR JOURNEY
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#00E5FF', boxShadow: '0 0 7px #00E5FF' }} />
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2rem,4vw,2.9rem)', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em', marginBottom: '10px' }}>
              India in the Polar Realms
            </h2>
            <p style={{ fontSize: '0.95rem', color: 'rgba(148,163,184,0.9)', lineHeight: 1.6 }}>
              Four decades of sustained high-latitude exploration and scientific stewardship.
            </p>
          </div>

          {/* Connector line + dots */}
          <div style={{ position: 'relative', marginBottom: '8px' }}>
            <div style={{
              position: 'absolute', top: '13px', left: 0, right: 0, height: '2px',
              background: 'linear-gradient(90deg, transparent 0%, rgba(0,229,255,0.4) 10%, rgba(0,229,255,0.4) 90%, transparent 100%)',
              zIndex: 0,
            }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: '16px', position: 'relative', zIndex: 1 }}>
              {MILESTONES.map((m) => (
                <div key={m.year} style={{ display: 'flex', justifyContent: 'center' }}>
                  <div style={{
                    width: '26px', height: '26px', borderRadius: '50%',
                    background: 'linear-gradient(135deg,#00E5FF,#0EA5E9)',
                    border: '3px solid rgba(2,6,23,1)',
                    boxShadow: '0 0 14px rgba(0,229,255,0.6)',
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
                  background: 'rgba(6,14,34,0.88)',
                  border: '1px solid rgba(255,255,255,0.09)',
                  backdropFilter: 'blur(16px)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,229,255,0.35)';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.09)';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                }}
              >
                <div style={{ height: '80px', overflow: 'hidden', position: 'relative' }}>
                  <img src={m.img} alt={m.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(4,10,28,0.45)' }} />
                  <div style={{
                    position: 'absolute', top: '6px', right: '6px',
                    fontSize: '8px', fontWeight: 700, letterSpacing: '0.15em',
                    color: '#CBD5E1', background: 'rgba(4,10,28,0.8)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '2px 6px',
                  }}>
                    {m.phase}
                  </div>
                </div>
                <div style={{ padding: '12px' }}>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#00E5FF', fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em', marginBottom: '4px', lineHeight: 1 }}>
                    {m.year}
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#FFFFFF', marginBottom: '5px', lineHeight: 1.3 }}>
                    {m.title}
                  </div>
                  <p style={{ fontSize: '10px', color: 'rgba(148,163,184,0.85)', lineHeight: 1.5, margin: 0 }}>
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
