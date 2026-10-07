import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

const MAX_PARTICLES = 24;

/**
 * Cinematic Mouse Particle Trail
 *
 * Requirements:
 * - Subtle luxury/atmospheric glowing particle/sparkle trail
 * - Soft fade, short lifetime (~0.6s), low particle count (max 24)
 * - Dust / sunlight catching the air
 * - Zero React state updates / zero re-renders
 * - Reused particle objects in fixed array (zero GC in hot loop)
 * - Disabled on touch / coarse pointer devices
 * - Loop sleeps when particles are idle (0% idle CPU)
 */
export const MouseTrail: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // Check for touch / coarse pointer
    const isTouch =
      window.matchMedia('(pointer: coarse)').matches ||
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0;

    if (isTouch) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize, { passive: true });

    // Pre-allocated object pool
    const pool: Particle[] = Array.from({ length: MAX_PARTICLES }, () => ({
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: 1,
      size: 1.5,
    }));

    let nextIndex = 0;
    let activeCount = 0;
    let animId: number | null = null;
    let lastX = -1;
    let lastY = -1;
    let lastTime = performance.now();

    const spawnParticle = (x: number, y: number) => {
      const p = pool[nextIndex];
      nextIndex = (nextIndex + 1) % MAX_PARTICLES;

      p.x = x + (Math.random() - 0.5) * 6;
      p.y = y + (Math.random() - 0.5) * 6;
      // Gentle air draft: slight upward drift and lateral float
      p.vx = (Math.random() - 0.5) * 0.45;
      p.vy = -0.35 - Math.random() * 0.45;
      p.maxLife = 0.55 + Math.random() * 0.35;
      p.life = p.maxLife;
      p.size = 1.2 + Math.random() * 1.4;

      if (activeCount === 0 && animId === null) {
        lastTime = performance.now();
        animId = requestAnimationFrame(render);
      }
      activeCount = Math.min(MAX_PARTICLES, activeCount + 1);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX;
      const y = e.clientY;

      if (lastX === -1) {
        lastX = x;
        lastY = y;
        return;
      }

      const dx = x - lastX;
      const dy = y - lastY;
      const distSq = dx * dx + dy * dy;

      // Only spawn when moved sufficiently (avoids clustering when stationary)
      if (distSq > 100) { // ~10px movement
        spawnParticle(x, y);
        lastX = x;
        lastY = y;
      }
    };

    const render = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      ctx.clearRect(0, 0, width, height);

      let alive = 0;

      for (let i = 0; i < MAX_PARTICLES; i++) {
        const p = pool[i];
        if (p.life <= 0) continue;

        p.life -= dt;
        if (p.life > 0) {
          alive++;
          p.x += p.vx;
          p.y += p.vy;

          const progress = 1 - p.life / p.maxLife; // 0 to 1
          // Soft fade in first 15%, long soft fade out
          const alpha = progress < 0.15 ? progress / 0.15 : (1 - progress);
          const currentAlpha = Math.max(0, Math.min(0.55, alpha * 0.55));

          // Draw subtle luminous mote
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
          grad.addColorStop(0, `rgba(235, 245, 230, ${currentAlpha})`);
          grad.addColorStop(0.5, `rgba(180, 205, 175, ${currentAlpha * 0.45})`);
          grad.addColorStop(1, 'rgba(180, 205, 175, 0)');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      activeCount = alive;
      if (alive > 0) {
        animId = requestAnimationFrame(render);
      } else {
        animId = null;
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animId !== null) {
        cancelAnimationFrame(animId);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 9998,
      }}
    />
  );
};
