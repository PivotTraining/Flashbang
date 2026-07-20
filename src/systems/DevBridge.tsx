import { useEffect } from "react";
import { useThree, advance } from "@react-three/fiber";
import { useCombatStore } from "../combat/combatStore";
import { playerTransform } from "../scene/playerTransform";
import { enemyTransform } from "../scene/Enemy";

// Dev-only inspection handle.
//
// Embedded preview browsers report document.hidden === true, which pauses
// requestAnimationFrame — so the render loop never advances and the canvas
// stays blank no matter how correct the scene is. This exposes a manual
// pump plus the combat state, which is the only way to verify rendering and
// fight flow in that environment. Stripped from production builds.
export default function DevBridge() {
  const get = useThree((s) => s.get);

  useEffect(() => {
    if (!import.meta.env.DEV) return;

    // Seed from real time: r3f derives its frame delta from the timestamp we
    // hand it, so starting at 0 after the internal clock has already run
    // yields a non-positive delta and nothing advances.
    let clock = performance.now();
    (window as Window & { __flashbang?: unknown }).__flashbang = {
      /** Advance n frames of ~16ms, driving useFrame and rendering. */
      step(frames = 1) {
        for (let i = 0; i < frames; i++) {
          clock += 16.67;
          advance(clock, true);
        }
        return clock;
      },
      state: () => {
        const c = useCombatStore.getState();
        return {
          player: c.player,
          enemy: c.enemy,
          combo: c.combo,
          hitstop: +c.hitstop.toFixed(3),
          shake: +c.shake.toFixed(3),
          winner: c.winner,
          lastHit: c.lastHit,
          distance: +playerTransform.position
            .distanceTo(enemyTransform.position)
            .toFixed(2),
          camera: get().camera.position.toArray().map((n) => +n.toFixed(2)),
        };
      },
      attack: (moveId: string) =>
        useCombatStore.getState().tryMove("player", moveId as never),
      combat: useCombatStore,
    };

    return () => {
      delete (window as Window & { __flashbang?: unknown }).__flashbang;
    };
  }, [get]);

  return null;
}
