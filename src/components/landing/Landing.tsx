import { useCallback, useEffect, useRef, useState } from "react";
import { LANDING_DIALOGUE, LANDING_TYPEWRITER_MS } from "../../content/landingCopy";
import { useGardenStore } from "../../store/useGardenStore";

type LandingUiPhase = "fonts" | "typing" | "complete";

export function Landing() {
  const enterGarden = useGardenStore((s) => s.enterGarden);
  const rootRef = useRef<HTMLElement>(null);

  const [uiPhase, setUiPhase] = useState<LandingUiPhase>("fonts");
  const [visibleLen, setVisibleLen] = useState(0);
  const skipPendingRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fullLen = LANDING_DIALOGUE.length;
  const isTyping = uiPhase === "typing" && visibleLen < fullLen;
  const dialogueComplete = visibleLen >= fullLen && uiPhase === "complete";

  const clearTick = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const finishTyping = useCallback(() => {
    clearTick();
    setVisibleLen(fullLen);
    setUiPhase("complete");
  }, [clearTick, fullLen]);

  useEffect(() => {
    rootRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      await document.fonts.ready;
      if (cancelled) return;

      if (skipPendingRef.current) {
        setVisibleLen(fullLen);
        setUiPhase("complete");
        return;
      }

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setVisibleLen(fullLen);
        setUiPhase("complete");
        return;
      }

      setUiPhase("typing");
      intervalRef.current = setInterval(() => {
        setVisibleLen((prev) => {
          if (prev >= fullLen) return prev;
          return prev + 1;
        });
      }, LANDING_TYPEWRITER_MS);
    })();

    return () => {
      cancelled = true;
      clearTick();
    };
  }, [clearTick, fullLen]);

  useEffect(() => {
    if (uiPhase !== "typing") return;
    if (visibleLen < fullLen) return;
    clearTick();
    setUiPhase("complete");
  }, [uiPhase, visibleLen, fullLen, clearTick]);

  const trySkip = useCallback(() => {
    if (uiPhase === "fonts") {
      skipPendingRef.current = true;
      return;
    }
    if (uiPhase === "typing" && visibleLen < fullLen) {
      finishTyping();
    }
  }, [finishTyping, fullLen, uiPhase, visibleLen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== " " && e.key !== "Enter") return;
      const t = e.target;
      if (t instanceof HTMLButtonElement || t instanceof HTMLAnchorElement) return;
      e.preventDefault();
      trySkip();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [trySkip]);

  const displayed = LANDING_DIALOGUE.slice(0, visibleLen);

  return (
    <main
      id="main"
      ref={rootRef}
      className="relative flex min-h-dvh flex-col bg-sky outline-none"
      tabIndex={0}
      aria-label="Welcome — press Space or Enter to skip the typewriter"
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        trySkip();
      }}
    >
      {/* Scene placeholder — PRD §9.1 exterior; TRD gate anim later */}
      <div className="pointer-events-none flex flex-1 flex-col items-center justify-center gap-6 px-4 pt-8">
        <div
          className="font-pixel flex h-28 w-24 flex-col items-center justify-end rounded border-4 border-ui-text/40 bg-ui-bg/30 text-[6px] text-ui-text/80 shadow-md sm:h-32 sm:w-28 sm:text-[7px]"
          aria-hidden
        >
          <span className="mb-1 px-1 text-center leading-tight">Gate</span>
          <div className="mb-2 h-10 w-14 rounded-sm border-2 border-dashed border-ui-text/35 bg-ground/40 sm:h-12 sm:w-16" />
          <span className="mb-2 text-[5px] opacity-70">6 frames →</span>
        </div>
        <p className="font-pixel pointer-events-none max-w-sm text-center text-[6px] leading-relaxed text-ui-text/75 sm:text-[7px]">
          Path · fence · avatar placeholder
        </p>
      </div>

      {/* RPG dialogue — PRD §9.1 */}
      <div className="relative z-10 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div
          className="font-pixel mx-auto max-w-2xl border-4 border-ui-text/35 bg-ui-bg/95 p-4 text-[8px] leading-relaxed text-ui-text shadow-[4px_4px_0_rgba(0,0,0,0.12)] sm:text-[9px] sm:leading-relaxed"
          role="dialog"
          aria-modal="false"
          aria-labelledby="landing-dialogue"
        >
          <p id="landing-dialogue" className="min-h-[4.5rem] whitespace-pre-wrap sm:min-h-[5rem]">
            {uiPhase === "fonts" ? (
              <span className="text-ui-text/60">Loading fonts…</span>
            ) : (
              <>
                {displayed}
                {isTyping && (
                  <span className="animate-pulse text-accent" aria-hidden>
                    ▍
                  </span>
                )}
              </>
            )}
          </p>

          {isTyping && (
            <p className="font-body mt-2 text-[10px] text-ui-text/60">Tap anywhere to skip</p>
          )}

          {dialogueComplete && (
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                className="font-pixel pointer-events-auto min-h-[44px] cursor-pointer rounded border-4 border-ui-text/40 bg-accent/20 px-4 py-3 text-[8px] uppercase tracking-wide text-ui-text shadow-[3px_3px_0_rgba(0,0,0,0.15)] transition-transform hover:translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:translate-y-px sm:text-[9px]"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  enterGarden();
                }}
                onKeyDown={(e) => {
                  if (e.key !== "Enter" && e.key !== " ") return;
                  e.preventDefault();
                  e.stopPropagation();
                  enterGarden();
                }}
              >
                [ Enter Garden ]
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
