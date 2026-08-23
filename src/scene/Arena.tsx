import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const mountainPeaks: Array<[number, number, number, number, number]> = [
  [-38, -4.5, -52, 18, 0.1], [-28, -5.2, -46, 15, -0.2], [-18, -4.8, -54, 22, 0.2],
  [-7, -5.8, -49, 17, -0.1], [7, -5.0, -55, 23, 0.18], [19, -5.6, -48, 16, -0.15],
  [31, -4.6, -53, 20, 0.2], [43, -5.4, -47, 16, -0.2],
];

function SkyDome() {
  return (
    <mesh scale={[1, 0.72, 1]}>
      <sphereGeometry args={[105, 32, 20]} />
      <shaderMaterial
        side={THREE.BackSide}
        depthWrite={false}
        vertexShader={`
          varying float vY;
          void main() {
            vY = normalize(position).y;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          varying float vY;
          void main() {
            float h = clamp(vY * 0.5 + 0.5, 0.0, 1.0);
            vec3 horizon = vec3(0.42, 0.16, 0.19);
            vec3 mid = vec3(0.17, 0.12, 0.25);
            vec3 zenith = vec3(0.035, 0.045, 0.10);
            vec3 color = mix(horizon, mid, smoothstep(0.16, 0.52, h));
            color = mix(color, zenith, smoothstep(0.48, 0.96, h));
            gl_FragColor = vec4(color, 1.0);
          }
        `}
      />
    </mesh>
  );
}

function StormFlash() {
  const light = useRef<THREE.DirectionalLight>(null);
  const timer = useRef(4.2);
  const pulse = useRef(0);

  useFrame((_, dt) => {
    timer.current -= dt;
    if (timer.current <= 0) {
      timer.current = 5.5 + Math.random() * 7;
      pulse.current = 1;
    }
    pulse.current *= Math.pow(0.018, dt);
    if (light.current) light.current.intensity = pulse.current * 3.2;
  });

  return <directionalLight ref={light} position={[18, 20, -20]} color="#b8d5ff" intensity={0} />;
}

function AnimatedBanner({
  position,
  width = 2.1,
  height = 4.4,
  color = "#4b1834",
  accent = "#7ec8ff",
  phase = 0,
}: {
  position: [number, number, number];
  width?: number;
  height?: number;
  color?: string;
  accent?: string;
  phase?: number;
}) {
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!group.current) return;
    const t = clock.getElapsedTime();
    group.current.rotation.y = Math.sin(t * 0.65 + phase) * 0.055;
    group.current.rotation.z = Math.sin(t * 0.42 + phase * 1.7) * 0.018;
  });

  return (
    <group ref={group} position={position}>
      <mesh position={[0, -height / 2, 0]}>
        <planeGeometry args={[width, height, 1, 8]} />
        <meshStandardMaterial color={color} roughness={0.86} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, -height * 0.47, 0.025]} rotation={[0, 0, -0.38]}>
        <boxGeometry args={[0.18, height * 0.52, 0.025]} />
        <meshBasicMaterial color={accent} toneMapped={false} />
      </mesh>
      <mesh position={[-0.18, -height * 0.6, 0.027]} rotation={[0, 0, 0.48]}>
        <boxGeometry args={[0.17, height * 0.34, 0.025]} />
        <meshBasicMaterial color="#a88dff" toneMapped={false} />
      </mesh>
    </group>
  );
}

