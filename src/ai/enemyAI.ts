import { MOVES, type MoveId } from "../combat/moves";
import type { Fighter } from "../combat/combatStore";

// Opponent behaviour. The enemy acts on its own clock rather than waiting
// for the player — that is the difference between a fight and a drill.
//
// Difficulty is expressed as reaction delay and aggression rather than
// damage multipliers, so a harder opponent feels faster instead of spongier.

export interface AIConfig {
  /** Preferred distance to sit at when not committing to an attack. */
  preferredRange: number;
  /** Seconds between decisions. Lower = more relentless. */
  decisionInterval: number;
  /** 0..1 chance to attack when in range on a given decision. */
  aggression: number;
  /** 0..1 chance to guard instead of attacking. */
  defensiveness: number;
  moveSpeed: number;
}

export const DIFFICULTY: Record<"rookie" | "pro" | "legend", AIConfig> = {
  rookie: {
    preferredRange: 2.2,
    decisionInterval: 0.85,
    aggression: 0.5,
    defensiveness: 0.2,
    moveSpeed: 2.6,
  },
  pro: {
    preferredRange: 2.1,
    decisionInterval: 0.5,
    aggression: 0.72,
    defensiveness: 0.3,
    moveSpeed: 3.4,
  },
  legend: {
    preferredRange: 2.0,
    decisionInterval: 0.3,
    aggression: 0.85,
    defensiveness: 0.38,
    moveSpeed: 4.1,
  },
};

const MELEE: MoveId[] = ["roundKick", "spinKick", "risingKick", "legSweep"];

export type AIAction =
  | { kind: "none" }
  | { kind: "guard"; on: boolean }
  | { kind: "attack"; moveId: MoveId };

export interface AIContext {
  self: Fighter;
  opponent: Fighter;
  distance: number;
  config: AIConfig;
  /** Injected so decisions stay deterministic under test. */
  random: () => number;
}

/**
 * Decides what the enemy does on this decision tick. Movement is handled
 * separately every frame; this only picks discrete actions.
 */
export function decideAction(ctx: AIContext): AIAction {
  const { self, opponent, distance, config, random } = ctx;

  if (self.phase !== "idle") return { kind: "none" };

  const inRange = distance <= config.preferredRange + 0.5;

  // Punish window: the opponent is stuck in recovery, so a committed attack
  // is guaranteed to land. Taking it makes whiffing feel costly.
  if (inRange && opponent.phase === "recovery") {
    return { kind: "attack", moveId: "risingKick" };
  }

  // Respect an incoming attack — guard rather than trading.
  if (opponent.phase === "windup" && random() < config.defensiveness) {
    return { kind: "guard", on: true };
  }

  if (!inRange) return { kind: "guard", on: false };

  if (random() < config.aggression) {
    // Sweep beats a held guard, so favour it when the player is turtling.
    if (opponent.guarding && random() < 0.7) {
      return { kind: "attack", moveId: "legSweep" };
    }
    const pick = MELEE[Math.floor(random() * MELEE.length) % MELEE.length];
    return { kind: "attack", moveId: pick };
  }

  return { kind: "guard", on: random() < config.defensiveness };
}

/**
 * Desired approach/retreat along the axis to the player, in units/sec.
 * Positive closes distance, negative backs off.
 */
export function desiredApproach(
  self: Fighter,
  distance: number,
  config: AIConfig,
): number {
  // Committed to an attack, or reeling — no free repositioning.
  if (self.phase !== "idle") return 0;

  const deadzone = 0.35;
  if (distance > config.preferredRange + deadzone) return config.moveSpeed;
  if (distance < config.preferredRange - deadzone) return -config.moveSpeed * 0.7;
  return 0;
}

export function attackReach(moveId: MoveId) {
  return MOVES[moveId].range;
}
