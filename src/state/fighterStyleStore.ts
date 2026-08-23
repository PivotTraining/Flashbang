import { create } from "zustand";

export type CostumeId = "classic" | "blackout" | "storm" | "inferno" | "solar" | "phantom";

export interface CostumePreset {
  id: CostumeId;
  name: string;
  subtitle: string;
  base: string;
  secondary: string;
  accent: string;
  energy: string;
  clothTint: number;
  metalness: number;
  roughness: number;
}

export const COSTUMES: Record<CostumeId, CostumePreset> = {
  classic: {
    id: "classic",
    name: "Flash Classic",
    subtitle: "Black techwear · electric blue",
    base: "#101827",
    secondary: "#183f73",
    accent: "#55c8ff",
    energy: "#35a9ff",
    clothTint: 0.22,
    metalness: 0.24,
    roughness: 0.5,
  },
  blackout: {
    id: "blackout",
    name: "Blackout",
    subtitle: "Stealth black · ice-blue trim",
    base: "#05070b",
    secondary: "#101522",
    accent: "#8beaff",
    energy: "#6de5ff",
    clothTint: 0.42,
    metalness: 0.38,
    roughness: 0.36,
  },
  storm: {
    id: "storm",
    name: "Storm Runner",
    subtitle: "Slate armor · violet lightning",
    base: "#181a2c",
    secondary: "#34395e",
    accent: "#ad8cff",
    energy: "#8a6cff",
    clothTint: 0.34,
    metalness: 0.32,
    roughness: 0.42,
  },
  inferno: {
    id: "inferno",
    name: "Redline",
    subtitle: "Crimson combat kit · hot core",
    base: "#210b12",
    secondary: "#641c30",
    accent: "#ff6d73",
    energy: "#ff4d67",
    clothTint: 0.39,
    metalness: 0.31,
    roughness: 0.4,
  },
  solar: {
    id: "solar",
    name: "Solar Crown",
    subtitle: "Onyx kit · gold charge",
    base: "#19150a",
    secondary: "#66501c",
    accent: "#ffe273",
    energy: "#ffc83d",
    clothTint: 0.35,
    metalness: 0.46,
    roughness: 0.34,
  },
  phantom: {
    id: "phantom",
    name: "Phantom",
    subtitle: "Frost shell · pale-blue energy",
    base: "#9eabb8",
    secondary: "#dbe7f1",
    accent: "#8ae6ff",
    energy: "#9cecff",
    clothTint: 0.46,
    metalness: 0.22,
    roughness: 0.5,
  },
};

export const COSTUME_ORDER: CostumeId[] = ["classic", "blackout", "storm", "inferno", "solar", "phantom"];

interface FighterStyleStore {
  playerCostume: CostumeId;
  enemyCostume: CostumeId;
  setPlayerCostume: (id: CostumeId) => void;
  setEnemyCostume: (id: CostumeId) => void;
}

export const useFighterStyleStore = create<FighterStyleStore>((set) => ({
  playerCostume: "classic",
  enemyCostume: "inferno",
  setPlayerCostume: (playerCostume) => set({ playerCostume }),
  setEnemyCostume: (enemyCostume) => set({ enemyCostume }),
}));

export function getCostumeForFighter(fighterId: "player" | "enemy") {
  const state = useFighterStyleStore.getState();
  return COSTUMES[fighterId === "player" ? state.playerCostume : state.enemyCostume];
}
