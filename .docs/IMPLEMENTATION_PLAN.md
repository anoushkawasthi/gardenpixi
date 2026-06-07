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
| Stack frozen: React 18, **Next.js 14 (App Router, static export)**, TS 5, Pixi v8, Tailwind v4, Framer Motion v11, Zustand, EmailJS, Plausible, `@fontsource/dm-sans`, **GSAP** (camera) | TRD header, Kickoff §3 |
| Output remains a fully static site: `next.config.mjs` sets `output: "export"` (no server runtime) | PRD §14 |
| Projects content compile-time; Zod `parse` in dev fail-fast | TRD §3.3 |
| Pixi after “Enter Garden” (dynamic import boundary) | TRD §13.1, PRD §12.1 |

---

## 2. Repository map (target)

```text
next.config.mjs                  # output: "export" (static), webpack/transpile if needed
postcss.config.mjs               # Tailwind v4 via @tailwindcss/postcss
src/
  app/
    layout.tsx                   # <html data-theme>, fonts, Plausible, global CSS, metadata
    page.tsx                     # client entry — dynamic(ssr:false) Pixi app boundary
  App.tsx                        # "use client" root scene (landing | hub)
  content/
    projects.json              # validated projects (min 1, max 24 rows)
    projectsList.ts            # dev Zod parse + getProjectById
    cameraPresets.ts             # Record<PresetId, { cx, cy, zoom }>
    landingCopy.ts
    cottageHotspots.ts           # Phase 7 — door + interior hit rects (world px)
  config/
    contactEmail.ts              # Phase 9 — NEXT_PUBLIC_EMAILJS_* gate
  camera/
    constants.ts                 # PRD §8 Level-1 pan duration bounds (ms)
  analytics/
    plausible.ts               # TRD §11.2 custom events (optional embed)
  garden/
    events.ts                  # TRD §8.1 bridge event names + detail types
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
    modals/                      # ContactForm, recruiter, resume, ProjectDetailPanel, CottageSectionPanel
    terminal/                    # TerminalPanel (Phase 8)
    overlays/                    # project detail, cottage props
  hooks/
    useResizeCanvas.ts           # TRD §6 algorithm
  features/                      # next/dynamic (ssr:false) boundaries (Phase 10 recruiter + resume panels)
  styles/
    tokens.css                   # data-theme + PRD §5.3 tokens
    index.css                    # @import "tailwindcss" + @theme mapping (imported by app/layout)
public/
  sprites/                       # TRD §14 tree + resume.pdf when ready
```

> **Framework note:** the app is a client-rendered SPA inside Next.js. `src/app/page.tsx` loads `App` via `next/dynamic` with `ssr: false` so Pixi / GSAP / Zustand only run in the browser, while `next build` still emits a static `out/` (per `output: "export"`).

---

## 3. Phases (vertical slices)

### Phase 0 — Tooling shell

**Status:** Implemented in repo.

**Deliverable:** Next.js 14 (App Router) + React 18 + TS runs; Tailwind v4 via `@tailwindcss/postcss`; global CSS imports tokens; `data-theme` on root (`day` | `night` | `zombie`); static export (`output: "export"`).

**Tasks:**

- `next.config.mjs` — `output: "export"` (static, no server runtime); `reactStrictMode: true`.
- `postcss.config.mjs` — `@tailwindcss/postcss` plugin (replaces the Vite Tailwind plugin).
- `src/styles/tokens.css` — PRD §5.3 CSS variables per `data-theme`; `src/styles/index.css` imports tokens + `@import "tailwindcss"` + `@theme` colour/font mapping.
- `src/app/layout.tsx`: root `<html lang="en" data-theme="day">`; Google Fonts Press Start 2P + VT323 (`display=swap`) with `preconnect` + `preload` (TRD §12 discoverability); imports `@fontsource/dm-sans` (400/700) and `../styles/index.css`; `metadata` for title; Plausible `<Script>` placeholder.
- `src/app/page.tsx`: `"use client"`; `dynamic(() => import("../App"), { ssr: false })` boundary (keeps Pixi out of the server pass, PRD §12.1 / TRD §13.1).
- `src/hooks/useSyncDocumentTheme.ts` — syncs Zustand `environmentMode` → `document.documentElement.dataset.theme` (TRD §2.2).
- Font utility classes / `@theme` mapping: `font-pixel`, `font-terminal`, `font-body`.

