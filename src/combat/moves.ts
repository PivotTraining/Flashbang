// Data-driven combat library. The first 20 moves mirror Jaxon's hand-drawn
// swipe chart exactly; the original prototype IDs remain as compatibility
// aliases for tests and older UI paths.

export type SwipeDir = "up" | "down" | "left" | "right" | "forward";
export type MoveCategory = "punch" | "kick" | "power" | "movement";

export type MoveId =
  | "jab"
  | "straightPunch"
  | "uppercut"
  | "hookPunchRight"
  | "hookPunchLeft"
  | "roundKickRight"
  | "roundKickLeft"
  | "frontKick"
  | "sideKick"
  | "backKick"
  | "sweepKick"
  | "axeKick"
  | "spinningBackKick"
  | "jumpKick"
  | "kneeStrike"
  | "hammerFist"
  | "overhandPunch"
  | "elbowStrike"
  | "bodyPunch"
  | "doublePunch"
  | "ballThrow"
  | "dash"
  // compatibility aliases
  | "punch"
  | "risingKick"
  | "legSweep"
  | "roundKick"
  | "spinKick";

export interface MoveDef {
  id: MoveId;
  name: string;
  category: MoveCategory;
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
  /** Ordered token groups used to bind the closest real skeleton clip at runtime. */
  animationHints: string[][];
}

const move = (
  id: MoveId,
  name: string,
  category: MoveCategory,
  dir: SwipeDir,
  damage: number,
  range: number,
  windup: number,
  active: number,
  recovery: number,
  knockback: number,
  color: string,
  animationHints: string[][],
  extra: Partial<Pick<MoveDef, "blockable" | "launches" | "hitstop" | "shake">> = {},
): MoveDef => ({
  id,
  name,
  category,
  dir,
  damage,
  range,
  windup,
  active,
  recovery,
  knockback,
  color,
  animationHints,
  blockable: extra.blockable ?? true,
  launches: extra.launches,
  hitstop: extra.hitstop ?? Math.min(0.115, 0.045 + damage * 0.0045),
  shake: extra.shake ?? Math.min(0.46, 0.12 + damage * 0.021),
});

