import React from 'react';

export const Lighting: React.FC = () => {
  return (
    <>
      {/* 
        Dominant natural sunlight:
        Warm late-morning/early-afternoon sun filtering through the forest canopy.
        Shadow frustum expanded to cover the full visible terrain.
      */}
      <directionalLight
        position={[35, 50, 20]}
        intensity={3.2}
        color="#fff8ea"
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-near={5}
        shadow-camera-far={180}
        shadow-camera-left={-80}
        shadow-camera-right={80}
        shadow-camera-top={80}
        shadow-camera-bottom={-80}
        shadow-bias={-0.0003}
        shadow-normalBias={0.02}
      />

      {/* 
        Hemisphere light:
        Soft sky daylight from above, warm earthy bounce from the forest floor.
        Increased intensity ensures shadows retain rich detail and never turn black.
      */}
      <hemisphereLight
        args={['#d4ebd0', '#6b5a40', 2.5]}
      />

      {/* Ambient fill to soften foliage crevices and shadow areas */}
      <ambientLight intensity={1.2} color="#e5f2db" />
    </>
  );
};
