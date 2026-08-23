import { useCallback, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import Arena from "../scene/Arena";
import ImportedStageProps from "../scene/ImportedStageProps";
import ProceduralEnvironment from "../scene/ProceduralEnvironment";
import BattlePlayer from "../scene/BattlePlayer";
import Enemy, { enemyTransform } from "../scene/Enemy";
import BattleCamera from "../scene/BattleCamera";
import CombatLoop from "../systems/CombatLoop";
import DevBridge from "../systems/DevBridge";
import BattleHUD from "./BattleHUD";
import { useAttackKeys } from "../input/useSwipe";
import { useJaxonGestureInput } from "../input/useJaxonGestures";
import { MOVE_BY_DIR, type MoveId, type SwipeDir } from "../combat/moves";
import { useCombatStore } from "../combat/combatStore";
import { useScreenStore } from "../state/screenStore";
import { playerTransform } from "../scene/playerTransform";

function InputBridge() {
  const perform = useCallback((moveId: MoveId) => {
    const store = useCombatStore.getState();
    if (!store.roundOver) store.tryMove("player", moveId);
  }, []);

  const handleDir = useCallback((dir: SwipeDir) => perform(MOVE_BY_DIR[dir]), [perform]);
  const handleGuard = useCallback((on: boolean) => {
    useCombatStore.getState().setGuard("player", on);
  }, []);

  // Touch/mouse strokes use the full 20-shape move sheet. Keyboard arrows remain
  // a simple accessibility/debug mirror through the four primary directions.
  useJaxonGestureInput(perform);
  useAttackKeys(handleDir, handleGuard);

  return null;
}

export default function BattleScreen() {
  const navigate = useScreenStore((s) => s.navigate);
  const reset = useCombatStore((s) => s.reset);

  useEffect(() => {
    reset();
    playerTransform.position.set(0, 0, 3.2);
    enemyTransform.position.set(0, 0, -3.2);
  }, [reset]);

  return (
    <div className="battle-shell">
      <Canvas
        shadows
        dpr={[1, 1.6]}
        camera={{ fov: 52, position: [0, 3, 10] }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 0.88;
          gl.outputColorSpace = THREE.SRGBColorSpace;
        }}
      >
        <ProceduralEnvironment intensity={0.68} />
        <Arena />
        <ImportedStageProps />
        <BattlePlayer />
        <Enemy />
        <BattleCamera />
        <CombatLoop />
        <DevBridge />
        <EffectComposer>
          <Bloom intensity={1.05} luminanceThreshold={0.68} luminanceSmoothing={0.34} mipmapBlur />
          <Vignette eskil={false} offset={0.12} darkness={0.88} />
        </EffectComposer>
      </Canvas>
      <InputBridge />
      <BattleHUD />

      <div className="stage-chip" aria-hidden="true">
        <span>THUNDER SUMMIT</span>
        <small>SUMMIT ARENA · ROUND 01</small>
      </div>

      <div className="rotate-hint" aria-hidden="true">
        <strong>ROTATE YOUR PHONE</strong>
        <span>Flashbang is built for landscape combat.</span>
      </div>

      <button data-ui className="battle-home" onClick={() => navigate("home")}>← HOME</button>
      <button
        data-ui
        onClick={() => navigate("play")}
        style={{ position: "absolute", top: 54, left: 14, zIndex: 12, borderRadius: 999, border: "1px solid rgba(116,207,255,.35)", background: "rgba(5,10,20,.72)", color: "#dff5ff", padding: "7px 12px", fontSize: 8, fontWeight: 900, letterSpacing: 1.1, cursor: "pointer" }}
      >
        COSTUMES
      </button>
    </div>
  );
}