export const MOVES: Record<MoveId, MoveDef> = {
  jab: move("jab", "Jab", "punch", "right", 5, 2.15, .045, .075, .095, 1.0, "#54c7ff", [["jab"], ["punch", "left"], ["punch"]]),
  straightPunch: move("straightPunch", "Straight Punch", "punch", "right", 7, 2.35, .07, .1, .13, 1.5, "#39baff", [["punch", "cross"], ["straight", "punch"], ["punch"]]),
  uppercut: move("uppercut", "Uppercut", "punch", "up", 10, 2.2, .1, .105, .19, 2.3, "#6fd8ff", [["uppercut"], ["upper", "punch"], ["punch"]], { launches: true }),
  hookPunchRight: move("hookPunchRight", "Hook Punch (Right)", "punch", "right", 8, 2.28, .09, .1, .16, 1.8, "#49c3ff", [["hook", "right"], ["hook", "punch"], ["punch"]]),
  hookPunchLeft: move("hookPunchLeft", "Hook Punch (Left)", "punch", "left", 8, 2.28, .09, .1, .16, 1.8, "#49c3ff", [["hook", "left"], ["hook", "punch"], ["punch"]]),
  roundKickRight: move("roundKickRight", "Round Kick (Right)", "kick", "right", 10, 2.55, .12, .11, .2, 2.4, "#6ad6ff", [["round", "kick", "right"], ["round", "kick"], ["kick", "right"], ["kick"]]),
  roundKickLeft: move("roundKickLeft", "Round Kick (Left)", "kick", "left", 10, 2.55, .12, .11, .2, 2.4, "#6ad6ff", [["round", "kick", "left"], ["round", "kick"], ["kick", "left"], ["kick"]]),
  frontKick: move("frontKick", "Front Kick", "kick", "up", 8, 2.45, .1, .105, .17, 1.9, "#9bdcff", [["front", "kick"], ["kick", "front"], ["kick"]]),
  sideKick: move("sideKick", "Side Kick", "kick", "right", 11, 2.65, .13, .11, .21, 2.8, "#75bfff", [["side", "kick"], ["kick", "side"], ["kick"]]),
  backKick: move("backKick", "Back Kick", "kick", "left", 12, 2.65, .15, .11, .23, 3.0, "#8d9eff", [["back", "kick"], ["kick", "back"], ["kick"]]),
  sweepKick: move("sweepKick", "Sweep Kick", "kick", "right", 9, 2.5, .16, .12, .26, 1.5, "#ff629d", [["sweep"], ["low", "kick"], ["kick"]], { blockable: false, launches: true }),
  axeKick: move("axeKick", "Axe Kick", "kick", "down", 13, 2.35, .17, .12, .27, 3.0, "#ff9a55", [["axe", "kick"], ["down", "kick"], ["kick"]]),
  spinningBackKick: move("spinningBackKick", "Spinning Back Kick", "kick", "left", 14, 2.75, .18, .13, .28, 3.5, "#9a78ff", [["spinning", "back", "kick"], ["spin", "kick"], ["back", "kick"], ["kick"]]),
  jumpKick: move("jumpKick", "Jump Kick", "kick", "up", 13, 2.6, .16, .13, .28, 3.0, "#ffd063", [["jump", "kick"], ["flying", "kick"], ["kick"]], { launches: true }),
  kneeStrike: move("kneeStrike", "Knee Strike", "kick", "up", 9, 1.95, .08, .09, .16, 1.7, "#ffc167", [["knee", "strike"], ["knee"], ["kick"]]),
  hammerFist: move("hammerFist", "Hammer Fist", "punch", "down", 10, 2.05, .11, .1, .18, 2.1, "#6cc8ff", [["hammer", "fist"], ["hammer"], ["punch"]]),
  overhandPunch: move("overhandPunch", "Overhand Punch", "punch", "down", 11, 2.25, .13, .105, .2, 2.5, "#4cb9ff", [["overhand", "punch"], ["overhand"], ["punch"]]),
  elbowStrike: move("elbowStrike", "Elbow Strike", "punch", "right", 8, 1.85, .065, .085, .14, 1.6, "#5dd0ff", [["elbow", "strike"], ["elbow"], ["punch"]]),
  bodyPunch: move("bodyPunch", "Body Punch", "punch", "right", 7, 2.0, .065, .095, .13, 1.3, "#4fc7ff", [["body", "punch"], ["punch", "body"], ["punch"]]),
  doublePunch: move("doublePunch", "Double Punch", "punch", "right", 12, 2.35, .1, .16, .2, 2.4, "#73d4ff", [["double", "punch"], ["punch", "combo"], ["punch"]]),

  ballThrow: move("ballThrow", "Flashy Direct Blast", "power", "forward", 12, 22, .24, .16, .28, 2.4, "#9f6bff", [["spell", "simple", "shoot"], ["spell", "shoot"], ["shoot"], ["cast"]]),
  dash: move("dash", "Dash", "movement", "forward", 0, 0, 0, 0, .26, 0, "#a3f7bf", [["dash"], ["sprint"]], { blockable: false, hitstop: 0, shake: 0 }),

  // Compatibility aliases. New touch combat never emits these IDs.
  punch: move("punch", "Flash Punch", "punch", "left", 7, 2.35, .07, .11, .13, 1.4, "#36b9ff", [["punch", "cross"], ["punch"]]),
  risingKick: move("risingKick", "Rising Face Kick", "kick", "up", 15, 2.3, .14, .13, .3, 2.6, "#ffb038", [["high", "kick"], ["front", "kick"], ["kick"]], { launches: true }),
  legSweep: move("legSweep", "Low Leg Sweep", "kick", "down", 11, 2.4, .17, .12, .32, 1.4, "#ff6b9d", [["sweep"], ["low", "kick"], ["kick"]], { blockable: false, launches: true }),
  roundKick: move("roundKick", "Round Kick", "kick", "left", 9, 2.5, .11, .1, .19, 2.1, "#5bc8ff", [["round", "kick"], ["kick"]]),
  spinKick: move("spinKick", "Spin Kick", "kick", "right", 13, 2.7, .15, .12, .24, 3.2, "#7c8bff", [["spin", "kick"], ["kick"]]),
};

export const JAXON_MOVE_IDS: MoveId[] = [
  "jab", "straightPunch", "uppercut", "hookPunchRight", "hookPunchLeft",
  "roundKickRight", "roundKickLeft", "frontKick", "sideKick", "backKick",
  "sweepKick", "axeKick", "spinningBackKick", "jumpKick", "kneeStrike",
  "hammerFist", "overhandPunch", "elbowStrike", "bodyPunch", "doublePunch",
];

export const MOVE_BY_DIR: Record<SwipeDir, MoveId> = {
  up: "uppercut",
  down: "axeKick",
  left: "hookPunchLeft",
  right: "straightPunch",
  forward: "ballThrow",
};

export const QUICK_MOVES: MoveId[] = ["jab", "straightPunch", "roundKickRight", "sweepKick", "uppercut", "ballThrow"];

export function totalMoveDuration(m: MoveDef) {
  return m.windup + m.active + m.recovery;
}
