import { Canvas } from "@react-three/fiber";
import Arena from "./scene/Arena";
import Player from "./scene/Player";
import Robot from "./scene/Robot";
import Ball from "./scene/Ball";
import CameraRig from "./scene/CameraRig";
import GameLoop from "./systems/GameLoop";
import HUD from "./ui/HUD";
import { useActionKey } from "./input/useKeyboard";
import { useBallStore } from "./state/ballStore";

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

export default function App() {
  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
      <Canvas shadows camera={{ fov: 55, position: [0, 3, 10] }}>
        <Arena />
        <Player />
        <Robot />
        <Ball />
        <CameraRig />
        <GameLoop />
      </Canvas>
      <ActionBridge />
      <HUD />
    </div>
  );
}
