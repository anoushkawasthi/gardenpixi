import gsap from "gsap";
import { create } from "zustand";
import {
  trackProjectOpen,
  trackRecruiterModeOpen,
  trackSectionVisit,
  trackWaterPlant,
  trackZombieModeEnter,
  trackZombieModeExit,
} from "../analytics/plausible";
import {
  CAMERA_LEVEL1_MS_DEFAULT,
  CAMERA_LEVEL1_MS_MAX,
  CAMERA_LEVEL1_MS_MIN,
  CAMERA_LEVEL2_MS_DEFAULT,
  CAMERA_LEVEL2_MS_MAX,
  CAMERA_LEVEL2_MS_MIN,
} from "../camera/constants";
import { cameraPresets, type CameraPresetId } from "../content/cameraPresets";
import { getProjectById, projectsList } from "../content/projectsList";
import type {
  CameraState,
  CottageUiPhase,
  EnvironmentMode,
  LandingAvatarId,
  ModalId,
  SitePhase,
} from "../types";

export type { CottageUiPhase, EnvironmentMode } from "../types";

const hubPreset = cameraPresets.hub;

/** Level-2 framing for a single project plant (world px 1200×700). */
const PROJECT_PLANT_FOCUS_ZOOM = 1.86;

const initialCamera = (): CameraState => ({
  cx: hubPreset.cx,
  cy: hubPreset.cy,
  zoom: hubPreset.zoom,
  transitionLevel: 1,
  isAnimating: false,
});

/** TRD §10.7 / Phase 11 — reset coffee streak if no coffee click within this window. */
const COFFEE_WINDOW_MS = 2000;

let coffeeWindowTimer: ReturnType<typeof setTimeout> | null = null;

function clearCoffeeTimer() {
  if (coffeeWindowTimer) {
    clearTimeout(coffeeWindowTimer);
    coffeeWindowTimer = null;
  }
}

let cameraTween: gsap.core.Tween | null = null;

function prefersReducedCameraMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function applyCameraInstant(
  set: (fn: (s: GardenStore) => Partial<GardenStore>) => void,
  presetId: CameraPresetId,
) {
  cameraTween?.kill();
  cameraTween = null;
  const p = cameraPresets[presetId];
  set((s) => ({
    camera: {
      ...s.camera,
      cx: p.cx,
      cy: p.cy,
      zoom: p.zoom,
      transitionLevel: 1,
      isAnimating: false,
    },
  }));
}

function applyCameraWorldInstant(
  set: (fn: (s: GardenStore) => Partial<GardenStore>) => void,
  target: { cx: number; cy: number; zoom: number },
  transitionLevel: 1 | 2,
) {
  cameraTween?.kill();
  cameraTween = null;
  set((s) => ({
    camera: {
      ...s.camera,
      cx: target.cx,
      cy: target.cy,
      zoom: target.zoom,
      transitionLevel,
      isAnimating: false,
    },
  }));
}

function tweenCameraToTarget(
  set: (fn: (s: GardenStore) => Partial<GardenStore>) => void,
  get: () => GardenStore,
  target: { cx: number; cy: number; zoom: number },
  durationSec: number,
  transitionLevel: 1 | 2,
) {
  const cam = get().camera;
  cameraTween?.kill();

  const proxy = { cx: cam.cx, cy: cam.cy, zoom: cam.zoom };

  set((s) => ({
    camera: { ...s.camera, isAnimating: true, transitionLevel },
  }));

  cameraTween = gsap.to(proxy, {
    cx: target.cx,
    cy: target.cy,
    zoom: target.zoom,
    duration: durationSec,
    ease: "power2.inOut",
    onUpdate: () => {
      set((s) => ({
        camera: {
          ...s.camera,
          cx: proxy.cx,
          cy: proxy.cy,
          zoom: proxy.zoom,
          isAnimating: true,
          transitionLevel,
        },
      }));
    },
    onComplete: () => {
      cameraTween = null;
      set((s) => ({
        camera: {
          ...s.camera,
          cx: target.cx,
          cy: target.cy,
          zoom: target.zoom,
          isAnimating: false,
          transitionLevel,
        },
      }));
    },
  });
}

