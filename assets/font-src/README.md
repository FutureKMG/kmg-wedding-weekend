# Pinellas Brush Source Assets

This directory is the source of truth for the custom script font build.

## Structure
- `svg/`: one SVG outline file per glyph (paths only, no live strokes).
- `glyph-map.csv`: maps each SVG filename to Unicode and glyph name.
- `kerning-pairs.csv`: starter kerning list to apply in scripted build.
- `proofing-strings.txt`: strings to use in FontForge metrics window.
- `PinellasBrush-Regular.sfd`: saved FontForge source file (created by build script if missing).

## SVG Requirements
- UPM target: `1000`.
- Baseline at `y=0`.
- x-height around `460`.
- Cap height around `700`.
- Ascender around `730`.
- Descender around `-270`.
- Export plain SVG paths with closed contours.

## Naming
Use Unicode-style filenames, for example:
- `uni0041.svg` for `A`
- `uni0061.svg` for `a`
- `uni0030.svg` for `0`

The build script reads `glyph-map.csv` and imports matching SVG files from `svg/`.
