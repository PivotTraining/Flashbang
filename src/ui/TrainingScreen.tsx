import { Canvas } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import Arena from "../scene/Arena";
import ProceduralEnvironment from "../scene/ProceduralEnvironment";
import Player from "../scene/Player";
import Robot from "../scene/Robot";
import Ball from "../scene/Ball";
import CameraRig from "../scene/CameraRig";
import GameLoop from "../systems/GameLoop";
import HUD from "./HUD";
import { useActionKey } from "../input/useKeyboard";
import { useBallStore } from "../state/ballStore";
import { useScreenStore } from "../state/screenStore";

function ActionBridge() {
  const throwToRobot = useBallStore((s) => s.throwToRobot);
  const attemptCatch = useBallStore((s) => s.attemptCatch);
  const state = useBallStore((s) => s.state);

  useActionKey(() => {
    if (state === "Held") throwToRobot();
    else if (state === "CatchWindow") attemptCatch();
  });

  return null;
}

export default function TrainingScreen() {
  const navigate = useScreenStore((s) => s.navigate);

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ fov: 55, position: [0, 3, 10] }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
        }}
      >
        <ProceduralEnvironment intensity={0.5} />
        <Arena />
        <Player />
        <Robot />
        <Ball />
        <CameraRig />
        <GameLoop />
        <EffectComposer>
          {/* subtle in daylight — only the ball/energy should bloom */}
          <Bloom
            intensity={0.72}
            luminanceThreshold={0.85}
            luminanceSmoothing={0.25}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>
      <ActionBridge />
      <HUD />
      <button style={backStyle} onClick={() => navigate("home")}>
        ← Home
      </button>
    </div>
  );
}

const backStyle: React.CSSProperties = {
  position: "absolute",
  top: 14,
  left: 16,
  background: "rgba(0,0,0,0.45)",
  border: "1px solid rgba(255,255,255,0.4)",
  color: "#fff",
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: 0.6,
  padding: "8px 14px",
  borderRadius: 8,
  cursor: "pointer",
  zIndex: 3,
};
