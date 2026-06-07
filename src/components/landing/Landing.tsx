import { useCallback, useEffect, useRef, useState } from "react";
import { LANDING_DIALOGUE, LANDING_TYPEWRITER_MS } from "../../content/landingCopy";
import { useGardenStore } from "../../store/useGardenStore";
import { LandingAvatarSection } from "./LandingAvatars";

type LandingUiPhase = "fonts" | "typing" | "complete";

const LANDING_BG_DEFAULT = "/asset/stitch_anoushka_s_digital_garden/screen.png";
/** Folder name includes space + parentheses — encode for URL. */
const LANDING_BG_ALT = "/asset/stitch_anoushka_s_digital_garden%20(1)/screen.png";

type BgVariant = "default" | "alt";

export function Landing() {
  const enterGarden = useGardenStore((s) => s.enterGarden);
  const rootRef = useRef<HTMLElement>(null);

  const [bgVariant, setBgVariant] = useState<BgVariant>("default");

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
      if (t instanceof Node) {
        const el = t instanceof Element ? t : (t.parentElement as Element | null);
        if (el?.closest("[data-landing-ui]")) return;
      }
      if (t instanceof HTMLButtonElement || t instanceof HTMLAnchorElement) return;
      e.preventDefault();
      trySkip();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [trySkip]);

  const displayed = LANDING_DIALOGUE.slice(0, visibleLen);

  const bgSrc = bgVariant === "default" ? LANDING_BG_DEFAULT : LANDING_BG_ALT;

  return (
    <main
      id="main"
      ref={rootRef}
      className="relative flex min-h-dvh flex-col overflow-hidden bg-sky outline-none"
      tabIndex={0}
      aria-label="Welcome — press Space or Enter to skip the typewriter"
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        if ((e.target as HTMLElement).closest?.("[data-landing-ui]")) return;
        trySkip();
      }}
    >
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
        <img
          key={bgSrc}
          src={bgSrc}
          alt=""
          width={1024}
          height={576}
          decoding="async"
          fetchPriority="high"
          className="h-full w-full object-cover object-center"
        />
      </div>
      {/* Readability over the lower third of the art (dialogue + CTA). */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[min(52dvh,420px)] bg-gradient-to-t from-black/40 via-black/15 to-transparent"
        aria-hidden
      />

      <h1
        aria-label="The Pixel Garden"
        className="pointer-events-none absolute left-0 right-0 top-0 z-[3] flex justify-center px-4 pt-[max(0.5rem,env(safe-area-inset-top))]"
      >
        <svg
          className="h-auto w-[min(96vw,52rem)] text-ui-text drop-shadow-[0_2px_0_rgba(0,0,0,0.28)]"
          viewBox="0 0 1600 160"
          preserveAspectRatio="xMidYMid meet"
          overflow="visible"
          aria-hidden
        >
          <defs>
            <path
              id="landing-curved-title-path"
              d="M 40 118 Q 800 28 1560 118"
              fill="none"
            />
          </defs>
          <text
            className="fill-current font-pixel"
            style={{ fontSize: 50, letterSpacing: "0.06em" }}
            dominantBaseline="middle"
          >
            <textPath href="#landing-curved-title-path" startOffset="50%" textAnchor="middle">
              THE PIXEL GARDEN
            </textPath>
          </text>
        </svg>
      </h1>

      <div className="relative z-[2] min-h-0 flex-1" aria-hidden />

      <div
        className="relative z-[2] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
        data-landing-ui
      >
        <LandingAvatarSection
          bgVariant={bgVariant}
          onToggleBg={() => setBgVariant((v) => (v === "default" ? "alt" : "default"))}
        />

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
