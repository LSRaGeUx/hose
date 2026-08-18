import Anthropic from '@anthropic-ai/sdk'

import { env } from '#/env'

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
 * Netlify's Vite plugin injects its own ANTHROPIC_API_KEY: a short-lived,
 * site-scoped JWT for their AI Gateway, not an `sk-ant-` key. Sent to
 * api.anthropic.com it fails authentication in a way that looks like anything
 * but the real cause, so it is named explicitly here.
 *
 * This check lives at the point of use rather than in the env schema. A bad
 * credential must break the five-whys engine, never sign-in or the homepage.
 */
function assertDirectKey(credential: string): void {
  if (credential.startsWith('sk-ant-')) return

  const looksLikeJwt = credential.split('.').length === 3
  throw new MissingCredentialError(
    looksLikeJwt
      ? 'ANTHROPIC_API_KEY holds a Netlify AI Gateway token, not an Anthropic key. ' +
          'Netlify injects this automatically. Set your own sk-ant- key to call Anthropic directly.'
      : 'ANTHROPIC_API_KEY does not look like an Anthropic key (expected an sk-ant- prefix).',
  )
}

let client: Anthropic | undefined

export function getAnthropic(): Anthropic {
  if (client) return client

  const credential = env.ANTHROPIC_API_KEY
  if (!credential) {
    throw new MissingCredentialError(
      'ANTHROPIC_API_KEY is not set. Copy .env.example to .env.local and add your key.',
    )
  }
  assertDirectKey(credential)

  client = new Anthropic({ apiKey: credential })
  return client
}
