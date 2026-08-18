import { beforeEach, describe, expect, it, vi } from 'vitest'

// The engine must never import env; the client legitimately does, so it is
// stubbed here rather than requiring a populated .env in CI.
const env = vi.hoisted(() => ({
  ANTHROPIC_API_KEY: undefined as string | undefined,
}))
vi.mock('#/env', () => ({ env }))

const { MissingCredentialError, getAnthropic } = await import('./client.ts')

beforeEach(() => {
  vi.resetModules()
  env.ANTHROPIC_API_KEY = undefined
})

describe('getAnthropic', () => {
  it('explains what to do when no credential is set', () => {
    expect(() => getAnthropic()).toThrow(MissingCredentialError)
    expect(() => getAnthropic()).toThrow(/\.env\.local/)
  })

  it('names Netlify explicitly when handed a gateway JWT', () => {
    // Shape of the token Netlify's Vite plugin injects: three dot-separated
    // segments, no sk-ant- prefix. Sent to api.anthropic.com it fails auth in
    // a way that looks like anything but the real cause.
    env.ANTHROPIC_API_KEY = 'eyJhbGciOi.eyJpc3MiOiJuZXRsaWZ5LWFwaSI.c2ln'

    expect(() => getAnthropic()).toThrow(MissingCredentialError)
    expect(() => getAnthropic()).toThrow(/Netlify AI Gateway/)
  })

  it('rejects anything else that is not an Anthropic key', () => {
    env.ANTHROPIC_API_KEY = 'not-a-key'
    expect(() => getAnthropic()).toThrow(/sk-ant-/)
  })

  it('accepts a direct key', () => {
    env.ANTHROPIC_API_KEY = 'sk-ant-test-key'
    expect(() => getAnthropic()).not.toThrow()
  })
})
