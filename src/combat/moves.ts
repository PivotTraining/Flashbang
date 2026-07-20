// Move library. Data-driven per the handoff doc (§18): moves are data, not
// hard-coded branches, so new ones are added here rather than in the engine.
//
// Pace note: simple directional flicks fire instantly, which is what keeps
// the fight fast. Multi-stroke patterns are reserved for specials, matching
// "simple attacks: easy patterns / secret attacks: harder patterns".

export type SwipeDir = "up" | "down" | "left" | "right" | "forward";

export type MoveId =
  | "risingKick"
  | "legSweep"
  | "roundKick"
  | "spinKick"
  | "ballThrow"
  | "dash";

export interface MoveDef {
  id: MoveId;
  name: string;
  /** Single-flick trigger. Multi-stroke specials come in a later pass. */
  dir: SwipeDir;
  /** Seconds from input to the hit window opening. Low = fast, punishable if missed. */
  windup: number;
  /** How long the hit window stays open. */
  active: number;
  /** Recovery after the window; the punish gap if you whiff. */
  recovery: number;
  damage: number;
  /** Max distance from attacker to defender for the hit to land. */
  range: number;
  knockback: number;
  /** Hitstop on connect, in seconds — the freeze that sells the impact. */
  hitstop: number;
  shake: number;
  /** Can the defender block this? Sweeps hit low, so no. */
  blockable: boolean;
  /** Staggers the target out of their own attack. */
  launches?: boolean;
  color: string;
}

export const MOVES: Record<MoveId, MoveDef> = {
  roundKick: {
    id: "roundKick",
    name: "Round Kick",
    dir: "left",
    windup: 0.11,
    active: 0.1,
    recovery: 0.19,
    damage: 9,
    range: 2.5,
    knockback: 2.1,
    hitstop: 0.07,
    shake: 0.22,
    blockable: true,
    color: "#5bc8ff",
  },
  spinKick: {
    id: "spinKick",
    name: "Spin Kick",
    dir: "right",
    windup: 0.15,
    active: 0.12,
    recovery: 0.24,
    damage: 13,
    range: 2.7,
    knockback: 3.2,
    hitstop: 0.09,
    shake: 0.32,
    blockable: true,
    color: "#7c8bff",
  },
  risingKick: {
    id: "risingKick",
    name: "Rising Face Kick",
    dir: "up",
    windup: 0.14,
    active: 0.13,
    recovery: 0.3,
    damage: 15,
    range: 2.3,
    knockback: 2.6,
    hitstop: 0.11,
    shake: 0.42,
    blockable: true,
    launches: true,
    color: "#ffb038",
  },
  legSweep: {
    id: "legSweep",
    name: "Low Leg Sweep",
    dir: "down",
    windup: 0.17,
    active: 0.12,
    recovery: 0.32,
    damage: 11,
    range: 2.4,
    knockback: 1.4,
    hitstop: 0.1,
    shake: 0.36,
    // hits low — beats a standing guard, which is what makes blocking a
    // read rather than a permanent answer
    blockable: false,
    launches: true,
    color: "#ff6b9d",
  },
  ballThrow: {
    id: "ballThrow",
    name: "Ball Throw",
    dir: "forward",
    windup: 0.12,
    active: 0.05,
    recovery: 0.26,
    damage: 12,
    range: 22,
    knockback: 2.4,
    hitstop: 0.08,
    shake: 0.3,
    blockable: true,
    color: "#ff9d3d",
  },
  dash: {
    id: "dash",
    name: "Dash",
    dir: "forward",
    windup: 0,
    active: 0,
    recovery: 0.26,
    damage: 0,
    range: 0,
    knockback: 0,
    hitstop: 0,
    shake: 0,
    blockable: false,
    color: "#a3f7bf",
  },
};

export const MOVE_BY_DIR: Record<SwipeDir, MoveId> = {
  up: "risingKick",
  down: "legSweep",
  left: "roundKick",
  right: "spinKick",
  forward: "ballThrow",
};

export function totalMoveDuration(m: MoveDef) {
  return m.windup + m.active + m.recovery;
}
