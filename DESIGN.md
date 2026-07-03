---
name: TypeBeatOS
description: Studio-grade tool that turns a beat into a ready-to-ship YouTube upload package.
colors:
  signal-red: "#ed072c"
  signal-red-deep: "#b30420"
  blush: "#ff8d94"
  ink: "#ffffff"
  void: "#000000"
  surface: "#ffffff06"
  surface-raised: "#ffffff08"
  border: "#ffffff14"
  muted: "#ffffff99"
  faint: "#ffffff80"
  success: "#6ee7a1"
  warning: "#ffd166"
typography:
  display:
    fontFamily: "Bebas Neue, Impact, sans-serif"
    fontSize: "clamp(2.25rem, 4vw, 3.25rem)"
    fontWeight: 400
    lineHeight: 0.95
    letterSpacing: "-0.01em"
  metric:
    fontFamily: "Bebas Neue, Impact, sans-serif"
    fontSize: "clamp(2.25rem, 3vw, 2.85rem)"
    fontWeight: 400
    lineHeight: 0.9
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Schibsted Grotesk, system-ui, sans-serif"
    fontSize: "1.05rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Schibsted Grotesk, system-ui, sans-serif"
    fontSize: "0.7rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.22em"
rounded:
  xs: "0.3rem"
  sm: "0.6rem"
  field: "0.75rem"
  panel: "0.85rem"
  lg: "1rem"
  card: "1.25rem"
  pill: "9999px"
spacing:
  xs: "0.4rem"
  sm: "0.75rem"
  md: "1.25rem"
  lg: "1.75rem"
  xl: "2.5rem"
components:
  button-primary:
    backgroundColor: "{colors.signal-red}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0.7rem 1.4rem"
  button-ghost:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0.7rem 1.4rem"
  button-danger:
    backgroundColor: "{colors.void}"
    textColor: "{colors.blush}"
    rounded: "{rounded.pill}"
    padding: "0.7rem 1.4rem"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "1.75rem"
  input:
    backgroundColor: "#00000059"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "0.75rem 0.9rem"
  badge:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.faint}"
    rounded: "{rounded.pill}"
    padding: "0.2rem 0.7rem"
  nav-link:
    backgroundColor: "#00000000"
    textColor: "{colors.muted}"
    rounded: "{rounded.pill}"
    padding: "0.4rem 0.85rem"
---

# Design System: TypeBeatOS

## 1. Overview

**Creative North Star: "After-Hours Studio"**

A producer working a beat at 2 a.m. in a blacked-out room, one red light on. The
interface is that room: a true-black surface where everything recedes except the
work in front of you, lit by a single brand red that behaves like signal — it
glows where something is live, active, or about to ship, and stays dark
everywhere else. The mood is focus, not spectacle.

This is a **product**, not a poster. Design serves the workflow (beat → package
→ schedule → upload → analytics); it never competes with it. Screens carry a lot
of metadata, so the system leans on space, hairline structure, and a strict
accent budget to keep density reading as *control*, not clutter. The voice is
studio-grade and refined: condensed display type for headings and big numbers,
quiet Schibsted Grotesk for everything you actually read, restrained motion. Identity comes
from the black-and-red contrast and the typography — not from decoration.

It explicitly rejects the **cluttered, busy dashboard**: no wall of panels, no
competing accents, no chart-junk. One primary action per screen.

**Key Characteristics:**
- True-black canvas (`#000`) with translucent white surfaces layered on top
- A single brand red (`#ed072c`) used as *signal*, on a tight budget
- Condensed display type (Bebas Neue) for headings + metrics; Schibsted Grotesk for body
- Flat surfaces lit from within (inset highlight) + ambient red glow — not drop shadows
- Refined, restrained motion: subtle hover lift, crisp focus, nothing bouncy

## 2. Colors

A monochrome black-and-white field with one decisive red. Status hues (green,
amber) appear only inside badges, never as general UI color.

**Two themes, one system.** Every surface color reads a semantic token from
`app/globals.css`. `:root` carries the dark **After-Hours Studio** theme (brand
default, documented below); `[data-theme="light"]` carries the **Daylight
Studio** counterpart — true off-white `#f6f4f4` at the brand's hue, near-black
ink `#141114`, white cards with soft shadows instead of translucent glass, the
same Signal Red. The readable-red role (`--accent-ink`) is Blush `#ff8d94` on
dark and Signal Red Deep `#b30420` on light; status inks darken to stay ≥4.5:1.
The choice persists per device (`localStorage("tb-theme")`, applied pre-paint).
**Never hardcode a surface or text color — read the token.** Only true
white-on-red (primary buttons, red flags) stays literal `#fff` in both themes.

