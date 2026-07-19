import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Group } from "three";
import { cameraState, playerTransform } from "./playerTransform";
import { useMovementInput } from "../input/useKeyboard";
import { registerPlayerHandPositionGetter, type Vec3 } from "../state/ballStore";

const MOVE_SPEED = 4.2;
const ARENA_RADIUS = 9;

// Third-person motor, ported from ThirdPersonMotor (handoff doc §24):
// camera-relative movement, slerp facing toward travel direction. No
// gravity/CharacterController yet — flat graybox ground only for Pass 1.
export default function Player() {
  const groupRef = useRef<Group>(null);
  const moveIntent = useMovementInput();
  const facingQuat = useRef(new THREE.Quaternion());

  useEffect(() => {
    registerPlayerHandPositionGetter((): Vec3 => {
      const forward = new THREE.Vector3(
        -Math.sin(playerTransform.facingYaw),
        0,
        -Math.cos(playerTransform.facingYaw),
      );
      const hand = playerTransform.position
        .clone()
        .addScaledVector(forward, 0.55)
        .add(new THREE.Vector3(0.3, 1.15, 0));
      return [hand.x, hand.y, hand.z];
    });
  }, []);

  useFrame((_, dt) => {
    const { x, z } = moveIntent.current;
    const yaw = cameraState.yaw;

    const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
    const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));

    const move = new THREE.Vector3()
      .addScaledVector(forward, -z)
      .addScaledVector(right, x);

    if (move.lengthSq() > 0.0001) {
      move.normalize();
      playerTransform.position.addScaledVector(move, MOVE_SPEED * dt);

      const horizontalDist = Math.hypot(
        playerTransform.position.x,
        playerTransform.position.z,
      );
      if (horizontalDist > ARENA_RADIUS) {
        playerTransform.position
          .setX((playerTransform.position.x / horizontalDist) * ARENA_RADIUS)
          .setZ((playerTransform.position.z / horizontalDist) * ARENA_RADIUS);
      }

      const targetYaw = Math.atan2(move.x, move.z);
      playerTransform.facingYaw = targetYaw;
      const targetQuat = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 1, 0),
        targetYaw,
      );
      facingQuat.current.slerp(targetQuat, Math.min(1, dt * 10));
    }

    if (groupRef.current) {
      groupRef.current.position.copy(playerTransform.position);
      groupRef.current.quaternion.copy(facingQuat.current);
    }
  });

  return (
    <group ref={groupRef}>
      <mesh position={[0, 0.9, 0]} castShadow>
        <capsuleGeometry args={[0.35, 0.9, 6, 12]} />
        <meshStandardMaterial color="#3d6bff" />
      </mesh>
      {/* facing indicator */}
      <mesh position={[0, 1.1, 0.35]}>
        <coneGeometry args={[0.12, 0.28, 12]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}
