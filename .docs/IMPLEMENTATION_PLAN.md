# The Pixel Garden — Implementation Plan

**Normative product:** PRD v1.2 (behaviour, copy, timings, features)  
**Normative engineering:** TRD v1.0 (schema, Pixi layers, camera, bridge, terminal, perf)  
**Execution order:** [PRODUCTION_KICKOFF](./references.md) phases 0–13  

This plan translates the kickoff vertical slices into concrete deliverables, acceptance checks, and file-level ownership. Update it as Q4 (project count) and art land.

---

## 1. Goals and constraints

| Constraint | Source |
|------------|--------|
| Static site only — no CMS, no backend for v1 | PRD §14 |
| World design resolution `1200 × 700` world px; responsive host | TRD §0.3, PRD §9.2 |
| Stack frozen: React 18, Vite 5, TS 5, Pixi v8, Tailwind v4, Framer Motion v11, Zustand, EmailJS, Plausible, `@fontsource/dm-sans`, **GSAP** (camera) | TRD header, Kickoff §3 |
| Projects content compile-time; Zod `parse` in dev fail-fast | TRD §3.3 |
| Pixi after “Enter Garden” (dynamic import boundary) | TRD §13.1, PRD §12.1 |

---

## 2. Repository map (target)

```text
src/
  main.tsx
  App.tsx
  content/
    projects.json              # validated projects (min 1, max 24 rows)
    cameraPresets.ts             # Record<PresetId, { cx, cy, zoom }>
  schemas/
    projects.ts                  # Zod — from TRD companion
  store/
    useGardenStore.ts            # Zustand slices per TRD §9.1
  types/
    index.ts                     # EnvironmentMode, ModalId, SectionId, …
  pixi/
    GardenController.ts          # TRD §8.1 API
    layers/                      # optional: background → fx
  components/
    landing/
    hud/
    garden/                      # GardenCanvas, bridge listeners
    modals/                      # recruiter, contact, resume
    terminal/
    overlays/                    # project detail, cottage props
  hooks/
    useResizeCanvas.ts           # TRD §6 algorithm
  features/                      # React.lazy boundaries (recruiter, contact)
  styles/
    tokens.css                   # data-theme + PRD §5.3 tokens
public/
  sprites/                       # TRD §14 tree + resume.pdf when ready
```

---

## 3. Phases (vertical slices)

### Phase 0 — Tooling shell

**Deliverable:** Vite + React + TS runs; Tailwind v4 + `@tailwindcss/vite`; global CSS imports tokens; `data-theme` on root (`day` | `night` | `zombie`).

**Tasks:**

- Wire `vite.config.ts` with `@vitejs/plugin-react` and `@tailwindcss/vite`.
- `src/styles/index.css`: `@import "tailwindcss";` + CSS variables for PRD tokens.
- `index.html`: Google Fonts link Press Start 2P + VT323 (`display=swap`); preload strategy per TRD §12.
- Import `@fontsource/dm-sans` in `main.tsx` (weights 400, 700).
- Font utility classes / `@theme` mapping: `font-pixel`, `font-terminal`, `font-body`.

**Acceptance:** `npm run dev` shows themed shell; toggling `data-theme` in DevTools updates sky/ground/UI variables.

---

### Phase 1 — Landing (DOM)

**Deliverable:** Landing scene placeholder (static or simple div art); RPG dialogue; typewriter ~40ms/char; skip on click; CTA `[ Enter Garden ]` after completion; `document.fonts.ready` before typewriter (TRD §12).

**Tasks:**

- `components/landing/Landing.tsx`: phase state `landing` | pre-hub transition.
- Gate placeholder (6-frame anim when sprites exist).
- On CTA: dispatch store transition; **do not** load Pixi until this point (bundle strategy).

**Acceptance:** PRD §9.1 copy and timings approximated; skip works.

---

### Phase 2 — HUD + layout

**Deliverable:** Persistent HUD (PRD §9.2); desktop layout; mobile bottom tab bar `<768px` (icons, long-press labels per PRD §13).

**Tasks:**

- `components/hud/Hud.tsx`: buttons Garden, Projects, Resume, Contact, Recruiter, Mode; Zombie exit when `environmentMode === 'zombie'`.
- Zustand: `environmentMode`, `preZombieMode`, `coffeeClickCount`, `camera`, `activeModal`, `activeProjectId`, `sessionWateredProjectIds`, `terminalOpen` (TRD §9.1).
- Fine-grained selectors to limit re-renders (TRD §9.2).

**Acceptance:** Keyboard-focusable controls; Framer Motion enter/exit for HUD sub-parts optional but scaffold hooks.

---

### Phase 3 — Pixi mount + resize

**Deliverable:** `GardenCanvas` host `div`; dynamic `import('pixi.js')` + `GardenController.mount`; `ResizeObserver` + DPR pipeline (TRD §6); empty `worldRoot` under `stage`; `SCALE_MODE.NEAREST`.

**Tasks:**

- `hooks/useResizeCanvas.ts` implementing normative algorithm.
- `GardenController`: `Application`, Pixi v8 `EventSystem` (from `pixi.js`), layer containers (TRD §2.1).
- Canvas `aria-label` + `role="img"` (PRD §12.2).

**Acceptance:** Resize and DPR change without blur/stretch errors; destroy on unmount cleans ticker and app.

---

