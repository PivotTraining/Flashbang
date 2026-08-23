import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { MutableRefObject } from "react";
import type { Group } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import { useCombatStore, type FighterId } from "../combat/combatStore";
import { MOVES } from "../combat/moves";
import BattleFighter from "./BattleFighter";

// Pinned audited CC0 assets from Quaternius, converted to browser-ready GLB in
// the public Blood League repository. Keeping the commit pinned prevents an
// upstream change from silently changing Flashbang's character at runtime.
const ASSET_COMMIT = "aa02a4e6d8337a0604d2da131bcbbeb1f01badf0";
const ASSET_ROOT = `https://raw.githubusercontent.com/Seyamalam/blood-league-kickoff/${ASSET_COMMIT}/public/assets/vendor/quaternius`;
const CHARACTER_URL = `${ASSET_ROOT}/night-striker.glb`;
const ANIMATION_URL = `${ASSET_ROOT}/universal-animation-library.glb`;

interface Props {
  fighterId: FighterId;
  energy: string;
  tint: string;
  movingRef: MutableRefObject<boolean>;
}

type ClipMap = {
  idle: string | null;
  move: string | null;
  sprint: string | null;
  guard: string | null;
  punch: string | null;
  roundKick: string | null;
  spinKick: string | null;
  risingKick: string | null;
  legSweep: string | null;
  power: string | null;
  hit: string | null;
  down: string | null;
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
  const kicks = names.filter((name) => name.toLowerCase().includes("kick"));
  return {
    idle: firstContaining(names, [["idle", "loop"], ["idle"]]),
    move: firstContaining(names, [["jog", "fwd"], ["jog"], ["walk", "fwd"], ["walk"]]),
    sprint: firstContaining(names, [["sprint", "loop"], ["sprint"], ["run", "fwd"], ["run"]]),
    guard: firstContaining(names, [["block"], ["guard"], ["defend"], ["idle", "loop"]]),
    punch: firstContaining(names, [["punch", "cross"], ["punch"], ["attack"]]),
    roundKick:
      firstContaining(names, [["round", "kick"], ["side", "kick"]]) ?? kicks[0] ?? null,
    spinKick:
      firstContaining(names, [["spin", "kick"], ["spinning", "kick"]]) ?? kicks[1] ?? kicks[0] ?? null,
    risingKick:
      firstContaining(names, [["high", "kick"], ["front", "kick"], ["up", "kick"]]) ?? kicks[2] ?? kicks[0] ?? null,
    legSweep:
      firstContaining(names, [["sweep"], ["low", "kick"]]) ?? kicks[3] ?? kicks[0] ?? null,
    power: firstContaining(names, [["spell", "simple", "shoot"], ["spell", "shoot"], ["shoot"], ["cast"]]),
    hit: firstContaining(names, [["hit", "a"], ["hit"], ["react"]]),
    down: firstContaining(names, [["death"], ["fall"], ["knock", "down"], ["hit"]]),
  };
}

function pickClip(map: ClipMap, fighterId: FighterId, moving: boolean) {
  const fighter = useCombatStore.getState()[fighterId];
  if (fighter.phase === "down") return map.down ?? map.hit ?? map.idle;
  if (fighter.phase === "stagger") return map.hit ?? map.idle;
  if (fighter.guarding) return map.guard ?? map.idle;
  if (fighter.moveId) {
    if (fighter.moveId === "punch") return map.punch ?? map.idle;
    if (fighter.moveId === "roundKick") return map.roundKick ?? map.punch ?? map.idle;
    if (fighter.moveId === "spinKick") return map.spinKick ?? map.roundKick ?? map.idle;
    if (fighter.moveId === "risingKick") return map.risingKick ?? map.roundKick ?? map.idle;
    if (fighter.moveId === "legSweep") return map.legSweep ?? map.roundKick ?? map.idle;
    if (fighter.moveId === "ballThrow") return map.power ?? map.punch ?? map.idle;
  }
  if (moving) return map.sprint ?? map.move ?? map.idle;
  return map.idle;
}

