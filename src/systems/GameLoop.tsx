import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useBallStore } from "../state/ballStore";

const FIXED_STEP = 1 / 60;
// Cap catch-up work so a long stall (tab backgrounded, shader compile) can't
// trigger a death spiral of thousands of steps in one frame.
const MAX_STEPS_PER_FRAME = 5;

// Drives all time-based ball/catch state (handoff doc §25 ball state
// machine + §27 catch timing).
//
// Fixed timestep rather than raw frame delta: catch timing is a skill
// mechanic, so the marker must travel at the same real-world speed whether
// the device runs at 120fps or 20fps. Feeding a clamped delta straight in
// would make the whole loop run in slow motion on slow hardware.
export default function GameLoop() {
  const tick = useBallStore((s) => s.tick);
  const accumulator = useRef(0);

  useFrame((_, delta) => {
    accumulator.current += Math.min(delta, 0.25);

    let steps = 0;
    while (accumulator.current >= FIXED_STEP && steps < MAX_STEPS_PER_FRAME) {
      tick(FIXED_STEP);
      accumulator.current -= FIXED_STEP;
      steps++;
    }

    // Discard leftover backlog beyond the cap so we don't stay behind forever.
    if (steps === MAX_STEPS_PER_FRAME) accumulator.current = 0;
  });

  return null;
}
