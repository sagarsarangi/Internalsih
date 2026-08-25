# DESIGN.md — Landing Page Design System
### Vercel-inspired, dark mode

Engineering-grade minimalism on true dark. Same discipline as Vercel's light system — shadow-as-border, achromatic base, a single accent, three font weights — remapped for a near-black canvas. Nothing here is decorative; every value is either a token or derived from one.

---

## 1. Design Philosophy

Dark mode is not light mode inverted. Contrast ratios, border opacity, and accent saturation all need to be *recalculated*, not flipped. This system follows three rules:

1. **Elevation is lightness, not shadow.** On a black canvas, drop-shadows are nearly invisible. Elevation is instead communicated by surfaces getting *lighter* as they rise off the page (`#0A0A0A` → `#111111` → `#1A1A1A`).
2. **Borders are low-alpha white, not low-alpha black.** `rgba(255,255,255,0.08–0.14)` replaces Vercel's `rgba(0,0,0,0.08)` shadow-as-border technique — same mechanism, inverted alpha channel.
3. **One accent, slightly lightened.** Vercel's `#0072F5` gets muddy against black. The dark accent is lifted to `#3291FF` to hold the same perceived weight at lower ambient brightness.

---

## 2. Color Palette

### Core Surfaces

| Role | Value | Usage |
|---|---|---|
| Background (base) | `#0A0A0A` | Page canvas |
| Background (elevated) | `#111111` | Cards, nav bar surface |
| Background (recessed) | `#1A1A1A` | Inputs, toggle tracks, code blocks |
| Background (hover fill) | `#1F1F1F` | Ghost button / nav item hover |
| Border (default) | `rgba(255,255,255,0.08)` | Shadow-as-border, standard containers |
| Border (strong) | `rgba(255,255,255,0.14)` | Hovered containers, active dividers |

### Text

| Role | Value | Usage |
|---|---|---|
| Text (primary) | `#EDEDED` | Headings, primary content |
| Text (secondary) | `#A1A1A1` | Nav items, body copy, subheads |
| Text (muted) | `#6E6E6E` | Captions, placeholders, disabled |

### Accent

| Role | Value | Usage |
|---|---|---|
| Interactive accent | `#3291FF` | Links, primary CTA, focus ring outer |
| Accent (hover) | `#52A9FF` | Accent element hover state |
| Focus ring gap | `#0A0A0A` | Inner ring — matches page background, not white |

### Status Dots (10px max, indicator use only — never fills)

| Color | Value |
|---|---|
| Green | `#4CC38A` |
| Orange | `#FFA057` |
| Red | `#F1616B` |
| Purple | `#B98CF0` |
| Teal | `#4FDDCB` |

**Rule carried over from Vercel:** status colors never appear as backgrounds or large fills — dot-scale only.

---

## 3. Typography

**Display / body:** Geist Sans (400, 500, 600 only — no 700/bold, ever)
**Mono:** Geist Mono (500) — code, technical labels

| Element | Size | Weight | Line Height | Letter Spacing |
|---|---|---|---|---|
| Hero H1 | 56px | 600 | 1.05 | −2.5px |
| Section H2 | 32px | 600 | 1.25 | −1.28px |
| Eyebrow / label | 13px | 500 | 1.4 | 0.2px (uppercase) |
| Body (large) | 18px | 400 | 1.6 | normal |
| Body (default) | 16px | 400 | 1.6 | normal |
| Nav item | 14px | 400 | 1.0 | normal |
| Button label | 14px | 500 | 1.0 | normal |
| Caption | 12px | 400 | 1.33 | normal |

Negative tracking on display sizes only — never below 18px. This keeps hero copy dense and engineered while body text stays legible on dark backgrounds (tight tracking + low contrast is a readability trap).

---

## 4. Navbar Spec

The navbar is the first trust signal. It must feel fixed, weightless, and precise.