export type GardenStore = {
  sitePhase: SitePhase;
  environmentMode: EnvironmentMode;
  preZombieMode: "day" | "night" | null;
  coffeeClickCount: number;
  camera: CameraState;
  activeModal: ModalId;
  activeProjectId: string | null;
  sessionWateredProjectIds: string[];
  terminalOpen: boolean;
  /** Phase 6 — hold `W` to arm watering (drag or tap plant, or arrows + Enter). */
  wateringKeyHeld: boolean;
  /** Keyboard cycle target while `W` is held. */
  waterHighlightProjectId: string | null;
  /** Phase 7 — door zoom + interior hotspots (PRD §9.4). */
  cottageInteriorActive: boolean;
  cottageUiPhase: CottageUiPhase;

  /** Landing hero — Craftpix character shown above dialogue. */
  landingAvatarId: LandingAvatarId;
  setLandingAvatarId: (id: LandingAvatarId) => void;

  enterGarden: () => void;

  setEnvironmentMode: (mode: EnvironmentMode) => void;
  toggleDayNight: () => void;
  /** Optional `source` for Plausible `zombie_mode_enter` (default `manual`). */
  enterZombie: (opts?: { source?: string }) => void;
  exitZombie: () => void;
  recordCoffeeClick: () => void;

  /**
   * Level 1 pan to a world preset (PRD §8). Uses GSAP (TRD §4.3) unless `immediate` or reduced motion.
   */
  goToCameraPreset: (
    presetId: CameraPresetId,
    options?: { immediate?: boolean; durationMs?: number },
  ) => void;
  setCamera: (partial: Partial<Pick<CameraState, "cx" | "cy" | "zoom" | "transitionLevel" | "isAnimating">>) => void;

  openModal: (id: Exclude<ModalId, "none">) => void;
  closeModal: () => void;
  openProjectDetail: (projectId: string) => void;
  /** Phase 5 — plant click: Level-2 zoom + modal + Plausible `project_open`. */
  openProjectFromGarden: (projectId: string) => void;

  /** Phase 7 — Level-2 zoom to cottage door + interior mode. */
  openCottageDoorZoom: () => void;
  /** Phase 7 — Level-1 pan back to cottage exterior; closes cottage modals. */
  closeCottageInterior: () => void;

  setTerminalOpen: (open: boolean) => void;
  /** Phase 8 — pan to terminal preset, open panel, analytics. */
  openTerminal: () => void;
  closeTerminal: () => void;
  addWateredSessionProject: (projectId: string) => void;
  /** Phase 6 — returns true if newly watered (for FX + toast). */
  applyWaterSuccess: (projectId: string) => boolean;
  setWateringKeyHeld: (held: boolean) => void;
  moveWaterHighlight: (delta: -1 | 1) => void;
};

