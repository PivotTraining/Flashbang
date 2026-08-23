import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Group } from "three";
import { playerTransform } from "./playerTransform";
import { useCombatStore, registerDistanceGetter } from "../combat/combatStore";
import { decideAction, desiredApproach, DIFFICULTY } from "../ai/enemyAI";
import ArmoredFighter from "../characters/ArmoredFighter";

export const enemyTransform = {
  position: new THREE.Vector3(0, 0, -4),
  facingYaw: Math.PI,
};

const ARENA_RADIUS = 9;
const config = DIFFICULTY.pro;

export default function Enemy() {
  const groupRef = useRef<Group>(null);
  const actionRef = useRef<Group>(null);
  const decisionTimer = useRef(0);
  const strideTime = useRef(0);

  useEffect(() => {
    registerDistanceGetter(() => playerTransform.position.distanceTo(enemyTransform.position));
    return () => registerDistanceGetter(() => 99);
  }, []);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const store = useCombatStore.getState();
    const { enemy, player, hitstop, roundOver } = store;

    if (hitstop > 0 || roundOver) {
      applyVisual();
      return;
    }

    const toPlayer = new THREE.Vector3().copy(playerTransform.position).sub(enemyTransform.position);
    toPlayer.y = 0;
    const distance = toPlayer.length();
    if (distance > 0.001) toPlayer.normalize();

    enemyTransform.facingYaw = Math.atan2(toPlayer.x, toPlayer.z);

    if (enemy.phase !== "down") {
      const approach = desiredApproach(enemy, distance, config);
      if (approach !== 0) {
        enemyTransform.position.addScaledVector(toPlayer, approach * dt);
        strideTime.current += dt * 10;
      } else {
        strideTime.current += dt * 1.8;
      }

      if (enemy.knockback > 0.01) enemyTransform.position.addScaledVector(toPlayer, -enemy.knockback * dt);

      const radial = Math.hypot(enemyTransform.position.x, enemyTransform.position.z);
      if (radial > ARENA_RADIUS) {
        enemyTransform.position.setX((enemyTransform.position.x / radial) * ARENA_RADIUS).setZ((enemyTransform.position.z / radial) * ARENA_RADIUS);
      }

      decisionTimer.current -= dt;
      if (decisionTimer.current <= 0) {
        decisionTimer.current = config.decisionInterval;
        const action = decideAction({ self: enemy, opponent: player, distance, config, random: Math.random });
        if (action.kind === "attack") store.tryMove("enemy", action.moveId);
        else if (action.kind === "guard") store.setGuard("enemy", action.on);
      }
    }

    applyVisual();

    function applyVisual() {
      const e = useCombatStore.getState().enemy;
      const node = actionRef.current;
      if (node) {
        const idleBob = Math.abs(Math.sin(strideTime.current)) * (e.phase === "idle" ? 0.025 : 0.045);
        let targetY = idleBob;
        let targetZ = 0;
        let targetXRot = e.guarding ? -0.18 : 0;
        let targetYRot = 0;
        let targetZRot = 0;
        let targetScaleY = 1;

        if (e.moveId) {
          const active = e.phase === "active";
          const windup = e.phase === "windup";
          if (e.moveId === "roundKick") {
            targetYRot = active ? 0.95 : windup ? -0.42 : -0.12;
            targetZRot = active ? 0.18 : 0;
            targetZ = active ? 0.48 : -0.12;
          } else if (e.moveId === "spinKick") {
            targetYRot = active ? -Math.PI * 1.25 : windup ? 0.65 : -0.25;
            targetZ = active ? 0.38 : 0;
          } else if (e.moveId === "risingKick") {
            targetY = active ? 0.72 : windup ? -0.12 : 0.25;
            targetXRot = active ? -0.5 : windup ? 0.35 : 0;
            targetScaleY = active ? 1.08 : 0.96;
          } else if (e.moveId === "legSweep") {
            targetY = windup ? -0.34 : active ? -0.24 : 0;
            targetXRot = 0.36;
            targetYRot = active ? 1.35 : 0.45;
            targetScaleY = 0.82;
          } else if (e.moveId === "ballThrow") {
            targetXRot = windup ? 0.42 : active ? -0.48 : 0;
            targetZ = active ? 0.72 : -0.18;
          }
        }

        if (e.phase === "stagger") {
          targetXRot = 0.5;
          targetZ = -0.28;
          targetZRot = 0.16;
        }
        if (e.phase === "down") {
          targetZRot = -Math.PI / 2.05;
          targetY = -0.55;
        }

        node.position.y = THREE.MathUtils.lerp(node.position.y, targetY, 0.38);
        node.position.z = THREE.MathUtils.lerp(node.position.z, targetZ, 0.42);
        node.rotation.x = THREE.MathUtils.lerp(node.rotation.x, targetXRot, 0.4);
        node.rotation.y = THREE.MathUtils.lerp(node.rotation.y, targetYRot, 0.48);
        node.rotation.z = THREE.MathUtils.lerp(node.rotation.z, targetZRot, 0.4);
        const sy = THREE.MathUtils.lerp(node.scale.y, targetScaleY, 0.35);
        node.scale.set(1, sy, 1);
      }

      if (groupRef.current) {
        groupRef.current.position.copy(enemyTransform.position);
        groupRef.current.rotation.y = enemyTransform.facingYaw;
      }
    }
  });

  return (
    <group ref={groupRef}>
      <group ref={actionRef}>
        <ArmoredFighter energy="#ff4d6d" armorColor="#5a2740" idleMotion={false} showOrb={false} showCape />
      </group>
    </group>
  );
}
