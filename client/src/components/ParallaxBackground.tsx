import React from 'react';

export const ParallaxBackground: React.FC = () => {
  return (
    <div 
      className="fixed inset-0 w-full h-full pointer-events-none overflow-hidden select-none"
      style={{ zIndex: -10 }}
      aria-hidden="true"
    >
      {/* Pristine White Polar Base Background */}
      <div 
        className="absolute inset-0 w-full h-full"
        style={{
          background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 45%, #F0F7FF 100%)',
        }}
      />

      {/* Subtle Polar Frost Ambient Gradients */}
      <div 
        className="absolute inset-0 w-full h-full"
        style={{
          background: `
            radial-gradient(ellipse at 50% 10%, rgba(14, 165, 233, 0.04) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 60%, rgba(2, 132, 199, 0.03) 0%, transparent 50%),
            radial-gradient(ellipse at 20% 80%, rgba(59, 130, 246, 0.03) 0%, transparent 50%)
          `
        }}
      />

      {/* Primary Centered Full-Site Watermark */}
      <div className="absolute inset-0 flex items-center justify-center">
        <img
          src="/images/dhruva-logo.png"
          alt="DHRUVA Watermark"
          className="w-[min(640px,80vw)] h-[min(640px,80vw)] object-contain"
          style={{
            opacity: 0.055,
            filter: 'contrast(1.1) brightness(0.95)',
          }}
        />
      </div>

      {/* Subtle Decorative Polar Ring Watermark in Upper Corner */}
      <div className="absolute -top-24 -right-24 opacity-[0.03] w-96 h-96 rounded-full border-[20px] border-cyan-500 pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 opacity-[0.03] w-96 h-96 rounded-full border-[20px] border-sky-500 pointer-events-none" />
    </div>
  );
};
