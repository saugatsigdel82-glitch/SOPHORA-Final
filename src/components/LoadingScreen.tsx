import React, { useState, useEffect } from 'react';
import { useProgress } from '@react-three/drei';

/**
 * Editorial Gothic Loading Screen
 *
 * Muted lime / forest-green background (#829680) matching the 3D scene atmosphere.
 *
 * Requirements:
 * - "SAUGAT SIGDEL" in refined Old English / Gothic / Blackletter typeface (white)
 * - Small flower-petal loading indicator (minimal organic floral blossom)
 * - Slow rotation while website loads
 * - Driven strictly by actual 3D scene / asset readiness (useProgress)
 * - Stops rotation and smoothly fades out when ready
 */
export const LoadingScreen: React.FC = () => {
  const { active, progress, total } = useProgress();
  const [isReady, setIsReady] = useState(false);
  const [shouldRender, setShouldRender] = useState(true);

  // Real asset-loading gate
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const isLoaded = (total > 0 && progress === 100 && !active) || (progress === 100 && !active);
    
    if (isLoaded && !isReady) {
      // Grace period for WebGL shader compilation and first frame to render
      timer = setTimeout(() => {
        setIsReady(true);
      }, 550);
    }
    return () => clearTimeout(timer);
  }, [active, progress, total, isReady]);

  // Unmount after smooth fade transition
  useEffect(() => {
    if (isReady) {
      const unmountTimer = setTimeout(() => {
        setShouldRender(false);
      }, 1250);
      return () => clearTimeout(unmountTimer);
    }
  }, [isReady]);

  if (!shouldRender) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999,
        backgroundColor: '#829680', // Exact match for atmospheric sky/fog
        opacity: isReady ? 0 : 1,
        transition: 'opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
        pointerEvents: isReady ? 'none' : 'auto',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '3.5rem 4vw',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Top Left: Saugat Sigdel in Refined Old English / Gothic / Blackletter */}
      <div style={{ zIndex: 10 }}>
        <h1
          style={{
            fontFamily: "'UnifrakturMaguntia', 'UnifrakturCook', cursive, serif",
            fontWeight: 400,
            fontSize: 'clamp(2rem, 3.8vw, 3.4rem)',
            letterSpacing: '0.04em',
            color: '#ffffff',
            margin: 0,
            lineHeight: 1.1,
            textShadow: '0 2px 12px rgba(45, 60, 45, 0.4)',
          }}
        >
          Saugat Sigdel
        </h1>
      </div>

      {/* Center: Small Flower-Petal Loading Indicator */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
        }}
      >
        <style>{`
          @keyframes sophoraFloralSpin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <svg
          width="44"
          height="44"
          viewBox="0 0 44 44"
          style={{
            display: 'block',
            animation: isReady ? 'none' : 'sophoraFloralSpin 3.8s linear infinite',
            transformOrigin: '22px 22px',
            opacity: isReady ? 0.3 : 0.95,
            transition: 'opacity 0.4s ease',
          }}
        >
          <g transform="translate(22, 22)">
            {/* Center pistil */}
            <circle cx="0" cy="0" r="1.6" fill="#ffffff" opacity="0.9" />
            {/* 6 delicate organic flower petals */}
            {[0, 60, 120, 180, 240, 300].map((deg, i) => (
              <path
                key={deg}
                d="M 0 -2.4 C -2.2 -5.5, -2.4 -11, 0 -13 C 2.4 -11, 2.2 -5.5, 0 -2.4 Z"
                transform={`rotate(${deg})`}
                fill="#ffffff"
                opacity={0.35 + (i / 5) * 0.55}
              />
            ))}
          </g>
        </svg>
      </div>

      {/* Bottom balance spacer */}
      <div style={{ height: '2rem' }} />
    </div>
  );
};
