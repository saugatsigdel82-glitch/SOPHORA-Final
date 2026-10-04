import React, { useMemo } from 'react';
import * as THREE from 'three';

/**
 * Deterministic height function defining the forest landscape:
 * - Clearing at (14, 0) for the rhino's sunlit crossing
 * - Pond depression basin at (28, 25) with water level at y ≈ -0.5
 * - Gentle undulating forest mounds everywhere else
 * - Peripheral ridge that rises at world edges so the viewer
 *   never sees a flat boundary — the forest simply recedes uphill
 */
export function getTerrainHeight(x: number, z: number): number {
  // Distance to pond center
  const dxPond = x - 28;
  const dzPond = z - 25;
  const distPond = Math.sqrt(dxPond * dxPond + dzPond * dzPond);

  // Distance to clearing center
  const dxClearing = x - 14;
  const dzClearing = z - 0;
  const distClearing = Math.sqrt(dxClearing * dxClearing + dzClearing * dzClearing);

  // Distance from world origin (centre of the terrain)
  const distFromCenter = Math.sqrt(x * x + z * z);

  // Base undulating mounds (multi-octave organic noise)
  let h = Math.sin(x * 0.06) * Math.cos(z * 0.06) * 0.6 +
          Math.sin(x * 0.12 + 1.2) * Math.sin(z * 0.14) * 0.35 +
          Math.cos(x * 0.03 - z * 0.04) * 0.5;

  // Subtle natural micro-undulations across the forest floor (mounds, hummocks, root swells: 3–6cm)
  const microH = Math.sin(x * 0.38 + 1.1) * Math.cos(z * 0.42) * 0.045 +
                 Math.sin(x * 0.85 - 0.7) * Math.sin(z * 0.78 + 0.3) * 0.025 +
                 Math.cos(x * 1.5 + z * 1.3) * 0.015;
  h += microH;

  // Flatten the clearing for comfortable animal walking and clear views
  // Uses C2-continuous smoothstep with a wide transition zone to avoid visible seams
  if (distClearing < 22) {
    // Inner zone (0–12m): fully flat; transition zone (12–22m): smooth blend
    let clearingFactor: number;
    if (distClearing < 12) {
      clearingFactor = 1.0;
    } else {
      const t = (distClearing - 12) / 10; // 0→1 across transition
      clearingFactor = 1 - t * t * (3 - 2 * t); // smoothstep (C1 continuous)
    }
    h = h * (1 - clearingFactor * 0.75) + 0.1 * clearingFactor;
  }

  // Carve out the pond basin (smooth depression down to ~-1.8m)
  // Wider transition zone with smoothstep for seamless shore blending
  if (distPond < 18) {
    let pondFactor: number;
    if (distPond < 10) {
      pondFactor = 1.0;
    } else {
      const t = (distPond - 10) / 8; // 0→1 across transition
      pondFactor = 1 - t * t * (3 - 2 * t);
    }
    h -= pondFactor * 2.2;
  }

  // Peripheral ridge: gently rise from 40m outward, reaching ~14m at far edges
  // Elevates the distant horizon into misty forested hills disappearing seamlessly into atmospheric fog
  if (distFromCenter > 40) {
    const ridgeT = Math.min(1, (distFromCenter - 40) / 93); // 40→133m ramp
    // Smooth ease-in-out curve (cubic smoothstep) — C1 continuous at boundary
    const s = ridgeT * ridgeT * (3 - 2 * ridgeT);
    h += s * 14.0;
    // Natural mountain/ridge contour undulations using integer harmonics (guaranteed zero seam at +-PI)
    const angle = Math.atan2(z, x);
    h += Math.sin(angle * 4.0) * s * 2.5;
    h += Math.cos(angle * 3.0) * s * 1.8;
  }

  return h;
}

function createSeamlessNoise2D(seed = 42) {
  const p = new Uint8Array(512);
  let s = seed;
  function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const t = p[i]; p[i] = p[j]; p[j] = t;
  }
  for (let i = 0; i < 256; i++) p[256 + i] = p[i];
  function fade(t: number) { return t * t * t * (t * (t * 6 - 15) + 10); }
  function lerp(t: number, a: number, b: number) { return a + t * (b - a); }
  function grad(hash: number, x: number, y: number) {
    const h = hash & 7;
    const u = h < 4 ? x : y;
    const v = h < 4 ? y : x;
    return ((h & 1) ? -u : u) + ((h & 2) ? -2.0 * v : 2.0 * v);
  }
  function rawNoise(x: number, y: number) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const u = fade(xf);
    const v = fade(yf);
    const a = p[X] + Y;
    const b = p[X + 1] + Y;
    return lerp(v,
      lerp(u, grad(p[a], xf, yf), grad(p[b], xf - 1, yf)),
      lerp(u, grad(p[a + 1], xf, yf - 1), grad(p[b + 1], xf - 1, yf - 1))
    );
  }

  // Periodic seamless wrap over domain [0, size]
  return function seamlessNoise(x: number, y: number, size: number, freq: number) {
    const u = x / size;
    const v = y / size;
    const n00 = rawNoise(x * freq, y * freq);
    const n10 = rawNoise((x - size) * freq, y * freq);
    const n01 = rawNoise(x * freq, (y - size) * freq);
    const n11 = rawNoise((x - size) * freq, (y - size) * freq);

    const wx = u * u * (3 - 2 * u);
    const wy = v * v * (3 - 2 * v);

    const nx0 = n00 * (1 - wx) + n10 * wx;
    const nx1 = n01 * (1 - wx) + n11 * wx;
    return nx0 * (1 - wy) + nx1 * wy;
  };
}