**Acceptance:** `npm run dev` shows themed shell; toggling `data-theme` on `<html>` in DevTools updates sky/ground/UI variables (React buttons sync the same attribute); `npm run build` emits static `out/`.

---

### Phase 1 — Landing (DOM)

**Status:** Implemented in repo.

**Deliverable:** Landing scene placeholder (static or simple div art); RPG dialogue; typewriter ~40ms/char; skip on click; CTA `[ Enter Garden ]` after completion; `document.fonts.ready` before typewriter (TRD §12).

**Tasks:**

- `components/landing/Landing.tsx` + `content/landingCopy.ts` — local UI phases `fonts` | `typing` | `complete`; store `sitePhase` `landing` | `hub` + `enterGarden()` (no Pixi).
- Gate placeholder (6-frame anim when sprites exist).
- On CTA: `enterGarden()` → `sitePhase: 'hub'`, camera hub preset, modals closed (bundle strategy: still no Pixi).

**Acceptance:** PRD §9.1 copy and timings approximated; skip works.

---

### Phase 2 — HUD + layout

**Status:** Implemented in repo.

**Deliverable:** Persistent HUD (PRD §9.2); desktop layout; mobile bottom tab bar `<768px` (icons, long-press labels per PRD §13).

**Tasks:**

- `components/hud/Hud.tsx` + `HudNavButton.tsx`: Garden, Projects, Resume, Contact, Recruiter, day/night mode toggle; **Exit Zombie Mode** when `environmentMode === 'zombie'` (PRD §6.3).
- `components/modals/ModalLayer.tsx`: Level-3 placeholder dialogs + Escape / backdrop / Close (full content in Phases 5/9/10).
- Zustand `useGardenStore`: `environmentMode`, `preZombieMode`, `coffeeClickCount`, `camera`, `activeModal`, `activeProjectId`, `sessionWateredProjectIds`, `terminalOpen`, camera presets, modals, coffee→zombie window (TRD §9.1).
- `store/selectors.ts` — fine-grained selectors (TRD §9.2).
- `content/cameraPresets.ts` — added `projects` preset for HUD **Projects** shortcut.

**Acceptance:** Keyboard-focusable controls; Framer Motion enter/exit for HUD sub-parts optional but scaffold hooks.

---

### Phase 3 — Pixi mount + resize

**Status:** Implemented in repo.

**Deliverable:** `GardenCanvas` host `div`; dynamic `import('pixi.js')` + `GardenController.mount`; `ResizeObserver` + DPR pipeline (TRD §6); empty `worldRoot` under `stage`; `SCALE_MODE.NEAREST`.

**Tasks:**

- `hooks/useResizeCanvas.ts` — ResizeObserver on host + `window.resize` for DPR; TRD §6 buffer sizing + callback to controller.
- `pixi/GardenController.ts` — `await import('pixi.js')`, `Application.init`, `worldRoot` + TRD §2.1 layer `Container`s (empty); TRD §4.2 world transform on `worldRoot`; `mountGeneration` guards for StrictMode; canvas `role` / `aria-label` (PRD §12.2). **NEAREST / mipmaps:** applied per texture when loading sprites (TRD §6.2), not global yet.
- `components/garden/GardenCanvas.tsx` — mounts controller, wires `useResizeCanvas`, `useShallow` store → `applyState`.

**Acceptance:** Resize and DPR change without blur/stretch errors; destroy on unmount cleans ticker and app.

---

### Phase 4 — Camera + GSAP

**Status:** Implemented in repo.

**Deliverable:** `cameraPresets.ts` (`hub`, `cottage`, `cottageDoor`, `terminal`, `mailbox`, `projects`); GSAP tweens `cx`, `cy`, `zoom` (TRD §4.2–4.3); HUD pans to presets (Level 1: **600–800ms**, default **720ms**).

**Tasks:**

