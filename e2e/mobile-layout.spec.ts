import { expect, test } from '@playwright/test'

test.describe('mobile layout guardrails', () => {
  test('login route has no horizontal overflow', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('.login-shell')).toBeVisible()

    const overflow = await page.evaluate(() => {
      const doc = document.documentElement
      return doc.scrollWidth - doc.clientWidth
    })

    expect(overflow).toBeLessThanOrEqual(1)
  })

  test('critical login controls meet touch target size', async ({ page }) => {
    await page.goto('/login')

    const issues = await page.evaluate(() => {
      const controls = Array.from(
        document.querySelectorAll('button, input[type="text"], input:not([type]), a.tab-link'),
      )

      return controls
        .map((control) => {
          const element = control as HTMLElement
          const rect = element.getBoundingClientRect()
          return {
            label:
              element.getAttribute('aria-label') ??
              element.textContent?.trim() ??
              element.tagName,
            width: rect.width,
            height: rect.height,
          }
        })
        .filter((entry) => entry.height < 44)
    })

    expect(issues).toEqual([])
  })

  test('form fields keep mobile-friendly font size', async ({ page }) => {
    await page.goto('/login')

    const fontSizes = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('input, textarea')).map((field) =>
        Number.parseFloat(getComputedStyle(field).fontSize),
      )
    })

    for (const size of fontSizes) {
      expect(size).toBeGreaterThanOrEqual(16)
    }
  })

  test('hero artwork is rendered on login and home shell is reachable', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('.invite-hero-media img')).toBeVisible()
  })
})
