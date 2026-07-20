import { describe, it, expect, beforeEach } from "vitest";
import {
  useCombatStore,
  registerDistanceGetter,
  MAX_CONDITION,
} from "./combatStore";
import { MOVES } from "./moves";
import { classifySwipe } from "../input/useSwipe";
import { decideAction, desiredApproach, DIFFICULTY } from "../ai/enemyAI";

const STEP = 1 / 60;

function step(seconds: number) {
  const n = Math.round(seconds / STEP);
  for (let i = 0; i < n; i++) useCombatStore.getState().tick(STEP);
}

/**
 * Advance until the fighter is back in neutral. Hitstop freezes phase
 * advancement, so stepping a fixed wall-clock duration equal to the move
 * length leaves the attack unfinished whenever it connected.
 */
function stepUntilIdle(id: "player" | "enemy" = "player", maxSeconds = 4) {
  let elapsed = 0;
  while (elapsed < maxSeconds) {
    const f = useCombatStore.getState()[id];
    if (f.phase === "idle" || f.phase === "down") return;
    useCombatStore.getState().tick(STEP);
    elapsed += STEP;
  }
  throw new Error(`${id} never returned to idle`);
}

let distance = 2.0;

beforeEach(() => {
  distance = 2.0;
  registerDistanceGetter(() => distance);
  useCombatStore.getState().reset();
});

describe("attack phases", () => {
  it("runs windup -> active -> recovery -> idle", () => {
    const store = useCombatStore.getState();
    distance = 99; // out of range so nothing interrupts the phase walk
    store.tryMove("player", "roundKick");
    const m = MOVES.roundKick;

    expect(useCombatStore.getState().player.phase).toBe("windup");

    step(m.windup + STEP);
    expect(useCombatStore.getState().player.phase).toBe("active");

    step(m.active + STEP);
    expect(useCombatStore.getState().player.phase).toBe("recovery");

    step(m.recovery + STEP);
    expect(useCombatStore.getState().player.phase).toBe("idle");
    expect(useCombatStore.getState().player.moveId).toBeNull();
  });

  it("rejects a new move while already attacking", () => {
    const store = useCombatStore.getState();
    distance = 99;
    expect(store.tryMove("player", "roundKick")).toBe(true);
    expect(useCombatStore.getState().tryMove("player", "spinKick")).toBe(false);
    expect(useCombatStore.getState().player.moveId).toBe("roundKick");
  });
});

describe("hit resolution", () => {
  it("damages the target when in range", () => {
    distance = 2.0;
    useCombatStore.getState().tryMove("player", "roundKick");
    stepUntilIdle();

    expect(useCombatStore.getState().enemy.condition).toBe(
      MAX_CONDITION - MOVES.roundKick.damage,
    );
  });

  it("whiffs when out of range", () => {
    distance = 8;
    useCombatStore.getState().tryMove("player", "roundKick");
    stepUntilIdle();

    expect(useCombatStore.getState().enemy.condition).toBe(MAX_CONDITION);
  });

  it("only lands once per attack, not once per frame", () => {
    distance = 2.0;
    useCombatStore.getState().tryMove("player", "spinKick");
    stepUntilIdle();

    expect(useCombatStore.getState().enemy.condition).toBe(
      MAX_CONDITION - MOVES.spinKick.damage,
    );
  });

  it("staggers the target out of neutral", () => {
    distance = 2.0;
    useCombatStore.getState().tryMove("player", "roundKick");
    step(MOVES.roundKick.windup + 0.02);
    // Just past hitstop, but well short of the stagger duration, so the
    // stagger is still in flight when we observe it.
    step(MOVES.roundKick.hitstop + 0.02);

    expect(useCombatStore.getState().enemy.phase).toBe("stagger");
  });

  it("applies hitstop and shake on connect", () => {
    distance = 2.0;
    useCombatStore.getState().tryMove("player", "risingKick");
    step(MOVES.risingKick.windup + 0.02);

    expect(useCombatStore.getState().hitstop).toBeGreaterThan(0);
    expect(useCombatStore.getState().shake).toBeGreaterThan(0);
  });

  it("freezes the simulation during hitstop", () => {
    distance = 2.0;
    useCombatStore.getState().tryMove("player", "risingKick");
    step(MOVES.risingKick.windup + 0.02);

    const frozen = useCombatStore.getState().player.phaseElapsed;
    useCombatStore.getState().tick(STEP);
    expect(useCombatStore.getState().player.phaseElapsed).toBe(frozen);
  });
});

describe("guard", () => {
  it("reduces damage and prevents stagger on a blockable attack", () => {
    distance = 2.0;
    useCombatStore.getState().setGuard("enemy", true);
    useCombatStore.getState().tryMove("player", "roundKick");
    stepUntilIdle();

    const enemy = useCombatStore.getState().enemy;
    expect(enemy.condition).toBeGreaterThan(MAX_CONDITION - MOVES.roundKick.damage);
    expect(enemy.phase).not.toBe("stagger");
  });

  it("does not stop a low sweep", () => {
    distance = 2.0;
    useCombatStore.getState().setGuard("enemy", true);
    useCombatStore.getState().tryMove("player", "legSweep");
    stepUntilIdle();

    expect(useCombatStore.getState().enemy.condition).toBe(
      MAX_CONDITION - MOVES.legSweep.damage,
    );
  });

  it("cannot be raised mid-attack", () => {
    distance = 99;
    useCombatStore.getState().tryMove("enemy", "roundKick");
    useCombatStore.getState().setGuard("enemy", true);
    expect(useCombatStore.getState().enemy.guarding).toBe(false);
  });
});

