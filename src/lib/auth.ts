import { betterAuth } from 'better-auth'
import { tanstackStartCookies } from 'better-auth/tanstack-start'

import { env } from '#/env'

// TODO(phase 3): attach the Drizzle adapter once the auth tables exist in
// src/db/schema.ts. Without it Better Auth has no persistence and sign-ups
// are lost on restart.
export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
  },
  plugins: [tanstackStartCookies()],
})
