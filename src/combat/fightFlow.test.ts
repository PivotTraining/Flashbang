import { beforeEach, describe, expect, it } from "vitest";
import { useCombatStore, registerDistanceGetter, MAX_CONDITION } from "./combatStore";
import { JAXON_MOVE_IDS, MOVES, type MoveId } from "./moves";
import { decideAction, desiredApproach, DIFFICULTY } from "../ai/enemyAI";
import { classifyJaxonGesture } from "../input/useJaxonGestures";
import { useFighterStyleStore } from "../state/fighterStyleStore";
import { useScreenStore } from "../state/screenStore";

const STEP = 1 / 60;
let distance = 2;

function stepUntilSettled(id: "player" | "enemy", maxSeconds = 5) {
  let elapsed = 0;
  while (elapsed < maxSeconds) {
    const fighter = useCombatStore.getState()[id];
    if (fighter.phase === "idle" || fighter.phase === "down") return;
    useCombatStore.getState().tick(STEP);
    elapsed += STEP;
  }
  throw new Error(`${id} never returned to neutral within ${maxSeconds}s`);
}

beforeEach(() => {
  distance = 2;
  registerDistanceGetter(() => distance);
  useCombatStore.getState().reset();
  useScreenStore.setState({ screen: "home" });
  useFighterStyleStore.setState({ playerCostume: "classic", enemyCostume: "inferno" });
});

describe("production fight flow", () => {
  it("routes Home -> Play costume select -> Battle while preserving both costumes", () => {
    const nav = useScreenStore.getState().navigate;
    nav("play");
    expect(useScreenStore.getState().screen).toBe("play");

    useFighterStyleStore.getState().setPlayerCostume("storm");
    useFighterStyleStore.getState().setEnemyCostume("blackout");
    nav("battle");

    expect(useScreenStore.getState().screen).toBe("battle");
    expect(useFighterStyleStore.getState().playerCostume).toBe("storm");
    expect(useFighterStyleStore.getState().enemyCostume).toBe("blackout");
  });

  it("CPU closes from spawn distance, attacks, lands repeated hits, and can KO the player", () => {
    const config = DIFFICULTY.pro;
    distance = 6.4;
    let decisionClock = 0;
    let sawWindup = false;
    let sawHit = false;
    let sawRecovery = false;

    for (let frame = 0; frame < 60 * 45 && !useCombatStore.getState().roundOver; frame += 1) {
      const store = useCombatStore.getState();
      const enemy = store.enemy;

      if (enemy.phase === "windup") sawWindup = true;
      if (enemy.phase === "recovery") sawRecovery = true;
      if (store.lastHit?.attacker === "enemy") sawHit = true;

      if (enemy.phase === "idle") {
        const approach = desiredApproach(enemy, distance, config);
        distance = Math.max(0.6, distance - approach * STEP);
      }

      decisionClock -= STEP;
      if (decisionClock <= 0 && enemy.phase === "idle" && !store.roundOver) {
        decisionClock = config.decisionInterval;
        const action = decideAction({
          self: enemy,
          opponent: store.player,
          distance,
          config,
          random: () => 0.1,
        });
        if (action.kind === "attack") store.tryMove("enemy", action.moveId);
        else if (action.kind === "guard") store.setGuard("enemy", action.on);
      }

      useCombatStore.getState().tick(STEP);
    }

    const end = useCombatStore.getState();
    expect(distance).toBeLessThanOrEqual(config.preferredRange + 0.5);
    expect(sawWindup).toBe(true);
    expect(sawHit).toBe(true);
    expect(sawRecovery).toBe(true);
    expect(end.hitCounter).toBeGreaterThan(1);
    expect(end.player.condition).toBe(0);
    expect(end.winner).toBe("enemy");
    expect(end.roundOver).toBe(true);
  });

  it("a player attack can interrupt an enemy attack when it lands first", () => {
    distance = 1.7;
    expect(useCombatStore.getState().tryMove("enemy", "overhandPunch")).toBe(true);
    expect(useCombatStore.getState().tryMove("player", "jab")).toBe(true);

    for (let i = 0; i < 120; i += 1) useCombatStore.getState().tick(STEP);

    const state = useCombatStore.getState();
    expect(state.enemy.condition).toBeLessThan(MAX_CONDITION);
    expect(state.lastHit).not.toBeNull();
  });
});

