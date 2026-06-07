---
name: Pixel Garden
colors:
  surface: '#fff9ec'
  surface-dim: '#e0dac9'
  surface-bright: '#fff9ec'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#faf3e2'
  surface-container: '#f4eddd'
  surface-container-high: '#eee8d7'
  surface-container-highest: '#e9e2d2'
  on-surface: '#1e1c12'
  on-surface-variant: '#3f4a3d'
  inverse-surface: '#333025'
  inverse-on-surface: '#f7f0df'
  outline: '#6f7a6c'
  outline-variant: '#becaba'
  surface-tint: '#006e22'
  primary: '#006e22'
  on-primary: '#ffffff'
  primary-container: '#5dbb63'
  on-primary-container: '#004713'
  inverse-primary: '#7cdb7f'
  secondary: '#705d00'
  on-secondary: '#ffffff'
  secondary-container: '#fcd400'
  on-secondary-container: '#6e5c00'
  tertiary: '#0c6780'
  on-tertiary: '#ffffff'
  tertiary-container: '#6ab1cd'
  on-tertiary-container: '#004355'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#98f899'
  primary-fixed-dim: '#7cdb7f'
  on-primary-fixed: '#002105'
  on-primary-fixed-variant: '#005317'
  secondary-fixed: '#ffe16d'
  secondary-fixed-dim: '#e9c400'
  on-secondary-fixed: '#221b00'
  on-secondary-fixed-variant: '#544600'
  tertiary-fixed: '#baeaff'
  tertiary-fixed-dim: '#89d0ed'
  on-tertiary-fixed: '#001f29'
  on-tertiary-fixed-variant: '#004d62'
  background: '#fff9ec'
  on-background: '#1e1c12'
  surface-variant: '#e9e2d2'
  ui-text: '#2C1810'
  pot-terracotta: '#E2725B'
  night-sky: '#0D1B2A'
  night-ground: '#2D5016'
  zombie-accent: '#00FF41'
  zombie-bg: '#0A0A0A'
typography:
  headline-lg:
    fontFamily: Press Start 2P
    fontSize: 24px
    fontWeight: '400'
    lineHeight: 32px
    letterSpacing: 0.05em
  headline-md:
    fontFamily: Press Start 2P
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-lg:
    fontFamily: DM Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: DM Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  terminal-output:
    fontFamily: VT323
    fontSize: 20px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: Press Start 2P
    fontSize: 8px
    fontWeight: '400'
    lineHeight: 12px
  headline-lg-mobile:
    fontFamily: Press Start 2P
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
spacing:
  tile-base: 16px
  tile-scaled: 48px
  gutter: 16px
  margin-ui: 24px
  touch-target: 44px
---

## Brand & Style

The design system is built on a **Cozy Retro / RPG** aesthetic, blending the nostalgia of 8-bit gaming with the warmth of a "digital garden." It prioritizes atmosphere, immersion, and tactile delight over traditional corporate efficiency. The brand personality is optimistic, organic, and playful, designed to evoke the calm satisfaction of games like Stardew Valley.

The style is characterized by:
- **Upscaled Pixel Art:** A strict adherence to pixel-perfect rendering using a 3x scale factor (48px tiles).
- **Thematic Layering:** Using spatial metaphors (top-down perspective) to organize information.
- **Micro-Interactions:** Delightful, non-functional gestures (like watering plants) that reinforce the metaphor.
- **Narrative UI:** Interfaces that feel like physical objects within the world (parchment dialogue boxes, terracotta accents).

## Colors

The palette is rooted in nature-inspired tones that shift based on the "time of day" or system state. 

- **Primary (Ground):** A lush green used for the main environment surface.
- **Secondary (Accent):** A warm gold for highlights, active states, and interactive props.
- **Tertiary (Sky):** A soft blue used for page backgrounds and atmospheric depth.
- **Neutral (UI BG):** A warm "parchment" white used for all dialogue boxes and panels to ensure readability without harsh contrast.

**Color Modes:**
- **Day (Default):** Warm, high-saturation, and inviting.
- **Night:** Deep blues and muted greens with glowing gold accents.
- **Zombie:** High-contrast black and "matrix" green, utilizing a red vignette overlay for a glitch-inspired aesthetic.

