import {
  resetAmbientArt,
  scheduleAmbientSheetLoad,
  setAmbientMountGeneration,
  syncAmbientArt,
} from "./ambient/syncAmbientArt";
import { resetHubDecor, scheduleHubDecorSheetLoad, syncHubDecor } from "./hubDecor/syncHubDecor";
import type { EnvironmentMode } from "../types";
import {
  GARDEN_COTTAGE_HOTSPOT_EVENT,
  GARDEN_PLANT_CLICK_EVENT,
  GARDEN_WATER_SUCCESS_EVENT,
  type CottageHotspotKind,
} from "../garden/events";

/** TRD §8.1 — runtime snapshot from Zustand (Pixi ↔ React bridge). */
export type GardenPlant = {
  id: string;
  x: number;
  y: number;
  plantStyle: string;
};

export type CottageHotspotRuntime = {
  kind: CottageHotspotKind;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type GardenRuntimeState = {
  environmentMode: EnvironmentMode;
  camera: { cx: number; cy: number; zoom: number };
  sessionWateredProjectIds: string[];
  /** Keyboard focus while watering (W) — ring drawn on this plant. */
  highlightedPlantId: string | null;
  /** Phase 6 — disambiguate tap vs drag watering (TRD §5.2). */
  wateringKeyHeld: boolean;
  plants: readonly GardenPlant[];
  /** Phase 7 — door + interior props (world px, top-left x,y). */
  cottageHotspots: readonly CottageHotspotRuntime[];
};

export type GardenControllerApi = {
  mount(host: HTMLElement): Promise<void>;
  destroy(): void;
  applyState(state: GardenRuntimeState): void;
  resize(screenCss: { w: number; h: number }, dpr: number): void;
  /** Phase 6 — brief droplet burst after a successful water (keyboard or pointer). */
  celebrateWaterAt(projectId: string): void;
};

type ScreenCss = { w: number; h: number };

/** TRD §0.3 — authoring world (px). */
const WORLD_W = 1200;
const WORLD_H = 700;

const PLANT_W = 44;
const PLANT_H = 52;

/** TRD §5.2 — tap vs drag (CSS px). */
const TAP_MOVE_MAX_PX = 10;
const DRAG_ARM_MIN_PX = 12;

const STYLE_DAY: Record<string, number> = {
  monstera: 0x2d6a4f,
  glowing_flower: 0xffd166,
  spider: 0x40916c,
  round_leaf: 0x52b788,
  fern: 0x38a169,
  cactus: 0x606c38,
};

const STYLE_ZOMBIE: Record<string, number> = {
  monstera: 0x3d3d3d,
  glowing_flower: 0x660708,
  spider: 0x2f2f2f,
  round_leaf: 0x444444,
  fern: 0x2a2a2a,
  cactus: 0x555555,
};

function lightenRgb(hex: number, amount: number): number {
  const r = (hex >> 16) & 0xff;
  const g = (hex >> 8) & 0xff;
  const b = hex & 0xff;
  const nr = Math.min(255, Math.floor(r + (255 - r) * amount));
  const ng = Math.min(255, Math.floor(g + (255 - g) * amount));
  const nb = Math.min(255, Math.floor(b + (255 - b) * amount));
  return (nr << 16) + (ng << 8) + nb;
}

function hitPlantAt(
  plants: readonly GardenPlant[],
  wx: number,
  wy: number,
): string | null {
  for (let i = plants.length - 1; i >= 0; i--) {
    const p = plants[i]!;
    if (
      wx >= p.x - PLANT_W / 2 &&
      wx <= p.x + PLANT_W / 2 &&
      wy >= p.y - PLANT_H &&
      wy <= p.y
    ) {
      return p.id;
    }
  }
  return null;
}

/**
 * Owns Pixi `Application`, `worldRoot`, and TRD §2.1 layer stack.
 * `pixi.js` is dynamically imported inside `mount` (TRD §13.1).
 * Phase 12 — ambient grass/clouds/birds/cat: `ambient/syncAmbientArt.ts` (procedural + optional Aseprite).
 * Phase 13 — curated hub decor: `hubDecor/syncHubDecor.ts` (`hub.json` in characters or components).
 * Per-texture `SCALE_MODE` / mipmaps apply when loading sprites (TRD §6.2).
 */
export function createGardenController(): GardenControllerApi {
  let hostEl: HTMLElement | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- instantiated after `import('pixi.js')`
  let app: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let worldRoot: any = null;
  let pixiModule: typeof import("pixi.js") | null = null;
  let lastScreen: ScreenCss = { w: 800, h: 450 };
  let lastDpr = 1;
  let lastState: GardenRuntimeState | null = null;
  let lastPlantsSignature = "";
  let lastHotspotSignature = "";
  /** Only repaint static sky/ground when theme changes (avoid work each camera tick). */
  let lastBackdropEnv: EnvironmentMode | undefined;
  /** Bails out stale async `mount` work after React StrictMode cleanup (dev). */
  let mountGeneration = 0;

  type DragState = {
    startGx: number;
    startGy: number;
    pointerId: number;
    downPlantId: string | null;
    moved: boolean;
  };
  let activeDrag: DragState | null = null;

  const syncWorldRootFromState = () => {
    if (!worldRoot || !lastState) return;
    const { cx, cy, zoom } = lastState.camera;
    const { w: Wc, h: Hc } = lastScreen;
    if (Wc < 1 || Hc < 1) return;
    /** Scale up when the world is narrower/shorter than the canvas so sky + ground cover edge-to-edge (no side bars). */
    let s = zoom;
    const worldWpx = WORLD_W * s;
    const worldHpx = WORLD_H * s;
    const cover = Math.max(Wc / worldWpx, Hc / worldHpx);
    if (cover > 1) s *= cover;
    worldRoot.scale.set(s, s);
    worldRoot.position.set(Wc / 2 - cx * s, Hc / 2 - cy * s);
  };

  const applyRendererSize = (screen: ScreenCss, dpr: number) => {
    lastScreen = screen;
    lastDpr = dpr;
    if (!app?.renderer) return;
    app.renderer.resolution = dpr;
    app.renderer.resize(Math.floor(screen.w * dpr), Math.floor(screen.h * dpr));
    app.stage.hitArea = app.screen;
    const canvas = app.canvas as HTMLCanvasElement;
    canvas.style.width = `${screen.w}px`;
    canvas.style.height = `${screen.h}px`;
    syncWorldRootFromState();
  };

  const emitPlantClick = (projectId: string) => {
    if (!hostEl) return;
    hostEl.dispatchEvent(
      new CustomEvent(GARDEN_PLANT_CLICK_EVENT, {
        bubbles: true,
        detail: { projectId },
      }),
    );
  };

  const emitWaterSuccess = (projectId: string) => {
    if (!hostEl) return;
    hostEl.dispatchEvent(
      new CustomEvent(GARDEN_WATER_SUCCESS_EVENT, {
        bubbles: true,
        detail: { projectId },
      }),
    );
  };

  const syncWorldBackdrop = (environmentMode: EnvironmentMode) => {
    if (!worldRoot || !pixiModule) return;
    if (lastBackdropEnv === environmentMode) return;
    lastBackdropEnv = environmentMode;

    const { Graphics } = pixiModule;
    const layer = worldRoot.children.find((c: { label?: string }) => c.label === "layer_background");
    if (!layer) return;

    layer.removeChildren();

    const sky: Record<EnvironmentMode, number> = {
      day: 0x87ceeb,
      night: 0x0d1b2a,
      zombie: 0x1a1a1a,
    };
    const ground: Record<EnvironmentMode, number> = {
      day: 0x5dbb63,
      night: 0x2d5016,
      zombie: 0x3b2f2f,
    };

    const horizonY = WORLD_H * 0.42;
    const g = new Graphics();
    g.rect(0, 0, WORLD_W, horizonY).fill({ color: sky[environmentMode] });
    g.rect(0, horizonY, WORLD_W, WORLD_H - horizonY).fill({ color: ground[environmentMode] });
    layer.addChild(g);

    if (environmentMode === "night") {
      const stars = new Graphics();
      for (let i = 0; i < 18; i++) {
        const sx = 48 + ((i * 137 + i * i * 11) % (WORLD_W - 96));
        const sy = 22 + ((i * 89) % (horizonY - 44));
        const r = 0.45 + (i % 4) * 0.35;
        const alpha = 0.42 + (i % 5) * 0.09;
        stars.circle(sx, sy, r).fill({ color: 0xe8f4ff, alpha });
      }
      layer.addChild(stars);

      const fireflies = new Graphics();
      const spots: [number, number][] = [
        [140, Math.min(horizonY - 30, 200)],
        [420, Math.min(horizonY - 50, 240)],
        [780, Math.min(horizonY - 40, 180)],
        [980, Math.min(horizonY - 35, 220)],
      ];
      for (const [fx, fy] of spots) {
        fireflies.circle(fx, fy, 2.2).fill({ color: 0xffdd66, alpha: 0.88 });
      }
      layer.addChild(fireflies);
    }
  };

  const rebuildPlants = (state: GardenRuntimeState) => {
    if (!worldRoot || !pixiModule || !hostEl) return;

    const wateredKey = [...state.sessionWateredProjectIds].sort().join(",");
    const sig = `${state.environmentMode}|${state.wateringKeyHeld}|${state.highlightedPlantId ?? ""}|${wateredKey}|${state.plants.map((p) => `${p.id}:${p.x}:${p.y}:${p.plantStyle}`).join(";")}`;
    if (sig === lastPlantsSignature) return;
    lastPlantsSignature = sig;

    const { Graphics } = pixiModule;
    const layer = worldRoot.children.find((c: { label?: string }) => c.label === "layer_plants");
    if (!layer) return;

    layer.removeChildren();

    const isZombie = state.environmentMode === "zombie";
    const palette = isZombie ? STYLE_ZOMBIE : STYLE_DAY;

    for (const plant of state.plants) {
      let color = palette[plant.plantStyle] ?? (isZombie ? 0x404040 : 0x4a7c59);
      if (state.sessionWateredProjectIds.includes(plant.id)) {
        color = lightenRgb(color, 0.22);
      }

      const g = new Graphics();
      g.roundRect(-PLANT_W / 2, -PLANT_H, PLANT_W, PLANT_H, 6);
      g.fill({ color });
      g.x = plant.x;
      g.y = plant.y;
      g.eventMode = "none";

      if (state.highlightedPlantId === plant.id && state.wateringKeyHeld) {
        const ring = new Graphics();
        ring.roundRect(-PLANT_W / 2 - 3, -PLANT_H - 3, PLANT_W + 6, PLANT_H + 6, 8);
        ring.stroke({ width: 2, color: 0xffec8b, alpha: 0.95 });
        ring.x = plant.x;
        ring.y = plant.y;
        ring.eventMode = "none";
        layer.addChild(ring);
      }

      layer.addChild(g);
    }
  };

  const rebuildCottageHotspots = (state: GardenRuntimeState) => {
    if (!worldRoot || !pixiModule || !hostEl) return;

    const sig = JSON.stringify(state.cottageHotspots);
    if (sig === lastHotspotSignature) return;
    lastHotspotSignature = sig;

    const { Graphics, Rectangle } = pixiModule;
    const layer = worldRoot.children.find((c: { label?: string }) => c.label === "layer_cottageHits");
    if (!layer) return;

    layer.removeChildren();
    const host = hostEl;

    for (const h of state.cottageHotspots) {
      const g = new Graphics();
      g.rect(h.x, h.y, h.w, h.h);
      g.fill({ color: 0xffffff, alpha: 0.06 });
      g.eventMode = "static";
      g.cursor = "pointer";
      g.hitArea = new Rectangle(h.x, h.y, h.w, h.h);
      const kind = h.kind;
      g.on("pointerdown", (e: { stopPropagation: () => void }) => {
        e.stopPropagation();
      });
      g.on("pointertap", () => {
        host.dispatchEvent(
          new CustomEvent(GARDEN_COTTAGE_HOTSPOT_EVENT, {
            bubbles: true,
            detail: { kind },
          }),
        );
      });
      layer.addChild(g);
    }
  };

  const detachStageDragListeners = () => {
    if (!app) return;
    app.stage.off("pointermove", onStagePointerMove);
    app.stage.off("pointerup", onStagePointerUp);
    app.stage.off("pointerupoutside", onStagePointerUp);
  };

  const onStagePointerMove = (e: { global: { x: number; y: number }; pointerId: number }) => {
    if (!activeDrag || e.pointerId !== activeDrag.pointerId) return;
    const d = Math.hypot(e.global.x - activeDrag.startGx, e.global.y - activeDrag.startGy);
    if (d >= DRAG_ARM_MIN_PX) activeDrag.moved = true;
  };

  const onStagePointerUp = (e: { global: { x: number; y: number }; pointerId: number }) => {
    if (!activeDrag || e.pointerId !== activeDrag.pointerId) return;
    detachStageDragListeners();

    const st = lastState;
    const wr = worldRoot;
    const host = hostEl;
    if (!st || !wr || !host) {
      activeDrag = null;
      return;
    }

    const local = wr.toLocal(e.global);
    const upPlant = hitPlantAt(st.plants, local.x, local.y);
    const watering = st.wateringKeyHeld;
    const dist = Math.hypot(e.global.x - activeDrag.startGx, e.global.y - activeDrag.startGy);
    const tapLike = !activeDrag.moved && dist <= TAP_MOVE_MAX_PX;

    if (tapLike && upPlant) {
      if (watering) {
        emitWaterSuccess(upPlant);
      } else if (activeDrag.downPlantId === upPlant) {
        emitPlantClick(upPlant);
      }
    } else if (watering && activeDrag.moved && upPlant) {
      emitWaterSuccess(upPlant);
    }

    activeDrag = null;
  };

  const onWorldPointerDown = (e: {
    global: { x: number; y: number };
    pointerId: number;
    getLocalPosition: (container: unknown, point?: unknown, out?: unknown) => { x: number; y: number };
  }) => {
    if (!worldRoot || !lastState) return;
    const local = e.getLocalPosition(worldRoot);
    const downPlant = hitPlantAt(lastState.plants, local.x, local.y);
    activeDrag = {
      startGx: e.global.x,
      startGy: e.global.y,
      pointerId: e.pointerId,
      downPlantId: downPlant,
      moved: false,
    };
    if (app) {
      app.stage.on("pointermove", onStagePointerMove);
      app.stage.on("pointerup", onStagePointerUp);
      app.stage.on("pointerupoutside", onStagePointerUp);
    }
  };

  const celebrateWaterAtImpl = (projectId: string) => {
    if (!worldRoot || !pixiModule || !app || !lastState) return;
    const plant = lastState.plants.find((p) => p.id === projectId);
    if (!plant) return;

    const layer = worldRoot.children.find((c: { label?: string }) => c.label === "layer_particlesFx");
    if (!layer) return;

    const { Graphics } = pixiModule;
    const n = 7;
    for (let i = 0; i < n; i++) {
      const droplet = new Graphics();
      droplet.circle(0, 0, 2.5 + Math.random() * 2.5).fill({ color: 0x4dabf7, alpha: 0.9 });
      droplet.x = plant.x + (Math.random() - 0.5) * 28;
      droplet.y = plant.y - PLANT_H * 0.45 + (Math.random() - 0.5) * 14;
      droplet.eventMode = "none";
      layer.addChild(droplet);

      const start = performance.now();
      const duration = 360 + Math.random() * 120;
      const tick = () => {
        const t = (performance.now() - start) / duration;
        droplet.alpha = Math.max(0, 1 - t);
        droplet.y -= 1.1 + Math.random() * 0.4;
        if (t >= 1) {
          app.ticker.remove(tick);
          layer.removeChild(droplet);
          droplet.destroy({ children: true });
        }
      };
      app.ticker.add(tick);
    }
  };

  return {
    async mount(host: HTMLElement) {
      const gen = ++mountGeneration;
      setAmbientMountGeneration(gen);
      hostEl = host;
      const pixi = await import("pixi.js");
      pixiModule = pixi;
      if (gen !== mountGeneration || !hostEl) return;

      const { Application, Container, Rectangle } = pixi;

      lastScreen = {
        w: Math.max(1, Math.floor(host.clientWidth || host.getBoundingClientRect().width)),
        h: Math.max(1, Math.floor(host.clientHeight || host.getBoundingClientRect().height)),
      };
      lastDpr = Math.min(window.devicePixelRatio, 2);

      app = new Application();
      await app.init({
        width: Math.floor(lastScreen.w * lastDpr),
        height: Math.floor(lastScreen.h * lastDpr),
        resolution: lastDpr,
        antialias: false,
        background: 0x000000,
        backgroundAlpha: 0,
        preference: "webgl",
      });
      if (gen !== mountGeneration || !hostEl) {
        app.destroy(true, { children: true });
        app = null;
        pixiModule = null;
        return;
      }

      const canvas = app.canvas as HTMLCanvasElement;
      canvas.setAttribute("role", "img");
      canvas.setAttribute("aria-label", "Anoushka's pixel garden world");

      app.stage.eventMode = "static";
      app.stage.hitArea = app.screen;

      worldRoot = new Container();
      worldRoot.label = "worldRoot";
      worldRoot.eventMode = "static";
      worldRoot.hitArea = new Rectangle(0, 0, WORLD_W, WORLD_H);
      worldRoot.on("pointerdown", onWorldPointerDown);

      const layerIds = [
        "layer_background",
        "layer_groundTiles",
        "layer_propsStatic",
        "layer_hubDecor",
        "layer_plants",
        "layer_actors",
        "layer_particlesFx",
        "layer_cottageHits",
      ] as const;

      for (const id of layerIds) {
        const layer = new Container();
        layer.label = id;
        if (id === "layer_actors") {
          layer.sortableChildren = true;
        }
        worldRoot.addChild(layer);
      }

      app.stage.addChild(worldRoot);
      if (gen !== mountGeneration || !hostEl) {
        app.destroy(true, { children: true });
        app = null;
        worldRoot = null;
        pixiModule = null;
        return;
      }
      host.appendChild(canvas);
      applyRendererSize(lastScreen, lastDpr);

      scheduleAmbientSheetLoad(gen, pixi, () => ({
        pixi,
        worldRoot,
        app,
        worldW: WORLD_W,
        worldH: WORLD_H,
        environmentMode: lastState?.environmentMode ?? "day",
      }));

      scheduleHubDecorSheetLoad(gen, pixi, () => ({
        pixi,
        worldRoot,
        worldW: WORLD_W,
        worldH: WORLD_H,
        environmentMode: lastState?.environmentMode ?? "day",
      }));
    },

    destroy() {
      mountGeneration += 1;
      setAmbientMountGeneration(mountGeneration);
      detachStageDragListeners();
      activeDrag = null;
      lastPlantsSignature = "";
      lastHotspotSignature = "";
      lastBackdropEnv = undefined;
      resetHubDecor(worldRoot);
      resetAmbientArt(app, worldRoot);
      if (app) {
        try {
          app.destroy(true, { children: true });
        } catch {
          /* noop */
        }
      }
      app = null;
      worldRoot = null;
      pixiModule = null;
      lastState = null;
      hostEl = null;
    },

    applyState(state: GardenRuntimeState) {
      lastState = state;
      syncWorldBackdrop(state.environmentMode);
      if (worldRoot && pixiModule && app) {
        syncAmbientArt({
          pixi: pixiModule,
          worldRoot,
          app,
          worldW: WORLD_W,
          worldH: WORLD_H,
          environmentMode: state.environmentMode,
        });
        syncHubDecor({
          pixi: pixiModule,
          worldRoot,
          worldW: WORLD_W,
          worldH: WORLD_H,
          environmentMode: state.environmentMode,
        });
      }
      rebuildPlants(state);
      rebuildCottageHotspots(state);
      syncWorldRootFromState();
    },

    resize(screenCss: ScreenCss, dpr: number) {
      applyRendererSize(screenCss, dpr);
    },

    celebrateWaterAt(projectId: string) {
      celebrateWaterAtImpl(projectId);
    },
  };
}
