import type { GardenStore } from "./useGardenStore";

/** TRD §9.2 — fine-grained selectors for HUD / canvas subscriptions. */

export const selectSitePhase = (s: GardenStore) => s.sitePhase;
export const selectEnvironmentMode = (s: GardenStore) => s.environmentMode;
export const selectPreZombieMode = (s: GardenStore) => s.preZombieMode;
export const selectCamera = (s: GardenStore) => s.camera;
export const selectCameraIsAnimating = (s: GardenStore) => s.camera.isAnimating;
export const selectActiveModal = (s: GardenStore) => s.activeModal;
export const selectActiveProjectId = (s: GardenStore) => s.activeProjectId;
export const selectSessionWateredIds = (s: GardenStore) => s.sessionWateredProjectIds;
export const selectTerminalOpen = (s: GardenStore) => s.terminalOpen;
export const selectCottageInteriorActive = (s: GardenStore) => s.cottageInteriorActive;
