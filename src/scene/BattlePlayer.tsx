import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Group } from "three";
import { playerTransform } from "./playerTransform";
import { enemyTransform } from "./Enemy";
import { useMovementInput } from "../input/useKeyboard";
import { useCombatStore } from "../combat/combatStore";
import RiggedFighter from "../characters/RiggedFighter";

const MOVE_SPEED = 4.6;
const ARENA_RADIUS = 9;

export default function BattlePlayer() {
  const groupRef = useRef<Group>(null);
  const movingRef = useRef(false);
  const moveIntent = useMovementInput();

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const { player, hitstop, roundOver } = useCombatStore.getState();

    const toEnemy = new THREE.Vector3().copy(enemyTransform.position).sub(playerTransform.position);
    toEnemy.y = 0;
    if (toEnemy.lengthSq() > 0.000001) toEnemy.normalize();
    else toEnemy.set(0, 0, -1);

    playerTransform.facingYaw = Math.atan2(toEnemy.x, toEnemy.z);
    movingRef.current = false;

    if (hitstop <= 0) {
      const canMove = player.phase === "idle" && !roundOver;
      const { x, z } = moveIntent.current;

      if (canMove && (x !== 0 || z !== 0)) {
        const right = new THREE.Vector3(toEnemy.z, 0, -toEnemy.x);
        const move = new THREE.Vector3()
          .addScaledVector(toEnemy, -z)
          .addScaledVector(right, x)
          .normalize();
        const speed = player.guarding ? MOVE_SPEED * 0.45 : MOVE_SPEED;
        playerTransform.position.addScaledVector(move, speed * dt);
        movingRef.current = true;
      }

      if (player.knockback > 0.01) playerTransform.position.addScaledVector(toEnemy, -player.knockback * dt);

      const radial = Math.hypot(playerTransform.position.x, playerTransform.position.z);
      if (radial > ARENA_RADIUS) {
        playerTransform.position
          .setX((playerTransform.position.x / radial) * ARENA_RADIUS)
          .setZ((playerTransform.position.z / radial) * ARENA_RADIUS);
      }
    }

    if (groupRef.current) {
      groupRef.current.position.copy(playerTransform.position);
      groupRef.current.rotation.y = playerTransform.facingYaw;
    }
  });

  return (
    <group ref={groupRef}>
      <RiggedFighter fighterId="player" movingRef={movingRef} />
    </group>
  );
}
