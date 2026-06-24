import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { trackSectionVisit } from "../../analytics/plausible";
import { COTTAGE_DOOR_HOTSPOT, COTTAGE_INTERIOR_HOTSPOTS } from "../../content/cottageHotspots";
import { projectsList } from "../../content/projectsList";
import { randomWaterBubble } from "../../content/wateringCopy";
import {
  GARDEN_COTTAGE_HOTSPOT_EVENT,
  GARDEN_PLANT_CLICK_EVENT,
  GARDEN_WATER_SUCCESS_EVENT,
  type GardenCottageHotspotDetail,
  type GardenPlantClickDetail,
  type GardenWaterSuccessDetail,
} from "../../garden/events";
import { useResizeCanvas } from "../../hooks/useResizeCanvas";
import { createGardenController, type CottageHotspotRuntime, type GardenControllerApi } from "../../pixi/GardenController";
import { useGardenStore } from "../../store/useGardenStore";

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || el.isContentEditable;
}

export function GardenCanvas() {
  const hostRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<GardenControllerApi | null>(null);
  const [pixiReady, setPixiReady] = useState(false);
  const [waterToast, setWaterToast] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const plants = useMemo(
    () =>
      projectsList.map((p) => ({
        id: p.id,
        x: p.world.x,
        y: p.world.y,
        plantStyle: p.plantStyle,
      })),
    [],
  );

  const cottageUiPhase = useGardenStore((s) => s.cottageUiPhase);
  const cottageInteriorActive = useGardenStore((s) => s.cottageInteriorActive);

  const cottageHotspots = useMemo((): readonly CottageHotspotRuntime[] => {
    if (cottageUiPhase === "door_exterior") {
      return [
        {
          kind: "door",
          x: COTTAGE_DOOR_HOTSPOT.x,
          y: COTTAGE_DOOR_HOTSPOT.y,
          w: COTTAGE_DOOR_HOTSPOT.w,
          h: COTTAGE_DOOR_HOTSPOT.h,
        },
      ];
    }
    if (cottageInteriorActive && cottageUiPhase === "interior") {
      const hi = COTTAGE_INTERIOR_HOTSPOTS;
      return [
        { kind: "desk", x: hi.desk.x, y: hi.desk.y, w: hi.desk.w, h: hi.desk.h },
        { kind: "bookshelf", x: hi.bookshelf.x, y: hi.bookshelf.y, w: hi.bookshelf.w, h: hi.bookshelf.h },
        { kind: "window", x: hi.window.x, y: hi.window.y, w: hi.window.w, h: hi.window.h },
      ];
    }
    return [];
  }, [cottageUiPhase, cottageInteriorActive]);

  // useShallow only compares top-level entries by reference. A nested `camera: { … }`
  // object is new every selector run → always "changed" → infinite re-renders once
  // `useLayoutEffect` below runs. Use a flat tuple so shallow compare stays stable.
  const gardenSnap = useGardenStore(
    useShallow((s) =>
      [
        s.environmentMode,
        s.camera.cx,
        s.camera.cy,
        s.camera.zoom,
        s.sessionWateredProjectIds,
        s.wateringKeyHeld,
        s.waterHighlightProjectId,
      ] as const,
    ),
  );

  const showWaterToast = useCallback((message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setWaterToast(message);
    toastTimerRef.current = setTimeout(() => {
      setWaterToast(null);
      toastTimerRef.current = null;
    }, 2400);
  }, []);

  const handleResize = useCallback((m: { w: number; h: number; dpr: number }) => {
    controllerRef.current?.resize({ w: m.w, h: m.h }, m.dpr);
  }, []);

  useResizeCanvas(hostRef, handleResize);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const onPlant = (ev: Event) => {
      const e = ev as CustomEvent<GardenPlantClickDetail>;
      const id = e.detail?.projectId;
      if (!id) return;
      useGardenStore.getState().openProjectFromGarden(id);
    };

    const onWater = (ev: Event) => {
      const e = ev as CustomEvent<GardenWaterSuccessDetail>;
      const id = e.detail?.projectId;
      if (!id) return;
      if (useGardenStore.getState().applyWaterSuccess(id)) {
        controllerRef.current?.celebrateWaterAt(id);
        showWaterToast(randomWaterBubble());
      }
    };

    host.addEventListener(GARDEN_PLANT_CLICK_EVENT, onPlant);
    host.addEventListener(GARDEN_WATER_SUCCESS_EVENT, onWater);
    return () => {
      host.removeEventListener(GARDEN_PLANT_CLICK_EVENT, onPlant);
      host.removeEventListener(GARDEN_WATER_SUCCESS_EVENT, onWater);
    };
  }, [showWaterToast]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const onCottage = (ev: Event) => {
      const e = ev as CustomEvent<GardenCottageHotspotDetail>;
      const kind = e.detail?.kind;
      if (!kind) return;
      const st = useGardenStore.getState();
      if (kind === "door") {
        st.openCottageDoorZoom();
        return;
      }
      if (kind === "desk") {
        trackSectionVisit("cottage_desk");
        st.openModal("cottageDesk");
        return;
      }
      if (kind === "bookshelf") {
        trackSectionVisit("cottage_bookshelf");
        st.openModal("cottageBookshelf");
        return;
      }
      if (kind === "window") {
        trackSectionVisit("cottage_window");
        st.openModal("cottageWindow");
      }
    };

    host.addEventListener(GARDEN_COTTAGE_HOTSPOT_EVENT, onCottage);
    return () => host.removeEventListener(GARDEN_COTTAGE_HOTSPOT_EVENT, onCottage);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      const st = useGardenStore.getState();
      if (st.terminalOpen) return;
      if (st.activeModal !== "none") return;

      if (e.key === "w" || e.key === "W") {
        if (!e.repeat) st.setWateringKeyHeld(true);
        e.preventDefault();
        return;
      }

      if (!st.wateringKeyHeld) return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        st.moveWaterHighlight(-1);
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        st.moveWaterHighlight(1);
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const id = st.waterHighlightProjectId;
        if (!id) return;
        if (st.applyWaterSuccess(id)) {
          controllerRef.current?.celebrateWaterAt(id);
          showWaterToast(randomWaterBubble());
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "w" || e.key === "W") {
        useGardenStore.getState().setWateringKeyHeld(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [showWaterToast]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const controller = createGardenController();
    controllerRef.current = controller;

    let cancelled = false;
    void controller.mount(host).then(
      () => {
        if (!cancelled) setPixiReady(true);
      },
      () => {
        if (!cancelled) setPixiReady(false);
      },
    );

    return () => {
      cancelled = true;
      setPixiReady(false);
      controller.destroy();
      controllerRef.current = null;
    };
  }, []);

  useLayoutEffect(() => {
    if (!pixiReady) return;
    const [
      environmentMode,
      cx,
      cy,
      zoom,
      sessionWateredProjectIds,
      wateringKeyHeld,
      waterHighlightProjectId,
    ] = gardenSnap;
    const highlightedPlantId =
      wateringKeyHeld && waterHighlightProjectId ? waterHighlightProjectId : null;
    controllerRef.current?.applyState({
      environmentMode,
      camera: { cx, cy, zoom },
      sessionWateredProjectIds,
      highlightedPlantId,
      wateringKeyHeld,
      plants,
      cottageHotspots,
    });
  }, [pixiReady, gardenSnap, plants, cottageHotspots]);

  return (
    <div className="relative w-full min-w-0 bg-sky min-h-[100dvh] md:min-h-[calc(100dvh-5.5rem)]">
      <div
        ref={hostRef}
        className="relative block min-h-[100dvh] w-full min-w-0 touch-pan-y overflow-hidden bg-sky md:min-h-[calc(100dvh-5.5rem)]"
        data-component="garden-canvas-host"
      />
      <div
        className="pointer-events-none absolute left-1/2 top-[min(18%,5.5rem)] z-10 max-w-[90%] -translate-x-1/2"
        aria-live="polite"
        aria-atomic="true"
      >
        {waterToast && (
          <div className="font-pixel rounded border-2 border-sky-400/80 bg-ui-bg/95 px-3 py-2 text-center text-[8px] text-ui-text shadow-md sm:text-[9px]">
            {waterToast}
          </div>
        )}
      </div>
    </div>
  );
}
