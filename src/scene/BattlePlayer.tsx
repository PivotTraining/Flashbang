import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Group } from "three";
import { playerTransform } from "./playerTransform";
import { enemyTransform } from "./Enemy";
import { useMovementInput } from "../input/useKeyboard";
import { useCombatStore } from "../combat/combatStore";
import { MOVES } from "../combat/moves";
import RiggedFighter from "../characters/RiggedFighter";

const MOVE_SPEED = 4.6;
const ARENA_RADIUS = 9;
const CONTACT_DISTANCE = 1.05;

export default function BattlePlayer() {
  const groupRef = useRef<Group>(null);
  const movingRef = useRef(false);
  const moveIntent = useMovementInput();

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const { player, hitstop, roundOver } = useCombatStore.getState();

    const toEnemy = new THREE.Vector3().copy(enemyTransform.position).sub(playerTransform.position);
    toEnemy.y = 0;
    const distance = toEnemy.length();
    if (distance > 0.000001) toEnemy.normalize();
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

      // Melee attacks physically step into the opponent. Root motion from the
      // imported clips is intentionally disabled, so without this the models
      // could animate a punch while their bodies stayed meters apart.
      if (!roundOver && player.moveId && MOVES[player.moveId].category !== "power" && MOVES[player.moveId].category !== "movement") {
        if ((player.phase === "windup" || player.phase === "active") && distance > CONTACT_DISTANCE) {
          const speed = player.phase === "active" ? 4.8 : 2.2;
          const step = Math.min(speed * dt, Math.max(0, distance - CONTACT_DISTANCE));
          playerTransform.position.addScaledVector(toEnemy, step);
        }
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
