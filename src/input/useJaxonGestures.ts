import { useEffect } from "react";
import type { MoveId } from "../combat/moves";

type Point = { x: number; y: number };

const MIN_DIST = 34;
const MAX_MS = 1100;

const TEMPLATES: Array<{ move: MoveId; points: Point[] }> = [
  { move: "uppercut", points: [{ x: .5, y: 1 }, { x: .5, y: 0 }] },
  { move: "hookPunchRight", points: [{ x: .2, y: .7 }, { x: 0, y: .35 }, { x: .25, y: .08 }, { x: .72, y: .05 }, { x: 1, y: .3 }] },
  { move: "hookPunchLeft", points: [{ x: .8, y: .7 }, { x: 1, y: .35 }, { x: .75, y: .08 }, { x: .28, y: .05 }, { x: 0, y: .3 }] },
  { move: "roundKickRight", points: [{ x: 0, y: .9 }, { x: .14, y: .35 }, { x: .5, y: .05 }, { x: .84, y: .35 }, { x: 1, y: .9 }] },
  { move: "roundKickLeft", points: [{ x: 1, y: .9 }, { x: .86, y: .35 }, { x: .5, y: .05 }, { x: .16, y: .35 }, { x: 0, y: .9 }] },
  { move: "frontKick", points: [{ x: 0, y: 1 }, { x: .28, y: .9 }, { x: .62, y: .6 }, { x: 1, y: 0 }] },
  { move: "backKick", points: [{ x: 1, y: .72 }, { x: .7, y: .52 }, { x: .38, y: .36 }, { x: 0, y: .28 }] },
  { move: "sweepKick", points: [{ x: 0, y: .62 }, { x: .3, y: .42 }, { x: .68, y: .4 }, { x: 1, y: .55 }] },
  { move: "axeKick", points: [{ x: .12, y: 0 }, { x: .45, y: .12 }, { x: .7, y: .5 }, { x: .78, y: 1 }] },
  { move: "spinningBackKick", points: [{ x: .72, y: .1 }, { x: .98, y: .4 }, { x: .84, y: .78 }, { x: .42, y: .92 }, { x: .05, y: .68 }, { x: .12, y: .42 }] },
  { move: "jumpKick", points: [{ x: 0, y: .92 }, { x: .2, y: .86 }, { x: .56, y: .6 }, { x: 1, y: 0 }] },
  { move: "kneeStrike", points: [{ x: 0, y: 1 }, { x: 1, y: 0 }] },
  { move: "hammerFist", points: [{ x: 0, y: 0 }, { x: 1, y: 1 }] },
  { move: "overhandPunch", points: [{ x: 0, y: .45 }, { x: .18, y: .08 }, { x: .56, y: 0 }, { x: .9, y: .42 }, { x: 1, y: 1 }] },
  { move: "elbowStrike", points: [{ x: 0, y: 0 }, { x: .18, y: .62 }, { x: .42, y: .64 }, { x: 1, y: .64 }] },
  { move: "doublePunch", points: [{ x: 0, y: .35 }, { x: .48, y: .22 }, { x: .32, y: .72 }, { x: .62, y: .7 }, { x: 1, y: .62 }] },
];

function length(points: Point[]) {
  let sum = 0;
  for (let i = 1; i < points.length; i += 1) sum += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  return sum;
}

function maxChordDeviation(points: Point[]) {
  if (points.length < 3) return 0;
  const a = points[0];
  const b = points[points.length - 1];
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const chord = Math.hypot(dx, dy);
  if (chord < 0.001) return 1;
  let max = 0;
  for (let i = 1; i < points.length - 1; i += 1) {
    const p = points[i];
    const perpendicular = Math.abs(dy * p.x - dx * p.y + b.x * a.y - b.y * a.x) / chord;
    max = Math.max(max, perpendicular);
  }
  return max / chord;
}

