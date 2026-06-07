/**
 * Plausible custom events (TRD §11.2). No-op until `window.plausible` exists (embed via `src/app/layout.tsx` or dashboard).
 */
declare global {
  interface Window {
    plausible?: (
      eventName: string,
      options?: { props?: Record<string, unknown> },
    ) => void;
  }
}

export function trackProjectOpen(projectId: string): void {
  try {
    window.plausible?.("project_open", { props: { projectId } });
  } catch {
    /* noop */
  }
}

export function trackWaterPlant(projectId: string): void {
  try {
    window.plausible?.("water_plant", { props: { projectId } });
  } catch {
    /* noop */
  }
}

/** TRD §11.2 — cottage / section discovery (Phase 7). */
export function trackSectionVisit(section: string): void {
  try {
    window.plausible?.("section_visit", { props: { section } });
  } catch {
    /* noop */
  }
}

/** TRD §11.2 — resume download from terminal or HUD (Phase 8). */
export function trackResumeDownload(): void {
  try {
    window.plausible?.("resume_download", {});
  } catch {
    /* noop */
  }
}

/** TRD §11.2 — contact form (Phase 9). */
export function trackContactSubmit(): void {
  try {
    window.plausible?.("contact_submit", {});
  } catch {
    /* noop */
  }
}

export function trackContactError(props?: { reason?: string }): void {
  try {
    const p = props?.reason ? { reason: String(props.reason) } : {};
    window.plausible?.("contact_error", { props: p });
  } catch {
    /* noop */
  }
}

/** TRD §11.2 — zombie mode (Phase 11). */
export function trackZombieModeEnter(props: { source: string }): void {
  try {
    window.plausible?.("zombie_mode_enter", { props: { source: String(props.source) } });
  } catch {
    /* noop */
  }
}

export function trackZombieModeExit(): void {
  try {
    window.plausible?.("zombie_mode_exit", {});
  } catch {
    /* noop */
  }
}

/** TRD §11.2 — recruiter overview modal (Phase 10). */
export function trackRecruiterModeOpen(): void {
  try {
    window.plausible?.("recruiter_mode_open", {});
  } catch {
    /* noop */
  }
}
