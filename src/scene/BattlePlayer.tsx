import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Group } from "three";
import { playerTransform } from "./playerTransform";
import { enemyTransform } from "./Enemy";
import { useMovementInput } from "../input/useKeyboard";
import { useCombatStore } from "../combat/combatStore";
import ArmoredFighter from "../characters/ArmoredFighter";

const MOVE_SPEED = 4.6;
const ARENA_RADIUS = 9;

// Player motor for battle. Differs from the free-roam Player in two ways:
// movement is relative to the enemy rather than the camera (so "back" always
// means away from the fight), and attack phases lock movement.
export default function BattlePlayer() {
  const groupRef = useRef<Group>(null);
  const bobRef = useRef<Group>(null);
  const moveIntent = useMovementInput();
  const strideTime = useRef(0);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const { player, hitstop, roundOver } = useCombatStore.getState();

    if (hitstop > 0) {
      applyVisual();
      return;
    }

    const toEnemy = new THREE.Vector3()
      .copy(enemyTransform.position)
      .sub(playerTransform.position);
    toEnemy.y = 0;
    if (toEnemy.lengthSq() > 0.000001) toEnemy.normalize();
    else toEnemy.set(0, 0, -1);

    playerTransform.facingYaw = Math.atan2(toEnemy.x, toEnemy.z);

    // Only neutral allows movement — committing to an attack means committing
    // to the space you're standing in.
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
      strideTime.current += dt * 9;
    } else {
      strideTime.current += dt * 1.6;
    }

    if (player.knockback > 0.01) {
      playerTransform.position.addScaledVector(toEnemy, -player.knockback * dt);
    }

    const radial = Math.hypot(playerTransform.position.x, playerTransform.position.z);
    if (radial > ARENA_RADIUS) {
      playerTransform.position
        .setX((playerTransform.position.x / radial) * ARENA_RADIUS)
        .setZ((playerTransform.position.z / radial) * ARENA_RADIUS);
    }

    applyVisual();

    function applyVisual() {
      const p = useCombatStore.getState().player;
      if (bobRef.current) {
        bobRef.current.position.y =
          Math.abs(Math.sin(strideTime.current)) * (p.phase === "idle" ? 0.02 : 0.05);

        const lean =
          p.phase === "windup"
            ? -0.2
            : p.phase === "active"
              ? 0.34
              : p.phase === "stagger"
                ? 0.45
                : p.guarding
                  ? -0.12
                  : 0;
        bobRef.current.rotation.x = THREE.MathUtils.lerp(
          bobRef.current.rotation.x,
          lean,
          0.35,
        );
        bobRef.current.rotation.z = p.phase === "down" ? Math.PI / 2.2 : 0;
      }
      if (groupRef.current) {
        groupRef.current.position.copy(playerTransform.position);
        groupRef.current.rotation.y = playerTransform.facingYaw;
      }
    }
  });

  return (
    <group ref={groupRef}>
      <group ref={bobRef}>
        <ArmoredFighter
          energy="#4da3ff"
          armorColor="#3d4a68"
          idleMotion={false}
          showOrb={false}
          showCape={false}
        />
      </group>
    </group>
  );
}
