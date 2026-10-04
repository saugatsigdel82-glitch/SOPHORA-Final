import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { getTerrainHeight } from './Terrain';

// Living freshwater pond shader
const livingPondVertexShader = `
  uniform float uTime;
  uniform vec2 uPondCenter;
  uniform float uPondRadius;

  varying vec3 vWorldPos;
  varying vec3 vNormal;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec4 wPos = modelMatrix * vec4(position, 1.0);
    vec2 p = wPos.xz - uPondCenter;
    float r = length(p);

    // Multi-frequency natural water waves
    float w1 = sin(p.x * 1.5 + p.y * 1.2 + uTime * 1.3) * 0.007;
    float w2 = sin(-p.x * 2.2 + p.y * 1.9 + uTime * 1.7) * 0.0045;
    float w3 = cos(r * 2.6 - uTime * 1.5) * 0.003;

    // Edge dampening: waves gently subside at the shoreline bank
    float edgeDamp = smoothstep(uPondRadius, uPondRadius - 1.2, r);
    float totalWave = (w1 + w2 + w3) * edgeDamp;

    wPos.y += totalWave;
    vWorldPos = wPos.xyz;

    // Analytical normal derivatives from wave slopes
    float dw_dx = (cos(p.x * 1.5 + p.y * 1.2 + uTime * 1.3) * 1.5 * 0.007 - cos(-p.x * 2.2 + p.y * 1.9 + uTime * 1.7) * 2.2 * 0.0045) * edgeDamp;
    float dw_dz = (cos(p.x * 1.5 + p.y * 1.2 + uTime * 1.3) * 1.2 * 0.007 + cos(-p.x * 2.2 + p.y * 1.9 + uTime * 1.7) * 1.9 * 0.0045) * edgeDamp;
    vNormal = normalize(vec3(-dw_dx, 1.0, -dw_dz));

    gl_Position = projectionMatrix * viewMatrix * wPos;
  }
`;

