import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Group, Mesh } from "three";

// Original stylized armored fighter. Built from primitives so it ships with
// no asset pipeline; swap in a rigged GLB via <CharacterModel> when art is
// available (see CharacterModel.tsx).

interface Props {
  /** Primary energy color for glowing accents. */
  energy?: string;
  /** Base armor color. */
  armorColor?: string;
  idleMotion?: boolean;
  /** Decorative held orb. Turn off in gameplay where a real ball exists. */
  showOrb?: boolean;
  /** Trailing energy cape. Off for gameplay readability. */
  showCape?: boolean;
}

export default function ArmoredFighter({
  energy = "#a855f7",
  armorColor = "#151020",
  idleMotion = true,
  showOrb = true,
  showCape = true,
}: Props) {
  const root = useRef<Group>(null);
  const chest = useRef<Mesh>(null);
  const orb = useRef<Mesh>(null);
  const cape = useRef<Group>(null);

  const armorMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: armorColor,
        metalness: 0.92,
        roughness: 0.28,
      }),
    [armorColor],
  );

  const plateMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#241a3a",
        metalness: 0.85,
        roughness: 0.34,
      }),
    [],
  );

  const glowMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: energy,
        emissive: new THREE.Color(energy),
        emissiveIntensity: 4.2,
        roughness: 0.2,
        toneMapped: false,
      }),
    [energy],
  );

  const orbMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: energy,
        emissive: new THREE.Color(energy),
        emissiveIntensity: 5.5,
        roughness: 0.1,
        toneMapped: false,
      }),
    [energy],
  );

  useFrame(({ clock }) => {
    if (!idleMotion) return;
    const t = clock.getElapsedTime();

    if (root.current) {
      root.current.rotation.y = Math.sin(t * 0.22) * 0.22;
      root.current.position.y = Math.sin(t * 0.7) * 0.035;
    }
    if (chest.current) {
      const m = chest.current.material as THREE.MeshStandardMaterial;
      m.emissiveIntensity = 3.4 + Math.sin(t * 2.1) * 1.1;
    }
    if (orb.current) {
      orb.current.position.y = 1.02 + Math.sin(t * 1.6) * 0.05;
      orb.current.rotation.y = t * 0.9;
    }
    if (cape.current) {
      cape.current.rotation.x = -0.12 + Math.sin(t * 0.9) * 0.035;
    }
  });

  return (
    <group ref={root} position={[0, 0, 0]} scale={1.06}>
      {/* ---- legs ---- */}
      {[-1, 1].map((side) => (
        <group key={`leg-${side}`} position={[side * 0.2, 0, 0]}>
          {/* thigh */}
          <mesh position={[0, 0.86, 0]} castShadow>
            <capsuleGeometry args={[0.135, 0.46, 8, 16]} />
            <primitive object={armorMat} attach="material" />
          </mesh>
          {/* knee plate */}
          <mesh position={[0, 0.58, 0.05]} castShadow>
            <boxGeometry args={[0.19, 0.16, 0.19]} />
            <primitive object={plateMat} attach="material" />
          </mesh>
          {/* shin */}
          <mesh position={[0, 0.3, 0]} castShadow>
            <capsuleGeometry args={[0.115, 0.4, 8, 16]} />
            <primitive object={armorMat} attach="material" />
          </mesh>
          {/* shin energy strip */}
          <mesh position={[0, 0.3, 0.1]}>
            <boxGeometry args={[0.035, 0.34, 0.02]} />
            <primitive object={glowMat} attach="material" />
          </mesh>
          {/* boot */}
          <mesh position={[0, 0.06, 0.04]} castShadow>
            <boxGeometry args={[0.22, 0.13, 0.34]} />
            <primitive object={plateMat} attach="material" />
          </mesh>
        </group>
      ))}

      {/* ---- hips ---- */}
      <mesh position={[0, 1.13, 0]} castShadow>
        <boxGeometry args={[0.48, 0.22, 0.3]} />
        <primitive object={plateMat} attach="material" />
      </mesh>
      <mesh position={[0, 1.13, 0.16]}>
        <boxGeometry args={[0.3, 0.045, 0.02]} />
        <primitive object={glowMat} attach="material" />
      </mesh>

      {/* ---- torso ---- */}
      <mesh position={[0, 1.55, 0]} castShadow>
        <capsuleGeometry args={[0.3, 0.42, 8, 16]} />
        <primitive object={armorMat} attach="material" />
      </mesh>
      {/* upper chest plate — broader for a heroic silhouette */}
      <mesh position={[0, 1.78, 0.02]} castShadow>
        <boxGeometry args={[0.66, 0.34, 0.4]} />
        <primitive object={plateMat} attach="material" />
      </mesh>
      {/* chest core */}
      <mesh ref={chest} position={[0, 1.76, 0.23]}>
        <sphereGeometry args={[0.085, 24, 24]} />
        <primitive object={glowMat} attach="material" />
      </mesh>
      {/* chest energy veins */}
      {[-1, 1].map((side) => (
        <mesh
          key={`vein-${side}`}
          position={[side * 0.16, 1.68, 0.21]}
          rotation={[0, 0, side * 0.5]}
        >
          <boxGeometry args={[0.025, 0.24, 0.02]} />
          <primitive object={glowMat} attach="material" />
        </mesh>
      ))}
      {/* abdominal segments */}
      {[0, 1, 2].map((i) => (
        <mesh key={`ab-${i}`} position={[0, 1.46 - i * 0.11, 0.2]}>
          <boxGeometry args={[0.34 - i * 0.04, 0.075, 0.06]} />
          <primitive object={plateMat} attach="material" />
        </mesh>
      ))}

      {/* ---- shoulders: layered pauldrons ---- */}
      {[-1, 1].map((side) => (
        <group key={`shoulder-${side}`} position={[side * 0.46, 1.92, 0]}>
          <mesh rotation={[0, 0, side * 0.34]} castShadow>
            <sphereGeometry args={[0.2, 20, 16, 0, Math.PI * 2, 0, Math.PI / 1.7]} />
            <primitive object={plateMat} attach="material" />
          </mesh>
          {/* spike */}
          <mesh position={[side * 0.12, 0.12, 0]} rotation={[0, 0, -side * 0.7]} castShadow>
            <coneGeometry args={[0.07, 0.26, 8]} />
            <primitive object={armorMat} attach="material" />
          </mesh>
          {/* pauldron glow rim */}
          <mesh position={[side * 0.02, 0.02, 0.15]} rotation={[0, 0, side * 0.34]}>
            <torusGeometry args={[0.13, 0.014, 8, 24, Math.PI]} />
            <primitive object={glowMat} attach="material" />
          </mesh>
        </group>
      ))}

      {/* ---- arms ---- */}
      {[-1, 1].map((side) => (
        <group key={`arm-${side}`}>
          {/* upper arm */}
          <mesh position={[side * 0.5, 1.62, 0]} rotation={[0, 0, side * 0.1]} castShadow>
            <capsuleGeometry args={[0.098, 0.34, 8, 16]} />
            <primitive object={armorMat} attach="material" />
          </mesh>
          {/* elbow */}
          <mesh position={[side * 0.545, 1.4, 0]} castShadow>
            <sphereGeometry args={[0.1, 16, 16]} />
            <primitive object={plateMat} attach="material" />
          </mesh>
          {/* forearm */}
          <mesh position={[side * 0.575, 1.18, 0]} rotation={[0, 0, side * 0.06]} castShadow>
            <capsuleGeometry args={[0.09, 0.32, 8, 16]} />
            <primitive object={armorMat} attach="material" />
          </mesh>
          {/* gauntlet */}
          <mesh position={[side * 0.585, 1.08, 0]} castShadow>
            <boxGeometry args={[0.2, 0.2, 0.2]} />
            <primitive object={plateMat} attach="material" />
          </mesh>
          {/* forearm energy line */}
          <mesh position={[side * 0.6, 1.2, 0.08]}>
            <boxGeometry args={[0.03, 0.3, 0.02]} />
            <primitive object={glowMat} attach="material" />
          </mesh>
        </group>
      ))}

      {/* ---- neck + head ---- */}
      <mesh position={[0, 2.03, 0]} castShadow>
        <cylinderGeometry args={[0.075, 0.095, 0.1, 12]} />
        <primitive object={armorMat} attach="material" />
      </mesh>
      {/* helmet */}
      <mesh position={[0, 2.2, 0]} castShadow>
        <sphereGeometry args={[0.185, 24, 24]} />
        <primitive object={armorMat} attach="material" />
      </mesh>
      {/* helmet crest */}
      <mesh position={[0, 2.34, -0.02]} rotation={[0.2, 0, 0]} castShadow>
        <boxGeometry args={[0.05, 0.2, 0.26]} />
        <primitive object={plateMat} attach="material" />
      </mesh>
      {/* jaw guard */}
      <mesh position={[0, 2.12, 0.08]} castShadow>
        <boxGeometry args={[0.16, 0.12, 0.16]} />
        <primitive object={plateMat} attach="material" />
      </mesh>
      {/* visor — the signature glowing eye band */}
      <mesh position={[0, 2.24, 0.15]}>
        <boxGeometry args={[0.235, 0.042, 0.05]} />
        <primitive object={glowMat} attach="material" />
      </mesh>
      {/* brow shadow plate */}
      <mesh position={[0, 2.3, 0.14]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[0.26, 0.08, 0.06]} />
        <primitive object={armorMat} attach="material" />
      </mesh>

      {/* ---- energy cape / trailing wisps ---- */}
      <group ref={cape} position={[0, 1.75, -0.24]} visible={showCape}>
        {[-1, 0, 1].map((i) => (
          <mesh
            key={`cape-${i}`}
            position={[i * 0.19, -0.42, -0.04 - Math.abs(i) * 0.03]}
            rotation={[-0.12, 0, i * 0.06]}
          >
            <planeGeometry args={[0.28, 1.15]} />
            <meshStandardMaterial
              color={energy}
              emissive={new THREE.Color(energy)}
              emissiveIntensity={0.85}
              transparent
              opacity={0.32 - Math.abs(i) * 0.07}
              side={THREE.DoubleSide}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>

      {/* ---- equipped glowing ball, held at the hip ---- */}
      <group visible={showOrb}>
        <mesh ref={orb} position={[0.62, 1.02, 0.2]}>
          <sphereGeometry args={[0.17, 32, 32]} />
          <primitive object={orbMat} attach="material" />
        </mesh>
        {/* orb halo */}
        <mesh position={[0.62, 1.02, 0.2]}>
          <sphereGeometry args={[0.26, 24, 24]} />
          <meshBasicMaterial
            color={energy}
            transparent
            opacity={0.16}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  );
}
