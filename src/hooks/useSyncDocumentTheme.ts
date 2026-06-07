import { useLayoutEffect } from "react";
import { useGardenStore } from "../store/useGardenStore";

/** TRD §2.2 — `data-theme` on the document root for CSS variables + future DOM overlays. */
export function useSyncDocumentTheme(): void {
  const environmentMode = useGardenStore((s) => s.environmentMode);

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = environmentMode;
  }, [environmentMode]);
}
