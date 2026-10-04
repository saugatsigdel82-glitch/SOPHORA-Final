import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { getTerrainHeight } from './Terrain';
import { rhinoLiveState } from './Rhino';

interface VegetationProps {
  showHighDetail?: boolean;
}

// Global shared foliage uniforms for GPU vertex deflection
const foliageUniforms = {
  uRhinoPos: { value: new THREE.Vector3(14, 0.2, -2) },
  uRhinoDir: { value: new THREE.Vector3(0, 0, 1) },
  uTime: { value: 0 },
};

function optimizeFoliageMaterials(root: THREE.Object3D) {
  root.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(fixMat);
      } else if (mesh.material) {
        fixMat(mesh.material);
      }
    }
  });
}

function fixMat(mat: THREE.Material) {
  const stdMat = mat as THREE.MeshStandardMaterial;
  if (stdMat.map) {
    stdMat.map.colorSpace = THREE.SRGBColorSpace;
  }
  
  const name = (stdMat.name || '').toLowerCase();
  const isTrunkOrLog = name.includes('trunk') || name.includes('bark') || name.includes('log') || name.includes('rock');
  
  if (isTrunkOrLog) {
    stdMat.transparent = false;
    stdMat.depthWrite = true;
    stdMat.depthTest = true;
    stdMat.roughness = 0.88;
    stdMat.metalness = 0.02;
  } else {
    // All foliage (fern beech, fern 3d, jungle tree, tree canopy):
    // 1. Enforce alphaTest + depthWrite: true so every leaf pixel is solid in depth buffer.
    // 2. Inject GPU vertex deflection: root grounding lock + physical rhino deflection field + ambient breeze.
    stdMat.transparent = false;
    stdMat.alphaTest = 0.48;
    stdMat.depthWrite = true;
    stdMat.depthTest = true;
    stdMat.side = THREE.DoubleSide;
    stdMat.shadowSide = THREE.DoubleSide;
    stdMat.roughness = 0.68;
    stdMat.metalness = 0.0;

    stdMat.onBeforeCompile = (shader) => {
      shader.uniforms.uRhinoPos = foliageUniforms.uRhinoPos;
      shader.uniforms.uRhinoDir = foliageUniforms.uRhinoDir;
      shader.uniforms.uTime = foliageUniforms.uTime;

      shader.vertexShader = `
        uniform vec3 uRhinoPos;
        uniform vec3 uRhinoDir;
        uniform float uTime;
      \n` + shader.vertexShader;

      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>

        // World coordinates of this foliage vertex
        vec4 folWorld = modelMatrix * vec4(position, 1.0);

        // Root grounding factor:
        // Vertices at base/root level (position.y near 0 or negative) have heightFactor = 0.
        // Therefore, plant bases are 100% physically locked into the soil without floating or shifting!
        float hFactor = clamp((position.y + 0.04) * 1.8, 0.0, 1.0);
        hFactor = hFactor * hFactor; // Quadratic curve: rigid base, flexible frond tips

        // Subtle ambient natural forest breeze
        float breeze = sin(uTime * 1.5 + folWorld.x * 0.7 + folWorld.z * 0.5) * 0.018 * hFactor;
        transformed.x += breeze;
        transformed.z += breeze * 0.6;

        // Rhino physical interaction field:
        vec2 toPlant = folWorld.xz - uRhinoPos.xz;
        float distToRhino = length(toPlant);
        float radius = 2.4; // 2.4m influence field around the rhino

        if (distToRhino < radius && distToRhino > 0.04) {
          float push = (1.0 - distToRhino / radius);
          push = push * push; // Smooth quadratic falloff

          vec2 outwardDir = normalize(toPlant);
          vec2 fwdDir = normalize(uRhinoDir.xz + vec2(0.0001, 0.0001));

          // Physical directional deflection: blends outward push with rhino movement direction
          vec2 reactDir = normalize(outwardDir * 0.75 + fwdDir * 0.45);

          // World deflection strength (~0.35m max deflection at frond tips)
          float worldDispStrength = push * 0.35 * hFactor;
          vec3 worldDisp = vec3(reactDir.x * worldDispStrength, -push * 0.16 * hFactor, reactDir.y * worldDispStrength);

          // Transform world displacement to local vertex space
          mat3 invMat = inverse(mat3(modelMatrix));
          transformed += invMat * worldDisp;
        }
        `
      );
    };
  }
}

// Seeded pseudo-random for deterministic vegetation placement
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

export const Vegetation: React.FC<VegetationProps> = () => {
  // Load real GLB models
  const { scene: realisticTreeScene } = useGLTF('/assets/tree_realistic.glb');
  const { scene: jungleTreeScene } = useGLTF('/assets/jungle_tree.glb');
  const { scene: beechFernScene } = useGLTF('/assets/fern_beech.glb');
  const { scene: fern3dScene } = useGLTF('/assets/fern_3d.glb');
  const { scene: mossyLogScene } = useGLTF('/assets/log_mossy.glb');

  useMemo(() => {
    optimizeFoliageMaterials(realisticTreeScene);
    optimizeFoliageMaterials(jungleTreeScene);
    optimizeFoliageMaterials(beechFernScene);
    optimizeFoliageMaterials(fern3dScene);
    optimizeFoliageMaterials(mossyLogScene);
  }, [realisticTreeScene, jungleTreeScene, beechFernScene, fern3dScene, mossyLogScene]);

  // ─── CORE AUTHORED LARGE CANOPY TREES ───
  // These define forest boundaries, corridors, and shot framing
  const largeTrees = useMemo(() => {
    return [
      // Foreground framing trees (Shot 1 Establishing)
      { x: -3.5, z: -24, scale: 1.25, rotY: 0.5 },
      { x: 9.5, z: -20, scale: 1.15, rotY: 2.3 },

      // Left flank (Zone A / forest edge)
      { x: -6, z: -15, scale: 1.1, rotY: 0.8 },
      { x: -10, z: -5, scale: 1.3, rotY: 2.1 },
      { x: -5, z: 8, scale: 1.2, rotY: 1.4 },
      { x: -8, z: 22, scale: 1.0, rotY: 3.5 },
      { x: -4, z: 35, scale: 1.25, rotY: 0.2 },

      // Right flank (framing clearing & pond)
      { x: 30, z: -22, scale: 1.15, rotY: 2.9 },
      { x: 26, z: -10, scale: 1.3, rotY: 0.5 },
      { x: 32, z: 5, scale: 1.2, rotY: 1.7 },
      { x: 42, z: 20, scale: 1.4, rotY: 4.1 },
      { x: 38, z: 36, scale: 1.1, rotY: 2.3 },

      // Background depth (Zone E / canopy horizon)
      { x: 8, z: -38, scale: 1.35, rotY: 1.1 },
      { x: 20, z: -35, scale: 1.2, rotY: 2.8 },
      { x: -18, z: -18, scale: 1.4, rotY: 0.4 },
      { x: -15, z: 12, scale: 1.3, rotY: 3.2 },
      { x: 12, z: 46, scale: 1.25, rotY: 1.9 },
      { x: 26, z: 48, scale: 1.3, rotY: 0.7 },
      { x: 45, z: -5, scale: 1.5, rotY: 2.0 },
    ];
  }, []);

  // ─── BOUNDARY-ENCLOSING TREES ───
  // Placed on the peripheral ridge (50m–125m from origin)
  // Multi-layered dense rings seal all sightlines into layered morning forest canopy silhouettes
  const boundaryTrees = useMemo(() => {
    const rng = seededRandom(42);
    const list: { x: number; z: number; scale: number; rotY: number; isJungle: boolean }[] = [];
    
    // Ring 1 at ~50-65m radius (dense inner boundary)
    for (let angle = 0; angle < Math.PI * 2; angle += 0.20) {
      const r = 50 + rng() * 15;
      const x = Math.cos(angle + rng() * 0.1) * r;
      const z = Math.sin(angle + rng() * 0.1) * r;
      list.push({
        x, z,
        scale: 1.1 + rng() * 0.6,
        rotY: rng() * 6.28,
        isJungle: rng() > 0.5
      });
    }
    
    // Ring 2 at ~70-90m radius (dense middle ridge)
    for (let angle = 0; angle < Math.PI * 2; angle += 0.22) {
      const r = 70 + rng() * 20;
      const x = Math.cos(angle + rng() * 0.12) * r;
      const z = Math.sin(angle + rng() * 0.12) * r;
      list.push({
        x, z,
        scale: 1.3 + rng() * 0.7,
        rotY: rng() * 6.28,
        isJungle: rng() > 0.45
      });
    }

    // Ring 3 at ~95-125m radius (deep canopy silhouettes dissolving into mist)
    for (let angle = 0; angle < Math.PI * 2; angle += 0.26) {
      const r = 95 + rng() * 28;
      const x = Math.cos(angle + rng() * 0.15) * r;
      const z = Math.sin(angle + rng() * 0.15) * r;
      list.push({
        x, z,
        scale: 1.5 + rng() * 0.8,
        rotY: rng() * 6.28,
        isJungle: rng() > 0.4
      });
    }

    return list;
  }, []);

  // ─── MID-STORY JUNGLE TREES ───
  const jungleTrees = useMemo(() => {
    return [
      { x: -1.0, z: -21, scale: 1.5, rotY: 1.1 },
      { x: 6.5, z: -17, scale: 1.6, rotY: 2.8 },
      { x: 1, z: -12, scale: 1.6, rotY: 0.3 },
      { x: -2, z: -2, scale: 1.8, rotY: 2.2 },
      { x: 2, z: 10, scale: 1.7, rotY: 1.5 },
      { x: 3, z: 24, scale: 1.9, rotY: 4.0 },
      { x: 24, z: -18, scale: 1.5, rotY: 0.9 },
      { x: 22, z: -4, scale: 1.6, rotY: 3.1 },
      { x: 36, z: 12, scale: 1.75, rotY: 2.6 },
      { x: 18, z: 38, scale: 1.8, rotY: 1.2 },
      { x: 34, z: 30, scale: 1.65, rotY: 3.7 },
      { x: -12, z: 2, scale: 1.9, rotY: 0.5 },
    ];
  }, []);

  // ─── MOSSY STORYTELLING LOGS ───
  // Strong, naturally fallen nurse logs partially embedded in earth
  const mossyLogs = useMemo(() => {
    return [
      // 1. Foreground storytelling log framing Shot 1 & 2
      { x: -3.2, z: -24.8, scale: 0.95, rotY: 0.45, rotZ: 0.02 },
      // 2. Midground fallen log bordering the sunlit clearing
      { x: 6.2, z: -6.5, scale: 1.15, rotY: 1.65, rotZ: 0.03 },
      // 3. Shoreline fallen log near pond margin
      { x: 20.8, z: 12.8, scale: 1.05, rotY: -0.75, rotZ: -0.02 },
      // 4. Trail-side ancient fallen trunk
      { x: 17.5, z: -14.2, scale: 0.9, rotY: 2.15, rotZ: 0.02 },
    ];
  }, []);

  // ─── CLUSTERED FERNS ───
  // At tree roots, log edges, clearing borders, pond shoreline, and along trails
  const ferns = useMemo(() => {
    const list: { x: number; z: number; scale: number; rotX: number; rotY: number; rotZ: number; isBeech: boolean }[] = [];
    const rng = seededRandom(137);
    
    // Near each large tree (3 ferns per tree nestled at roots)
    largeTrees.forEach(t => {
      list.push(
        { x: t.x + 1.8, z: t.z + 1.2, scale: 0.052, rotX: (rng() - 0.5) * 0.18, rotY: rng() * 6.28, rotZ: (rng() - 0.5) * 0.18, isBeech: true },
        { x: t.x - 1.5, z: t.z - 0.8, scale: 0.19, rotX: (rng() - 0.5) * 0.18, rotY: rng() * 6.28, rotZ: (rng() - 0.5) * 0.18, isBeech: false },
        { x: t.x + 0.8, z: t.z - 1.6, scale: 0.048, rotX: (rng() - 0.5) * 0.18, rotY: rng() * 6.28, rotZ: (rng() - 0.5) * 0.18, isBeech: true }
      );
    });

    // Foreground aisle ferns (Shot 1 & Shot 2 framing)
    const foregroundPoints = [
      { x: -2.2, z: -24.5 }, { x: -1.0, z: -22.5 }, { x: 0.6, z: -24.0 },
      { x: 3.2, z: -22.8 }, { x: 6.2, z: -20.5 }, { x: 8.4, z: -19.5 },
      { x: 2.5, z: -16.0 }, { x: -0.5, z: -14.0 }, { x: 5.0, z: -13.5 }
    ];
    foregroundPoints.forEach(pt => {
      const isBeech = rng() > 0.45;
      list.push({
        x: pt.x + (rng() - 0.5) * 0.8,
        z: pt.z + (rng() - 0.5) * 0.8,
        scale: isBeech ? (0.045 + rng() * 0.02) : (0.17 + rng() * 0.06),
        rotX: (rng() - 0.5) * 0.2,
        rotY: rng() * 6.28,
        rotZ: (rng() - 0.5) * 0.2,
        isBeech
      });
    });

    // Along clearing borders
    const clearingEdge = [
      { x: 7, z: -8 }, { x: 9, z: -4 }, { x: 7, z: 4 }, { x: 9, z: 10 },
      { x: 21, z: -4 }, { x: 23, z: 2 }, { x: 21, z: 8 }, { x: 18, z: -12 },
      { x: 14, z: -15 }, { x: 11, z: 14 }, { x: 16, z: 18 },
      { x: 5, z: -2 }, { x: 5, z: 6 }, { x: 24, z: 10 }, { x: 19, z: -7 },
      { x: 10, z: -10 }, { x: 17, z: 12 }, { x: 6, z: 16 },
    ];
    clearingEdge.forEach(pt => {
      const isBeech = rng() > 0.4;
      list.push({
        x: pt.x + (rng() - 0.5) * 1.5,
        z: pt.z + (rng() - 0.5) * 1.5,
        scale: isBeech ? (0.045 + rng() * 0.02) : (0.16 + rng() * 0.06),
        rotX: (rng() - 0.5) * 0.2,
        rotY: rng() * 6.28,
        rotZ: (rng() - 0.5) * 0.2,
        isBeech
      });
    });

    // Around pond shoreline (water rim at radius ~13.5 around [28, 25])
    const pondAngles = [0.2, 0.5, 0.9, 1.3, 1.7, 2.1, 2.5, 2.9, 3.3, 3.7, 4.2, 4.7, 5.2, 5.7, 6.1];
    pondAngles.forEach(ang => {
      const r = 13.0 + rng() * 2.5;
      const isBeech = rng() > 0.35;
      list.push({
        x: 28 + Math.cos(ang) * r,
        z: 25 + Math.sin(ang) * r,
        scale: isBeech ? (0.05 + rng() * 0.025) : (0.18 + rng() * 0.06),
        rotX: (rng() - 0.5) * 0.2,
        rotY: rng() * 6.28,
        rotZ: (rng() - 0.5) * 0.2,
        isBeech
      });
    });

    // Trail-side ferns directly flanking the rhino's path through the forest into the clearing
    const trailPoints = [
      { x: 7.8, z: -21 },
      { x: 9.0, z: -16 },
      { x: 10.8, z: -11 },
      { x: 12.2, z: -6 },
      { x: 13.5, z: 0 },
      { x: 14.5, z: 5.5 },
      { x: 15.6, z: 9.5 },
      { x: 16.4, z: 12.5 },
    ];
    trailPoints.forEach(pt => {
      const isBeech1 = rng() > 0.45;
      const isBeech2 = rng() > 0.45;
      // Fern on left flank of trail (within physical brushing distance: ~1.2m)
      list.push({
        x: pt.x - 1.35 + (rng() - 0.5) * 0.4,
        z: pt.z + (rng() - 0.5) * 0.8,
        scale: isBeech1 ? (0.046 + rng() * 0.02) : (0.17 + rng() * 0.05),
        rotX: (rng() - 0.5) * 0.18,
        rotY: rng() * 6.28,
        rotZ: (rng() - 0.5) * 0.18,
        isBeech: isBeech1
      });
      // Fern on right flank of trail (within physical brushing distance: ~1.2m)
      list.push({
        x: pt.x + 1.35 + (rng() - 0.5) * 0.4,
        z: pt.z + (rng() - 0.5) * 0.8,
        scale: isBeech2 ? (0.046 + rng() * 0.02) : (0.17 + rng() * 0.05),
        rotX: (rng() - 0.5) * 0.18,
        rotY: rng() * 6.28,
        rotZ: (rng() - 0.5) * 0.18,
        isBeech: isBeech2
      });
    });

    return list;
  }, [largeTrees]);

  // Synchronize dynamic GPU foliage deflection uniforms every frame
  useFrame((state) => {
    foliageUniforms.uTime.value = state.clock.getElapsedTime();
    foliageUniforms.uRhinoPos.value.copy(rhinoLiveState.position);
    foliageUniforms.uRhinoDir.value.copy(rhinoLiveState.forward);
  });

  return (
    <group name="VegetationGroup">
      {/* Realistic Large Canopy Trees */}
      {largeTrees.map((tree, idx) => {
        const y = getTerrainHeight(tree.x, tree.z);
        return (
          <primitive
            key={`large-tree-${idx}`}
            object={realisticTreeScene.clone(true)}
            position={[tree.x, y - 0.4, tree.z]}
            rotation={[0, tree.rotY, 0]}
            scale={[tree.scale, tree.scale, tree.scale]}
            castShadow
            receiveShadow
          />
        );
      })}

      {/* Tropical Mid-story Jungle Trees */}
      {jungleTrees.map((jtree, idx) => {
        const y = getTerrainHeight(jtree.x, jtree.z);
        return (
          <primitive
            key={`jungle-tree-${idx}`}
            object={jungleTreeScene.clone(true)}
            position={[jtree.x, y - 0.2, jtree.z]}
            rotation={[0, jtree.rotY, 0]}
            scale={[jtree.scale, jtree.scale, jtree.scale]}
            castShadow
            receiveShadow
          />
        );
      })}

      {/* Boundary-Enclosing Trees (seal sightlines) */}
      {boundaryTrees.map((bt, idx) => {
        const y = getTerrainHeight(bt.x, bt.z);
        const scene = bt.isJungle ? jungleTreeScene : realisticTreeScene;
        return (
          <primitive
            key={`boundary-tree-${idx}`}
            object={scene.clone(true)}
            position={[bt.x, y - 0.4, bt.z]}
            rotation={[0, bt.rotY, 0]}
            scale={[bt.scale, bt.scale, bt.scale]}
          />
        );
      })}

      {/* Mossy Storytelling Logs (embedded naturally in soil) */}
      {mossyLogs.map((log, idx) => {
        const y = getTerrainHeight(log.x, log.z);
        return (
          <primitive
            key={`mossy-log-${idx}`}
            object={mossyLogScene.clone(true)}
            position={[log.x, y - 0.06, log.z]}
            rotation={[0, log.rotY, log.rotZ]}
            scale={[log.scale, log.scale, log.scale]}
            castShadow
            receiveShadow
          />
        );
      })}

      {/* Clustered 3D Ferns (Beech & Forest Ferns) */}
      {ferns.map((fern, idx) => {
        const y = getTerrainHeight(fern.x, fern.z);
        const obj = fern.isBeech ? beechFernScene.clone(true) : fern3dScene.clone(true);
        // Fronds emerge directly from within the soil - lower base/roots buried to prevent floating
        const yOffset = fern.isBeech ? -0.07 : -0.06;
        return (
          <primitive
            key={`fern-${idx}`}
            object={obj}
            position={[fern.x, y + yOffset, fern.z]}
            rotation={[fern.rotX, fern.rotY, fern.rotZ]}
            scale={[fern.scale, fern.scale, fern.scale]}
            castShadow
            receiveShadow
          />
        );
      })}
    </group>
  );
};
