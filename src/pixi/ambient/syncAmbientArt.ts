import type { EnvironmentMode } from "../../types";
import type { Container, Graphics, Spritesheet, Texture } from "pixi.js";
import { tryLoadAmbientSpritesheet } from "./loadAsepriteAmbient";

const HORIZON_RATIO = 0.42;

function layer(worldRoot: Container, id: string): Container | null {
  const c = worldRoot.children.find((ch: { label?: string }) => ch.label === id);
  return (c ?? null) as Container | null;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function frameKeysMatching(sheet: Spritesheet, re: RegExp): string[] {
  return Object.keys(sheet.textures).filter((k) => re.test(k));
}

let ambientTicker: (() => void) | null = null;
let activeSheet: Spritesheet | null = null;
let mountGenRef = 0;

function clearAmbientLayers(worldRoot: Container | null): void {
  if (!worldRoot) return;
  for (const id of ["layer_groundTiles", "layer_propsStatic", "layer_actors"] as const) {
    const L = layer(worldRoot, id);
    L?.removeChildren();
  }
}

export function resetAmbientArt(
  app: { ticker: { remove: (fn: unknown) => void } } | null,
  worldRoot: Container | null,
): void {
  if (ambientTicker && app) {
    app.ticker.remove(ambientTicker);
  }
  ambientTicker = null;
  clearAmbientLayers(worldRoot);
  if (activeSheet) {
    try {
      activeSheet.destroy(true);
    } catch {
      /* noop */
    }
  }
  activeSheet = null;
}

export function setAmbientMountGeneration(gen: number): void {
  mountGenRef = gen;
}

/** Shared with hub decor async loads (strict mode / unmount races). */
export function isAmbientMountStale(gen: number): boolean {
  return gen !== mountGenRef;
}

export type AmbientSyncContext = {
  pixi: typeof import("pixi.js");
  worldRoot: Container;
  app: import("pixi.js").Application;
  worldW: number;
  worldH: number;
  environmentMode: EnvironmentMode;
};

function drawProcedural(ctx: AmbientSyncContext): void {
  const { pixi, worldRoot, app, worldW, worldH, environmentMode } = ctx;
  const { Graphics, Container } = pixi;
  const horizonY = worldH * HORIZON_RATIO;
  const ground = layer(worldRoot, "layer_groundTiles");
  const props = layer(worldRoot, "layer_propsStatic");
  const actors = layer(worldRoot, "layer_actors");
  if (!ground || !props || !actors) return;

  ground.removeChildren();
  props.removeChildren();
  actors.removeChildren();

  const isNight = environmentMode === "night";
  const isZombie = environmentMode === "zombie";

  const grassTint = isZombie ? 0x4a3a32 : isNight ? 0x2a4018 : 0x3d8c42;
  const grass = new Graphics();
  for (let i = 0; i < 48; i++) {
    const gx = 12 + ((i * 97) % (worldW - 24));
    const gy = horizonY + 8 + ((i * 13) % (worldH - horizonY - 20));
    grass.moveTo(gx, gy);
    grass.lineTo(gx - 2, gy - 6 - (i % 3));
    grass.lineTo(gx + 2, gy - 5 - (i % 4));
    grass.closePath();
    grass.fill({ color: grassTint, alpha: 0.75 });
  }
  grass.eventMode = "none";
  ground.addChild(grass);

  const cloudColor = isZombie ? 0x553355 : isNight ? 0x2a3544 : 0xffffff;
  const cloudAlpha = isZombie ? 0.35 : isNight ? 0.22 : 0.42;
  const clouds = new Graphics();
  const cloudYs = [horizonY * 0.22, horizonY * 0.32, horizonY * 0.18];
  const cloudXs = [worldW * 0.15, worldW * 0.48, worldW * 0.72];
  for (let i = 0; i < cloudXs.length; i++) {
    const cx = cloudXs[i]!;
    const cy = cloudYs[i]!;
    clouds.ellipse(cx, cy, 52 + i * 8, 18 + (i % 2) * 4).fill({ color: cloudColor, alpha: cloudAlpha });
    clouds.ellipse(cx + 28, cy + 4, 38, 14).fill({ color: cloudColor, alpha: cloudAlpha * 0.95 });
    clouds.ellipse(cx - 22, cy + 2, 34, 12).fill({ color: cloudColor, alpha: cloudAlpha * 0.9 });
  }
  clouds.eventMode = "none";
  props.addChild(clouds);

  const catColor = isZombie ? 0x2a2020 : 0x3a2a22;
  const catEye = isZombie ? 0xff2222 : 0xffcc66;
  const cat = new Graphics();
  const catX = worldW * 0.88;
  const catY = horizonY + 95;
  cat.roundRect(-22, -16, 44, 32, 10).fill({ color: catColor, alpha: 0.95 });
  cat.circle(-8, -4, 3).fill({ color: catEye, alpha: 0.9 });
  cat.circle(8, -4, 3).fill({ color: catEye, alpha: 0.9 });
  cat.x = catX;
  cat.y = catY;
  cat.eventMode = "none";
  cat.zIndex = 0;
  actors.addChild(cat);

  const birdRoot = new Container();
  birdRoot.zIndex = 5;
  birdRoot.eventMode = "none";
  const birdColor = isZombie ? 0x220011 : isNight ? 0x1a2030 : 0x2a2a2a;
  const birdData: { g: Graphics; speed: number; y: number; phase: number }[] = [];
  for (let b = 0; b < 4; b++) {
    const g = new Graphics();
    g.poly([0, 0, -10, 4, -6, -3]).fill({ color: birdColor, alpha: 0.88 });
    g.x = (worldW * 0.12 * b + b * 180) % (worldW - 80);
    g.y = horizonY * (0.12 + (b % 3) * 0.08);
    birdRoot.addChild(g);
    birdData.push({ g, speed: 0.35 + b * 0.08, y: g.y, phase: b * 1.7 });
  }
  actors.addChild(birdRoot);
  actors.sortChildren();

  if (ambientTicker) {
    app.ticker.remove(ambientTicker);
    ambientTicker = null;
  }

  const reduced = prefersReducedMotion();
  if (!reduced) {
    ambientTicker = () => {
      for (const b of birdData) {
        b.g.x += b.speed;
        if (b.g.x > worldW + 20) b.g.x = -24;
        b.g.y = b.y + Math.sin(performance.now() * 0.0012 + b.phase) * 4;
      }
    };
    app.ticker.add(ambientTicker);
  }
}

function drawFromSheet(ctx: AmbientSyncContext, sheet: Spritesheet): boolean {
  const { pixi, worldRoot, app, worldW, worldH, environmentMode } = ctx;
  const { Sprite, AnimatedSprite } = pixi;
  const horizonY = worldH * HORIZON_RATIO;
  const ground = layer(worldRoot, "layer_groundTiles");
  const props = layer(worldRoot, "layer_propsStatic");
  const actors = layer(worldRoot, "layer_actors");
  if (!ground || !props || !actors) return false;

  const usableKeys = frameKeysMatching(sheet, /grass|cloud|bird|cat/i);
  if (usableKeys.length === 0) {
    try {
      sheet.destroy(true);
    } catch {
      /* noop */
    }
    drawProcedural(ctx);
    return false;
  }

  if (ambientTicker) {
    app.ticker.remove(ambientTicker);
    ambientTicker = null;
  }

  ground.removeChildren();
  props.removeChildren();
  actors.removeChildren();

  const tint =
    environmentMode === "zombie" ? 0xffaaaa : environmentMode === "night" ? 0xb0b8c8 : 0xffffff;

  const grassKeys = frameKeysMatching(sheet, /grass/i);
  for (let i = 0; i < Math.min(grassKeys.length, 24); i++) {
    const k = grassKeys[i]!;
    const t = sheet.textures[k] as Texture;
    const s = new Sprite(t);
    s.x = 20 + ((i * 73) % (worldW - 40));
    s.y = horizonY + 10 + (i % 4) * 6;
    s.anchor.set(0.5, 1);
    s.tint = tint;
    s.eventMode = "none";
    ground.addChild(s);
  }

  const cloudKeys = frameKeysMatching(sheet, /cloud/i);
  const cloudPos = [
    { x: worldW * 0.2, y: horizonY * 0.25 },
    { x: worldW * 0.55, y: horizonY * 0.2 },
    { x: worldW * 0.78, y: horizonY * 0.3 },
  ];
  for (let i = 0; i < Math.min(cloudKeys.length, cloudPos.length); i++) {
    const k = cloudKeys[i]!;
    const t = sheet.textures[k] as Texture;
    const s = new Sprite(t);
    s.position.set(cloudPos[i]!.x, cloudPos[i]!.y);
    s.anchor.set(0.5, 0.5);
    s.alpha = environmentMode === "night" ? 0.55 : 0.85;
    s.tint = tint;
    s.eventMode = "none";
    props.addChild(s);
  }

  const birdAnimName = sheet.animations
    ? Object.keys(sheet.animations).find((n) => /bird/i.test(n))
    : undefined;
  const birdFrames =
    birdAnimName && sheet.animations
      ? (sheet.animations as Record<string, Texture[]>)[birdAnimName]
      : null;

  if (birdFrames && birdFrames.length > 0 && !prefersReducedMotion()) {
    const as = new AnimatedSprite(birdFrames);
    as.animationSpeed = 0.12;
    as.position.set(worldW * 0.3, horizonY * 0.2);
    as.anchor.set(0.5, 0.5);
    as.tint = tint;
    as.eventMode = "none";
    as.play();
    actors.addChild(as);
    ambientTicker = () => {
      as.x += 0.45;
      if (as.x > worldW + 40) as.x = -40;
      as.y = horizonY * 0.2 + Math.sin(performance.now() * 0.001 + 1) * 5;
    };
    app.ticker.add(ambientTicker);
  } else {
    const birdKeys = frameKeysMatching(sheet, /bird/i);
    if (birdKeys.length > 0) {
      const t = sheet.textures[birdKeys[0]!] as Texture;
      const s = new Sprite(t);
      s.position.set(worldW * 0.35, horizonY * 0.22);
      s.anchor.set(0.5, 0.5);
      s.tint = tint;
      s.eventMode = "none";
      actors.addChild(s);
    }
  }

  const catKeys = frameKeysMatching(sheet, /cat/i);
  if (catKeys.length > 0) {
    const t = sheet.textures[catKeys[0]!] as Texture;
    const s = new Sprite(t);
    s.position.set(worldW * 0.88, horizonY + 85);
    s.anchor.set(0.5, 1);
    s.tint = tint;
    s.eventMode = "none";
    actors.addChild(s);
  }

  actors.sortChildren();
  return true;
}

/**
 * Fills `layer_groundTiles`, `layer_propsStatic`, and `layer_actors` with ambient decoration.
 * When `sheetOverride` is omitted, reuses the last loaded Aseprite sheet if any.
 */
export function syncAmbientArt(ctx: AmbientSyncContext, sheetOverride?: Spritesheet | null): void {
  const sheet = sheetOverride !== undefined ? sheetOverride : activeSheet;
  if (sheet) {
    if (activeSheet && activeSheet !== sheet) {
      try {
        activeSheet.destroy(true);
      } catch {
        /* noop */
      }
    }
    activeSheet = sheet;
    const ok = drawFromSheet(ctx, sheet);
    if (!ok) activeSheet = null;
    return;
  }
  if (activeSheet) {
    try {
      activeSheet.destroy(true);
    } catch {
      /* noop */
    }
    activeSheet = null;
  }
  drawProcedural(ctx);
}

export function scheduleAmbientSheetLoad(
  gen: number,
  pixi: typeof import("pixi.js"),
  getCtx: () => AmbientSyncContext,
): void {
  void tryLoadAmbientSpritesheet(pixi).then((sheet) => {
    if (!sheet || isAmbientMountStale(gen)) {
      sheet?.destroy(true);
      return;
    }
    syncAmbientArt(getCtx(), sheet);
  });
}
