import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Mesh, Points } from "three";
import { useBallStore } from "../state/ballStore";

const TRAIL_LENGTH = 26;

// Smooth glowing energy orb, no basketball seams (handoff doc §9).
export default function Ball() {
  const meshRef = useRef<Mesh>(null);
  const haloRef = useRef<Mesh>(null);
  const trailRef = useRef<Points>(null);
  const position = useBallStore((s) => s.position);
  const state = useBallStore((s) => s.state);

  const trailPositions = useMemo(
    () => new Float32Array(TRAIL_LENGTH * 3),
    [],
  );
  const initialized = useRef(false);

  const resting = state === "Loose";
  const inFlight = state === "Thrown" || state === "CatchWindow";

  useFrame((_, dt) => {
    const y = resting ? 0.25 : position[1];

    if (meshRef.current) {
      meshRef.current.position.set(position[0], y, position[2]);
      meshRef.current.rotation.y += dt * (resting ? 0.5 : 3.2);
    }
    if (haloRef.current) {
      haloRef.current.position.set(position[0], y, position[2]);
      const s = inFlight ? 1.25 : 1;
      haloRef.current.scale.setScalar(s);
    }

    // shift trail history back one slot, newest sample at index 0
    if (trailRef.current) {
      const arr = trailRef.current.geometry.attributes.position
        .array as Float32Array;

      if (!initialized.current) {
        for (let i = 0; i < TRAIL_LENGTH; i++) {
          arr[i * 3] = position[0];
          arr[i * 3 + 1] = y;
          arr[i * 3 + 2] = position[2];
        }
        initialized.current = true;
      } else {
        for (let i = TRAIL_LENGTH - 1; i > 0; i--) {
          arr[i * 3] = arr[(i - 1) * 3];
          arr[i * 3 + 1] = arr[(i - 1) * 3 + 1];
          arr[i * 3 + 2] = arr[(i - 1) * 3 + 2];
        }
        arr[0] = position[0];
        arr[1] = y;
        arr[2] = position[2];
      }
      trailRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group>
      <mesh ref={meshRef} castShadow>
        <sphereGeometry args={[0.22, 32, 32]} />
        <meshStandardMaterial
          color="#ffb04d"
          emissive="#ff7a1a"
          emissiveIntensity={resting ? 1.4 : 3.4}
          roughness={0.18}
          metalness={0.05}
          toneMapped={false}
        />
      </mesh>

      {/* soft halo */}
      <mesh ref={haloRef}>
        <sphereGeometry args={[0.36, 20, 20]} />
        <meshBasicMaterial
          color="#ff9d3d"
          transparent
          opacity={inFlight ? 0.22 : 0.12}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      {/* motion trail */}
      <points ref={trailRef} visible={inFlight}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[trailPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.17}
          color="#ff8a2b"
          transparent
          opacity={0.5}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
          toneMapped={false}
        />
      </points>
    </group>
  );
}