export const useGardenStore = create<GardenStore>((set, get) => ({
  sitePhase: "landing",
  environmentMode: "day",
  preZombieMode: null,
  coffeeClickCount: 0,
  camera: initialCamera(),
  activeModal: "none",
  activeProjectId: null,
  sessionWateredProjectIds: [],
  terminalOpen: false,
  wateringKeyHeld: false,
  waterHighlightProjectId: projectsList[0]?.id ?? null,
  cottageInteriorActive: false,
  cottageUiPhase: "off",
  landingAvatarId: "swordsman",

  setLandingAvatarId: (landingAvatarId) => set({ landingAvatarId }),

  enterGarden: () => {
    get().closeModal();
    // One transition update after modal reset — avoids relying on merge order across
    // multiple set() calls from goToCameraPreset + hub fields (landing → hub).
    const p = cameraPresets.hub;
    cameraTween?.kill();
    cameraTween = null;
    set((s) => ({
      sitePhase: "hub",
      wateringKeyHeld: false,
      waterHighlightProjectId: projectsList[0]?.id ?? null,
      cottageInteriorActive: false,
      cottageUiPhase: "off",
      terminalOpen: false,
      camera: {
        ...s.camera,
        cx: p.cx,
        cy: p.cy,
        zoom: p.zoom,
        transitionLevel: 1,
        isAnimating: false,
      },
    }));
  },

  setEnvironmentMode: (environmentMode) => set({ environmentMode }),

  toggleDayNight: () => {
    const { environmentMode } = get();
    if (environmentMode === "zombie") return;
    set({
      environmentMode: environmentMode === "day" ? "night" : "day",
    });
  },

  enterZombie: (opts) => {
    const { environmentMode } = get();
    if (environmentMode === "zombie") return;
    clearCoffeeTimer();
    const preZombieMode: "day" | "night" = environmentMode === "night" ? "night" : "day";
    trackZombieModeEnter({ source: opts?.source ?? "manual" });
    set({ coffeeClickCount: 0, preZombieMode, environmentMode: "zombie" });
  },

  exitZombie: () => {
    const { preZombieMode } = get();
    const restore: EnvironmentMode = preZombieMode ?? "day";
    trackZombieModeExit();
    set({ environmentMode: restore, preZombieMode: null });
  },

  recordCoffeeClick: () => {
    const state = get();
    if (state.environmentMode === "zombie") return;

    clearCoffeeTimer();
    const next = state.coffeeClickCount + 1;

    if (next >= 3) {
      clearCoffeeTimer();
      const preZombieMode: "day" | "night" =
        state.environmentMode === "night" ? "night" : "day";
      trackZombieModeEnter({ source: "coffee" });
      set({ coffeeClickCount: 0, preZombieMode, environmentMode: "zombie" });
      return;
    }

    coffeeWindowTimer = setTimeout(() => {
      set({ coffeeClickCount: 0 });
      coffeeWindowTimer = null;
    }, COFFEE_WINDOW_MS);

    set({ coffeeClickCount: next });
  },

  goToCameraPreset: (presetId, options) => {
    const cottageUiPhase: CottageUiPhase =
      presetId === "cottage" ? "door_exterior" : presetId === "cottageDoor" ? "interior" : "off";
    const cottageInteriorActive = presetId === "cottageDoor";
    set({ cottageUiPhase, cottageInteriorActive });

    if (presetId === "cottage") trackSectionVisit("cottage");
    if (presetId === "mailbox") trackSectionVisit("mailbox");
    if (presetId === "projects") trackSectionVisit("projects");

    const immediate = options?.immediate === true;
    const durationMs =
      options?.durationMs !== undefined
        ? Math.min(CAMERA_LEVEL1_MS_MAX, Math.max(CAMERA_LEVEL1_MS_MIN, options.durationMs))
        : CAMERA_LEVEL1_MS_DEFAULT;

    if (immediate || prefersReducedCameraMotion()) {
      applyCameraInstant(set, presetId);
      return;
    }

    const p = cameraPresets[presetId];
    tweenCameraToTarget(set, get, { cx: p.cx, cy: p.cy, zoom: p.zoom }, durationMs / 1000, 1);
  },

  setCamera: (partial) =>
    set((s) => ({
      camera: { ...s.camera, ...partial },
    })),

  openModal: (id) => {
    set({ activeModal: id });
    if (id === "recruiter") trackRecruiterModeOpen();
  },

  closeModal: () => {
    cameraTween?.kill();
    cameraTween = null;
    set({ activeModal: "none", activeProjectId: null });
  },

  openProjectDetail: (projectId) =>
    set({ activeModal: "projectDetail", activeProjectId: projectId }),

  openProjectFromGarden: (projectId) => {
    const p = getProjectById(projectId);
    if (!p) return;
    set({
      activeModal: "projectDetail",
      activeProjectId: projectId,
      cottageInteriorActive: false,
      cottageUiPhase: "off",
      terminalOpen: false,
    });
    trackProjectOpen(projectId);
    const target = {
      cx: p.world.x,
      cy: p.world.y,
      zoom: PROJECT_PLANT_FOCUS_ZOOM,
    };
    if (prefersReducedCameraMotion()) {
      applyCameraWorldInstant(set, target, 2);
      return;
    }
    const durationMs = Math.min(
      CAMERA_LEVEL2_MS_MAX,
      Math.max(CAMERA_LEVEL2_MS_MIN, CAMERA_LEVEL2_MS_DEFAULT),
    );
    tweenCameraToTarget(set, get, target, durationMs / 1000, 2);
  },

  openCottageDoorZoom: () => {
    get().closeModal();
    const p = cameraPresets.cottageDoor;
    set({ cottageInteriorActive: true, cottageUiPhase: "interior" });
    trackSectionVisit("cottage_door");
    if (prefersReducedCameraMotion()) {
      applyCameraWorldInstant(set, { cx: p.cx, cy: p.cy, zoom: p.zoom }, 2);
      return;
    }
    const durationMs = Math.min(
      CAMERA_LEVEL2_MS_MAX,
      Math.max(CAMERA_LEVEL2_MS_MIN, CAMERA_LEVEL2_MS_DEFAULT),
    );
    tweenCameraToTarget(set, get, { cx: p.cx, cy: p.cy, zoom: p.zoom }, durationMs / 1000, 2);
  },

  closeCottageInterior: () => {
    get().closeModal();
    get().goToCameraPreset("cottage");
  },

  setTerminalOpen: (terminalOpen) => set({ terminalOpen }),

  openTerminal: () => {
    get().closeModal();
    get().goToCameraPreset("terminal");
    set({ terminalOpen: true });
    trackSectionVisit("terminal");
  },

  closeTerminal: () => set({ terminalOpen: false }),

  addWateredSessionProject: (projectId) =>
    set((s) => {
      if (s.sessionWateredProjectIds.includes(projectId)) return {};
      return {
        sessionWateredProjectIds: [...s.sessionWateredProjectIds, projectId],
      };
    }),

  applyWaterSuccess: (projectId) => {
    const s = get();
    if (s.sessionWateredProjectIds.includes(projectId)) return false;
    trackWaterPlant(projectId);
    set({
      sessionWateredProjectIds: [...s.sessionWateredProjectIds, projectId],
    });
    return true;
  },

  setWateringKeyHeld: (held) =>
    set((s) => {
      if (!held) return { wateringKeyHeld: false };
      const first = projectsList[0]?.id ?? null;
      return {
        wateringKeyHeld: true,
        waterHighlightProjectId: s.waterHighlightProjectId ?? first,
      };
    }),

  moveWaterHighlight: (delta) =>
    set((s) => {
      if (projectsList.length === 0) return {};
      const ids = projectsList.map((p) => p.id);
      let idx = s.waterHighlightProjectId ? ids.indexOf(s.waterHighlightProjectId) : 0;
      if (idx < 0) idx = 0;
      idx = (idx + delta + ids.length * 10) % ids.length;
      return { waterHighlightProjectId: ids[idx] ?? null };
    }),
}));
