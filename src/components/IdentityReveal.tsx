import React from 'react';

interface IdentityRevealProps {
  progress: number; // 0 to 1 scroll progression of 3D scene
}

export const IdentityReveal: React.FC<IdentityRevealProps> = ({ progress }) => {
  // Emergence starts around 78% (Shot 5->6 transition), reaching full opacity at 90%
  const opacity = Math.max(0, Math.min(1, (progress - 0.78) / 0.14));
  const translateY = (1 - opacity) * 28; // Subtle rise effect

  if (opacity <= 0.001) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 10,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '0 clamp(1rem, 5vw, 4rem)',
        opacity,
        transform: `translateY(${translateY}px)`,
        transition: 'opacity 0.25s ease-out, transform 0.25s ease-out',
      }}
    >
      <div
        style={{
          maxWidth: '680px',
          background: 'radial-gradient(ellipse at 20% 50%, rgba(9, 14, 10, 0.76) 0%, rgba(9, 14, 10, 0.38) 55%, transparent 100%)',
          padding: 'clamp(1.5rem, 4.5vw, 2.5rem) clamp(1.25rem, 5vw, 3rem)',
          borderRadius: '16px',
          backdropFilter: 'blur(4px)',
        }}
      >
        {/* Hero Identity Display Title */}
        <h1
          style={{
            fontFamily: "'UnifrakturCook', 'UnifrakturMaguntia', cursive, serif",
            fontWeight: 700,
            fontSize: 'clamp(2.6rem, 7vw, 5.2rem)',
            lineHeight: 1.1,
            letterSpacing: '0.04em',
            color: '#f4f7f2',
            textShadow: '0 4px 30px rgba(0, 0, 0, 0.95), 0 2px 8px rgba(0, 0, 0, 0.9)',
            marginBottom: '1rem',
          }}
        >
          SAUGAT SIGDEL
        </h1>

        {/* Founder Subtitle - Modern, clean, and understated */}
        <p
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 'clamp(0.72rem, 1.8vw, 0.92rem)',
            letterSpacing: 'clamp(0.12em, 0.4vw, 0.22em)',
            textTransform: 'uppercase',
            color: '#a3baa0',
            textShadow: '0 2px 8px rgba(0, 0, 0, 0.9)',
            margin: 0,
            lineHeight: 1.4,
          }}
        >
          Founder of CultureNest & CultureBuilds
        </p>
      </div>
    </div>
  );
};
