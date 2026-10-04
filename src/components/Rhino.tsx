import React, { useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import { getTerrainHeight } from './Terrain';

export interface RhinoLiveState {
  position: THREE.Vector3;
  forward: THREE.Vector3;
}

// Global live state for any passive wildlife observers
export const rhinoLiveState: RhinoLiveState = {
  position: new THREE.Vector3(7.5, 0.2, -23.0),
  forward: new THREE.Vector3(0, 0, 1)
};

export const Rhino: React.FC = () => {
  const group = useRef<THREE.Group>(null);
  
  // Load animated GLB containing authentic 'walking', 'idle' skeletal clips
  const { scene, animations } = useGLTF('/assets/rhino_animated.glb');
  const { actions } = useAnimations(animations, group);

  // Depth-testing, PBR Material Enforcement & Subtle Wildlife Corneal Eye Polish
  useMemo(() => {
    // 1. Skin PBR calibration
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.renderOrder = 0;
        if (mesh.material) {
          const mat = mesh.material as THREE.MeshStandardMaterial;
          mat.transparent = false;
          mat.depthWrite = true;
          mat.depthTest = true;
          mat.roughness = 0.82; // Natural leathery rhino hide
          mat.metalness = 0.02;
          if (mat.map) {
            mat.map.colorSpace = THREE.SRGBColorSpace;
          }
        }
      }
    });

    // 2. Physical Corneal Eye Lenses
    // Attach subtle organic corneal lenses to the skeletal eye bones (L_Eye35 & R_Eye38)
    // Provides realistic specular gleam, depth, and light reaction without being cartoonish.
    const lEyeBone = scene.getObjectByName('L_Eye35');
    const rEyeBone = scene.getObjectByName('R_Eye38');

    // Subtle almond corneal lens geometry (scaled to realistic rhino ocular proportions)
    const eyeGeom = new THREE.SphereGeometry(0.042, 16, 16);
    eyeGeom.scale(1.15, 0.95, 0.85);

    const eyeMat = new THREE.MeshPhysicalMaterial({
      color: 0x140f0c, // Deep dark obsidian/amber iris
      roughness: 0.14,  // Wet cornea specular gloss
      metalness: 0.04,
      clearcoat: 0.85,
      clearcoatRoughness: 0.1,
      reflectivity: 0.6,
      depthWrite: true,
      depthTest: true,
    });

    if (lEyeBone && !lEyeBone.getObjectByName('RhinoEyeLens_L')) {
      const lEyeMesh = new THREE.Mesh(eyeGeom, eyeMat);
      lEyeMesh.name = 'RhinoEyeLens_L';
      lEyeMesh.castShadow = false;
      lEyeMesh.receiveShadow = true;
      lEyeBone.add(lEyeMesh);
    }

    if (rEyeBone && !rEyeBone.getObjectByName('RhinoEyeLens_R')) {
      const rEyeMesh = new THREE.Mesh(eyeGeom, eyeMat);
      rEyeMesh.name = 'RhinoEyeLens_R';
      rEyeMesh.castShadow = false;
      rEyeMesh.receiveShadow = true;
      rEyeBone.add(rEyeMesh);
    }
  }, [scene]);

  // Authored 3D Spline Path:
  // Forest -> Clearing -> Wildlife Trail -> Shoreline Lookout on dry land
  // NEVER enters the water (stops 1.9m back from water rim on the grassy bank)
  const { spline, pathLength } = useMemo(() => {
    const points = [
      new THREE.Vector3(7.5, 0, -23.0),   // Opening forest corridor
      new THREE.Vector3(9.2, 0, -15.5),   // Understory traversal
      new THREE.Vector3(12.0, 0, -5.5),   // Clearing entrance
      new THREE.Vector3(13.8, 0, 3.0),    // Sunlit clearing center
      new THREE.Vector3(15.2, 0, 8.5),    // Wildlife trail leading toward pond
      new THREE.Vector3(16.0, 0, 11.8),   // Shoreline approach (deceleration starts)
      new THREE.Vector3(16.8, 0, 14.2),   // Safe shoreline stopping point on dry land (dist to water center = 15.4m, water rim = 13.5m)
    ];

    const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal', 0.5);
    return { spline: curve, pathLength: curve.getLength() };
  }, []);

  // Autonomous time-based progress state (100% independent of scroll)
  const distanceRef = useRef(0);
  const yawRef = useRef(0);
  const pitchRef = useRef(0);
  const rollRef = useRef(0);
  const isStoppedRef = useRef(false);

  // Natural walking velocity: ~2.5 m/s allows the ~38.5m journey to take ~14s
  const baseSpeed = 2.45;

  useEffect(() => {
    const walkAction = actions['walking'];
    if (walkAction) {
      walkAction.reset().fadeIn(0.5).play();
      walkAction.timeScale = 1.25; // Confident natural walking stride
    }
  }, [actions]);

  useFrame((_, delta) => {
    const safeDelta = Math.min(delta, 0.1);
    const distToGoal = pathLength - distanceRef.current;

    // Movement & Deceleration logic:
    // Decelerate over the last 4.5m as the animal approaches the water
    if (distToGoal > 0.05) {
      let speed = baseSpeed;
      if (distToGoal < 4.5) {
        const factor = Math.max(0.12, distToGoal / 4.5);
        speed = baseSpeed * Math.pow(factor, 0.7);
        const walkAction = actions['walking'];
        if (walkAction) {
          walkAction.timeScale = Math.max(0.3, factor * 1.25);
        }
      }
      distanceRef.current = Math.min(pathLength, distanceRef.current + speed * safeDelta);
    } else if (!isStoppedRef.current) {
      // Arrived at dry shoreline: smooth crossfade to authentic idle animation
      isStoppedRef.current = true;
      const walkAction = actions['walking'];
      const idleAction = actions['idle'];
      if (walkAction) walkAction.fadeOut(1.2);
      if (idleAction) idleAction.reset().fadeIn(1.2).play();
    }

    const u = Math.min(1.0, distanceRef.current / pathLength);
    const pos = spline.getPointAt(u);

    // Heading calculation:
    // While walking, face along spline tangent.
    // Upon arrival, smoothly turn body/head to gaze out across the pond surface (center 28, 25)
    let targetYaw: number;
    if (isStoppedRef.current) {
      const dxWater = 28 - pos.x;
      const dzWater = 25 - pos.z;
      targetYaw = Math.atan2(dxWater, dzWater);
      yawRef.current = THREE.MathUtils.lerp(yawRef.current, targetYaw, safeDelta * 1.5);
    } else {
      const tangent = spline.getTangentAt(u).normalize();
      targetYaw = Math.atan2(tangent.x, tangent.z);
      yawRef.current = targetYaw;
    }

    // Dynamic 4-legged slope adaptation & grounding:
    // Sample front/rear feet (span ~1.3m) and left/right feet (span ~0.6m)
    const forwardX = Math.sin(yawRef.current);
    const forwardZ = Math.cos(yawRef.current);
    const frontGroundY = getTerrainHeight(pos.x + forwardX * 0.65, pos.z + forwardZ * 0.65);
    const rearGroundY = getTerrainHeight(pos.x - forwardX * 0.65, pos.z - forwardZ * 0.65);
    const avgFeetY = (frontGroundY + rearGroundY) * 0.5;

    // Rest feet firmly on the terrain
    pos.y = avgFeetY + 0.02;

    // Pitch: nose down is positive in Three.js Euler X, nose up is negative
    const targetPitch = Math.atan2(rearGroundY - frontGroundY, 1.3);
    pitchRef.current = THREE.MathUtils.lerp(pitchRef.current, targetPitch, safeDelta * 5.0);

    // Roll: sample lateral tilt
    const rightX = forwardZ;
    const rightZ = -forwardX;
    const rightGroundY = getTerrainHeight(pos.x + rightX * 0.3, pos.z + rightZ * 0.3);
    const leftGroundY = getTerrainHeight(pos.x - rightX * 0.3, pos.z - rightZ * 0.3);
    const targetRoll = Math.atan2(leftGroundY - rightGroundY, 0.6);
    rollRef.current = THREE.MathUtils.lerp(rollRef.current, targetRoll, safeDelta * 5.0);

    if (group.current) {
      group.current.position.copy(pos);
      group.current.rotation.set(pitchRef.current, yawRef.current, rollRef.current, 'YXZ');
    }

    // Update global state for any observers
    rhinoLiveState.position.copy(pos);
    rhinoLiveState.forward.set(Math.sin(yawRef.current), 0, Math.cos(yawRef.current));
  });

  return (
    <group ref={group} name="HeroRhinoGroup">
      {/* 
        Scaled to realistic white rhinoceros dimensions:
        ~4.2m length, ~1.8m height at shoulder
      */}
      <primitive
        object={scene}
        scale={[0.3, 0.3, 0.3]}
        rotation={[0, 0, 0]}
        castShadow
        receiveShadow
      />
    </group>
  );
};