describe("Jaxon's 20-move combat contract", () => {
  for (const id of JAXON_MOVE_IDS) {
    it(`${MOVES[id].name} enters combat, hits once, damages, and returns to neutral`, () => {
      distance = Math.min(1.6, MOVES[id].range - 0.05);
      const accepted = useCombatStore.getState().tryMove("player", id);
      expect(accepted).toBe(true);
      expect(useCombatStore.getState().player.phase).toBe("windup");

      stepUntilSettled("player");
      const state = useCombatStore.getState();

      expect(state.enemy.condition).toBe(MAX_CONDITION - MOVES[id].damage);
      expect(state.lastHit?.moveId).toBe(id);
      expect(state.lastHit?.attacker).toBe("player");
      expect(state.hitCounter).toBe(1);
      expect(state.player.phase).toBe("idle");
      expect(state.player.moveId).toBeNull();
    });
  }

  it("all 20 chart moves are unique IDs with positive damage and usable melee range", () => {
    expect(new Set(JAXON_MOVE_IDS).size).toBe(20);
    for (const id of JAXON_MOVE_IDS) {
      expect(MOVES[id].damage).toBeGreaterThan(0);
      expect(MOVES[id].range).toBeGreaterThanOrEqual(1.8);
      expect(MOVES[id].animationHints.length).toBeGreaterThan(0);
    }
  });
});

describe("gesture recognition smoke tests", () => {
  const g = (pts: Array<[number, number]>, startY = pts[0][1], height = 400) =>
    classifyJaxonGesture(pts.map(([x, y]) => ({ x, y })), startY, height);

  it("disambiguates the reused straight-right arrow by length and screen zone", () => {
    expect(g([[10, 100], [60, 100]])).toBe("jab");
    expect(g([[10, 100], [140, 100]])).toBe("straightPunch");
    expect(g([[10, 300], [140, 300]], 300)).toBe("bodyPunch");
    expect(g([[10, 100], [230, 100]])).toBe("sideKick");
  });

  it("recognizes vertical, diagonal, hook, round, sweep and spin families", () => {
    const cases: Array<[MoveId, Array<[number, number]>]> = [
      ["uppercut", [[100, 240], [100, 170], [100, 80]]],
      ["hookPunchRight", [[40, 180], [25, 120], [70, 70], [150, 75], [205, 120]]],
      ["hookPunchLeft", [[205, 180], [220, 120], [175, 70], [95, 75], [40, 120]]],
      ["roundKickRight", [[30, 210], [55, 120], [120, 65], [185, 120], [210, 210]]],
      ["roundKickLeft", [[210, 210], [185, 120], [120, 65], [55, 120], [30, 210]]],
      ["frontKick", [[30, 230], [80, 210], [145, 155], [210, 70]]],
      ["backKick", [[210, 170], [155, 145], [95, 125], [35, 110]]],
      ["sweepKick", [[30, 170], [90, 145], [155, 145], [215, 160]]],
      ["axeKick", [[55, 60], [105, 80], [155, 145], [170, 230]]],
      ["spinningBackKick", [[170, 60], [220, 115], [195, 185], [120, 215], [45, 175], [60, 125]]],
      ["kneeStrike", [[40, 220], [140, 120]]],
      ["hammerFist", [[40, 80], [150, 200]]],
      ["elbowStrike", [[40, 70], [70, 155], [110, 155], [210, 155]]],
      ["doublePunch", [[35, 110], [120, 90], [90, 180], [150, 175], [220, 160]]],
    ];

    for (const [expected, points] of cases) expect(g(points)).toBe(expected);
  });
});
