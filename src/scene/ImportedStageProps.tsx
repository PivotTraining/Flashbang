import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import type { Group } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// Web-optimized CC0 Quaternius models, pinned to an immutable skyline-run
// commit. These GLBs have 512px/WebP textures and are small enough for a
// browser fighting stage, unlike the raw source packs.
const ASSET_COMMIT = "0c41526d8d4130c37c15e219c2c3737fa8cb4ad8";
const ROOT = `https://raw.githubusercontent.com/anshaneja5/skyline-run/${ASSET_COMMIT}/public/assets/models`;

const URLS = {
  tree1: `${ROOT}/tree1.glb`,
  tree2: `${ROOT}/tree2.glb`,
  tree3: `${ROOT}/tree3.glb`,
  small: `${ROOT}/b_small.glb`,
  medium: `${ROOT}/b_medium.glb`,
  large: `${ROOT}/b_large.glb`,
} as const;

type AssetName = keyof typeof URLS;
type Sources = Partial<Record<AssetName, Group>>;

interface Placement {
  asset: AssetName;
  position: [number, number, number];
  height: number;
  rotation: number;
  scaleX?: number;
  scaleZ?: number;
}

const placements: Placement[] = [
  // The city/citadel layer sits behind the gate and gives the stage a real
  // skyline instead of an empty fog wall.
  { asset: "large", position: [-20, -5.2, -34], height: 18, rotation: 0.12, scaleX: 1.2 },
  { asset: "medium", position: [-10, -4.8, -31], height: 13, rotation: -0.2 },
  { asset: "large", position: [2, -5.5, -38], height: 22, rotation: 0.15, scaleX: 1.1 },
  { asset: "small", position: [12, -4.5, -30], height: 10, rotation: -0.18 },
  { asset: "medium", position: [22, -5.0, -35], height: 16, rotation: 0.24 },
  { asset: "small", position: [31, -5.3, -39], height: 11, rotation: -0.12 },

  // Textured trees break up the hard sci-fi silhouette and reinforce the
  // high-altitude shrine/warrior-arena identity around the platform edge.
  { asset: "tree1", position: [-12.1, -0.45, -7.8], height: 6.5, rotation: 0.5 },
  { asset: "tree2", position: [-12.8, -0.5, -1.8], height: 5.2, rotation: -0.6 },
  { asset: "tree3", position: [-11.8, -0.48, 4.8], height: 6.0, rotation: 0.22 },
  { asset: "tree2", position: [12.3, -0.5, -7.1], height: 5.5, rotation: 0.72 },
  { asset: "tree1", position: [12.8, -0.45, -0.7], height: 6.8, rotation: -0.3 },
  { asset: "tree3", position: [11.7, -0.5, 5.2], height: 5.8, rotation: 0.9 },
  { asset: "tree3", position: [-6.8, -0.55, 10.8], height: 5.0, rotation: -0.75 },
  { asset: "tree1", position: [6.4, -0.55, 10.9], height: 5.6, rotation: 0.4 },
];

function prepare(source: Group, targetHeight: number) {
  const clone = source.clone(true);
  const box = new THREE.Box3().setFromObject(clone);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);
  const scale = targetHeight / Math.max(0.001, size.y);
  clone.scale.setScalar(scale);
  clone.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
  clone.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return;
    node.castShadow = true;
    node.receiveShadow = true;
  });
  const wrapper = new THREE.Group();
  wrapper.add(clone);
  return wrapper;
}

export default function ImportedStageProps() {
  const [sources, setSources] = useState<Sources>({});

  useEffect(() => {
    let cancelled = false;
    const loader = new GLTFLoader();
    const entries = Object.entries(URLS) as Array<[AssetName, string]>;

    Promise.all(
      entries.map(async ([name, url]) => {
        const gltf = await loader.loadAsync(url);
        return [name, gltf.scene] as const;
      }),
    )
      .then((loaded) => {
        if (cancelled) return;
        setSources(Object.fromEntries(loaded) as Sources);
      })
      .catch((error: unknown) => {
        // Thunder Summit remains fully playable with its procedural stage if
        // a CDN/network request fails.
        console.warn("Imported Thunder Summit props unavailable; keeping procedural environment.", error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const objects = useMemo(
    () =>
      placements.flatMap((placement, index) => {
        const source = sources[placement.asset];
        if (!source) return [];
        const object = prepare(source, placement.height);
        object.position.set(...placement.position);
        object.rotation.y = placement.rotation;
        object.scale.x *= placement.scaleX ?? 1;
        object.scale.z *= placement.scaleZ ?? 1;
        return [{ key: `${placement.asset}-${index}`, object }];
      }),
    [sources],
  );

  if (objects.length === 0) return null;

  return (
    <group>
      {objects.map(({ key, object }) => (
        <primitive key={key} object={object} />
      ))}

      {/* Accent lighting visually ties the textured skyline into Flashbang's
          electric-blue / storm-violet stage language. */}
      <pointLight position={[-13, 4, -21]} color="#4a88ff" intensity={5.5} distance={24} decay={2} />
      <pointLight position={[13, 5, -23]} color="#8a63ff" intensity={5.0} distance={24} decay={2} />
      <pointLight position={[0, 7, -30]} color="#ff8866" intensity={4.2} distance={28} decay={2} />
    </group>
  );
}
