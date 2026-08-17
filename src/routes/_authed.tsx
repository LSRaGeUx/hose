import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

/**
 * Pathless layout guarding everything nested under it.
 *
 * The check runs in `beforeLoad` on the server using the session resolved from
 * the request cookies, so a signed-out visitor is redirected before any loader
 * runs and before any markup is produced.
 */
export const Route = createFileRoute('/_authed')({
  beforeLoad: ({ context, location }) => {
    if (!context.user) {
      throw redirect({
        to: '/connexion',
        search: { redirect: location.href },
      })
    }
    // Narrow the type for every child route: below this point, user is set.
    return { user: context.user }
  },
  component: () => <Outlet />,
})
