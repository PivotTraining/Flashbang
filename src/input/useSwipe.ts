import { useEffect } from "react";
import type { SwipeDir } from "../combat/moves";

// Swipe capture (handoff doc §20-21). Fires on pointer release, classifying
// the stroke into one of five directions.
//
// Pace decision: a single flick resolves to a move immediately rather than
// being matched against a multi-stroke pattern library. Waiting to see if
// more strokes are coming would add input latency to every basic attack,
// which is exactly what kills the feel of a fast fight. Multi-stroke
// specials come later on a separate modifier.

/** Below this, treat the gesture as a tap (guard) rather than a swipe. */
const MIN_SWIPE_PX = 34;
/** Beyond this the stroke is stale — a drag, not a flick. */
const MAX_SWIPE_MS = 700;

export interface SwipeHandlers {
  onSwipe: (dir: SwipeDir) => void;
  onTapDown?: () => void;
  onTapUp?: () => void;
}

export function classifySwipe(dx: number, dy: number): SwipeDir | null {
  const dist = Math.hypot(dx, dy);
  if (dist < MIN_SWIPE_PX) return null;

  const absX = Math.abs(dx);
  const absY = Math.abs(dy);

  // Vertical dominance needs a margin so a sloppy diagonal doesn't flip
  // between a sweep and a round kick frame to frame.
  if (absY > absX * 1.15) return dy < 0 ? "up" : "down";
  return dx < 0 ? "left" : "right";
}

export function useSwipeInput({ onSwipe, onTapDown, onTapUp }: SwipeHandlers) {
  useEffect(() => {
    let start: { x: number; y: number; t: number } | null = null;

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const target = e.target as HTMLElement | null;
      // Let real UI (back button, menus) keep its clicks.
      if (target?.closest("[data-ui]")) return;
      start = { x: e.clientX, y: e.clientY, t: performance.now() };
      onTapDown?.();
    };

    const onUp = (e: PointerEvent) => {
      if (!start) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      const elapsed = performance.now() - start.t;
      start = null;
      onTapUp?.();

      if (elapsed > MAX_SWIPE_MS) return;
      const dir = classifySwipe(dx, dy);
      if (dir) onSwipe(dir);
    };

    const onCancel = () => {
      start = null;
      onTapUp?.();
    };

    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    window.addEventListener("blur", onCancel);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      window.removeEventListener("blur", onCancel);
    };
  }, [onSwipe, onTapDown, onTapUp]);
}

/**
 * Keyboard mirror of the swipe directions. Arrow keys / IJKL let the fight be
 * driven without a pointer, which is also what makes it testable in the
 * preview browser where synthetic drags are unreliable.
 */
export function useAttackKeys(onDir: (dir: SwipeDir) => void, onGuard: (on: boolean) => void) {
  useEffect(() => {
    const map: Record<string, SwipeDir> = {
      i: "up",
      k: "down",
      j: "left",
      l: "right",
      arrowup: "up",
      arrowdown: "down",
      arrowleft: "left",
      arrowright: "right",
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === "shift") {
        onGuard(true);
        return;
      }
      const dir = map[key];
      if (dir && !e.repeat) {
        e.preventDefault();
        onDir(dir);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "shift") onGuard(false);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [onDir, onGuard]);
}
