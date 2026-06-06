import { useGardenStore } from "./store/useGardenStore";

export default function App() {
  const environmentMode = useGardenStore((s) => s.environmentMode);
  const setEnvironmentMode = useGardenStore((s) => s.setEnvironmentMode);

  return (
    <div id="app-shell" data-theme={environmentMode} className="min-h-dvh font-pixel text-ui-text">
      <a
        href="#recruiter-panel"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-ui-bg focus:px-3 focus:py-2"
      >
        Skip to recruiter overview
      </a>
      <main className="flex min-h-dvh flex-col">
        <header className="border-b border-ui-text/20 bg-ui-bg/80 px-4 py-3 backdrop-blur-sm">
          <p className="font-body text-sm text-ui-text/90">
            Scaffold: HUD, Pixi garden, and overlays land in later phases — see{" "}
            <code className="rounded bg-ui-text/10 px-1 font-mono text-xs">.docs/IMPLEMENTATION_PLAN.md</code>.
          </p>
        </header>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
          <h1 className="font-pixel max-w-lg text-center text-[10px] leading-relaxed sm:text-xs">
            The Pixel Garden
          </h1>
          <p className="font-body max-w-md text-center text-sm text-ui-text/85">
            React + Vite + Tailwind v4 + Zustand + Zod content validation (dev) are wired. Toggle
            mode to preview <code className="font-mono">data-theme</code> tokens.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {(["day", "night", "zombie"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                className="rounded border-2 border-ui-text/30 bg-ui-bg px-3 py-2 text-[8px] uppercase tracking-wide text-ui-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                onClick={() => setEnvironmentMode(mode)}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
