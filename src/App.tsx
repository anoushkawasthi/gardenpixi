"use client";

import { useSyncDocumentTheme } from "./hooks/useSyncDocumentTheme";
import "./content/projectsList";
import { Hud } from "./components/hud/Hud";
import { Landing } from "./components/landing/Landing";
import { ModalLayer } from "./components/modals/ModalLayer";
import { TerminalPanel } from "./components/terminal/TerminalPanel";
import { selectSitePhase } from "./store/selectors";
import { useGardenStore } from "./store/useGardenStore";

export default function App() {
  useSyncDocumentTheme();

  const sitePhase = useGardenStore(selectSitePhase);

  if (sitePhase === "landing") {
    return (
      <div id="app-shell" className="min-h-dvh">
        <Landing />
      </div>
    );
  }

  return (
    <div id="app-shell" className="relative min-h-dvh w-full overflow-x-hidden bg-ui-bg">
      <Hud />
      <ModalLayer />
      <TerminalPanel />

      <main id="main" className="min-h-dvh w-full md:pt-[5.5rem]" aria-label="Garden" />
    </div>
  );
}
