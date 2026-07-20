import { describe, it, expect, beforeEach, vi } from "vitest";
import { useBallStore, registerPlayerHandPositionGetter } from "./ballStore";
import {
  DEFAULT_CATCH_CONFIG,
  computeMarker,
  evaluateCatch,
} from "../systems/catchTiming";

const HAND: [number, number, number] = [0, 1.1, 4];
const STEP = 1 / 60;

/** Advance the simulation by `seconds` in fixed steps, as GameLoop does. */
function advance(seconds: number) {
  const steps = Math.round(seconds / STEP);
  for (let i = 0; i < steps; i++) useBallStore.getState().tick(STEP);
}

/** Run until `predicate` holds, or fail after `limit` seconds of sim time. */
function advanceUntil(predicate: () => boolean, limit = 10) {
  const maxSteps = Math.round(limit / STEP);
  for (let i = 0; i < maxSteps; i++) {
    if (predicate()) return true;
    useBallStore.getState().tick(STEP);
  }
  return predicate();
}

beforeEach(() => {
  registerPlayerHandPositionGetter(() => HAND);
  useBallStore.setState({
    state: "Held",
    owner: "player",
    position: HAND,
    throwStart: HAND,
    throwEnd: HAND,
    throwElapsed: 0,
    resolveElapsed: 0,
    catchElapsed: 0,
    catchMarker: 0,
    looseElapsed: 0,
    lastResult: null,
    throwCount: 0,
  });
});

describe("catch zone evaluation", () => {
  const cfg = DEFAULT_CATCH_CONFIG;

  it("returns Perfect inside the green band", () => {
    expect(evaluateCatch(cfg.greenStart, cfg)).toBe("Perfect");
    expect(evaluateCatch((cfg.greenStart + cfg.greenEnd) / 2, cfg)).toBe("Perfect");
    expect(evaluateCatch(cfg.greenEnd, cfg)).toBe("Perfect");
  });

  it("returns Risk in the yellow padding on both sides", () => {
    expect(evaluateCatch(cfg.greenStart - 0.01, cfg)).toBe("Risk");
    expect(evaluateCatch(cfg.greenEnd + 0.01, cfg)).toBe("Risk");
    expect(evaluateCatch(cfg.greenStart - cfg.yellowPadding, cfg)).toBe("Risk");
  });

  it("returns Miss outside the yellow padding", () => {
    expect(evaluateCatch(0, cfg)).toBe("Miss");
    expect(evaluateCatch(1, cfg)).toBe("Miss");
    expect(evaluateCatch(cfg.greenStart - cfg.yellowPadding - 0.01, cfg)).toBe("Miss");
  });
});

describe("catch marker motion", () => {
  it("starts at zero and ping-pongs within 0..1", () => {
    expect(computeMarker(0, 1)).toBeCloseTo(0);
    for (let t = 0; t < 5; t += 0.037) {
      const m = computeMarker(t, DEFAULT_CATCH_CONFIG.cyclesPerSecond);
      expect(m).toBeGreaterThanOrEqual(0);
      expect(m).toBeLessThanOrEqual(1);
    }
  });

  it("reverses direction rather than snapping back", () => {
    expect(computeMarker(0.5, 1)).toBeCloseTo(0.5);
    expect(computeMarker(1, 1)).toBeCloseTo(1);
    expect(computeMarker(1.5, 1)).toBeCloseTo(0.5);
  });
});

