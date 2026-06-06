import { create } from "zustand";

export type EnvironmentMode = "day" | "night" | "zombie";

type GardenState = {
  environmentMode: EnvironmentMode;
  setEnvironmentMode: (mode: EnvironmentMode) => void;
};

export const useGardenStore = create<GardenState>((set) => ({
  environmentMode: "day",
  setEnvironmentMode: (environmentMode) => set({ environmentMode }),
}));
