import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import type { Group } from "three";

// Center-stage hero: large armored fighter with purple energy accents on a
// glowing platform, dark futuristic/cosmic city behind (home screen LOCKED
// spec). All-original stylized figure — no franchise likeness.

function ArmoredFigure() {
  const groupRef = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.rotation.y = Math.sin(t * 0.25) * 0.25;
    groupRef.current.position.y = Math.sin(t * 0.8) * 0.04;
  });

  const armor = { color: "#16121f", metalness: 0.85, roughness: 0.35 };
  const glow = {
    color: "#7b2fff",
    emissive: "#8a3bff",
    emissiveIntensity: 2.2,
    roughness: 0.2,
    metalness: 0.1,
  };

  return (
    <group ref={groupRef} position={[0, -0.1, 0]}>
      {/* legs */}
      <mesh position={[-0.24, 0.62, 0]} castShadow>
        <capsuleGeometry args={[0.14, 0.85, 6, 12]} />
        <meshStandardMaterial {...armor} />
      </mesh>
      <mesh position={[0.24, 0.62, 0]} castShadow>
        <capsuleGeometry args={[0.14, 0.85, 6, 12]} />
        <meshStandardMaterial {...armor} />
      </mesh>

      {/* torso */}
      <mesh position={[0, 1.55, 0]} castShadow>
        <capsuleGeometry args={[0.34, 0.6, 6, 12]} />
        <meshStandardMaterial {...armor} />
      </mesh>

      {/* chest energy core */}
      <mesh position={[0, 1.68, 0.28]}>
        <sphereGeometry args={[0.09, 24, 24]} />
        <meshStandardMaterial {...glow} />
      </mesh>

      {/* shoulder plates */}
      <mesh position={[-0.5, 1.92, 0]} rotation={[0, 0, 0.4]} castShadow>
        <boxGeometry args={[0.3, 0.16, 0.3]} />
        <meshStandardMaterial {...armor} />
      </mesh>
      <mesh position={[0.5, 1.92, 0]} rotation={[0, 0, -0.4]} castShadow>
        <boxGeometry args={[0.3, 0.16, 0.3]} />
        <meshStandardMaterial {...armor} />
      </mesh>

      {/* arms */}
      <mesh position={[-0.52, 1.4, 0]} rotation={[0, 0, 0.12]} castShadow>
        <capsuleGeometry args={[0.11, 0.7, 6, 12]} />
        <meshStandardMaterial {...armor} />
      </mesh>
      <mesh position={[0.52, 1.4, 0]} rotation={[0, 0, -0.12]} castShadow>
        <capsuleGeometry args={[0.11, 0.7, 6, 12]} />
        <meshStandardMaterial {...armor} />
      </mesh>

      {/* energy lines on arms */}
      <mesh position={[-0.52, 1.42, 0.1]}>
        <boxGeometry args={[0.03, 0.6, 0.03]} />
        <meshStandardMaterial {...glow} />
      </mesh>
      <mesh position={[0.52, 1.42, 0.1]}>
        <boxGeometry args={[0.03, 0.6, 0.03]} />
        <meshStandardMaterial {...glow} />
      </mesh>

      {/* head */}
      <mesh position={[0, 2.22, 0]} castShadow>
        <sphereGeometry args={[0.19, 24, 24]} />
        <meshStandardMaterial {...armor} />
      </mesh>
      {/* visor glow */}
      <mesh position={[0, 2.24, 0.15]}>
        <boxGeometry args={[0.22, 0.05, 0.08]} />
        <meshStandardMaterial {...glow} />
      </mesh>

      {/* held glowing ball at the hip */}
      <mesh position={[0.55, 1.0, 0.18]}>
        <sphereGeometry args={[0.16, 32, 32]} />
        <meshStandardMaterial
          color="#a555ff"
          emissive="#9333ff"
          emissiveIntensity={2.6}
          roughness={0.15}
        />
      </mesh>
    </group>
  );
}

function Platform() {
  const ringRef = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (ringRef.current) ringRef.current.rotation.z = clock.getElapsedTime() * 0.3;
  });

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[1.4, 48]} />
        <meshStandardMaterial
          color="#1a1030"
          emissive="#5b21b6"
          emissiveIntensity={0.7}
          roughness={0.3}
        />
      </mesh>
      <group ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <mesh>
          <ringGeometry args={[1.45, 1.55, 64]} />
          <meshStandardMaterial
            color="#7b2fff"
            emissive="#8a3bff"
            emissiveIntensity={2}
          />
        </mesh>
      </group>
    </group>
  );
}

function CityBackdrop() {
  // deterministic pseudo-random building layout
  const buildings: { x: number; h: number; z: number; w: number }[] = [];
  for (let i = 0; i < 26; i++) {
    const seed = Math.sin(i * 127.1) * 43758.5453;
    const r = seed - Math.floor(seed);
    const x = -18 + i * 1.5 + r * 0.8;
    buildings.push({ x, h: 3 + r * 9, z: -16 - (i % 5) * 3, w: 1 + r * 1.1 });
  }

  return (
    <group>
      {buildings.map((b, i) => (
        <group key={i} position={[b.x, b.h / 2, b.z]}>
          <mesh>
            <boxGeometry args={[b.w, b.h, b.w]} />
            <meshStandardMaterial color="#0d0a16" roughness={0.9} />
          </mesh>
          {/* lit windows strip */}
          <mesh position={[0, 0.1, b.w / 2 + 0.01]}>
            <planeGeometry args={[b.w * 0.55, b.h * 0.82]} />
            <meshStandardMaterial
              color="#150f26"
              emissive={i % 3 === 0 ? "#7b2fff" : i % 3 === 1 ? "#3b6bff" : "#c026d3"}
              emissiveIntensity={0.45}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default function HeroScene() {
  return (
    <Canvas
      shadows
      camera={{ fov: 38, position: [0, 2.1, 8.2] }}
      onCreated={({ camera }) => camera.lookAt(0, 1.15, 0)}
      style={{ position: "absolute", inset: 0 }}
    >
      <color attach="background" args={["#07040e"]} />
      <fog attach="fog" args={["#0a0616", 10, 38]} />

      <ambientLight intensity={0.25} />
      <pointLight position={[0, 3.5, 3]} intensity={16} color="#a06bff" />
      <pointLight position={[-3, 1.2, 2]} intensity={12} color="#4338ca" />
      <pointLight position={[0, 0.4, 1.4]} intensity={10} color="#8a3bff" />
      <directionalLight position={[4, 8, 4]} intensity={0.5} color="#c4b5fd" />

      <ArmoredFigure />
      <Platform />
      <CityBackdrop />

      {/* ground plane catching the platform glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#0a0714" roughness={0.85} />
      </mesh>
    </Canvas>
  );
}
