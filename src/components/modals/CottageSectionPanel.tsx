import type { CottageHotspotKind } from "../../garden/events";

type Section = Extract<CottageHotspotKind, "desk" | "bookshelf" | "window">;

const copy: Record<
  Section,
  { body: string }
> = {
  desk: {
    body:
      "Placeholder — notes, sketches, and the odd bug list live here. Full cottage desk content (PRD §9.4) can replace this copy when art and narrative are ready.",
  },
  bookshelf: {
    body:
      "Placeholder — spines, fav reads, and maybe a hidden achievement. Wire real links or shelves when content is final.",
  },
  window: {
    body:
      "Placeholder — light, weather, and a peek at the sky outside the cottage. Tune copy with mood (day / night / zombie).",
  },
};

type Props = { section: Section };

/** PRD §9.4 — DM Sans body, Press Start title (via ModalLayer heading + this body). */
export function CottageSectionPanel({ section }: Props) {
  const c = copy[section];
  return (
    <div className="space-y-3 text-sm leading-relaxed text-ui-text/90">
      <p className="font-body">{c.body}</p>
    </div>
  );
}
