import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import { getContext } from './integrations/tanstack-query/root-provider'

export function getRouter() {
  const context = getContext()

  const router = createTanStackRouter({
    routeTree,
    // `user` and `ai` are initial values only. The root route's beforeLoad
    // replaces both on every navigation: the session from the request cookies,
    // and whether this instance has a usable Claude key. `ai` starts enabled so
    // that a router built before the first probe never renders the app as
    // disabled by accident.
    context: { ...context, user: null, ai: { enabled: true, message: null } },
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
  })

  setupRouterSsrQueryIntegration({ router, queryClient: context.queryClient })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