### Phase 4 — Camera + GSAP

**Deliverable:** `cameraPresets.ts` (`hub`, `cottage`, `cottageDoor`, `terminal`, `mailbox`, per-project); GSAP tweens `cx`, `cy`, `zoom` (TRD §4.2–4.3); HUD buttons pan to presets (Level 1: 600–800ms).

**Tasks:**

- World transform applied **only** to `worldRoot` (TRD §2.1).
- `transitionLevel` + `isAnimating` on store for UI disabling if needed.

**Acceptance:** All four **locations** reachable by camera from hub (PRD §7); matrix TRD §4.4.

---

### Phase 5 — Projects data + click → panel

**Deliverable:** Plants driven from validated `projects.json`; plant `hitArea`; tap/click opens Level 2 zoom + `projectDetail` modal / overlay (Framer); placeholder sprites acceptable (colored rects).

**Tasks:**

- Dev-only: `projectsSchema.parse` at startup (TRD §3.3).
- `garden:plantClick` `CustomEvent` from Pixi → React (TRD §8.1).
- `ProjectDetailPanel`: fields per PRD §9.5.3; zombie labels use `zombieExeName` when mode is zombie.

**Acceptance:** Plausible `project_open` with `{ projectId }` (TRD §11.2).

---

### Phase 6 — Watering drag

**Deliverable:** Watering can drag; click vs drag disambiguation (TRD §5.2); water FX + bubble copy (PRD §9.5.2); `sessionWateredProjectIds`; keyboard fallback `W` + arrows + Enter (TRD §5.5).

**Tasks:**

- `garden:waterSuccess` event; brighten state session-only.
- Mobile: 44×44 touch targets (PRD §13).

**Acceptance:** `water_plant` analytics; no panel on water success.

---

### Phase 7 — Cottage

**Deliverable:** Level 1 pan to cottage; door Level 2 zoom; desk / bookshelf / window → overlay panels (PRD §9.4); Back + Escape.

**Acceptance:** DM Sans body, Press Start labels; `section_visit` where applicable.

---

### Phase 8 — Terminal

**Deliverable:** `TerminalPanel.tsx`; line union; parser; history; tab longest-prefix + cycle (TRD §10); typewriter 15ms/char; command map (TRD §10.7) including easter eggs.

**Acceptance:** `resume` triggers download + `resume_download`; `projects` pans camera; zombie colours (TRD §2.2).

---

### Phase 9 — Contact

**Deliverable:** Mailbox flow; EmailJS from env vars (TRD §11.1); honeypot; success/error UX (PRD §9.7).

**Acceptance:** `contact_submit` / `contact_error` Plausible; honeypot silent handling per TRD default.

---

### Phase 10 — Recruiter + resume HUD

**Deliverable:** Lazy `feature-recruiter` chunk; modal content per PRD §9.3; resume PDF in `public/` or URL.

**Acceptance:** Mobile full-screen modal; Escape close; `recruiter_mode_open` event.

---

### Phase 11 — Day / night / zombie

**Deliverable:** HUD sun/moon; CSS on `#root` or `documentElement` `data-theme`; coffee 3× within window → zombie; exit button only; restore `preZombieMode` (PRD §6, TRD §2.1a).

**Tasks:**

- DOM overlays: vignette, scanlines, glitch (zombie); Pixi visibility for stars, fireflies, character set swap.
- Terminal palette swap zombie (TRD table §2.2).

**Acceptance:** `zombie_mode_enter` / `exit` events; reduced motion (TRD §2.3).

---

### Phase 12 — Ambient art

**Deliverable:** Load sheets per TRD §7.1 phases; grass, clouds, birds, cats, etc.; Aseprite JSON format documented in `.docs` or README.

**Acceptance:** Asset size budget < 2MB PNG total (TRD §13.2); CI sum script optional.

---

### Phase 13 — Polish + ship

**Deliverable:** A11y checklist TRD §17.2; Lighthouse targets PRD §12.1; `sharp` or build script for PNG crunch; Vercel deploy; env vars in dashboard.

**Acceptance:** Definition of Done in Kickoff §10.

---

## 4. Cross-cutting workstreams

| Workstream | Notes |
|------------|--------|
| **Analytics** | Plausible script + `section_visit`, `resume_download`, `recruiter_mode_open`, `contact_*`, `project_open`, `water_plant`, zombie events (TRD §11.2). |
| **Code splitting** | Dynamic Pixi, lazy modals, optional terminal (TRD §13.1). |
| **Types** | Mirror Zod inference in `src/types/` (TRD §15). |
| **Content** | Final project rows (Q4), resume file, social URLs, EmailJS template field names (Kickoff §7). |

---

## 5. Open items (track in repo issues)

| ID | Item |
|----|------|
| Q4 | Final project count / garden density (PRD §15) |
| Q5 | Animation portfolio samples in v1? |
| TRD §19 | Plant labels: DOM vs Pixi — decide before art final |
| TRD §18 | Clickable cats — v1.1? |

---

## 6. References

- PRD v1.2 and TRD v1.0 live in your Downloads folder; consider copying snapshots into `.docs/spec/` when versions change.
- Zod schema: `src/schemas/projects.ts` (companion: original `Anoushka_Portfolio_TRD_projects.zod.ts`).

---

*Generated for workspace scaffold — align with PRD/TRD as source of truth.*
