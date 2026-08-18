import { defineConfig, devices } from '@playwright/test'

const PORT = 3100
const BASE_URL = `http://localhost:${PORT}`

/**
 * End-to-end coverage of the paths that must never break: signing up, the
 * server-side guard, and the account page.
 *
 * Deliberately does not exercise the five-whys engine. That would spend real
 * Anthropic tokens on every CI run and make the suite depend on model latency,
 * so the engine is covered by unit tests against a fake client instead.
 */
export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  // Generous on purpose. Several tests perform three interactions that each
  // retry until React has hydrated, so the per-test budget has to exceed the
  // sum of those retries rather than one of them.
  timeout: 120_000,
  reporter: process.env.CI ? 'line' : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npm run dev -- --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      // Better Auth rejects requests whose origin does not match its baseURL,
      // and the suite runs on its own port so it never fights a dev server.
      BETTER_AUTH_URL: BASE_URL,
    },
  },
})
