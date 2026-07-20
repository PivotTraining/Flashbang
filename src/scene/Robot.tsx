import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Group, Mesh } from "three";
import { ROBOT_POSITION } from "../state/ballStore";

// Training robot: dark smooth human-shaped armor, simple face, orange chest
// target circle, no random weapons or bulky parts (handoff doc §7).
export default function Robot() {
  const [x, , z] = ROBOT_POSITION;
  const root = useRef<Group>(null);
  const target = useRef<Mesh>(null);

  const shell = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#2f333c",
        metalness: 0.78,
        roughness: 0.36,
      }),
    [],
  );
  const dark = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#21242b",
        metalness: 0.7,
        roughness: 0.45,
      }),
    [],
  );
  const eye = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#7fe8ff",
        emissive: new THREE.Color("#7fe8ff"),
        emissiveIntensity: 3,
        toneMapped: false,
      }),
    [],
  );

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (root.current) root.current.position.y = Math.sin(t * 1.1) * 0.022;
    if (target.current) {
      const m = target.current.material as THREE.MeshStandardMaterial;
      m.emissiveIntensity = 1.6 + Math.sin(t * 2.6) * 0.7;
    }
  });

  return (
    <group ref={root} position={[x, 0, z]}>
      {/* legs */}
      {[-1, 1].map((side) => (
        <group key={`leg-${side}`} position={[side * 0.2, 0, 0]}>
          <mesh position={[0, 0.82, 0]} castShadow>
            <capsuleGeometry args={[0.125, 0.42, 8, 14]} />
            <primitive object={shell} attach="material" />
          </mesh>
          <mesh position={[0, 0.56, 0]} castShadow>
            <sphereGeometry args={[0.105, 14, 14]} />
            <primitive object={dark} attach="material" />
          </mesh>
          <mesh position={[0, 0.3, 0]} castShadow>
            <capsuleGeometry args={[0.108, 0.36, 8, 14]} />
            <primitive object={shell} attach="material" />
          </mesh>
          <mesh position={[0, 0.06, 0.04]} castShadow>
            <boxGeometry args={[0.2, 0.12, 0.3]} />
            <primitive object={dark} attach="material" />
          </mesh>
        </group>
      ))}

      {/* hips */}
      <mesh position={[0, 1.08, 0]} castShadow>
        <boxGeometry args={[0.44, 0.2, 0.28]} />
        <primitive object={dark} attach="material" />
      </mesh>

      {/* torso */}
      <mesh position={[0, 1.48, 0]} castShadow>
        <capsuleGeometry args={[0.28, 0.4, 8, 16]} />
        <primitive object={shell} attach="material" />
      </mesh>
      <mesh position={[0, 1.7, 0.01]} castShadow>
        <boxGeometry args={[0.58, 0.3, 0.36]} />
        <primitive object={dark} attach="material" />
      </mesh>

      {/* orange chest target */}
      <mesh ref={target} position={[0, 1.62, 0.21]}>
        <circleGeometry args={[0.155, 32]} />
        <meshStandardMaterial
          color="#ff8a1e"
          emissive="#ff8a1e"
          emissiveIntensity={1.8}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, 1.62, 0.205]}>
        <ringGeometry args={[0.17, 0.195, 32]} />
        <meshStandardMaterial
          color="#ffb46b"
          emissive="#ff8a1e"
          emissiveIntensity={0.9}
          toneMapped={false}
        />
      </mesh>

      {/* shoulders */}
      {[-1, 1].map((side) => (
        <mesh key={`sh-${side}`} position={[side * 0.42, 1.8, 0]} castShadow>
          <sphereGeometry args={[0.155, 16, 14]} />
          <primitive object={dark} attach="material" />
        </mesh>
      ))}

      {/* arms */}
      {[-1, 1].map((side) => (
        <group key={`arm-${side}`}>
          <mesh position={[side * 0.46, 1.53, 0]} castShadow>
            <capsuleGeometry args={[0.088, 0.3, 8, 14]} />
            <primitive object={shell} attach="material" />
          </mesh>
          <mesh position={[side * 0.48, 1.32, 0]} castShadow>
            <sphereGeometry args={[0.085, 14, 14]} />
            <primitive object={dark} attach="material" />
          </mesh>
          <mesh position={[side * 0.5, 1.12, 0]} castShadow>
            <capsuleGeometry args={[0.08, 0.28, 8, 14]} />
            <primitive object={shell} attach="material" />
          </mesh>
          <mesh position={[side * 0.51, 0.98, 0]} castShadow>
            <boxGeometry args={[0.17, 0.17, 0.17]} />
            <primitive object={dark} attach="material" />
          </mesh>
        </group>
      ))}

      {/* neck + head */}
      <mesh position={[0, 1.93, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.075, 0.09, 12]} />
        <primitive object={dark} attach="material" />
      </mesh>
      <mesh position={[0, 2.08, 0]} castShadow>
        <sphereGeometry args={[0.165, 20, 20]} />
        <primitive object={shell} attach="material" />
      </mesh>
      {/* simple face plate */}
      <mesh position={[0, 2.06, 0.115]} castShadow>
        <boxGeometry args={[0.2, 0.17, 0.09]} />
        <primitive object={dark} attach="material" />
      </mesh>
      {/* two simple eyes */}
      {[-1, 1].map((side) => (
        <mesh key={`eye-${side}`} position={[side * 0.055, 2.09, 0.165]}>
          <circleGeometry args={[0.028, 16]} />
          <primitive object={eye} attach="material" />
        </mesh>
      ))}
    </group>
  );
}
