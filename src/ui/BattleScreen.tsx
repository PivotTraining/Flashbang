import { useCallback, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import Arena from "../scene/Arena";
import ProceduralEnvironment from "../scene/ProceduralEnvironment";
import BattlePlayer from "../scene/BattlePlayer";
import Enemy, { enemyTransform } from "../scene/Enemy";
import BattleCamera from "../scene/BattleCamera";
import CombatLoop from "../systems/CombatLoop";
import DevBridge from "../systems/DevBridge";
import BattleHUD from "./BattleHUD";
import { useSwipeInput, useAttackKeys } from "../input/useSwipe";
import { MOVE_BY_DIR, type SwipeDir } from "../combat/moves";
import { useCombatStore } from "../combat/combatStore";
import { useScreenStore } from "../state/screenStore";
import { playerTransform } from "../scene/playerTransform";

function InputBridge() {
  const handleDir = useCallback((dir: SwipeDir) => {
    const store = useCombatStore.getState();
    if (store.roundOver) return;
    store.tryMove("player", MOVE_BY_DIR[dir]);
  }, []);

  const handleGuard = useCallback((on: boolean) => {
    useCombatStore.getState().setGuard("player", on);
  }, []);

  // Pointer swipes and keys are two routes to the same intent, mirroring the
  // input-router split in the handoff doc (§16) — neither knows about moves.
  useSwipeInput({ onSwipe: handleDir });
  useAttackKeys(handleDir, handleGuard);

  return null;
}

export default function BattleScreen() {
  const navigate = useScreenStore((s) => s.navigate);
  const reset = useCombatStore((s) => s.reset);

  useEffect(() => {
    // Fresh round on entry, and place the fighters apart so the fight opens
    // at approach range rather than already touching.
    reset();
    playerTransform.position.set(0, 0, 3.2);
    enemyTransform.position.set(0, 0, -3.2);
  }, [reset]);

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        touchAction: "none",
        cursor: "crosshair",
      }}
    >
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ fov: 58, position: [0, 3, 10] }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
        }}
      >
        <ProceduralEnvironment intensity={0.5} />
        <Arena />
        <BattlePlayer />
        <Enemy />
        <BattleCamera />
        <CombatLoop />
        <DevBridge />
        <EffectComposer>
          <Bloom
            intensity={0.8}
            luminanceThreshold={0.82}
            luminanceSmoothing={0.25}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>
      <InputBridge />
      <BattleHUD />
      <button data-ui style={backStyle} onClick={() => navigate("home")}>
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
  zIndex: 7,
};
