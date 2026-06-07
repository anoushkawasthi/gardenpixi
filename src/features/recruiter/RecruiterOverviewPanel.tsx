"use client";

/**
 * Recruiter-oriented overview (PRD §9.3 scaffold).
 * Loaded via `next/dynamic` from `ModalLayer` → separate webpack chunk.
 */
export type RecruiterOverviewPanelProps = {
  /** Close recruiter modal then open contact (single UX step). */
  onRequestContact: () => void;
};

export default function RecruiterOverviewPanel({ onRequestContact }: RecruiterOverviewPanelProps) {
  return (
    <div className="space-y-6 text-sm leading-relaxed text-ui-text/90">
      <header className="space-y-2 border-b border-ui-text/15 pb-4">
        <p className="font-pixel text-[9px] uppercase tracking-wide text-accent">Recruiter view</p>
        <p>
          This panel is a dense, text-first overview: who I am, how I work, and how to move forward.
          Replace copy with your final PRD §9.3 narrative and metrics.
        </p>
      </header>

      <section className="space-y-2" aria-labelledby="rec-at-glance">
        <h3 id="rec-at-glance" className="font-pixel text-[9px] uppercase tracking-wide text-ui-text">
          At a glance
        </h3>
        <ul className="list-inside list-disc space-y-1 pl-1">
          <li>Product-minded engineer — portfolio as an explorable “garden” (you are here).</li>
          <li>Stack in this build: React, Next.js (static export), TypeScript, Pixi, Zustand, Tailwind v4.</li>
          <li>Open to full-time and contract; remote-first unless noted otherwise.</li>
        </ul>
      </section>

      <section className="space-y-2" aria-labelledby="rec-process">
        <h3 id="rec-process" className="font-pixel text-[9px] uppercase tracking-wide text-ui-text">
          How I ship
        </h3>
        <p>
          Clarify problem → thin vertical slice → instrument & iterate. I bias toward small PRs, explicit
          trade-offs in writing, and accessibility plus performance as default quality bars.
        </p>
      </section>

      <section className="space-y-2" aria-labelledby="rec-next">
        <h3 id="rec-next" className="font-pixel text-[9px] uppercase tracking-wide text-ui-text">
          Next step
        </h3>
        <p>
          Grab the PDF resume from the HUD <strong>Resume</strong> control or the in-world terminal{" "}
          <kbd className="rounded border border-ui-text/30 bg-ui-bg px-1 font-mono text-xs">resume</kbd> command,
          then use <strong>Contact</strong> for a thread with context.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <a
            className="font-pixel inline-flex min-h-[44px] items-center rounded border-2 border-ui-text/35 bg-accent/15 px-4 py-2 text-[8px] uppercase tracking-wide text-ui-text hover:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:text-[9px]"
            href="#recruiter-panel"
            onClick={(e) => {
              e.preventDefault();
              onRequestContact();
            }}
          >
            Open contact
          </a>
        </div>
      </section>
    </div>
  );
}
