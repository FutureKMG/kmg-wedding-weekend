# Custom Script Font Workflow (SVG -> FontForge -> TTF)

This project includes a repeatable FontForge build pipeline for `Pinellas Brush`.

## 1) Prepare SVG Glyphs

Author one SVG per character in `assets/font-src/svg/`.

Rules:
- Convert all strokes to paths before export.
- Keep contours closed and remove overlaps/self-intersections.
- Align metrics consistently on a `1000` UPM grid:
  - Baseline: `y=0`
  - x-height: `~460`
  - Cap height: `~700`
  - Ascender: `~730`
  - Descender: `~-270`
- Keep sidebearings loose in SVG; spacing is finalized in FontForge.

Naming:
- `uni0041.svg` (`A`)
- `uni0061.svg` (`a`)
- `uni0030.svg` (`0`)

Mapping source:
- `assets/font-src/glyph-map.csv`

## 2) Import + Unicode Mapping in FontForge

Two options are supported:

1. Scripted import (recommended for repeatability)
- `npm run font:build`
- Reads `assets/font-src/glyph-map.csv`
- Imports matching SVGs from `assets/font-src/svg/`
- Cleans outlines and applies default widths
- Saves source to `assets/font-src/PinellasBrush-Regular.sfd`
- Generates `public/fonts/PinellasBrush-Regular.ttf`

2. Manual GUI touch-up (hybrid workflow)
- Open `assets/font-src/PinellasBrush-Regular.sfd` in FontForge.
- Tune sidebearings/joins in Metrics view.
- Validate glyphs (`Element -> Validate`).
- Save SFD.
- Re-run `npm run font:build` to regenerate TTF/WOFF2.

## 3) Repeatable Build Commands

Prerequisite: install FontForge locally.

- Build font outputs:
  - `npm run font:build`
- Build with explicit version label suffix:
  - `FONT_VERSION=0.2.0 npm run font:build`

Generated files:
- `public/fonts/PinellasBrush-Regular.ttf`
- `public/fonts/PinellasBrush-Regular-v<version>.ttf`
- `public/fonts/PinellasBrush-Regular.woff2` (when supported by local FontForge build)

## 4) Kerning + Spacing Guidance

Starter kerning list is stored in:
- `assets/font-src/kerning-pairs.csv`

Initial priority pairs include:
- `ra ri ro rv rw ry`
- `la li ll lt ly`
- `ta te to tr tt ty`
- `fa fe fo ff`
- `Va Wa Ya To Ta`

Spacing proof strings:
- `assets/font-src/proofing-strings.txt`

Recommended spacing order:
1. Set base rhythm using `n` and `o`.
2. Tune lowercase group around `n o a e`.
3. Tune uppercase around `H O N`.
4. Apply kerning only to true outliers after sidebearing pass.

## 5) CSS Usage

### Current app (Vite/React)
`src/index.css` includes:

```css
@font-face {
  font-family: 'Pinellas Brush';
  src:
    url('/fonts/PinellasBrush-Regular.woff2') format('woff2'),
    url('/fonts/PinellasBrush-Regular.ttf') format('truetype');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

.script-brand {
  font-family: 'Pinellas Brush', 'Brush Script MT', cursive;
}
```

### Next.js snippet

```css
@font-face {
  font-family: 'Pinellas Brush';
  src:
    url('/fonts/PinellasBrush-Regular.woff2') format('woff2'),
    url('/fonts/PinellasBrush-Regular.ttf') format('truetype');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

.script-brand {
  font-family: 'Pinellas Brush', 'Brush Script MT', cursive;
}
```

If using the App Router, import your global CSS in `app/layout.tsx`.
