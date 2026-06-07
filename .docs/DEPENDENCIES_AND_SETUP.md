# Dependencies and setup — The Pixel Garden

Step-by-step for a fresh clone. Commands use **npm**; adapt for `pnpm`/`yarn` if you prefer.

---

## 1. Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | **20 LTS** or **22** | Next.js 14 + React 18 |
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
| `next` | Framework: App Router, dev server, build, static export (14.x → React 18) |
| `react` / `react-dom` | UI (18.x) |
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
| `sharp` | Optional lossy PNG crunch for `public/` ([PNG_CRUNCH.md](./PNG_CRUNCH.md)) |
| `tailwindcss` / `@tailwindcss/postcss` | Tailwind v4 + PostCSS plugin (Next pipeline) |
| `@types/node` | Node typings (`next.config`, `process.env`) |
| `@types/react` / `@types/react-dom` | React typings |
| `eslint` + `@eslint/js` + TS ESLint plugins | Lint (extend rules as needed) |
| `sharp` (optional devDependency) | PNG compression in a later build script |

**Fonts (CDN, not npm)**

- **Press Start 2P** and **VT323** — loaded from Google Fonts in `src/app/layout.tsx` (`<head>`) with `display=swap` (PRD §11.5, TRD §12).

**Analytics**

- **Plausible** — embedded via `next/script` (`<Script defer data-domain="…" src="https://plausible.io/js/script.js">`) in `src/app/layout.tsx`, or your self-hosted URL. No npm package required for the default embed. If you use an npm helper later, add it explicitly.

---

## 3. Environment variables

Create **`.env.local`** in the project root (never commit):

```env
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=
NEXT_PUBLIC_EMAILJS_SERVICE_ID=
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=
```

Optional mailbox fallback when EmailJS is not filled yet:

```env
NEXT_PUBLIC_CONTACT_MAILTO=you@example.com
```

Next.js exposes only variables prefixed with `NEXT_PUBLIC_` to client code (read via `process.env.NEXT_PUBLIC_*`).

### EmailJS template (Phase 9)

In the [EmailJS](https://www.emailjs.com/) dashboard, create an **email service** (e.g. Gmail) and an **email template** that includes these template parameters (names must match what `ContactForm` sends):

| Parameter | Meaning |
|-----------|---------|
| `{{from_name}}` | Visitor name |
| `{{reply_to}}` | Visitor email (use as “Reply-To” in your provider if supported) |
| `{{message}}` | Body text |
| `{{source}}` | Always `pixel-garden` from this app |

The contact UI lives in `src/components/modals/ContactForm.tsx` (lazy-loaded from `ModalLayer` via `next/dynamic`); config is read in `src/config/contactEmail.ts`. A **honeypot** field is included — leave it out of the template; bots that fill it get a silent success with no email sent (TRD default). When EmailJS is unset, set **`NEXT_PUBLIC_CONTACT_MAILTO`** for an optional **mailto** fallback link in the modal.

**Plausible:** successful sends fire `contact_submit`; configuration or network failures fire `contact_error` (with `reason` when applicable). For site-wide page views, the domain is configured in the script tag or dashboard — not always a `.env` entry.

---

## 4. Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Next dev server + Fast Refresh |
| `npm run build` | Type-check + static export to `out/` |
| `npm run start` | Serve a non-export production build (`next start`) |
| `npm run lint` | ESLint |
| `npm run check:ambient-png-budget` | Sum all `.png` bytes under `public/`; exits **1** if over 2 MB (TRD §13.2 / Phase 12). Override cap with `AMBIENT_PNG_BUDGET_BYTES`. |
| `npm run crunch:pngs` | Optional `sharp` recompress of `public/**/*.png`; default **dry-run** — pass `--apply` to overwrite (see [PNG_CRUNCH.md](./PNG_CRUNCH.md)). |

> With `output: "export"`, `npm run build` writes a static site to `out/`. Serve it with any static host (e.g. `npx serve out`).

---

## 5. First-time checklist

1. `npm install`
2. Copy `.env.example` → `.env.local` and fill **`NEXT_PUBLIC_EMAILJS_*`** for the contact form (see §3 + EmailJS template subsection).
3. Replace `src/content/projects.json` with your real portfolio rows (validate with Zod; respect tier rules for `keyFeatures`).
4. Add `public/resume.pdf` (or wire URL) before resume download features.
5. Add sprites under `public/sprites/` per TRD §14 as art becomes available.
6. Deploy on Vercel (or any static host): set the same `NEXT_PUBLIC_*` env vars in Project Settings.

---

## 6. Optional / later adds

| Item | When |
|------|------|
| `sharp` + npm script | Phase 13 asset pipeline |
| `@next/bundle-analyzer` | When optimising chunks vs TRD §13.2 |
| `@pixi/spritesheet` | If you prefer the dedicated package over `Assets` / `Spritesheet` from `pixi.js` (PRD mentions it — evaluate bundle) |

---

## 7. Reproduce scaffold from zero (Kickoff §9)

If you ever recreate the app in an empty folder:

```bash
npx create-next-app@14 pixel-garden --ts --app --src-dir --eslint --no-tailwind --import-alias "@/*"
cd pixel-garden
npm install pixi.js zustand framer-motion gsap @emailjs/browser @fontsource/dm-sans zod
npm install -D tailwindcss @tailwindcss/postcss
```

Then add `output: "export"` to `next.config.mjs`, create `postcss.config.mjs` (`@tailwindcss/postcss`), wire `src/app/layout.tsx` + `src/app/page.tsx`, `src/styles`, and folder layout per `.docs/IMPLEMENTATION_PLAN.md`. This repo already applies those steps.
