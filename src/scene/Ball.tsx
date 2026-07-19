import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh } from "three";
import { useBallStore } from "../state/ballStore";

// Smooth glowing energy orb, no basketball seams (handoff doc §9).
export default function Ball() {
  const meshRef = useRef<Mesh>(null);
  const position = useBallStore((s) => s.position);
  const state = useBallStore((s) => s.state);

  useFrame((_, dt) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += dt * (state === "Loose" ? 0.5 : 2.4);
    }
  });

  const resting = state === "Loose";

  return (
    <mesh
      ref={meshRef}
      position={[position[0], resting ? 0.25 : position[1], position[2]]}
      castShadow
    >
      <sphereGeometry args={[0.22, 32, 32]} />
      <meshStandardMaterial
        color="#ff9d3d"
        emissive="#ff7a1a"
        emissiveIntensity={resting ? 0.5 : 1.1}
        roughness={0.25}
        metalness={0.1}
      />
    </mesh>
  );
}
