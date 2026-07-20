import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

// Metallic materials look black without something to reflect. three's
// RoomEnvironment builds a lightweight IBL procedurally, so armor reads as
// metal with no downloaded HDRI and no external requests.
export default function ProceduralEnvironment({
  intensity = 1,
}: {
  intensity?: number;
}) {
  const { scene, gl } = useThree();

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const envScene = new RoomEnvironment();
    const target = pmrem.fromScene(envScene, 0.04);

    scene.environment = target.texture;
    scene.environmentIntensity = intensity;

    return () => {
      scene.environment = null;
      target.dispose();
      pmrem.dispose();
    };
  }, [scene, gl, intensity]);

  return null;
}
