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

  useSwipeInput({ onSwipe: handleDir });
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
          <Bloom
            intensity={1.05}
            luminanceThreshold={0.68}
            luminanceSmoothing={0.34}
            mipmapBlur
          />
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

      <button data-ui className="battle-home" onClick={() => navigate("home")}>
        ← HOME
      </button>
    </div>
  );
}