- World transform stays **only** on `worldRoot` in `GardenController` (TRD §2.1 / §4.2).
- `useGardenStore`: `goToCameraPreset(id, { immediate?, durationMs? })` — GSAP `power2.inOut`, kills overlapping tween; **`immediate: true`** for `enterGarden` hub snap; **`prefers-reduced-motion: reduce`** → instant snap (TRD §2.3).
- `camera/constants.ts` — PRD §8 duration bounds.
- `store/selectors.ts` — `selectCameraIsAnimating` for future UI guard.
- **HUD:** Garden, **About** (cottage), Projects, **Terminal**, **Mailbox** (camera); Resume / Contact / Recruiter unchanged (modals). Mobile nav scrolls horizontally when needed.

**Acceptance:** All four world areas + hub/projects reachable via camera presets from HUD; matrix TRD §4.4 for wired presets. Per-project zoom + **cottageDoor** Level 2 in Phase 5/7.

---

### Phase 5 — Projects data + click → panel

**Status:** Implemented in repo.

**Deliverable:** Plants driven from validated `projects.json`; plant `hitArea`; tap/click opens Level 2 zoom + `projectDetail` modal / overlay (Framer); placeholder sprites acceptable (colored rects).

**Tasks:**

- Dev-only: `projectsSchema.parse` at startup (TRD §3.3) — `src/content/projectsList.ts` (imported by `src/App.tsx`; runs in dev via `process.env.NODE_ENV`).
- `garden:plantClick` `CustomEvent` from Pixi → React (TRD §8.1).
- `ProjectDetailPanel`: fields per PRD §9.5.3; zombie labels use `zombieExeName` when mode is zombie.

**Acceptance:** Plausible `project_open` with `{ projectId }` (TRD §11.2).

---

### Phase 6 — Watering drag

**Status:** Implemented in repo.

**Deliverable:** Watering can drag; click vs drag disambiguation (TRD §5.2); water FX + bubble copy (PRD §9.5.2); `sessionWateredProjectIds`; keyboard fallback `W` + arrows + Enter (TRD §5.5).

**Tasks:**

- `garden:waterSuccess` event; brighten state session-only.
- Mobile: 44×44 touch targets (PRD §13).

**Acceptance:** `water_plant` analytics; no panel on water success.

---

### Phase 7 — Cottage

**Status:** Implemented in repo.

**Verification (manual):**

- HUD **About** pans to cottage exterior; `section_visit` with section `cottage` fires when the pan runs (Plausible when embedded).
- Door hotspot visible at cottage exterior; tap runs Level-2 zoom + `section_visit` `cottage_door`; interior hotspots open desk / bookshelf / window modals with `section_visit` per prop.
- **← Back** in cottage modals and **Escape** (cottage interior, no modal) return to exterior; **Leave cottage** button present.
- DM Sans body in `CottageSectionPanel`; Press Start titles via `ModalLayer` chrome.

**Deliverable:** Level 1 pan to cottage; door Level 2 zoom; desk / bookshelf / window → overlay panels (PRD §9.4); Back + Escape.

**Tasks:**

- `content/cottageHotspots.ts` — world-space hit targets (door exterior + interior props); tune with final art.
- `garden:cottageHotspot` `CustomEvent` (Pixi `layer_cottageHits` → React).
- `useGardenStore`: `cottageUiPhase`, `cottageInteriorActive`, `openCottageDoorZoom`, `closeCottageInterior`; `goToCameraPreset` syncs cottage phase when leaving/entering cottage preset.
- `ModalLayer` + `CottageSectionPanel` — desk / bookshelf / window placeholders (DM Sans body, Press Start titles via modal chrome); **Back** closes panel.
- `App`: **Escape** exits cottage interior when no modal is open; **Leave cottage** control (44px min height).

**Acceptance:** DM Sans body, Press Start labels; `section_visit` where applicable (`trackSectionVisit` for cottage pan, door, and each interior section).

---

### Phase 8 — Terminal

**Status:** Implemented in repo.

**Verification (manual):**

- HUD **Terminal** runs `openTerminal()` (camera `terminal` preset + panel + `section_visit` `terminal` when Plausible is on).
- `help` / camera commands / `resume` / `exit` behave as documented in `src/terminal/runCommand.ts`; **Tab** completes and cycles; **↑/↓** history; output uses **15ms/char** typewriter.
- **Escape** closes the panel when no other modal is open; **W** watering shortcut does not fire while the terminal is open (`GardenCanvas`).
- **Resume** command / HUD resume: `resume_download` when Plausible is embedded; add `public/resume.pdf` for a real file.

