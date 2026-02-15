# Mobile Guardrails

Use this before deploys to keep the app mobile-safe while iterating on styling/features.

## One-command check
- `npm run check:mobile`

This command:
1. Builds the app.
2. Starts local preview on `http://127.0.0.1:4173`.
3. Runs Playwright mobile tests on iPhone 13, Pixel 7, and iPad Mini profiles.

## What is validated
- No horizontal overflow on login route.
- Core controls meet minimum touch target height (44px).
- Input/font sizing is mobile-friendly (>= 16px).
- Hero artwork renders correctly.

## When to run
- After major CSS/theme changes.
- After editing layout, forms, nav, or cards.
- Before production deploy.

## Optional: run against another URL
Set `E2E_BASE_URL`:
- `E2E_BASE_URL=https://kmg-wedding-weekend.vercel.app npm run test:mobile`
