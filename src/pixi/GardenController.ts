import type { EnvironmentMode } from "../store/useGardenStore";

/** Mirrors TRD §8.1 — expand when wiring Pixi + Zustand subscription. */
export type GardenRuntimeState = {
  environmentMode: EnvironmentMode;
  camera: { cx: number; cy: number; zoom: number };
  sessionWateredIds: string[];
  highlightedPlantId: string | null;
};

export type GardenControllerApi = {
  mount(host: HTMLElement): Promise<void>;
  destroy(): void;
  applyState(state: GardenRuntimeState): void;
  resize(screenCss: { w: number; h: number }, dpr: number): void;
};

/**
 * Singleton-style controller. Dynamic-import `pixi.js` inside `mount` after
 * “Enter Garden” in production; this stub keeps the bundle free of WebGL until then.
 */
export function createGardenController(): GardenControllerApi {
  let hostEl: HTMLElement | null = null;

  return {
    async mount(host: HTMLElement) {
      hostEl = host;
      host.setAttribute("data-garden-controller", "stub");
      // Phase 3: await import('pixi.js'); new Application(); …
    },
    destroy() {
      hostEl?.removeAttribute("data-garden-controller");
      hostEl = null;
    },
    applyState(state: GardenRuntimeState) {
      void state;
      // Phase 3+: sync worldRoot / filters from store snapshot
    },
    resize(screenCss: { w: number; h: number }, dpr: number) {
      void screenCss;
      void dpr;
      // Phase 3+: TRD §6 resize + camera host metrics
    },
  };
}
