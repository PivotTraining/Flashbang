// Bright, uncluttered daytime training arena per handoff doc §7.
export default function Arena() {
  return (
    <>
      <color attach="background" args={["#cfe8ff"]} />
      <fog attach="fog" args={["#cfe8ff", 25, 55]} />

      {/* Kept low — ProceduralEnvironment supplies most of the fill, so
          these only shape the sun direction and shadows. */}
      <ambientLight intensity={0.18} />
      <directionalLight
        position={[8, 12, 6]}
        intensity={1.9}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={14}
        shadow-camera-bottom={-14}
      />
      <hemisphereLight args={["#bfe3ff", "#e6efd8", 0.22]} />

      {/* Mid-tone floor: bright enough to read as daylight, dark enough that
          it never crosses the bloom threshold and washes the scene out. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#8f9aa8" roughness={0.85} metalness={0.05} />
      </mesh>

      {/* faint ring marking the training circle, no clutter beyond this */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -1]}>
        <ringGeometry args={[7.6, 7.8, 64]} />
        <meshBasicMaterial color="#6f7b8a" />
      </mesh>

      {/* inner marker ring for depth reference while moving */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -1]}>
        <ringGeometry args={[3.5, 3.6, 64]} />
        <meshBasicMaterial color="#7e8a99" />
      </mesh>
    </>
  );
}
