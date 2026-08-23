import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Group, Mesh } from "three";
import { useCombatStore, type FighterId } from "../combat/combatStore";
import { MOVES } from "../combat/moves";

interface Props {
  fighterId: FighterId;
  energy: string;
  armorColor: string;
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeIn = (t: number) => t * t;
const easeOut = (t: number) => 1 - (1 - t) * (1 - t) * (1 - t);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = THREE.MathUtils.lerp;

interface LimbPose {
  upperX: number;
  upperY: number;
  upperZ: number;
  lowerX: number;
  lowerZ: number;
}

const neutralArm = (side: -1 | 1): LimbPose => ({
  upperX: -0.48,
  upperY: 0,
  upperZ: side * 0.16,
  lowerX: -0.92,
  lowerZ: side * -0.08,
});

const neutralLeg = (side: -1 | 1): LimbPose => ({
  upperX: side === -1 ? 0.04 : -0.03,
  upperY: 0,
  upperZ: side * 0.03,
  lowerX: 0.1,
  lowerZ: 0,
});

export default function BattleFighter({ fighterId, energy, armorColor }: Props) {
  const root = useRef<Group>(null);
  const torso = useRef<Group>(null);
  const head = useRef<Group>(null);
  const leftUpperArm = useRef<Group>(null);
  const leftForearm = useRef<Group>(null);
  const rightUpperArm = useRef<Group>(null);
  const rightForearm = useRef<Group>(null);
  const leftThigh = useRef<Group>(null);
  const leftShin = useRef<Group>(null);
  const rightThigh = useRef<Group>(null);
  const rightShin = useRef<Group>(null);
  const powerOrb = useRef<Mesh>(null);
  const aura = useRef<Mesh>(null);
  const t = useRef(0);

  const armorMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: armorColor, metalness: 0.42, roughness: 0.43 }),
    [armorColor],
  );
  const clothMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#101522", metalness: 0.05, roughness: 0.76 }),
    [],
  );
  const darkMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#070a12", metalness: 0.24, roughness: 0.58 }),
    [],
  );
  const skinMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: fighterId === "player" ? "#754832" : "#76503f", roughness: 0.72 }),
    [fighterId],
  );
  const glowMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: energy,
        emissive: new THREE.Color(energy),
        emissiveIntensity: 5.2,
        roughness: 0.14,
        toneMapped: false,
      }),
    [energy],
  );

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    t.current += dt;
    const fighter = useCombatStore.getState()[fighterId];

    const r = root.current;
    const body = torso.current;
    const h = head.current;
    const lua = leftUpperArm.current;
    const lfa = leftForearm.current;
    const rua = rightUpperArm.current;
    const rfa = rightForearm.current;
    const lt = leftThigh.current;
    const ls = leftShin.current;
    const rt = rightThigh.current;
    const rs = rightShin.current;
    if (!r || !body || !h || !lua || !lfa || !rua || !rfa || !lt || !ls || !rt || !rs) return;

    const idlePulse = Math.sin(t.current * 5.2);
    const idleSlow = Math.sin(t.current * 2.6);

    let rootY = 0.018 + idlePulse * 0.014;
    let rootZ = 0;
    let rootRY = 0;
    let bodyX = -0.045 + idleSlow * 0.018;
    let bodyY = 0;
    let bodyRY = idleSlow * 0.025;
    let bodyRZ = 0;
    let headX = 0.035 - idleSlow * 0.025;
    let headY = -bodyRY * 0.65;

    const leftArm = neutralArm(-1);
    const rightArm = neutralArm(1);
    const leftLeg = neutralLeg(-1);
    const rightLeg = neutralLeg(1);

    // Fighting stance: shoulders alive, elbows bent, weight alternating.
    leftArm.upperX += idlePulse * 0.035;
    rightArm.upperX -= idlePulse * 0.035;
    leftLeg.upperX += idlePulse * 0.018;
    rightLeg.upperX -= idlePulse * 0.018;

    let orbVisible = false;
    let orbScale = 0.01;
    let auraScale = 0.01;

    if (fighter.guarding) {
      bodyX = -0.16;
      bodyY = -0.04;
      leftArm.upperX = -1.0;
      leftArm.upperZ = -0.3;
      leftArm.lowerX = -1.34;
      rightArm.upperX = -1.08;
      rightArm.upperZ = 0.3;
      rightArm.lowerX = -1.26;
      headX = 0.13;
    }

    if (fighter.moveId) {
      const move = MOVES[fighter.moveId];
      const phaseDuration =
        fighter.phase === "windup"
          ? move.windup
          : fighter.phase === "active"
            ? move.active
            : fighter.phase === "recovery"
              ? move.recovery
              : 1;
      const p = clamp01(phaseDuration > 0 ? fighter.phaseElapsed / phaseDuration : 1);
      const wind = fighter.phase === "windup" ? easeInOut(p) : fighter.phase === "active" || fighter.phase === "recovery" ? 1 : 0;
      const strike = fighter.phase === "active" ? easeOut(Math.min(1, p * 2.4)) : fighter.phase === "recovery" ? 1 - easeInOut(p) : 0;
      const recover = fighter.phase === "recovery" ? easeInOut(p) : 0;

      switch (fighter.moveId) {
        case "punch": {
          // Coil the shoulder back, then snap hip/torso/arm through together.
          if (fighter.phase === "windup") {
            bodyRY = lerp(0, 0.42, wind);
            rootZ = lerp(0, -0.1, wind);
            rightArm.upperX = lerp(-0.48, 0.58, wind);
            rightArm.upperZ = lerp(0.16, 0.48, wind);
            rightArm.lowerX = lerp(-0.92, -1.45, wind);
            leftArm.upperX = -0.82;
            leftArm.lowerX = -1.2;
            headY = lerp(0, -0.16, wind);
          } else {
            bodyRY = lerp(0.42, -0.34, strike);
            bodyX = lerp(-0.04, -0.12, strike);
            rootZ = lerp(-0.1, 0.5, strike);
            rightArm.upperX = lerp(0.58, -1.48, strike);
            rightArm.upperZ = lerp(0.48, 0.02, strike);
            rightArm.lowerX = lerp(-1.45, -0.08, strike);
            leftArm.upperX = -0.86;
            leftArm.lowerX = -1.14;
            headY = 0.12 * strike;
          }
          if (fighter.phase === "recovery") rootZ = lerp(0.5, 0, recover);
          break;
        }
        case "roundKick": {
          if (fighter.phase === "windup") {
            rootY -= 0.08 * wind;
            bodyRY = 0.55 * wind;
            bodyRZ = -0.1 * wind;
            rightThigh.current.position.y = 1.05;
            rightLeg.upperX = lerp(-0.03, -0.62, wind);
            rightLeg.upperZ = lerp(0.03, -0.46, wind);
            rightLeg.lowerX = lerp(0.1, 1.3, wind);
            leftArm.upperX = -0.9;
            rightArm.upperX = -0.72;
          } else {
            bodyRY = lerp(0.55, -0.82, strike);
            bodyRZ = 0.22 * strike;
            rootY += 0.12 * strike;
            rootZ += 0.18 * strike;
            rightLeg.upperX = lerp(-0.62, -1.32, strike);
            rightLeg.upperZ = lerp(-0.46, -1.18, strike);
            rightLeg.lowerX = lerp(1.3, 0.08, strike);
            leftArm.upperX = -1.02;
            rightArm.upperX = -0.58;
          }
          break;
        }
        case "spinKick": {
          if (fighter.phase === "windup") {
            bodyRY = -0.68 * wind;
            rootRY = -0.45 * wind;
            leftLeg.upperX = lerp(0.04, -0.38, wind);
            leftLeg.lowerX = lerp(0.1, 1.05, wind);
            leftArm.upperX = -0.78;
            rightArm.upperX = -0.88;
          } else {
            const spin = strike;
            rootRY = -0.45 + spin * Math.PI * 1.5;
            bodyRY = lerp(-0.68, 0.28, spin);
            rootY += Math.sin(spin * Math.PI) * 0.18;
            leftLeg.upperX = lerp(-0.38, -1.12, spin);
            leftLeg.upperZ = lerp(-0.03, 1.18, spin);
            leftLeg.lowerX = lerp(1.05, 0.02, spin);
            bodyRZ = -0.2 * Math.sin(spin * Math.PI);
          }
          break;
        }
        case "risingKick": {
          if (fighter.phase === "windup") {
            rootY = lerp(rootY, -0.22, wind);
            bodyX = lerp(-0.04, 0.34, wind);
            rightLeg.upperX = lerp(-0.03, 0.38, wind);
            rightLeg.lowerX = lerp(0.1, 1.45, wind);
            leftArm.upperX = -0.82;
            rightArm.upperX = -0.72;
          } else {
            rootY += 0.58 * strike;
            rootZ += 0.22 * strike;
            bodyX = lerp(0.34, -0.2, strike);
            rightLeg.upperX = lerp(0.38, -2.0, strike);
            rightLeg.lowerX = lerp(1.45, -0.18, strike);
            rightLeg.upperZ = 0.08 * strike;
            leftArm.upperX = -1.05;
            rightArm.upperX = -0.9;
            headX = -0.12 * strike;
          }
          break;
        }
        case "legSweep": {
          if (fighter.phase === "windup") {
            rootY = lerp(rootY, -0.42, wind);
            bodyX = lerp(-0.04, 0.62, wind);
            bodyRY = 0.48 * wind;
            rightLeg.upperX = lerp(-0.03, 0.78, wind);
            rightLeg.lowerX = lerp(0.1, 1.42, wind);
            leftArm.upperX = -1.0;
            rightArm.upperX = -0.88;
          } else {
            rootY = -0.42 + 0.08 * strike;
            rootRY = -strike * Math.PI * 0.72;
            bodyRY = lerp(0.48, -0.55, strike);
            bodyRZ = -0.18 * strike;
            leftLeg.upperX = lerp(0.04, -0.42, strike);
            leftLeg.upperZ = lerp(-0.03, 1.34, strike);
            leftLeg.lowerX = lerp(0.1, 0.02, strike);
            rightLeg.upperX = 0.72;
            rightLeg.lowerX = 1.3;
          }
          break;
        }
        case "ballThrow": {
          orbVisible = fighter.phase === "windup" || fighter.phase === "active";
          if (fighter.phase === "windup") {
            const charge = wind;
            rootY -= 0.05 * charge;
            bodyX = 0.16 * charge;
            leftArm.upperX = lerp(-0.48, -0.86, charge);
            rightArm.upperX = lerp(-0.48, -0.86, charge);
            leftArm.upperZ = lerp(-0.16, -0.55, charge);
            rightArm.upperZ = lerp(0.16, 0.55, charge);
            leftArm.lowerX = lerp(-0.92, -1.5, charge);
            rightArm.lowerX = lerp(-0.92, -1.5, charge);
            orbScale = 0.25 + charge * 0.9 + Math.sin(t.current * 26) * 0.08;
            auraScale = 0.55 + charge * 0.9;
          } else {
            bodyX = lerp(0.16, -0.24, strike);
            rootZ = 0.38 * strike;
            leftArm.upperX = lerp(-0.86, -1.45, strike);
            rightArm.upperX = lerp(-0.86, -1.45, strike);
            leftArm.upperZ = lerp(-0.55, -0.08, strike);
            rightArm.upperZ = lerp(0.55, 0.08, strike);
            leftArm.lowerX = lerp(-1.5, -0.12, strike);
            rightArm.lowerX = lerp(-1.5, -0.12, strike);
            orbScale = 1.55 + strike * 0.35;
            auraScale = 1.85;
          }
          break;
        }
        default:
          break;
      }
    }

    if (fighter.phase === "stagger") {
      const p = clamp01(fighter.staggerDuration > 0 ? fighter.phaseElapsed / fighter.staggerDuration : 1);
      const recoil = Math.sin(p * Math.PI);
      rootZ = -0.34 * recoil;
      rootY = 0.04 + Math.sin(p * Math.PI * 2) * 0.05;
      bodyX = 0.72 * recoil;
      bodyRZ = (fighterId === "player" ? -1 : 1) * 0.34 * recoil;
      headX = 0.58 * recoil;
      leftArm.upperX = lerp(-0.48, 0.48, recoil);
      rightArm.upperX = lerp(-0.48, 0.62, recoil);
      leftArm.lowerX = -0.2;
      rightArm.lowerX = -0.2;
    }

    if (fighter.phase === "down") {
      const fall = easeOut(clamp01(fighter.phaseElapsed / 0.55));
      rootY = lerp(0, -0.72, fall);
      rootZ = lerp(0, -0.32, fall);
      bodyRZ = (fighterId === "player" ? 1 : -1) * lerp(0, Math.PI / 2.05, fall);
      bodyX = 0.35 * fall;
      headX = 0.45 * fall;
      leftArm.upperX = 0.1;
      rightArm.upperX = 0.22;
      leftLeg.upperX = -0.12;
      rightLeg.upperX = 0.2;
    }

    const follow = 1 - Math.pow(0.0005, dt);
    const snap = Math.min(1, follow * 1.65);

    r.position.y = lerp(r.position.y, rootY, snap);
    r.position.z = lerp(r.position.z, rootZ, snap);
    r.rotation.y = lerp(r.rotation.y, rootRY, snap);

    body.position.y = lerp(body.position.y, bodyY, snap);
    body.rotation.x = lerp(body.rotation.x, bodyX, snap);
    body.rotation.y = lerp(body.rotation.y, bodyRY, snap);
    body.rotation.z = lerp(body.rotation.z, bodyRZ, snap);
    h.rotation.x = lerp(h.rotation.x, headX, snap);
    h.rotation.y = lerp(h.rotation.y, headY, snap);

    const applyLimb = (upper: Group, lower: Group, pose: LimbPose) => {
      upper.rotation.x = lerp(upper.rotation.x, pose.upperX, snap);
      upper.rotation.y = lerp(upper.rotation.y, pose.upperY, snap);
      upper.rotation.z = lerp(upper.rotation.z, pose.upperZ, snap);
      lower.rotation.x = lerp(lower.rotation.x, pose.lowerX, snap);
      lower.rotation.z = lerp(lower.rotation.z, pose.lowerZ, snap);
    };

    applyLimb(lua, lfa, leftArm);
    applyLimb(rua, rfa, rightArm);
    applyLimb(lt, ls, leftLeg);
    applyLimb(rt, rs, rightLeg);

    if (powerOrb.current) {
      powerOrb.current.visible = orbVisible;
      powerOrb.current.scale.setScalar(lerp(powerOrb.current.scale.x, orbScale, snap));
      powerOrb.current.rotation.y += dt * 8;
      powerOrb.current.rotation.x += dt * 3;
    }
    if (aura.current) {
      aura.current.visible = orbVisible;
      aura.current.scale.setScalar(lerp(aura.current.scale.x, auraScale, snap));
      aura.current.rotation.z += dt * 4.2;
    }
  });

  const Arm = ({ side, upperRef, lowerRef }: { side: -1 | 1; upperRef: React.RefObject<Group>; lowerRef: React.RefObject<Group> }) => (
    <group ref={upperRef} position={[side * 0.43, 1.75, 0]}>
      <mesh position={[0, -0.03, 0]} scale={[1.28, 0.78, 1.4]} castShadow>
        <sphereGeometry args={[0.13, 14, 10]} />
        <primitive object={armorMat} attach="material" />
      </mesh>
      <mesh position={[0, -0.23, 0]} castShadow>
        <capsuleGeometry args={[0.095, 0.28, 8, 14]} />
        <primitive object={clothMat} attach="material" />
      </mesh>
      <group ref={lowerRef} position={[0, -0.48, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.085, 12, 12]} />
          <primitive object={darkMat} attach="material" />
        </mesh>
        <mesh position={[0, -0.22, 0]} castShadow>
          <capsuleGeometry args={[0.085, 0.27, 8, 14]} />
          <primitive object={armorMat} attach="material" />
        </mesh>
        <mesh position={[0, -0.46, 0.05]} castShadow>
          <boxGeometry args={[0.18, 0.17, 0.24]} />
          <primitive object={darkMat} attach="material" />
        </mesh>
        <mesh position={[0, -0.18, 0.085]}>
          <boxGeometry args={[0.032, 0.22, 0.025]} />
          <primitive object={glowMat} attach="material" />
        </mesh>
      </group>
    </group>
  );

  const Leg = ({ side, upperRef, lowerRef }: { side: -1 | 1; upperRef: React.RefObject<Group>; lowerRef: React.RefObject<Group> }) => (
    <group ref={upperRef} position={[side * 0.2, 1.08, 0]}>
      <mesh position={[0, -0.27, 0]} castShadow>
        <capsuleGeometry args={[0.13, 0.38, 8, 14]} />
        <primitive object={armorMat} attach="material" />
      </mesh>
      <group ref={lowerRef} position={[0, -0.57, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.105, 12, 12]} />
          <primitive object={darkMat} attach="material" />
        </mesh>
        <mesh position={[0, -0.27, 0]} castShadow>
          <capsuleGeometry args={[0.105, 0.4, 8, 14]} />
          <primitive object={armorMat} attach="material" />
        </mesh>
        <mesh position={[0, -0.55, 0.12]} castShadow>
          <boxGeometry args={[0.25, 0.16, 0.44]} />
          <primitive object={darkMat} attach="material" />
        </mesh>
        <mesh position={[0, -0.25, 0.1]}>
          <boxGeometry args={[0.035, 0.26, 0.025]} />
          <primitive object={glowMat} attach="material" />
        </mesh>
      </group>
    </group>
  );

  const hairSpikes = [
    [-0.13, 0.22, -0.04, -0.3],
    [-0.04, 0.27, -0.06, -0.08],
    [0.06, 0.27, -0.05, 0.12],
    [0.15, 0.21, -0.04, 0.32],
    [-0.18, 0.14, -0.07, -0.52],
    [0.19, 0.13, -0.07, 0.52],
  ] as const;

  return (
    <group ref={root} scale={1.12}>
      <group ref={torso}>
        <Leg side={-1} upperRef={leftThigh} lowerRef={leftShin} />
        <Leg side={1} upperRef={rightThigh} lowerRef={rightShin} />

        <mesh position={[0, 1.2, 0]} castShadow>
          <boxGeometry args={[0.52, 0.22, 0.31]} />
          <primitive object={darkMat} attach="material" />
        </mesh>
        <mesh position={[0, 1.53, 0]} castShadow>
          <cylinderGeometry args={[0.29, 0.37, 0.62, 10]} />
          <primitive object={clothMat} attach="material" />
        </mesh>
        <mesh position={[0, 1.68, 0.17]} castShadow>
          <boxGeometry args={[0.58, 0.34, 0.16]} />
          <primitive object={armorMat} attach="material" />
        </mesh>
        <mesh position={[0, 1.68, 0.265]}>
          <boxGeometry args={[0.24, 0.055, 0.025]} />
          <primitive object={glowMat} attach="material" />
        </mesh>
        <mesh position={[0, 1.14, 0.17]}>
          <boxGeometry args={[0.62, 0.08, 0.08]} />
          <primitive object={glowMat} attach="material" />
        </mesh>
        <mesh position={[0, 1.94, 0]} castShadow>
          <cylinderGeometry args={[0.075, 0.09, 0.14, 10]} />
          <primitive object={skinMat} attach="material" />
        </mesh>

        <mesh position={[-0.18, 0.84, -0.08]} rotation={[0.18, 0.08, 0.05]} castShadow>
          <planeGeometry args={[0.28, 0.74]} />
          <primitive object={clothMat} attach="material" />
        </mesh>
        <mesh position={[0.18, 0.84, -0.08]} rotation={[0.18, -0.08, -0.05]} castShadow>
          <planeGeometry args={[0.28, 0.74]} />
          <primitive object={clothMat} attach="material" />
        </mesh>

        <Arm side={-1} upperRef={leftUpperArm} lowerRef={leftForearm} />
        <Arm side={1} upperRef={rightUpperArm} lowerRef={rightForearm} />

        <group ref={head} position={[0, 2.14, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.2, 24, 20]} />
            <primitive object={skinMat} attach="material" />
          </mesh>
          <mesh position={[0, 0.12, -0.02]} castShadow>
            <sphereGeometry args={[0.21, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.54]} />
            <primitive object={darkMat} attach="material" />
          </mesh>
          {hairSpikes.map(([x, y, z, rz], i) => (
            <mesh key={i} position={[x, y, z]} rotation={[0, 0, rz]} castShadow>
              <coneGeometry args={[0.055, 0.24, 6]} />
              <primitive object={darkMat} attach="material" />
            </mesh>
          ))}
          <mesh position={[-0.068, 0.025, 0.178]}>
            <sphereGeometry args={[0.018, 12, 12]} />
            <primitive object={glowMat} attach="material" />
          </mesh>
          <mesh position={[0.068, 0.025, 0.178]}>
            <sphereGeometry args={[0.018, 12, 12]} />
            <primitive object={glowMat} attach="material" />
          </mesh>
        </group>
      </group>

      <mesh ref={powerOrb} visible={false} position={[0, 1.42, 1.02]}>
        <sphereGeometry args={[0.22, 28, 28]} />
        <primitive object={glowMat} attach="material" />
      </mesh>
      <mesh ref={aura} visible={false} position={[0, 1.42, 0.99]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.4, 0.035, 12, 44]} />
        <primitive object={glowMat} attach="material" />
      </mesh>
    </group>
  );
}
