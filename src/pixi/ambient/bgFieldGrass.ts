import type { Container, Texture } from "pixi.js";
import type { EnvironmentMode } from "../../types";

const HORIZON_RATIO = 0.42;

/** URL-encoded paths — folders under `public/Bg` contain spaces. */
const TILE_URLS = [
  "01",
  "02",
  "04",
  "06",
  "07",
  "09",
  "10",
  "12",
  "13",
  "14",
  "15",
  "16",
  "18",
  "20",
  "21",
  "24",
  "25",
  "29",
  "30",
  "35",
  "39",
  "40",
  "41",
  "47",
  "50",
  "54",
  "57",
  "61",
].map((n) => `/Bg/1%20Tiles/FieldsTile_${n}.png`);

const GRASS_OBJECT_URLS = [2, 3, 4, 5, 6].map((n) => `/Bg/2%20Objects/5%20Grass/${n}.png`);

export type BgGrassPaintContext = {
  pixi: typeof import("pixi.js");
  worldRoot: Container;
  worldW: number;
  worldH: number;
  environmentMode: EnvironmentMode;
};

type BgPack = { tiles: Texture[]; clumps: Texture[] };

let bgPack: BgPack | null = null;
let inflightLoad: Promise<boolean> | null = null;

function layer(worldRoot: Container, id: string): Container | null {
  const c = worldRoot.children.find((ch: { label?: string }) => ch.label === id);
  return (c ?? null) as Container | null;
}

export function hasBgFieldPack(): boolean {
  return bgPack !== null && bgPack.tiles.length > 0;
}

/**
 * Loads Craftpix-style field tiles + grass clump objects from `public/Bg/`.
 * Safe to call multiple times; subsequent calls resolve to the cached pack.
 */
export async function tryLoadBgFieldPack(pixi: typeof import("pixi.js")): Promise<boolean> {
  if (bgPack) return true;
  if (!inflightLoad) {
    inflightLoad = (async () => {
      const { Assets } = pixi;
      const tiles: Texture[] = [];
      const clumps: Texture[] = [];
      try {
        for (const url of TILE_URLS) {
          tiles.push(await Assets.load<Texture>(url));
        }
        for (const url of GRASS_OBJECT_URLS) {
          clumps.push(await Assets.load<Texture>(url));
        }
        if (tiles.length === 0 || clumps.length === 0) {
          for (const t of tiles) {
            try {
              t.destroy(true);
            } catch {
              /* noop */
            }
          }
          for (const t of clumps) {
            try {
              t.destroy(true);
            } catch {
              /* noop */
            }
          }
          return false;
        }
        bgPack = { tiles, clumps };
        return true;
      } catch {
        for (const t of tiles) {
          try {
            t.destroy(true);
          } catch {
            /* noop */
          }
        }
        for (const t of clumps) {
          try {
            t.destroy(true);
          } catch {
            /* noop */
          }
        }
        return false;
      } finally {
        inflightLoad = null;
      }
    })();
  }
  return inflightLoad;
}

/** Release GPU memory for `/Bg` textures (e.g. on garden unmount). */
export function resetBgFieldPack(): void {
  if (!bgPack) return;
  for (const t of bgPack.tiles) {
    try {
      t.destroy(true);
    } catch {
      /* noop */
    }
  }
  for (const t of bgPack.clumps) {
    try {
      t.destroy(true);
    } catch {
      /* noop */
    }
  }
  bgPack = null;
}

/**
 * Paints `layer_groundTiles` with a tile grid + scattered grass objects from `/Bg`.
 * Caller must clear the layer first (e.g. with other ambient layers).
 */
export function paintBgFieldGround(ctx: BgGrassPaintContext): boolean {
  const pack = bgPack;
  if (!pack) return false;

  const { pixi, worldRoot, worldW, worldH, environmentMode } = ctx;
  const { Sprite } = pixi;
  const horizonY = worldH * HORIZON_RATIO;
  const ground = layer(worldRoot, "layer_groundTiles");
  if (!ground) return false;

  const { tiles, clumps } = pack;
  const tw0 = Math.max(1, Math.floor(tiles[0]!.width));
  const th0 = Math.max(1, Math.floor(tiles[0]!.height));

  const tint =
    environmentMode === "zombie" ? 0xc8b0a8 : environmentMode === "night" ? 0x9aab9a : 0xffffff;

  let tilePick = 0;
  const y0 = Math.floor(horizonY / th0) * th0;
  for (let y = y0; y < worldH; y += th0) {
    for (let x = 0; x < worldW; x += tw0) {
      const tex = tiles[tilePick % tiles.length]!;
      tilePick++;
      const s = new Sprite(tex);
      s.position.set(x, y);
      s.tint = tint;
      s.eventMode = "none";
      ground.addChild(s);
    }
  }

  const groundH = worldH - horizonY;
  const clumpCount = Math.min(48, Math.max(24, Math.floor(groundH / 14)));
  for (let i = 0; i < clumpCount; i++) {
    const tex = clumps[i % clumps.length]!;
    const s = new Sprite(tex);
    s.anchor.set(0.5, 1);
    s.x = 20 + ((i * 127 + i * i * 3) % (worldW - 40));
    s.y = horizonY + 10 + ((i * 83) % Math.max(8, groundH - 8));
    s.tint = tint;
    s.alpha = 0.94;
    s.eventMode = "none";
    ground.addChild(s);
  }

  return true;
}
