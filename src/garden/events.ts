/** TRD §8.1 — DOM bridge from Pixi → React. */
export const GARDEN_PLANT_CLICK_EVENT = "garden:plantClick" as const;

export type GardenPlantClickDetail = {
  projectId: string;
};

/** Phase 6 — successful water gesture (no project modal). */
export const GARDEN_WATER_SUCCESS_EVENT = "garden:waterSuccess" as const;

export type GardenWaterSuccessDetail = {
  projectId: string;
};

/** Phase 7 — cottage door / interior props (PRD §9.4). */
export const GARDEN_COTTAGE_HOTSPOT_EVENT = "garden:cottageHotspot" as const;

export type CottageHotspotKind = "door" | "desk" | "bookshelf" | "window";

export type GardenCottageHotspotDetail = {
  kind: CottageHotspotKind;
};
