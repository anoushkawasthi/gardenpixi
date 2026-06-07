"use client";

import dynamic from "next/dynamic";

// Pixi / GSAP / Zustand are browser-only; keep them out of the server pass
// (PRD §12.1 / TRD §13.1) while `output: "export"` still emits static HTML.
const App = dynamic(() => import("../App"), { ssr: false });

export default function Page() {
  return <App />;
}