function CloudBank({ baseX, baseY, baseZ, scale = 1, phase = 0 }: { baseX: number; baseY: number; baseZ: number; scale?: number; phase?: number }) {
  const group = useRef<THREE.Group>(null);
  const puffs = useMemo(
    () => Array.from({ length: 11 }, (_, i) => ({
      x: (i - 5) * 2.2 + Math.sin(i * 1.9 + phase) * 1.4,
      y: Math.sin(i * 1.37 + phase) * 0.55,
      z: Math.cos(i * 1.13 + phase) * 2.2,
      sx: 2.8 + (i % 4) * 0.7,
      sy: 0.65 + (i % 3) * 0.18,
      sz: 1.8 + (i % 5) * 0.45,
    })),
    [phase],
  );

  useFrame(({ clock }) => {
    if (!group.current) return;
    const t = clock.getElapsedTime();
    group.current.position.x = baseX + Math.sin(t * 0.035 + phase) * 2.2;
    group.current.position.y = baseY + Math.sin(t * 0.055 + phase) * 0.2;
  });

  return (
    <group ref={group} position={[baseX, baseY, baseZ]} scale={scale}>
      {puffs.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, p.z]} scale={[p.sx, p.sy, p.sz]}>
          <sphereGeometry args={[1, 12, 8]} />
          <meshBasicMaterial
            color={i % 3 === 0 ? "#776b89" : "#5d5875"}
            transparent
            opacity={0.15}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

function EnergyMotes() {
  const group = useRef<THREE.Group>(null);
  const positions = useMemo(() => {
    const count = 90;
    const data = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const a = i * 2.399963;
      const r = 3.5 + (i % 17) * 0.42;
      data[i * 3] = Math.cos(a) * r;
      data[i * 3 + 1] = 0.45 + (i % 19) * 0.31;
      data[i * 3 + 2] = Math.sin(a) * r;
    }
    return data;
  }, []);

  useFrame(({ clock }) => {
    if (!group.current) return;
    const t = clock.getElapsedTime();
    group.current.rotation.y = t * 0.018;
    group.current.position.y = Math.sin(t * 0.45) * 0.16;
  });

  return (
    <group ref={group}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.055} color="#79c7ff" transparent opacity={0.82} depthWrite={false} sizeAttenuation />
      </points>
    </group>
  );
}

function SummitPillar({ position, side = 1 }: { position: [number, number, number]; side?: number }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.0, 1.25, 0.6, 8]} />
        <meshStandardMaterial color="#14151e" roughness={0.75} metalness={0.24} />
      </mesh>
      <mesh position={[0, 2.6, 0]} castShadow>
        <cylinderGeometry args={[0.58, 0.72, 4.05, 8]} />
        <meshStandardMaterial color="#242636" roughness={0.62} metalness={0.3} />
      </mesh>
      <mesh position={[0, 4.75, 0]} castShadow>
        <cylinderGeometry args={[0.95, 0.68, 0.45, 8]} />
        <meshStandardMaterial color="#11131c" roughness={0.6} metalness={0.34} />
      </mesh>
      <mesh position={[0, 5.0, 0]} castShadow>
        <coneGeometry args={[0.58, 0.7, 6]} />
        <meshStandardMaterial color="#1b1d2a" roughness={0.58} metalness={0.32} />
      </mesh>
      <mesh position={[side * 0.48, 2.7, 0.42]} rotation={[0, 0, side * -0.1]}>
        <boxGeometry args={[0.09, 2.7, 0.055]} />
        <meshStandardMaterial color="#61baff" emissive="#3c91ff" emissiveIntensity={4.2} toneMapped={false} />
      </mesh>
      <mesh position={[0, 1.55, 0.63]} rotation={[0, 0, -0.38 * side]}>
        <boxGeometry args={[0.13, 1.35, 0.055]} />
        <meshStandardMaterial color="#906fff" emissive="#7259ff" emissiveIntensity={3.3} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 3.2, 0.75]} color="#4fa8ff" intensity={4.6} distance={6.2} decay={2} />
    </group>
  );
}

function Lantern({ angle, radius = 9.35 }: { angle: number; radius?: number }) {
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.7, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 1.4, 8]} />
        <meshStandardMaterial color="#171925" metalness={0.48} roughness={0.5} />
      </mesh>
      <mesh position={[0, 1.45, 0]}>
        <octahedronGeometry args={[0.18, 0]} />
        <meshStandardMaterial color="#7bd0ff" emissive="#5aaeff" emissiveIntensity={5} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 1.45, 0]} color="#65bfff" intensity={2.4} distance={3.4} />
    </group>
  );
}

