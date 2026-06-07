import type { LandingAvatarId } from "../../types";

/** Craftpix-style horizontal strips: frame height 128px, frame width = sheetWidth / frameCount. */

export const AVATAR_FRAME_PX = 128;

export type LandingAvatarDef = {
  id: LandingAvatarId;
  label: string;
  idle: { src: string; sheetWidth: number };
  walk: { src: string; sheetWidth: number };
};

export const LANDING_AVATARS: readonly LandingAvatarDef[] = [
  {
    id: "swordsman",
    label: "Swordsman",
    idle: { src: "/avatar/Swordsman/Idle.png", sheetWidth: 1024 },
    walk: { src: "/avatar/Swordsman/Walk.png", sheetWidth: 1024 },
  },
  {
    id: "archer",
    label: "Archer",
    idle: { src: "/avatar/Archer/Idle.png", sheetWidth: 768 },
    walk: { src: "/avatar/Archer/Walk.png", sheetWidth: 1024 },
  },
  {
    id: "wizard",
    label: "Wizard",
    idle: { src: "/avatar/Wizard/Idle.png", sheetWidth: 768 },
    walk: { src: "/avatar/Wizard/Walk.png", sheetWidth: 896 },
  },
] as const;

export function getLandingAvatarDef(id: LandingAvatarId): LandingAvatarDef {
  const def = LANDING_AVATARS.find((a) => a.id === id);
  if (!def) return LANDING_AVATARS[0]!;
  return def;
}
