import { type RefObject, useEffect, useRef } from "react";

/** TRD §6 — CSS host metrics + capped device pixel ratio. */
export type CanvasHostMetrics = {
  w: number;
  h: number;
  dpr: number;
};

/**
 * ResizeObserver + DPR (TRD §6.1 normative steps 1–3, 7 host callback).
 * Invokes `onResize` when the host `contentRect` or `devicePixelRatio` may have changed.
 */
export function useResizeCanvas(
  hostRef: RefObject<HTMLElement | null>,
  onResize: (metrics: CanvasHostMetrics) => void,
): void {
  const onResizeRef = useRef(onResize);
  onResizeRef.current = onResize;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const measure = () => {
      const rect = host.getBoundingClientRect();
      const Wc = rect.width;
      const Hc = rect.height;
      if (Wc < 1 || Hc < 1) return;
      const dpr = Math.min(window.devicePixelRatio, 2);
      onResizeRef.current({ w: Wc, h: Hc, dpr });
    };

    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (!cr) return;
      if (cr.width < 1 || cr.height < 1) return;
      const dpr = Math.min(window.devicePixelRatio, 2);
      onResizeRef.current({ w: cr.width, h: cr.height, dpr });
    });

    ro.observe(host);
    window.addEventListener("resize", measure);
    measure();

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [hostRef]);
}
