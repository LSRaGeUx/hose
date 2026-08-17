import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'

import { auth } from './auth.ts'

export type SessionUser = {
  id: string
  name: string
  email: string
  image: string | null
}

/**
 * Reads the session from the request cookies on the server.
 *
 * Route guards call this in `beforeLoad`, so an unauthenticated request is
 * redirected before the route's loader ever runs. The 2024 app decided this in
 * the browser from `sessionStorage`, which meant the server trusted whatever
 * the client claimed and every backend route was effectively public.
 */
export const fetchSession = createServerFn({ method: 'GET' }).handler(
  async (): Promise<SessionUser | null> => {
    const session = await auth.api.getSession({
      headers: getRequest().headers,
    })

    if (!session?.user) return null

    return {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image ?? null,
    }
  },
)