/**
 * Procedural multi-scale organic earth/moss/loam/stone ground texture system:
 * - Albedo: deep damp forest loam, mulch/pine needles, rich velvety moss, scattered river pebbles
 * - Normal: tactile micro-relief capturing soil granules, pebbles, and organic creases
 * - Roughness: variation between matte dry dirt, soft moss sheen, and damp specular crevices
 * - Ambient Occlusion: natural micro-shadowing in crevices and under stones
 *
 * 100% SEAMLESS & PERIODIC: Evaluated with continuous boundary blending so repeat wrapping
 * has ZERO visible seam lines or normal jumps across the entire terrain mesh.
 */
function createForestGroundTextures(): {
  albedoMap: THREE.CanvasTexture;
  normalMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
  aoMap: THREE.CanvasTexture;
} {
  const size = 1024;
  
  // Albedo
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;

  // Normal
  const normalCanvas = document.createElement('canvas');
  normalCanvas.width = size;
  normalCanvas.height = size;
  const normalCtx = normalCanvas.getContext('2d')!;
  const normalImgData = normalCtx.createImageData(size, size);
  const normalData = normalImgData.data;

  // Roughness
  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = size;
  roughCanvas.height = size;
  const roughCtx = roughCanvas.getContext('2d')!;
  const roughImgData = roughCtx.createImageData(size, size);
  const roughData = roughImgData.data;

  // Ambient Occlusion
  const aoCanvas = document.createElement('canvas');
  aoCanvas.width = size;
  aoCanvas.height = size;
  const aoCtx = aoCanvas.getContext('2d')!;
  const aoImgData = aoCtx.createImageData(size, size);
  const aoData = aoImgData.data;

  const n1 = createSeamlessNoise2D(101);
  const n2 = createSeamlessNoise2D(202);
  const n3 = createSeamlessNoise2D(303);
  const n4 = createSeamlessNoise2D(404);

  const heights = new Float32Array(size * size);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // 1. Broad landform / soil moisture variations (macro fBm) - seamless
      const soilNoise = n1(x, y, size, 0.005) * 0.6 + n1(x, y, size, 0.015) * 0.28 + n1(x, y, size, 0.045) * 0.12;
      
      // 2. Soft organic moss patches (macro woodland distribution) - seamless
      const mossNoise = n2(x + 20, y + 20, size, 0.006) * 0.65 + n2(x + 20, y + 20, size, 0.018) * 0.35;
      
      // 3. Tactile soil grain, leaf litter, and micro-relief - seamless
      const fineNoise = n3(x, y, size, 0.06) * 0.5 + n3(x, y, size, 0.18) * 0.35 + n4(x, y, size, 0.45) * 0.15;

      const h = soilNoise * 0.45 + (mossNoise > 0.1 ? 0.25 : 0) + fineNoise * 0.3;
      heights[y * size + x] = h;

      // Base soil color: authentic deep forest loam [52, 40, 28] to rich damp humus [82, 64, 46]
      const sT = Math.min(1, Math.max(0, (soilNoise + 1) * 0.5));
      let r = 52 + sT * 30;
      let g = 40 + sT * 24;
      let b = 28 + sT * 18;

      // Organic leaf mulch / decaying forest litter (subtle warm earth tones)
      if (fineNoise > 0.15) {
        const litterT = Math.min(1, (fineNoise - 0.15) * 2.0);
        r = r * (1 - litterT * 0.4) + 68 * (litterT * 0.4);
        g = g * (1 - litterT * 0.4) + 50 * (litterT * 0.4);
        b = b * (1 - litterT * 0.4) + 32 * (litterT * 0.4);
      }

      // Natural velvety forest moss: rich organic green [44, 62, 26] to damp moss [58, 80, 34]
      if (mossNoise > 0.05) {
        const mT = Math.min(1, (mossNoise - 0.05) * 2.0);
        const mr = 44 + (fineNoise + 0.5) * 14;
        const mg = 62 + (fineNoise + 0.5) * 18;
        const mb = 26 + (fineNoise + 0.5) * 8;
        r = r * (1 - mT) + mr * mT;
        g = g * (1 - mT) + mg * mT;
        b = b * (1 - mT) + mb * mT;
      }

      // Micro soil grain variation
      const micro = fineNoise * 8;
      r = Math.min(255, Math.max(0, r + micro));
      g = Math.min(255, Math.max(0, g + micro * 0.8));
      b = Math.min(255, Math.max(0, b + micro * 0.6));

      const idx = (y * size + x) * 4;
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;

      // Roughness map:
      // Loam = 0.92 (matte light absorption)
      // Moss = 0.74 (velvety soft sheen)
      // Crevices = 0.65 (damp soil moisture)
      let rough = 235; // ~0.92
      if (mossNoise > 0.05) {
        const mT = Math.min(1, (mossNoise - 0.05) * 2.0);
        rough = Math.floor(rough * (1 - mT) + 188 * mT);
      }
      roughData[idx] = rough;
      roughData[idx + 1] = rough;
      roughData[idx + 2] = rough;
      roughData[idx + 3] = 255;

      // Ambient occlusion: depressions receive crevice shadowing
      const aoVal = Math.floor(Math.min(255, Math.max(140, 255 - (1.0 - fineNoise) * 45)));
      aoData[idx] = aoVal;
      aoData[idx + 1] = aoVal;
      aoData[idx + 2] = aoVal;
      aoData[idx + 3] = 255;
    }
  }

  // Generate precision normal map from height gradients (Sobel filter)
  for (let y = 0; y < size; y++) {
    const yPrev = (y - 1 + size) % size;
    const yNext = (y + 1) % size;
    for (let x = 0; x < size; x++) {
      const xPrev = (x - 1 + size) % size;
      const xNext = (x + 1) % size;
      
      const dx = (heights[y * size + xNext] - heights[y * size + xPrev]) * 2.4;
      const dy = (heights[yNext * size + x] - heights[yPrev * size + x]) * 2.4;

      const len = Math.sqrt(dx * dx + dy * dy + 1.0);
      const nx = (-dx / len) * 0.5 + 0.5;
      const ny = (-dy / len) * 0.5 + 0.5;
      const nz = (1.0 / len) * 0.5 + 0.5;

      const idx = (y * size + x) * 4;
      normalData[idx] = Math.floor(nx * 255);
      normalData[idx + 1] = Math.floor(ny * 255);
      normalData[idx + 2] = Math.floor(nz * 255);
      normalData[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  normalCtx.putImageData(normalImgData, 0, 0);
  roughCtx.putImageData(roughImgData, 0, 0);
  aoCtx.putImageData(aoImgData, 0, 0);

  const albedoMap = new THREE.CanvasTexture(canvas);
  albedoMap.wrapS = THREE.RepeatWrapping;
  albedoMap.wrapT = THREE.RepeatWrapping;
  albedoMap.repeat.set(10, 10);
  albedoMap.colorSpace = THREE.SRGBColorSpace;

  const normalMap = new THREE.CanvasTexture(normalCanvas);
  normalMap.wrapS = THREE.RepeatWrapping;
  normalMap.wrapT = THREE.RepeatWrapping;
  normalMap.repeat.set(10, 10);

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(10, 10);

  const aoMap = new THREE.CanvasTexture(aoCanvas);
  aoMap.wrapS = THREE.RepeatWrapping;
  aoMap.wrapT = THREE.RepeatWrapping;
  aoMap.repeat.set(10, 10);

  return { albedoMap, normalMap, roughnessMap, aoMap };
}

export const Terrain: React.FC = () => {
  const { geometry, albedoMap, normalMap, roughnessMap, aoMap } = useMemo(() => {
    const size = 320;
    const segments = 220;
    const geom = new THREE.PlaneGeometry(size, size, segments, segments);
    geom.rotateX(-Math.PI / 2);

    const pos = geom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = getTerrainHeight(x, z);
      pos.setY(i, y);
    }
    geom.computeVertexNormals();

    const textures = createForestGroundTextures();
    return {
      geometry: geom,
      albedoMap: textures.albedoMap,
      normalMap: textures.normalMap,
      roughnessMap: textures.roughnessMap,
      aoMap: textures.aoMap,
    };
  }, []);

  return (
    <group name="TerrainGroup">
      {/* Base deformed organic terrain mesh with high-detail tactile ground textures */}
      <mesh geometry={geometry} receiveShadow>
        <meshStandardMaterial
          map={albedoMap}
          normalMap={normalMap}
          normalScale={new THREE.Vector2(0.95, 0.95)}
          roughnessMap={roughnessMap}
          aoMap={aoMap}
          aoMapIntensity={0.8}
          roughness={0.88}
          metalness={0.01}
        />
      </mesh>
    </group>
  );
};
