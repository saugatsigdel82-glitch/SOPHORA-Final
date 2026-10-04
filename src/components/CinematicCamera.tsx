import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';

interface CinematicCameraProps {
  onCinematicComplete?: () => void;
  onShotChange?: (shotIndex: number) => void;
}

interface ShotComposition {
  position: THREE.Vector3;
  target: THREE.Vector3;
}

// Six Authored Fixed World-Space Camera Compositions
const SHOTS: ShotComposition[] = [
  // SHOT 1: Wide Canopy Aisle Establishing Shot
  {
    position: new THREE.Vector3(1.5, 3.6, -28.0),
    target: new THREE.Vector3(7.0, 2.0, -14.0),
  },
  // SHOT 2: Forest Understory Traversal
  {
    position: new THREE.Vector3(4.2, 2.7, -18.5),
    target: new THREE.Vector3(10.2, 1.8, -8.0),
  },
  // SHOT 3: Sunlit Clearing Entrance
  {
    position: new THREE.Vector3(7.2, 2.2, -9.5),
    target: new THREE.Vector3(13.2, 1.5, -1.0),
  },
  // SHOT 4: Wildlife Corridor Overview
  {
    position: new THREE.Vector3(10.2, 2.3, 0.5),
    target: new THREE.Vector3(15.8, 1.3, 6.0),
  },
  // SHOT 5: Low-Angle Pond Basin Approach
  {
    position: new THREE.Vector3(12.8, 2.8, 7.5),
    target: new THREE.Vector3(19.2, 1.1, 14.5),
  },
  // SHOT 6: Elevated Sanctuary Finale
  {
    position: new THREE.Vector3(8.5, 5.4, 5.0),
    target: new THREE.Vector3(21.0, 1.1, 17.5),
  },
];

export const CinematicCamera: React.FC<CinematicCameraProps> = ({
  onCinematicComplete,
  onShotChange,
}) => {
  const { camera } = useThree();

  // Discrete Shot Index (0 to 5)
  const targetShot = useRef(0);
  const currentInterp = useRef(0); // Smooth floating index between shots
  const isCooldown = useRef(false);
  const touchStartY = useRef<number | null>(null);

  // Damped camera position and look target refs (no per-frame object allocation)
  const currentPos = useRef(new THREE.Vector3().copy(SHOTS[0].position));
  const currentTarget = useRef(new THREE.Vector3().copy(SHOTS[0].target));

  // Reusable calculation vectors
  const targetPos = useRef(new THREE.Vector3());
  const targetLook = useRef(new THREE.Vector3());

  // Discrete Step Navigation Engine
  const advanceShot = (direction: 1 | -1) => {
    if (isCooldown.current) return;

    if (direction === 1) {
      if (targetShot.current < SHOTS.length - 1) {
        targetShot.current += 1;
        isCooldown.current = true;
        onShotChange?.(targetShot.current);
        setTimeout(() => {
          isCooldown.current = false;
        }, 750); // Deliberate shot lock duration
      } else {
        // At Shot 6 and advancing: hand over to portfolio
        onCinematicComplete?.();
      }
    } else if (direction === -1) {
      if (targetShot.current > 0) {
        targetShot.current -= 1;
        isCooldown.current = true;
        onShotChange?.(targetShot.current);
        setTimeout(() => {
          isCooldown.current = false;
        }, 750);
      }
    }
  };

  useEffect(() => {
    let wheelAcc = 0;
    let wheelResetTimer: ReturnType<typeof setTimeout>;

    const handleWheel = (e: WheelEvent) => {
      // Prevent default browser continuous scroll when in 3D scene
      if (targetShot.current < SHOTS.length - 1 || e.deltaY < 0) {
        e.preventDefault();
      }

      wheelAcc += e.deltaY;
      clearTimeout(wheelResetTimer);
      wheelResetTimer = setTimeout(() => {
        wheelAcc = 0;
      }, 180);

      // Normalized threshold: one deliberate swipe advances exactly one shot
      if (wheelAcc > 32) {
        wheelAcc = 0;
        advanceShot(1);
      } else if (wheelAcc < -32) {
        wheelAcc = 0;
        advanceShot(-1);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        advanceShot(1);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        advanceShot(-1);
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartY.current === null) return;
      const dy = touchStartY.current - e.touches[0].clientY;
      if (Math.abs(dy) > 40) {
        advanceShot(dy > 0 ? 1 : -1);
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
      clearTimeout(wheelResetTimer);
    };
  }, []);

  useFrame(() => {
    // Smooth cinematic transition between discrete shots (exponential damping)
    currentInterp.current = THREE.MathUtils.lerp(
      currentInterp.current,
      targetShot.current,
      0.08
    );

    const val = currentInterp.current;
    const baseIndex = Math.min(Math.floor(val), SHOTS.length - 2);
    const nextIndex = baseIndex + 1;
    const rawT = Math.max(0, Math.min(1, val - baseIndex));

    // Smooth cubic Hermite S-curve for cinematic deceleration into shot lock
    const t = rawT * rawT * (3 - 2 * rawT);

    const shotA = SHOTS[baseIndex];
    const shotB = SHOTS[nextIndex];

    targetPos.current.lerpVectors(shotA.position, shotB.position, t);
    targetLook.current.lerpVectors(shotA.target, shotB.target, t);

    // Apply with NaN safety
    if (Number.isFinite(targetPos.current.x)) {
      currentPos.current.copy(targetPos.current);
      camera.position.copy(currentPos.current);
    }
    if (Number.isFinite(targetLook.current.x)) {
      currentTarget.current.copy(targetLook.current);
      camera.lookAt(currentTarget.current);
    }
  });

  return null;
};
