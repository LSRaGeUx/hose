import Anthropic from '@anthropic-ai/sdk'

import { env } from '#/env'
import { credentialState } from './availability.ts'

export { MODEL } from './model.ts'

/**
 * The single place an Anthropic client is constructed.
 *
 * Keeping it here means switching to a proxy (Netlify's AI Gateway, say) is a
 * change to this file rather than to every call site.
 */

export class MissingCredentialError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MissingCredentialError'
  }
}

/**
 * Developer-facing explanations, in English, for each way the credential can
 * be unusable. The user-facing French equivalents live in `availability.ts`;
 * both read the same `credentialState`, so the UI and the engine can never
 * disagree about whether the key works.
 *
 * These checks live at the point of use rather than in the env schema. A bad
 * credential must break the five-whys engine, never sign-in or the homepage.
 */
const EXPLANATION = {
  missing:
    'HOSE_ANTHROPIC_API_KEY is not set. Copy .env.example to .env.local and add your key.',
  'gateway-token':
    'HOSE_ANTHROPIC_API_KEY holds a Netlify AI Gateway token, not an Anthropic key. ' +
    'Netlify injects this automatically. Set your own sk-ant- key to call Anthropic directly.',
  malformed:
    'HOSE_ANTHROPIC_API_KEY does not look like an Anthropic key (expected an sk-ant- prefix).',
} as const

let client: Anthropic | undefined

export function getAnthropic(): Anthropic {
  const credential = env.HOSE_ANTHROPIC_API_KEY
  const state = credentialState(credential)
  if (state !== 'ok') throw new MissingCredentialError(EXPLANATION[state])

  if (client) return client

  // baseURL is pinned rather than inherited. The SDK falls back to
  // ANTHROPIC_BASE_URL from the environment, and Netlify's dev plugin emulates
  // an AI gateway, so an ambient base URL silently redirects our calls to a
  // proxy that rejects our own key with a 401. We call Anthropic directly.
  client = new Anthropic({
    apiKey: credential,
    baseURL: 'https://api.anthropic.com',
  })
  return client
}
