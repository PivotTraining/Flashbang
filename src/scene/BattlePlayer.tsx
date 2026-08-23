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

export default function BattlePlayer() {
  const groupRef = useRef<Group>(null);
  const actionRef = useRef<Group>(null);
  const moveIntent = useMovementInput();
  const strideTime = useRef(0);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const { player, hitstop, roundOver } = useCombatStore.getState();

    if (hitstop > 0) {
      applyVisual();
      return;
    }

    const toEnemy = new THREE.Vector3().copy(enemyTransform.position).sub(playerTransform.position);
    toEnemy.y = 0;
    if (toEnemy.lengthSq() > 0.000001) toEnemy.normalize();
    else toEnemy.set(0, 0, -1);

    playerTransform.facingYaw = Math.atan2(toEnemy.x, toEnemy.z);

    const canMove = player.phase === "idle" && !roundOver;
    const { x, z } = moveIntent.current;

    if (canMove && (x !== 0 || z !== 0)) {
      const right = new THREE.Vector3(toEnemy.z, 0, -toEnemy.x);
      const move = new THREE.Vector3().addScaledVector(toEnemy, -z).addScaledVector(right, x).normalize();
      const speed = player.guarding ? MOVE_SPEED * 0.45 : MOVE_SPEED;
      playerTransform.position.addScaledVector(move, speed * dt);
      strideTime.current += dt * 10;
    } else {
      strideTime.current += dt * 1.8;
    }

    if (player.knockback > 0.01) playerTransform.position.addScaledVector(toEnemy, -player.knockback * dt);

    const radial = Math.hypot(playerTransform.position.x, playerTransform.position.z);
    if (radial > ARENA_RADIUS) {
      playerTransform.position.setX((playerTransform.position.x / radial) * ARENA_RADIUS).setZ((playerTransform.position.z / radial) * ARENA_RADIUS);
    }

    applyVisual();

    function applyVisual() {
      const p = useCombatStore.getState().player;
      const node = actionRef.current;
      if (node) {
        const moving = Math.abs(moveIntent.current.x) + Math.abs(moveIntent.current.z) > 0.01;
        const idleBob = moving ? Math.abs(Math.sin(strideTime.current)) * 0.065 : Math.sin(strideTime.current * 0.5) * 0.018;

        let targetY = idleBob;
        let targetZ = 0;
        let targetXRot = p.guarding ? -0.18 : 0;
        let targetYRot = 0;
        let targetZRot = 0;
        let targetScaleY = 1;

        if (p.moveId) {
          const active = p.phase === "active";
          const windup = p.phase === "windup";

          if (p.moveId === "roundKick") {
            targetYRot = active ? -0.95 : windup ? 0.42 : 0.12;
            targetZRot = active ? -0.18 : 0;
            targetZ = active ? 0.48 : -0.12;
          } else if (p.moveId === "spinKick") {
            targetYRot = active ? Math.PI * 1.25 : windup ? -0.65 : 0.25;
            targetZ = active ? 0.38 : 0;
          } else if (p.moveId === "risingKick") {
            targetY = active ? 0.72 : windup ? -0.12 : 0.25;
            targetXRot = active ? -0.5 : windup ? 0.35 : 0;
            targetScaleY = active ? 1.08 : 0.96;
          } else if (p.moveId === "legSweep") {
            targetY = windup ? -0.34 : active ? -0.24 : 0;
            targetXRot = 0.36;
            targetYRot = active ? -1.35 : -0.45;
            targetScaleY = 0.82;
          } else if (p.moveId === "ballThrow") {
            targetXRot = windup ? 0.42 : active ? -0.48 : 0;
            targetZ = active ? 0.72 : -0.18;
            targetScaleY = active ? 1.08 : 1;
          }
        }

        if (p.phase === "stagger") {
          targetXRot = 0.48;
          targetZ = -0.25;
          targetZRot = -0.16;
        }
        if (p.phase === "down") {
          targetZRot = Math.PI / 2.05;
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
        groupRef.current.position.copy(playerTransform.position);
        groupRef.current.rotation.y = playerTransform.facingYaw;
      }
    }
  });

  return (
    <group ref={groupRef}>
      <group ref={actionRef}>
        <ArmoredFighter energy="#4da3ff" armorColor="#3d4a68" idleMotion={false} showOrb={false} showCape={false} />
      </group>
    </group>
  );
}
