"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useGardenStore } from "../../store/useGardenStore";
import type { LandingAvatarId } from "../../types";
import {
  AVATAR_FRAME_PX,
  type LandingAvatarDef,
  getLandingAvatarDef,
  LANDING_AVATARS,
} from "./landingAvatarsConfig";

const FRAME_MS = 110;

type StripMode = "idle" | "walk" | "static";

function AnimatedStrip({
  def,
  mode,
  reducedMotion,
  scale = 1,
}: {
  def: LandingAvatarDef;
  mode: StripMode;
  reducedMotion: boolean;
  scale?: number;
}) {
  const sheet = mode === "walk" ? def.walk : def.idle;
  const frameCount = Math.max(1, Math.round(sheet.sheetWidth / AVATAR_FRAME_PX));
  const [frame, setFrame] = useState(0);

  const animating = mode !== "static" && !reducedMotion;

  useEffect(() => {
    if (!animating) return;
    const id = window.setInterval(() => {
      setFrame((f) => (f + 1) % frameCount);
    }, FRAME_MS);
    return () => clearInterval(id);
  }, [animating, frameCount, sheet.src, sheet.sheetWidth]);

  useEffect(() => {
    setFrame(0);
  }, [def.id, mode, sheet.src]);

  const framePx = AVATAR_FRAME_PX * scale;
  const sheetW = sheet.sheetWidth * scale;
  const sheetH = AVATAR_FRAME_PX * scale;
  const posX = animating ? -frame * framePx : 0;

  return (
    <div
      className="overflow-hidden"
      style={{
        width: framePx,
        height: sheetH,
        imageRendering: "pixelated",
      }}
    >
      <div
        style={{
          width: sheetW,
          height: sheetH,
          backgroundImage: `url(${sheet.src})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: `${sheetW}px ${sheetH}px`,
          backgroundPosition: `${posX}px 0`,
        }}
      />
    </div>
  );
}

type LandingAvatarSectionProps = {
  bgVariant: "default" | "alt";
  onToggleBg: () => void;
};

export function LandingAvatarSection({ bgVariant, onToggleBg }: LandingAvatarSectionProps) {
  const landingAvatarId = useGardenStore((s) => s.landingAvatarId);
  const setLandingAvatarId = useGardenStore((s) => s.setLandingAvatarId);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const gearRef = useRef<HTMLButtonElement>(null);
  const settingsId = useId();

  const def = getLandingAvatarDef(landingAvatarId);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReducedMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (!settingsOpen) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t)) return;
      if (gearRef.current?.contains(t)) return;
      setSettingsOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSettingsOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [settingsOpen]);

  const pick = (id: LandingAvatarId) => {
    setLandingAvatarId(id);
    setSettingsOpen(false);
  };

  return (
    <div
      className="relative mx-auto mb-3 flex max-w-2xl justify-center sm:mb-4"
      data-landing-avatar-row
    >
      <div className="relative inline-flex flex-col items-center">
        <button
          ref={gearRef}
          type="button"
          className="font-pixel pointer-events-auto absolute -right-1 -top-1 z-20 flex h-9 min-w-[36px] items-center justify-center rounded border-2 border-ui-text/40 bg-ui-bg/95 px-2 text-[8px] text-ui-text shadow-md backdrop-blur-sm hover:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:-right-2 sm:-top-2 sm:h-10 sm:text-[9px]"
          aria-expanded={settingsOpen}
          aria-controls={settingsId}
          aria-label="Avatar settings — choose character"
          title="Avatar settings"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            setSettingsOpen((o) => !o);
          }}
        >
          ⚙
        </button>

        <button
          type="button"
          data-landing-avatar
          className={`pointer-events-auto rounded border-4 bg-ui-bg/45 p-2 shadow-md backdrop-blur-sm transition-transform hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.99] sm:p-3 ${
            bgVariant === "alt" ? "border-accent ring-2 ring-accent/70" : "border-ui-text/35 hover:border-accent/50"
          }`}
          aria-label={`${def.label} — tap to switch garden background`}
          title="Switch background scene"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onToggleBg();
          }}
        >
          <AnimatedStrip def={def} mode="walk" reducedMotion={reducedMotion} scale={1.1} />
          <span className="font-pixel mt-2 block text-center text-[6px] uppercase tracking-wide text-ui-text sm:text-[7px]">
            {def.label}
          </span>
        </button>

        {settingsOpen ? (
          <div
            ref={panelRef}
            id={settingsId}
            className="font-pixel absolute bottom-full left-1/2 z-30 mb-2 w-[min(20rem,calc(100vw-2rem))] -translate-x-1/2 rounded border-4 border-ui-text/40 bg-ui-bg/98 p-3 text-[7px] text-ui-text shadow-xl backdrop-blur-sm sm:text-[8px]"
            role="dialog"
            aria-label="Choose avatar"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <p className="mb-1.5 border-b border-ui-text/20 pb-1 text-ui-text/85">Character</p>
            <ul className="flex flex-col gap-1">
              {LANDING_AVATARS.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    className={`flex w-full items-center gap-2 rounded border px-1.5 py-1 text-left uppercase tracking-wide transition-colors hover:bg-ui-text/5 ${
                      a.id === landingAvatarId ? "border-accent bg-accent/10" : "border-ui-text/25"
                    }`}
                    onClick={() => pick(a.id)}
                  >
                    <AnimatedStrip def={a} mode="static" reducedMotion={true} scale={0.45} />
                    <span className="flex-1">{a.label}</span>
                    {a.id === landingAvatarId ? <span aria-hidden>✓</span> : null}
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="mt-2 w-full rounded border border-ui-text/30 py-1 text-[6px] text-ui-text/80 hover:bg-ui-text/5 sm:text-[7px]"
              onClick={() => setSettingsOpen(false)}
            >
              Close
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
