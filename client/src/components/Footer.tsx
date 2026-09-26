import React from 'react';

interface FooterProps {
  lang: 'en' | 'hi';
  onNavigate?: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ lang }) => {
  return (
    <footer 
      className="relative z-20 w-full"
      style={{
        position: 'relative',
        zIndex: 20,
        width: '100%',
        marginTop: '32px',
        borderTop: '1px solid #E2E8F0',
        background: '#FFFFFF',
        color: '#64748B',
        fontSize: '12px',
        userSelect: 'none',
        boxShadow: '0 -2px 10px rgba(15, 23, 42, 0.03)'
      }}
    >
      <div 
        className="site-container-wide" 
        style={{ 
          paddingTop: '14px', 
          paddingBottom: '14px' 
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>

          {/* Brand + Subtitle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '9999px', background: '#FFFFFF', padding: '2px', border: '1px solid rgba(2, 132, 199, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
              <img src="/images/dhruva-logo.png" alt="DHRUVA Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span className="dhruva-brand-text" style={{ fontSize: '14px', fontWeight: 900, letterSpacing: '0.04em' }}>
                DHRUVA
              </span>
              <span style={{ fontSize: '9.5px', color: '#0369A1', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', background: '#F0F9FF', border: '1px solid #BAE6FD' }}>
                NCPOR • MoES
              </span>
              <span style={{ fontSize: '11px', color: '#64748B' }}>
                {lang === 'en'
                  ? 'Polar Science Outreach & Knowledge Portal'
                  : 'ध्रुवीय विज्ञान प्रसार एवं ज्ञान पोर्टल'}
              </span>
            </div>
          </div>

          {/* Copyright + PACER */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: '#64748B' }}>
            <span>© 2026 <span className="dhruva-brand-text font-bold">DHRUVA</span> | MoES, Govt. of India</span>
            <span style={{ color: '#CBD5E1' }}>•</span>
            <span style={{ color: '#0284C7', fontWeight: 600 }}>PACER</span>
          </div>

        </div>
      </div>
    </footer>
  );
};
