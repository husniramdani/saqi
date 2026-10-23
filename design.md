---
version: '1.0'
name: 'Saqi Nightfield'
description: "Warm paper and ink for a UAE farm irrigation cockpit, with one orange for tonight's action and a sand-to-teal water scale where darker always means wetter. Geist and Geist Mono, IBM Plex Sans Arabic for Arabic (RTL). Graphite Night theme by default, Day theme on request."

# Day theme. Night overrides every colour below under x-stylebase.themes.night (same names).
colors:
  primary: '#16201B'
  primary-foreground: '#F3F1EB'
  secondary: '#EEEBE3'
  secondary-foreground: '#16201B'
  accent: '#E8762D'
  accent-foreground: '#1A120B'
  accent-text: '#A04709'
  accent-soft: '#FBE7D8'
  background: '#F3F1EB'
  surface: '#FFFFFF'
  surface-raised: '#F7F5F0'
  surface-well: '#EEEBE3'
  border: '#E4E0D6'
  border-strong: '#CFC9BB'
  text-primary: '#16201B'
  text-secondary: '#4D5852'
  text-muted: '#5C665F'
  success: '#2A6F4D'
  success-soft: '#E1EFE6'
  warning: '#A04709'
  warning-soft: '#FBE7D8'
  error: '#A63D2F'
  error-soft: '#F6DEDA'
  info: '#225E73'
  focus: '#A04709'
  inverse: '#16201B'
  inverse-surface: '#1E2923'
  inverse-text: '#F3F1EB'
  inverse-text-secondary: '#BAC3BD'
  inverse-accent: '#F5A262'
  water-0: '#EFE6D2'
  water-1: '#DCE3CC'
  water-2: '#BBD6C4'
  water-3: '#8DC1B7'
  water-4: '#5EA3A3'
  water-5: '#3B8090'
  water-6: '#225E73'
  stale: '#E8762D'
  map: '#FBFAF7'
  map-grid: '#16201B0F'
  pipe: '#CFC9BB'
  tag: '#16201B'
  tag-text: '#FFFFFF'
  block-edge: '#FFFFFF'
  utility: '#FFFFFF'
  utility-stroke: '#B9B2A3'
  rib: '#16201B24'
  tree: '#16201B29'
  overlay: '#FFFFFFF5'

typography:
  headline:
    family: 'Geist'
    weight: 300
    use: 'Display and section headlines: light, tight tracking (-0.03 to -0.05em)'
  body:
    family: 'Geist'
    weight: 400
    use: 'Words: labels (500), panel titles (600), body, table cells, reasons'
  mono:
    family: 'Geist Mono'
    weight: 400
    use: 'Numbers only: every measured figure, time, ID like D-1; tabular, unit set small beside it'
  scale:
    - { label: '2xs', size: '11.5px', lineHeight: '14px' }
    - { label: 'xs', size: '12.5px', lineHeight: '16px' }
    - { label: 'sm', size: '13px', lineHeight: '18px' }
    - { label: 'base', size: '14.5px', lineHeight: '21px' }
    - { label: 'md', size: '15.5px', lineHeight: '22px' }
    - { label: 'lg', size: '17px', lineHeight: '26px' }
    - { label: 'xl', size: '20px', lineHeight: '29px' }
    - { label: '2xl', size: '28px', lineHeight: '30px' }
    - { label: '3xl', size: '44px', lineHeight: '44px' }
    - { label: '4xl', size: '64px', lineHeight: '64px' }
    - { label: 'display', size: '120px', lineHeight: '108px' }

spacing:
  base: 4
  scale: [0, 4, 8, 12, 16, 24, 32, 48, 80]
  unit: 'px'

rounded:
  none: '0px'
  sm: '6px'
  md: '12px'
  lg: '20px'
  xl: '32px'
  full: '9999px'

