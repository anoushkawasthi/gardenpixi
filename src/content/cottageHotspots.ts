/**
 * World-space hit targets (1200×700) for Phase 7 cottage — tune when cottage art is final.
 * Door: exterior view. Desk / bookshelf / window: interior (cottageDoor zoom).
 */

export const COTTAGE_DOOR_HOTSPOT = { x: 575, y: 158, w: 52, h: 68 } as const;

export const COTTAGE_INTERIOR_HOTSPOTS = {
  desk: { x: 430, y: 360, w: 120, h: 88 },
  bookshelf: { x: 700, y: 320, w: 96, h: 120 },
  window: { x: 548, y: 248, w: 104, h: 72 },
} as const;
