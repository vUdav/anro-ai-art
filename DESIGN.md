---
name: Anro — AI Creator
description: A dark diffusion studio where noise resolves into neon-lit work.
colors:
  bg-900: "#05060f"
  bg-800: "#0a0b16"
  bg-700: "#10121f"
  text-100: "#f4f6ff"
  text-200: "#c7cbe6"
  text-300: "#8f95bd"
  text-500: "#5b608a"
  neon-cyan: "#22d3ee"
  neon-blue: "#4d7cff"
  neon-violet: "#8b5cf6"
  neon-pink: "#ec4899"
  surface-veil: "rgba(255,255,255,0.04)"
  surface-glass: "rgba(255,255,255,0.05)"
  surface-line: "rgba(255,255,255,0.09)"
typography:
  display:
    fontFamily: "Sora, system-ui, sans-serif"
    fontSize: "clamp(3rem, 7vw, 8rem)"
    fontWeight: 800
    lineHeight: 0.9
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Sora, system-ui, sans-serif"
    fontSize: "clamp(2rem, 6vw, 3.5rem)"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Sora, system-ui, sans-serif"
    fontSize: "clamp(1.4rem, 2.6vw, 2.2rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "normal"
  body:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "clamp(0.95rem, 1.3vw, 1.05rem)"
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: "normal"
  label:
    fontFamily: "Sora, system-ui, sans-serif"
    fontSize: "clamp(0.78rem, 3vw, 1rem)"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.42em"
rounded:
  xs: "8px"
  sm: "14px"
  md: "18px"
  lg: "24px"
  pill: "999px"
components:
  button-order:
    backgroundColor: "transparent"
    textColor: "{colors.text-100}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0.6rem 1.35rem"
  nav-link:
    textColor: "{colors.text-200}"
    backgroundColor: "transparent"
  nav-link-hover:
    textColor: "{colors.text-100}"
  chip:
    backgroundColor: "{colors.surface-veil}"
    textColor: "{colors.text-200}"
    rounded: "{rounded.sm}"
    padding: "0.35rem 0.8rem"
  work-card:
    backgroundColor: "{colors.surface-veil}"
    rounded: "{rounded.md}"
  glass-card:
    backgroundColor: "{colors.surface-glass}"
    textColor: "{colors.text-200}"
    rounded: "{rounded.lg}"
---

# Design System: Anro — AI Creator

## Overview

**Creative North Star: "The Diffusion Studio"**

The whole interface behaves like a diffusion model mid-reveal: it starts as dark, near-black noise and resolves into sharp, neon-lit work. The hero literally performs this — a field of particles denoises into the word **ANRO** — and every other surface inherits that logic. Deep space (`#05060f`) is the default state of everything; light, color, and definition are earned, appearing where attention should land (a title, an accent border on hover, a portrait, a piece of work) and nowhere else. The result is cinematic, electric, and unmistakably about neural-network image-making, without ever announcing "AI" with clip-art robots or circuit motifs.

Density is generous and gallery-like: large fluid type, big media, wide breathing room on a 1200px stage. The mood is dark and futuristic but never cold — warm neon (cyan → violet → pink) keeps it alive, and glass panels give it depth without weight. This is an Experience-led portfolio first: the artifact leads, the interface recedes to thin borders, translucent glass, and quiet labels.

**Key Characteristics:**
- Near-black canvas as the resting state; light and color are earned, not ambient.
- A single neon gradient (cyan → violet → pink) is the one voice of accent across the whole system.
- Glassmorphism for depth: translucent panels + backdrop-blur, not drop shadows.
- Huge Sora display type against small, wide-tracked Sora labels; Manrope for calm reading.
- Neon reacts to state (hover, focus, reveal); it does not sit on large static areas.

## Colors

A deep near-black field lit by a single tri-stop neon gradient; everything else is a cool blue-grey neutral ramp.

