import * as THREE from "three";

const pillars: Array<[number, number, number]> = [
  [-8.3, 0, -6.4],
  [8.3, 0, -6.4],
  [-8.3, 0, 5.3],
  [8.3, 0, 5.3],
];

const mountainPeaks: Array<[number, number, number, number]> = [
  [-24, -2.5, -32, 9],
  [-14, -3.5, -38, 13],
  [-3, -4, -42, 16],
  [10, -3.2, -37, 12],
  [22, -2.8, -33, 10],
  [32, -3.8, -41, 15],
  [-34, -3.4, -40, 14],
];

const sparkPoints: Array<[number, number, number, number]> = [
  [-7, 2.8, -3, 0.05], [6.5, 3.5, -6, 0.04], [4, 2.2, 5, 0.045],
  [-5, 4.4, 6, 0.04], [1.8, 5.1, -7.5, 0.035], [-2.6, 3.8, -8, 0.04],
  [8.2, 4.1, 1.5, 0.05], [-8.1, 3.1, 1, 0.04], [0, 6.2, -10, 0.05],
];

function Pillar({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.92, 1.12, 0.7, 8]} />
        <meshStandardMaterial color="#171927" roughness={0.8} metalness={0.18} />
      </mesh>
      <mesh position={[0, 2.55, 0]} castShadow>
        <cylinderGeometry args={[0.58, 0.72, 4.0, 8]} />
        <meshStandardMaterial color="#242638" roughness={0.72} metalness={0.22} />
      </mesh>
      <mesh position={[0, 4.65, 0]} castShadow>
        <cylinderGeometry args={[0.86, 0.62, 0.42, 8]} />
        <meshStandardMaterial color="#141621" roughness={0.7} metalness={0.25} />
      </mesh>
      <mesh position={[0, 2.45, 0.6]}>
        <boxGeometry args={[0.12, 2.55, 0.06]} />
        <meshStandardMaterial
          color="#5ab7ff"
          emissive="#3e8cff"
          emissiveIntensity={3.6}
          toneMapped={false}
        />
      </mesh>
      <pointLight position={[0, 3.4, 0.65]} color="#4fa8ff" intensity={3.5} distance={5.5} />
    </group>
  );
}

function RailSegment({ x, z, rotation = 0 }: { x: number; z: number; rotation?: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, rotation, 0]}>
      <mesh position={[-1.6, 0.75, 0]} castShadow>
        <boxGeometry args={[0.16, 1.5, 0.16]} />
        <meshStandardMaterial color="#171925" metalness={0.5} roughness={0.52} />
      </mesh>
      <mesh position={[1.6, 0.75, 0]} castShadow>
        <boxGeometry args={[0.16, 1.5, 0.16]} />
        <meshStandardMaterial color="#171925" metalness={0.5} roughness={0.52} />
      </mesh>
      <mesh position={[0, 1.18, 0]} castShadow>
        <boxGeometry args={[3.35, 0.12, 0.14]} />
        <meshStandardMaterial color="#2b2e3e" metalness={0.62} roughness={0.42} />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[3.35, 0.055, 0.08]} />
        <meshStandardMaterial color="#3e86d7" emissive="#2f79d8" emissiveIntensity={2.4} toneMapped={false} />
      </mesh>
    </group>
  );
}