### Primary
- **Signal Red** (`#ed072c`): The brand. The primary button (a `#ed072c → #b30420` gradient), active nav state, focus rings, and the live page glow. It means *active / live / ship*. Spend it sparingly.
- **Signal Red Deep** (`#b30420`): The darker end of the primary gradient and pressed states. Never used alone as text.

### Secondary
- **Blush** (`#ff8d94`): The soft red. Links, hover text, error copy, the "scheduled" badge, and danger-button text. It's red turned down to a readable tint for text on black where full Signal Red would vibrate.

### Neutral
- **Ink** (`#ffffff`): Primary text and headings on the black field.
- **Void** (`#000000`): The page surface. Everything is built up from black.
- **Surface** (`#ffffff06`) / **Surface Raised** (`#ffffff08`): Translucent white fills for cards, stats, and badges — barely-there panels that read as glass over black.
- **Border** (`#ffffff14`): Hairline 1px dividers and card edges.
- **Muted** (`#ffffff99`) / **Faint** (`#ffffff80`): Secondary and tertiary text. Muted is the floor for body copy on black; do not go lighter for anything a user must read.

### Status (badges only)
- **Success Green** (`#6ee7a1` on `rgba(46,213,115,0.12)`): "uploaded".
- **Warning Amber** (`#ffd166`): "ready" / "uploading".
- "scheduled" uses Signal Red / Blush; "failed" uses the red error treatment.

### Named Rules
**The Signal Rule.** Red is signal, not paint. It marks the one live/primary thing on a screen and the focused field — nowhere else. If a screen has more than one red element competing for the eye, you've overspent.

**The Status-Is-More-Than-Hue Rule.** Upload status (uploaded / failed / scheduled / ready) must always carry a text label, never color alone — color-blind producers read the word, not the green.

## 3. Typography

**Display Font:** Bebas Neue (with Impact, sans-serif fallback)
**Body Font:** Schibsted Grotesk (with system-ui, sans-serif fallback)
**Label/Mono Font:** ui-monospace / SFMono-Regular / Menlo for raw values (IDs, code)

**Character:** A high-contrast pairing — tall, tight, all-caps condensed display against calm, characterful Schibsted Grotesk. The contrast axis (condensed grotesque vs. humanist sans) is the point; the two never blur together. Display shouts the section; Schibsted does the talking.

### Hierarchy
- **Display** (400, `clamp(2.25rem, 4vw, 3.25rem)`, line-height 0.95, uppercase, tracking -0.01em): Page titles only. `text-wrap: balance` recommended.
- **Metric** (400, `clamp(2.25rem, 2.85rem)`, line-height 0.9): Big dashboard stat numbers. Same Bebas voice as Display, used for quantities.
- **Body** (400, 0.95–1.05rem, line-height 1.6, Ink/Muted): All readable prose and field values. Cap measure at 65–75ch (page-sub already caps ~44rem).
- **Label** (700, 0.7rem, tracking 0.22em, uppercase, Faint): Card headers, stat labels, badges. The system's connective tissue.

### Named Rules
**The Two-Voice Rule.** Bebas for titles and numbers; Schibsted Grotesk for everything else. Never set body copy in Bebas, never set a page title in the body face.

**The Caps-Are-Labels Rule.** All-caps + wide tracking is reserved for small labels (≤0.8rem) and the display headings. Never use tracked uppercase for a sentence the user has to read.

## 4. Elevation

Flat by default. Surfaces are translucent white panels over true black, lifted not by drop shadows but by a 1px **inset top highlight** (`inset 0 1px 0 rgba(255,255,255,0.04)`) that reads like light catching a top edge. Real depth comes from a diffuse **red glow** — an ambient blurred radial behind the page and a focused glow on the primary button — so "elevation" in this system is about *energy*, not stacked paper.

### Shadow Vocabulary
- **Inset edge-light** (`box-shadow: inset 0 1px 0 rgba(255,255,255,0.04)`): On cards and stats. The default "lift".
- **Signal glow** (`box-shadow: 0 0 24px rgba(237,7,44,0.4)`, → `0 0 34px rgba(237,7,44,0.6)` on hover): Primary button only. The one element allowed to emit light.
- **Glass float** (`box-shadow: 0 12px 40px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)`): The floating nav pill (with `backdrop-filter: blur(18px)`).