export default function RiggedFighter({ fighterId, energy, tint, movingRef }: Props) {
  const [model, setModel] = useState<Group | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionsRef = useRef(new Map<string, THREE.AnimationAction>());
  const clipsRef = useRef<ClipMap | null>(null);
  const activeRef = useRef<string | null>(null);
  const previousPhaseRef = useRef<string>("idle");
  const previousMoveRef = useRef<string | null>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const pulse = useRef(0);

  const glowMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
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
    const loader = new GLTFLoader();

    Promise.all([loader.loadAsync(CHARACTER_URL), loader.loadAsync(ANIMATION_URL)])
      .then(([character, animationLibrary]) => {
        if (cancelled) return;
        imported = cloneSkinned(character.scene) as Group;
        imported.name = `flashbang-${fighterId}-rigged`;
        imported.rotation.y = Math.PI;
        imported.scale.setScalar(fighterId === "player" ? 1.04 : 1.08);

        const tintColor = new THREE.Color(tint);
        imported.traverse((node) => {
          if (!(node instanceof THREE.Mesh)) return;
          node.castShadow = true;
          node.receiveShadow = false;
          const surfaces = Array.isArray(node.material) ? node.material : [node.material];
          const cloned = surfaces.map((surface) => {
            const copy = surface.clone();
            ownedMaterials.push(copy);
            if (copy instanceof THREE.MeshStandardMaterial) {
              // Mild color grade: retain skin/hair/textures while separating teams.
              copy.color.lerp(tintColor, fighterId === "player" ? 0.12 : 0.2);
              copy.roughness = Math.min(0.72, Math.max(0.32, copy.roughness));
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
        setModel(imported);
      })
      .catch((error: unknown) => {
        console.warn("Rigged fighter assets unavailable; using procedural fallback.", error);
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
  }, [fighterId, tint]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    pulse.current += dt;
    const mixer = mixerRef.current;
    const map = clipsRef.current;
    if (!mixer || !map) return;

    const state = useCombatStore.getState();
    const fighter = state[fighterId];
    const desired = pickClip(map, fighterId, movingRef.current);
    const attackStarted =
      fighter.phase === "windup" &&
      (previousPhaseRef.current !== "windup" || previousMoveRef.current !== fighter.moveId);
    const reactionStarted = fighter.phase === "stagger" && previousPhaseRef.current !== "stagger";
    const downStarted = fighter.phase === "down" && previousPhaseRef.current !== "down";

    if (desired && (desired !== activeRef.current || attackStarted || reactionStarted || downStarted)) {
      const next = actionsRef.current.get(desired);
      if (next) {
        const previous = activeRef.current ? actionsRef.current.get(activeRef.current) : undefined;
        if (previous && previous !== next) previous.fadeOut(0.08);

        next.reset();
        const oneShot = fighter.phase !== "idle" || fighter.moveId !== null || fighter.guarding;
        next.setLoop(oneShot ? THREE.LoopOnce : THREE.LoopRepeat, oneShot ? 1 : Infinity);
        next.clampWhenFinished = oneShot;

        if (fighter.moveId && MOVES[fighter.moveId]) {
          const targetDuration =
            MOVES[fighter.moveId].windup + MOVES[fighter.moveId].active + MOVES[fighter.moveId].recovery;
          if (targetDuration > 0.05 && next.getClip().duration > 0.05) {
            next.setEffectiveTimeScale(next.getClip().duration / targetDuration);
          }
        } else if (fighter.phase === "stagger" && fighter.staggerDuration > 0.05) {
          next.setEffectiveTimeScale(next.getClip().duration / fighter.staggerDuration);
        } else {
          next.setEffectiveTimeScale(1);
        }

        next.fadeIn(0.08).play();
        activeRef.current = desired;
      }
    }

    // Respect hitstop: freeze the real skeleton on the impact frame too.
    if (state.hitstop <= 0) mixer.update(dt);

    if (glowRef.current) {
      const powerActive = fighter.moveId === "ballThrow" && fighter.phase !== "recovery";
      const target = powerActive ? 1.35 : fighter.guarding ? 0.85 : 0.48;
      const breathe = 1 + Math.sin(pulse.current * 5.5) * 0.06;
      glowRef.current.scale.set(target * breathe, target * breathe, target * breathe);
      glowMaterial.opacity = powerActive ? 0.68 : fighter.guarding ? 0.38 : 0.16;
    }

    previousPhaseRef.current = fighter.phase;
    previousMoveRef.current = fighter.moveId;
  });

  if (!model) {
    return (
      <BattleFighter
        fighterId={fighterId}
        energy={energy}
        armorColor={fighterId === "player" ? "#233a66" : "#5a2740"}
      />
    );
  }

  return (
    <group>
      <primitive object={model} />
      <mesh ref={glowRef} position={[0, 1.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.54, 0.035, 10, 48]} />
        <primitive object={glowMaterial} attach="material" />
      </mesh>
      <pointLight
        position={[0, 1.45, 0.4]}
        color={energy}
        intensity={fighterId === "player" ? 1.8 : 1.25}
        distance={3.2}
      />
    </group>
  );
}
