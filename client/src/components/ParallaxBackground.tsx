import React from 'react';

export const ParallaxBackground: React.FC = () => {
  return (
    <div 
      className="fixed inset-0 w-full h-full pointer-events-none overflow-hidden select-none"
      style={{ 
        zIndex: -1,
        willChange: 'transform',
        transform: 'translateZ(0)'
      }}
      aria-hidden="true"
    >
      {/* Pristine Polar Base Gradient */}
      <div 
        className="absolute inset-0 w-full h-full"
        style={{
          background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 45%, #F0F7FF 100%)',
        }}
      />

      {/* Subtle Polar Frost Ambient Radial Gradients */}
      <div 
        className="absolute inset-0 w-full h-full"
        style={{
          background: `
            radial-gradient(ellipse at 50% 10%, rgba(14, 165, 233, 0.05) 0%, transparent 60%),
            radial-gradient(ellipse at 85% 45%, rgba(2, 132, 199, 0.04) 0%, transparent 50%),
            radial-gradient(ellipse at 15% 85%, rgba(59, 130, 246, 0.04) 0%, transparent 50%)
          `
        }}
      />

      {/* ═══ 1. TOP-RIGHT POLAR COMPASS & ASTROLABE WATERMARK (Visible at the start of every page) ═══ */}
      <div 
        className="absolute"
        style={{
          top: '-40px',
          right: '2%',
          width: 'clamp(360px, 42vw, 560px)',
          height: 'clamp(360px, 42vw, 560px)',
          opacity: 0.16,
          color: '#0284C7',
          transform: 'rotate(-12deg)',
          transition: 'opacity 0.3s ease',
        }}
      >
        <svg viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
          {/* Outer Degree Track Ring */}
          <circle cx="250" cy="250" r="235" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 4" />
          <circle cx="250" cy="250" r="225" stroke="currentColor" strokeWidth="2.5" />
          <circle cx="250" cy="250" r="215" stroke="currentColor" strokeWidth="1" strokeDasharray="8 8" />

          {/* Latitude Concentric Coordinate Rings */}
          <circle cx="250" cy="250" r="175" stroke="currentColor" strokeWidth="1.2" strokeDasharray="5 5" />
          <circle cx="250" cy="250" r="130" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="250" cy="250" r="85" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
          <circle cx="250" cy="250" r="40" stroke="currentColor" strokeWidth="1.5" />

          {/* Crosshair Axes */}
          <line x1="10" y1="250" x2="490" y2="250" stroke="currentColor" strokeWidth="1.5" strokeDasharray="6 4" />
          <line x1="250" y1="10" x2="250" y2="490" stroke="currentColor" strokeWidth="1.5" strokeDasharray="6 4" />

          {/* Diagonal Radial Guidance Lines */}
          <line x1="80" y1="80" x2="420" y2="420" stroke="currentColor" strokeWidth="1" strokeDasharray="4 6" />
          <line x1="420" y1="80" x2="80" y2="420" stroke="currentColor" strokeWidth="1" strokeDasharray="4 6" />

          {/* Cardinal Directions */}
          <text x="250" y="32" textAnchor="middle" fill="currentColor" fontSize="16" fontWeight="800" fontFamily="sans-serif">N</text>
          <text x="250" y="482" textAnchor="middle" fill="currentColor" fontSize="16" fontWeight="800" fontFamily="sans-serif">S</text>
          <text x="475" y="255" textAnchor="middle" fill="currentColor" fontSize="16" fontWeight="800" fontFamily="sans-serif">E</text>
          <text x="25" y="255" textAnchor="middle" fill="currentColor" fontSize="16" fontWeight="800" fontFamily="sans-serif">W</text>

          {/* Station Coordinates Inscribed in Compass */}
          <text x="250" y="105" textAnchor="middle" fill="currentColor" fontSize="9" fontWeight="700" letterSpacing="2" fontFamily="sans-serif">HIMADRI 78°55′N</text>
          <text x="250" y="380" textAnchor="middle" fill="currentColor" fontSize="9" fontWeight="700" letterSpacing="2" fontFamily="sans-serif">MAITRI 70°45′S</text>
          <text x="250" y="405" textAnchor="middle" fill="currentColor" fontSize="9" fontWeight="700" letterSpacing="2" fontFamily="sans-serif">BHARATI 69°24′S</text>

          {/* Center Polar Compass Rose Star */}
          <polygon points="250,210 258,242 290,250 258,258 250,290 242,258 210,250 242,242" fill="currentColor" opacity="0.85" />
          <polygon points="250,225 255,245 275,250 255,255 250,275 245,255 225,250 245,245" fill="#FFFFFF" opacity="0.6" />
        </svg>
      </div>

      {/* ═══ 2. PRIMARY CENTERED FULL-SITE DHRUVA LOGO WATERMARK ═══ */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          className="relative flex items-center justify-center"
          style={{
            width: 'min(640px, 82vw)',
            height: 'min(640px, 82vw)',
          }}
        >
          {/* Circular Coordinate Halo behind logo */}
          <div 
            className="absolute inset-0 rounded-full"
            style={{
              border: '1.5px dashed rgba(2, 132, 199, 0.12)',
              animation: 'spin 120s linear infinite',
            }}
          />
          <div 
            className="absolute rounded-full"
            style={{
              inset: '12%',
              border: '1px solid rgba(14, 165, 233, 0.09)',
            }}
          />

          <img
            src="/images/dhruva-logo.png"
            alt="DHRUVA Watermark"
            className="w-full h-full object-contain"
            style={{
              opacity: 0.13,
              filter: 'contrast(1.2) brightness(0.92)',
            }}
          />
        </div>
      </div>

      {/* ═══ 3. BOTTOM-LEFT POLAR RANGE WATERMARK ═══ */}
      <div 
        className="absolute"
        style={{
          bottom: '-80px',
          left: '-80px',
          width: '420px',
          height: '420px',
          opacity: 0.12,
          color: '#0284C7',
        }}
      >
        <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
          <circle cx="80" cy="320" r="300" stroke="currentColor" strokeWidth="1.5" strokeDasharray="6 6" />
          <circle cx="80" cy="320" r="220" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="80" cy="320" r="140" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
          <text x="210" y="315" fill="currentColor" fontSize="10" fontWeight="700" letterSpacing="1">1000 KM</text>
          <text x="290" y="315" fill="currentColor" fontSize="10" fontWeight="700" letterSpacing="1">2000 KM</text>
          <text x="370" y="315" fill="currentColor" fontSize="10" fontWeight="700" letterSpacing="1">3000 KM</text>
        </svg>
      </div>

      {/* ═══ 4. BOTTOM-RIGHT DECORATIVE DHRUVA TEXT & POLAR COORDINATES ═══ */}
      <div className="absolute -bottom-6 right-4 lg:right-12 select-none pointer-events-none opacity-[0.11] flex flex-col items-end">
        <span 
          className="text-7xl sm:text-8xl lg:text-9xl font-black tracking-widest text-sky-900 leading-none"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          DHRUVA
        </span>
        <span 
          className="text-xs sm:text-sm font-bold tracking-[0.3em] text-sky-800 uppercase mt-1 mr-2"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          INDIAN POLAR SCIENCE PORTAL • 90°N / 90°S
        </span>
      </div>
    </div>
  );
};