**Deliverable:** `TerminalPanel.tsx`; command parser + history; Tab longest-prefix + cycle; typewriter **15ms/char** on command output; command map (TRD §10.7 subset) + small easter eggs (`whoami`, `version`, `coffee`).

**Acceptance:** `resume` triggers download of `/resume.pdf` + `resume_download` Plausible; `projects` / `hub` / `cottage` / `mailbox` pan camera; terminal inherits `data-theme` (zombie palette via CSS tokens); HUD **Terminal** opens panel + pans; Escape / Close dismisses; watering **W** disabled while terminal is open.

---

### Phase 9 — Contact

**Status:** Implemented in repo.

**Verification (manual):**

- With **`.env.local`** filled (`NEXT_PUBLIC_EMAILJS_*`), submit sends via EmailJS and shows success; **Plausible** receives `contact_submit` when embedded.
- With env **missing**, submit is disabled and `contact_error` with `not_configured` fires if user somehow triggers send (guarded); inline notice explains setup.
- **Honeypot** filled: same success UI, **no** email and **no** `contact_submit` / `contact_error` (silent).
- Network / EmailJS failure: error message + `contact_error` with `emailjs_send`.

**Deliverable:** Mailbox flow; EmailJS from env vars (TRD §11.1); honeypot; success/error UX (PRD §9.7).

**Acceptance:** `contact_submit` / `contact_error` Plausible; honeypot silent handling per TRD default.

**Implementation:** `src/components/modals/ContactForm.tsx`, `src/config/contactEmail.ts`; `section_visit` for **`mailbox`** and **`projects`** presets when panning (same pattern as cottage).

**Code verification:** `ContactForm` is **`next/dynamic` + `ssr: false`** from `ModalLayer` (separate chunk). EmailJS params match the template table in §3; honeypot branch returns success without Plausible. **`NEXT_PUBLIC_CONTACT_MAILTO`** enables a **mailto** fallback when EmailJS env is missing. Contact opens from HUD ✉️, terminal `contact`, and recruiter handoff (`queueMicrotask` → `openModal("contact")`). Terminal **`mailbox`** command nudges users toward the HUD Contact flow.

### Phase 10 — Recruiter + resume HUD

**Status:** Implemented in repo (initial slice — replace copy with final PRD §9.3 content).

**Verification (manual):**

- Open **Recruiter Mode** from HUD: lazy chunk loads (`Loading recruiter overview…` briefly on slow networks); **Plausible** `recruiter_mode_open` when embedded.
- On **viewports below the `md` breakpoint**, recruiter and resume modals use **edge-to-edge** layout (`max-md` full-bleed shell); **Escape** still closes (existing `ModalLayer` + `useEscapeKey`).
- **Resume** modal: **Download resume.pdf** fires `resume_download` and triggers the same download pattern as the terminal `resume` command.
- **Open contact** in recruiter panel closes recruiter then opens **Contact** (same `ContactForm`).

**Deliverable:** Lazy `feature-recruiter` / `feature-resume` chunks; recruiter overview scaffold (PRD §9.3); resume PDF action in `public/` or URL.

**Acceptance:** Mobile full-screen modal (recruiter + resume); Escape close; `recruiter_mode_open` event.

**Implementation:** `src/features/recruiter/RecruiterOverviewPanel.tsx`, `src/features/resume/ResumePanel.tsx`, `next/dynamic` in `ModalLayer.tsx`; `trackRecruiterModeOpen` in `openModal("recruiter")` (`useGardenStore.ts`).

**Code verification:** `trackRecruiterModeOpen` runs only inside `openModal` when `id === "recruiter"` — entry points: HUD Recruiter (desktop/mobile) and terminal `recruiter`. `openProjectFromGarden` / `openProjectDetail` / cottage modals use targeted `set({ activeModal: … })` and **do not** fire `recruiter_mode_open`.

### Phase 11 — Day / night / zombie

**Status:** Verified in repo (code paths + manual checklist).

**Verification (manual):**

