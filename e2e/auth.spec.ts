import { expect, test } from '@playwright/test'

import type { Locator } from '@playwright/test'

/**
 * Fills a field and makes sure the value survives.
 *
 * Playwright can type before React has hydrated, and hydration then resets the
 * input, leaving an empty form that native `required` silently blocks. Retrying
 * until the value sticks expresses the real requirement without hard-coding a
 * wait on a framework-specific hydration signal.
 */
async function fill(field: Locator, value: string) {
  await expect(async () => {
    await field.fill(value)
    await expect(field).toHaveValue(value, { timeout: 500 })
  }).toPass({ timeout: 30_000 })
}

/**
 * Clicks until the expected outcome appears.
 *
 * The same race applies to buttons: a click that lands before React has
 * attached its handler does nothing at all, silently. Retrying states what the
 * click is for instead of hard-coding a wait on a hydration signal.
 */
async function clickUntil(button: Locator, outcome: Locator) {
  await expect(async () => {
    await button.click()
    await expect(outcome).toBeVisible({ timeout: 2000 })
  }).toPass({ timeout: 30_000 })
}

/** Unique per run, so the suite never collides with an existing account. */
function newAccount() {
  const id = Math.random().toString(36).slice(2, 10)
  return {
    name: 'Camille Durand',
    email: `e2e-${id}@hose.local`,
    password: 'hose-e2e-password',
  }
}

test('a signed-out visitor cannot reach the account page', async ({ page }) => {
  const response = await page.goto('/mon-compte')

  // Redirected to sign-in, carrying where they were headed.
  await expect(page).toHaveURL(/\/connexion\?redirect=%2Fmon-compte/)
  expect(response?.status()).toBeLessThan(400)

  // And nothing from the account page leaked into the response.
  await expect(page.getByText('Mes problématiques')).toHaveCount(0)
})

test('a signed-out visitor cannot reach a board', async ({ page }) => {
  await page.goto('/tableau/00000000-0000-0000-0000-000000000000')
  await expect(page).toHaveURL(/\/connexion/)
})

test('sign up, land on the account page, sign out', async ({ page }) => {
  const account = newAccount()

  await page.goto('/inscription')
  await fill(page.getByLabel('Prénom et nom'), account.name)
  await fill(page.getByLabel('Adresse e-mail'), account.email)
  await fill(page.getByLabel('Mot de passe', { exact: true }), account.password)
  await fill(page.getByLabel('Confirme le mot de passe'), account.password)
  await clickUntil(
    page.getByRole('button', { name: 'Créer mon compte' }),
    page.getByRole('heading', { name: 'Mon compte' }),
  )

  await expect(page).toHaveURL(/\/mon-compte/)
  await expect(page.getByText(account.email)).toBeVisible()

  // A brand-new account has no history yet.
  await expect(page.getByText('Rien pour le moment.')).toBeVisible()

  await clickUntil(
    page.getByRole('button', { name: 'Déconnexion' }),
    // Scoped to the header: the signed-out home page also links to sign-in.
    page.getByRole('banner').getByRole('link', { name: 'Connexion' }),
  )
})

test('the password confirmation has to match', async ({ page }) => {
  const account = newAccount()

  await page.goto('/inscription')
  await fill(page.getByLabel('Prénom et nom'), account.name)
  await fill(page.getByLabel('Adresse e-mail'), account.email)
  await fill(page.getByLabel('Mot de passe', { exact: true }), account.password)
  await fill(page.getByLabel('Confirme le mot de passe'), 'autre-chose')
  await clickUntil(
    page.getByRole('button', { name: 'Créer mon compte' }),
    page.getByText('Les deux mots de passe ne correspondent pas.'),
  )
  await expect(page).toHaveURL(/\/inscription/)
})

test('a wrong password is refused', async ({ page }) => {
  // Creates the account it then fails to sign into, so the test depends on no
  // seed data and behaves the same on a fresh CI database as on a laptop.
  const account = newAccount()

  await page.goto('/inscription')
  await fill(page.getByLabel('Prénom et nom'), account.name)
  await fill(page.getByLabel('Adresse e-mail'), account.email)
  await fill(page.getByLabel('Mot de passe', { exact: true }), account.password)
  await fill(page.getByLabel('Confirme le mot de passe'), account.password)
  await clickUntil(
    page.getByRole('button', { name: 'Créer mon compte' }),
    page.getByRole('heading', { name: 'Mon compte' }),
  )
  await clickUntil(
    page.getByRole('button', { name: 'Déconnexion' }),
    // Scoped to the header: the signed-out home page also links to sign-in.
    page.getByRole('banner').getByRole('link', { name: 'Connexion' }),
  )

  await page.goto('/connexion')
  await fill(page.getByLabel('Adresse e-mail'), account.email)
  await fill(page.getByLabel('Mot de passe'), 'definitely-wrong')
  await clickUntil(
    page.getByRole('button', { name: 'Se connecter' }),
    page.getByText('Adresse e-mail ou mot de passe incorrect.'),
  )
})

test('a run URL survives the sign-in detour with its problem intact', async ({
  page,
}) => {
  // What the home page produces when a signed-out visitor submits. Asserted by
  // navigation rather than by clicking, so the check is about the guard rather
  // than about whether a click beat hydration.
  await page.goto('/reflexion?probleme=Je+teste+le+parcours&mode=auto')

  await expect(page).toHaveURL(/\/connexion\?redirect=/)

  const redirect = new URL(page.url()).searchParams.get('redirect') ?? ''
  expect(redirect).toContain('/reflexion')

  // URLSearchParams, not decodeURIComponent: the query is form-encoded, so
  // spaces are '+' and only a real parser turns them back into spaces.
  const carried = new URLSearchParams(redirect.split('?')[1] ?? '')
  expect(carried.get('probleme')).toBe('Je teste le parcours')
  expect(carried.get('mode')).toBe('auto')
})

test('the home page puts the problem input in front of the visitor', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.getByLabel('Ta problématique')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Démarrer' })).toBeVisible()
})

test('an unknown page shows the not-found state', async ({ page }) => {
  await page.goto('/cette-page-nexiste-pas')
  await expect(
    page.getByRole('heading', { name: 'Page introuvable' }),
  ).toBeVisible()
})
