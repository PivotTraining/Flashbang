import { useEffect, useRef } from "react";

// Neutral movement intent, decoupled from any specific motor (mirrors the
// PlayerInputRouter responsibility in the handoff doc §16).
export interface MoveIntent {
  x: number; // strafe, -1..1
  z: number; // forward/back, -1..1
}

// Touch controls write here. BattlePlayer reads this alongside the keyboard
// so desktop and mobile use the exact same movement motor.
const virtualIntent: MoveIntent = { x: 0, z: 0 };

export function setVirtualMovement(x: number, z: number) {
  virtualIntent.x = Math.max(-1, Math.min(1, x));
  virtualIntent.z = Math.max(-1, Math.min(1, z));
}

export function clearVirtualMovement() {
  virtualIntent.x = 0;
  virtualIntent.z = 0;
}

export function useMovementInput() {
  const intent = useRef<MoveIntent>({ x: 0, z: 0 });
  const pressed = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const updateIntent = () => {
      const p = pressed.current;
      let x = virtualIntent.x;
      let z = virtualIntent.z;
      // WASD remains available on desktop. Touch buttons feed virtualIntent.
      if (p.w) z -= 1;
      if (p.s) z += 1;
      if (p.a) x -= 1;
      if (p.d) x += 1;
      intent.current = {
        x: Math.max(-1, Math.min(1, x)),
        z: Math.max(-1, Math.min(1, z)),
      };
    };

    const syncVirtual = window.setInterval(updateIntent, 16);

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
      clearVirtualMovement();
      intent.current = { x: 0, z: 0 };
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.clearInterval(syncVirtual);
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