export default function Arena() {
  return (
    <>
      <color attach="background" args={["#16172b"]} />
      <fog attach="fog" args={["#28243f", 21, 66]} />

      <ambientLight intensity={0.2} />
      <hemisphereLight args={["#738dcc", "#24192b", 0.38]} />
      <directionalLight
        position={[-10, 13, 8]}
        color="#ffb173"
        intensity={2.35}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />
      <directionalLight position={[7, 7, -12]} color="#659bff" intensity={0.85} />

      {/* THUNDER SUMMIT: raised stone-tech battle dais. */}
      <mesh position={[0, -0.46, -1]} receiveShadow castShadow>
        <cylinderGeometry args={[10.7, 11.25, 0.9, 64]} />
        <meshStandardMaterial color="#242632" roughness={0.8} metalness={0.18} />
      </mesh>
      <mesh position={[0, -0.03, -1]} receiveShadow>
        <cylinderGeometry args={[9.85, 9.85, 0.08, 64]} />
        <meshStandardMaterial color="#343541" roughness={0.78} metalness={0.14} />
      </mesh>

      {/* Outer and inner architectural rings. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, -1]}>
        <ringGeometry args={[8.55, 9.3, 64]} />
        <meshStandardMaterial color="#171a27" metalness={0.62} roughness={0.38} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.038, -1]}>
        <ringGeometry args={[7.98, 8.13, 64]} />
        <meshStandardMaterial color="#4b91ff" emissive="#377df0" emissiveIntensity={3.5} toneMapped={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, -1]}>
        <ringGeometry args={[4.25, 4.4, 64]} />
        <meshStandardMaterial color="#6a54ff" emissive="#5443e8" emissiveIntensity={2.9} toneMapped={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.041, -1]}>
        <circleGeometry args={[2.05, 48]} />
        <meshStandardMaterial color="#252535" roughness={0.72} metalness={0.24} />
      </mesh>

      {/* Lightning crest at center. */}
      <group position={[0, 0.07, -1]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh position={[0.22, 0.32, 0]} rotation={[0, 0, -0.42]}>
          <boxGeometry args={[0.45, 2.8, 0.04]} />
          <meshStandardMaterial color="#75c9ff" emissive="#4aa8ff" emissiveIntensity={4.2} toneMapped={false} />
        </mesh>
        <mesh position={[-0.2, -0.65, 0]} rotation={[0, 0, 0.48]}>
          <boxGeometry args={[0.42, 2.0, 0.04]} />
          <meshStandardMaterial color="#9174ff" emissive="#765cff" emissiveIntensity={4.0} toneMapped={false} />
        </mesh>
      </group>

      {/* Radial energy channels give the floor direction and scale. */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <mesh
          key={`channel-${i}`}
          position={[0, 0.055, -1]}
          rotation={[-Math.PI / 2, 0, (i * Math.PI) / 4]}
        >
          <planeGeometry args={[0.055, 6.8]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? "#3d8dff" : "#7658ff"}
            emissive={i % 2 === 0 ? "#3d8dff" : "#7658ff"}
            emissiveIntensity={2.2}
            transparent
            opacity={0.72}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* Four summit pylons frame the arena without blocking combat. */}
      {pillars.map((position, i) => <Pillar key={`pillar-${i}`} position={position} />)}

      {/* Perimeter rails: low enough for the lock-on camera to see over. */}
      <RailSegment x={0} z={7.7} />
      <RailSegment x={-5.2} z={6.35} rotation={Math.PI / 5.5} />
      <RailSegment x={5.2} z={6.35} rotation={-Math.PI / 5.5} />
      <RailSegment x={-8.55} z={2.0} rotation={Math.PI / 2.55} />
      <RailSegment x={8.55} z={2.0} rotation={-Math.PI / 2.55} />

      {/* Main shrine-tech banner behind the enemy side. */}
      <group position={[0, 0, -11.6]}>
        <mesh position={[-2.35, 3.0, 0]} castShadow>
          <boxGeometry args={[0.42, 6.0, 0.52]} />
          <meshStandardMaterial color="#171824" metalness={0.4} roughness={0.6} />
        </mesh>
        <mesh position={[2.35, 3.0, 0]} castShadow>
          <boxGeometry args={[0.42, 6.0, 0.52]} />
          <meshStandardMaterial color="#171824" metalness={0.4} roughness={0.6} />
        </mesh>
        <mesh position={[0, 5.65, 0]} castShadow>
          <boxGeometry args={[5.2, 0.4, 0.58]} />
          <meshStandardMaterial color="#202230" metalness={0.48} roughness={0.5} />
        </mesh>
        <mesh position={[0, 3.25, 0.15]}>
          <planeGeometry args={[3.7, 4.45]} />
          <meshStandardMaterial color="#421b32" roughness={0.76} side={THREE.DoubleSide} />
        </mesh>
        <group position={[0, 3.25, 0.2]}>
          <mesh position={[0.16, 0.45, 0]} rotation={[0, 0, -0.38]}>
            <boxGeometry args={[0.32, 2.15, 0.04]} />
            <meshBasicMaterial color="#88caff" toneMapped={false} />
          </mesh>
          <mesh position={[-0.18, -0.38, 0]} rotation={[0, 0, 0.48]}>
            <boxGeometry args={[0.3, 1.45, 0.04]} />
            <meshBasicMaterial color="#a58cff" toneMapped={false} />
          </mesh>
        </group>
      </group>

      {/* Distant stylized mountain silhouettes establish scale/depth. */}
      {mountainPeaks.map(([x, y, z, size], i) => (
        <mesh key={`mountain-${i}`} position={[x, y, z]} rotation={[0, i * 0.28, 0]}>
          <coneGeometry args={[size * 0.66, size, 5]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? "#25263c" : "#303047"}
            roughness={1}
            metalness={0}
          />
        </mesh>
      ))}

      {/* A low cloud/fog shelf beneath the summit sells the altitude. */}
      <mesh position={[0, -3.1, -19]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[37, 64]} />
        <meshBasicMaterial color="#716b8f" transparent opacity={0.19} depthWrite={false} />
      </mesh>

      {/* Warm horizon orb behind the mountains. */}
      <mesh position={[-18, 11, -48]}>
        <sphereGeometry args={[4.6, 24, 24]} />
        <meshBasicMaterial color="#ff9b63" toneMapped={false} />
      </mesh>

      {/* Sparse energy motes: enough life without visual noise. */}
      {sparkPoints.map(([x, y, z, size], i) => (
        <mesh key={`spark-${i}`} position={[x, y, z]}>
          <sphereGeometry args={[size, 8, 8]} />
          <meshBasicMaterial color={i % 2 === 0 ? "#65b9ff" : "#9a75ff"} toneMapped={false} />
        </mesh>
      ))}
    </>
  );
}
