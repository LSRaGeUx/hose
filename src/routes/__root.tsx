import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'
import { SiteHeader } from '#/components/site-header'
import { RouteError, RouteNotFound } from '#/components/error-states'
import { fetchAiStatus } from '#/lib/ai/server'
import { fetchSession } from '#/lib/session'

import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'
import type { SessionUser } from '#/lib/session'

/** Whether the five-whys engine can run, and why not when it cannot. */
export interface AiStatus {
  enabled: boolean
  message: string | null
}

interface MyRouterContext {
  queryClient: QueryClient
  user: SessionUser | null
  ai: AiStatus
}

/**
 * The engine's availability is deployment configuration: it cannot change
 * between two navigations, so it is probed once and the promise reused.
 *
 * A failed probe is not cached, and resolves to "enabled" rather than
 * propagating. Being unable to answer the question must not be able to take
 * the whole app down, and assuming enabled degrades to exactly the old
 * behaviour: the run is attempted, and the failure is reported when it comes.
 */
let probe: Promise<AiStatus> | undefined

function aiStatus(): Promise<AiStatus> {
  probe ??= fetchAiStatus().catch(() => {
    probe = undefined
    return { enabled: true, message: null }
  })
  return probe
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  // Resolved on the server once per navigation, then handed to every child
  // route's beforeLoad. Guards therefore never trust the client.
  beforeLoad: async () => {
    const [user, ai] = await Promise.all([fetchSession(), aiStatus()])
    return { user, ai }
  },
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Hose — challenge ta problématique' },
      {
        name: 'description',
        content:
          'Précise ton idée avec la méthode des 5 pourquoi et repars avec trois verbes d’action.',
      },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  shellComponent: RootDocument,
  component: RootComponent,
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
})

function RootComponent() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <HeadContent />
      </head>
      <body className="bg-background text-foreground antialiased">
        {children}
        <TanStackDevtools
          config={{ position: 'bottom-right' }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
            TanStackQueryDevtools,
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