### Named Rules
**The No-Drop-Shadow Rule.** Surfaces don't cast dark shadows onto black — it does nothing. Depth is the inset highlight plus red glow. If you reach for `0 4px 12px rgba(0,0,0,…)` on a card, delete it.

**The Glass-Is-The-Nav Rule.** Backdrop-blur glass is a deliberate signature for exactly one element — the floating nav pill. It is forbidden as a default card/panel treatment.

## 5. Components

Controls are refined and restrained: hairline borders, crisp red focus, a small deliberate hover lift, nothing bouncy.

### Buttons
- **Shape:** Full pill (`9999px`).
- **Primary:** `#ed072c → #b30420` gradient, white text, signal glow; hover lifts `translateY(-1px)`, brightens, glow intensifies. Disabled → `opacity 0.65; cursor: wait`. Padding `0.7rem 1.4rem` (sm variant `0.45rem 0.95rem`).
- **Ghost:** Translucent white fill (`#ffffff06`), hairline border; hover shifts border to red tint (`rgba(237,7,44,0.55)`) with a faint red wash.
- **Danger:** Transparent with a blush border + blush text; hover fills faint red.

### Cards / Containers
- **Corner Style:** `1.25rem` (card).
- **Background:** Translucent white `#ffffff06`, hairline `#ffffff14` border.
- **Shadow Strategy:** Inset edge-light only (see Elevation). No drop shadow.
- **Internal Padding:** `1.75rem`. Card header is a Label (0.7rem, tracked, Faint).
- **Never nest a card inside a card.** Use the `panel` radius (`0.85rem`) sub-block for grouped fields instead.

### Inputs / Fields
- **Style:** `0.75rem` radius, dark fill (`rgba(0,0,0,0.35)`), hairline border, white text. Placeholder at `rgba(255,255,255,0.35)`.
- **Focus:** Red border (`rgba(237,7,44,0.7)`) + a 4px red focus ring (`0 0 0 4px rgba(237,7,44,0.14)`) + slightly darker fill. This is the one consistent red moment per screen.
- **Native popups themed dark:** `color-scheme: dark` + `accent-color: #ed072c` on date/range/color inputs so calendar/picker chrome matches.

### Badges (status)
- **Style:** Pill, 0.7rem uppercase tracked (0.14em) Label, 700 weight, 1px transparent border, translucent fill.
- **States:** `draft` (faint white), `ready`/`uploading` (amber), `scheduled` (red/blush, red border), `uploaded` (green, green border), `failed` (red error). Always paired with the status word.

### Navigation
- **Style:** A single floating glass pill, fixed top-center, blurred backdrop, glass-float shadow. Links are pill-shaped, Muted by default → Ink on hover with a faint white wash; **active** link gets a red-tinted fill (`rgba(237,7,44,0.16)`). Logo wordmark in Bebas with the brand red on one span.

### Signature: Ambient Page Glow
Two large blurred red radials (`blur(170px)`, opacity ~0.1–0.18) fixed behind every app screen — the "one red light" of the After-Hours Studio. Dialed low so it never fights data-dense content. The eyebrow dot pulses red as the only ambient motion.

## 6. Do's and Don'ts

### Do:
- **Do** keep red on a tight budget — one live/primary element + the focused field per screen (The Signal Rule).
- **Do** set titles and big numbers in Bebas Neue, everything readable in Inter (The Two-Voice Rule).
- **Do** convey depth with the inset top-highlight and red glow; keep surfaces flat (The No-Drop-Shadow Rule).
- **Do** pair every status with its word, and verify status colors aren't hue-only (color-blind producers).
- **Do** keep body/muted text at `#ffffff99` or lighter-toward-ink; check ≥4.5:1 on the black field before going dimmer.
- **Do** give dense screens space and one primary action — density should read as control.

### Don't:
- **Don't** build the **cluttered, busy dashboard** PRODUCT.md rejects — no wall of equal panels, no competing accents.
- **Don't** spend red as decoration (multiple glowing buttons, red borders everywhere). Rarity is the point.
- **Don't** nest cards, or add `border-left`/`border-right` colored side-stripes as accents — use full hairline borders or a tinted panel.
- **Don't** use `background-clip: text` gradient text. The primary button's gradient *fill* is fine; gradient *text* is banned.
- **Don't** use glassmorphism as a default surface — it's reserved for the nav pill only.
- **Don't** set body copy in tracked uppercase or in Bebas; caps are for small labels only.
- **Don't** drop dark drop-shadows onto the black canvas — they do nothing but muddy it.
