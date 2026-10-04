import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { Experience } from './components/Experience';
import { Portfolio } from './components/Portfolio';
import { LoadingScreen } from './components/LoadingScreen';

export default function App() {
  const [portfolioActive, setPortfolioActive] = useState(false);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* Fixed Fullscreen 3D Viewport */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 1,
          pointerEvents: portfolioActive ? 'none' : 'auto',
        }}
      >
        <Canvas
          shadows
          camera={{ position: [1.5, 3.6, -28], fov: 44, near: 0.1, far: 250 }}
          gl={{
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.35,
            outputColorSpace: THREE.SRGBColorSpace,
            powerPreference: 'high-performance',
          }}
          dpr={[1, 2]}
        >
          <Experience
            onCinematicComplete={() => setPortfolioActive(true)}
          />
        </Canvas>
      </div>

      {/* Discrete Full-Viewport Editorial Portfolio Cards */}
      <Portfolio
        isActive={portfolioActive}
        onReturnToScene={() => setPortfolioActive(false)}
      />

      {/* Editorial Gothic Muted-Lime Loading Screen */}
      <LoadingScreen />
    </div>
  );
}
