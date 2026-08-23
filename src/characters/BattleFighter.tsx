import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Group, Mesh } from "three";
import { useCombatStore, type FighterId } from "../combat/combatStore";

interface Props {
  fighterId: FighterId;
  energy: string;
  armorColor: string;
}

const lerp = THREE.MathUtils.lerp;

export default function BattleFighter({ fighterId, energy, armorColor }: Props) {
  const root = useRef<Group>(null);
  const torso = useRef<Group>(null);
  const head = useRef<Group>(null);
  const leftArm = useRef<Group>(null);
  const rightArm = useRef<Group>(null);
  const leftLeg = useRef<Group>(null);
  const rightLeg = useRef<Group>(null);
  const powerOrb = useRef<Mesh>(null);
  const aura = useRef<Mesh>(null);
  const t = useRef(0);

  const armorMat = useMemo(() => new THREE.MeshStandardMaterial({ color: armorColor, metalness: 0.62, roughness: 0.33 }), [armorColor]);
  const darkMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#0b1020", metalness: 0.4, roughness: 0.5 }), []);
  const skinMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#7a4d37", roughness: 0.68 }), []);
  const glowMat = useMemo(() => new THREE.MeshStandardMaterial({ color: energy, emissive: new THREE.Color(energy), emissiveIntensity: 4.8, roughness: 0.16, toneMapped: false }), [energy]);

  useFrame((_, dt) => {
    t.current += Math.min(dt, 0.05);
    const fighter = useCombatStore.getState()[fighterId];
    const r = root.current;
    const body = torso.current;
    const la = leftArm.current;
    const ra = rightArm.current;
    const ll = leftLeg.current;
    const rl = rightLeg.current;
    const h = head.current;
    if (!r || !body || !la || !ra || !ll || !rl || !h) return;

    let rootY = Math.sin(t.current * 3.2) * 0.012;
    let bodyX = 0;
    let bodyY = 0;
    let bodyRY = 0;
    let bodyRZ = 0;
    let leftArmX = 0.04;
    let leftArmZ = -0.04;
    let rightArmX = -0.04;
    let rightArmZ = 0.04;
    let leftLegX = 0;
    let leftLegZ = 0;
    let rightLegX = 0;
    let rightLegZ = 0;
    let headX = 0;
    let headY = 0;
    let orbVisible = false;
    let orbScale = 0.01;
    let auraScale = 0.01;

    if (fighter.guarding) {
      bodyX = -0.14;
      leftArmX = -1.05;
      leftArmZ = -0.28;
      rightArmX = -1.18;
      rightArmZ = 0.3;
    }

    const windup = fighter.phase === "windup";
    const active = fighter.phase === "active";
    const recovery = fighter.phase === "recovery";
    const action = active ? 1 : windup ? -0.48 : recovery ? 0.28 : 0;

    switch (fighter.moveId) {
      case "punch":
        bodyY = active ? 0.08 : windup ? -0.05 : 0;
        bodyRY = active ? -0.16 : windup ? 0.22 : 0;
        rightArmX = active ? -1.62 : windup ? 0.62 : -0.25;
        rightArmZ = active ? 0.03 : windup ? 0.38 : 0.05;
        leftArmX = -0.75;
        leftArmZ = -0.22;
        headY = active ? -0.08 : 0.04;
        break;
      case "roundKick":
        bodyRY = active ? -0.72 : windup ? 0.28 : 0;
        bodyRZ = active ? 0.2 : 0;
        rightLegX = active ? -1.18 : windup ? 0.34 : 0;
        rightLegZ = active ? -0.72 : windup ? 0.3 : 0;
        leftArmX = -0.85;
        rightArmX = -0.5;
        rootY += active ? 0.12 : 0;
        break;
      case "spinKick":
        bodyRY = active ? Math.PI * 0.95 : windup ? -0.65 : action * 0.25;
        bodyRZ = active ? -0.12 : 0;
        leftLegX = active ? -1.08 : 0.14;
        leftLegZ = active ? 0.86 : -0.18;
        rightArmX = -0.65;
        leftArmX = -0.75;
        rootY += active ? 0.16 : 0;
        break;
      case "risingKick":
        bodyX = active ? 0.16 : windup ? -0.35 : 0;
        rightLegX = active ? -2.15 : windup ? 0.45 : -0.18;
        rightLegZ = active ? 0.12 : 0;
        leftArmX = active ? -0.9 : -0.35;
        rightArmX = active ? -0.65 : -0.28;
        rootY += active ? 0.42 : windup ? -0.09 : 0;
        break;
      case "legSweep":
        bodyX = 0.38;
        bodyY = active ? -0.22 : -0.12;
        bodyRY = active ? -1.18 : windup ? 0.38 : -0.25;
        leftLegX = active ? -0.42 : 0.1;
        leftLegZ = active ? 1.12 : 0.12;
        rightLegX = 0.45;
        leftArmX = -0.7;
        rightArmX = -0.8;
        rootY += active ? -0.28 : -0.16;
        break;
      case "ballThrow":
        bodyX = active ? -0.16 : windup ? 0.2 : 0;
        rightArmX = active ? -1.55 : windup ? 0.82 : -0.3;
        leftArmX = active ? -1.28 : windup ? 0.66 : -0.3;
        rightArmZ = 0.14;
        leftArmZ = -0.14;
        orbVisible = windup || active;
        orbScale = windup ? 0.45 + Math.sin(t.current * 20) * 0.08 : active ? 1.45 : 0.01;
        auraScale = windup ? 0.9 : active ? 1.6 : 0.01;
        break;
      default:
        break;
    }

    if (fighter.phase === "stagger") {
      bodyX = 0.5;
      bodyRZ = fighterId === "player" ? -0.18 : 0.18;
      rightArmX = 0.5;
      leftArmX = 0.42;
      headX = 0.3;
    }
    if (fighter.phase === "down") {
      bodyRZ = fighterId === "player" ? Math.PI / 2 : -Math.PI / 2;
      rootY = -0.42;
      rightArmX = 0.25;
      leftArmX = -0.2;
    }

    r.position.y = lerp(r.position.y, rootY, 0.3);
    body.position.y = lerp(body.position.y, bodyY, 0.36);
    body.rotation.x = lerp(body.rotation.x, bodyX, 0.4);
    body.rotation.y = lerp(body.rotation.y, bodyRY, 0.5);
    body.rotation.z = lerp(body.rotation.z, bodyRZ, 0.42);

    la.rotation.x = lerp(la.rotation.x, leftArmX, 0.48);
    la.rotation.z = lerp(la.rotation.z, leftArmZ, 0.45);
    ra.rotation.x = lerp(ra.rotation.x, rightArmX, 0.5);
    ra.rotation.z = lerp(ra.rotation.z, rightArmZ, 0.45);
    ll.rotation.x = lerp(ll.rotation.x, leftLegX, 0.5);
    ll.rotation.z = lerp(ll.rotation.z, leftLegZ, 0.5);
    rl.rotation.x = lerp(rl.rotation.x, rightLegX, 0.5);
    rl.rotation.z = lerp(rl.rotation.z, rightLegZ, 0.5);
    h.rotation.x = lerp(h.rotation.x, headX, 0.35);
    h.rotation.y = lerp(h.rotation.y, headY, 0.35);

    if (powerOrb.current) {
      powerOrb.current.visible = orbVisible;
      powerOrb.current.scale.setScalar(lerp(powerOrb.current.scale.x, orbScale, 0.34));
      powerOrb.current.rotation.y += dt * 5;
    }
    if (aura.current) {
      aura.current.visible = orbVisible;
      aura.current.scale.setScalar(lerp(aura.current.scale.x, auraScale, 0.28));
      aura.current.rotation.z += dt * 2.8;
    }
  });

  const limb = (side: -1 | 1, kind: "arm" | "leg", ref: React.RefObject<Group>) => {
    const isArm = kind === "arm";
    const x = side * (isArm ? 0.43 : 0.2);
    const y = isArm ? 1.72 : 1.03;
    const upperLen = isArm ? 0.43 : 0.52;
    const lowerLen = isArm ? 0.4 : 0.5;
    const radius = isArm ? 0.105 : 0.13;
    return (
      <group ref={ref} position={[x, y, 0]}>
        <mesh position={[0, -upperLen / 2, 0]} castShadow>
          <capsuleGeometry args={[radius, upperLen - radius * 1.1, 8, 14]} />
          <primitive object={armorMat} attach="material" />
        </mesh>
        <mesh position={[0, -upperLen, 0]} castShadow>
          <sphereGeometry args={[radius * 0.9, 14, 14]} />
          <primitive object={darkMat} attach="material" />
        </mesh>
        <mesh position={[0, -upperLen - lowerLen / 2, 0]} castShadow>
          <capsuleGeometry args={[radius * 0.92, lowerLen - radius, 8, 14]} />
          <primitive object={armorMat} attach="material" />
        </mesh>
        <mesh position={[0, -upperLen - lowerLen - 0.05, isArm ? 0.03 : 0.08]} castShadow>
          <boxGeometry args={isArm ? [0.18, 0.17, 0.22] : [0.24, 0.16, 0.38]} />
          <primitive object={darkMat} attach="material" />
        </mesh>
        <mesh position={[0, -upperLen * 0.55, radius * 0.92]}>
          <boxGeometry args={[0.035, upperLen * 0.52, 0.025]} />
          <primitive object={glowMat} attach="material" />
        </mesh>
      </group>
    );
  };

  return (
    <group ref={root} scale={1.12}>
      <group ref={torso}>
        {limb(-1, "leg", leftLeg)}
        {limb(1, "leg", rightLeg)}

        <mesh position={[0, 1.2, 0]} castShadow>
          <boxGeometry args={[0.52, 0.24, 0.32]} />
          <primitive object={darkMat} attach="material" />
        </mesh>
        <mesh position={[0, 1.58, 0]} castShadow>
          <capsuleGeometry args={[0.3, 0.48, 10, 18]} />
          <primitive object={armorMat} attach="material" />
        </mesh>
        <mesh position={[0, 1.69, 0.23]}>
          <sphereGeometry args={[0.07, 20, 20]} />
          <primitive object={glowMat} attach="material" />
        </mesh>

        {limb(-1, "arm", leftArm)}
        {limb(1, "arm", rightArm)}

        <group ref={head} position={[0, 2.12, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.19, 24, 20]} />
            <primitive object={skinMat} attach="material" />
          </mesh>
          <mesh position={[0, 0.1, -0.02]} castShadow>
            <sphereGeometry args={[0.205, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
            <primitive object={darkMat} attach="material" />
          </mesh>
          <mesh position={[-0.065, 0.025, 0.177]}>
            <sphereGeometry args={[0.018, 12, 12]} />
            <primitive object={glowMat} attach="material" />
          </mesh>
          <mesh position={[0.065, 0.025, 0.177]}>
            <sphereGeometry args={[0.018, 12, 12]} />
            <primitive object={glowMat} attach="material" />
          </mesh>
        </group>
      </group>

      <mesh ref={powerOrb} visible={false} position={[0, 1.45, 1.02]}>
        <sphereGeometry args={[0.22, 28, 28]} />
        <primitive object={glowMat} attach="material" />
      </mesh>
      <mesh ref={aura} visible={false} position={[0, 1.45, 0.99]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.38, 0.035, 12, 40]} />
        <primitive object={glowMat} attach="material" />
      </mesh>
    </group>
  );
}
