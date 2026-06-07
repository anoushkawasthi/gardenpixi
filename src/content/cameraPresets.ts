/**
 * Camera focal points in world space (1200×700). Tune when art is final (TRD §4.4).
 */
export type CameraPresetId =
  | "hub"
  | "projects"
  | "cottage"
  | "cottageDoor"
  | "terminal"
  | "mailbox";

export type CameraPreset = { cx: number; cy: number; zoom: number };

export const cameraPresets: Record<CameraPresetId, CameraPreset> = {
  hub: { cx: 600, cy: 350, zoom: 1 },
  /** Project garden — central beds (tune with final art, TRD world 1200×700). */
  projects: { cx: 600, cy: 400, zoom: 1 },
  cottage: { cx: 600, cy: 120, zoom: 1 },
  cottageDoor: { cx: 600, cy: 140, zoom: 1.35 },
  terminal: { cx: 200, cy: 400, zoom: 1 },
  mailbox: { cx: 1050, cy: 400, zoom: 1 },
};
