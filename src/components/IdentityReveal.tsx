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
            fontFamily: "'Cinzel', serif",
            fontWeight: 800,
            fontSize: 'clamp(2.5rem, 7vw, 5.4rem)',
            lineHeight: 1.05,
            letterSpacing: '0.04em',
            color: '#f4f7f2',
            textShadow: '0 4px 30px rgba(0, 0, 0, 0.95), 0 2px 8px rgba(0, 0, 0, 0.9)',
            marginBottom: '1.25rem',
          }}
        >
          SAUGAT SIGDEL
        </h1>

        {/* Supporting Line / Exploration Prompt */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.65rem',
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 'clamp(0.62rem, 2.1vw, 0.8rem)',
            letterSpacing: 'clamp(0.12em, 0.5vw, 0.22em)',
            textTransform: 'uppercase',
            color: '#a3baa0',
            textShadow: '0 2px 8px rgba(0, 0, 0, 0.9)',
            whiteSpace: 'nowrap',
          }}
        >
          <span>DIVE INTO THE WORLD I'M BUILDING</span>
          <span style={{ fontSize: '1.05rem', lineHeight: 1 }}>↓</span>
        </div>
      </div>
    </div>
  );
};