```
┌────────────────────────────────────────────────────────────────┐
│  [Logo]      Product   Docs   Pricing   Changelog     [Log in] [Deploy →] │
│  ← 24px pad                                        24px pad →   │
└────────────────────────────────────────────────────────────────┘
        height: 64px · position: sticky, top: 0 · z-index: 50
```

**Structure — three-zone flex, strictly aligned to a single baseline:**

- **Left zone:** logo mark, fixed width, vertically centered
- **Center-left zone:** nav links, `gap: 32px`, `margin-left: 40px` from logo — never centered in the full viewport, always left-anchored after the logo so it doesn't drift on wide screens
- **Right zone:** `margin-left: auto` — secondary action (ghost, "Log in") + primary action (filled, "Deploy" / CTA), `gap: 12px`

**Rules:**
- Background: `#0A0A0Aee` with `backdrop-filter: blur(8px)` — semi-transparent, not solid, so it reads as floating above content on scroll
- Bottom edge: `box-shadow: 0 1px 0 0 rgba(255,255,255,0.08)` — never a CSS `border-bottom`
- All nav items vertically centered via `align-items: center` on the flex container — **no baseline misalignment between logo, links, and buttons**, they must share one horizontal center line
- Nav link default: `color: #A1A1A1`. Hover: `background: #1F1F1F`, `color: #EDEDED`, radius `6px`, padding `8px 12px`. No transform, no scale — color/background only
- Primary CTA button height: `36px`, matches optical center of 64px bar
- Mobile (< 768px): links collapse behind a hamburger; logo + CTA remain, `padding: 0 16px`

---

## 5. Hero Spec

The hero is the thesis. On dark backgrounds especially, alignment errors are more visible — there's no soft cream tone to hide a half-pixel off-center layout.

```
┌──────────────────────────────────────────────┐
│                                                │
│              [eyebrow label]                  │
│                                                │
│        Hero Headline, Two Lines Max            │
│         Centered, −2.5px tracking              │
│                                                │
│     Supporting copy — one sentence, muted,     │
│         max-width 560px, centered              │
│                                                │
│        [Primary CTA]   [Secondary →]           │
│                                                │
│         (optional) product visual /            │
│          terminal / dashboard mock             │
│                                                │
└──────────────────────────────────────────────┘
```

**Alignment rules — this is where most AI-built heroes fail:**

- Hero container: `max-width: 1200px`, `margin: 0 auto`, `padding: 120px 24px 80px`
- **Everything inside the hero is centered on the same vertical axis** — eyebrow, H1, subhead, and button row all share `text-align: center` + `align-items: center` on a `flex-direction: column` container. No element is allowed to be optically centered by eye; use `margin: 0 auto` with an explicit `max-width` per line, not `text-align` alone on wide blocks
- H1 max-width: `760px` — prevents the headline from stretching edge-to-edge and breaking the tight tracking's rhythm
- Subhead max-width: `560px` — always narrower than the H1 above it, creating a visual taper toward the CTA
- Vertical rhythm: eyebrow → H1 = `24px`; H1 → subhead = `20px`; subhead → CTA row = `32px`; CTA row → product visual = `64px`
- Button row: `display: flex`, `gap: 12px`, `justify-content: center` — buttons are never full-width on desktop, only on mobile (< 480px)
- If a product visual/mock sits below the fold line: give it a top border via `box-shadow: 0 1px 0 0 rgba(255,255,255,0.08)` and let it bleed to `max-width: 1200px`, not full viewport width, to stay inside the grid the rest of the page uses

**Do not:**
- Left-align hero text while centering the button row (mismatched axes — the single most common hero-alignment bug)
- Let the H1 wrap unpredictably — write copy to break cleanly at 2 lines, or set an explicit `max-width` that forces the break point
- Use a gradient background behind the hero unless it's the deliberate signature element (see §7)

---

## 6. Components

### Buttons

