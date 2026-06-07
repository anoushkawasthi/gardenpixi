import type { EnvironmentMode } from "../../types";
import type { Container, Spritesheet, Texture } from "pixi.js";
import { isAmbientMountStale } from "../ambient/syncAmbientArt";
import { tryLoadHubDecorSpritesheet } from "../ambient/loadAsepriteAmbient";

const HORIZON_RATIO = 0.42;

function layer(worldRoot: Container, id: string): Container | null {
  const c = worldRoot.children.find((ch: { label?: string }) => ch.label === id);
  return (c ?? null) as Container | null;
}

function keysMatching(sheet: Spritesheet, re: RegExp): string[] {
  return Object.keys(sheet.textures).filter((k) => re.test(k));
}

let activeHubSheet: Spritesheet | null = null;

export type HubDecorSyncContext = {
  pixi: typeof import("pixi.js");
  worldRoot: Container;
  worldW: number;
  worldH: number;
  environmentMode: EnvironmentMode;
};

export function resetHubDecor(worldRoot: Container | null): void {
  if (worldRoot) {
    const L = layer(worldRoot, "layer_hubDecor");
    L?.removeChildren();
  }
  if (activeHubSheet) {
    try {
      activeHubSheet.destroy(true);
    } catch {
      /* noop */
    }
  }
  activeHubSheet = null;
}

function drawHubDecorFromSheet(ctx: HubDecorSyncContext, sheet: Spritesheet): boolean {
  const { pixi, worldRoot, worldW, worldH, environmentMode } = ctx;
  const { Sprite } = pixi;
  const decor = layer(worldRoot, "layer_hubDecor");
  if (!decor) return false;

  decor.removeChildren();

  const all = keysMatching(sheet, /char|avatar|npc|gate|prop|component|deco|item|fence|path/i);
  if (all.length === 0) {
    try {
      sheet.destroy(true);
    } catch {
      /* noop */
    }
    return false;
  }

  const horizonY = worldH * HORIZON_RATIO;
  const tint =
    environmentMode === "zombie" ? 0xffbbbb : environmentMode === "night" ? 0xc8d0e0 : 0xffffff;

  const gateKeys = keysMatching(sheet, /gate/i);
  for (let i = 0; i < gateKeys.length; i++) {
    const t = sheet.textures[gateKeys[i]!] as Texture;
    const s = new Sprite(t);
    s.position.set(worldW * 0.48 + i * 8, horizonY + 28);
    s.anchor.set(0.5, 1);
    s.tint = tint;
    s.eventMode = "none";
    decor.addChild(s);
  }

  const charKeys = keysMatching(sheet, /char|avatar|npc/i);
  for (let i = 0; i < charKeys.length; i++) {
    const t = sheet.textures[charKeys[i]!] as Texture;
    const s = new Sprite(t);
    s.position.set(160 + i * 70, horizonY + 105);
    s.anchor.set(0.5, 1);
    s.tint = tint;
    s.eventMode = "none";
    decor.addChild(s);
  }

  const propKeys = keysMatching(sheet, /prop|component|deco|item|fence|path/i).filter(
    (k) => !/gate|char|avatar|npc/i.test(k),
  );
  let pi = 0;
  for (const k of propKeys) {
    const t = sheet.textures[k] as Texture;
    const s = new Sprite(t);
    const x = 360 + (pi * 79) % (worldW - 420);
    const y = horizonY + 35 + (pi % 4) * 42;
    s.position.set(x, y);
    s.anchor.set(0.5, 1);
    s.tint = tint;
    s.eventMode = "none";
    decor.addChild(s);
    pi += 1;
  }

  return true;
}

/**
 * Optional curated hub sprites (`hub.json` under characters or components).
 * When `sheetOverride` is omitted, re-applies the last loaded sheet if any.
 */
export function syncHubDecor(ctx: HubDecorSyncContext, sheetOverride?: Spritesheet | null): void {
  const sheet = sheetOverride !== undefined ? sheetOverride : activeHubSheet;
  if (sheet) {
    if (activeHubSheet && activeHubSheet !== sheet) {
      try {
        activeHubSheet.destroy(true);
      } catch {
        /* noop */
      }
    }
    activeHubSheet = sheet;
    const ok = drawHubDecorFromSheet(ctx, sheet);
    if (!ok) activeHubSheet = null;
    return;
  }
  if (activeHubSheet) {
    try {
      activeHubSheet.destroy(true);
    } catch {
      /* noop */
    }
    activeHubSheet = null;
  }
  resetHubDecor(ctx.worldRoot);
}

export function scheduleHubDecorSheetLoad(
  gen: number,
  pixi: typeof import("pixi.js"),
  getCtx: () => HubDecorSyncContext,
): void {
  void tryLoadHubDecorSpritesheet(pixi).then((sheet) => {
    if (!sheet || isAmbientMountStale(gen)) {
      sheet?.destroy(true);
      return;
    }
    syncHubDecor(getCtx(), sheet);
  });
}