- **Day / night:** HUD sun/moon toggles `environmentMode`; `<html data-theme>` updates (see `useSyncDocumentTheme`).
- **Zombie:** Dev button **Enter Zombie Mode** uses `enterZombie({ source: "dev" })`; **three coffee clicks** within the store window (HUD ☕ or terminal `coffee`) → zombie; **Exit Zombie Mode** restores `preZombieMode` (day vs night).
- **Plausible (when script embedded):** `zombie_mode_enter` with props `{ source: "coffee" | "dev" | "manual" }`; `zombie_mode_exit` on exit.
- **DOM:** Vignette + scanlines + light glitch layers in hub shell (`App.tsx`); **`prefers-reduced-motion: reduce`** disables drift/glitch animations and softens scanlines (TRD §2.3).
- **Terminal:** Panel gains `terminal-panel-zombie` when theme is zombie (CRT-style border/glow via `tokens.css`).
- **Pixi:** Night sky adds **stars** + **fireflies** in `GardenController.syncWorldBackdrop` (day/zombie omit them).

**Code verification:**

- `trackZombieModeEnter` is only invoked from `useGardenStore`: `enterZombie` (default source `manual`, dev button passes `dev`) and the `recordCoffeeClick` branch when count reaches 3 (`source: "coffee"`). `trackZombieModeExit` runs only in `exitZombie`.
- Hub shell zombie overlays are the three `zombie-fx-*` nodes in `App.tsx` (hub layout only); styles and reduced-motion rules live in `tokens.css`.
- `TerminalPanel` applies `terminal-panel-zombie` when `selectEnvironmentMode` is `"zombie"`.

**Deliverable:** HUD sun/moon; CSS on `#root` or `documentElement` `data-theme`; coffee 3× within window → zombie; exit button only; restore `preZombieMode` (PRD §6, TRD §2.1a).

**Tasks:**

- DOM overlays: vignette, scanlines, glitch (zombie); Pixi visibility for stars, fireflies, character set swap.
- Terminal palette swap zombie (TRD table §2.2).

**Acceptance:** `zombie_mode_enter` / `exit` events; reduced motion (TRD §2.3).

**Implementation:** `useGardenStore` (`enterZombie` / `exitZombie` / `recordCoffeeClick` + analytics), `plausible.ts`, `App.tsx` (overlay divs + footer event list), `tokens.css` (overlays + terminal zombie), `Hud.tsx` (☕), `TerminalPanel.tsx`, `GardenController.ts` (night accents).

---

### Phase 12 — Ambient art

**Status:** Verified in repo (manual checklist + code paths + budget script).

**Verification (manual):**

- Enter hub: **grass tufts**, **cloud blobs**, **flying bird shapes**, and a **cat** silhouette appear above the ground band; birds **pause** when `prefers-reduced-motion: reduce`.
- Toggle **day / night / zombie**: grass/cloud/bird/cat **tints** update; night still shows Pixi stars/fireflies on the backdrop layer.
- Optional: add `public/sprites/ambient/ambient.json` + PNG per [.docs/AMBIENT_ASEPRITE.md](AMBIENT_ASEPRITE.md) with frame names containing `grass`, `cloud`, `bird`, or `cat` — reload; those layers should switch to **sprites** (animation tag name containing `bird` enables flying `AnimatedSprite`).
- Run `npm run check:ambient-png-budget` — should exit **0** while total PNG under `public/` is ≤ 2 MB.

**Code verification:**

- `syncAmbientArt` / `scheduleAmbientSheetLoad` / `resetAmbientArt` are only imported from `GardenController.ts` (`applyState`, `mount`, `destroy`).
- Optional fetch targets `/sprites/ambient/ambient.json` only (`loadAsepriteAmbient.ts` → `tryLoadAsepritesheetFromPublic`); missing file keeps procedural art with no console error from our code path.

**Deliverable:** Load sheets per TRD §7.1 phases; grass, clouds, birds, cats, etc.; Aseprite JSON format documented in `.docs` or README.

**Acceptance:** Asset size budget < 2MB PNG total (TRD §13.2); CI sum script optional.

