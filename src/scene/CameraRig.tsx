import { useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { cameraState, playerTransform } from "./playerTransform";

const DISTANCE = 6.2;
const EXTRA_HEIGHT = 1.6;
const LOOK_HEIGHT = 1.35;

// Third-person camera behind the player (handoff doc §3), orbited by
// left-mouse drag. Deliberately avoids the Pointer Lock API since it
// behaves unreliably inside embedded/iframed preview browsers.
export default function CameraRig() {
  const { gl, camera } = useThree();
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const desired = useRef(new THREE.Vector3());

  useEffect(() => {
    const dom = gl.domElement;

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      dragging.current = true;
      last.current = { x: e.clientX, y: e.clientY };
      dom.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - last.current.x;
      const dy = e.clientY - last.current.y;
      last.current = { x: e.clientX, y: e.clientY };
      cameraState.yaw -= dx * 0.006;
      cameraState.pitch = THREE.MathUtils.clamp(
        cameraState.pitch - dy * 0.004,
        0.1,
        1.1,
      );
    };
    const onUp = (e: PointerEvent) => {
      dragging.current = false;
      try {
        dom.releasePointerCapture(e.pointerId);
      } catch {
        // pointer capture may already be released
      }
    };

    dom.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      dom.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [gl]);

  useFrame(() => {
    const { yaw, pitch } = cameraState;
    const offsetDir = new THREE.Vector3(
      Math.sin(yaw) * Math.cos(pitch),
      Math.sin(pitch),
      Math.cos(yaw) * Math.cos(pitch),
    );

    desired.current
      .copy(playerTransform.position)
      .addScaledVector(offsetDir, DISTANCE)
      .add(new THREE.Vector3(0, EXTRA_HEIGHT, 0));

    camera.position.lerp(desired.current, 0.2);
    camera.lookAt(
      playerTransform.position.x,
      playerTransform.position.y + LOOK_HEIGHT,
      playerTransform.position.z,
    );
  });

  return null;
}
