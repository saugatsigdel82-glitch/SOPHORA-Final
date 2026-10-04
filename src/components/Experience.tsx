import React, { Suspense } from 'react';
import { Lighting } from './Lighting';
import { Atmosphere } from './Atmosphere';
import { Terrain } from './Terrain';
import { Vegetation } from './Vegetation';
import { Rhino } from './Rhino';
import { Pond } from './Pond';
import { CinematicCamera } from './CinematicCamera';

interface ExperienceProps {
  onCinematicComplete?: () => void;
  onShotChange?: (shotIndex: number) => void;
}

export const Experience: React.FC<ExperienceProps> = ({
  onCinematicComplete,
  onShotChange,
}) => {
  return (
    <>
      <Atmosphere />
      <Lighting />
      <CinematicCamera
        onCinematicComplete={onCinematicComplete}
        onShotChange={onShotChange}
      />
      <Suspense fallback={null}>
        <Terrain />
        <Vegetation />
        <Rhino />
        <Pond />
      </Suspense>
    </>
  );
};
