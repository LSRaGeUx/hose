import type { FullConfig } from '@playwright/test'

/**
 * Warms every route the suite touches before any test runs.
 *
 * The suite runs against the dev server, so the first request to a route makes
 * Vite optimize its dependencies and reload the page. Mid-test that reload
 * wipes typed input and detaches handlers, which surfaces as tests failing on
 * a cold machine (CI) while passing on a warm one. Paying that cost up front
 * makes the runs identical.
 */
const ROUTES = ['/', '/connexion', '/inscription', '/contact', '/mon-compte']

export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use.baseURL
  if (!baseURL) throw new Error('baseURL is not configured')

  for (const route of ROUTES) {
    // Twice: the first response may itself be the pre-optimization one.
    for (let i = 0; i < 2; i++) {
      await fetch(new URL(route, baseURL), { redirect: 'follow' }).catch(
        () => undefined,
      )
    }
  }
}
