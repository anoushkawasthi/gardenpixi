/** Runtime domain types — mirror TRD §15 and Zustand slices. */

export type CameraTransitionLevel = 1 | 2 | 3;

export type SectionId = "landing" | "hub" | "cottage" | "projects" | "terminal" | "contact";

/** App shell: title screen vs garden (Phase 1 / PRD §9.1). */
export type SitePhase = "landing" | "hub";

export type ModalId =
  | "none"
  | "recruiter"
  | "contact"
  | "resume"
  | "projectDetail"
  | "cottageDesk"
  | "cottageBookshelf"
  | "cottageWindow";

/** Phase 7 — cottage exterior vs door zoom interior (PRD §9.4). */
export type CottageUiPhase = "off" | "door_exterior" | "interior";

export type EnvironmentMode = "day" | "night" | "zombie";

export type CameraState = {
  cx: number;
  cy: number;
  zoom: number;
  transitionLevel: CameraTransitionLevel;
  isAnimating: boolean;
};
