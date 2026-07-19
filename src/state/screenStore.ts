import { create } from "zustand";

// Screen router for the prototype shell. "training" is the playable loop;
// everything else is part of the home/menu wrapper per the LOCKED home
// screen spec.
export type Screen =
  | "home"
  | "training"
  | "play"
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
