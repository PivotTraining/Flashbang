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
  const bobRef = useRef<Group>(null);
  const decisionTimer = useRef(0);
  const strideTime = useRef(0);

  useEffect(() => {
    registerDistanceGetter(() =>
      playerTransform.position.distanceTo(enemyTransform.position),
    );
    return () => registerDistanceGetter(() => 99);
  }, []);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const store = useCombatStore.getState();
    const { enemy, player, hitstop, roundOver } = store;

    // Hitstop freezes movement too, otherwise fighters slide during the
    // impact pause and the freeze reads as a stutter instead of a hit.
    if (hitstop > 0 || roundOver) {
      applyVisual();
      return;
    }

    const toPlayer = new THREE.Vector3()
      .copy(playerTransform.position)
      .sub(enemyTransform.position);
    toPlayer.y = 0;
    const distance = toPlayer.length();
    if (distance > 0.001) toPlayer.normalize();

    // Always face the player — a fighter that turns its back reads as broken.
    enemyTransform.facingYaw = Math.atan2(toPlayer.x, toPlayer.z);

    if (enemy.phase !== "down") {
      const approach = desiredApproach(enemy, distance, config);
      if (approach !== 0) {
        enemyTransform.position.addScaledVector(toPlayer, approach * dt);
        strideTime.current += dt * 9;
      } else {
        strideTime.current += dt * 1.6;
      }

      // Knockback pushes straight back along the facing axis.
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
        const action = decideAction({
          self: enemy,
          opponent: player,
          distance,
          config,
          random: Math.random,
        });

        if (action.kind === "attack") {
          store.tryMove("enemy", action.moveId);
        } else if (action.kind === "guard") {
          store.setGuard("enemy", action.on);
        }
      }
    }

    applyVisual();

    function applyVisual() {
      const e = useCombatStore.getState().enemy;
      if (bobRef.current) {
        const amp = e.phase === "idle" ? 0.02 : 0.05;
        bobRef.current.position.y = Math.abs(Math.sin(strideTime.current)) * amp;

        // Readable attack tells: crouch on windup, lunge on the active
        // frame, sag on stagger. Placeholder for real clips.
        const lean =
          e.phase === "windup" ? -0.18 : e.phase === "active" ? 0.3 : e.phase === "stagger" ? 0.42 : 0;
        bobRef.current.rotation.x = THREE.MathUtils.lerp(
          bobRef.current.rotation.x,
          lean,
          0.35,
        );
        bobRef.current.rotation.z = e.phase === "down" ? Math.PI / 2.2 : 0;
      }
      if (groupRef.current) {
        groupRef.current.position.copy(enemyTransform.position);
        groupRef.current.rotation.y = enemyTransform.facingYaw;
      }
    }
  });

  return (
    <group ref={groupRef}>
      <group ref={bobRef}>
        <ArmoredFighter
          energy="#ff4d6d"
          armorColor="#5a2740"
          idleMotion={false}
          showOrb={false}
          showCape
        />
      </group>
    </group>
  );
}
