// Move library. Data-driven so new moves are added here rather than hard-coded in the engine.

export type SwipeDir = "up" | "down" | "left" | "right" | "forward";

export type MoveId =
  | "punch"
  | "risingKick"
  | "legSweep"
  | "roundKick"
  | "spinKick"
  | "ballThrow"
  | "dash";

export interface MoveDef {
  id: MoveId;
  name: string;
  dir: SwipeDir;
  windup: number;
  active: number;
  recovery: number;
  damage: number;
  range: number;
  knockback: number;
  hitstop: number;
  shake: number;
  blockable: boolean;
  launches?: boolean;
  color: string;
}

export const MOVES: Record<MoveId, MoveDef> = {
  punch: {
    id: "punch",
    name: "Flash Punch",
    dir: "left",
    windup: 0.07,
    active: 0.11,
    recovery: 0.13,
    damage: 7,
    range: 2.35,
    knockback: 1.4,
    hitstop: 0.055,
    shake: 0.17,
    blockable: true,
    color: "#36b9ff",
  },
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
    blockable: false,
    launches: true,
    color: "#ff6b9d",
  },
  ballThrow: {
    id: "ballThrow",
    name: "Energy Blast",
    dir: "forward",
    windup: 0.24,
    active: 0.16,
    recovery: 0.28,
    damage: 12,
    range: 22,
    knockback: 2.4,
    hitstop: 0.08,
    shake: 0.3,
    blockable: true,
    color: "#9f6bff",
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
  left: "punch",
  right: "spinKick",
  forward: "ballThrow",
};

export function totalMoveDuration(m: MoveDef) {
  return m.windup + m.active + m.recovery;
}
