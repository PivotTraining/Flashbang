import { useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { playerTransform } from "./playerTransform";
import { enemyTransform } from "./Enemy";
import { useCombatStore } from "../combat/combatStore";

export default function BattleCamera() {
  const { camera, size } = useThree();
  const desired = useRef(new THREE.Vector3());
  const lookTarget = useRef(new THREE.Vector3());
  const shakeOffset = useRef(new THREE.Vector3());

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const { shake } = useCombatStore.getState();

    const p = playerTransform.position;
    const e = enemyTransform.position;
    const mid = new THREE.Vector3().addVectors(p, e).multiplyScalar(0.5);

    const axis = new THREE.Vector3().subVectors(p, e);
    axis.y = 0;
    const separation = axis.length();
    if (separation > 0.001) axis.normalize();
    else axis.set(0, 0, 1);

    const aspect = size.width / Math.max(1, size.height);
    const portrait = aspect < 0.92;
    const minDistance = portrait ? 6.0 : 4.7;
    const maxDistance = portrait ? 9.0 : 7.6;
    const height = portrait ? 3.25 : 2.72;
    const sideOffset = portrait ? 2.85 : 4.15;

    const dist = THREE.MathUtils.clamp(
      minDistance + separation * (portrait ? 0.62 : 0.5),
      minDistance,
      maxDistance,
    );

    const side = new THREE.Vector3(-axis.z, 0, axis.x).multiplyScalar(sideOffset);

    desired.current
      .copy(mid)
      .addScaledVector(axis, dist)
      .add(side)
      .add(new THREE.Vector3(0, height, 0));

    camera.position.lerp(desired.current, Math.min(1, dt * 5.6));

    if (camera instanceof THREE.PerspectiveCamera) {
      const targetFov = portrait ? 66 : 50;
      camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, Math.min(1, dt * 3.6));
      camera.updateProjectionMatrix();
    }

    if (shake > 0.001) {
      const mag = shake * 0.3;
      shakeOffset.current.set(
        (Math.random() - 0.5) * mag,
        (Math.random() - 0.5) * mag,
        (Math.random() - 0.5) * mag,
      );
      camera.position.add(shakeOffset.current);
    }

    const lookHeight = portrait ? 1.25 : 1.15;
    lookTarget.current.lerp(
      new THREE.Vector3(mid.x, mid.y + lookHeight, mid.z - (portrait ? 0.35 : 0.15)),
      Math.min(1, dt * 7.2),
    );
    camera.lookAt(lookTarget.current);
  });

  return null;
}