components:
  button:
    variants:
      - { name: 'accent', background: '#E8762D', text: '#1A120B', radius: '9999px', weight: 500 }
      - { name: 'ink', background: '#16201B', text: '#F3F1EB', radius: '9999px', weight: 500 }
      - {
          name: 'ghost',
          background: 'transparent',
          text: '#16201B',
          border: '#CFC9BB',
          radius: '9999px',
          weight: 500,
        }
    sizes:
      - { name: 'icon', height: '44px', padding: '0', fontSize: '15px' }
      - { name: 'md', height: '50px', padding: '4px 4px 4px 20px', fontSize: '15px' }
      - { name: 'field', height: '56px', padding: '0 24px', fontSize: '17px' }
  input:
    background: '#FFFFFF'
    border: '#CFC9BB'
    radius: '12px'
    height: '44px'
    focusRing: '#A04709'
    placeholder: '#5C665F'
  card:
    background: '#FFFFFF'
    border: '#E4E0D6'
    radius: '20px'
    padding: '20px'
    shadow: '0 1px 2px rgba(22,32,27,.06), 0 8px 24px -12px rgba(22,32,27,.18)'

x-stylebase:
  version: '1.1.0'
  template: 'saqi-nightfield'
  generated-by: 'hand-authored from the Nightfield canvas (claude.ai design, Oct 2026)'
  themes:
    night:
      colors:
        primary: '#F2F1EE'
        primary-foreground: '#111214'
        secondary: '#26282C'
        secondary-foreground: '#F2F1EE'
        accent: '#F08A3E'
        accent-foreground: '#1A1206'
        accent-text: '#F5A262'
        accent-soft: '#F08A3E24'
        background: '#111214'
        surface: '#18191C'
        surface-raised: '#1F2124'
        surface-well: '#26282C'
        border: '#2B2D31'
        border-strong: '#3A3D42'
        text-primary: '#F2F1EE'
        text-secondary: '#B9BBBF'
        text-muted: '#9A9DA2'
        success: '#7CC59A'
        success-soft: '#7CC59A1F'
        warning: '#F5A262'
        warning-soft: '#F08A3E24'
        error: '#F2958A'
        error-soft: '#F2958A1F'
        info: '#9AD1C4'
        focus: '#F08A3E'
        inverse: '#F2F1EE'
        inverse-surface: '#E4E2DD'
        inverse-text: '#111214'
        inverse-text-secondary: '#4A4C50'
        inverse-accent: '#A04709'
        water-0: '#2A2D2B'
        water-1: '#2E4440'
        water-2: '#2F5E57'
        water-3: '#34776E'
        water-4: '#3F9286'
        water-5: '#5FB0A2'
        water-6: '#9AD1C4'
        stale: '#F08A3E'
        map: '#141517'
        map-grid: '#FFFFFF0D'
        pipe: '#44474C'
        tag: '#0E0F10'
        tag-text: '#F2F1EE'
        block-edge: '#141517'
        utility: '#1F2124'
        utility-stroke: '#55585E'
        rib: '#00000047'
        tree: '#00000047'
        overlay: '#18191CF5'
      elevation:
        raised: '0 1px 2px rgba(0,0,0,.3), 0 10px 30px -12px rgba(0,0,0,.6)'
        floating: '0 24px 48px -24px rgba(0,0,0,.7)'
  elevation:
    flat: 'none'
    raised: '0 1px 2px rgba(22,32,27,.06), 0 8px 24px -12px rgba(22,32,27,.18)'
    floating: '0 24px 48px -24px rgba(22,32,27,.5)'
  fonts:
    arabic: 'IBM Plex Sans Arabic'
    google: 'https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600&family=Geist+Mono:wght@400;500&family=IBM+Plex+Sans+Arabic:wght@400;500;600&display=swap'
  motion:
    library: 'gsap@3.13'
    durations: { tick: 0.12, step: 0.24, settle: 0.48, drift: 0.9, tide: 1.6 }
    eases: { standard: 'power2.out', reveal: 'expo.out', emphasized: 'power3.inOut', water: 'none' }
    stagger: { list: 0.04, reasons: 0.06 }
  ai-rules:
    always:
      - 'Read design.md before writing any UI code; use only its tokens, by name, so Day and Night both work'
      - 'Set every measured figure in Geist Mono with tabular numbers, its unit set smaller in text-muted beside it (m³, mm, %, °C)'
      - "Use orange (accent) only for tonight: the irrigation action, tonight's flows and bars, the selected block; one orange focus per view"
      - 'Set orange words and numbers in accent-text, never in the accent fill'
      - 'Use water-0..water-6 only for plant-available water; darker always means wetter; step = min(6, floor(PAW / 100 × 7))'
      - 'Put labels on water fills on ink map tags, never directly on the fill'
      - 'Pair every status colour with a word or a pattern: Stale plus hatching, Skip plus a green chip'
      - 'Separate panels by lightness and the raised shadow; borders are hairlines'
      - 'Use CSS logical properties and IBM Plex Sans Arabic for Arabic; Western digits in every locale'
      - 'Design loading, empty, stale-sensor and error states for every data panel'
      - 'Run all motion through GSAP with x-stylebase.motion tokens inside gsap.matchMedia(); reduced motion jumps to the end state'
      - 'Give every interactive element a visible 2px focus ring in the focus colour, offset 2px; targets at least 44px (56px on Field)'
    never:
      - 'Never use gradient surfaces, glassmorphism, purple or indigo, or a shadow outside the three elevation steps'
      - 'Never use emoji, or put an icon on every line or every heading'
      - 'Never use orange for decoration, or more than one orange focus in a view'
      - 'Never use red/yellow/green traffic lights for moisture; use the sequential water scale'
      - 'Never set text a user must read below 12.5px or in uppercase micro-caps'
      - 'Never use Inter, Roboto or system-ui as the visible typeface; words are Geist, numbers are Geist Mono'
      - 'Never animate layout properties (width, height, top, left) with CSS transitions; use GSAP transforms'
      - 'Never show a figure without its unit or a time without GST'
      - "Never open a screen with a row of four generic stat cards or a 'Welcome back' greeting"
