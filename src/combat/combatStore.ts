import { create } from "zustand";
import { MOVES, totalMoveDuration, type MoveId } from "./moves";

export type FighterId = "player" | "enemy";
export type Phase = "idle" | "windup" | "active" | "recovery" | "stagger" | "down";

export interface Fighter {
  condition: number;
  phase: Phase;
  moveId: MoveId | null;
  phaseElapsed: number;
  hasHit: boolean;
  guarding: boolean;
  staggerDuration: number;
  knockback: number;
}

export const MAX_CONDITION = 100;
const STAGGER_DURATION = 0.36;
const LAUNCH_STAGGER_DURATION = 0.62;
const COMBO_WINDOW = 1.4;
const BLOCK_CHIP_FRACTION = 0.18;

function makeFighter(): Fighter {
  return {
    condition: MAX_CONDITION,
    phase: "idle",
    moveId: null,
    phaseElapsed: 0,
    hasHit: false,
    guarding: false,
    staggerDuration: 0,
    knockback: 0,
  };
}

let getDistance: () => number = () => 99;
export function registerDistanceGetter(fn: () => number) {
  getDistance = fn;
}

export interface HitEvent {
  id: number;
  attacker: FighterId;
  moveId: MoveId;
  damage: number;
  blocked: boolean;
}

interface CombatStore {
  player: Fighter;
  enemy: Fighter;
  hitstop: number;
  shake: number;
  combo: number;
  comboTimer: number;
  lastHit: HitEvent | null;
  hitCounter: number;
  winner: FighterId | null;
  roundOver: boolean;
  aiCooldown: number;
  canAct: (id: FighterId) => boolean;
  tryMove: (id: FighterId, moveId: MoveId) => boolean;
  setGuard: (id: FighterId, on: boolean) => void;
  reset: () => void;
  tick: (dt: number) => void;
}

export const useCombatStore = create<CombatStore>((set, get) => ({
  player: makeFighter(),
  enemy: makeFighter(),
  hitstop: 0,
  shake: 0,
  combo: 0,
  comboTimer: 0,
  lastHit: null,
  hitCounter: 0,
  winner: null,
  roundOver: false,
  aiCooldown: 0.9,

  canAct: (id) => {
    const f = get()[id];
    return f.phase === "idle" && !get().roundOver;
  },

  tryMove: (id, moveId) => {
    if (!get().canAct(id)) return false;
    const f = get()[id];
    set({
      [id]: {
        ...f,
        phase: "windup",
        moveId,
        phaseElapsed: 0,
        hasHit: false,
        guarding: false,
      },
    } as Partial<CombatStore>);
    return true;
  },

  setGuard: (id, on) => {
    const f = get()[id];
    if (f.phase !== "idle") return;
    set({ [id]: { ...f, guarding: on } } as Partial<CombatStore>);
  },

  reset: () =>
    set({
      player: makeFighter(),
      enemy: makeFighter(),
      hitstop: 0,
      shake: 0,
      combo: 0,
      comboTimer: 0,
      lastHit: null,
      hitCounter: 0,
      winner: null,
      roundOver: false,
      aiCooldown: 0.9,
    }),

  tick: (dt) => {
    const s = get();

    if (s.hitstop > 0) {
      set({
        hitstop: Math.max(0, s.hitstop - dt),
        shake: Math.max(0, s.shake - dt * 2.4),
      });
      return;
    }

    const next: Partial<CombatStore> = {
      shake: Math.max(0, s.shake - dt * 2.4),
      comboTimer: Math.max(0, s.comboTimer - dt),
    };
    const comboLapsed = s.comboTimer > 0 && s.comboTimer - dt <= 0;

    const player = { ...s.player };
    const enemy = { ...s.enemy };
    const fighters: Record<FighterId, Fighter> = { player, enemy };

    let hitstop = 0;
    let shake = next.shake as number;
    let combo = comboLapsed ? 0 : s.combo;
    let comboTimer = next.comboTimer as number;
    let lastHit = s.lastHit;
    let hitCounter = s.hitCounter;
    let winner = s.winner;

    const distance = getDistance();

    for (const id of ["player", "enemy"] as FighterId[]) {
      const f = fighters[id];
      const other = fighters[id === "player" ? "enemy" : "player"];
      f.knockback *= Math.max(0, 1 - dt * 6);
      f.phaseElapsed += dt;

      if (f.phase === "down") continue;

      if (f.phase === "stagger") {
        if (f.phaseElapsed >= f.staggerDuration) {
          f.phase = "idle";
          f.phaseElapsed = 0;
          f.moveId = null;
        }
        continue;
      }

      if (!f.moveId) continue;
      const move = MOVES[f.moveId];

      if (f.phase === "windup" && f.phaseElapsed >= move.windup) {
        f.phase = "active";
        f.phaseElapsed = 0;
      }

      if (f.phase === "active") {
        if (!f.hasHit && distance <= move.range && other.phase !== "down") {
          f.hasHit = true;
          const blocked = other.guarding && move.blockable;
          const damage = blocked ? Math.round(move.damage * BLOCK_CHIP_FRACTION) : move.damage;

          other.condition = Math.max(0, other.condition - damage);
          other.knockback = blocked ? move.knockback * 0.35 : move.knockback;

          if (!blocked) {
            other.phase = "stagger";
            other.phaseElapsed = 0;
            other.staggerDuration = move.launches ? LAUNCH_STAGGER_DURATION : STAGGER_DURATION;
            other.moveId = null;
            other.guarding = false;
          }

          hitstop = Math.max(hitstop, blocked ? move.hitstop * 0.4 : move.hitstop);
          shake = Math.max(shake, blocked ? move.shake * 0.3 : move.shake);

          if (id === "player" && !blocked) {
            combo += 1;
            comboTimer = COMBO_WINDOW;
          }

          hitCounter += 1;
          lastHit = { id: hitCounter, attacker: id, moveId: move.id, damage, blocked };

          if (other.condition <= 0) {
            other.phase = "down";
            other.phaseElapsed = 0;
            other.moveId = null;
            winner = id;
          }
        }

        if (f.phaseElapsed >= move.active) {
          f.phase = "recovery";
          f.phaseElapsed = 0;
        }
      }

      if (f.phase === "recovery" && f.phaseElapsed >= move.recovery) {
        f.phase = "idle";
        f.phaseElapsed = 0;
        f.moveId = null;
      }
    }

    set({
      ...next,
      player,
      enemy,
      hitstop,
      shake,
      combo,
      comboTimer,
      lastHit,
      hitCounter,
      winner,
      roundOver: winner !== null,
    });
  },
}));

export { totalMoveDuration };
