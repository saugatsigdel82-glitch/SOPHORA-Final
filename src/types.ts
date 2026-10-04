import * as THREE from 'three';

export interface CameraState {
  position: THREE.Vector3;
  target: THREE.Vector3;
  fov: number;
}

export interface RhinoTransform {
  position: THREE.Vector3;
  rotationY: number;
  forward: THREE.Vector3;
}
