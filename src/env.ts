import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

/**
 * Environment contract for Hose.
 *
 * Anything the app genuinely cannot run without is required here, so a missing
 * variable fails at boot with a named error instead of surfacing later as a
 * connection timeout or an empty AI response.
 */
export const env = createEnv({
  server: {
    /** Postgres connection string (Neon). */
    DATABASE_URL: z.string().url(),

    /** Signing secret for Better Auth sessions. */
    BETTER_AUTH_SECRET: z.string().min(32),

    /** Public origin the auth callbacks resolve against. */
    BETTER_AUTH_URL: z.string().url(),

    /**
     * Anthropic credential for the five-whys engine.
     *
     * Deliberately NOT called ANTHROPIC_API_KEY. Netlify's Vite plugin claims
     * that name for its AI Gateway and writes a short-lived, site-scoped JWT
     * into process.env when it loads, overwriting whatever .env.local set. We
     * call Anthropic directly, so the credential gets a name Netlify does not
     * touch. The shape is still checked at point of use in src/lib/ai/client.ts.
     */
    HOSE_ANTHROPIC_API_KEY: z.string().min(1).optional(),

    /**
     * Resend credentials for the contact form. Optional: without them the form
     * refuses cleanly rather than pretending to have sent something.
     */
    RESEND_API_KEY: z.string().min(1).optional(),
    CONTACT_FROM: z.string().email().optional(),
    CONTACT_TO: z.string().email().optional(),
  },

  /**
   * The prefix that client-side variables must have. This is enforced both at
   * a type-level and at runtime.
   */
  clientPrefix: 'VITE_',

  client: {
    VITE_APP_TITLE: z.string().min(1).optional(),
  },

  /**
   * Server variables live in `process.env`; client variables are inlined by
   * Vite into `import.meta.env`. Merging both keeps one contract for the whole
   * app, and the `typeof` guard stops the client bundle touching `process`.
   */
  runtimeEnv: {
    ...(typeof process !== 'undefined' ? process.env : {}),
    ...(import.meta.env as Record<string, string | undefined> | undefined),
  },

  /**
   * Treat `FOO=` in a .env file as absent rather than as an empty string, so
   * defaults apply and required variables actually fail.
   */
  emptyStringAsUndefined: true,
})