---

# Saqi Nightfield

_Read the soil._ Version 1.1, from the Nightfield canvas (Day and Night). This file replaces "Saqi Sand"; the old file is archived at `../design-archive/saqi-sand.design.md`.

## Design philosophy

Saqi is opened by a farm manager at 21:30 to decide tonight's irrigation, and by a field worker at 06:00 in direct sun. It should read at a glance: warm paper, ink text, generous real numbers, and one orange that always means _tonight_. Clear before clever.

Three rules, unchanged from the canvas:

1. **Orange means tonight**: an action, a flow, a focus. Never decoration.
2. **Every figure is mono**, with its unit set small beside it.
3. **If it moves, water or state moved.** Reduced motion jumps to the end.

## Colour

- **Surfaces** (Day): page `background` #F3F1EB, `surface` #FFFFFF for panels, `surface-raised` #F7F5F0 for inset and selected areas, `surface-well` #EEEBE3 for tracks and segmented wells. Elevation comes from lightness plus the soft `raised` shadow, not from outlines.
- **Ink** (`text-primary` #16201B, 14.8 : 1) for text and figures; `text-secondary` #4D5852 (6.6 : 1) for body; `text-muted` #5C665F (5.3 : 1) for labels and units.
- **Orange**: `accent` #E8762D is a fill only (bars, pipes, the primary pill), with `accent-foreground` #1A120B on it. Orange words and numbers use `accent-text` #A04709 (5.5 : 1).
- **Status**: `success` #2A6F4D for skip, live and saved; `warning` (orange text on `warning-soft`) for tight and stale; `error` #A63D2F for failures. Status always comes with a word.
- **Water** `water-0` → `water-6`: plant-available water from dry sand to deep teal, ordered by lightness so it reads in greyscale. Seven equal steps: `step = min(6, floor(PAW / 100 × 7))`, so 0–14 % is `water-0` and 86–100 % is `water-6`. Mid-tone fills carry meaning, never words: block labels sit on ink `tag`s.
- **Stale** sensors: `stale` hatching (`rib` lines at 45°) plus the word "Stale".
- **Night** (graphite #111214) re-maps every name; components never branch on theme.

Added for the code (not drawn on the canvas): `error`/`error-soft`, Night `inverse-*`, Night `floating` shadow, and `focus`. Day `focus` is `accent-text` because the fill orange is under 3 : 1 against the page.

## Typography

- **Geist** for words, **Geist Mono** for numbers only (`font-variant-numeric: tabular-nums`). **IBM Plex Sans Arabic** is first in the stack for `:lang(ar)`.
- Display 300, tracking −0.05em; section headlines 300 at −0.03em; panel titles 600 at 15.5 px; labels 500 at 12.5–13 px, sentence case; app body 14.5 px, landing body 17 px / 1.55.
- Figures: value in mono `text-primary`, unit at 0.42em in `text-muted`, lifted to the cap line.
- Western digits in all locales (`ar-AE-u-nu-latn`).

## Space, shape, depth

- 4 px base: 4, 8, 12, 16, 24, 32, 48, 80.
- Radius nests 32 (section) → 20 (panel) → 12 (row) → 6 (bar), and pills.
- Three elevations: **flat** (border only, tables and wells), **raised** (panels, cards, tiles), **floating** (map overlays, toasts).

## Components

- **Pill button**: 50 px; text plus a 42 px circular arrow. `accent` (one per view, the primary action), `ink` (secondary), `ghost`. Text link: ink with a hairline underline, 44 px target.
- **Chip**: 26 px; `Irrigate` and `Deficit` solid orange, `Skip` success-soft, `Pulse` outline, `Tight` and `Check sensor` warning-soft.
- **Source dot**: live (success), simulated (dashed orange ring), offline/stale (orange), always with a word.
- **Figure**: mono value plus small unit.
- **Time track**: 26 px well with an hourly tick every 1/7, orange bars from the inline start.
- **Budget meter**: 12 px well, orange fill, a tick at 97 %.
- **Segmented control**: pill well; the selected segment is ink.
- **Toggle** (40 × 24) and **orbit button** (44 px round, orange).
- **Decision row**: block code in mono, name, window, chip and volume; selected = `surface-raised` plus a 3 px orange inline-start edge.
- **Map tag**: ink tag with white mono code; the selected block's tag is orange.
- **Panel** (card): `surface`, hairline `border`, 20 px radius, 20 px padding, `raised` shadow.

## Readability rules

1. Contrast: primary text ≥ 7 : 1, secondary ≥ 4.5 : 1, large figures ≥ 3 : 1.
2. Minimum sizes: app body 14.5 px, labels 12.5 px, map text ≥ 12 px after scaling.
3. Never text on data colour; labels on water fills sit on ink tags.
4. Elevation, not outlines; no textures in dense app views.
5. One accent per view.
6. Colour is never alone.

## Motion

GSAP 3.13 only; transforms, opacity and SVG stroke; everything inside `gsap.matchMedia()`.

| Token  | Seconds | Ease                        | Use                       |
| ------ | ------- | --------------------------- | ------------------------- |
| tick   | 0.12    | power2.out (`standard`)     | focus, tiny state changes |
| step   | 0.24    | power2.out                  | hover, press, tooltips    |
| settle | 0.48    | expo.out (`reveal`)         | panels, sheets, counters  |
| drift  | 0.9     | expo.out                    | reveals, schedule bars    |
| tide   | 1.6     | power3.inOut (`emphasized`) | the map drawing itself    |

Water flow along pipes uses the `water` ease (linear). Staggers: list 0.04 s, reasons 0.06 s.

## What this system is not

Not a neon "command centre", not glassy, not gradient, not a grid of KPI cards, not traffic lights, not an AI chat product. Night is graphite and calm, not dark for drama. If a screen could belong to any startup, it is wrong.
