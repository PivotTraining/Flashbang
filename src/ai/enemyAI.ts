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
  rookie: { preferredRange: 1.75, decisionInterval: 0.85, aggression: 0.5, defensiveness: 0.2, moveSpeed: 2.6 },
  pro: { preferredRange: 1.6, decisionInterval: 0.5, aggression: 0.72, defensiveness: 0.3, moveSpeed: 3.4 },
  legend: { preferredRange: 1.5, decisionInterval: 0.3, aggression: 0.85, defensiveness: 0.38, moveSpeed: 4.1 },
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

function viableMoves(distance: number) {
  // Small safety margin means the strike still connects if knockback or one
  // frame of separation changes the exact center distance before the active frame.
  return MELEE.filter((id) => distance <= Math.max(0.4, MOVES[id].range - 0.08));
}

export function decideAction(ctx: AIContext): AIAction {
  const { self, opponent, distance, config, random } = ctx;
  if (self.phase !== "idle") return { kind: "none" };

  const viable = viableMoves(distance);
  if (viable.length === 0) return { kind: "guard", on: false };

  if (opponent.phase === "recovery") {
    const punish = [...viable].sort((a, b) => MOVES[b].damage - MOVES[a].damage)[0];
    return { kind: "attack", moveId: punish };
  }

  if (opponent.phase === "windup" && random() < config.defensiveness) {
    return { kind: "guard", on: true };
  }

  if (random() < config.aggression) {
    if (opponent.guarding && viable.includes("sweepKick") && random() < 0.7) {
      return { kind: "attack", moveId: "sweepKick" };
    }
    const pick = viable[Math.floor(random() * viable.length) % viable.length];
    return { kind: "attack", moveId: pick };
  }

  return { kind: "guard", on: random() < config.defensiveness };
}

export function desiredApproach(self: Fighter, distance: number, config: AIConfig): number {
  if (self.phase !== "idle") return 0;
  const deadzone = 0.18;
  if (distance > config.preferredRange + deadzone) return config.moveSpeed;
  if (distance < config.preferredRange - deadzone) return -config.moveSpeed * 0.55;
  return 0;
}

export function attackReach(moveId: MoveId) {
  return MOVES[moveId].range;
}
