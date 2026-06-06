# Dependencies and setup — The Pixel Garden

Step-by-step for a fresh clone. Commands use **npm**; adapt for `pnpm`/`yarn` if you prefer.

---

## 1. Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | **20 LTS** or **22** | Vite 5 + React 18 |
| npm | 10+ | Comes with Node |

Optional: **Aseprite** for sprites; **Vercel CLI** for previews.

---

## 2. Install runtime + dev dependencies

From the repository root:

```bash
npm install
```

### What `package.json` includes

**Runtime**

| Package | Role |
|---------|------|
| `react` / `react-dom` | UI (18.x) |
| `vite` | Build + dev server (5.x) |
| `pixi.js` | WebGL garden (v8). **Note:** TRD references `@pixi/events`; Pixi v8 ships the event system in-tree — enable `EventSystem` via `pixi.js` when wiring the canvas (there is no separate `@pixi/events@8` on npm). |
| `zustand` | Global UI + camera shared state |
| `framer-motion` | DOM overlays / HUD motion (v11) |
| `gsap` | Camera tweening (TRD — not in PRD table) |
| `@emailjs/browser` | Contact form (v4) |
| `@fontsource/dm-sans` | Body font weights 400, 700 (self-hosted) |
| `zod` | `projects.json` validation |

**Dev**

| Package | Role |
|---------|------|
| `typescript` | TS 5 |
| `@vitejs/plugin-react` | React refresh + JSX |
| `tailwindcss` / `@tailwindcss/vite` | Tailwind v4 + Vite plugin |
| `@types/react` / `@types/react-dom` | React typings |
| `eslint` + `@eslint/js` + TS ESLint plugins | Lint (extend rules as needed) |
| `vite-bundle-visualizer` (optional) | Bundle size checks vs TRD §13.2 |
| `sharp` (optional devDependency) | PNG compression in a later build script |

**Fonts (CDN, not npm)**

- **Press Start 2P** and **VT323** — loaded from Google Fonts in `index.html` with `display=swap` (PRD §11.5, TRD §12).

**Analytics**

- **Plausible** — typically a `<script defer data-domain="…" src="https://plausible.io/js/script.js">` in `index.html`, or your self-hosted URL. No npm package required for the default embed. If you use an npm helper later, add it explicitly.

---

## 3. Environment variables

Create **`.env.local`** in the project root (never commit):

```env
VITE_EMAILJS_PUBLIC_KEY=
VITE_EMAILJS_SERVICE_ID=
VITE_EMAILJS_TEMPLATE_ID=
```

Vite exposes only variables prefixed with `VITE_` to client code.

**Plausible:** domain is configured in the script tag or dashboard — not always a `.env` entry.

---

## 4. Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server + HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve `dist/` locally |
| `npm run lint` | ESLint |

---

## 5. First-time checklist

1. `npm install`
2. Copy `.env.example` → `.env.local` and fill EmailJS keys when implementing contact (Phase 9).
3. Replace `src/content/projects.json` with your real portfolio rows (validate with Zod; respect tier rules for `keyFeatures`).
4. Add `public/resume.pdf` (or wire URL) before resume download features.
5. Add sprites under `public/sprites/` per TRD §14 as art becomes available.
6. Deploy on Vercel: set the same `VITE_*` env vars in Project Settings.

---

## 6. Optional / later adds

| Item | When |
|------|------|
| `sharp` + npm script | Phase 13 asset pipeline |
| `vite-bundle-visualizer` | When optimising chunks |
| `@pixi/spritesheet` | If you prefer the dedicated package over `Assets` / `Spritesheet` from `pixi.js` (PRD mentions it — evaluate bundle) |

---

## 7. Reproduce scaffold from zero (Kickoff §9)

If you ever recreate the app in an empty folder:

```bash
npm create vite@latest pixel-garden -- --template react-ts
cd pixel-garden
npm install
npm install pixi.js zustand framer-motion gsap @emailjs/browser @fontsource/dm-sans zod
npm install -D tailwindcss @tailwindcss/vite
```

Then align `vite.config.ts`, `src/styles`, and folder layout with `.docs/IMPLEMENTATION_PLAN.md`. This repo already applies those steps.