| State | Primary (filled) | Secondary (ghost) |
|---|---|---|
| Default | `bg: #EDEDED`, `text: #0A0A0A` | `bg: transparent`, `text: #A1A1A1`, border `rgba(255,255,255,0.08)` |
| Hover | `bg: #FFFFFF` | `bg: #1F1F1F`, `text: #EDEDED` |
| Focus | double-ring (see below) | double-ring (see below) |
| Height | `40px` default / `36px` in navbar | same |
| Radius | `6px` | `6px` |

No `transform`, `scale`, or `opacity` transitions on buttons — background-color and color only, same discipline as Vercel light.

### Double-Ring Focus (dark-adapted)

```css
box-shadow: 0 0 0 2px #0A0A0A, 0 0 0 4px #3291FF;
```
Inner ring matches page background (not white, since white would clash with a dark canvas) — outer ring is the accent. Same 2px gap / 4px indicator logic as the source system.

### Cards / Elevated Surfaces

```css
background: #111111;
box-shadow: 0 0 0 1px rgba(255,255,255,0.08),
            0 8px 24px -8px rgba(0,0,0,0.5);
border-radius: 12px;
```
Real drop-shadow layers are darker/blacker here (not `#0000000a` — needs to be closer to `rgba(0,0,0,0.5)` to register at all against a black page).

### Inputs

`background: #1A1A1A`, no visible border by default, `box-shadow: 0 0 0 1px rgba(255,255,255,0.08)`. Focus: `outline: 1px solid #3291FF`, shadow border removed. Placeholder: `#6E6E6E`.

---

## 7. Layout & Spacing

Same 4px base scale as source system — unchanged, spacing logic isn't a light/dark concern:

`4 · 8 · 12 · 16 · 24 · 32 · 40 · 48 · 64 · 96 · 128`

- Page max-width: `1200px`, centered, `24px` horizontal padding
- Section vertical padding: `96px` desktop / `56px` mobile
- No `<hr>` or border dividers between sections — separate with spacing and a subtle surface shift (`#0A0A0A` → `#111111` band) instead

---

## 8. Do's and Don'ts

**Do:**
- Use `box-shadow: 0 0 0 1px rgba(255,255,255,0.08)` for every container edge — never CSS `border`
- Cap font weight at 600 — no bold anywhere
- Keep the accent to one color (`#3291FF`) — resist adding a second "energy" color for dark mode; restraint is the point
- Align hero content on a single centered axis, verified by explicit `max-width` values, not eyeballing
- Let elevation come from surface lightness (`#0A0A0A → #111111 → #1A1A1A`), not shadow depth alone

**Don't:**
- Don't reuse Vercel's light-mode shadow alpha values (`rgba(0,0,0,0.08)`) directly — they're invisible on black; invert to white-alpha
- Don't use pure `#000000` as the base background — `#0A0A0A` avoids the "OLED void" look and keeps elevated surfaces distinguishable
- Don't saturate the accent further for "pop" — `#3291FF` is already calibrated for dark contrast; going brighter reads neon, not engineered
- Don't mix text-alignment axes in the hero (see §5)
- Don't add a second accent hue; status dots stay indicator-scale only

---

## 9. Agent Quick Reference

```
Background base:      #0A0A0A
Background elevated:  #111111
Background recessed:  #1A1A1A
Border:                rgba(255,255,255,0.08)
Text primary:          #EDEDED
Text secondary:        #A1A1A1
Text muted:             #6E6E6E
Accent:                 #3291FF
Focus ring:             0 0 0 2px #0A0A0A, 0 0 0 4px #3291FF
Font:                   Geist Sans (400/500/600), Geist Mono (500)
Radius:                 6px default · 12px cards · 9999px pills
Spacing base:           4px multiples
Page width:             1200px
Navbar height:          64px, sticky, blur(8px) backdrop
Hero padding:            120px 24px 80px
Hero H1 max-width:       760px
Hero subhead max-width:  560px
```