describe("ball state machine", () => {
  it("rejects an illegal transition and keeps the current state", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    // Held -> Held is not in the legal table; attemptCatch outside a catch
    // window must be a no-op rather than a state change.
    useBallStore.getState().attemptCatch();
    expect(useBallStore.getState().state).toBe("Held");
    warn.mockRestore();
  });

  it("ignores a throw when the ball is not held by the player", () => {
    useBallStore.setState({ owner: "robot" });
    useBallStore.getState().throwToRobot();
    expect(useBallStore.getState().state).toBe("Held");
  });

  it("moves Held -> Thrown on a player throw", () => {
    useBallStore.getState().throwToRobot();
    expect(useBallStore.getState().state).toBe("Thrown");
  });

  it("reaches the robot and hands off to ResolvingMove", () => {
    useBallStore.getState().throwToRobot();
    const reached = advanceUntil(
      () => useBallStore.getState().state === "ResolvingMove",
    );
    expect(reached).toBe(true);
  });

  it("opens a catch window on the robot's return throw", () => {
    useBallStore.getState().throwToRobot();
    const opened = advanceUntil(
      () => useBallStore.getState().state === "CatchWindow",
    );
    expect(opened).toBe(true);
    expect(useBallStore.getState().owner).toBe("robot");
  });

  it("times out an unanswered catch window into a Miss", () => {
    useBallStore.getState().throwToRobot();
    advanceUntil(() => useBallStore.getState().state === "CatchWindow");
    advance(DEFAULT_CATCH_CONFIG.maximumDuration + 0.1);

    expect(useBallStore.getState().state).toBe("Loose");
    expect(useBallStore.getState().lastResult).toBe("Miss");
  });

  it("resets a loose ball back to the player's hand", () => {
    useBallStore.getState().throwToRobot();
    advanceUntil(() => useBallStore.getState().state === "CatchWindow");
    advance(DEFAULT_CATCH_CONFIG.maximumDuration + 0.1);
    const recovered = advanceUntil(
      () => useBallStore.getState().state === "Held",
    );

    expect(recovered).toBe(true);
    expect(useBallStore.getState().owner).toBe("player");
  });

  it("completes a full throw -> catch cycle and counts one catch", () => {
    useBallStore.getState().throwToRobot();
    advanceUntil(() => useBallStore.getState().state === "CatchWindow");

    // step to the middle of the green band before tapping
    advanceUntil(() => {
      const m = useBallStore.getState().catchMarker;
      return m >= DEFAULT_CATCH_CONFIG.greenStart && m <= DEFAULT_CATCH_CONFIG.greenEnd;
    }, DEFAULT_CATCH_CONFIG.maximumDuration);

    useBallStore.getState().attemptCatch();

    const s = useBallStore.getState();
    expect(s.lastResult).toBe("Perfect");
    expect(s.state).toBe("Held");
    expect(s.owner).toBe("player");
    expect(s.throwCount).toBe(1);
  });

  it("counts a yellow-zone tap as a secured Risk catch, not a miss", () => {
    useBallStore.getState().throwToRobot();
    advanceUntil(() => useBallStore.getState().state === "CatchWindow");
    advanceUntil(() => {
      const m = useBallStore.getState().catchMarker;
      return (
        m >= DEFAULT_CATCH_CONFIG.greenStart - DEFAULT_CATCH_CONFIG.yellowPadding &&
        m < DEFAULT_CATCH_CONFIG.greenStart
      );
    }, DEFAULT_CATCH_CONFIG.maximumDuration);

    useBallStore.getState().attemptCatch();

    const s = useBallStore.getState();
    expect(s.lastResult).toBe("Risk");
    expect(s.state).toBe("Held");
    expect(s.throwCount).toBe(1);
  });

  it("never creates a second ball: one throw yields one catch opportunity", () => {
    useBallStore.getState().throwToRobot();
    // a second throw mid-flight must not restart the sequence
    useBallStore.getState().throwToRobot();
    expect(useBallStore.getState().state).toBe("Thrown");

    let windowOpenings = 0;
    let wasOpen = false;
    for (let i = 0; i < 600; i++) {
      const open = useBallStore.getState().state === "CatchWindow";
      if (open && !wasOpen) windowOpenings++;
      wasOpen = open;
      useBallStore.getState().tick(STEP);
      if (windowOpenings > 1) break;
    }
    expect(windowOpenings).toBe(1);
  });
});