**Implementation:** `src/pixi/ambient/syncAmbientArt.ts`, `src/pixi/ambient/loadAsepriteAmbient.ts`, `GardenController.ts` (mount/destroy/applyState hooks), `.docs/AMBIENT_ASEPRITE.md`, `public/sprites/README.md`, `scripts/check-ambient-png-budget.mjs`, `npm run check:ambient-png-budget`.

**Note:** “Character set swap” (Phase 11 task line) remains a **font / sprite** follow-up if the TRD expects glyph art in Pixi; not part of Phase 12 ambient layers.

---

### Phase 13 — Polish + ship

**Status:** Implemented in repo (docs + deploy config + a11y/SEO hooks + optional tooling + curated hub decor layer).

**Verification (manual):**

- **Skip link:** Tab from page load; “Skip to main content” appears and focuses `#main` (landing `<main id="main">` or hub `<main id="main">`).
- **Metadata:** View source or DevTools — title, description, `robots`, Open Graph, Twitter card fields present; set `NEXT_PUBLIC_SITE_URL` at build for `metadataBase` / canonical behavior.
- **Deploy:** Follow [.docs/DEPLOY_VERCEL.md](DEPLOY_VERCEL.md) — `outputDirectory` is **`out`**; smoke-test hub after first deploy.
- **A11y / Lighthouse:** Walk [A11Y_CHECKLIST.md](A11Y_CHECKLIST.md) and run Lighthouse against a local `serve out` build per [LIGHTHOUSE.md](LIGHTHOUSE.md).
- **PNG budget:** `npm run check:ambient-png-budget` exits 0.
- **PNG crunch (optional):** `npm run crunch:pngs -- --dry-run` lists files; `--apply` only with backup.
- **Curated art:** With `hub.json` + PNG under `public/sprites/characters/` or `components/` (see [CURATED_PIXEL_ASSETS.md](CURATED_PIXEL_ASSETS.md)), hub shows extra sprites on **`layer_hubDecor`** (tinted by day/night/zombie).

**Code verification:**

- `layer_hubDecor` is declared only in `GardenController.ts` layer list; `syncHubDecor` / `scheduleHubDecorSheetLoad` / `resetHubDecor` are only used from `GardenController.ts`.
- `tryLoadHubDecorSpritesheet` lives in `loadAsepriteAmbient.ts` and only fetches `characters/hub.json` then `components/hub.json`.
- `isAmbientMountStale` gates both ambient and hub decor async loads (`syncAmbientArt.ts` export).

**Deliverable:** A11y checklist TRD §17.2; Lighthouse targets PRD §12.1; `sharp` or build script for PNG crunch; Vercel deploy; env vars in dashboard.

**Acceptance:** Definition of Done in Kickoff §10 (use checklists above as the working substitute until spec is copied in-repo).

**Implementation:** `.docs/A11Y_CHECKLIST.md`, `.docs/LIGHTHOUSE.md`, `.docs/DEPLOY_VERCEL.md`, `.docs/CURATED_PIXEL_ASSETS.md`, `.docs/PNG_CRUNCH.md`, `vercel.json`, `public/robots.txt`, `src/app/layout.tsx` (skip link + metadata), `.env.example` (`NEXT_PUBLIC_SITE_URL`), `Landing.tsx` / `App.tsx` (`id="main"`), `scripts/crunch-public-pngs.mjs` + `sharp` devDependency, `src/pixi/hubDecor/syncHubDecor.ts`, `GardenController.ts`, `public/sprites/characters/README.md`, `public/sprites/components/README.md`.
---

## 4. Cross-cutting workstreams

| Workstream | Notes |
|------------|--------|
| **Analytics** | Plausible script + `section_visit`, `resume_download`, `recruiter_mode_open`, `contact_*`, `project_open`, `water_plant`, zombie events (TRD §11.2). |
| **Asset budget** | `npm run check:ambient-png-budget` — total PNG under `public/` vs 2 MB cap (Phase 12 / TRD §13.2). |
| **PNG crunch** | `npm run crunch:pngs -- --dry-run` or `--apply` — optional `sharp` pass ([PNG_CRUNCH.md](./PNG_CRUNCH.md)). |
| **Ship / SEO** | `vercel.json` + [DEPLOY_VERCEL.md](./DEPLOY_VERCEL.md); `NEXT_PUBLIC_SITE_URL` for metadata; `public/robots.txt`. |
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
