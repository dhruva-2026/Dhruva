import React from 'react';

interface FooterProps {
  lang: 'en' | 'hi';
  onNavigate?: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ lang }) => {
  return (
    <footer className="w-full mt-20 sm:mt-28 border-t border-sky-500/20 bg-[#030816]/85 backdrop-blur-md text-slate-400 text-xs select-none">
      <div className="site-container-wide py-10 sm:py-12">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">

          {/* Brand + Subtitle */}
          <div className="flex flex-col sm:flex-row items-center gap-3.5 text-center sm:text-left">
            <div className="w-10 h-10 rounded-full bg-white/95 p-0.5 border border-cyan-400/40 shadow-[0_0_12px_rgba(0,240,255,0.3)] flex items-center justify-center flex-shrink-0 overflow-hidden">
              <img src="/images/dhruva-logo.png" alt="DHRUVA Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="text-base font-extrabold tracking-wider text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                  DHRUVA
                </span>
                <span className="text-[10px] text-cyan-300 font-semibold px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30">
                  NCPOR • MoES
                </span>
              </div>
              <p className="text-[11px] text-slate-300/80 mt-0.5">
                {lang === 'en'
                  ? 'Integrated Polar Science Outreach, Knowledge Repository and Media Dissemination Portal'
                  : 'एकीकृत ध्रुवीय विज्ञान प्रसार, ज्ञान भंडार और मीडिया पोर्टल'}
              </p>
            </div>
          </div>

          {/* Copyright + PACER */}
          <div className="flex flex-col items-center sm:items-end text-center sm:text-right gap-1">
            <div className="text-[11px] text-slate-300">
              © 2026 DHRUVA | NCPOR, MoES | Government of India
            </div>
            <div className="text-[10px] text-cyan-400/90 font-medium">
              Polar Science &amp; Cryosphere Research (PACER)
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
};
