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

      {/* ═══ DHRUVA EMBLEM WATERMARK (Centered with Middle-Grounded Visibility) ═══ */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <img
          src="/images/dhruva-watermark.jpg"
          alt="DHRUVA Watermark"
          className="object-contain select-none pointer-events-none"
          style={{
            width: 'min(680px, 82vw)',
            maxHeight: 'min(680px, 80vh)',
            opacity: 0.16,
            mixBlendMode: 'multiply',
            filter: 'contrast(1.1) brightness(1.02)',
            transition: 'opacity 0.3s ease',
          }}
        />
      </div>
    </div>
  );
};