### Primary
- **Electric Cyan** (`#22d3ee`): the leading edge of the accent gradient and the focus-ring color. Opens the `--grad-primary` sweep, powers accent dots and glow. The coolest, brightest point of light in the system.
- **Neon Ultramarine** (`#4d7cff`): the mid-cool bridge inside gradient borders and glows; rarely used alone, it keeps cyan and violet from clashing.
- **Electroviolet** (`#8b5cf6`): the gravitational center of the palette (the gradient's 55% midpoint), the dominant hue of the hero glow and the cursor/hover glow behind the order button.
- **Neon Fuchsia** (`#ec4899`): the warm terminator of the gradient and the `--glow-pink` accent; the emotional warmth (used in the heart easter egg) at the pink end.

### Neutral
- **Void** (`#05060f`, `bg-900`): the page background and the resting state of every surface.
- **Ink 800 / 700** (`#0a0b16` / `#10121f`): slightly raised near-black tones for layered sections and section-gradient midpoints.
- **Starlight** (`#f4f6ff`, `text-100`): primary headings and high-emphasis text.
- **Haze** (`#c7cbe6`, `text-200`): body copy and default nav — the workhorse reading color.
- **Muted Indigo** (`#8f95bd`, `text-300`): secondary labels and captions.
- **Deep Slate** (`#5b608a`, `text-500`): disabled/inactive text (e.g. not-yet-built nav items).

### Surface tints (glass)
- **Surface Veil** (`rgba(255,255,255,0.04)`) and **Surface Glass** (`rgba(255,255,255,0.05)`): translucent fills for cards and panels over the dark field.
- **Surface Line** (`rgba(255,255,255,0.09)`): the 1px hairline that defines glass edges at rest.

### Named Rules
**The One Gradient Rule.** There is exactly one accent voice — `linear-gradient(110deg, cyan, violet 55%, pink)`. Accents are drawn from it (as text clip, 1px border, dot, or glow); never introduce a second unrelated accent hue.

**The Earned-Light Rule.** Neon never fills a large static area. It appears as a hairline, a small mark, a glow, or clipped text — reacting to hierarchy or state. If a neon region is bigger than a control or a line of text, it's wrong.

## Typography

**Display Font:** Sora (with system-ui, sans-serif)
**Body Font:** Manrope (with system-ui, sans-serif)

**Character:** Sora carries everything expressive — from an 800-weight wall of a name to tiny 0.42em-tracked uppercase labels — giving the system a precise, engineered, slightly futuristic voice. Manrope handles running text with a calm, humanist counter-tone so long descriptions stay comfortable against the dark field.

### Hierarchy
- **Display** (Sora 800, `clamp(3rem, 7vw, 8rem)`, line-height 0.9): the name/hero wordmark and the huge editorial name in About. Tight tracking (-0.01em), often set as outline (`-webkit-text-stroke`) for the second line.
- **Headline** (Sora 800, `clamp(2rem, 6vw, 3.5rem)`, line-height 1): section titles ("Работы").
- **Title** (Sora 700, `clamp(1.4rem, 2.6vw, 2.2rem)`, line-height 1.1): work/modal/card titles and the About card heading.
- **Body** (Manrope 400, `clamp(0.95rem, 1.3vw, 1.05rem)`, line-height 1.7): descriptions and bios; the only relaxed line-height in the system.
- **Label** (Sora 600, `clamp(0.78rem, 3vw, 1rem)`, letter-spacing 0.42em, UPPERCASE): eyebrows and section kickers, almost always wearing the gradient via `.text-gradient`.

### Named Rules
**The Gradient Eyebrow Rule.** Every section opens with an uppercase, wide-tracked (0.42em) Sora label clipped to the neon gradient (`.text-gradient`). It is the recurring signature that ties sections together.

**The Outline-Name Rule.** When a name breaks to two display lines, the second line is set as a translucent outline (`color: transparent; -webkit-text-stroke`), so scale reads without doubling the visual weight.

## Layout

A single centered stage capped at **1200px** (`--maxw`), with fluid gutters that grow by breakpoint (`clamp(1.25rem, 5vw, 4rem)`). Vertical rhythm is fluid too — sections pad `clamp(4rem, 9vh, 8rem)` top/bottom — so spacing scales with the viewport instead of snapping between fixed steps.

Mobile-first, min-width breakpoints, applied via a local `@mixin up()`: **sm 480 · md 768 · lg 1024 · xl 1280 · 2xl 1600** (the header flips to a burger at its own **860** threshold). The signature move is a layered composition that collapses to a stack: on desktop the hero name, portrait, and glass card overlap in absolute layers; below **lg** they reflow into a single vertical column. The works grid steps **1 → 2 → 3 → 4** columns across sm/lg/xl with one equal `gap` (`clamp(0.85rem, 1.6vw, 1.25rem)`) on both axes.

### Named Rules
**The One Stage Rule.** Content lives on a 1200px centered stage; full-bleed is reserved for the fixed header's glass and section backgrounds, never for reading content.

**The Equal-Gap Rule.** Grid rows and columns share one gap value, and cards are forced to equal height/width (fixed-ratio media crop) so the grid reads as a true lattice, never a masonry.

## Elevation & Depth

Flat by default, with depth built from **translucent glass over a dark field plus neon glow on state** — not from drop shadows. Surfaces are near-black or `surface-veil`/`surface-glass` fills with a 1px `surface-line` edge and `backdrop-filter: blur(16–24px)`; layering (a card over the hero, the header over content, the modal over everything) is what conveys height. Shadows exist only as deep, soft ambience under floating glass (modals, the About card) and as neon glow that appears on hover/focus.

### Shadow Vocabulary
- **Ambient card** (`box-shadow: 0 24px 70px rgba(0,0,0,0.5)`): under the About glass card and raised panels — diffuse, almost a darkening, never a hard edge.
- **Ambient modal** (`box-shadow: 0 40px 120px rgba(0,0,0,0.6)`): the work modal floating over the blurred page.
- **Card hover lift** (`box-shadow: 0 20px 50px rgba(0,0,0,0.45)`): appears only on hover/focus of interactive cards.
- **Neon glow — cyan** (`0 0 40px rgba(34,211,238,0.5)`) and **pink** (`0 0 40px rgba(236,72,153,0.45)`): reserved for accent marks and stateful emphasis (`--glow-cyan`, `--glow-pink`).

### Named Rules
**The Glass-Not-Shadow Rule.** Convey depth with translucency + blur + a hairline edge first; reach for a shadow only for genuinely floating glass (modal, primary card). Never use a shadow to fake a raised button.

**The Glow-On-State Rule.** Neon glow is a response, not a resting decoration — it turns on with hover/focus/reveal and turns off otherwise.

## Shapes

A soft-but-precise radius language. Corners are consistently rounded, scaling with the element's size: chips at **14px** (`sm`), work cards at **18px** (`md`), glass cards/panels/modals at **24px** (`lg`), and fully pill-shaped (**999px**) for the order button and language/tag pills. Edges are defined by a single hairline (1px `surface-line`) at rest; the accent gradient becomes a 1px masked ring only on hover/focus (mask-composite border technique). Media is always clipped to a fixed ratio (works grid at 4:5) so previews crop rather than vary. No sharp 0-radius corners, no heavy or decorative borders.

### Named Rules
**The Radius-By-Scale Rule.** Bigger container → bigger radius (chip 14 → card 18 → panel 24). Never mix a large panel with a tight chip radius.

**The Hairline-to-Neon Rule.** Borders rest as a 1px translucent white hairline and escalate to a 1px neon-gradient ring on hover/focus — the border is where interactivity is expressed.

## Components

Components are precise and electric: crisp geometry, thin gradient borders, neon that answers state. No fills-by-default, no heavy chrome.

### Buttons
- **Shape:** fully pill (`999px`).
- **Order (primary CTA):** transparent fill with a 1px neon-gradient ring (mask-composite border), Sora 600 label in Starlight (`text-100`), padding `0.6rem 1.35rem`. Deliberately bright but not dominant — the ring carries the color, not a fill.
- **Hover / Focus:** a soft neon glow **follows the cursor** inside the button (radial violet spotlight tracked via `--mx/--my`), the gradient ring shifts its position, and a faint gradient fill (~0.14 opacity) plus a violet ambient shadow rise. No vertical translate.

### Chips (tags)
- **Style:** `surface-veil` fill, 1px `surface-line` border, pill/`sm` radius, Haze (`text-200`) text at ~0.8rem.
- **State:** static/descriptive (tags on works and the About card); not interactive filters.

### Cards / Containers
- **Corner Style:** work cards `18px` (`md`); the featured/About glass card `24px` (`lg`).
- **Background:** `surface-veil` (cards) or `surface-glass` + `backdrop-filter: blur(20px)` (glass card).
- **Shadow Strategy:** flat at rest; hover raises the "Card hover lift" shadow and a 1px neon ring (see Elevation).
- **Border:** 1px `surface-line` at rest.
- **Internal Padding:** fluid, `clamp(1.5rem, 3vw, 2.5rem)` for glass cards; tight `0.85rem 1rem` for work-card captions.
- **Media:** clipped to a fixed 4:5 ratio and cropped (`object-fit: cover`), so all previews are identical height.

### Navigation
- **Style:** a fixed, full-width top bar that is invisible over the hero and **resolves out of blur** as the second section approaches (opacity + de-blur driven by scroll), then stays. Background is a top-anchored gradient that progressively blurs the content beneath it (masked `backdrop-filter`), with no bottom border.
- **Links:** Manrope 500, Haze (`text-200`) → Starlight (`text-100`) on hover; not-yet-built destinations sit disabled in Deep Slate (`text-500`).
- **Language switch:** three Sora 600 pills (RU/EN/BE); active one gets a faint white veil and Starlight text.
- **Mobile (< 860):** burger on the left, order button on the right; the panel expands its height smoothly (animated, not snapped) as a glass sheet.

### Signature Component — Diffusion Hero
A full-viewport canvas where neon particles denoise from noise into "ANRO," with an interactive cursor repel, a click ripple, and the hidden "1369 → heart" easter egg. It is the literal statement of the North Star and the one place motion is the content, not a garnish.

### Work Modal
A teleported overlay: the page dims and blurs, a 24px glass panel floats in (ambient-modal shadow) with media on the left and title/tags/description on the right. Video autoplays muted, looped, with controls; images crop to fill. Closes on ×, Esc, or backdrop click, with scroll locked and focus managed.

## Do's and Don'ts

### Do:
- **Do** keep the resting state near-black (`#05060f`) and let light/color be earned by hierarchy or interaction.
- **Do** draw every accent from the one gradient `linear-gradient(110deg, #22d3ee, #8b5cf6 55%, #ec4899)` — as clipped text, a 1px ring, a dot, or a glow.
- **Do** open each section with the uppercase 0.42em gradient eyebrow (`.text-gradient`).
- **Do** build depth from translucent glass + `backdrop-filter` + a 1px `surface-line`; add a soft ambient shadow only for genuinely floating glass.
- **Do** honor `prefers-reduced-motion` — the canvas, reveals, and modal transitions must degrade to static.
- **Do** crop media to a fixed ratio so grids stay an even lattice with one shared gap.

### Don't:
- **Don't** ship a light/white "SaaS" surface or corporate-clean look — this world is dark.
- **Don't** paint neon across large static areas or stack multiple rainbow hues; accent is small and singular.
- **Don't** use skeuomorphism, glossy chrome, or heavy drop-shadows to fake raised buttons.
- **Don't** introduce blurred "AI-slop" gradient blobs or generic stock imagery; the real work and the diffusion motif are the imagery.
- **Don't** let a border sit as a hard 0-radius or thick line — edges are a 1px hairline that escalates to a 1px neon ring on state.
