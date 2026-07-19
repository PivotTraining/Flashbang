import * as THREE from "three";

// Shared mutable player transform, read by the camera rig and ball store
// without forcing React re-renders every frame.
export const playerTransform = {
  position: new THREE.Vector3(0, 0, 4),
  facingYaw: 0,
};

export const cameraState = {
  yaw: 0,
  pitch: 0.32,
};
