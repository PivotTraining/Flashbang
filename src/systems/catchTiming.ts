// Mirrors CatchWindowConfig / CatchTimingController from the Unity handoff doc (§27),
// ported to plain functions since there's no MonoBehaviour lifecycle here.

export interface CatchWindowConfig {
  greenStart: number;
  greenEnd: number;
  yellowPadding: number;
  cyclesPerSecond: number;
  maximumDuration: number;
}

export type CatchResult = "Perfect" | "Risk" | "Miss";

export const DEFAULT_CATCH_CONFIG: CatchWindowConfig = {
  greenStart: 0.42,
  greenEnd: 0.58,
  yellowPadding: 0.16,
  cyclesPerSecond: 1.1,
  maximumDuration: 1.1,
};

// Triangle wave 0 -> 1 -> 0, matching Mathf.PingPong(elapsed * cyclesPerSecond, 1f).
export function computeMarker(elapsed: number, cyclesPerSecond: number): number {
  const phase = (elapsed * cyclesPerSecond) % 2;
  return phase <= 1 ? phase : 2 - phase;
}

export function evaluateCatch(marker: number, config: CatchWindowConfig): CatchResult {
  if (marker >= config.greenStart && marker <= config.greenEnd) return "Perfect";

  const yellow =
    marker >= config.greenStart - config.yellowPadding &&
    marker <= config.greenEnd + config.yellowPadding;

  return yellow ? "Risk" : "Miss";
}
