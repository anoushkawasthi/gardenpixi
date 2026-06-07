import { useCallback, useId, useRef, useState } from "react";

type HudNavButtonProps = {
  label: string;
  /** Shown on desktop and in aria-label; mobile uses icon + long-press hint. */
  icon: string;
  onClick: () => void;
  /** Optional native tooltip (desktop: also consider `label`). */
  title?: string;
  /** Mobile-only: show text chip after long-press (PRD §13.1). */
  variant?: "desktop" | "mobile";
  pressed?: boolean;
};

const LONG_PRESS_MS = 450;

export function HudNavButton({
  label,
  icon,
  onClick,
  title: titleProp,
  variant = "desktop",
  pressed = false,
}: HudNavButtonProps) {
  const labelId = useId();
  const [showMobileLabel, setShowMobileLabel] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startLongPress = useCallback(() => {
    clearTimer();
    timerRef.current = setTimeout(() => setShowMobileLabel(true), LONG_PRESS_MS);
  }, [clearTimer]);

  const endLongPress = useCallback(() => {
    clearTimer();
    setShowMobileLabel(false);
  }, [clearTimer]);

  if (variant === "mobile") {
    return (
      <div className="relative flex flex-col items-center">
        {showMobileLabel && (
          <span
            id={labelId}
            role="tooltip"
            className="font-pixel pointer-events-none absolute bottom-full mb-1 max-w-[10rem] whitespace-normal rounded border border-ui-text/30 bg-ui-bg px-2 py-1 text-center text-[6px] leading-tight text-ui-text shadow-md"
          >
            {label}
          </span>
        )}
        <button
          type="button"
          aria-label={label}
          title={titleProp ?? label}
          aria-pressed={pressed}
          onClick={onClick}
          onPointerDown={startLongPress}
          onPointerUp={endLongPress}
          onPointerLeave={endLongPress}
          onPointerCancel={endLongPress}
          className="flex h-11 min-w-[44px] items-center justify-center rounded border-2 border-ui-text/25 bg-ui-bg text-lg text-ui-text transition-colors hover:border-accent/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:bg-ui-text/5"
        >
          <span aria-hidden>{icon}</span>
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      title={titleProp}
      className="font-pixel flex min-h-[44px] min-w-[44px] shrink-0 items-center gap-2 rounded border-2 border-ui-text/25 bg-ui-bg px-3 py-2 text-left text-[7px] uppercase tracking-wide text-ui-text transition-colors hover:border-accent/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:bg-ui-text/5 sm:text-[8px]"
    >
      <span aria-hidden className="text-base leading-none">
        {icon}
      </span>
      <span className="max-w-[8.5rem] leading-snug">{label}</span>
    </button>
  );
}
