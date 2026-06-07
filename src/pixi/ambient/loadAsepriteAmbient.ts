import type { Spritesheet, SpritesheetData } from "pixi.js";

/**
 * Generic Aseprite hash JSON + `meta.image` next to it under `public/` (Phase 12–13).
 */
export async function tryLoadAsepritesheetFromPublic(
  pixi: typeof import("pixi.js"),
  basePath: string,
  jsonFileName: string,
): Promise<Spritesheet | null> {
  const root = basePath.replace(/\/$/, "");
  const jsonUrl = `${root}/${jsonFileName}`;
  try {
    const res = await fetch(jsonUrl);
    if (!res.ok) return null;
    const data = (await res.json()) as SpritesheetData;
    const imageName = data?.meta?.image;
    if (typeof imageName !== "string" || !data.frames || typeof data.frames !== "object") {
      return null;
    }
    const safeName = imageName.includes("/") ? imageName.split("/").pop()! : imageName;
    const imageUrl = `${root}/${safeName}`;
    const baseTexture = await pixi.Assets.load(imageUrl);
    const sheet = new pixi.Spritesheet(baseTexture, data);
    await sheet.parse();
    return sheet;
  } catch {
    return null;
  }
}

/**
 * Optional hub ambient sheet (Phase 12).
 * Drop `public/sprites/ambient/ambient.json` + image named in `meta.image` (Aseprite JSON hash export).
 */
export async function tryLoadAmbientSpritesheet(
  pixi: typeof import("pixi.js"),
  basePath = "/sprites/ambient",
): Promise<Spritesheet | null> {
  return tryLoadAsepritesheetFromPublic(pixi, basePath, "ambient.json");
}

/** Curated hub characters / props (Phase 13) — try `characters` first, then `components`. */
export async function tryLoadHubDecorSpritesheet(pixi: typeof import("pixi.js")): Promise<Spritesheet | null> {
  const fromChars = await tryLoadAsepritesheetFromPublic(pixi, "/sprites/characters", "hub.json");
  if (fromChars) return fromChars;
  return tryLoadAsepritesheetFromPublic(pixi, "/sprites/components", "hub.json");
}
