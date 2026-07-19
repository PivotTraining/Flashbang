import { ROBOT_POSITION } from "../state/ballStore";

// Training robot: dark smooth humanoid armor, simple face, orange chest
// target circle, no extra weapons/parts (handoff doc §7).
export default function Robot() {
  const [x, , z] = ROBOT_POSITION;

  return (
    <group position={[x, 0, z]}>
      {/* legs */}
      <mesh position={[-0.22, 0.5, 0]} castShadow>
        <boxGeometry args={[0.28, 1, 0.32]} />
        <meshStandardMaterial color="#2b2f36" metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh position={[0.22, 0.5, 0]} castShadow>
        <boxGeometry args={[0.28, 1, 0.32]} />
        <meshStandardMaterial color="#2b2f36" metalness={0.4} roughness={0.4} />
      </mesh>

      {/* torso */}
      <mesh position={[0, 1.35, 0]} castShadow>
        <boxGeometry args={[0.9, 1.1, 0.5]} />
        <meshStandardMaterial color="#363b44" metalness={0.5} roughness={0.35} />
      </mesh>

      {/* orange chest target */}
      <mesh position={[0, 1.35, 0.26]}>
        <circleGeometry args={[0.16, 32]} />
        <meshStandardMaterial
          color="#ff8a1e"
          emissive="#ff8a1e"
          emissiveIntensity={0.6}
        />
      </mesh>

      {/* arms */}
      <mesh position={[-0.62, 1.35, 0]} castShadow>
        <boxGeometry args={[0.24, 0.9, 0.24]} />
        <meshStandardMaterial color="#2b2f36" metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh position={[0.62, 1.35, 0]} castShadow>
        <boxGeometry args={[0.24, 0.9, 0.24]} />
        <meshStandardMaterial color="#2b2f36" metalness={0.4} roughness={0.4} />
      </mesh>

      {/* head with simple face */}
      <mesh position={[0, 2.15, 0]} castShadow>
        <boxGeometry args={[0.42, 0.42, 0.42]} />
        <meshStandardMaterial color="#40454f" metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[-0.1, 2.17, 0.22]}>
        <circleGeometry args={[0.045, 16]} />
        <meshBasicMaterial color="#7fe8ff" />
      </mesh>
      <mesh position={[0.1, 2.17, 0.22]}>
        <circleGeometry args={[0.045, 16]} />
        <meshBasicMaterial color="#7fe8ff" />
      </mesh>
    </group>
  );
}
