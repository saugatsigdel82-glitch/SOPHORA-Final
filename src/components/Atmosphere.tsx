import React from 'react';

export const Atmosphere: React.FC = () => {
  return (
    <>
      {/* 
        Natural atmospheric perspective:
        Foreground (0m–36m) remains crisp and clear.
        Forest depth (38m–85m) develops soft morning mist.
        Distant canopy silhouettes (85m–128m) dissolve naturally.
        At 130m everything seamlessly merges with the background color (#829680),
        eliminating any visible world edge or artificial horizon cutoff.
      */}
      <fog attach="fog" args={['#829680', 38, 130]} />
      {/* Sky dome: unified with fog color for zero-seam atmospheric immersion */}
      <color attach="background" args={['#829680']} />
    </>
  );
};
