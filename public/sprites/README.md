# Sprites

Place Aseprite exports here per TRD §14:

- `landing/` — `landing.json` + `landing.png`
- `hub/` — hub environment sheets
- `plants/`, `character/`, `ambient/`, `ui_world/` — as art lands
- **`characters/`**, **`components/`** — curated hub decor (`hub.json`); see [.docs/CURATED_PIXEL_ASSETS.md](../../.docs/CURATED_PIXEL_ASSETS.md)

**Phase 12 — ambient:** procedural fallback is always on; optional **`ambient/ambient.json`** + image (see [.docs/AMBIENT_ASEPRITE.md](../../.docs/AMBIENT_ASEPRITE.md)) swaps grass/clouds/bird/cat when frame names match the documented patterns.

Use **2048×2048** max per sheet unless profiling allows larger.
