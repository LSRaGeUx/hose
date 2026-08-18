import { Link, useRouteContext } from '@tanstack/react-router'

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

  async function signOut() {
    await authClient.signOut()
    window.location.assign('/')
  }

  return (
    <header className="border-rule bg-background/85 sticky top-0 z-40 border-b backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-5">
        <Link to="/" className="group flex items-baseline gap-2">
          <span className="text-[17px] font-semibold tracking-tight">Hose</span>
          <span className="label-technical group-hover:text-signal hidden transition-colors sm:inline">
            méthode des 5 pourquoi
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          <Button asChild variant="ghost" size="sm" className="label-technical">
            <Link to="/contact">Contact</Link>
          </Button>
          {user ? (
            <>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="label-technical"
              >
                <Link to="/mon-compte">Mon compte</Link>
              </Button>
              <Avatar className="border-rule size-7 rounded-none border">
                {user.image ? <AvatarImage src={user.image} alt="" /> : null}
                <AvatarFallback className="rounded-none font-mono text-[10px]">
                  {initials(user.name)}
                </AvatarFallback>
              </Avatar>
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="label-technical"
              >
                Déconnexion
              </Button>
            </>
          ) : (
            <>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="label-technical"
              >
                <Link to="/connexion">Connexion</Link>
              </Button>
              <Button asChild size="sm" className="label-technical">
                <Link to="/inscription">Créer un compte</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