describe("combo counter", () => {
  it("increments on consecutive player hits", () => {
    distance = 2.0;
    useCombatStore.getState().tryMove("player", "roundKick");
    stepUntilIdle();
    expect(useCombatStore.getState().combo).toBe(1);

    useCombatStore.getState().tryMove("player", "roundKick");
    stepUntilIdle();
    expect(useCombatStore.getState().combo).toBe(2);
  });

  it("resets after the combo window lapses", () => {
    distance = 2.0;
    useCombatStore.getState().tryMove("player", "roundKick");
    stepUntilIdle();
    expect(useCombatStore.getState().combo).toBe(1);

    distance = 99;
    step(2.0);
    expect(useCombatStore.getState().combo).toBe(0);
  });
});

describe("knockout", () => {
  it("ends the round and names a winner", () => {
    distance = 2.0;
    for (let i = 0; i < 40 && !useCombatStore.getState().roundOver; i++) {
      useCombatStore.getState().tryMove("player", "risingKick");
      stepUntilIdle();
    }

    const s = useCombatStore.getState();
    expect(s.winner).toBe("player");
    expect(s.roundOver).toBe(true);
    expect(s.enemy.condition).toBe(0);
    expect(s.enemy.phase).toBe("down");
  });

  it("blocks further actions once the round is over", () => {
    distance = 2.0;
    for (let i = 0; i < 40 && !useCombatStore.getState().roundOver; i++) {
      useCombatStore.getState().tryMove("player", "risingKick");
      stepUntilIdle();
    }
    expect(useCombatStore.getState().tryMove("player", "roundKick")).toBe(false);
  });

  it("restores full condition on reset", () => {
    distance = 2.0;
    useCombatStore.getState().tryMove("player", "roundKick");
    stepUntilIdle();
    useCombatStore.getState().reset();

    const s = useCombatStore.getState();
    expect(s.enemy.condition).toBe(MAX_CONDITION);
    expect(s.player.condition).toBe(MAX_CONDITION);
    expect(s.winner).toBeNull();
  });
});

describe("swipe classification", () => {
  it("ignores strokes below the tap threshold", () => {
    expect(classifySwipe(4, 3)).toBeNull();
  });

  it("maps the four cardinal flicks", () => {
    expect(classifySwipe(0, -80)).toBe("up");
    expect(classifySwipe(0, 80)).toBe("down");
    expect(classifySwipe(-80, 0)).toBe("left");
    expect(classifySwipe(80, 0)).toBe("right");
  });

  it("resolves a sloppy diagonal to the dominant axis", () => {
    expect(classifySwipe(70, -30)).toBe("right");
    expect(classifySwipe(20, -70)).toBe("up");
  });
});

describe("enemy AI", () => {
  const idle = () => useCombatStore.getState().enemy;

  it("does not act while committed to a move", () => {
    distance = 99;
    useCombatStore.getState().tryMove("enemy", "roundKick");
    const action = decideAction({
      self: idle(),
      opponent: useCombatStore.getState().player,
      distance: 2,
      config: DIFFICULTY.pro,
      random: () => 0,
    });
    expect(action.kind).toBe("none");
  });

  it("punishes an opponent stuck in recovery", () => {
    distance = 99;
    useCombatStore.getState().tryMove("player", "roundKick");
    step(MOVES.roundKick.windup + MOVES.roundKick.active + 0.02);
    expect(useCombatStore.getState().player.phase).toBe("recovery");

    const action = decideAction({
      self: idle(),
      opponent: useCombatStore.getState().player,
      distance: 2,
      config: DIFFICULTY.pro,
      random: () => 0.99,
    });
    expect(action.kind).toBe("attack");
  });

  it("sweeps a turtling opponent", () => {
    useCombatStore.getState().setGuard("player", true);
    const action = decideAction({
      self: idle(),
      opponent: useCombatStore.getState().player,
      distance: 2,
      config: DIFFICULTY.pro,
      random: () => 0.1,
    });
    expect(action).toEqual({ kind: "attack", moveId: "legSweep" });
  });

  it("closes distance when too far and holds at preferred range", () => {
    const cfg = DIFFICULTY.pro;
    expect(desiredApproach(idle(), 8, cfg)).toBeGreaterThan(0);
    expect(desiredApproach(idle(), cfg.preferredRange, cfg)).toBe(0);
    expect(desiredApproach(idle(), 0.5, cfg)).toBeLessThan(0);
  });

  it("cannot reposition while attacking", () => {
    distance = 99;
    useCombatStore.getState().tryMove("enemy", "roundKick");
    expect(desiredApproach(idle(), 8, DIFFICULTY.pro)).toBe(0);
  });
});
