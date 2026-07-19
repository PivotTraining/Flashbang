import { useEffect, useRef } from "react";

// Neutral movement intent, decoupled from any specific motor (mirrors the
// PlayerInputRouter responsibility in the handoff doc §16).
export interface MoveIntent {
  x: number; // strafe, -1..1
  z: number; // forward/back, -1..1
}

export function useMovementInput() {
  const intent = useRef<MoveIntent>({ x: 0, z: 0 });
  const pressed = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const updateIntent = () => {
      const p = pressed.current;
      let x = 0;
      let z = 0;
      if (p.w || p.arrowup) z -= 1;
      if (p.s || p.arrowdown) z += 1;
      if (p.a || p.arrowleft) x -= 1;
      if (p.d || p.arrowright) x += 1;
      intent.current = { x, z };
    };

    // Key off e.key (lowercased) rather than e.code — some automated /
    // embedded input sources don't populate e.code reliably.
    const onKeyDown = (e: KeyboardEvent) => {
      pressed.current[e.key.toLowerCase()] = true;
      updateIntent();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      pressed.current[e.key.toLowerCase()] = false;
      updateIntent();
    };
    const onBlur = () => {
      pressed.current = {};
      intent.current = { x: 0, z: 0 };
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  return intent;
}

export function useActionKey(onPress: () => void) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.key === " " || e.key === "Spacebar" || e.code === "Space") && !e.repeat) {
        e.preventDefault();
        onPress();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onPress]);
}
