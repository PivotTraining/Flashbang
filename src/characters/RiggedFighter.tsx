import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { MutableRefObject } from "react";
import type { Group } from "three";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import { useCombatStore, type FighterId } from "../combat/combatStore";
import { JAXON_MOVE_IDS, MOVES, totalMoveDuration, type MoveId } from "../combat/moves";
import { COSTUMES, useFighterStyleStore } from "../state/fighterStyleStore";
import BattleFighter from "./BattleFighter";

const ASSET_COMMIT = "aa02a4e6d8337a0604d2da131bcbbeb1f01badf0";
const ASSET_ROOT = `https://raw.githubusercontent.com/Seyamalam/blood-league-kickoff/${ASSET_COMMIT}/public/assets/vendor/quaternius`;
const CHARACTER_URL = `${ASSET_ROOT}/night-striker.glb`;
const ANIMATION_URL = `${ASSET_ROOT}/universal-animation-library.glb`;

let sharedAssetsPromise: Promise<[GLTF, GLTF]> | null = null;
function loadRiggedAssets() {
  if (!sharedAssetsPromise) {
    const loader = new GLTFLoader();
    sharedAssetsPromise = Promise.all([loader.loadAsync(CHARACTER_URL), loader.loadAsync(ANIMATION_URL)]);
  }
  return sharedAssetsPromise;
}

interface Props {
  fighterId: FighterId;
  movingRef: MutableRefObject<boolean>;
}

type ClipMap = {
  idle: string | null;
  move: string | null;
  sprint: string | null;
  guard: string | null;
  hit: string | null;
  down: string | null;
  moves: Partial<Record<MoveId, string | null>>;
};

function firstContaining(names: string[], groups: string[][]) {
  const lowered = names.map((name) => ({ name, lower: name.toLowerCase() }));
  for (const tokens of groups) {
    const found = lowered.find(({ lower }) => tokens.every((token) => lower.includes(token)));
    if (found) return found.name;
  }
  return null;
}

function buildClipMap(names: string[]): ClipMap {
  const punches = names.filter((name) => /punch|fist|elbow|strike|attack/i.test(name));
  const kicks = names.filter((name) => /kick|knee/i.test(name));
  const moves: Partial<Record<MoveId, string | null>> = {};

  const ids = [...JAXON_MOVE_IDS, "ballThrow", "punch", "risingKick", "legSweep", "roundKick", "spinKick"] as MoveId[];
  ids.forEach((id, index) => {
    const def = MOVES[id];
    const exact = firstContaining(names, def.animationHints);
    if (exact) {
      moves[id] = exact;
      return;
    }
    if (def.category === "punch") moves[id] = punches[index % Math.max(punches.length, 1)] ?? null;
    else if (def.category === "kick") moves[id] = kicks[index % Math.max(kicks.length, 1)] ?? null;
    else if (def.category === "power") moves[id] = firstContaining(names, [["spell"], ["shoot"], ["cast"], ["attack"]]);
  });

  return {
    idle: firstContaining(names, [["idle", "loop"], ["idle"]]),
    move: firstContaining(names, [["jog", "fwd"], ["jog"], ["walk", "fwd"], ["walk"]]),
    sprint: firstContaining(names, [["sprint", "loop"], ["sprint"], ["run", "fwd"], ["run"]]),
    guard: firstContaining(names, [["block"], ["guard"], ["defend"], ["idle", "loop"]]),
    hit: firstContaining(names, [["hit", "a"], ["hit"], ["damage"], ["react"]]),
    down: firstContaining(names, [["death"], ["knock", "down"], ["fall"], ["hit"]]),
    moves,
  };
}

function pickClip(map: ClipMap, fighterId: FighterId, moving: boolean) {
  const fighter = useCombatStore.getState()[fighterId];
  if (fighter.phase === "down") return map.down ?? map.hit ?? map.idle;
  if (fighter.phase === "stagger") return map.hit ?? map.idle;
  if (fighter.guarding) return map.guard ?? map.idle;
  if (fighter.moveId) return map.moves[fighter.moveId] ?? map.idle;
  if (moving) return map.sprint ?? map.move ?? map.idle;
  return map.idle;
}

