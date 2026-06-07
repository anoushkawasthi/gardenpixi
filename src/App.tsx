"use client";

import { useCallback } from "react";
import { useSyncDocumentTheme } from "./hooks/useSyncDocumentTheme";
import { useEscapeKey } from "./hooks/useEscapeKey";
import "./content/projectsList";
import { GardenCanvas } from "./components/garden/GardenCanvas";
import { Hud } from "./components/hud/Hud";
import { Landing } from "./components/landing/Landing";
import { ModalLayer } from "./components/modals/ModalLayer";
import { TerminalPanel } from "./components/terminal/TerminalPanel";
import { selectActiveModal, selectCamera, selectCottageInteriorActive, selectSitePhase } from "./store/selectors";
import { useGardenStore } from "./store/useGardenStore";

export default function App() {
  useSyncDocumentTheme();

  const sitePhase = useGardenStore(selectSitePhase);
  const camera = useGardenStore(selectCamera);
  const enterZombie = useGardenStore((s) => s.enterZombie);
  const cottageInterior = useGardenStore(selectCottageInteriorActive);
  const activeModal = useGardenStore(selectActiveModal);
  const closeCottageInterior = useGardenStore((s) => s.closeCottageInterior);

  const onEscapeCottage = useCallback(() => {
    closeCottageInterior();
  }, [closeCottageInterior]);

  useEscapeKey(cottageInterior && activeModal === "none", onEscapeCottage);

  if (sitePhase === "landing") {
    return (
      <div id="app-shell" className="min-h-dvh">
        <Landing />
      </div>
    );
  }

  return (
    <div id="app-shell" className="flex min-h-dvh flex-col pb-[5.5rem] pt-[5.25rem] md:pb-0 md:pt-[5.5rem]">
      <div className="zombie-fx-vignette" aria-hidden />
      <div className="zombie-fx-scanlines" aria-hidden />
      <div className="zombie-fx-glitch" aria-hidden />
      <Hud />
      <ModalLayer />
      <TerminalPanel />

      {cottageInterior && activeModal === "none" && (
        <div className="font-pixel pointer-events-auto fixed left-1/2 top-[4.75rem] z-[45] -translate-x-1/2 md:top-[5.25rem]">
          <button
            type="button"
            onClick={() => closeCottageInterior()}
            className="min-h-[44px] rounded border-2 border-ui-text/35 bg-ui-bg/95 px-4 py-2 text-[8px] uppercase tracking-wide text-ui-text shadow-md backdrop-blur-sm hover:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:text-[9px]"
          >
            ← Leave cottage
          </button>
        </div>
      )}

      <a
        href="#recruiter-panel"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-20 focus:z-50 focus:rounded focus:bg-ui-bg focus:px-3 focus:py-2 focus:font-pixel focus:text-[10px] focus:text-ui-text md:focus:top-24"
      >
        Skip to recruiter overview
      </a>

      <main id="main" className="flex min-h-0 flex-1 flex-col gap-3 p-4 md:gap-4 md:p-6">
        <GardenCanvas />

        <div className="flex shrink-0 flex-col items-center gap-3 text-center md:flex-row md:flex-wrap md:justify-center md:gap-4">
          <h1 className="font-pixel text-[9px] leading-relaxed sm:text-xs">The Pixel Garden</h1>
          <p className="font-body max-w-md text-xs text-ui-text/85 md:text-sm">
            Phase 7–13: cottage, terminal, contact, recruiter + resume, day/night/zombie, ambient + optional curated hub sprites, ship checklist. Plausible:{" "}
            <code className="rounded bg-ui-text/10 px-1">section_visit</code>,{" "}
            <code className="rounded bg-ui-text/10 px-1">resume_download</code>,{" "}
            <code className="rounded bg-ui-text/10 px-1">contact_submit</code> /{" "}
            <code className="rounded bg-ui-text/10 px-1">contact_error</code>,{" "}
            <code className="rounded bg-ui-text/10 px-1">recruiter_mode_open</code>,{" "}
            <code className="rounded bg-ui-text/10 px-1">zombie_mode_enter</code> /{" "}
            <code className="rounded bg-ui-text/10 px-1">zombie_mode_exit</code>.
          </p>
          <p className="font-terminal max-w-md rounded border border-ui-text/25 bg-ui-bg/90 px-3 py-2 text-sm leading-snug text-ui-text shadow-sm md:text-base">
            Camera:{" "}
            <span className="whitespace-nowrap">
              cx={camera.cx.toFixed(0)} cy={camera.cy.toFixed(0)} zoom={camera.zoom.toFixed(2)}
            </span>
          </p>
          {process.env.NODE_ENV === "development" && (
            <button
              type="button"
              className="font-body rounded border border-dashed border-ui-text/40 px-3 py-1 text-xs text-ui-text/70 hover:bg-ui-text/5"
              onClick={() => enterZombie({ source: "dev" })}
            >
              Dev: enter Zombie Mode (test HUD exit)
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
