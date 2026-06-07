"use client";

import { trackResumeDownload } from "../../analytics/plausible";

/**
 * Resume download surface (Phase 10). Lazy-loaded from `ModalLayer`.
 */
export default function ResumePanel() {
  const download = () => {
    trackResumeDownload();
    try {
      const a = document.createElement("a");
      a.href = "/resume.pdf";
      a.download = "resume.pdf";
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      /* noop */
    }
  };

  return (
    <div className="space-y-4 text-sm leading-relaxed text-ui-text/90">
      <p>
        Download the latest résumé as a PDF. If the file is missing on your deploy, add{" "}
        <code className="rounded bg-ui-text/10 px-1 text-xs">public/resume.pdf</code> to the repo (same as the
        terminal <kbd className="rounded border border-ui-text/30 bg-ui-bg px-1 font-mono text-xs">resume</kbd>{" "}
        command).
      </p>
      <button
        type="button"
        onClick={download}
        className="font-pixel min-h-[44px] rounded border-2 border-ui-text/35 bg-accent/15 px-4 py-2 text-[8px] uppercase tracking-wide text-ui-text hover:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:text-[9px]"
      >
        Download resume.pdf
      </button>
    </div>
  );
}