function Gate() {
  return (
    <group position={[0, 0, -13.2]}>
      <mesh position={[-2.7, 3.2, 0]} castShadow>
        <boxGeometry args={[0.52, 6.4, 0.62]} />
        <meshStandardMaterial color="#151621" roughness={0.55} metalness={0.38} />
      </mesh>
      <mesh position={[2.7, 3.2, 0]} castShadow>
        <boxGeometry args={[0.52, 6.4, 0.62]} />
        <meshStandardMaterial color="#151621" roughness={0.55} metalness={0.38} />
      </mesh>
      <mesh position={[0, 5.85, 0]} castShadow>
        <boxGeometry args={[6.5, 0.5, 0.72]} />
        <meshStandardMaterial color="#202230" roughness={0.48} metalness={0.45} />
      </mesh>
      <mesh position={[0, 6.25, -0.02]} rotation={[0, 0, 0.04]} castShadow>
        <boxGeometry args={[7.4, 0.28, 0.86]} />
        <meshStandardMaterial color="#10121b" roughness={0.5} metalness={0.36} />
      </mesh>
      <mesh position={[0, 6.52, -0.05]} rotation={[0, 0, -0.04]} castShadow>
        <boxGeometry args={[6.55, 0.2, 0.82]} />
        <meshStandardMaterial color="#292b3b" roughness={0.48} metalness={0.38} />
      </mesh>
      <mesh position={[0, 5.78, 0.4]}>
        <boxGeometry args={[4.8, 0.07, 0.05]} />
        <meshBasicMaterial color="#78c7ff" toneMapped={false} />
      </mesh>
      <AnimatedBanner position={[0, 5.55, 0.36]} width={3.8} height={4.5} phase={0.8} />
    </group>
  );
}

