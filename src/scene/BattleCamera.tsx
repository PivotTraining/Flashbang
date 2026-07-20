import { useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { playerTransform } from "./playerTransform";
import { enemyTransform } from "./Enemy";
import { useCombatStore } from "../combat/combatStore";

// Lock-on fight camera. Frames both fighters from behind the player and
// pulls back as they separate, so the gap between them always reads.
//
// This replaces the free-orbit rig during battle for two reasons: a fight
// needs a stable read of the space between fighters, and it frees left-drag
// entirely for swipe attacks.

const MIN_DISTANCE = 4.1;
const MAX_DISTANCE = 6.8;
const HEIGHT = 2.4;
const LOOK_HEIGHT = 1.2;
// Lateral offset off the fighter-to-fighter axis. Sitting directly on that
// axis puts the player exactly in front of the enemy and hides the entire
// fight behind their back, so the camera is pushed well off to one side.
const SIDE_OFFSET = 4.5;

export default function BattleCamera() {
  const { camera } = useThree();
  const desired = useRef(new THREE.Vector3());
  const lookTarget = useRef(new THREE.Vector3());
  const shakeOffset = useRef(new THREE.Vector3());

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const { shake } = useCombatStore.getState();

    const p = playerTransform.position;
    const e = enemyTransform.position;

    // Midpoint is what the camera actually watches; the player just defines
    // which side we sit on.
    const mid = new THREE.Vector3().addVectors(p, e).multiplyScalar(0.5);

    const axis = new THREE.Vector3().subVectors(p, e);
    axis.y = 0;
    const separation = axis.length();
    if (separation > 0.001) axis.normalize();
    else axis.set(0, 0, 1);

    // Sit behind the player, on the line through both fighters, backing off
    // as they spread out.
    const dist = THREE.MathUtils.clamp(
      MIN_DISTANCE + separation * 0.55,
      MIN_DISTANCE,
      MAX_DISTANCE,
    );

    const side = new THREE.Vector3(-axis.z, 0, axis.x).multiplyScalar(SIDE_OFFSET);

    desired.current
      .copy(mid)
      .addScaledVector(axis, dist)
      .add(side)
      .add(new THREE.Vector3(0, HEIGHT, 0));

    camera.position.lerp(desired.current, Math.min(1, dt * 6));

    if (shake > 0.001) {
      // Decaying random offset. Applied after the lerp so it never becomes
      // the target the camera is easing toward.
      const mag = shake * 0.28;
      shakeOffset.current.set(
        (Math.random() - 0.5) * mag,
        (Math.random() - 0.5) * mag,
        (Math.random() - 0.5) * mag,
      );
      camera.position.add(shakeOffset.current);
    }

    lookTarget.current.lerp(
      new THREE.Vector3(mid.x, mid.y + LOOK_HEIGHT, mid.z),
      Math.min(1, dt * 8),
    );
    camera.lookAt(lookTarget.current);
  });

  return null;
}