## Typography

Typography acts as a functional signifier for the "layer" of the application the user is currently interacting with:

1.  **World UI/HUD ('Press Start 2P'):** Used for high-level navigation, dialogue headers, and labels. It must always be rendered with `image-rendering: pixelated` to prevent blurring.
2.  **Information Layer ('DM Sans'):** Used for long-form content, project descriptions, and "About" text. This provides a modern, readable contrast to the stylized environment.
3.  **System Layer ('VT323'):** Reserved exclusively for terminal outputs, code snippets, and the resume interface.

**Rules:**
- Maintain 8px increments for pixel font sizing to ensure glyph alignment.
- Use a typewriter reveal effect for dialogue and terminal text to enhance the retro feel.

## Layout & Spacing

The layout is governed by a **Tile-Based Grid** rather than a traditional fluid web grid. All spatial arrangements must align with the 16px (base) / 48px (scaled) grid logic.

- **World View:** A fixed-aspect canvas (1200x700px) that pans and zooms. Content is placed contextually within the "garden."
- **HUD & Modals:** UI elements are anchored to the corners or center of the viewport with a consistent 24px margin from the screen edge.
- **Breakpoints:**
    - **Desktop (>= 1024px):** Side-panel overlays allow the world to remain visible.
    - **Mobile (< 768px):** All panels become full-screen overlays. The HUD collapses into a bottom-aligned tab bar for thumb-friendly navigation.

## Elevation & Depth

This design system eschews modern drop shadows in favor of **Z-Index Layering** and **Perspective Shifts**.

- **Perspective:** A consistent 2D top-down "RPG" view.
- **Depth via Camera:** Moving "deeper" into content is achieved through camera zooms (Level 2 Navigation) rather than opening new pages.
- **Tonal Layering:** UI panels (Neutral) sit atop the World layer (Primary/Tertiary). 
- **Active State Glow:** Instead of elevation shadows, interactive elements (like plants) use a "soft pixel glow" or a brightness increase when hovered or focused.
- **Shadows:** If used, they must be "hard" pixel shadows—solid blocks of a darker hue (e.g., #2C1810 at 20% opacity) shifted 1-2 pixels down and right.

## Shapes

The shape language is **Strictly Geometric and Aliased**. 

- **Corners:** All UI panels, buttons, and input fields must have 0px border radius.
- **Borders:** Use "Step-Borders" or double-pixel borders (2px solid #2C1810) to mimic the look of classic game UI boxes.
- **Sprites:** Plant life and organic elements should maintain their jagged pixel edges. Avoid any CSS blurring or anti-aliasing features (`image-rendering: crisp-edges` or `pixelated` is mandatory).

## Components

### Buttons
Buttons should appear as "pressed" when active. Use a 2px inset border of a darker shade for the "unpressed" state and swap to a lighter top/left border when "pressed." 
- **Font:** 'Press Start 2P' (8px or 12px).
- **Feedback:** 2px vertical shift on click.

### Dialogue Boxes (Cards)
Used for project details and NPC interactions.
- **Background:** #FFF8E7 (Parchment).
- **Border:** 4px "double-line" pixel border in Dark Brown.
- **Header:** Title centered in 'Press Start 2P'.

### Terminal
A dedicated component for the Resume and Code sections.
- **Background:** Solid Black (#0A0A0A) or Dark Brown (#1C1408).
- **Text:** #00FF41 (Green) or #E8D5B0 (Cream) using 'VT323'.
- **Features:** Blinking underscore cursor.

### Input Fields
- **Style:** Inset pixel border to create a "recessed" look.
- **Focus State:** 2px gold (#FFD700) solid border.

### Chips/Labels
- Small rectangular boxes with 'Press Start 2P' (8px). 
- Used for project tags (e.g., "React", "PixiJS").

### Inventory/HUD
A persistent bar (bottom for mobile, top/side for desktop) containing the "Watering Can" tool and the "Mode Switcher." Icons must be custom 16x16 pixel sprites.