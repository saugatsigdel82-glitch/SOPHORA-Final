import React, { useState, useEffect, useRef } from 'react';

interface PortfolioProps {
  isActive: boolean;
  onReturnToScene?: () => void;
}

/**
 * Editorial Portfolio — Discrete Full-Viewport Card System
 *
 * Requirements:
 * - 4 Discrete Full-Screen Cards:
 *     Card 0: Identity Reveal (SAUGAT SIGDEL / DIVE INTO THE WORLD I'M BUILDING)
 *     Card 1: Signature Quote (ONLY the quote, no bio/stats/fluff)
 *     Card 2: Engineered Ventures (CultureNest & CultureBuilds, NO "FEATURED VENTURES" header)
 *     Card 3: Final Contact (Inbox visual, saugatisonfire@gmail.com, Calendly button)
 * - Each card locks into the viewport (100vw x 100vh).
 * - Normalized scroll advances one card at a time with deliberate cooldown lock.
 * - Background: Authentic rhino skin tactile editorial texture (/assets/rhino_skin_editorial.jpg).
 */
export const Portfolio: React.FC<PortfolioProps> = ({ isActive, onReturnToScene }) => {
  const [currentCard, setCurrentCard] = useState(0);
  const isTransitioning = useRef(false);
  const touchStartY = useRef<number | null>(null);

  const TOTAL_CARDS = 4;

  const navigateCard = (dir: 1 | -1) => {
    if (isTransitioning.current) return;

    if (dir === 1) {
      if (currentCard < TOTAL_CARDS - 1) {
        isTransitioning.current = true;
        setCurrentCard((prev) => prev + 1);
        setTimeout(() => {
          isTransitioning.current = false;
        }, 750); // Discrete lock duration
      }
    } else if (dir === -1) {
      if (currentCard > 0) {
        isTransitioning.current = true;
        setCurrentCard((prev) => prev - 1);
        setTimeout(() => {
          isTransitioning.current = false;
        }, 750);
      } else {
        // At Card 0 and scrolling up: return to 3D scene
        onReturnToScene?.();
      }
    }
  };

  useEffect(() => {
    if (!isActive) return;

    let wheelAcc = 0;
    let wheelTimer: ReturnType<typeof setTimeout>;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      wheelAcc += e.deltaY;
      clearTimeout(wheelTimer);
      wheelTimer = setTimeout(() => {
        wheelAcc = 0;
      }, 180);

      if (wheelAcc > 32) {
        wheelAcc = 0;
        navigateCard(1);
      } else if (wheelAcc < -32) {
        wheelAcc = 0;
        navigateCard(-1);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        navigateCard(1);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        navigateCard(-1);
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartY.current === null) return;
      const dy = touchStartY.current - e.touches[0].clientY;
      if (Math.abs(dy) > 40) {
        navigateCard(dy > 0 ? 1 : -1);
        touchStartY.current = null;
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      clearTimeout(wheelTimer);
    };
  }, [isActive, currentCard]);

  if (!isActive) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 50,
        overflow: 'hidden',
        color: '#e4ebe1',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {/* ─── SOPHISTICATED RHINO SKIN TEXTURE BACKGROUND ─── */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: "url('/assets/rhino_skin_editorial.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.95,
          zIndex: 1,
        }}
      />
      {/* Subtle deep archival tint overlay for optimal typographic legibility */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(5, 8, 6, 0.86)',
          backdropFilter: 'blur(2px)',
          zIndex: 2,
        }}
      />

      {/* ─── CARD WRAPPER WITH NATIVE CINEMATIC TRANSITIONS ─── */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          zIndex: 10,
        }}
      >
        {/* ═══ CARD 0: IDENTITY REVEAL ═══ */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 6vw',
            boxSizing: 'border-box',
            textAlign: 'center',
            opacity: currentCard === 0 ? 1 : 0,
            transform: currentCard === 0 ? 'translateY(0)' : currentCard > 0 ? 'translateY(-30px)' : 'translateY(30px)',
            transition: 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
            pointerEvents: currentCard === 0 ? 'auto' : 'none',
          }}
        >
          <h1
            style={{
              fontFamily: "'Cinzel', serif",
              fontWeight: 800,
              fontSize: 'clamp(2.8rem, 7vw, 5.8rem)',
              lineHeight: 1.05,
              letterSpacing: '0.04em',
              color: '#f4f7f2',
              textShadow: '0 4px 30px rgba(0, 0, 0, 0.95)',
              marginBottom: '1.6rem',
            }}
          >
            SAUGAT SIGDEL
          </h1>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 'clamp(0.7rem, 1.8vw, 0.9rem)',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: '#a3baa0',
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.9)',
            }}
          >
            <span>DIVE INTO THE WORLD I'M BUILDING</span>
            <span style={{ fontSize: '1.15rem' }}>↓</span>
          </div>
        </div>

        {/* ═══ CARD 1: SIGNATURE QUOTE ONLY ═══ */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 8vw',
            boxSizing: 'border-box',
            textAlign: 'center',
            opacity: currentCard === 1 ? 1 : 0,
            transform: currentCard === 1 ? 'translateY(0)' : currentCard > 1 ? 'translateY(-30px)' : 'translateY(30px)',
            transition: 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
            pointerEvents: currentCard === 1 ? 'auto' : 'none',
          }}
        >
          <div style={{ maxWidth: '980px', margin: '0 auto' }}>
            <span
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: 'clamp(2.6rem, 5vw, 4.2rem)',
                color: '#5c785a',
                lineHeight: 1,
                display: 'block',
                marginBottom: '1.5rem',
              }}
            >
              “
            </span>
            <blockquote
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: 'clamp(1.7rem, 3.4vw, 2.9rem)',
                fontWeight: 600,
                lineHeight: 1.48,
                color: '#eef4ed',
                letterSpacing: '0.02em',
                marginBottom: '2.5rem',
              }}
            >
              If you can’t change the world around you, change yourself until the world has no choice but to change with you.
            </blockquote>
            <cite
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 'clamp(0.8rem, 1.2vw, 0.95rem)',
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                color: '#8fa88a',
                fontStyle: 'normal',
              }}
            >
              — Saugat Sigdel
            </cite>
          </div>
        </div>

        {/* ═══ CARD 2: ENGINEERED VENTURES ═══ */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '40px 8vw',
            boxSizing: 'border-box',
            opacity: currentCard === 2 ? 1 : 0,
            transform: currentCard === 2 ? 'translateY(0)' : currentCard > 2 ? 'translateY(-30px)' : 'translateY(30px)',
            transition: 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
            pointerEvents: currentCard === 2 ? 'auto' : 'none',
          }}
        >
          <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
            <div style={{ marginBottom: '2.5rem', maxWidth: '720px' }}>
              <h2
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: 'clamp(2.2rem, 3.6vw, 3.4rem)',
                  fontWeight: 700,
                  color: '#f4f7f2',
                  lineHeight: 1.2,
                }}
              >
                Engineered Ventures
              </h2>
              <p style={{ color: '#8fa88a', fontSize: '1.1rem', marginTop: '0.6rem', lineHeight: 1.6 }}>
                Focused digital platforms bridging authentic cultural craft and modern web engineering.
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '2rem',
              }}
            >
              {/* CultureNest */}
              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '2.5rem 2.2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: '0.75rem',
                      letterSpacing: '0.2em',
                      color: '#9cc796',
                      textTransform: 'uppercase',
                      marginBottom: '1rem',
                    }}
                  >
                    Commerce & Cultural Craft
                  </div>
                  <h3
                    style={{
                      fontFamily: "'Cinzel', serif",
                      fontSize: '1.9rem',
                      color: '#f4f7f2',
                      marginBottom: '1rem',
                    }}
                  >
                    CultureNest
                  </h3>
                  <p style={{ color: '#9fb09c', lineHeight: 1.75, fontSize: '1.02rem' }}>
                    Connecting artisanal heritage and luxury lifestyle products from Nepal to global markets. Engineered with bespoke storefront architecture, inventory synchronicity, and authentic brand storytelling.
                  </p>
                </div>
                <div
                  style={{
                    marginTop: '2rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    gap: '0.5rem',
                    flexWrap: 'wrap',
                  }}
                >
                  {['Brand Commerce', 'Cultural Craft', 'Global Logistics'].map((tag) => (
                    <span
                      key={tag}
                      style={{
                        fontSize: '0.72rem',
                        padding: '0.3rem 0.7rem',
                        backgroundColor: 'rgba(143, 168, 138, 0.1)',
                        borderRadius: '4px',
                        color: '#c2d4be',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* CultureBuilds */}
              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '2.5rem 2.2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: '0.75rem',
                      letterSpacing: '0.2em',
                      color: '#9cc796',
                      textTransform: 'uppercase',
                      marginBottom: '1rem',
                    }}
                  >
                    Digital Engineering & Web Systems
                  </div>
                  <h3
                    style={{
                      fontFamily: "'Cinzel', serif",
                      fontSize: '1.9rem',
                      color: '#f4f7f2',
                      marginBottom: '1rem',
                    }}
                  >
                    CultureBuilds
                  </h3>
                  <p style={{ color: '#9fb09c', lineHeight: 1.75, fontSize: '1.02rem' }}>
                    High-performance web architecture, real-time 3D experiences, and modern software craftsmanship. Delivering bespoke systems for ambitious founders and enterprises.
                  </p>
                </div>
                <div
                  style={{
                    marginTop: '2rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    gap: '0.5rem',
                    flexWrap: 'wrap',
                  }}
                >
                  {['Three.js / WebGL', 'React Systems', 'Architecture'].map((tag) => (
                    <span
                      key={tag}
                      style={{
                        fontSize: '0.72rem',
                        padding: '0.3rem 0.7rem',
                        backgroundColor: 'rgba(143, 168, 138, 0.1)',
                        borderRadius: '4px',
                        color: '#c2d4be',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ CARD 3: FINAL CONTACT CARD ═══ */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 8vw',
            boxSizing: 'border-box',
            textAlign: 'center',
            opacity: currentCard === 3 ? 1 : 0,
            transform: currentCard === 3 ? 'translateY(0)' : 'translateY(30px)',
            transition: 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
            pointerEvents: currentCard === 3 ? 'auto' : 'none',
          }}
        >
          <div style={{ maxWidth: '820px', margin: '0 auto', width: '100%' }}>
            <h2
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: 'clamp(2.4rem, 4.4vw, 4rem)',
                fontWeight: 700,
                color: '#f4f7f2',
                marginBottom: '1.25rem',
                letterSpacing: '0.02em',
              }}
            >
              Let’s build something lasting.
            </h2>
            <p
              style={{
                fontSize: '1.2rem',
                lineHeight: 1.8,
                color: '#9fb09c',
                marginBottom: '2.5rem',
              }}
            >
              My inbox is open.
            </p>

            {/* Elegant Inbox/Mail Visual & Functional Email */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.85rem',
                marginBottom: '3rem',
                padding: '0.75rem 1.6rem',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#8fa88a"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ display: 'block' }}
              >
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M22 6L12 13L2 6" />
              </svg>
              <a
                href="mailto:saugatisonfire@gmail.com"
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 'clamp(1rem, 1.8vw, 1.25rem)',
                  color: '#eef4ed',
                  textDecoration: 'none',
                  letterSpacing: '0.06em',
                  transition: 'color 0.2s',
                }}
              >
                saugatisonfire@gmail.com
              </a>
            </div>

            {/* Direct Calendly Action */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '4.5rem',
              }}
            >
              <a
                href="https://calendly.com/saugatisonfire/30min"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '0.9rem',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  padding: '1.15rem 2.8rem',
                  backgroundColor: '#d4ebd0',
                  color: '#090e0a',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontWeight: 600,
                  transition: 'opacity 0.2s, transform 0.2s',
                  boxShadow: '0 4px 20px rgba(212, 235, 208, 0.2)',
                }}
              >
                Start a Conversation
              </a>
            </div>

            {/* Minimalist Colophon */}
            <div
              style={{
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                paddingTop: '2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: '#6e7e6c',
                fontSize: '0.82rem',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div>© {new Date().getFullYear()} Saugat Sigdel. All rights reserved.</div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '0.1em' }}>
                DESIGNED & CODED WITH DISCIPLINE
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
