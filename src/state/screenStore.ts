import { create } from "zustand";

export type Screen =
  | "home"
  | "training"
  | "play"
  | "battle"
  | "ranked"
  | "story"
  | "events"
  | "career"
  | "study"
  | "characters"
  | "settings"
  | "friends"
  | "shop"
  | "powers"
  | "ball"
  | "dragons"
  | "loadout"
  | "achievements"
  | "missions"
  | "leaderboard";

interface ScreenStore {
  screen: Screen;
  navigate: (screen: Screen) => void;
}

export const useScreenStore = create<ScreenStore>((set) => ({
  screen: "home",
  navigate: (screen) => set({ screen }),
}));