function moveProgress(fighterId: FighterId) {
  const fighter = useCombatStore.getState()[fighterId];
  if (!fighter.moveId) return 0;
  const move = MOVES[fighter.moveId];
  const total = totalMoveDuration(move);
  let elapsed = fighter.phaseElapsed;
  if (fighter.phase === "active") elapsed += move.windup;
  if (fighter.phase === "recovery") elapsed += move.windup + move.active;
  return total > 0 ? Math.max(0, Math.min(1, elapsed / total)) : 0;
}

export default function RiggedFighter({ fighterId, movingRef }: Props) {
  const costumeId = useFighterStyleStore((s) => fighterId === "player" ? s.playerCostume : s.enemyCostume);
  const costume = COSTUMES[costumeId];
  const energy = costume.energy;

  const [model, setModel] = useState<Group | null>(null);
  const [failed, setFailed] = useState(false);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionsRef = useRef(new Map<string, THREE.AnimationAction>());
  const clipsRef = useRef<ClipMap | null>(null);
  const activeRef = useRef<string | null>(null);
  const previousPhaseRef = useRef<string>("idle");
  const previousMoveRef = useRef<string | null>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const loadingCoreRef = useRef<THREE.Mesh>(null);
  const motionRef = useRef<THREE.Group>(null);
  const pulse = useRef(0);

  const glowMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({
      color: energy,
      transparent: true,
      opacity: fighterId === "player" ? 0.46 : 0.32,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    }),
    [energy, fighterId],
  );

  useEffect(() => {
    let cancelled = false;
    let imported: Group | null = null;
    let mixer: THREE.AnimationMixer | null = null;
    const ownedMaterials: THREE.Material[] = [];

    loadRiggedAssets()
      .then(([character, animationLibrary]) => {
        if (cancelled) return;
        imported = cloneSkinned(character.scene) as Group;
        imported.name = `flashbang-${fighterId}-${costumeId}`;
        // IMPORTANT: the source character is authored facing +Z. Our lock-on yaw
        // also aims local +Z at the opponent, so adding PI here made fighters face away.
        imported.rotation.y = 0;
        imported.scale.setScalar(fighterId === "player" ? 1.04 : 1.08);

        const base = new THREE.Color(costume.base);
        const secondary = new THREE.Color(costume.secondary);
        const accent = new THREE.Color(costume.accent);

        imported.traverse((node) => {
          if (!(node instanceof THREE.Mesh)) return;
          node.castShadow = true;
          node.receiveShadow = false;
          const surfaces = Array.isArray(node.material) ? node.material : [node.material];
          const cloned = surfaces.map((surface) => {
            const copy = surface.clone();
            ownedMaterials.push(copy);
            if (copy instanceof THREE.MeshStandardMaterial) {
              const identity = `${node.name} ${copy.name}`.toLowerCase();
              const protectedSurface = /skin|face|head|hair|eye|teeth|mouth/.test(identity);
              if (protectedSurface) {
                copy.color.lerp(secondary, .035);
              } else {
                copy.color.lerp(base, costume.clothTint * .45);
                copy.color.lerp(secondary, costume.clothTint);
                copy.metalness = Math.max(copy.metalness, costume.metalness);
                copy.roughness = THREE.MathUtils.lerp(copy.roughness, costume.roughness, .48);
                copy.emissive.copy(accent);
                copy.emissiveIntensity = .09;
              }
            }
            return copy;
          });
          node.material = Array.isArray(node.material) ? cloned : cloned[0];
        });

        mixer = new THREE.AnimationMixer(imported);
        mixerRef.current = mixer;
        const names: string[] = [];
        for (const clip of animationLibrary.animations) {
          names.push(clip.name);
          actionsRef.current.set(clip.name, mixer.clipAction(clip));
        }
        clipsRef.current = buildClipMap(names);
        setFailed(false);
        setModel(imported);
      })
      .catch((error: unknown) => {
        console.warn("Rigged fighter assets unavailable; using procedural fallback.", error);
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      if (mixer && imported) {
        mixer.stopAllAction();
        mixer.uncacheRoot(imported);
      }
      for (const material of ownedMaterials) material.dispose();
      actionsRef.current.clear();
      clipsRef.current = null;
      mixerRef.current = null;
    };
  }, [fighterId, costumeId, costume.accent, costume.base, costume.clothTint, costume.metalness, costume.roughness, costume.secondary]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    pulse.current += dt;

    if (loadingCoreRef.current && !model && !failed) {
      const breathe = 1 + Math.sin(pulse.current * 7) * 0.14;
      loadingCoreRef.current.rotation.y += dt * 2.8;
      loadingCoreRef.current.rotation.z += dt * 1.7;
      loadingCoreRef.current.scale.setScalar(breathe);
    }

    const state = useCombatStore.getState();
    const fighter = state[fighterId];
    const mixer = mixerRef.current;
    const map = clipsRef.current;

    if (motionRef.current) {
      const progress = moveProgress(fighterId);
      motionRef.current.rotation.y = 0;
      motionRef.current.position.y = 0;
      if (fighter.moveId === "spinningBackKick" || fighter.moveId === "spinKick") {
        motionRef.current.rotation.y = progress * Math.PI * 2;
      } else if (fighter.moveId === "roundKickRight") {
        motionRef.current.rotation.y = Math.sin(progress * Math.PI) * .3;
      } else if (fighter.moveId === "roundKickLeft") {
        motionRef.current.rotation.y = -Math.sin(progress * Math.PI) * .3;
      }
      if (fighter.moveId === "jumpKick") motionRef.current.position.y = Math.sin(progress * Math.PI) * .36;
    }

    if (!mixer || !map) return;
    const desired = pickClip(map, fighterId, movingRef.current);
    const attackStarted = fighter.phase === "windup" && (previousPhaseRef.current !== "windup" || previousMoveRef.current !== fighter.moveId);
    const reactionStarted = fighter.phase === "stagger" && previousPhaseRef.current !== "stagger";
    const downStarted = fighter.phase === "down" && previousPhaseRef.current !== "down";

    if (desired && (desired !== activeRef.current || attackStarted || reactionStarted || downStarted)) {
      const next = actionsRef.current.get(desired);
      if (next) {
        const previous = activeRef.current ? actionsRef.current.get(activeRef.current) : undefined;
        if (previous && previous !== next) previous.fadeOut(.07);
        next.reset();
        const oneShot = fighter.phase !== "idle" || fighter.moveId !== null || fighter.guarding;
        next.setLoop(oneShot ? THREE.LoopOnce : THREE.LoopRepeat, oneShot ? 1 : Infinity);
        next.clampWhenFinished = oneShot;

        if (fighter.moveId) {
          const targetDuration = totalMoveDuration(MOVES[fighter.moveId]);
          if (targetDuration > .05 && next.getClip().duration > .05) next.setEffectiveTimeScale(next.getClip().duration / targetDuration);
        } else if (fighter.phase === "stagger" && fighter.staggerDuration > .05) {
          next.setEffectiveTimeScale(next.getClip().duration / fighter.staggerDuration);
        } else next.setEffectiveTimeScale(1);

        next.fadeIn(.07).play();
        activeRef.current = desired;
      }
    }

    if (state.hitstop <= 0) mixer.update(dt);

    if (glowRef.current) {
      const powerActive = fighter.moveId === "ballThrow" && fighter.phase !== "recovery";
      const target = powerActive ? 1.35 : fighter.guarding ? .85 : .48;
      const breathe = 1 + Math.sin(pulse.current * 5.5) * .06;
      glowRef.current.scale.set(target * breathe, target * breathe, target * breathe);
      glowMaterial.opacity = powerActive ? .68 : fighter.guarding ? .38 : .16;
    }

    previousPhaseRef.current = fighter.phase;
    previousMoveRef.current = fighter.moveId;
  });

  if (!model && !failed) {
    return (
      <group position={[0, 1, 0]}>
        <mesh ref={loadingCoreRef}>
          <octahedronGeometry args={[.34, 1]} />
          <meshBasicMaterial color={energy} wireframe transparent opacity={.82} toneMapped={false} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[.62, .025, 8, 42]} />
          <meshBasicMaterial color={energy} transparent opacity={.5} toneMapped={false} />
        </mesh>
        <pointLight color={energy} intensity={2.4} distance={3.6} />
      </group>
    );
  }

  if (!model && failed) {
    return <BattleFighter fighterId={fighterId} energy={energy} armorColor={costume.secondary} />;
  }

  return (
    <group ref={motionRef}>
      {model && <primitive object={model} />}
      <mesh ref={glowRef} position={[0, 1.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[.54, .035, 10, 48]} />
        <primitive object={glowMaterial} attach="material" />
      </mesh>
      <pointLight position={[0, 1.45, .4]} color={energy} intensity={fighterId === "player" ? 1.8 : 1.25} distance={3.2} />
    </group>
  );
}
