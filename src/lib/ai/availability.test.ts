import { describe, expect, it } from 'vitest'

import {
  credentialState,
  disabledMessage,
  isDisabledMessage,
} from './availability.ts'

describe('credentialState', () => {
  it('reports a missing credential', () => {
    expect(credentialState(undefined)).toBe('missing')
    expect(credentialState('')).toBe('missing')
  })

  it('accepts a direct Anthropic key', () => {
    expect(credentialState('sk-ant-test-key')).toBe('ok')
  })

  it('singles out the token Netlify injects', () => {
    // Three dot-separated segments, no sk-ant- prefix: the shape of the
    // site-scoped JWT Netlify's Vite plugin writes into process.env.
    expect(credentialState('eyJhbGciOi.eyJpc3MiOiJuZXRsaWZ5In0.c2ln')).toBe(
      'gateway-token',
    )
  })

  it('rejects anything else', () => {
    expect(credentialState('not-a-key')).toBe('malformed')
  })
})

describe('disabledMessage', () => {
  it('does not claim a key is absent when one is configured', () => {
    expect(disabledMessage('missing')).toMatch(/aucune clé/)
    expect(disabledMessage('gateway-token')).toMatch(/n’est pas utilisable/)
    expect(disabledMessage('malformed')).toMatch(/n’est pas utilisable/)
  })

  it('says the rest of the app still works', () => {
    for (const state of ['missing', 'gateway-token', 'malformed'] as const) {
      expect(disabledMessage(state)).toMatch(/Le reste de l’app fonctionne/)
    }
  })
})

describe('isDisabledMessage', () => {
  // The class does not survive the server-function boundary, so the client
  // recognises these by value. That only holds while the check is exact.
  it('recognises every message this module produces', () => {
    for (const state of ['missing', 'gateway-token', 'malformed'] as const) {
      expect(isDisabledMessage(disabledMessage(state))).toBe(true)
    }
  })

  it('does not claim unrelated failures as its own', () => {
    expect(isDisabledMessage('Authentification requise.')).toBe(false)
    expect(isDisabledMessage('')).toBe(false)
    expect(
      isDisabledMessage('L’assistant est désactivé sur cette instance :'),
    ).toBe(false)
  })
})
