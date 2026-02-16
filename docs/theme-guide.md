# Theme Guide

## Design intent
The UI follows a **balanced art deco watercolor** direction:
- Soft watercolor atmosphere in page backgrounds
- Crisp deco geometry for structure, hierarchy, and wayfinding
- High readability first for forms and navigation

## Palette mapping
Raw tokens (`src/styles/theme.css`):
- `--plum: #8a336f`
- `--lavender: #d2b7d2`
- `--blush: #eaaddc`
- `--sea-glass: #a2c8e7`
- `--sage: #a3d9c5`
- `--teal: #3d7486`
- `--champagne: #d8c794`

Semantic tokens:
- `--bg-canvas`, `--bg-surface`, `--bg-surface-strong`
- `--text-primary`, `--text-secondary`, `--text-muted`
- `--accent-primary`, `--accent-secondary`, `--accent-soft`
- `--border-soft`, `--border-strong`, `--focus-ring`
- `--success`, `--error`

Prefer semantic tokens in component CSS; avoid using raw tokens directly in page-level styles.

## Typography
- Display/headings: `--font-display` (`Marcellus`)
- Body/forms: `--font-body` (`Source Sans 3`)
- Scale tokens:
  - `--fs-display`, `--fs-h1`, `--fs-h2`, `--fs-h3`, `--fs-body`, `--fs-label`, `--fs-caption`

## Motion and accessibility
- Motion tokens:
  - `--motion-fast`, `--motion-base`, `--motion-slow`
- Use `.reveal` for subtle entry animations.
- Reduced motion is respected via `prefers-reduced-motion` in `theme.css`.
- Body text contrast targets WCAG AA; never place copy directly on busy image regions without a surface panel.

## Artwork assets
Generated files live in `public/theme`:
- `invite-hero.avif|webp|png`
- `invite-hero-mobile.avif|webp|png`
- `welcome-party-hero.avif|webp|png`
- `welcome-party-hero-mobile.avif|webp|png`
- `home-lounge-hero(.avif|webp|png + mobile variants)`
- `home-lounge-portrait-one(.avif|webp|png + mobile variants)`
- `home-lounge-portrait-two(.avif|webp|png + mobile variants)`
- `deco-divider.svg`

Regenerate from source artwork:
- `npm run theme:assets`
- or `npm run theme:assets -- "/Users/kara/Desktop/Invite Image.heic"`
- `npm run theme:welcome-assets`
- or `npm run theme:welcome-assets -- "/Users/kara/Downloads/IMG_4425_websize.jpg"`
- `npm run theme:home-assets`
- optional overrides:
- `npm run theme:home-assets -- --hero="/path/hero.jpg" --portraitOne="/path/one.jpg" --portraitTwo="/path/two.jpg"`

## Reusable UI primitives
- `HeroImage` for responsive hero artwork with AVIF/WebP/PNG fallback
- `PageIntro` for consistent section headers
- `DecoDivider` for subtle deco separators
- `BaseballStitchDivider` for thin baseball-thread section breaks

## Welcome Party accents
- Welcome Party route styles are localized in `src/index.css` under `.welcome-*` selectors.
- Phillies palette accents used there:
  - `#E81828` (red highlights)
  - `#F8F4ED` (ticket cream)
  - `#2B2B2B` (charcoal text)
  - `#C6A75E` (soft gold details)
- Keep these accents scoped to Welcome Party UI so the global wedding theme remains cohesive.

## Home mood direction
- Home page styling now blends:
  - restored church architecture cues (stained-glass color glows)
  - romantic cigar-lounge warmth (amber wood + brick tones)
  - clear, user-friendly utility cards (weather + rides + feed actions)
- Home-specific selectors are scoped under `.home-*` and `.home-cigar-*`.

## Do / Don’t
Do:
- Keep key actions on high-contrast surfaces.
- Use the same semantic token roles across pages.
- Keep decorative effects subtle so content remains primary.

Do not:
- Introduce dark mode tokens without a full contrast pass.
- Add heavy animation loops.
- Apply large hero images as full-page backgrounds on every route.