const livingPondFragmentShader = `
  uniform vec3 uDeepColor;
  uniform vec3 uShallowColor;
  uniform vec3 uEdgeColor;
  uniform vec3 uSkyColor;
  uniform vec3 uSunDir;
  uniform float uPondRadius;
  uniform vec2 uPondCenter;

  varying vec3 vWorldPos;
  varying vec3 vNormal;
  varying vec2 vUv;

  void main() {
    vec2 p = vWorldPos.xz - uPondCenter;
    float r = length(p);
    float depthT = clamp(r / uPondRadius, 0.0, 1.0);

    // Radial depth coloration: deep emerald pool to translucent mineral shallows
    vec3 waterCol = mix(uDeepColor, uShallowColor, smoothstep(0.12, 0.82, depthT));
    waterCol = mix(waterCol, uEdgeColor, smoothstep(0.82, 1.0, depthT));

    // View vector from water point toward camera
    vec3 viewDir = normalize(cameraPosition - vWorldPos);

    // Physical Fresnel reflection
    float NdotV = max(0.0, dot(vNormal, viewDir));
    float fresnel = pow(1.0 - NdotV, 3.6);
    fresnel = clamp(fresnel * 0.82 + 0.06, 0.0, 0.95);

    // Specular sunlight highlights
    vec3 sunDir = normalize(uSunDir);
    vec3 halfVec = normalize(sunDir + viewDir);
    float NdotH = max(0.0, dot(vNormal, halfVec));
    float spec = pow(NdotH, 130.0) * 1.8;
    vec3 sunHighlight = vec3(1.0, 0.97, 0.88) * spec;

    // Composite living water color with sky reflection and sun glints
    vec3 finalColor = mix(waterCol, uSkyColor, fresnel * 0.65) + sunHighlight;

    // Soft alpha fade at shoreline to eliminate artificial hard geometric rim
    float alpha = smoothstep(1.0, 0.95, depthT) * 0.94;

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

export const Pond: React.FC = () => {
  const { scene: rocksScene } = useGLTF('/assets/rocks.glb');

  // Shared uniforms for living freshwater shader
  const uniforms = useMemo(() => {
    return {
      uTime: { value: 0 },
      uPondCenter: { value: new THREE.Vector2(28.0, 25.0) },
      uPondRadius: { value: 13.5 },
      uDeepColor: { value: new THREE.Color('#0a1f18') },
      uShallowColor: { value: new THREE.Color('#193a2e') },
      uEdgeColor: { value: new THREE.Color('#293f31') },
      uSkyColor: { value: new THREE.Color('#829680') },
      uSunDir: { value: new THREE.Vector3(18, 28, 12).normalize() },
    };
  }, []);

  const waterMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: livingPondVertexShader,
      fragmentShader: livingPondFragmentShader,
      uniforms,
      transparent: true,
      depthWrite: true,
      depthTest: true,
    });
  }, [uniforms]);

  // Shoreline boulders and transition elements strictly seated on the dry shoreline (r: 13.6m to 15.2m from center 28, 25)
  const { boulders, bankStones, riverPebbles } = useMemo(() => {
    // 1. Primary authored large shoreline boulders framing the water margin
    const bList = [
      { x: 14.8, z: 21.5, scale: 0.26, rotY: 0.8 }, // west rim near rhino lookout
      { x: 15.2, z: 29.5, scale: 0.28, rotY: 2.1 }, // northwest bank
      { x: 19.5, z: 36.8, scale: 0.25, rotY: 1.4 }, // north bank
      { x: 28.5, z: 39.2, scale: 0.30, rotY: 3.5 }, // north tip
      { x: 38.8, z: 34.0, scale: 0.25, rotY: 0.4 }, // northeast bank
      { x: 42.0, z: 24.5, scale: 0.27, rotY: 1.9 }, // east bank
      { x: 37.5, z: 15.0, scale: 0.26, rotY: 2.7 }, // southeast bank
      { x: 28.0, z: 10.8, scale: 0.28, rotY: 1.1 }, // south bank
      { x: 18.2, z: 14.5, scale: 0.24, rotY: 2.3 }, // southwest bank
    ];

    // 2. Intermediate bank stones nestled along the dry shoreline edge
    const bsList = [
      { x: 14.5, z: 25.2, scale: 0.16, rotY: 1.2 },
      { x: 16.8, z: 33.2, scale: 0.17, rotY: 2.7 },
      { x: 23.8, z: 38.6, scale: 0.15, rotY: 0.9 },
      { x: 33.8, z: 37.5, scale: 0.16, rotY: 3.1 },
      { x: 41.2, z: 29.5, scale: 0.17, rotY: 1.7 },
      { x: 40.8, z: 19.2, scale: 0.15, rotY: 0.5 },
      { x: 33.2, z: 12.0, scale: 0.16, rotY: 2.3 },
      { x: 22.8, z: 11.5, scale: 0.15, rotY: 3.8 },
      { x: 15.8, z: 17.8, scale: 0.14, rotY: 0.7 },
    ];

    // 3. Small rounded river pebbles nestled in the dry bank loam right at the water margin
    const rpList = [
      { x: 14.4, z: 23.5, scale: 0.08, rotY: 0.4 },
      { x: 15.0, z: 27.2, scale: 0.09, rotY: 1.8 },
      { x: 17.8, z: 35.2, scale: 0.07, rotY: 2.9 },
      { x: 21.5, z: 37.8, scale: 0.08, rotY: 0.7 },
      { x: 26.2, z: 38.9, scale: 0.09, rotY: 3.2 },
      { x: 31.5, z: 38.5, scale: 0.08, rotY: 1.1 },
      { x: 36.8, z: 36.0, scale: 0.07, rotY: 2.4 },
      { x: 41.5, z: 26.8, scale: 0.09, rotY: 0.3 },
      { x: 41.0, z: 21.8, scale: 0.08, rotY: 1.6 },
      { x: 38.8, z: 17.2, scale: 0.07, rotY: 3.4 },
      { x: 35.2, z: 13.5, scale: 0.09, rotY: 2.0 },
      { x: 29.8, z: 11.2, scale: 0.08, rotY: 0.8 },
      { x: 25.5, z: 11.3, scale: 0.07, rotY: 1.5 },
      { x: 20.2, z: 12.8, scale: 0.08, rotY: 2.8 },
      { x: 16.5, z: 15.8, scale: 0.08, rotY: 1.3 },
    ];

    return { boulders: bList, bankStones: bsList, riverPebbles: rpList };
  }, []);

  // Update living water simulation time
  useFrame((state) => {
    uniforms.uTime.value = state.clock.getElapsedTime();
  });

  return (
    <group name="PondGroup">
      {/* Living organic freshwater pond surface */}
      <mesh
        position={[28, -0.48, 25]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={waterMaterial}
        receiveShadow
      >
        <circleGeometry args={[13.5, 96]} />
      </mesh>

      {/* Primary Shoreline Boulders (seated 2cm into the bank) */}
      {boulders.map((rock, idx) => {
        const y = getTerrainHeight(rock.x, rock.z);
        return (
          <primitive
            key={`boulder-${idx}`}
            object={rocksScene.clone(true)}
            position={[rock.x, y + 0.02, rock.z]}
            rotation={[0, rock.rotY, 0]}
            scale={[rock.scale, rock.scale, rock.scale]}
            castShadow
            receiveShadow
          />
        );
      })}

      {/* Intermediate Bank Stones nestled naturally along the damp edge */}
      {bankStones.map((stone, idx) => {
        const y = getTerrainHeight(stone.x, stone.z);
        return (
          <primitive
            key={`bank-stone-${idx}`}
            object={rocksScene.clone(true)}
            position={[stone.x, y + 0.015, stone.z]}
            rotation={[0.1, stone.rotY, 0.05]}
            scale={[stone.scale, stone.scale, stone.scale]}
            castShadow
            receiveShadow
          />
        );
      })}

      {/* Small river pebbles in the shallow shoreline mud */}
      {riverPebbles.map((pebble, idx) => {
        const y = getTerrainHeight(pebble.x, pebble.z);
        return (
          <primitive
            key={`pebble-${idx}`}
            object={rocksScene.clone(true)}
            position={[pebble.x, y + 0.01, pebble.z]}
            rotation={[0.2, pebble.rotY, 0.1]}
            scale={[pebble.scale, pebble.scale, pebble.scale]}
            castShadow
            receiveShadow
          />
        );
      })}
    </group>
  );
};
