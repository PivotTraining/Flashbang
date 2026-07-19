import { create } from "zustand";
import {
  DEFAULT_CATCH_CONFIG,
  computeMarker,
  evaluateCatch,
  type CatchResult,
} from "../systems/catchTiming";

// Ball state machine, ported from BallController (handoff doc §25).
// Simplified for the Pass-1 web prototype: only the states needed for a
// throw -> robot catch -> robot throws back -> player catch loop.
export type BallState =
  | "Held"
  | "Thrown"
  | "ResolvingMove"
  | "CatchWindow"
  | "Loose";

export type Owner = "player" | "robot";

export type Vec3 = [number, number, number];

const LEGAL_TRANSITIONS: Record<BallState, BallState[]> = {
  Held: ["Thrown"],
  Thrown: ["ResolvingMove", "CatchWindow"],
  ResolvingMove: ["Thrown"],
  CatchWindow: ["Held", "Loose"],
  Loose: ["Held"],
};

export const ROBOT_POSITION: Vec3 = [0, 1.1, -6];

let getPlayerHandPosition: () => Vec3 = () => [0, 1.1, 4];
export function registerPlayerHandPositionGetter(fn: () => Vec3) {
  getPlayerHandPosition = fn;
}

const THROW_DURATION = 0.85;
const ROBOT_HOLD_DURATION = 0.55;
const CATCH_WINDOW_START_T = 0.55;
const LOOSE_RESET_DURATION = 1.1;

function lerpVec3(a: Vec3, b: Vec3, t: number): Vec3 {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

interface BallStore {
  state: BallState;
  owner: Owner;
  position: Vec3;

  throwStart: Vec3;
  throwEnd: Vec3;
  throwElapsed: number;

  resolveElapsed: number;
  catchElapsed: number;
  catchMarker: number;
  looseElapsed: number;

  lastResult: CatchResult | null;
  throwCount: number;

  canThrow: () => boolean;
  throwToRobot: () => void;
  attemptCatch: () => void;
  tick: (dt: number) => void;
}

function transition(state: BallState, next: BallState): BallState {
  if (!LEGAL_TRANSITIONS[state]?.includes(next)) {
    console.warn(`Illegal ball transition ${state} -> ${next}`);
    return state;
  }
  return next;
}

export const useBallStore = create<BallStore>((set, get) => ({
  state: "Held",
  owner: "player",
  position: [0, 1.1, 4],

  throwStart: [0, 1.1, 4],
  throwEnd: ROBOT_POSITION,
  throwElapsed: 0,

  resolveElapsed: 0,
  catchElapsed: 0,
  catchMarker: 0,
  looseElapsed: 0,

  lastResult: null,
  throwCount: 0,

  canThrow: () => get().state === "Held" && get().owner === "player",

  throwToRobot: () => {
    const { state, owner } = get();
    if (state !== "Held" || owner !== "player") return;

    set({
      state: transition(state, "Thrown"),
      throwStart: getPlayerHandPosition(),
      throwEnd: ROBOT_POSITION,
      throwElapsed: 0,
      lastResult: null,
    });
  },

  attemptCatch: () => {
    const { state, catchMarker } = get();
    if (state !== "CatchWindow") return;

    const result = evaluateCatch(catchMarker, DEFAULT_CATCH_CONFIG);
    if (result === "Miss") {
      set({
        state: transition(state, "Loose"),
        lastResult: result,
        looseElapsed: 0,
      });
    } else {
      set({
        state: transition(state, "Held"),
        owner: "player",
        lastResult: result,
        position: getPlayerHandPosition(),
        throwCount: get().throwCount + 1,
      });
    }
  },

  tick: (dt: number) => {
    const s = get();

    switch (s.state) {
      case "Thrown": {
        const elapsed = s.throwElapsed + dt;
        const t = Math.min(elapsed / THROW_DURATION, 1);
        const arc = Math.sin(t * Math.PI) * 1.1;
        const base = lerpVec3(s.throwStart, s.throwEnd, t);
        const position: Vec3 = [base[0], base[1] + arc, base[2]];

        if (s.owner === "player" && t >= 1) {
          set({ state: transition(s.state, "ResolvingMove"), resolveElapsed: 0, position });
          return;
        }

        if (s.owner === "robot" && t >= CATCH_WINDOW_START_T) {
          set({
            state: transition(s.state, "CatchWindow"),
            catchElapsed: 0,
            catchMarker: 0,
            throwElapsed: elapsed,
            position,
          });
          return;
        }

        set({ throwElapsed: elapsed, position });
        return;
      }

      case "ResolvingMove": {
        const elapsed = s.resolveElapsed + dt;
        if (elapsed >= ROBOT_HOLD_DURATION) {
          set({
            state: transition(s.state, "Thrown"),
            owner: "robot",
            throwStart: ROBOT_POSITION,
            throwEnd: getPlayerHandPosition(),
            throwElapsed: 0,
          });
          return;
        }
        set({ resolveElapsed: elapsed, position: ROBOT_POSITION });
        return;
      }

      case "CatchWindow": {
        const elapsed = s.catchElapsed + dt;
        const marker = computeMarker(elapsed, DEFAULT_CATCH_CONFIG.cyclesPerSecond);

        const t = Math.min(s.throwElapsed / THROW_DURATION, 1);
        const arc = Math.sin(t * Math.PI) * 1.1;
        const base = lerpVec3(s.throwStart, s.throwEnd, t);
        const position: Vec3 = [base[0], base[1] + arc, base[2]];

        if (elapsed >= DEFAULT_CATCH_CONFIG.maximumDuration) {
          set({
            state: transition(s.state, "Loose"),
            lastResult: "Miss",
            looseElapsed: 0,
            position,
          });
          return;
        }

        set({ catchElapsed: elapsed, catchMarker: marker, position });
        return;
      }

      case "Loose": {
        const elapsed = s.looseElapsed + dt;
        if (elapsed >= LOOSE_RESET_DURATION) {
          set({
            state: transition(s.state, "Held"),
            owner: "player",
            position: getPlayerHandPosition(),
          });
          return;
        }
        set({ looseElapsed: elapsed });
        return;
      }

      case "Held": {
        if (s.owner === "player") {
          set({ position: getPlayerHandPosition() });
        }
        return;
      }
    }
  },
}));
