import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Group } from "three";
import { playerTransform } from "./playerTransform";
import { useCombatStore, registerDistanceGetter } from "../combat/combatStore";
import { decideAction, desiredApproach, DIFFICULTY } from "../ai/enemyAI";
import RiggedFighter from "../characters/RiggedFighter";

export const enemyTransform = {
  position: new THREE.Vector3(0, 0, -4),
  facingYaw: Math.PI,
};

const ARENA_RADIUS = 9;
const config = DIFFICULTY.pro;

export default function Enemy() {
  const groupRef = useRef<Group>(null);
  const movingRef = useRef(false);
  const decisionTimer = useRef(0);

  useEffect(() => {
    registerDistanceGetter(() => playerTransform.position.distanceTo(enemyTransform.position));
    return () => registerDistanceGetter(() => 99);
  }, []);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const store = useCombatStore.getState();
    const { enemy, player, hitstop, roundOver } = store;

    const toPlayer = new THREE.Vector3().copy(playerTransform.position).sub(enemyTransform.position);
    toPlayer.y = 0;
    const distance = toPlayer.length();
    if (distance > 0.001) toPlayer.normalize();

    enemyTransform.facingYaw = Math.atan2(toPlayer.x, toPlayer.z);
    movingRef.current = false;

    if (hitstop <= 0 && !roundOver && enemy.phase !== "down") {
      const approach = desiredApproach(enemy, distance, config);
      if (approach !== 0) {
        enemyTransform.position.addScaledVector(toPlayer, approach * dt);
        movingRef.current = enemy.phase === "idle";
      }

      if (enemy.knockback > 0.01) {
        enemyTransform.position.addScaledVector(toPlayer, -enemy.knockback * dt);
      }

      const radial = Math.hypot(enemyTransform.position.x, enemyTransform.position.z);
      if (radial > ARENA_RADIUS) {
        enemyTransform.position
          .setX((enemyTransform.position.x / radial) * ARENA_RADIUS)
          .setZ((enemyTransform.position.z / radial) * ARENA_RADIUS);
      }

      decisionTimer.current -= dt;
      if (decisionTimer.current <= 0) {
        decisionTimer.current = config.decisionInterval;
        const action = decideAction({ self: enemy, opponent: player, distance, config, random: Math.random });
        if (action.kind === "attack") store.tryMove("enemy", action.moveId);
        else if (action.kind === "guard") store.setGuard("enemy", action.on);
      }
    }

    if (groupRef.current) {
      groupRef.current.position.copy(enemyTransform.position);
      groupRef.current.rotation.y = enemyTransform.facingYaw;
    }
  });

  return (
    <group ref={groupRef}>
      <RiggedFighter fighterId="enemy" energy="#ff4d6d" tint="#8f2145" movingRef={movingRef} />
    </group>
  );
}
