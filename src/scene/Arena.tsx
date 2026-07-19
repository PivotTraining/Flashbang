// Bright, uncluttered daytime training arena per handoff doc §7.
export default function Arena() {
  return (
    <>
      <color attach="background" args={["#cfe8ff"]} />
      <fog attach="fog" args={["#cfe8ff", 25, 55]} />

      <ambientLight intensity={0.9} />
      <directionalLight
        position={[8, 12, 6]}
        intensity={1.6}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <hemisphereLight args={["#bfe3ff", "#dff2c2", 0.6]} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#e9edf2" />
      </mesh>

      {/* faint ring marking the training circle, no clutter beyond this */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -1]}>
        <ringGeometry args={[7.6, 7.8, 64]} />
        <meshBasicMaterial color="#c7d0da" />
      </mesh>
    </>
  );
}
