import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useCombatStore } from "../combat/combatStore";

const FIXED_STEP = 1 / 60;
const MAX_STEPS_PER_FRAME = 5;

// Fixed timestep for the same reason GameLoop uses one: attack windows are
// measured in frames of advantage, so windup/active/recovery must resolve at
// identical real-world speed regardless of refresh rate. A variable delta
// would make the enemy's punish window wider on slow hardware.
export default function CombatLoop() {
  const accumulator = useRef(0);

  useFrame((_, delta) => {
    accumulator.current += Math.min(delta, 0.25);

    let steps = 0;
    const tick = useCombatStore.getState().tick;
    while (accumulator.current >= FIXED_STEP && steps < MAX_STEPS_PER_FRAME) {
      tick(FIXED_STEP);
      accumulator.current -= FIXED_STEP;
      steps++;
    }

    if (steps === MAX_STEPS_PER_FRAME) accumulator.current = 0;
  });

  return null;
}
