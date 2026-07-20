import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import type { Group, Points } from "three";
import ArmoredFighter from "../../characters/ArmoredFighter";
import ProceduralEnvironment from "../../scene/ProceduralEnvironment";

// Cinematic home stage: equipped fighter on a glowing platform against a
// dark futuristic city (home screen LOCKED spec, handoff doc §5).

function Platform({ energy }: { energy: string }) {
  const outer = useRef<Group>(null);
  const inner = useRef<Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (outer.current) outer.current.rotation.z = t * 0.16;
    if (inner.current) inner.current.rotation.z = -t * 0.28;
  });

  return (
    <group>
      {/* disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} receiveShadow>
        <circleGeometry args={[1.5, 64]} />
        <meshStandardMaterial
          color="#150c28"
          emissive={new THREE.Color(energy)}
          emissiveIntensity={0.32}
          metalness={0.6}
          roughness={0.25}
        />
      </mesh>

      {/* rotating rings */}
      <group ref={outer} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <mesh>
          <ringGeometry args={[1.54, 1.63, 96]} />
          <meshBasicMaterial color={energy} toneMapped={false} />
        </mesh>
        {/* ring notches */}
        {Array.from({ length: 12 }).map((_, i) => (
          <mesh
            key={i}
            position={[
              Math.cos((i / 12) * Math.PI * 2) * 1.72,
              Math.sin((i / 12) * Math.PI * 2) * 1.72,
              0,
            ]}
          >
            <planeGeometry args={[0.1, 0.03]} />
            <meshBasicMaterial color={energy} toneMapped={false} />
          </mesh>
        ))}
      </group>

      <group ref={inner} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.021, 0]}>
        <mesh>
          <ringGeometry args={[1.18, 1.22, 80]} />
          <meshBasicMaterial
            color={energy}
            transparent
            opacity={0.55}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* upward light shaft — fades out with height so it reads as glow,
          not a solid tube */}
      <mesh position={[0, 2.1, 0]}>
        <cylinderGeometry args={[1.9, 1.2, 4.2, 40, 1, true]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          uniforms={{ uColor: { value: new THREE.Color(energy) } }}
          vertexShader={`
            varying float vH;
            void main() {
              vH = uv.y;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            uniform vec3 uColor;
            varying float vH;
            void main() {
              float fade = pow(1.0 - vH, 2.4) * 0.16;
              gl_FragColor = vec4(uColor, fade);
            }
          `}
        />
      </mesh>
    </group>
  );
}

function EnergyMotes({ energy }: { energy: string }) {
  const ref = useRef<Points>(null);

  const { positions, count } = useMemo(() => {
    const count = 220;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 * 7;
      const seed = Math.sin(i * 91.7) * 43758.5453;
      const r = seed - Math.floor(seed);
      const radius = 0.8 + r * 4.2;
      positions[i * 3] = Math.cos(a) * radius;
      positions[i * 3 + 1] = r * 5.2;
      positions[i * 3 + 2] = Math.sin(a) * radius * 0.7;
    }
    return { positions, count };
  }, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    const arr = ref.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      const base = positions[i * 3 + 1];
      arr[i * 3 + 1] = ((base + t * 0.22) % 5.2);
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions.slice(), 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        color={energy}
        transparent
        opacity={0.6}
        depthWrite={false}
        toneMapped={false}
      />
    </points>
  );
}

function CityBackdrop() {
  const buildings = useMemo(() => {
    const out: {
      x: number;
      h: number;
      z: number;
      w: number;
      hue: string;
      lit: boolean;
    }[] = [];
    const hues = ["#7b2fff", "#3b6bff", "#c026d3", "#5b21b6", "#2563eb"];
    for (let i = 0; i < 46; i++) {
      const s1 = Math.sin(i * 127.1) * 43758.5453;
      const r1 = s1 - Math.floor(s1);
      const s2 = Math.sin(i * 311.7) * 24634.6345;
      const r2 = s2 - Math.floor(s2);
      const ring = i % 3;
      out.push({
        x: -26 + i * 1.15 + r1 * 1.2,
        h: 3 + r1 * 11 + ring * 1.5,
        z: -14 - ring * 7 - r2 * 5,
        w: 1 + r2 * 1.5,
        hue: hues[i % hues.length],
        lit: r1 > 0.35,
      });
    }
    return out;
  }, []);

  return (
    <group>
      {buildings.map((b, i) => (
        <group key={i} position={[b.x, b.h / 2, b.z]}>
          <mesh>
            <boxGeometry args={[b.w, b.h, b.w]} />
            <meshStandardMaterial color="#080614" roughness={0.95} metalness={0.1} />
          </mesh>
          {b.lit && (
            <mesh position={[0, 0.1, b.w / 2 + 0.02]}>
              <planeGeometry args={[b.w * 0.6, b.h * 0.8]} />
              <meshBasicMaterial
                color={b.hue}
                transparent
                opacity={0.22}
                toneMapped={false}
              />
            </mesh>
          )}
          {/* rooftop beacon */}
          <mesh position={[0, b.h / 2 + 0.06, 0]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshBasicMaterial color={b.hue} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default function HeroScene({ energy = "#a855f7" }: { energy?: string }) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      camera={{ fov: 34, position: [0, 1.62, 7.4] }}
      onCreated={({ camera, gl }) => {
        camera.lookAt(0, 1.28, 0);
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.15;
      }}
      style={{ position: "absolute", inset: 0 }}
    >
      <color attach="background" args={["#05030c"]} />
      <fog attach="fog" args={["#0a0618", 11, 42]} />

      <ambientLight intensity={0.22} />
      {/* key rim from behind-left, the classic hero silhouette light */}
      <spotLight
        position={[-4, 5.5, -2.5]}
        angle={0.7}
        penumbra={0.9}
        intensity={90}
        color="#9d5cff"
        castShadow
      />
      {/* cool fill from the right */}
      <pointLight position={[3.4, 2.4, 2.6]} intensity={22} color="#3b6bff" />
      {/* warm-ish bounce off the platform */}
      <pointLight position={[0, 0.35, 1.1]} intensity={16} color={energy} />
      {/* soft top light so the helmet reads */}
      <directionalLight position={[1.5, 7, 3]} intensity={0.7} color="#d8c9ff" />

      <ProceduralEnvironment intensity={0.32} />
      <ArmoredFighter energy={energy} />
      <Platform energy={energy} />
      <EnergyMotes energy={energy} />
      <CityBackdrop />

      {/* ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial color="#08060f" roughness={0.72} metalness={0.35} />
      </mesh>

      <EffectComposer>
        <Bloom
          intensity={1.25}
          luminanceThreshold={0.62}
          luminanceSmoothing={0.32}
          mipmapBlur
          radius={0.72}
        />
        <Vignette offset={0.28} darkness={0.72} />
      </EffectComposer>
    </Canvas>
  );
}
