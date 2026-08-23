import { MOVES, type MoveId } from "../combat/moves";
import type { Fighter } from "../combat/combatStore";

export interface AIConfig {
  preferredRange: number;
  decisionInterval: number;
  aggression: number;
  defensiveness: number;
  moveSpeed: number;
}

export const DIFFICULTY: Record<"rookie" | "pro" | "legend", AIConfig> = {
  rookie: { preferredRange: 2.2, decisionInterval: 0.85, aggression: 0.5, defensiveness: 0.2, moveSpeed: 2.6 },
  pro: { preferredRange: 2.1, decisionInterval: 0.5, aggression: 0.72, defensiveness: 0.3, moveSpeed: 3.4 },
  legend: { preferredRange: 2.0, decisionInterval: 0.3, aggression: 0.85, defensiveness: 0.38, moveSpeed: 4.1 },
};

const MELEE: MoveId[] = [
  "jab", "straightPunch", "uppercut", "hookPunchRight", "hookPunchLeft",
  "roundKickRight", "roundKickLeft", "frontKick", "sideKick", "backKick",
  "sweepKick", "axeKick", "spinningBackKick", "jumpKick", "kneeStrike",
  "hammerFist", "overhandPunch", "elbowStrike", "bodyPunch", "doublePunch",
];

export type AIAction =
  | { kind: "none" }
  | { kind: "guard"; on: boolean }
  | { kind: "attack"; moveId: MoveId };

export interface AIContext {
  self: Fighter;
  opponent: Fighter;
  distance: number;
  config: AIConfig;
  random: () => number;
}

export function decideAction(ctx: AIContext): AIAction {
  const { self, opponent, distance, config, random } = ctx;
  if (self.phase !== "idle") return { kind: "none" };

  const inRange = distance <= config.preferredRange + 0.5;
  if (inRange && opponent.phase === "recovery") return { kind: "attack", moveId: "uppercut" };

  if (opponent.phase === "windup" && random() < config.defensiveness) {
    return { kind: "guard", on: true };
  }

  if (!inRange) return { kind: "guard", on: false };

  if (random() < config.aggression) {
    if (opponent.guarding && random() < 0.7) return { kind: "attack", moveId: "sweepKick" };
    const pick = MELEE[Math.floor(random() * MELEE.length) % MELEE.length];
    return { kind: "attack", moveId: pick };
  }

  return { kind: "guard", on: random() < config.defensiveness };
}

export function desiredApproach(self: Fighter, distance: number, config: AIConfig): number {
  if (self.phase !== "idle") return 0;
  const deadzone = 0.35;
  if (distance > config.preferredRange + deadzone) return config.moveSpeed;
  if (distance < config.preferredRange - deadzone) return -config.moveSpeed * 0.7;
  return 0;
}

export function attackReach(moveId: MoveId) {
  return MOVES[moveId].range;
}
