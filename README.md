# The Pixel Garden

Personal portfolio — **The Pixel Garden** — per PRD v1.2 / TRD v1.0.

## Docs

- [Implementation plan](.docs/IMPLEMENTATION_PLAN.md) — phased delivery
- [Dependencies & setup](.docs/DEPENDENCIES_AND_SETUP.md) — install, env, scripts
- [Ambient Aseprite / hub art](.docs/AMBIENT_ASEPRITE.md) — Phase 12 sheets + naming
- [Curated characters & components](.docs/CURATED_PIXEL_ASSETS.md) — Phase 13 `hub.json` layout
- [Accessibility checklist](.docs/A11Y_CHECKLIST.md) — TRD §17.2 manual pass
- [Lighthouse](.docs/LIGHTHOUSE.md) — PRD §12.1 guidance
- [Deploy to Vercel](.docs/DEPLOY_VERCEL.md) — static `out/` + env
- [PNG crunch (optional)](.docs/PNG_CRUNCH.md) — `sharp` script

## Quick start

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and set **`NEXT_PUBLIC_EMAILJS_*`** for the contact form, **`NEXT_PUBLIC_CONTACT_MAILTO`** (optional mailto fallback), plus any other secrets you add later.

For the **terminal `resume` command** and resume HUD action, add `public/resume.pdf` before deploy so the static download works. Optional **ambient** PNGs: keep total PNG under `public/` within budget (`npm run check:ambient-png-budget`); see [Ambient Aseprite / hub art](.docs/AMBIENT_ASEPRITE.md).

## Stack

Next.js 14 (App Router, static export), React 18, TypeScript 5, Tailwind CSS v4, Zustand, Zod (projects content), PixiJS v8, Framer Motion, GSAP, `@fontsource/dm-sans`, `@emailjs/browser` — see `.docs/DEPENDENCIES_AND_SETUP.md`.
