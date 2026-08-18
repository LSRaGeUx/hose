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
import { fetchSession } from '#/lib/session'

import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'
import type { SessionUser } from '#/lib/session'

interface MyRouterContext {
  queryClient: QueryClient
  user: SessionUser | null
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  // Resolved on the server once per navigation, then handed to every child
  // route's beforeLoad. Guards therefore never trust the client.
  beforeLoad: async () => ({ user: await fetchSession() }),
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
