/**
 * Whether the five-whys engine can run at all.
 *
 * Deliberately imports nothing. The browser bundle reads the message from here
 * and the engine reads the state from here, so neither has to pull in `env` or
 * the Anthropic SDK to find out. Same discipline as `frame.ts`.
 */

export type CredentialState = 'ok' | 'missing' | 'gateway-token' | 'malformed'

/**
 * Classifies the configured credential without calling anything.
 *
 * `gateway-token` is its own case because Netlify's Vite plugin injects a
 * short-lived, site-scoped JWT that looks like a credential and fails
 * authentication for a reason nothing in the response explains.
 */
export function credentialState(
  credential: string | undefined,
): CredentialState {
  if (!credential) return 'missing'
  if (credential.startsWith('sk-ant-')) return 'ok'
  return credential.split('.').length === 3 ? 'gateway-token' : 'malformed'
}

const MISSING =
  'L’assistant est désactivé sur cette instance : aucune clé Claude n’est configurée. Le reste de l’app fonctionne, mais aucune question ne peut être générée.'

const UNUSABLE =
  'L’assistant est désactivé sur cette instance : la clé Claude configurée n’est pas utilisable. Le reste de l’app fonctionne, mais aucune question ne peut être générée.'

/**
 * What the person is told, in French. Two sentences rather than one, because
 * "no key" and "bad key" are different problems for whoever runs the instance
 * and saying "aucune clé" when there is one would be a lie.
 */
export function disabledMessage(state: Exclude<CredentialState, 'ok'>): string {
  return state === 'missing' ? MISSING : UNUSABLE
}

/**
 * True for a message this module produced.
 *
 * The engine's server functions reject with `disabledMessage(...)`, and only
 * the message survives the server-function boundary: the class and its name do
 * not. Comparing against the exact strings keeps that check honest, where
 * sniffing for a substring would eventually match something else.
 */
export function isDisabledMessage(message: string): boolean {
  return message === MISSING || message === UNUSABLE
}