export default function Arena() {
  const lanternAngles = [-2.8, -2.35, -1.9, -1.25, -0.8, -0.35, 0.35, 0.8, 1.25, 1.9, 2.35, 2.8];

  return (
    <>
      <color attach="background" args={["#121322"]} />
      <fog attach="fog" args={["#292039", 20, 76]} />
      <SkyDome />
      <StormFlash />

      <ambientLight intensity={0.14} />
      <hemisphereLight args={["#7f91c9", "#20151f", 0.38]} />
      <directionalLight
        position={[-14, 16, 10]}
        color="#ffad72"
        intensity={2.7}
        castShadow
        shadow-mapSize={[1536, 1536]}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />
      <directionalLight position={[10, 9, -14]} color="#6e91ff" intensity={0.95} />

      {/* layered summit dais */}
      <mesh position={[0, -0.72, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[11.4, 12.1, 1.25, 64]} />
        <meshStandardMaterial color="#171923" roughness={0.8} metalness={0.2} />
      </mesh>
      <mesh position={[0, -0.18, 0]} receiveShadow>
        <cylinderGeometry args={[10.65, 10.9, 0.22, 64]} />
        <meshStandardMaterial color="#33333e" roughness={0.76} metalness={0.17} />
      </mesh>

      {/* segmented floor tiles add real material rhythm instead of one flat disc */}
      {Array.from({ length: 28 }, (_, i) => {
        const length = (Math.PI * 2) / 28 - 0.012;
        const start = i * (Math.PI * 2) / 28 + 0.006;
        return (
          <mesh key={`tile-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005 + (i % 2) * 0.006, 0]} receiveShadow>
            <ringGeometry args={[2.45, 9.35, 3, 1, start, length]} />
            <meshStandardMaterial
              color={i % 2 === 0 ? "#30313d" : "#292a35"}
              roughness={0.76}
              metalness={0.2}
            />
          </mesh>
        );
      })}

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} receiveShadow>
        <circleGeometry args={[2.35, 48]} />
        <meshStandardMaterial color="#20212d" roughness={0.68} metalness={0.28} />
      </mesh>

      {/* glowing architectural rings */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.055, 0]}>
        <torusGeometry args={[8.55, 0.055, 10, 96]} />
        <meshStandardMaterial color="#56a8ff" emissive="#3587ff" emissiveIntensity={4.2} toneMapped={false} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.062, 0]}>
        <torusGeometry args={[4.55, 0.045, 10, 72]} />
        <meshStandardMaterial color="#8c6cff" emissive="#7056ff" emissiveIntensity={3.4} toneMapped={false} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.065, 0]}>
        <torusGeometry args={[2.18, 0.035, 10, 64]} />
        <meshStandardMaterial color="#66baff" emissive="#469cff" emissiveIntensity={2.8} toneMapped={false} />
      </mesh>

      {/* radial energy channels */}
      {Array.from({ length: 12 }, (_, i) => (
        <mesh key={`channel-${i}`} position={[0, 0.07, 0]} rotation={[-Math.PI / 2, 0, (i * Math.PI) / 6]}>
          <planeGeometry args={[0.045, 7.2]} />
          <meshBasicMaterial
            color={i % 2 === 0 ? "#4b9fff" : "#8063ff"}
            transparent
            opacity={0.72}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* center lightning crest */}
      <group position={[0, 0.09, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh position={[0.28, 0.38, 0]} rotation={[0, 0, -0.42]}>
          <boxGeometry args={[0.48, 2.95, 0.035]} />
          <meshBasicMaterial color="#7acaff" toneMapped={false} />
        </mesh>
        <mesh position={[-0.22, -0.72, 0]} rotation={[0, 0, 0.5]}>
          <boxGeometry args={[0.44, 2.05, 0.035]} />
          <meshBasicMaterial color="#9d82ff" toneMapped={false} />
        </mesh>
      </group>

      {/* perimeter rails and lanterns */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 1.08, 0]}>
        <torusGeometry args={[10.15, 0.095, 10, 96]} />
        <meshStandardMaterial color="#1b1d29" metalness={0.62} roughness={0.4} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.55, 0]}>
        <torusGeometry args={[10.15, 0.035, 8, 96]} />
        <meshBasicMaterial color="#387fe0" toneMapped={false} />
      </mesh>
      {lanternAngles.map((angle) => <Lantern key={angle} angle={angle} />)}

      {/* hero framing architecture */}
      <SummitPillar position={[-8.25, 0, -6.5]} side={-1} />
      <SummitPillar position={[8.25, 0, -6.5]} side={1} />
      <SummitPillar position={[-8.25, 0, 6.5]} side={1} />
      <SummitPillar position={[8.25, 0, 6.5]} side={-1} />
      <Gate />
      <AnimatedBanner position={[-8.25, 4.35, -6.1]} width={1.35} height={2.8} phase={1.8} color="#261c4f" />
      <AnimatedBanner position={[8.25, 4.35, -6.1]} width={1.35} height={2.8} phase={3.1} color="#4b182a" accent="#ff6f8d" />

      {/* mountain depth layers */}
      {mountainPeaks.map(([x, y, z, size, rot], i) => (
        <mesh key={`mountain-${i}`} position={[x, y, z]} rotation={[0, rot, 0]}>
          <coneGeometry args={[size * 0.68, size, 6]} />
          <meshStandardMaterial color={i % 2 === 0 ? "#25253a" : "#302b42"} roughness={1} metalness={0} />
        </mesh>
      ))}
      {mountainPeaks.slice(1, 7).map(([x, , , size], i) => (
        <mesh key={`near-${i}`} position={[x * 0.72, -6.4, -34 - (i % 2) * 3]} rotation={[0, i * 0.2, 0]}>
          <coneGeometry args={[size * 0.5, size * 0.72, 5]} />
          <meshStandardMaterial color="#1b1c2b" roughness={1} />
        </mesh>
      ))}

      {/* sun + cloud sea + moving cloud banks */}
      <mesh position={[-24, 11.5, -63]}>
        <sphereGeometry args={[4.8, 24, 24]} />
        <meshBasicMaterial color="#ff9b62" toneMapped={false} />
      </mesh>
      <pointLight position={[-18, 10, -35]} color="#ff885c" intensity={5} distance={45} decay={2} />
      <mesh position={[0, -4.6, -23]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[45, 64]} />
        <meshBasicMaterial color="#7b6e8d" transparent opacity={0.16} depthWrite={false} />
      </mesh>
      <CloudBank baseX={-18} baseY={5.2} baseZ={-45} scale={1.5} phase={0.4} />
      <CloudBank baseX={21} baseY={7.4} baseZ={-52} scale={1.8} phase={2.1} />
      <CloudBank baseX={2} baseY={1.6} baseZ={-31} scale={0.85} phase={4.0} />

      <EnergyMotes />
    </>
  );
}
