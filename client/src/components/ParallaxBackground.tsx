import React from 'react';

export const ParallaxBackground: React.FC = () => {
  return (
    <div 
      className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden select-none"
      style={{ zIndex: -10, left: 0, right: 0, top: 0, bottom: 0 }}
      aria-hidden="true"
    >
      {/* Full iceberg image covering 100% of the viewport width and entire scrollable height of the page */}
      <div
        className="w-full h-full"
        style={{
          backgroundImage: 'url(/images/iceberg-bg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
          filter: 'brightness(1.04) contrast(1.05)',
        }}
      />

      {/* Atmospheric depth overlay that preserves the vivid iceberg while enhancing text contrast */}
      <div 
        className="absolute inset-0 w-full h-full"
        style={{
          background: `
            linear-gradient(
              180deg,
              rgba(4, 10, 28, 0.06) 0%,
              rgba(4, 10, 28, 0.01) 16%,
              rgba(4, 14, 36, 0.16) 32%,
              rgba(3, 12, 34, 0.32) 60%,
              rgba(2, 8, 22, 0.68) 85%,
              rgba(1, 5, 16, 0.90) 100%
            )
          `
        }}
      />

      {/* Subtle cyan glow accent */}
      <div 
        className="absolute inset-0 w-full h-full"
        style={{
          background: `
            radial-gradient(ellipse at 50% 12%, rgba(0, 240, 255, 0.05) 0%, transparent 60%),
            radial-gradient(ellipse at 50% 55%, rgba(0, 190, 255, 0.04) 0%, transparent 65%)
          `
        }}
      />
    </div>
  );
};
