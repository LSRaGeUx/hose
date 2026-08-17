import { Link, useNavigate, useRouteContext } from '@tanstack/react-router'

import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar'
import { Button } from '#/components/ui/button'
import { authClient } from '#/lib/auth-client'

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  return parts
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('')
}

export function SiteHeader() {
  const { user } = useRouteContext({ from: '__root__' })
  const navigate = useNavigate()

  async function signOut() {
    await authClient.signOut()
    // Re-run beforeLoad so the server drops the session it resolved earlier.
    await navigate({ to: '/', reloadDocument: true })
  }

  return (
    <header className="border-border/60 border-b">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
        <Link to="/" className="text-lg font-semibold tracking-tight">
          Hose
        </Link>

        <nav className="flex items-center gap-2">
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/mon-compte">Mon compte</Link>
              </Button>
              <Avatar className="size-8">
                {user.image ? <AvatarImage src={user.image} alt="" /> : null}
                <AvatarFallback className="text-xs">
                  {initials(user.name)}
                </AvatarFallback>
              </Avatar>
              <Button variant="outline" size="sm" onClick={signOut}>
                Se déconnecter
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/connexion">Se connecter</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/inscription">Créer un compte</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
