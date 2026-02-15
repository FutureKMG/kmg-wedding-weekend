import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  timeout: 30_000,
  expect: {
    timeout: 6_000,
  },
  reporter: 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'iphone-13',
      use: {
        browserName: 'chromium',
        ...devices['iPhone 13'],
      },
    },
    {
      name: 'pixel-7',
      use: {
        browserName: 'chromium',
        ...devices['Pixel 7'],
      },
    },
    {
      name: 'ipad-mini',
      use: {
        browserName: 'chromium',
        ...devices['iPad Mini'],
      },
    },
  ],
})