function resample(points: Point[], count = 24) {
  if (points.length < 2) return points;
  const total = length(points);
  if (total <= 0.001) return points;
  const step = total / (count - 1);
  const out: Point[] = [{ ...points[0] }];
  let carried = 0;
  let prev = { ...points[0] };
  let i = 1;
  while (i < points.length && out.length < count) {
    const curr = points[i];
    const seg = Math.hypot(curr.x - prev.x, curr.y - prev.y);
    if (seg + carried >= step) {
      const t = (step - carried) / Math.max(seg, 0.0001);
      prev = { x: prev.x + (curr.x - prev.x) * t, y: prev.y + (curr.y - prev.y) * t };
      out.push({ ...prev });
      carried = 0;
    } else {
      carried += seg;
      prev = { ...curr };
      i += 1;
    }
  }
  while (out.length < count) out.push({ ...points[points.length - 1] });
  return out;
}

function normalize(points: Point[]) {
  const minX = Math.min(...points.map((p) => p.x));
  const maxX = Math.max(...points.map((p) => p.x));
  const minY = Math.min(...points.map((p) => p.y));
  const maxY = Math.max(...points.map((p) => p.y));
  const scale = Math.max(maxX - minX, maxY - minY, 1);
  return resample(points.map((p) => ({ x: (p.x - minX) / scale, y: (p.y - minY) / scale })));
}

function distance(a: Point[], b: Point[]) {
  const aa = normalize(a);
  const bb = normalize(b);
  const n = Math.min(aa.length, bb.length);
  let sum = 0;
  for (let i = 0; i < n; i += 1) sum += Math.hypot(aa[i].x - bb[i].x, aa[i].y - bb[i].y);
  return sum / Math.max(n, 1);
}

export function classifyJaxonGesture(points: Point[], startY = 0, viewportHeight = 1): MoveId | null {
  if (points.length < 2) return null;
  const first = points[0];
  const last = points[points.length - 1];
  const dx = last.x - first.x;
  const dy = last.y - first.y;
  const direct = Math.hypot(dx, dy);
  const travel = length(points);
  if (direct < MIN_DIST && travel < MIN_DIST * 1.25) return null;

  const straightness = direct / Math.max(travel, 1);
  const curvature = maxChordDeviation(points);
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);

  if (dx > 0 && absY < absX * 0.22 && straightness > 0.88 && curvature < 0.055) {
    const y = startY / Math.max(viewportHeight, 1);
    if (direct < 72) return "jab";
    if (direct > 180) return "sideKick";
    if (y > 0.62) return "bodyPunch";
    return "straightPunch";
  }

  if (
    dx > 0 && dy < 0 &&
    straightness > 0.72 &&
    absX > absY * 0.55 && absY > absX * 0.45
  ) {
    if (direct < 160) return "kneeStrike";
    if (direct > 270) return "jumpKick";
    return "frontKick";
  }

  let best: { move: MoveId; score: number } | null = null;
  for (const template of TEMPLATES) {
    const score = distance(points, template.points);
    if (!best || score < best.score) best = { move: template.move, score };
  }

  if (!best || best.score > 0.33) {
    if (dy < 0 && absY > absX * 1.2) return "uppercut";
    if (dy > 0 && absY > absX * 1.2) return "axeKick";
    if (dx > 0 && dy < 0) return direct < 160 ? "kneeStrike" : direct > 270 ? "jumpKick" : "frontKick";
    if (dx > 0 && dy > 0) return "hammerFist";
  }
  return best?.move ?? null;
}

export function useJaxonGestureInput(onMove: (move: MoveId) => void) {
  useEffect(() => {
    let startTime = 0;
    let startY = 0;
    let points: Point[] = [];

    const down = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("[data-ui]")) return;
      startTime = performance.now();
      startY = e.clientY;
      points = [{ x: e.clientX, y: e.clientY }];
    };
    const move = (e: PointerEvent) => {
      if (!points.length) return;
      const last = points[points.length - 1];
      if (Math.hypot(e.clientX - last.x, e.clientY - last.y) >= 5) points.push({ x: e.clientX, y: e.clientY });
    };
    const up = (e: PointerEvent) => {
      if (!points.length) return;
      points.push({ x: e.clientX, y: e.clientY });
      const elapsed = performance.now() - startTime;
      const captured = points;
      points = [];
      if (elapsed > MAX_MS) return;
      const result = classifyJaxonGesture(captured, startY, window.innerHeight);
      if (result) onMove(result);
    };
    const cancel = () => { points = []; };

    window.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
    window.addEventListener("blur", cancel);
    return () => {
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
      window.removeEventListener("blur", cancel);
    };
  }, [onMove]);
}
