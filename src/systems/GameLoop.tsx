import { useFrame } from "@react-three/fiber";
import { useBallStore } from "../state/ballStore";

// Drives all time-based ball/catch state (handoff doc §25 ball state
// machine + §27 catch timing), ticked once per rendered frame.
export default function GameLoop() {
  const tick = useBallStore((s) => s.tick);
  useFrame((_, dt) => {
    tick(Math.min(dt, 0.05));
  });
  return null;
}
